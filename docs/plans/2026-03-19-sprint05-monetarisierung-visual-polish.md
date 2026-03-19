# Sprint 05 — Monetarisierung + Visual Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Bazodiac earn revenue: verify Stripe checkout E2E, wire premium gate with instant unlock on payment, tune the Signatur ring's bloom/colors, and verify Levi's conversation continuity.

**Architecture:** This is primarily a verification + tuning sprint, not new feature development. Task 5.1 debugs the existing Stripe flow. Task 5.2 ensures the webhook updates Supabase and `usePremium` reacts instantly. Task 5.3 adjusts Three.js postprocessing parameters and engine color definitions. Task 5.4 verifies ElevenLabs tool config and conversation persistence.

**Tech Stack:** Express (server.mjs), Stripe SDK, Supabase, React 19, Three.js (UnrealBloomPass), ElevenLabs, Vitest

---

## Current State (from codebase exploration)

### Stripe Infrastructure (server.mjs)
- **`/api/checkout`** (line 1821): Creates Stripe checkout session, mode `"payment"`, redirects to `session.url`
- **`/api/webhook/stripe`** (line 1969): Handles `checkout.session.completed`, sets `profiles.tier = "premium"`
- **`/api/customer-portal`** (line 1905): Billing portal for premium users
- **ENV vars:** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- **CSP:** `frameSrc` includes `"https://checkout.stripe.com"` (line 109)

### Premium Flow
- **`usePremium.ts`**: Reads `profiles.tier === 'premium'`, has Supabase realtime subscription + tab visibility re-fetch
- **`UpgradeButton.tsx`**: POST `/api/checkout`, redirects to `window.location.href = url`
- **`PremiumGate.tsx`**: Blur overlay with UpgradeButton, used on Dashboard sections
- **`PremiumUpgradeModal.tsx`**: New modal on Signatur page (Sprint 03)

### V2 Ring Bloom (FusionRingCanvasV2.tsx)
- **Bloom params** (line 144-149): `strength: 0.8`, `radius: 0.4`, `threshold: 0.85`
- **Tone mapping** (line 133): `ACESFilmicToneMapping`, `exposure: 1.8`
- **Emergence modulation** (line 927): bloom strength lerps `0.6 → 1.4` based on emergence value
- **Vignette** (line 157): `darkness: 0.6`, `offset: 1.2`

### Engine (bazodiac-engine.ts)
- **7 PLANETS** (line 63-71): Cousto frequencies, RGB colors, hex colors
- **d-parameter** (line 174): `lerp(0.4, 1.2, hash01(seed, 3))` — deterministic per-planet pen distance
- **No Wu-Xing colors** — PLANETS use planetary colors (Sun=gold, Mars=red, etc.), not element colors

### Levi Conversation
- **Save tool:** `elevenlabs-tool-save-conversation.json` → POST `/api/agent/conversation` → inserts into `agent_conversations`
- **History retrieval:** server.mjs line 1718-1723, queries last 5 summaries from `agent_conversations`

---

## Task 1: Stripe Checkout E2E Verification

**Files:**
- Modify: `server.mjs:1818-1901` (checkout route — potential fixes)
- Test: `src/__tests__/stripe-checkout.test.ts`

**Step 1: Write the diagnostic test**

```ts
// src/__tests__/stripe-checkout.test.ts
import { describe, it, expect } from 'vitest';

describe('Stripe checkout configuration', () => {
  it('checkout route uses payment mode', async () => {
    // Verify the server code has mode: "payment" (not "subscription")
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('mode: "payment"');
  });

  it('webhook handles checkout.session.completed', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('checkout.session.completed');
    expect(serverCode).toContain('tier: "premium"');
  });

  it('CSP allows Stripe checkout iframe', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('checkout.stripe.com');
  });

  it('webhook uses raw body parser (required for signature verification)', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    // Must use express.raw() NOT express.json() for webhook
    expect(serverCode).toMatch(/webhook\/stripe.*express\.raw/s);
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/stripe-checkout.test.ts`
Expected: PASS (these verify existing correct code)

**Step 3: Verify Railway ENV vars are documented**

Read `RAILWAY_DEPLOYMENT.md` and confirm these are listed:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

**Step 4: Check for common Stripe issues in server.mjs**

Read `server.mjs` checkout route and verify:
1. `express.raw({ type: 'application/json' })` is used on webhook route (NOT `express.json()`)
2. `stripe-signature` header is read correctly
3. Success/cancel URLs use `APP_URL` or fallback correctly
4. Webhook updates `profiles` table with `tier: "premium"` (not `is_premium: true`)

**Step 5: Add Stripe test mode detection log**

In `server.mjs`, after the Stripe initialization (line 1623), add a startup log:

```javascript
if (stripe) {
  const testMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  console.log(`[stripe] initialized (${testMode ? 'TEST' : 'LIVE'} mode)`);
} else {
  console.log('[stripe] not configured — checkout will return 503');
}
```

**Step 6: Commit**

```bash
git add src/__tests__/stripe-checkout.test.ts server.mjs
git commit -m "test(AN-S05): Stripe checkout E2E verification + startup mode log"
```

---

## Task 2: Premium Gate — Instant Unlock After Payment

**Files:**
- Modify: `src/hooks/usePremium.ts` (ensure realtime subscription works)
- Modify: `src/components/signatur/PremiumUpgradeModal.tsx` (close on premium change)
- Test: `src/__tests__/usePremium-realtime.test.ts`

**Step 1: Write the test**

```ts
// src/__tests__/usePremium-realtime.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('usePremium realtime behavior', () => {
  it('checks tier field, not is_premium boolean', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/hooks/usePremium.ts', 'utf8');
    // Must check tier === 'premium', not is_premium
    expect(code).toContain("=== 'premium'");
    expect(code).not.toContain('is_premium');
  });

  it('subscribes to realtime updates', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/hooks/usePremium.ts', 'utf8');
    expect(code).toContain('channel');
    expect(code).toContain('UPDATE');
  });

  it('re-fetches on tab visibility change', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/hooks/usePremium.ts', 'utf8');
    expect(code).toContain('visibilitychange');
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/usePremium-realtime.test.ts`
Expected: PASS (verifying existing correct behavior)

**Step 3: Read and verify usePremium.ts**

Read `src/hooks/usePremium.ts`. Confirm:
1. Initial fetch reads `profiles.tier`
2. Realtime subscription listens for `UPDATE` on `profiles` table
3. Tab visibility listener calls `fetchTier()` on visible
4. Returns `{ isPremium: boolean, loading: boolean }`

If all three mechanisms exist, the "instant unlock" flow is:
- User pays on Stripe → redirected back to app
- Tab visibility trigger fires → `fetchTier()` re-queries → `isPremium` becomes `true`
- Realtime subscription also fires (if Supabase realtime is enabled on `profiles`)
- All `usePremium()` consumers re-render with `isPremium: true`

**Step 4: Add auto-close to PremiumUpgradeModal on premium change**

Read `src/components/signatur/PremiumUpgradeModal.tsx`. Add a useEffect that closes the modal when premium becomes true:

```tsx
import { usePremium } from '@/src/hooks/usePremium';

// Inside the component, after existing hooks:
const { isPremium } = usePremium();

useEffect(() => {
  if (isPremium) onClose();
}, [isPremium, onClose]);
```

This ensures: if the modal is open and the user completes payment in another tab/redirect, the modal auto-closes and clusters unlock.

**Step 5: Verify webhook sets correct field**

Read `server.mjs` webhook handler (~line 1987-2003). Confirm it updates `profiles.tier = "premium"` (not `is_premium`).

If it uses `is_premium`, fix to `tier: "premium"` to match what `usePremium` reads.

**Step 6: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/hooks/usePremium.ts src/components/signatur/PremiumUpgradeModal.tsx src/__tests__/usePremium-realtime.test.ts
git commit -m "feat(AN-S05): premium auto-close modal on unlock + realtime verification"
```

---

## Task 3: Visual Polish — Bloom + Color Tuning

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:144-149` (bloom params)
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:133` (tone mapping exposure)
- Modify: `src/components/fusion-ring-website/bazodiac-engine.ts:63-71` (planet colors)
- Modify: `src/components/fusion-ring-website/bazodiac-engine.ts:174` (d-parameter range)

**Step 1: Tune bloom parameters**

In `FusionRingCanvasV2.tsx`, change the UnrealBloomPass initialization (line 144-149):

```typescript
// FROM:
bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.8,   // strength
  0.4,   // radius
  0.85   // threshold
);

// TO:
bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.55,  // strength — reduced: subtler glow, not overwhelming
  0.35,  // radius — tighter bloom spread
  0.92   // threshold — higher: only bright particles glow, not everything
);
```

**Rationale:**
- `strength 0.8 → 0.55`: Glow was "flooding" the image. 0.55 gives visible but refined bloom
- `radius 0.4 → 0.35`: Tighter spread prevents bloom bleeding across the ring
- `threshold 0.85 → 0.92`: Only the brightest particles (planet peaks) get bloom; dark particles stay crisp

**Step 2: Reduce tone mapping exposure**

In `FusionRingCanvasV2.tsx`, change the base exposure (line 133):

```typescript
// FROM:
renderer.toneMappingExposure = 1.8;

// TO:
renderer.toneMappingExposure = 1.5;
```

Also update all other exposure reset lines (~798, ~953) from `1.8` to `1.5`.

**Rationale:** Lower exposure means less HDR amplification → colors stay vivid instead of washing out to white.

**Step 3: Update emergence bloom range**

In `FusionRingCanvasV2.tsx`, change the emergence modulation (line 927):

```typescript
// FROM:
bloomPass.strength = lerp(0.6, 1.4, emergenceVal);

// TO:
bloomPass.strength = lerp(0.4, 0.9, emergenceVal);
```

**Rationale:** Emergence glow range scales with the new base. At max emergence, bloom goes to 0.9 (was 1.4 which was blinding).

**Step 4: Boost planet color saturation**

In `bazodiac-engine.ts`, update PLANETS array colors (lines 63-71). Increase saturation while keeping hue identity:

```typescript
export const PLANETS: PlanetDef[] = [
  { id: 'Sun',     hz: 126.22, color: [1.0,  0.72, 0.12], hexColor: '#FFB81F', zodiacDeg: 120, sign: 'Leo' },
  { id: 'Moon',    hz: 210.42, color: [0.68, 0.55, 1.0 ], hexColor: '#AD8CFF', zodiacDeg: 90,  sign: 'Cancer' },
  { id: 'Mercury', hz: 141.27, color: [0.20, 0.95, 1.0 ], hexColor: '#33F2FF', zodiacDeg: 60,  sign: 'Gemini' },
  { id: 'Venus',   hz: 221.23, color: [1.0,  0.40, 0.72], hexColor: '#FF66B8', zodiacDeg: 30,  sign: 'Taurus' },
  { id: 'Mars',    hz: 144.72, color: [1.0,  0.15, 0.12], hexColor: '#FF261F', zodiacDeg: 0,   sign: 'Aries' },
  { id: 'Jupiter', hz: 183.58, color: [1.0,  0.88, 0.0 ], hexColor: '#FFE000', zodiacDeg: 240, sign: 'Sagittarius' },
  { id: 'Saturn',  hz: 147.85, color: [0.38, 0.52, 0.72], hexColor: '#6185B8', zodiacDeg: 270, sign: 'Capricorn' },
];
```

**Changes:**
- Sun: warmer gold (orange component down, yellow up)
- Moon: deeper purple (more blue, less gray)
- Mercury: brighter cyan (less green muddiness)
- Venus: richer pink (less washed out)
- Mars: deeper red (less orange bleed)
- Jupiter: purer gold (slightly warmer)
- Saturn: slightly bluer steel (less gray)

**Step 5: Widen d-parameter range for more pattern diversity**

In `bazodiac-engine.ts`, change the d-parameter computation (line 174):

```typescript
// FROM:
const d = lerp(0.4, 1.2, hash01(seed, 3));

// TO:
const d = lerp(0.25, 1.5, hash01(seed, 3));
```

**Rationale:** Wider range means some planets get very tight, detailed patterns (low d) while others get dramatic, sweeping curves (high d). More visual contrast between different users' signatures.

**Step 6: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Run existing ring tests**

Run: `npx vitest run src/__tests__/signatur-bridge.test.ts`
Expected: PASS (bridge tests don't depend on bloom/color values)

**Step 8: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/components/fusion-ring-website/bazodiac-engine.ts
git commit -m "feat(AN-S05): visual polish — bloom reduction, color saturation boost, wider d-range"
```

---

## Task 4: Levi Conversation Continuity Verification

**Files:**
- Read: `elevenlabs-tool-save-conversation.json` (verify webhook URL)
- Read: `elevenlabs-tool.json` (verify profile endpoint includes conversation history)
- Read: `server.mjs:1715-1731` (verify history retrieval query)
- Read: `server.mjs:1773-1806` (verify save endpoint)
- Test: `src/__tests__/levi-conversation.test.ts`

**Step 1: Write the verification test**

```ts
// src/__tests__/levi-conversation.test.ts
import { describe, it, expect } from 'vitest';

describe('Levi conversation continuity', () => {
  it('save tool config has correct webhook URL', async () => {
    const fs = await import('fs');
    const config = JSON.parse(fs.readFileSync('elevenlabs-tool-save-conversation.json', 'utf8'));
    expect(config.url || config.webhook_url).toContain('/api/agent/conversation');
  });

  it('save endpoint inserts into agent_conversations table', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('agent_conversations');
    expect(serverCode).toContain('.insert(');
  });

  it('profile endpoint retrieves conversation history', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    // Server should query agent_conversations for previous summaries
    expect(serverCode).toContain('agent_conversations');
    // Should select summary and topics
    expect(serverCode).toContain('summary');
  });

  it('history query is limited and ordered', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    // Should limit to recent conversations
    expect(serverCode).toMatch(/\.limit\(\d+\)/);
    // Should order by most recent
    expect(serverCode).toContain('created_at');
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/levi-conversation.test.ts`
Expected: PASS

**Step 3: Verify conversation flow manually**

Read the following files and verify the chain:

1. `elevenlabs-tool-save-conversation.json`:
   - URL points to Railway production URL + `/api/agent/conversation`
   - Request body has `user_id`, `summary`, `topics` fields
   - Authorization header configured

2. `server.mjs` save route (line 1773):
   - Inserts `{ user_id, summary, topics }` into `agent_conversations`
   - Returns 200 on success

3. `server.mjs` profile/history route (line 1715):
   - Queries `agent_conversations` ordered by `created_at desc`, limit 5
   - Returns summaries in the profile response (fed to Levi as context)

4. `elevenlabs-tool.json`:
   - Profile tool fetches user data including conversation history
   - Levi's system prompt references past conversations

If the chain is complete, Levi conversation continuity is verified. If any link is broken, document what needs fixing.

**Step 4: Commit**

```bash
git add src/__tests__/levi-conversation.test.ts
git commit -m "test(AN-S05): Levi conversation continuity verification"
```

---

## Task 5: Full Suite Verification

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All new tests pass, no regressions

**Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Visual smoke test instructions**

After deployment, manually verify:
1. Open `/signatur` — ring should have crisper glow (less bloom wash)
2. Colors should be more vivid and distinguishable
3. Different users should see noticeably different pattern shapes (d-parameter range)
4. Click locked cluster → Premium modal → Upgrade button → Stripe checkout loads
5. Complete test payment (4242 4242 4242 4242) → redirect back → clusters unlock without reload
6. Talk to Levi → end conversation → start new → Levi references previous topics

---

## Decision Log

| Decision | Alternatives | Reason |
|----------|-------------|--------|
| Bloom strength 0.8 → 0.55 | 0.4 (too subtle), 0.7 (still washy) | 0.55 is the sweet spot between visible glow and crisp edges based on the 0.92 threshold |
| Threshold 0.85 → 0.92 | 0.95 (barely any bloom), 0.88 (still too much) | Only the brightest particles should glow; weak particles should stay sharp |
| Exposure 1.8 → 1.5 | 1.2 (too dark), 1.6 (still washing) | Preserves color fidelity while reducing HDR amplification |
| d-parameter 0.4-1.2 → 0.25-1.5 | Keep 0.4-1.2 (safe), 0.1-2.0 (too extreme) | Wider range for visible pattern diversity without breaking geometry |
| Auto-close premium modal on isPremium | Poll for payment status, WebSocket | `usePremium` already has realtime + visibility — just react to the existing hook |
| Verify Levi flow vs rebuild | Rebuild conversation system | YAGNI — the infrastructure exists, just needs verification |

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/__tests__/stripe-checkout.test.ts` |
| Create | `src/__tests__/usePremium-realtime.test.ts` |
| Create | `src/__tests__/levi-conversation.test.ts` |
| Modify | `server.mjs` (Stripe mode log) |
| Modify | `src/components/signatur/PremiumUpgradeModal.tsx` (auto-close on premium) |
| Modify | `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` (bloom params, exposure) |
| Modify | `src/components/fusion-ring-website/bazodiac-engine.ts` (colors, d-range) |
