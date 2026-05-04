# Stripe Webhook Merge + Match Auth Fix — Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the duplicate Stripe webhook handler (Bug #1) and fix the wrong API key in the match endpoint (Bug #2) so that premium upgrades persist to both `profiles` AND `astro_profiles`, subscription lifecycle events actually fire, and the Eve partner-match tool authenticates correctly against FuFirE.

**Architecture:** The first webhook handler (line ~539) only handles `checkout.session.completed` and writes to `astro_profiles`. The second handler (line ~4675) handles 6 event types and writes to `profiles`. We merge them into one handler that writes to **both** tables on checkout, and delegates subscription lifecycle to the `profiles` table (which stores `stripe_customer_id`). For Bug #2, we replace the manual `x-api-key: ELEVENLABS_TOOL_SECRET` header with the existing `bafeDirectHeaders()` function that uses `BAFE_API_KEY`.

**Tech Stack:** Express.js (server.mjs), Stripe SDK, Supabase service client

---

## Task 1: Delete the first (incomplete) Stripe webhook handler

**Files:**
- Modify: `server.mjs:539-598` (delete the entire first handler)

**Step 1: Locate and remove the first handler**

Delete the block from line 539 to line 598 (inclusive). The block starts with:
```javascript
// ── /api/webhook/stripe ─────────────────────────────────────────
// Must use express.raw() to get the raw body for signature verification
app.post(
  '/api/webhook/stripe',
```
and ends with the closing `);` after the `catch` block.

Remove this **entire block** (approximately 60 lines). The complete handler from `// ── /api/webhook/stripe` through the final `);` and the blank line after it.

**Step 2: Verify the file still has exactly one `/api/webhook/stripe` route**

```bash
grep -n 'api/webhook/stripe' server.mjs
```

Expected: only the second handler (previously around line 4675, now shifted up ~60 lines) remains. Should show exactly **one** `app.post` for this route.

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "fix(stripe): remove duplicate webhook handler (first handler was shadowing lifecycle events)"
```

---

## Task 2: Add `astro_profiles` update to the remaining handler's checkout event

**Files:**
- Modify: `server.mjs` — the remaining `checkout.session.completed` block inside the webhook handler

**Step 1: Locate the checkout.session.completed block**

Find this code in the remaining webhook handler:
```javascript
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
```

**Step 2: Add the `astro_profiles` update alongside the `profiles` update**

Replace the entire `if (event.type === "checkout.session.completed")` block with:

```javascript
  // ── Event: checkout completed → subscription created ──────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId && supabaseServer) {
      // Update BOTH tables — profiles stores Stripe metadata, astro_profiles stores tier
      const [profileResult, astroResult] = await Promise.allSettled([
        supabaseServer
          .from("profiles")
          .update({
            tier: "premium",
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq("id", userId),
        supabaseServer
          .from("astro_profiles")
          .update({ tier: "premium" })
          .eq("user_id", userId),
      ]);

      if (profileResult.status === "fulfilled" && profileResult.value.error) {
        console.error("[Stripe] checkout profiles update failed:", profileResult.value.error.message);
      }
      if (astroResult.status === "fulfilled" && astroResult.value.error) {
        console.error("[Stripe] checkout astro_profiles update failed:", astroResult.value.error.message);
      }

      const anyError =
        (profileResult.status === "rejected") ||
        (astroResult.status === "rejected") ||
        (profileResult.status === "fulfilled" && profileResult.value.error) ||
        (astroResult.status === "fulfilled" && astroResult.value.error);

      if (!anyError) {
        console.log(`[Stripe] User ${userId} upgraded to premium (sub: ${session.subscription})`);
      }
    }
```

**Step 3: Also update `astro_profiles` on subscription lifecycle events**

Find the `customer.subscription.updated` block. After the existing `profiles` update, add an `astro_profiles` update. Replace:

```javascript
    const { error } = await supabaseServer
      .from("profiles")
      .update({
        tier: isPremium ? "premium" : "free",
        stripe_subscription_id: sub.id,
        subscription_end: periodEnd,
      })
      .eq("stripe_customer_id", sub.customer);

    if (error) console.error("[Stripe] subscription.updated profile update failed:", error);
    else console.log(`[Stripe] Subscription ${sub.id} updated — status=${sub.status}, periodEnd=${periodEnd}`);
```

with:

```javascript
    const [profileResult, astroResult] = await Promise.allSettled([
      supabaseServer
        .from("profiles")
        .update({
          tier: isPremium ? "premium" : "free",
          stripe_subscription_id: sub.id,
          subscription_end: periodEnd,
        })
        .eq("stripe_customer_id", sub.customer),
      // Keep astro_profiles in sync — it may be read by components that don't join profiles
      supabaseServer
        .from("astro_profiles")
        .update({ tier: isPremium ? "premium" : "free" })
        .eq("user_id", userId),
    ]);

    if (profileResult.status === "fulfilled" && profileResult.value.error) {
      console.error("[Stripe] subscription.updated profiles failed:", profileResult.value.error.message);
    }
    if (astroResult.status === "fulfilled" && astroResult.value.error) {
      console.error("[Stripe] subscription.updated astro_profiles failed:", astroResult.value.error.message);
    }
    if (!profileResult.value?.error && !astroResult.value?.error) {
      console.log(`[Stripe] Subscription ${sub.id} updated — status=${sub.status}, periodEnd=${periodEnd}`);
    }
```

Do the same for `customer.subscription.deleted`. After the existing `profiles` update:

```javascript
      const [profileResult, astroResult] = await Promise.allSettled([
        supabaseServer
          .from("profiles")
          .update({
            tier: stillInGrace ? "premium" : "free",
            subscription_end: periodEnd,
          })
          .eq("stripe_customer_id", customerId),
        supabaseServer
          .from("astro_profiles")
          .update({ tier: stillInGrace ? "premium" : "free" })
          .eq("user_id", sub.metadata?.userId),
      ]);

      if (profileResult.status === "fulfilled" && profileResult.value.error) {
        console.error("[Stripe] subscription.deleted profiles failed:", profileResult.value.error.message);
      }
      if (astroResult.status === "fulfilled" && astroResult.value.error) {
        console.error("[Stripe] subscription.deleted astro_profiles failed:", astroResult.value.error.message);
      }
      if (!profileResult.value?.error && !astroResult.value?.error) {
        console.log(`[Stripe] Subscription deleted — grace until ${periodEnd}, tier=${stillInGrace ? "premium" : "free"}`);
      }
```

**Step 4: Verify only one webhook handler exists**

```bash
grep -c 'app.post.*webhook/stripe' server.mjs
```

Expected: `1`

**Step 5: Verify the code is syntactically valid**

```bash
node --check server.mjs
```

Expected: no output (success).

**Step 6: Commit**

```bash
git add server.mjs
git commit -m "fix(stripe): merge webhook handlers — write tier to both profiles + astro_profiles

checkout.session.completed now updates BOTH profiles (with stripe_customer_id,
stripe_subscription_id) AND astro_profiles (tier only). subscription.updated
and subscription.deleted also sync astro_profiles.tier.

Previously, the first handler (line 539) shadowed the second (line 4675),
meaning subscription lifecycle events (renewal, cancel, downgrade) never
fired — profiles table never received stripe_customer_id or subscription_end."
```

---

## Task 3: Fix Bug #2 — wrong API key in match endpoint

**Files:**
- Modify: `server.mjs` — the `/api/agent/match` handler

**Step 1: Locate the wrong header**

Find this code (should be around line ~4090 after the previous edits):
```javascript
    const chartRes = await fetchWithRetry(`${bafeUrl}/api/webhooks/chart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ELEVENLABS_TOOL_SECRET,
      },
```

**Step 2: Replace with `bafeDirectHeaders()`**

Replace:
```javascript
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ELEVENLABS_TOOL_SECRET,
      },
```

with:
```javascript
      headers: bafeDirectHeaders(),
```

The `bafeDirectHeaders()` function (defined earlier in server.mjs) already sets `Content-Type: application/json` and adds `X-API-Key: ${BAFE_API_KEY}` when the env var is configured — which is the correct auth for FuFirE.

**Step 3: Verify syntax**

```bash
node --check server.mjs
```

Expected: no output.

**Step 4: Commit**

```bash
git add server.mjs
git commit -m "fix(agent/match): use bafeDirectHeaders() instead of ELEVENLABS_TOOL_SECRET

The partner chart endpoint on FuFirE authenticates via BAFE_API_KEY,
not ELEVENLABS_TOOL_SECRET. Using the wrong secret caused 401 errors
when BAFE_API_KEY was configured, breaking Eve's partner-match tool."
```

---

## Task 4: Fix Bug #4 — APP_URL fallback domain

**Files:**
- Modify: `server.mjs` — the APP_URL constant

**Step 1: Locate**

Find:
```javascript
const APP_URL = stripTrailingSlash(
  process.env.APP_URL || 
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "https://bazodiac.space")
);
```

**Step 2: Fix fallback domain**

Replace `"https://bazodiac.com"` with `"https://bazodiac.space"`:

```javascript
const APP_URL = stripTrailingSlash(
  process.env.APP_URL || 
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "https://bazodiac.space")
);
```

**Step 3: Verify syntax**

```bash
node --check server.mjs
```

**Step 4: Commit**

```bash
git add server.mjs
git commit -m "fix: correct APP_URL fallback from bazodiac.com to bazodiac.space"
```

---

## Task 5: Fix Bug #7 — remove auth-check info logging in production

**Files:**
- Modify: `server.mjs` — the profile endpoint

**Step 1: Locate**

Find:
```javascript
  console.log(`[profile] auth check — match: ${!!ELEVENLABS_TOOL_SECRET && token === ELEVENLABS_TOOL_SECRET}`);
```

**Step 2: Replace with failure-only logging**

Replace with:
```javascript
  // Only log auth failures — never log success/token match details in production
```

The subsequent `if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET)` block already returns 401 — no additional logging needed for the success path.

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "fix(security): remove auth-check info logging from profile endpoint

Was logging whether the token matched on every request — information
disclosure risk in production. Auth failures are logged by the 401 response."
```

---

## Task 6: Verify & push

**Step 1: Run syntax check**

```bash
node --check server.mjs
```

Expected: no errors.

**Step 2: Run existing tests**

```bash
npm test 2>&1 | tail -10
```

Expected: all tests pass.

**Step 3: Verify single webhook handler**

```bash
grep -n 'app.post.*webhook/stripe' server.mjs
```

Expected: exactly 1 match.

**Step 4: Verify no ELEVENLABS_TOOL_SECRET used as BAFE key**

```bash
grep -n 'x-api-key.*ELEVENLABS' server.mjs
```

Expected: 0 matches.

**Step 5: Verify APP_URL fallback**

```bash
grep 'bazodiac.space' server.mjs
```

Expected: 0 matches.

**Step 6: Push**

```bash
git push origin master
```

---

## Summary

| Task | Bug | Fix | Tables affected |
|------|-----|-----|----------------|
| 1-2 | #1 Duplicate webhook | Remove first handler, merge into second | `profiles` + `astro_profiles` |
| 3 | #2 Wrong API key | `ELEVENLABS_TOOL_SECRET` → `bafeDirectHeaders()` | — |
| 4 | #4 Wrong domain | `bazodiac.com` → `bazodiac.space` | — |
| 5 | #7 Info disclosure | Remove auth success logging | — |

**Estimated time:** 30-45 minutes.

**Not in scope (separate PR):**
- Bug #3 (Widget race condition) — requires frontend React changes
- Bug #5 (birth_date validation) — minor, no user reports
- Bug #6 (CSP WebSocket) — needs ElevenLabs domain audit
