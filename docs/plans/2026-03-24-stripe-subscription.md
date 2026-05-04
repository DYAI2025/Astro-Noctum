# Stripe Subscription Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the broken Stripe payment flow so users can subscribe to Premium (4.99 EUR/month) via Stripe Checkout and have their `profiles.tier` updated automatically via webhook.

**Architecture:** Express server handles Stripe Checkout Session creation (subscription mode) and webhook verification. Supabase `profiles` table tracks tier + subscription metadata. `usePremium` hook reads tier via Realtime + visibility re-fetch for instant UI update after Stripe redirect.

**Tech Stack:** Node.js/Express (`server.mjs`), Stripe Node SDK, Supabase (service role), React 19 (`usePremium.ts`)

---

## Context: What Is Broken

| Problem | Location | Impact |
|---------|----------|--------|
| `mode: "payment"` instead of `"subscription"` | `server.mjs:2683` | Checkout creates one-time charge, not subscription |
| Env var name mismatch | Railway: `STRIPE_KEY_SECRET` vs code: `STRIPE_SECRET_KEY` | Stripe not initialized → all endpoints return 503 |
| Missing `STRIPE_PRICE_ID` in Railway | Railway env | Checkout returns 503 "price not configured" |
| Missing `STRIPE_WEBHOOK_SECRET` | Railway env | Webhooks rejected with 503 |
| Webhook missing subscription lifecycle events | `server.mjs:2789-2812` | Subscription upgrades/downgrades/cancellations not reflected |
| `stripe_payment_id` saved on checkout (only valid for one-time) | `server.mjs:2799` | Wrong field; subscription needs `subscription_id` |
| `subscription_end` not tracked | Supabase schema | Cannot enforce "premium until period ends" on cancellation |

## Prerequisites: Manual Steps (Do Before Code)

These require Stripe Dashboard and Railway access — cannot be done via code.

### Step A: Fix Railway Environment Variables

In Railway project settings, under Variables:

1. Rename `STRIPE_KEY_SECRET` → `STRIPE_SECRET_KEY`
   (matches `server.mjs` line: `process.env.STRIPE_SECRET_KEY`)
2. Rename `STRIPE_PUBLIC_KEY` → keep as-is (not used server-side; only needed if using Stripe.js client-side — we use hosted checkout, so this can be left alone)
3. Add `STRIPE_PRICE_ID` = the recurring price ID from Stripe Dashboard (format: `price_1...`)
   Find it: Stripe Dashboard → Products → Bazodiac Premium → Pricing → copy the `price_xxx` ID
4. Add `STRIPE_WEBHOOK_SECRET` = to be filled after Step B

### Step B: Register Webhook in Stripe Dashboard

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://bazodiac.space/api/webhook/stripe`
3. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Save → copy the **Signing secret** (`whsec_...`)
5. Paste into Railway as `STRIPE_WEBHOOK_SECRET`

---

## Task 1: Supabase Migration — Add Subscription Columns

**Files:**
- Create: `supabase-migrations/20260324_stripe_subscription_columns.sql`

### Step 1: Write the migration file

```sql
-- Migration: 2026-03-24 stripe subscription columns
-- Replaces one-time stripe_payment_id with subscription tracking fields

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- stripe_payment_id was for one-time payments; keep for history but
-- new subscription flow uses stripe_subscription_id instead.
-- Do NOT drop stripe_payment_id — existing rows may reference it.

COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx). Set on checkout.session.completed.';
COMMENT ON COLUMN profiles.subscription_end IS 'UTC timestamp when current subscription period ends. Set on subscription.updated/deleted. Used to grant access until period end on cancellation.';
```

### Step 2: Apply the migration in Supabase Dashboard

Navigate to Supabase → SQL Editor → paste the migration → Run.
Expected: "Success. No rows returned."

### Step 3: Verify in Supabase Table Editor

Open `profiles` table → confirm columns `stripe_subscription_id` and `subscription_end` exist.

### Step 4: Commit

```bash
git add supabase-migrations/20260324_stripe_subscription_columns.sql
git commit -m "feat(stripe): add subscription_id and subscription_end columns to profiles"
```

---

## Task 2: Fix Checkout Session — Switch to Subscription Mode

**Files:**
- Modify: `server.mjs:2680-2703`

### Step 1: Read the current checkout block

Lines 2680–2703 in `server.mjs`. Key problem: `mode: "payment"`.

### Step 2: Apply the fix

Change in `server.mjs`:

```js
// BEFORE (line 2683):
    mode: "payment",

// AFTER:
    mode: "subscription",
```

Also update the `metadata` block — for subscriptions, `payment_intent` on the session is null. The subscription ID comes via webhook `checkout.session.completed` → `session.subscription`. The metadata block itself is fine as-is.

Full updated `stripe.checkout.sessions.create` call (replace lines 2680–2699):

```js
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId,
          platform,
        },
      },
      metadata: {
        userId,
        platform,
        appVersion: telemetry.appVersion || "",
        deviceId: telemetry.deviceId || "",
      },
    });
```

`subscription_data.metadata` propagates `userId` to the subscription object itself (not just the session), which makes webhook handling more robust.

### Step 3: Run lint to verify no syntax errors

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npm run lint
```

Expected: 0 errors (or only pre-existing errors unrelated to server.mjs).

### Step 4: Commit

```bash
git add server.mjs
git commit -m "fix(stripe): switch checkout mode from payment to subscription"
```

---

## Task 3: Fix Webhook Handler — Subscription Lifecycle Events

**Files:**
- Modify: `server.mjs:2789-2812`

### Step 1: Read the current webhook handler

Lines 2789–2812. Currently only handles `checkout.session.completed` and `checkout.session.expired`.

### Step 2: Replace the event dispatch section

Replace everything from `if (event.type === "checkout.session.completed")` through `res.json({ received: true })` with:

```js
  // ── Event: checkout completed → subscription created ──────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId && supabaseServer) {
      const { error } = await supabaseServer
        .from("profiles")
        .update({
          tier: "premium",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq("id", userId);
      if (error) console.error("[Stripe] checkout.session.completed profile update failed:", error);
      else console.log(`[Stripe] User ${userId} upgraded to premium (sub: ${session.subscription})`);
    }

  // ── Event: subscription updated (renewal, plan change, cancel scheduled) ─
  } else if (event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    const userId = sub.metadata?.userId;
    if (!userId || !supabaseServer) return res.json({ received: true });

    const isActive = sub.status === "active" || sub.status === "trialing";
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

    const { error } = await supabaseServer
      .from("profiles")
      .update({
        tier: isActive ? "premium" : "free",
        stripe_subscription_id: sub.id,
        subscription_end: periodEnd,
      })
      .eq("stripe_customer_id", sub.customer);

    if (error) console.error("[Stripe] subscription.updated profile update failed:", error);
    else console.log(`[Stripe] Subscription ${sub.id} updated — status=${sub.status}, periodEnd=${periodEnd}`);

  // ── Event: subscription deleted (hard cancel, billing failure after retries) ─
  } else if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    // sub.current_period_end is still set — grant access until that date
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

    const now = new Date();
    const stillInGrace = periodEnd && new Date(periodEnd) > now;

    const { error } = await supabaseServer
      .from("profiles")
      .update({
        tier: stillInGrace ? "premium" : "free",
        subscription_end: periodEnd,
      })
      .eq("stripe_customer_id", sub.customer);

    if (error) console.error("[Stripe] subscription.deleted profile update failed:", error);
    else console.log(`[Stripe] Subscription deleted — grace until ${periodEnd}, tier=${stillInGrace ? "premium" : "free"}`);

  // ── Event: invoice payment succeeded (renewal confirmed) ──────────────
  } else if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    if (invoice.billing_reason === "subscription_cycle" && supabaseServer) {
      const periodEnd = invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null;
      if (periodEnd) {
        const { error } = await supabaseServer
          .from("profiles")
          .update({ tier: "premium", subscription_end: periodEnd })
          .eq("stripe_customer_id", invoice.customer);
        if (error) console.error("[Stripe] invoice.payment_succeeded update failed:", error);
        else console.log(`[Stripe] Renewal confirmed for customer ${invoice.customer}, end=${periodEnd}`);
      }
    }

  // ── Event: invoice payment failed (hard failure) ───────────────────────
  } else if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    console.warn(`[Stripe] Payment failed for customer ${invoice.customer}, invoice ${invoice.id}`);
    // Stripe handles retry logic. We do NOT immediately downgrade — Stripe will fire
    // subscription.updated with status=past_due, then subscription.deleted if all retries fail.

  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    console.log(`[Stripe] Checkout expired for session ${session.id}`);
  }

  res.json({ received: true });
```

### Step 3: Run lint

```bash
npm run lint
```

Expected: 0 new errors.

### Step 4: Commit

```bash
git add server.mjs
git commit -m "feat(stripe): add subscription lifecycle webhook handlers (updated/deleted/invoice)"
```

---

## Task 4: Verify `usePremium` Hook Is Correct

**Files:**
- Read only: `src/hooks/usePremium.ts`

### Step 1: Review current hook

The hook at `src/hooks/usePremium.ts` reads `profiles.tier` and checks `tier === 'premium'`. This is correct — our webhook sets/unsets `tier` to `'premium'`/`'free'`.

The Realtime subscription on `postgres_changes` ensures instant update when the webhook fires. The visibility re-fetch catches the Stripe redirect return. No changes needed.

### Step 2: Confirm no changes needed

Run a quick grep to confirm the field name matches:

```bash
grep -n "tier" src/hooks/usePremium.ts
```

Expected output includes `select('tier')` and `tier === 'premium'` — both correct.

---

## Task 5: Smoke Test Locally

### Step 1: Set local env vars

In your `.env` or `.env.local`, ensure these are set (use test keys for local):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...   (your test price ID for 4.99 EUR/month)
STRIPE_WEBHOOK_SECRET=whsec_...  (from stripe listen output below)
```

### Step 2: Start Stripe webhook forwarding

In a terminal:
```bash
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

Copy the webhook signing secret shown (`whsec_...`) → set as `STRIPE_WEBHOOK_SECRET`.

### Step 3: Start the server

```bash
PORT=3001 node server.mjs
```

Expected: `[Stripe] initialized` log line (not a warning about missing key).

### Step 4: Trigger a test checkout

In another terminal or browser, POST to checkout:
```bash
curl -X POST http://localhost:3001/api/checkout \
  -H "Authorization: Bearer <your-supabase-jwt>" \
  -H "Content-Type: application/json"
```

Expected response: `{"url": "https://checkout.stripe.com/..."}`

### Step 5: Complete checkout with test card

Open the checkout URL → use test card `4242 4242 4242 4242`, any future expiry, any CVC.

Expected:
- Stripe CLI output shows `checkout.session.completed` received → 200
- Supabase `profiles` row updated: `tier = 'premium'`, `stripe_subscription_id = 'sub_...'`
- Browser redirects to `/?upgrade=success`

### Step 6: Test cancellation flow

In Stripe Dashboard (test mode) → Customers → find the test customer → Subscriptions → Cancel at period end.

Expected:
- Stripe fires `customer.subscription.updated` with `cancel_at_period_end: true`
- `subscription_end` gets set in Supabase, tier stays `premium` (until period end)
- After period ends, Stripe fires `customer.subscription.deleted`
- `tier` set to `free` in Supabase

---

## Task 6: Deploy to Railway

### Step 1: Confirm Railway env vars are set (Manual)

Verify in Railway Dashboard → Variables:
- `STRIPE_SECRET_KEY` (renamed from `STRIPE_KEY_SECRET`)
- `STRIPE_PRICE_ID` (e.g. `price_1T...`)
- `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard webhook)

### Step 2: Push to main and deploy

```bash
git push origin main
```

Railway auto-deploys on push. Watch deploy logs for `[Stripe] initialized`.

### Step 3: Verify production webhook

Stripe Dashboard → Webhooks → your endpoint → check "Recent deliveries" after a test purchase.

All events should show status `200`.

---

## Rollback Plan

If webhooks stop working:
1. Check Railway logs for `[Stripe] Webhook sig error` — means `STRIPE_WEBHOOK_SECRET` is wrong
2. Regenerate webhook secret in Stripe Dashboard → update Railway var → redeploy

If checkout returns 503 "Payment not configured":
1. Railway logs: check `STRIPE_SECRET_KEY` is set and correct
2. If `[Stripe] Checkout error: No such price...`: verify `STRIPE_PRICE_ID` points to a recurring price, not a one-time price

---

## Acceptance Criteria (GitHub #123 + #124)

- [ ] `POST /api/checkout` returns a Stripe Checkout URL with `mode: subscription`
- [ ] After payment, `profiles.tier = 'premium'` and `stripe_subscription_id` is set
- [ ] `usePremium` returns `isPremium: true` within 3 seconds of completing checkout
- [ ] PremiumGate content unlocks without page reload (via Realtime)
- [ ] Cancelling subscription keeps `tier = 'premium'` until period end, then auto-expires
- [ ] `/api/webhook/stripe` returns `200` for all 6 registered event types
- [ ] Railway logs show no `STRIPE_SECRET_KEY` initialization warnings
