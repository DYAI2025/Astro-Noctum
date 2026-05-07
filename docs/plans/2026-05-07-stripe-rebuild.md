# Stripe Integration Rebuild — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the 17 findings from the 2026-05-07 systematic Stripe audit and lock the integration to a webhook-first state-machine with idempotency, schema/migration parity, fail-closed env-var checks, and unified auth.

**Architecture:** Pivot from "trust the API response" to "webhook is the only source of truth". Every Stripe-side write passes an `idempotencyKey` derived from `userId + operation`. Every webhook event is recorded in a new `stripe_events` table before any side-effect, so replays no-op cleanly. Schema is brought back into parity with migrations. Dead code (`/api/create-checkout-session`, the `STRIPE_BUY_ID` env var, `DashboardLeviSection`) is deleted. Inline auth across Stripe routes is replaced with the `requireUserAuth` middleware from Phase 1 of the backend hardening sprint. Logs are hashed via `redact.mjs`.

**Tech Stack:** Stripe SDK v20.4.0 (already installed, no upgrade in scope), Supabase Postgres + RLS, Express.js, Vitest. The `aiQuota` pattern from Phase 2 of the backend hardening sprint is the template for the new `stripe_events` dedup table.

---

## Findings recap

Numbered to match the audit:

| # | Severity | Issue | Phase |
|---|----------|-------|-------|
| 1 | Critical | Two checkout endpoints, divergent products | A |
| 2 | Critical | No idempotency keys | C |
| 3 | Critical | Schema/migration drift on subscription columns | A |
| 4 | Critical | No webhook event-ID dedup | B |
| 5 | High | Webhook fallback by `stripe_customer_id` missing | B |
| 6 | High | Inline auth instead of middleware | C |
| 7 | High | No server-side conversion analytics | D |
| 8 | High | Customer-creation race | C |
| 9 | Medium | `STRIPE_PRICE_ID` not in `OPTIONAL_ENV_VARS` | A |
| 10 | Medium | Client-supplied `email` accepted | A (resolved by deletion) |
| 11 | Medium | Portal-recovery path can create duplicate customer | C |
| 12 | Medium | Two-table tier drift on `subscription.deleted` | B |
| 13 | Low | No `invoice.status === 'paid'` check | B |
| 14 | Low | Console logs leak user IDs | D |
| 15 | Low | No webhook duration metric | D |
| 16 | Low | API version pin undocumented | D |
| 17 | Low | Mixed source of truth in `subscription.updated` | B |

Phases:
- **A — Pre-flight cleanup** (Tasks 1–4): delete dead code, fix schema parity, fix env-var boot check
- **B — Webhook state machine** (Tasks 5–8): event dedup table, customer-id fallback, two-table sync helper, status guards
- **C — Idempotency + auth** (Tasks 9–11): idempotency keys, `requireUserAuth` migration, customer-list-before-create
- **D — Observability** (Tasks 12–14): server-side analytics, log redaction, duration metric, API-version doc

---

## Phase A — Pre-flight cleanup

### Task 1: Delete `/api/create-checkout-session` and `STRIPE_BUY_ID`

**Findings closed:** #1, #10, partial #9.

**Files:**
- Modify: `server.mjs:1067–1108` (delete the entire endpoint block)
- Modify: `server.mjs:190` (remove `STRIPE_BUY_ID` from `OPTIONAL_ENV_VARS`)
- Modify: `.env.example` (delete `STRIPE_BUY_ID` if present)

**Step 1: Verify no client calls the endpoint**

```bash
grep -rn "create-checkout-session" /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/apps/mobile/src
```

Expected: no matches (confirmed in audit). If any match appears, **stop and ask** — there's a hidden caller we missed.

**Step 2: Delete the endpoint**

Remove `server.mjs` lines 1067–1108 (the entire `app.post('/api/create-checkout-session', requireUserAuth, async (req, res) => { … });` block). Replace with a single comment:

```js
// /api/create-checkout-session was a legacy one-time-payment endpoint
// using STRIPE_BUY_ID. Removed 2026-05-07 — see docs/plans/2026-05-07-stripe-rebuild.md.
// All checkout traffic now goes through /api/checkout (subscription).
```

**Step 3: Remove `STRIPE_BUY_ID` from `OPTIONAL_ENV_VARS`**

Line 190 currently:
```js
const OPTIONAL_ENV_VARS = ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'ELEVENLABS_TOOL_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_BUY_ID', 'SUPERGLUE_API_KEY'];
```

Replace with:
```js
const OPTIONAL_ENV_VARS = ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'ELEVENLABS_TOOL_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID', 'SUPERGLUE_API_KEY'];
```

**Step 4: Sanity check**

```bash
node --check server.mjs
grep -n "STRIPE_BUY_ID" server.mjs           # expected: 0 matches
grep -n "create-checkout-session" server.mjs # expected: 0 matches
npx vitest run server/__tests__/stripe.webhook.test.mjs
```

Expected: 0 matches for both grep, 6/6 webhook regression tests still pass.

**Step 5: Commit**

```bash
git add server.mjs .env.example
git commit -m "$(cat <<'EOF'
fix(stripe): remove dead /api/create-checkout-session + STRIPE_BUY_ID

Audit 2026-05-07 finding #1 + #10. The endpoint was reachable by any
authenticated user but called by no client (web or mobile). It used
STRIPE_BUY_ID for one-time payments while the live /api/checkout uses
STRIPE_PRICE_ID for subscriptions — two parallel products on the same
server with no client distinguishing them.

Also removed STRIPE_BUY_ID from OPTIONAL_ENV_VARS so a misconfigured
deploy doesn't get a misleading boot warning about the wrong variable.

Audit doc: docs/plans/2026-05-07-stripe-rebuild.md

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Fix schema parity for subscription columns

**Finding closed:** #3.

**Files:**
- Modify: `supabase-schema.sql` (add the two columns)
- Verify: `supabase-migrations/20260324_stripe_subscription_columns.sql` already on prod

**Step 1: Inspect current schema state for `profiles.stripe_*`**

```bash
grep -nE "^ADD COLUMN.*stripe|^ADD COLUMN.*subscription" supabase-schema.sql | head -10
```

Expected: only `stripe_payment_id` (line 141). No `stripe_subscription_id`, no `subscription_end`.

**Step 2: Add the missing columns to `supabase-schema.sql`**

Find the existing block that adds `stripe_payment_id` (around line 138–141) and append:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx). Set on checkout.session.completed via webhook.';
COMMENT ON COLUMN profiles.subscription_end IS 'UTC timestamp when current subscription period ends. Set on subscription.updated/deleted/invoice.payment_succeeded. Used to grant access until period end on cancellation.';
```

**Step 3: Verify schema/migration parity**

```bash
diff <(grep -E "stripe_subscription_id|subscription_end" supabase-schema.sql | sort -u) \
     <(grep -E "stripe_subscription_id|subscription_end" supabase-migrations/20260324_stripe_subscription_columns.sql | sort -u)
```

Expected: matching column references in both files. (Don't expect line-by-line diff to be empty — `IF NOT EXISTS` clauses and comments differ — but every column name and type from the migration must appear in the schema.)

**Step 4: Commit**

```bash
git add supabase-schema.sql
git commit -m "$(cat <<'EOF'
fix(db): restore schema/migration parity for Stripe subscription columns

Audit 2026-05-07 finding #3. Migration 20260324_stripe_subscription_columns
adds stripe_subscription_id + subscription_end to profiles, but those
columns were never folded back into supabase-schema.sql. A clean DB
rebuild from the schema would be missing them — the Stripe webhook
silently no-ops because UPDATE ... SET stripe_subscription_id fails with
column-not-found.

No prod migration needed (already deployed). Schema-as-source-of-truth
restored.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Boot-time fail-closed for `STRIPE_PRICE_ID`

**Finding closed:** #9.

`STRIPE_PRICE_ID` is now in `OPTIONAL_ENV_VARS` (Task 1) — boot logs a warning if missing. But "optional" is misleading: the live checkout fails 503 without it. We want the env var documented as required for paid traffic.

**Files:**
- Modify: `.env.example`

**Step 1: Update `.env.example` documentation**

Find the Stripe section in `.env.example` and ensure it explicitly lists `STRIPE_PRICE_ID` with a comment:

```bash
# Stripe — required for subscription billing
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...   # Subscription price ID. Required for /api/checkout to work.
```

If `STRIPE_PRICE_ID` is missing entirely from `.env.example`, add it. If it's present, only add the trailing comment.

**Step 2: Commit**

```bash
git add .env.example
git commit -m "$(cat <<'EOF'
docs(env): document STRIPE_PRICE_ID as required for paid traffic

Audit 2026-05-07 finding #9. The env-var sits in OPTIONAL_ENV_VARS
(boot warning, no abort) which matches its actual semantics — the
server CAN run without it, just /api/checkout returns 503. But
.env.example didn't mark it as needed for prod, so a fresh dev
copy could miss it entirely.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Delete `DashboardLeviSection` (dead from TASK-1.2 inventory)

**Finding closed:** TASK-1.2 inventory C1 (related but adjacent).

**Files:**
- Delete: `src/components/dashboard/DashboardLeviSection.tsx`

**Step 1: Verify zero usages outside the file itself**

```bash
grep -rn "DashboardLeviSection" /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src --include="*.ts" --include="*.tsx" | grep -v "src/components/dashboard/DashboardLeviSection.tsx"
```

Expected: 0 matches.

**Step 2: Delete the file**

```bash
rm src/components/dashboard/DashboardLeviSection.tsx
```

**Step 3: Verify build**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git rm src/components/dashboard/DashboardLeviSection.tsx
git commit -m "$(cat <<'EOF'
chore(dashboard): delete unused DashboardLeviSection

TASK-1.2 inventory finding C1. Component was defined and exported but
never imported anywhere — superseded by AgentSection. Carried its own
duplicate handleLeviUpgrade with no idempotency, no analytics, no
error UI. Easy to delete; harder to leave around for someone to
accidentally import.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B — Webhook state machine

### Task 5: `stripe_events` dedup table + helper

**Finding closed:** #4.

**Files:**
- Create: `supabase-migrations/20260507_stripe_events.sql`
- Modify: `supabase-schema.sql` (mirror the table)
- Create: `server/services/stripeEvents.service.mjs`
- Test: `server/__tests__/stripeEvents.service.test.mjs`

**Step 1: Write the migration**

`supabase-migrations/20260507_stripe_events.sql`:

```sql
-- Stripe webhook event dedup log.
-- Stripe retries webhooks on 5xx. To handle replays cleanly we record
-- every processed event ID and skip side-effects on duplicates.

CREATE TABLE IF NOT EXISTS stripe_events (
  id              TEXT        PRIMARY KEY,           -- Stripe event ID (evt_…)
  type            TEXT        NOT NULL,
  livemode        BOOLEAN     NOT NULL,
  api_version     TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  process_error   TEXT,
  raw_payload     JSONB
);

CREATE INDEX IF NOT EXISTS stripe_events_type_idx ON stripe_events (type);
CREATE INDEX IF NOT EXISTS stripe_events_received_idx ON stripe_events (received_at DESC);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- No client should ever read this table. service_role only.
-- RLS = ON with no policy = nobody can read.
```

**Step 2: Mirror in `supabase-schema.sql`**

Append the same `CREATE TABLE` block to `supabase-schema.sql` so a clean rebuild matches.

**Step 3: Write the service**

`server/services/stripeEvents.service.mjs`:

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
);

/**
 * Try to claim a Stripe event for processing. Returns true if this is
 * the first sighting (caller proceeds), false on duplicate (caller no-ops).
 *
 * Insert with conflict-do-nothing pattern: race-safe at the DB level.
 */
export async function claimStripeEvent(event) {
  const { error } = await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      api_version: event.api_version ?? null,
      raw_payload: event.data?.object ? { id: event.data.object.id, type: event.data.object.object } : null,
    });

  if (!error) return true; // first time
  // 23505 = unique_violation = duplicate, fine
  if (error.code === '23505') return false;
  // Anything else is unexpected — log and PROCESS (fail-open: better to
  // double-process than to skip a real event).
  console.error('[stripeEvents] claim failed (fail-open):', error.message);
  return true;
}

export async function markStripeEventProcessed(eventId, processError = null) {
  const { error } = await supabase
    .from('stripe_events')
    .update({
      processed_at: new Date().toISOString(),
      process_error: processError,
    })
    .eq('id', eventId);
  if (error) {
    console.error('[stripeEvents] mark-processed failed:', error.message);
  }
}
```

**Step 4: Write tests**

`server/__tests__/stripeEvents.service.test.mjs`:

```js
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: (...args) => mockInsert(...args),
      update: (...args) => { mockUpdate(...args); return { eq: (...e) => mockEq(...e) }; },
    }),
  }),
}));

describe('claimStripeEvent', () => {
  let claimStripeEvent;
  beforeEach(async () => {
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    const mod = await import('../services/stripeEvents.service.mjs');
    claimStripeEvent = mod.claimStripeEvent;
  });

  it('STRIPE-EVT-001: returns true on first sighting (insert succeeds)', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const result = await claimStripeEvent({ id: 'evt_1', type: 'x', livemode: false, data: {} });
    expect(result).toBe(true);
  });

  it('STRIPE-EVT-002: returns false on duplicate (23505 unique violation)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate' } });
    const result = await claimStripeEvent({ id: 'evt_1', type: 'x', livemode: false, data: {} });
    expect(result).toBe(false);
  });

  it('STRIPE-EVT-003: fail-open on unexpected DB errors (returns true to process)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '08006', message: 'network' } });
    const result = await claimStripeEvent({ id: 'evt_1', type: 'x', livemode: false, data: {} });
    expect(result).toBe(true);
  });
});
```

**Step 5: Run tests**

```bash
npx vitest run server/__tests__/stripeEvents.service.test.mjs
```

Expected: 3/3 pass.

**Step 6: Commit**

```bash
git add supabase-migrations/20260507_stripe_events.sql \
        supabase-schema.sql \
        server/services/stripeEvents.service.mjs \
        server/__tests__/stripeEvents.service.test.mjs
git commit -m "$(cat <<'EOF'
feat(stripe): event-ID dedup table + claimStripeEvent helper

Audit 2026-05-07 finding #4. Stripe retries webhooks on 5xx, so the
handler must dedupe to avoid double-processing (PII-leaking log
duplication, audit-trail noise, future side-effects).

stripe_events table: PK on event ID, RLS enabled with no policy
(service_role only), no read path for clients.

claimStripeEvent: race-safe insert via 23505 unique-violation check.
Fail-open on unexpected DB errors — better to double-process than
to silently drop a real event.

Migration NOT YET APPLIED to prod. Apply 20260507_stripe_events.sql
via Supabase SQL Editor before Task 7 wires the helper into the
webhook handler.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Webhook fallback by `stripe_customer_id`

**Findings closed:** #5, #12, #17.

When `metadata.userId` is missing (Dashboard manual intervention, refund flow, retention stripped metadata), the webhook currently no-ops. Add a fallback: look up `userId` by `stripe_customer_id` from the `profiles` table.

**Files:**
- Modify: `server.mjs` (the webhook handler at line 5623)
- Test: `server/__tests__/stripe.webhook.test.mjs` (extend)

**Step 1: Add a helper at the top of the webhook handler**

Insert before the `if (event.type === ...)` chain at line 5645:

```js
// Resolve userId either from metadata (new sessions/subs) or by looking
// up the customer (manual Dashboard interventions, retention-stripped
// metadata, refund flows). Returns null only if both fail.
async function resolveUserIdFromEvent(event) {
  const obj = event.data.object;
  // Metadata is canonical
  if (obj.metadata?.userId) return obj.metadata.userId;
  // Subscriptions also carry their own metadata
  if (obj.subscription_data?.metadata?.userId) return obj.subscription_data.metadata.userId;
  // Fallback: look up by customer id
  const customerId =
    typeof obj.customer === 'string' ? obj.customer
      : obj.customer?.id ?? null;
  if (!customerId || !supabaseServer) return null;
  const { data } = await supabaseServer
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.id ?? null;
}
```

Then in each event branch, replace direct `metadata?.userId` reads with `await resolveUserIdFromEvent(event)`. For example, line 5647:

```js
// BEFORE
const userId = session.metadata?.userId;

// AFTER
const userId = await resolveUserIdFromEvent(event);
```

**Step 2: Extract the two-table sync into a single helper**

To address finding #12 (two-table tier drift on subscription.deleted) and #17 (mixed source of truth), add:

```js
async function syncTier(userId, tier, periodEnd, subscriptionId) {
  if (!userId || !supabaseServer) return { ok: false, reason: 'missing-user-or-db' };
  const updates = await Promise.allSettled([
    supabaseServer
      .from('profiles')
      .update({
        tier,
        ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
        ...(periodEnd ? { subscription_end: periodEnd } : {}),
      })
      .eq('id', userId),
    supabaseServer
      .from('astro_profiles')
      .update({ tier })
      .eq('user_id', userId),
  ]);
  return {
    ok: updates.every(r => r.status === 'fulfilled' && !r.value.error),
    profileError: updates[0].status === 'fulfilled' ? updates[0].value.error : updates[0].reason,
    astroError:   updates[1].status === 'fulfilled' ? updates[1].value.error : updates[1].reason,
  };
}
```

Replace each event branch's two-table-update logic with one `await syncTier(userId, tier, periodEnd, subId)` call.

**Step 3: Add `invoice.status === 'paid'` guard** (finding #13)

In the `invoice.payment_succeeded` branch, gate the `subscription_end` update:

```js
if (invoice.billing_reason !== 'subscription_cycle') return res.json({ received: true });
if (invoice.status !== 'paid') return res.json({ received: true });
```

**Step 4: Tests**

Extend `server/__tests__/stripe.webhook.test.mjs` with a static check that the new helpers are referenced:

```js
it('STRIPE-REG-007: resolves userId from metadata OR stripe_customer_id', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('./server.mjs', 'utf8');
  expect(src).toMatch(/resolveUserIdFromEvent/);
  expect(src).toMatch(/stripe_customer_id/);
});

it('STRIPE-REG-008: tier sync goes through a single helper', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('./server.mjs', 'utf8');
  expect(src).toMatch(/syncTier/);
});

it('STRIPE-REG-009: invoice.payment_succeeded gates on invoice.status === paid', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('./server.mjs', 'utf8');
  expect(src).toMatch(/invoice\.status\s*!==\s*['"]paid['"]/);
});
```

**Step 5: Verify**

```bash
node --check server.mjs
npx vitest run server/__tests__/stripe.webhook.test.mjs
```

Expected: 9/9 (was 6, +3 new).

**Step 6: Commit**

```bash
git add server.mjs server/__tests__/stripe.webhook.test.mjs
git commit -m "$(cat <<'EOF'
fix(stripe): webhook resolves userId by metadata OR customer-id; unified tier-sync helper

Audit 2026-05-07 findings #5, #12, #13, #17.

#5 — resolveUserIdFromEvent() falls back to a profiles.stripe_customer_id
lookup when metadata.userId is missing. Catches Dashboard manual
interventions, refund flows, and retention-stripped metadata that
previously made the webhook silent-no-op.

#12 + #17 — syncTier() is the single source of truth for the two-table
update (profiles + astro_profiles). Eliminates the drift where a
subscription.deleted event with missing metadata.userId would update
profiles but skip astro_profiles, leaving astro_profiles.tier stuck at
'premium'.

#13 — invoice.payment_succeeded now requires both billing_reason ===
'subscription_cycle' AND invoice.status === 'paid'. Defensive against
draft/uncollectible invoices that should never extend the period.

3 new regression-guard tests in stripe.webhook.test.mjs.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Wire `claimStripeEvent` into the webhook entry path

**Finding closed:** #4 (full).

**Files:**
- Modify: `server.mjs` (the webhook handler)
- Test: `server/__tests__/stripe.webhook.test.mjs` (extend)

**Step 1: Add the import**

At the top of `server.mjs`:

```js
import { claimStripeEvent, markStripeEventProcessed } from './server/services/stripeEvents.service.mjs';
```

**Step 2: Wrap the event-processing chain**

Right after `event = stripe.webhooks.constructEvent(...)` (line ~5638), before any `if (event.type === ...)`:

```js
const claimed = await claimStripeEvent(event);
if (!claimed) {
  // Stripe retry of an event we already processed — ack to stop further retries.
  return res.json({ received: true, dedup: true });
}
```

At the very end of the handler, after the existing `res.json({ received: true })`, mark processed:

```js
await markStripeEventProcessed(event.id);
res.json({ received: true });
```

(Refactor: extract the inner branches into `try { ... } catch (err) { await markStripeEventProcessed(event.id, err.message); throw; }` if you want failure tracking. Optional for this batch.)

**Step 3: Add a regression test**

```js
it('STRIPE-REG-010: webhook handler claims events via stripeEvents service', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('./server.mjs', 'utf8');
  expect(src).toMatch(/claimStripeEvent\s*\(\s*event\s*\)/);
  expect(src).toMatch(/markStripeEventProcessed/);
});
```

**Step 4: Apply migration to prod** (manual step)

User pastes `supabase-migrations/20260507_stripe_events.sql` into Supabase SQL Editor.

Verify:

```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE table_name = 'stripe_events';
```

Expected: 8 columns (id, type, livemode, api_version, received_at, processed_at, process_error, raw_payload).

**Step 5: Commit**

```bash
git add server.mjs server/__tests__/stripe.webhook.test.mjs
git commit -m "$(cat <<'EOF'
fix(stripe): webhook deduplicates events via stripe_events table

Audit 2026-05-07 finding #4 (resolved).

Every event ID is INSERTed into stripe_events before any side-effect.
Duplicate event IDs hit the unique-violation path and the handler
returns { dedup: true } without re-running tier updates. Stripe stops
retrying on 200, so this also protects against Stripe's exponential
retry storm if our DB layer ever flaps.

Migration 20260507_stripe_events.sql must be applied to prod before
this commit deploys, otherwise claimStripeEvent fails-open and we
lose dedup (but never fail-closed — events are not dropped).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Apply Phase B migration + smoke test

**Finding closed:** #4 verification.

**Files:** none — verification only.

**Step 1: User applies migration**

User opens Supabase Dashboard → SQL Editor → pastes the contents of `supabase-migrations/20260507_stripe_events.sql` → runs.

**Step 2: Verify**

```sql
-- Schema check
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'stripe_events' ORDER BY ordinal_position;
-- Expected: 8 columns

-- RLS check
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'stripe_events';
-- Expected: relrowsecurity = true

-- Policy check
SELECT polname FROM pg_policy WHERE polrelid = 'stripe_events'::regclass;
-- Expected: 0 rows (no policy = nobody can read except service_role)
```

**Step 3: Smoke-test dedup with Stripe CLI** (optional — requires Stripe CLI installed)

```bash
stripe trigger checkout.session.completed
# … check Railway logs for "received: true" first response
stripe events resend evt_…  # the same event ID again
# … check Railway logs for "received: true, dedup: true"
```

If Stripe CLI isn't available, skip — the unit tests cover the logic.

---

## Phase C — Idempotency + auth

### Task 9: Idempotency keys for `stripe.customers.create` and `stripe.checkout.sessions.create`

**Finding closed:** #2.

**Files:**
- Modify: `server.mjs` (`/api/checkout` at line 5459, `/api/customer-portal` at line 5559)

**Step 1: Add idempotency to `/api/checkout`**

The customer-creation block at line 5510:

```js
// BEFORE
const customer = await stripe.customers.create({
  email: userEmail,
  metadata: { userId, platform, appVersion: telemetry.appVersion || '' },
});

// AFTER
const customer = await stripe.customers.create({
  email: userEmail,
  metadata: { userId, platform, appVersion: telemetry.appVersion || '' },
}, {
  idempotencyKey: `customer-create-${userId}`,
});
```

The session-creation block at line 5526:

```js
// BEFORE
const session = await stripe.checkout.sessions.create({ … });

// AFTER (key includes a daily window so a Day-2 retry isn't deduped to a
//        stale Day-1 session)
const today = new Date().toISOString().slice(0, 10);
const session = await stripe.checkout.sessions.create({ … }, {
  idempotencyKey: `checkout-${userId}-${today}`,
});
```

Why the daily window: idempotency keys live 24h on Stripe's side anyway. If we used `checkout-${userId}` alone, a user who started checkout yesterday and clicks again today would get the SAME stale session URL (potentially expired). Daily key matches Stripe's 24h cache and gives users a fresh session each calendar day.

**Step 2: Add idempotency to `/api/customer-portal`**

Line 5587:

```js
// BEFORE
const customer = await stripe.customers.create({ email: ..., metadata: { userId, source: 'portal-recovery' } });

// AFTER
const customer = await stripe.customers.create({
  email: authedUser.email || undefined,
  metadata: { userId: authedUser.id, source: 'portal-recovery' },
}, {
  idempotencyKey: `customer-portal-recovery-${authedUser.id}`,
});
```

`stripe.billingPortal.sessions.create` doesn't need an idempotency key — portal sessions are short-lived and re-creating them is harmless.

**Step 3: Tests**

```js
// server/__tests__/stripe.checkout.test.mjs (new)
it('STRIPE-IDEMP-001: customer creation passes idempotencyKey scoped to userId', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('./server.mjs', 'utf8');
  expect(src).toMatch(/customer-create-\$\{userId\}/);
  expect(src).toMatch(/customer-portal-recovery-\$\{authedUser\.id\}/);
});

it('STRIPE-IDEMP-002: checkout session creation passes day-windowed idempotencyKey', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('./server.mjs', 'utf8');
  expect(src).toMatch(/checkout-\$\{userId\}-\$\{today\}/);
});
```

**Step 4: Run + commit**

```bash
node --check server.mjs
npx vitest run server/__tests__/stripe.checkout.test.mjs

git add server.mjs server/__tests__/stripe.checkout.test.mjs
git commit -m "$(cat <<'EOF'
fix(stripe): idempotency keys on customer/checkout/portal-recovery creation

Audit 2026-05-07 finding #2.

- `customer-create-${userId}` scopes Stripe customer creation per user.
  Rage-clicking Upgrade no longer creates parallel Stripe customers.
- `checkout-${userId}-${today}` scopes session creation per user per day.
  Daily window matches Stripe's 24h idempotency cache so Day-2 retries
  get a fresh session URL.
- `customer-portal-recovery-${userId}` covers the portal recovery path.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Pivot Stripe routes to `requireUserAuth` middleware

**Finding closed:** #6.

**Files:**
- Modify: `server.mjs` (`/api/checkout`, `/api/customer-portal`, `/api/share`)

**Step 1: Pivot `/api/checkout` (line 5459)**

```js
// BEFORE
app.post("/api/checkout", async (req, res) => {
  if (!supabaseServer) return res.status(500).json({ error: "Database not configured" });
  const authedUser = await verifySupabaseUser(req);
  if (!authedUser) return res.status(401).json({ error: "Unauthorized" });
  ...
  const userId = authedUser.id;
  const userEmail = authedUser.email || req.body.userEmail;
  ...
});

// AFTER
app.post("/api/checkout", requireUserAuth, async (req, res) => {
  if (!supabaseServer) return res.status(500).json({ error: "Database not configured" });
  // requireUserAuth populates req.userId. Email comes from a fresh
  // auth lookup so we don't rely on client-supplied userEmail.
  const userId = req.userId;
  const { data: { user } } = await supabaseServer.auth.admin.getUserById(userId);
  const userEmail = user?.email;
  if (!userEmail) return res.status(500).json({ error: "User email missing" });
  ...
});
```

**Step 2: Pivot `/api/customer-portal` (line 5559)**

Same pattern — replace `verifySupabaseUser(req)` with `requireUserAuth` middleware, drop the inline 401, use `req.userId`.

**Step 3: Pivot `/api/share` (line 5818)**

Same pattern.

**Step 4: Verify**

```bash
node --check server.mjs
grep -n "verifySupabaseUser" server.mjs   # any remaining inline call sites worth migrating later
npm run lint
npx vitest run server/__tests__/
```

Expected: 0 errors, all server tests pass. (`verifySupabaseUser` may remain for routes outside the Stripe scope — leave them for a future ticket; the audit was specifically about Stripe.)

**Step 5: Commit**

```bash
git add server.mjs
git commit -m "$(cat <<'EOF'
fix(stripe): unify auth via requireUserAuth middleware on Stripe routes

Audit 2026-05-07 finding #6.

/api/checkout, /api/customer-portal, /api/share now use the
requireUserAuth middleware from server/middleware/auth.mjs (Phase 1
of the backend hardening sprint) instead of the inline
verifySupabaseUser(req). Benefits:

- Same structured envelope as /api/interpret etc.
  ({ error: { code, request_id, recoverable, retry_after } })
  vs the legacy { error: "Unauthorized" } string.
- Email source is now the verified Supabase admin user, not
  client-supplied req.body.userEmail. Closes the receipt-spoofing
  edge case (audit finding #10b).

verifySupabaseUser remains in server.mjs for non-Stripe routes — they
get migrated in a future pass.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: List-before-create on customer recovery

**Finding closed:** #11, partial #8.

**Files:**
- Modify: `server.mjs` (`/api/customer-portal` at line 5587)

**Step 1: Replace the unconditional `customers.create` with list-then-create**

```js
// BEFORE (line 5586-5605)
if (!customerId) {
  const customer = await stripe.customers.create({
    email: authedUser.email || undefined,
    metadata: { userId: authedUser.id, source: 'portal-recovery' },
  });
  customerId = customer.id;
  ...
}

// AFTER
if (!customerId) {
  // Try to recover an existing Stripe customer by email first to avoid
  // creating a duplicate. Stripe customer search by email is exact-match.
  const existing = await stripe.customers.list({
    email: authedUser.email,
    limit: 1,
  });
  if (existing.data.length > 0) {
    customerId = existing.data[0].id;
    console.log(`[Stripe] portal recovery: re-linked existing customer ${customerId}`);
  } else {
    const customer = await stripe.customers.create({
      email: authedUser.email || undefined,
      metadata: { userId: authedUser.id, source: 'portal-recovery' },
    }, {
      idempotencyKey: `customer-portal-recovery-${authedUser.id}`,
    });
    customerId = customer.id;
  }
  ...
}
```

**Step 2: Same pattern in `/api/checkout`** (line 5508)

Wrap the customer-creation in a list-first check.

**Step 3: Tests**

```js
it('STRIPE-RECOVERY-001: customer-portal looks up existing customer by email before creating', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('./server.mjs', 'utf8');
  expect(src).toMatch(/stripe\.customers\.list\(\s*\{[^}]*email/);
  expect(src).toMatch(/portal recovery: re-linked/);
});
```

**Step 4: Commit**

```bash
git add server.mjs server/__tests__/stripe.checkout.test.mjs
git commit -m "$(cat <<'EOF'
fix(stripe): list-then-create on customer recovery to avoid duplicates

Audit 2026-05-07 finding #11, partial #8.

When stripe_customer_id is missing in DB but a Stripe customer for the
user's email already exists (orphan from a prior failed
profiles.update), we'd create a duplicate. Now we list-by-email first;
only create if no existing customer found.

Same fix applied to /api/checkout's customer-creation path.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D — Observability

### Task 12: Server-side analytics on `checkout.session.completed`

**Finding closed:** #7.

**Files:**
- Modify: `server.mjs` (webhook `checkout.session.completed` branch)
- Modify: `server/observability/logger.mjs` (extend with provider='stripe' usage)

**Step 1: Emit a structured log line on each successful checkout**

Inside the `checkout.session.completed` branch, after `syncTier(...)` succeeds:

```js
import { logRequest } from './server/observability/logger.mjs';
import { hashId } from './server/utils/redact.mjs';

logRequest({
  requestId: req.requestId,
  method: 'POST',
  route: '/api/webhook/stripe',
  status: 200,
  latencyMs: Date.now() - startedAt,
  userId,                // logRequest hashes this internally
  errorCode: null,
  provider: 'stripe',
  cacheStatus: null,
  quotaStatus: 'checkout_completed',
});
```

The structured logger from Phase 3 of the backend hardening sprint already hashes `userId`. The line is consumable by Railway's log aggregator and any downstream analytics pipeline.

**Step 2: Add `startedAt = Date.now()` at the top of the handler**

Right after `const sig = req.headers['stripe-signature']`:

```js
const startedAt = Date.now();
```

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "$(cat <<'EOF'
feat(stripe): server-side conversion analytics on checkout.session.completed

Audit 2026-05-07 finding #7.

The client-side trackEvent('upgrade_clicked') only fires from
<UpgradeButton/> — the 4 duplicate handlers from TASK-1.2 inventory
bypass it. And there was NO server-side event on
checkout.session.completed, so we couldn't measure server-truth
conversion.

Now the webhook emits a structured JSON log line via the Phase 3
logger (provider='stripe', quotaStatus='checkout_completed').
user_id_hash is SHA-256 → 12-char hex (no PII). Railway's log
aggregator picks it up; downstream analytics can correlate by
request_id.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Hash user IDs in webhook logs

**Finding closed:** #14.

**Files:**
- Modify: `server.mjs` (the `console.log` calls at 5677, 5723, 5773, 5798)

**Step 1: Replace each `console.log(... ${userId} ...)` with `hashId(userId)`**

Example for line 5677:

```js
// BEFORE
console.log(`[Stripe] User ${userId} upgraded to premium (sub: ${session.subscription})`);

// AFTER
console.log(`[Stripe] User ${hashId(userId)} upgraded to premium (sub: ${session.subscription})`);
```

Repeat for lines 5723, 5773, 5798 (or wherever they are after the prior tasks have moved things around — re-grep before editing).

**Step 2: Subscription IDs are NOT PII** — leave them un-hashed for support debugging.

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "$(cat <<'EOF'
fix(stripe): hash user IDs in webhook logs

Audit 2026-05-07 finding #14.

Five console.log call sites in the webhook handler logged raw user
UUIDs. Now uses hashId() from server/utils/redact.mjs (Phase 3 of the
backend hardening sprint) — SHA-256 → 12-char hex. Subscription IDs
remain un-hashed for support debugging.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: API-version doc

**Finding closed:** #16.

**Files:**
- Modify: `server.mjs` (the `new Stripe(...)` call at line 209)

**Step 1: Add a comment explaining the API version pin**

```js
// BEFORE
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-15' })
  : null;

// AFTER
// Stripe API version pinned to '2024-12-15' deliberately:
// - SDK: stripe@^20.4.0 (matches this API version's typing).
// - Subscription period info still on `subscription.current_period_end`
//   (newer API versions move it to subscription_items[*].current_period_end —
//   which would break the webhook handler's reads at lines ~5687, 5730).
// To upgrade: bump SDK + apiVersion together AND audit every
// `current_period_end` access for the new path. See
// docs/plans/2026-05-07-stripe-rebuild.md.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-15' })
  : null;
```

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "$(cat <<'EOF'
docs(stripe): document API version pin and upgrade prerequisites

Audit 2026-05-07 finding #16. Future-me will know why
apiVersion: '2024-12-15' is sticky and what audit work an upgrade needs.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

After all 14 tasks:

```bash
npx vitest run 2>&1 | tail -5            # full suite green
npm run lint 2>&1 | tail -3              # tsc clean
npx vitest run server/__tests__/stripe.* # all stripe-specific tests
node --check server.mjs                  # syntax OK
```

Expected: full suite passes (count grows by ~10 new tests across phases B–C); tsc clean; syntax check passes.

Manual smoke (optional but recommended before pushing):

```bash
# 1. Server boots
SUPABASE_URL=http://localhost VITE_SUPABASE_URL=http://localhost \
SUPABASE_SERVICE_ROLE_KEY=placeholder VITE_SUPABASE_ANON_KEY=placeholder \
STRIPE_SECRET_KEY=sk_test_… STRIPE_WEBHOOK_SECRET=whsec_… STRIPE_PRICE_ID=price_… \
PORT=3001 node server.mjs &

# 2. /api/checkout returns structured 401 (not legacy string)
curl -s -X POST http://localhost:3001/api/checkout | head -3

# 3. /api/create-checkout-session is gone (404)
curl -s -X POST http://localhost:3001/api/create-checkout-session -H 'Authorization: Bearer x' -w '\nHTTP %{http_code}\n'
```

---

## Done-when checklist

- [ ] Phase A (#1, #3, #9, #10, dead component): `/api/create-checkout-session` deleted, schema parity restored, `STRIPE_PRICE_ID` documented, `DashboardLeviSection` deleted.
- [ ] Phase B (#4, #5, #12, #13, #17): `stripe_events` table + service shipped + applied to prod; webhook claims events, falls back to `stripe_customer_id`, gates on `invoice.status === 'paid'`, uses unified `syncTier()`.
- [ ] Phase C (#2, #6, #8, #11): idempotency keys on customer/checkout/portal-recovery; Stripe routes use `requireUserAuth` middleware; list-before-create on customer recovery.
- [ ] Phase D (#7, #14, #16): server-side conversion analytics line; user IDs hashed in logs; API-version pin documented.
- [ ] Full vitest suite green; tsc clean; server boots; no `STRIPE_BUY_ID` references remain in code.

---

## Out of scope (deliberately deferred)

- **#15 (webhook duration metric):** the structured logger from Task 12 already includes `latency_ms`. If you want a dedicated histogram, that's a Prometheus/StatsD task beyond this sprint.
- **Webhook event-replay UI** (admin tool to manually re-process events from `stripe_events` table). Useful for support but not needed to close the audit findings.
- **Stripe SDK upgrade past v20.4.0.** API version sticky for now (Task 14). Plan a separate sprint when you bump.
- **`verifySupabaseUser` migration on non-Stripe routes** (`/api/contribute`, `/api/contribution/space-weather`, `/api/agent/conversation`, etc.). Those got migrated for ElevenLabs auth in Phase 3 of the backend hardening sprint where applicable; the rest stay on the legacy helper until a unified-auth follow-up sprint.
