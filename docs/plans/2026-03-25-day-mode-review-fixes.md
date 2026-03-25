# Day-Mode Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 6 issues identified in the PR #160 code review of the Day-Pulse/Day-Trace feature.

**Architecture:** 4 tasks batched by file locality. Task 1 extracts shared types (unblocks import direction fix). Tasks 2–4 are independent and can be done in any order after Task 1.

**Tech Stack:** TypeScript, React 19, Vitest, Canvas 2D API, Express (server.mjs)

---

## Issue Reference

| # | Severity | File | Summary |
|---|----------|------|---------|
| 1 | Blocking | `DayModeModal.tsx:137` | Stale closure in Escape listener |
| 2 | Blocking | `server.mjs:1348` | Zod crash if Gemini omits both `harmony_index` + `day_mode` |
| 3 | Important | `useFirstRunDaily.ts:6` | Hook imports from `components/` — inverted dependency |
| 4 | Important | `DayModeModal.tsx:41` | Canvas not DPR-scaled → blurry on Retina |
| 5 | Minor | `DayModeModal.tsx:146` | Redundant fallback chain |
| 6 | Minor | `bipolar-engine.ts:354` | Hz threshold undocumented, fragile |

---

## Task 1: Extract DayHarmonicState to `src/lib/fusion-ring/day-harmonic.ts` (Issue 3)

**Files:**
- Create: `src/lib/fusion-ring/day-harmonic.ts`
- Modify: `src/components/signatur-v3/bipolar-engine.ts` (remove moved code, re-export)
- Modify: `src/hooks/useFirstRunDaily.ts` (update import path)
- Modify: `src/components/dashboard/DayModeModal.tsx` (update import path)
- Test: `npx tsc --noEmit` (type system verifies all re-exports)

**Why:** A hook must not import from `components/`. `DayHarmonicState` and `computeDayHarmonic` are pure math — they belong in `src/lib/fusion-ring/`. `modulateConfig` stays in `bipolar-engine` because it depends on `SignaturV3Config`.

**Step 1: Create `src/lib/fusion-ring/day-harmonic.ts`**

```typescript
// src/lib/fusion-ring/day-harmonic.ts

export interface DayHarmonicState {
  /** 0–1 — cosine similarity between Wu-Xing vectors (Western + BaZi) */
  harmonyIndex: number;
  /** pulse: H < 0.50 (calm, symmetric); trace: H >= 0.50 (crossing, something happens) */
  mode: 'pulse' | 'trace';
  /** |H - 0.45| / 0.55, normalized [0,1] — distance from random baseline */
  intensity: number;
}

const HARMONY_RANDOM_BASELINE = 0.45;
const HARMONY_RANGE = 0.55; // 1.0 - baseline

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Derive DayHarmonicState from the harmony_index returned by the Experience API.
 */
export function computeDayHarmonic(harmonyIndex: number): DayHarmonicState {
  const h = clamp(harmonyIndex, 0, 1);
  const mode: 'pulse' | 'trace' = h >= 0.50 ? 'trace' : 'pulse';
  const intensity = clamp(Math.abs(h - HARMONY_RANDOM_BASELINE) / HARMONY_RANGE, 0, 1);
  return { harmonyIndex: h, mode, intensity };
}
```

**Step 2: Update `src/components/signatur-v3/bipolar-engine.ts`**

Remove the `DayHarmonicState` interface definition (lines 75–82) and the `HARMONY_RANDOM_BASELINE`, `HARMONY_RANGE` constants, and `computeDayHarmonic` function (lines 265–276).

Add this import at the top of the file (after the existing comment block, before `DIMENSIONS`):
```typescript
export type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
export { computeDayHarmonic } from '../../lib/fusion-ring/day-harmonic';
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
```

Keep `modulateConfig` in `bipolar-engine.ts` — it depends on `SignaturV3Config` which lives here.

**Step 3: Update `src/hooks/useFirstRunDaily.ts`**

Change the import from:
```typescript
import {
  type DayHarmonicState,
  computeDayHarmonic,
} from '../components/signatur-v3/bipolar-engine';
```
To:
```typescript
import {
  type DayHarmonicState,
  computeDayHarmonic,
} from '../lib/fusion-ring/day-harmonic';
```

**Step 4: Update `src/components/dashboard/DayModeModal.tsx`**

Change the import from:
```typescript
import type { DayHarmonicState } from '../signatur-v3/bipolar-engine';
```
To:
```typescript
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
```

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

**Step 6: Run tests**

```bash
npx vitest run src/__tests__/day-mode-schema.test.ts
```
Expected: 3 passed.

**Step 7: Commit**

```bash
git add src/lib/fusion-ring/day-harmonic.ts \
        src/components/signatur-v3/bipolar-engine.ts \
        src/hooks/useFirstRunDaily.ts \
        src/components/dashboard/DayModeModal.tsx
git commit -m "refactor(day-mode): extract DayHarmonicState to lib/fusion-ring/day-harmonic.ts"
```

---

## Task 2: Fix server.mjs fallback — prevent Zod crash on missing fields (Issue 2)

**Files:**
- Modify: `server.mjs` (~line 1354 Gemini path, ~line 1263 proxy path)

**Why:** If Gemini omits both `harmony_index` and `day_mode` from the response, the current guard (`if harmony_index !== undefined`) never fires. The response is then cached and forwarded, and `DailyResponseSchema.parse()` throws on the client — the modal never shows and the poisoned entry sits in cache for 24h.

Fix: when `harmony_index` is absent, default it to `0.45` (random baseline = neutral day). When `day_mode` is absent, always compute it.

**Step 1: Fix the Gemini path**

Find this block in `server.mjs` (around line 1354):
```javascript
const parsedData = JSON.parse(jsonStr);

// Ensure day_mode is always present (server-side fallback computation)
if (parsedData?.fusion && parsedData.fusion.harmony_index !== undefined && parsedData.fusion.day_mode === undefined) {
  parsedData.fusion.day_mode = parsedData.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
}
```

Replace with:
```javascript
const parsedData = JSON.parse(jsonStr);

// Ensure harmony_index + day_mode are always present regardless of model output
if (parsedData?.fusion) {
  if (parsedData.fusion.harmony_index === undefined) {
    parsedData.fusion.harmony_index = 0.45; // random baseline = neutral
  }
  if (parsedData.fusion.day_mode === undefined) {
    parsedData.fusion.day_mode = parsedData.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
  }
}
```

**Step 2: Fix the proxy fallback path**

Find this block (around line 1263):
```javascript
const data = await resp.json();
// Inject day_mode if FuFirE provides harmony_index but omits day_mode
if (data?.fusion && data.fusion.harmony_index !== undefined && data.fusion.day_mode === undefined) {
  data.fusion.day_mode = data.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
}
return res.status(resp.status).json(data);
```

Replace with:
```javascript
const data = await resp.json();
// Ensure harmony_index + day_mode are always present
if (data?.fusion) {
  if (data.fusion.harmony_index === undefined) {
    data.fusion.harmony_index = 0.45;
  }
  if (data.fusion.day_mode === undefined) {
    data.fusion.day_mode = data.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
  }
}
return res.status(resp.status).json(data);
```

**Step 3: Run full tests**

```bash
npm run test
```
Expected: 800 passed (no regressions — server logic is not unit-tested directly but Zod schemas validate the output shape).

**Step 4: Commit**

```bash
git add server.mjs
git commit -m "fix(day-mode): always inject harmony_index + day_mode defaults in daily proxy"
```

---

## Task 3: Fix DayModeModal — stale closure + DPR canvas + redundant fallback (Issues 1, 4, 5)

**Files:**
- Modify: `src/components/dashboard/DayModeModal.tsx`

**Why three issues in one task:** All in the same 210-line file. Fixing them together avoids three separate reads/edits of the same file.

**Step 1: Fix stale closure in Escape listener (Issue 1)**

Current code (lines 132–144):
```tsx
const handleClose = () => {
  trackEvent('day_mode_modal_closed');
  onClose();
};

useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose(); // stale
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Replace with (add ref, remove eslint-disable):
```tsx
const handleClose = () => {
  trackEvent('day_mode_modal_closed');
  onClose();
};
const handleCloseRef = useRef(handleClose);
handleCloseRef.current = handleClose;

useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleCloseRef.current();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []); // correctly empty — ref is always current
```

**Step 2: Fix DPR canvas scaling (Issue 4)**

Current code in `ModeSnapshot` (lines 40–49):
```tsx
const S = 120;
canvas.width = S;
canvas.height = S;
const cx = S / 2;
const cy = S / 2;
const r = S * 0.38;

ctx.clearRect(0, 0, S, S);
ctx.fillStyle = '#050308';
ctx.fillRect(0, 0, S, S);
```

Replace with:
```tsx
const S = 120;
const dpr = window.devicePixelRatio || 1;
canvas.width = S * dpr;
canvas.height = S * dpr;
ctx.scale(dpr, dpr);
const cx = S / 2;
const cy = S / 2;
const r = S * 0.38;

ctx.clearRect(0, 0, S, S);
ctx.fillStyle = '#050308';
ctx.fillRect(0, 0, S, S);
```

The `style={{ width: 120, height: 120 }}` on the `<canvas>` element stays unchanged — CSS size must remain 120×120.

**Step 3: Simplify redundant fallback chain (Issue 5)**

Current code (lines 146–147):
```tsx
const mode = dayHarmonic?.mode ?? data.fusion.day_mode ?? 'pulse';
const intensity = dayHarmonic?.intensity ?? 0;
```

Replace with:
```tsx
// day_mode is required by Zod schema — always present
// Compute intensity from schema field when dayHarmonic prop not yet available
const mode = data.fusion.day_mode;
const intensity = dayHarmonic?.intensity ??
  Math.abs((data.fusion.harmony_index - 0.45) / 0.55);
```

This removes the unreachable `?? 'pulse'` fallback and ensures the snapshot shows the correct intensity even if `dayHarmonic` prop arrives late (e.g., cache hit before hook re-computes).

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

**Step 5: Run tests**

```bash
npm run test
```
Expected: 800 passed.

**Step 6: Commit**

```bash
git add src/components/dashboard/DayModeModal.tsx
git commit -m "fix(day-mode): stale closure + DPR canvas scaling + simplify mode fallback"
```

---

## Task 4: Document Hz threshold in bipolar-engine.ts (Issue 6)

**Files:**
- Modify: `src/components/signatur-v3/bipolar-engine.ts` (~line 353)

**Why:** The `hzNorm >= 0.4` threshold is magic. Hz values for the 6 dimensions are:

| Dimension | Hz | logNormHz |
|-----------|-----|-----------|
| Sun | 126.22 | 0.19 |
| Mercury | 141.27 | 0.31 |
| Mars | 144.72 | 0.35 |
| Saturn | 147.85 | 0.38 |
| Jupiter | 183.58 | 0.67 |
| Moon | 210.42 | 0.81 |

`>= 0.4` selects Jupiter + Moon (the 2 highest). This is intentional — matches the design doc's "top 2 crossing dimensions". Document it.

**Step 1: Replace the comment block**

Find (lines 353–360):
```typescript
// Day-Trace: boost Lissajous crossing for top dimensions (high Hz = more active)
if (dayHarmonic?.mode === 'trace') {
  const hzNorm = logNormHz(dim.hz);
  // Only boost the "crossing" half of dimensions (Hz above median ≈ 0.5)
  if (hzNorm >= 0.4) {
    blend = clamp(blend + dayHarmonic.intensity * 0.6, 0, 1);
  }
}
```

Replace with:
```typescript
// Day-Trace: boost Lissajous blend for high-Hz dimensions (Moon ≈ 0.81, Jupiter ≈ 0.67).
// Threshold 0.4 selects exactly these 2 out of 6 — matching design doc "top 2 crossing dims".
// If adding new dimensions with Hz 140–150 range, re-verify this threshold holds.
if (dayHarmonic?.mode === 'trace') {
  const hzNorm = logNormHz(dim.hz);
  // Boosts Moon (0.81) and Jupiter (0.67); skips Sun/Mercury/Mars/Saturn (≤ 0.38)
  if (hzNorm >= 0.4) {
    blend = clamp(blend + dayHarmonic.intensity * 0.6, 0, 1);
  }
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/signatur-v3/bipolar-engine.ts
git commit -m "docs(day-mode): document Hz threshold selection in updatePoles trace boost"
```

---

## Final Verification

```bash
npm run test
```
Expected: 800 passed, 0 failed.

```bash
npx tsc --noEmit
```
Expected: no errors.

Then push:
```bash
git push origin feature/fusion-ring-integration-v3
```

The existing PR #160 will auto-update.
