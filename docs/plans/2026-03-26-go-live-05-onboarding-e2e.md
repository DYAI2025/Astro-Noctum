# GO-LIVE-05: Onboarding E2E — Bootstrap-Kette absichern

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden the onboarding bootstrap chain so that BAFE failures are retried, Supabase persistence failures are surfaced to the client, and users see a non-blocking hint when their Soulprint falls back to neutral data — without blocking the ring from rendering.
**Architecture:** Express server (`server.mjs`) → BAFE `/chart` → Supabase `astro_profiles` → React client (`App.tsx`) → `SignatureReveal`. Server adds retry logic and a `soulprint_saved` field. Client detects fallback state and shows a soft message. Feature flag module gains self-validation at init time.
**Tech Stack:** TypeScript, Node.js (ESM), React 19, Vitest
**GitHub Issue:** #181

---

## Task 1 — Add retry logic + `soulprint_saved` field to bootstrap endpoint

**Files:**
- `server.mjs` (modify)

### Steps

**Step 1.1 — Add `fetchWithRetry` helper near the top of `server.mjs`** (place it after the existing imports, before the Express app setup):

```js
// Exponential-backoff fetch helper used by the bootstrap endpoint.
// Retries on network errors and 5xx responses only; 4xx is returned immediately.
async function fetchWithRetry(url, options, maxRetries = 3, baseDelayMs = 2000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        // 2xx–3xx: success; 4xx: client error, do not retry
        return res;
      }
      // 5xx: server error — fall through to retry
      lastError = new Error(`BAFE responded with ${res.status}`);
    } catch (err) {
      // Network error
      lastError = err;
    }
    if (attempt < maxRetries) {
      const delayMs = baseDelayMs * Math.pow(2, attempt); // 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
```

**Step 1.2 — Replace the raw BAFE fetch inside the bootstrap handler (around line 1101) with `fetchWithRetry`:**

Before:
```js
const baferes = await fetch(`${BAFE_BASE}/chart`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(birthData),
  signal: AbortSignal.timeout(15000),
});
```

After:
```js
const baferes = await fetchWithRetry(
  `${BAFE_BASE}/chart`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(birthData),
    signal: AbortSignal.timeout(15000),
  },
  3,    // maxRetries
  2000  // baseDelayMs
);
```

**Step 1.3 — Track Supabase save success and add `soulprint_saved` to response payload.**

Locate the fire-and-forget Supabase block (around line 1158):

Before:
```js
supabaseAdmin
  .from('astro_profiles')
  .update({ soulprint_sectors: soulprintSectors })
  .eq('user_id', userId)
  .then(({ error }) => {
    if (error) console.warn('[bootstrap] soulprint save failed', error.message);
  });

return res.json({ soulprint_sectors: soulprintSectors, ...rest });
```

After:
```js
let soulprint_saved = false;
try {
  const { error } = await supabaseAdmin
    .from('astro_profiles')
    .update({ soulprint_sectors: soulprintSectors })
    .eq('user_id', userId);
  if (error) {
    console.warn('[bootstrap] soulprint save failed', error.message);
  } else {
    soulprint_saved = true;
  }
} catch (err) {
  console.warn('[bootstrap] soulprint save threw', err);
}

return res.json({ soulprint_sectors: soulprintSectors, soulprint_saved, ...rest });
```

Note: The Supabase save is now awaited (no longer fire-and-forget) so the `soulprint_saved` status is accurate. Total added latency is bounded by the Supabase network round-trip (~50–150 ms on Railway).

### Commands to run

```bash
# TypeScript verification only (server.mjs is plain JS — lint via node --check)
node --check server.mjs
# Expected output: (no output = success)
```

### Git commit

```bash
git add server.mjs
git commit -m "feat(bootstrap): add fetchWithRetry (3 attempts, exp backoff) and soulprint_saved field"
```

---

## Task 2 — Improve client-side fallback feedback

**Files:**
- `src/App.tsx` (modify)
- `src/__tests__/feature-flags.test.ts` — see Task 3 (bootstrap fallback pure function tested here instead since it is also a unit test)

### Steps

**Step 2.1 — Extract a pure fallback-detection function in `src/App.tsx`:**

Add this function above the `App` component definition:

```ts
/**
 * Returns true when the bootstrap response contains fallback/synthetic soulprint data.
 * Used to show a non-blocking hint in SignatureReveal.
 */
export function isBootstrapFallback(seed: string): boolean {
  return seed.startsWith('fallback:');
}
```

**Step 2.2 — Add `bootstrapFailed` to component state:**

Inside the `App` component, after the existing `onboardingPhase` state:

```ts
const [bootstrapFailed, setBootstrapFailed] = useState(false);
```

**Step 2.3 — Detect fallback in the bootstrap catch/result block (lines 119–142):**

In the existing `catch` block that creates fallback bootstrap data, add:

```ts
setBootstrapFailed(true);
```

Also detect the `soulprint_saved: false` case in the success path:

```ts
if (data.soulprint_saved === false || isBootstrapFallback(data.signature_blueprint?.seed ?? '')) {
  setBootstrapFailed(true);
}
```

**Step 2.4 — Pass `bootstrapFailed` to `SignatureReveal` and show a non-blocking message:**

In the JSX where `SignatureReveal` is rendered, add a prop:

```tsx
<SignatureReveal
  bootstrapData={bootstrapData}
  bootstrapFailed={bootstrapFailed}
  onComplete={handleSignatureRevealComplete}
/>
```

Inside `src/components/onboarding/SignatureReveal.tsx`, accept the new prop and render an inline notice (do NOT block ring rendering):

```tsx
interface SignatureRevealProps {
  bootstrapData: BootstrapResponse;
  bootstrapFailed?: boolean;
  onComplete: () => void;
}

// Inside the JSX, above or below the ring container — NOT as a modal or blocker:
{props.bootstrapFailed && (
  <p className="text-xs text-gold/60 text-center mt-2">
    {lang === 'de'
      ? 'Dein Soulprint wird berechnet...'
      : 'Your Soulprint is being calculated...'}
  </p>
)}
```

### Test — write `src/__tests__/bootstrap-fallback.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { isBootstrapFallback } from '../App';

describe('isBootstrapFallback', () => {
  it('returns true for fallback seed', () => {
    expect(isBootstrapFallback('fallback:1711234567890')).toBe(true);
  });

  it('returns false for a real seed', () => {
    expect(isBootstrapFallback('bazi:wood-dragon:2025')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isBootstrapFallback('')).toBe(false);
  });
});
```

### Commands to run

```bash
npx vitest run src/__tests__/bootstrap-fallback.test.ts
# Expected: 3 tests pass
```

### Git commit

```bash
git add src/App.tsx src/components/onboarding/SignatureReveal.tsx src/__tests__/bootstrap-fallback.test.ts
git commit -m "feat(onboarding): detect bootstrap fallback state and show non-blocking hint in SignatureReveal"
```

---

## Task 3 — Add feature flag validation logging

**Files:**
- `src/lib/feature-flags.ts` (modify)
- `src/__tests__/feature-flags.test.ts` (create)

### Steps

**Step 3.1 — Add `validateCriticalFlags()` to `src/lib/feature-flags.ts`:**

After the `FLAGS` constant and any existing flag accessor functions, add:

```ts
const CRITICAL_FLAGS: (keyof typeof FLAGS)[] = [
  'signature_onboarding_v1',
  'daily_modal_v1',
  'signature_engine_v2',
];

/**
 * Warns to console when a critical feature flag has been overridden to false.
 * Called at module initialization so the warning appears on every app boot.
 */
export function validateCriticalFlags(): void {
  for (const flagName of CRITICAL_FLAGS) {
    if (!getFlag(flagName)) {
      console.warn('[FeatureFlags] Critical flag disabled:', flagName);
    }
  }
}

// Run at module initialization
validateCriticalFlags();
```

Note: `getFlag` must already exist (or equivalent accessor); if the codebase uses direct `FLAGS[name]` access, replace `getFlag(flagName)` with `FLAGS[flagName]`.

**Step 3.2 — Write `src/__tests__/feature-flags.test.ts`:**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('validateCriticalFlags', () => {
  beforeEach(() => {
    // Clear localStorage overrides before each test
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not warn when all critical flags are enabled (default state)', async () => {
    // Fresh import — no localStorage overrides set
    vi.resetModules();
    const { validateCriticalFlags } = await import('../lib/feature-flags');
    validateCriticalFlags();
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('[FeatureFlags]'),
      expect.anything()
    );
  });

  it('warns when signature_onboarding_v1 is overridden to false', async () => {
    localStorage.setItem('ff_signature_onboarding_v1', 'false');
    vi.resetModules();
    const { validateCriticalFlags } = await import('../lib/feature-flags');
    validateCriticalFlags();
    expect(console.warn).toHaveBeenCalledWith(
      '[FeatureFlags] Critical flag disabled:',
      'signature_onboarding_v1'
    );
  });

  it('warns when signature_engine_v2 is overridden to false', async () => {
    localStorage.setItem('ff_signature_engine_v2', 'false');
    vi.resetModules();
    const { validateCriticalFlags } = await import('../lib/feature-flags');
    validateCriticalFlags();
    expect(console.warn).toHaveBeenCalledWith(
      '[FeatureFlags] Critical flag disabled:',
      'signature_engine_v2'
    );
  });
});
```

### Commands to run

```bash
npx vitest run src/__tests__/feature-flags.test.ts
# Expected: 3 tests pass
```

### Git commit

```bash
git add src/lib/feature-flags.ts src/__tests__/feature-flags.test.ts
git commit -m "feat(flags): add validateCriticalFlags() with console.warn on boot and unit tests"
```

---

## Task 4 — Manual E2E checklist + TypeScript verification + developer comment

**Files:**
- `server.mjs` (modify — add comment block above bootstrap handler)
- No new test files

### Steps

**Step 4.1 — Add 7-step developer comment above the bootstrap endpoint in `server.mjs`:**

Find the line `app.post('/api/experience/bootstrap', requireUserAuth, async (req, res) => {` and add the following block immediately above it:

```js
/**
 * Bootstrap endpoint — 7-step flow:
 *
 * 1. Validate auth: requireUserAuth middleware checks Supabase JWT, attaches req.userId.
 * 2. Parse birth data: req.body must contain { date, time, lat, lon, tz }.
 * 3. Fetch chart from BAFE: POST to /chart with 15s AbortSignal timeout.
 *    Uses fetchWithRetry (max 3 attempts, exponential backoff: 2s → 4s → 8s).
 *    4xx from BAFE is NOT retried (client error). Network errors and 5xx are retried.
 *    If all retries fail: returns HTTP 502 to client.
 * 4. Compute Master Signal: runs gcbBuilder + masterSignalBuilder on the BAFE chart.
 *    Projects the result to 12 soulprint_sectors (Float array, values 0–1).
 * 5. Persist soulprint: awaits Supabase astro_profiles.update({ soulprint_sectors }).
 *    On success: sets soulprint_saved = true in response payload.
 *    On failure: console.warn, sets soulprint_saved = false — still returns HTTP 200.
 *    Recovery: transit-state endpoint derives soulprint from Wu-Xing data when DB row is absent.
 * 6. Build response payload: { soulprint_sectors, soulprint_saved, profile_summary,
 *    signature_blueprint, narratives }.
 * 7. Return HTTP 200 JSON. Client (App.tsx) detects soulprint_saved=false or
 *    seed.startsWith('fallback:') and shows a non-blocking "Soulprint wird berechnet..." hint.
 */
```

**Step 4.2 — Run full TypeScript verification:**

```bash
npm run lint
# Expected: no TypeScript errors (exit code 0)
```

**Step 4.3 — Run full test suite:**

```bash
npm run test
# Expected: 800+ tests passing, 0 failures
```

**Step 4.4 — Manual E2E smoke test checklist** (perform in browser at `http://localhost:3000`):

- [ ] Submit birth form with valid data → ring animates in SignatureReveal, no fallback message shown
- [ ] Kill BAFE locally (set `VITE_BAFE_BASE_URL` to an unreachable host) → ring shows with neutral data, fallback message "Dein Soulprint wird berechnet..." visible below ring
- [ ] Re-enable BAFE, set `ff_signature_onboarding_v1=false` in localStorage → app falls through to legacy BAFE-only flow, no SignatureReveal rendered
- [ ] Open browser console → no `[FeatureFlags] Critical flag disabled:` warnings under default flag state
- [ ] Set `ff_signature_engine_v2=false` in localStorage → console shows `[FeatureFlags] Critical flag disabled: signature_engine_v2`

### Git commit

```bash
git add server.mjs
git commit -m "docs(bootstrap): add 7-step developer comment above bootstrap endpoint"
```

---

## Summary

| Task | Files changed | Tests added |
|------|---------------|-------------|
| 1 | `server.mjs` | none (server integration out of scope) |
| 2 | `src/App.tsx`, `src/components/onboarding/SignatureReveal.tsx` | `src/__tests__/bootstrap-fallback.test.ts` (3 tests) |
| 3 | `src/lib/feature-flags.ts` | `src/__tests__/feature-flags.test.ts` (3 tests) |
| 4 | `server.mjs` (comment only) | none |

Total new tests: **6**. All existing tests must remain green (`npm run test` → 800+).
