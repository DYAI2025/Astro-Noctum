# Signatur V2 Engine Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 12-sector deformation ring (V1) with the Cousto-frequency spirograph engine (V2) across all three ring mount points, behind a feature flag.

**Architecture:** Port `bazodiac-engine.ts` (pure math) + `FusionRingCanvasV2.tsx` (Three.js renderer) from the Next.js prototype. Build a bridge adapter (`signatur-bridge.ts`) to convert existing soulprint_sectors (12 numbers) to the V2 `natalWeights` format (7 planet weights). Swap in V2 at SignatureReveal, Dashboard mini-ring, and FusionRing3D — all gated by `signatur_engine_v2` feature flag.

**Tech Stack:** React 19, Vite, Three.js, Vitest, TypeScript

**Source files (READ ONLY, do not import directly):**
- Engine: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/1_-_Fusion_Ring_Design (1)/fusion_ring_website/nextjs_space/app/components/bazodiac-engine.ts`
- Canvas: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/1_-_Fusion_Ring_Design (1)/fusion_ring_website/nextjs_space/app/components/fusion-ring-canvas.tsx`

---

## Task 1: Port bazodiac-engine.ts

**Files:**
- Create: `src/components/fusion-ring-website/bazodiac-engine.ts`

**Step 1: Copy engine file**

Copy the entire contents of the source `bazodiac-engine.ts` (891 lines) to `src/components/fusion-ring-website/bazodiac-engine.ts`.

No modifications needed — this is pure TypeScript math with zero framework dependencies.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/components/fusion-ring-website/bazodiac-engine.ts 2>&1 | head -20`
Expected: No errors (file has no external imports)

**Step 3: Commit**

```bash
git add src/components/fusion-ring-website/bazodiac-engine.ts
git commit -m "feat(AN-signV2): port bazodiac-engine.ts from prototype"
```

---

## Task 2: Port FusionRingCanvasV2.tsx

**Files:**
- Create: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`

**Step 1: Copy and adapt canvas file**

Copy the source `fusion-ring-canvas.tsx` (1700 lines) to `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`. Apply these mandatory changes:

1. **Remove line 1:** Delete `'use client';` (Vite doesn't need it)

2. **Fix import on line 32:** The source imports `createEmptySedimentationState` from `./fusion-ring-profile`, but Astro-Noctum's version of that file doesn't export it (and the canvas never uses it). Remove it from the import:
   ```ts
   // BEFORE:
   import {
     createDemoProfile,
     createEmptySedimentationState,
     type FusionRingProfile,
   } from './fusion-ring-profile';

   // AFTER:
   import {
     createDemoProfile,
     type FusionRingProfile,
   } from './fusion-ring-profile';
   ```

3. **Add `className` prop:** The source `FusionRingCanvasProps` (line 69-75) doesn't include `className`. Add it:
   ```ts
   export interface FusionRingCanvasProps {
     natalWeights?: Record<string, number>;
     quizWeights?: Record<string, number>;
     isMini?: boolean;
     showUI?: boolean;
     revealProgress?: number;
     className?: string;  // ADD THIS
   }
   ```
   And pass it to the outermost `<div>` in the JSX return.

4. **Verify all other imports resolve:** These should all exist in the same directory:
   - `./bazodiac-engine` — just created in Task 1
   - `./fusion-ring-audio` — exists
   - `./fusion-ring-input` — exists (exports `FusionRingInputController`, `QuizClusterResult`)
   - `./fusion-ring-transit` — exists (exports `createDemoTransitState`, `TransitStateV1`)
   - `./fusion-ring-profile` — exists (exports `createDemoProfile`, `FusionRingProfile`)

5. **Export:** The component should be the default export. Verify the file has:
   ```ts
   export default function FusionRingCanvas({ ... }: FusionRingCanvasProps) { ... }
   ```
   or add `export default` if missing.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new errors related to `FusionRingCanvasV2.tsx` or `bazodiac-engine.ts`

**Step 3: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx
git commit -m "feat(AN-signV2): port FusionRingCanvasV2 from prototype"
```

---

## Task 3: Build signatur-bridge.ts (TDD)

**Files:**
- Create: `src/components/fusion-ring-website/signatur-bridge.ts`
- Create: `src/__tests__/signatur-bridge.test.ts`

**Step 1: Write the failing tests**

Create `src/__tests__/signatur-bridge.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  soulprintToNatalWeights,
  quizSectorsToQuizWeights,
} from '@/src/components/fusion-ring-website/signatur-bridge';

describe('soulprintToNatalWeights', () => {
  it('returns weights for all 7 planets', () => {
    const sectors = [0.6, 0.45, 0.7, 0.55, 0.9, 0.65, 0.5, 0.8, 0.75, 0.4, 0.35, 0.6];
    const weights = soulprintToNatalWeights(sectors);

    expect(Object.keys(weights)).toHaveLength(7);
    expect(weights).toHaveProperty('Sun');
    expect(weights).toHaveProperty('Moon');
    expect(weights).toHaveProperty('Mercury');
    expect(weights).toHaveProperty('Venus');
    expect(weights).toHaveProperty('Mars');
    expect(weights).toHaveProperty('Jupiter');
    expect(weights).toHaveProperty('Saturn');
  });

  it('maps Leo sector to Sun', () => {
    const sectors = Array(12).fill(0.5);
    sectors[4] = 0.95; // Leo
    const weights = soulprintToNatalWeights(sectors);
    expect(weights.Sun).toBeCloseTo(0.95, 2);
  });

  it('averages multi-sector planets', () => {
    const sectors = Array(12).fill(0.5);
    sectors[2] = 0.8; // Gemini
    sectors[5] = 0.6; // Virgo
    const weights = soulprintToNatalWeights(sectors);
    expect(weights.Mercury).toBeCloseTo(0.7, 2);
  });

  it('clamps missing sectors to 0.5', () => {
    const short = [0.3, 0.4, 0.5];
    const weights = soulprintToNatalWeights(short);
    expect(weights.Sun).toBeCloseTo(0.5, 2); // sector[4] missing → 0.5
  });

  it('all values are between 0 and 1', () => {
    const sectors = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.55];
    const weights = soulprintToNatalWeights(sectors);
    for (const v of Object.values(weights)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('quizSectorsToQuizWeights', () => {
  it('returns 6 quiz dimensions', () => {
    const sectors = Array(12).fill(0.5);
    const weights = quizSectorsToQuizWeights(sectors);
    expect(Object.keys(weights)).toHaveLength(6);
    expect(weights).toHaveProperty('assertion');
    expect(weights).toHaveProperty('empathy');
    expect(weights).toHaveProperty('logic');
    expect(weights).toHaveProperty('intuition');
    expect(weights).toHaveProperty('creativity');
    expect(weights).toHaveProperty('discipline');
  });

  it('maps specific sectors to dimensions', () => {
    const sectors = Array(12).fill(0.5);
    sectors[0] = 0.9;
    sectors[4] = 0.85;
    const weights = quizSectorsToQuizWeights(sectors);
    expect(weights.assertion).toBeCloseTo(0.9, 2);
    expect(weights.creativity).toBeCloseTo(0.85, 2);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/signatur-bridge.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the bridge**

Create `src/components/fusion-ring-website/signatur-bridge.ts`:

```ts
/**
 * Bridge: Converts soulprint_sectors (12-sector array from Bootstrap API)
 * to natalWeights (7-planet map for Bazodiac Engine V2) and quiz dimensions.
 *
 * Mapping: Each planet has natural affinity to zodiac sectors.
 * Sun→Leo(4), Moon→Cancer(3), Mercury→Gemini(2)+Virgo(5), etc.
 */

const PLANET_SECTOR_MAP: Record<string, number[]> = {
  Sun:     [4],        // Leo
  Moon:    [3],        // Cancer
  Mercury: [2, 5],     // Gemini, Virgo
  Venus:   [1, 6],     // Taurus, Libra
  Mars:    [0, 7],     // Aries, Scorpio
  Jupiter: [8, 11],    // Sagittarius, Pisces
  Saturn:  [9, 10],    // Capricorn, Aquarius
};

export function soulprintToNatalWeights(sectors: number[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const [planet, indices] of Object.entries(PLANET_SECTOR_MAP)) {
    const avg = indices.reduce((sum, i) => sum + (sectors[i] ?? 0.5), 0) / indices.length;
    weights[planet] = avg;
  }
  return weights;
}

export function quizSectorsToQuizWeights(sectors: number[]): Record<string, number> {
  const fallback = sectors.length
    ? sectors.reduce((s, v) => s + v, 0) / sectors.length
    : 0.5;
  return {
    assertion:  sectors[0] ?? fallback,
    empathy:    sectors[3] ?? fallback,
    logic:      sectors[5] ?? fallback,
    intuition:  sectors[8] ?? fallback,
    creativity: sectors[4] ?? fallback,
    discipline: sectors[9] ?? fallback,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/signatur-bridge.test.ts`
Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add src/components/fusion-ring-website/signatur-bridge.ts src/__tests__/signatur-bridge.test.ts
git commit -m "feat(AN-signV2): add signatur-bridge adapter with tests"
```

---

## Task 4: Add feature flag

**Files:**
- Modify: `src/lib/feature-flags.ts`

**Step 1: Add the `signatur_engine_v2` flag**

In `src/lib/feature-flags.ts`, add the new flag to the `FLAGS` object:

```ts
const FLAGS = {
  signature_onboarding_v1: true,
  daily_modal_v1: true,
  signatur_engine_v2: true,  // NEW — Cousto-frequency spirograph engine
} as const;
```

No other changes needed — `FlagName` is derived from `keyof typeof FLAGS`, so it auto-includes the new key.

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: Clean

**Step 3: Commit**

```bash
git add src/lib/feature-flags.ts
git commit -m "feat(AN-signV2): add signatur_engine_v2 feature flag"
```

---

## Task 5: Swap SignatureReveal to V2

**Files:**
- Modify: `src/components/onboarding/SignatureReveal.tsx`

**Step 1: Update imports**

At the top of `SignatureReveal.tsx`, replace the canvas import and add bridge + feature flag:

```ts
// REMOVE:
import { FusionRingWebsiteCanvas } from '../fusion-ring-website/FusionRingWebsiteCanvas';

// ADD:
import { FusionRingWebsiteCanvas } from '../fusion-ring-website/FusionRingWebsiteCanvas';
import FusionRingCanvasV2 from '../fusion-ring-website/FusionRingCanvasV2';
import { soulprintToNatalWeights, quizSectorsToQuizWeights } from '../fusion-ring-website/signatur-bridge';
import { isFeatureEnabled } from '../../lib/feature-flags';
```

(Keep the V1 import for fallback.)

**Step 2: Add V2 state alongside V1**

Inside the component, after the existing `activeSectors` state, add:

```ts
const useV2 = isFeatureEnabled('signatur_engine_v2');
const [natalWeights] = useState(() => soulprintToNatalWeights(soulprint_sectors));
const [quizWeights, setQuizWeights] = useState<Record<string, number> | undefined>();
```

**Step 3: Update handleQuizAnswer**

In the `handleQuizAnswer` callback, after `setActiveSectors(delta.quiz_sectors);` add:

```ts
setQuizWeights(quizSectorsToQuizWeights(delta.quiz_sectors));
```

**Step 4: Swap the JSX**

Replace the `<FusionRingWebsiteCanvas>` block (lines 103-106) with:

```tsx
{useV2 ? (
  <FusionRingCanvasV2
    natalWeights={natalWeights}
    quizWeights={quizWeights}
    showUI={false}
    className="w-full h-full"
  />
) : (
  <FusionRingWebsiteCanvas
    soulProfile={activeSectors}
    className="w-full h-full"
  />
)}
```

**Step 5: Verify lint**

Run: `npm run lint`
Expected: Clean

**Step 6: Commit**

```bash
git add src/components/onboarding/SignatureReveal.tsx
git commit -m "feat(AN-signV2): swap SignatureReveal to V2 with feature flag"
```

---

## Task 6: Swap Dashboard mini-ring to V2

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Add imports**

Add after the existing `FusionRingWebsiteCanvas` import (line 14):

```ts
import FusionRingCanvasV2 from "./fusion-ring-website/FusionRingCanvasV2";
import { soulprintToNatalWeights } from "./fusion-ring-website/signatur-bridge";
```

(`isFeatureEnabled` is already imported on line 23.)

**Step 2: Swap the JSX**

Find the mini-ring usage (around line 233):

```tsx
<FusionRingWebsiteCanvas
  soulProfile={profileMeta.soulprintSectors}
  className="w-full h-full"
/>
```

Replace with:

```tsx
{isFeatureEnabled('signatur_engine_v2') ? (
  <FusionRingCanvasV2
    natalWeights={soulprintToNatalWeights(profileMeta.soulprintSectors)}
    isMini={true}
    showUI={false}
    className="w-full h-full"
  />
) : (
  <FusionRingWebsiteCanvas
    soulProfile={profileMeta.soulprintSectors}
    className="w-full h-full"
  />
)}
```

**Step 3: Verify lint**

Run: `npm run lint`
Expected: Clean

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(AN-signV2): swap Dashboard mini-ring to V2 with feature flag"
```

---

## Task 7: Swap FusionRing3D to V2

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx`

This is the most complex swap because FusionRing3D passes `queuedEffect` and `showEffectControls` props that V2 may or may not support. The V2 canvas has its own effect system.

**Step 1: Add imports**

Add after the existing `FusionRingWebsiteCanvas` import (line 8-10):

```ts
import FusionRingCanvasV2 from '@/src/components/fusion-ring-website/FusionRingCanvasV2';
import { soulprintToNatalWeights } from '@/src/components/fusion-ring-website/signatur-bridge';
import { isFeatureEnabled } from '@/src/lib/feature-flags';
```

**Step 2: Swap the JSX**

In the return, find the `<FusionRingWebsiteCanvas>` (lines 101-106):

```tsx
<FusionRingWebsiteCanvas
  queuedEffect={queuedEffect}
  showEffectControls={isInteractive && !!import.meta.env.DEV}
  className="h-full w-full"
  soulProfile={signalData?.baseSignals ?? null}
/>
```

Replace with:

```tsx
{isFeatureEnabled('signatur_engine_v2') ? (
  <FusionRingCanvasV2
    natalWeights={signalData?.baseSignals ? soulprintToNatalWeights(signalData.baseSignals) : undefined}
    showUI={isInteractive}
    className="h-full w-full"
  />
) : (
  <FusionRingWebsiteCanvas
    queuedEffect={queuedEffect}
    showEffectControls={isInteractive && !!import.meta.env.DEV}
    className="h-full w-full"
    soulProfile={signalData?.baseSignals ?? null}
  />
)}
```

Note: V2's effect system is internal (driven by engine emergence), so `queuedEffect` is not passed. The transit overlay effects happen inside the V2 canvas automatically.

**Step 3: Verify lint**

Run: `npm run lint`
Expected: Clean

**Step 4: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "feat(AN-signV2): swap FusionRing3D to V2 with feature flag"
```

---

## Task 8: Full test suite run

**Step 1: Run all tests**

Run: `npm run test`
Expected: All existing tests still pass. New `signatur-bridge.test.ts` passes.

**Step 2: Run lint**

Run: `npm run lint`
Expected: Clean

**Step 3: Fix any failures**

If any test or lint fails, fix before proceeding.

---

## Task 9: Visual Polish (optional, after Tasks 1-8 are stable)

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`

Apply Ben's feedback from the dev brief:

1. **Glow reduction:** Find glow layer params — change `sizeScale` from 0.12 → 0.07, `alphaScale` from 0.6 → 0.25
2. **Bloom:** If Three.js postprocessing is available, add `UnrealBloomPass` with `{ threshold: 0.9, strength: 0.35, radius: 0.4 }`
3. **Saturated colors:** Increase planet color saturation by ~30%
4. **Pattern variety:** Vary the spirograph `d` parameter per planet instead of fixed value

Each sub-item should be a separate commit.

---

## Files Changed Summary

| File | Action | Task |
|------|--------|------|
| `src/components/fusion-ring-website/bazodiac-engine.ts` | CREATE | 1 |
| `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | CREATE | 2 |
| `src/components/fusion-ring-website/signatur-bridge.ts` | CREATE | 3 |
| `src/__tests__/signatur-bridge.test.ts` | CREATE | 3 |
| `src/lib/feature-flags.ts` | MODIFY | 4 |
| `src/components/onboarding/SignatureReveal.tsx` | MODIFY | 5 |
| `src/components/Dashboard.tsx` | MODIFY | 6 |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | MODIFY | 7 |

## Files NOT touched (per dev brief)

- `src/services/experience.ts`
- `src/components/BirthForm.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/AppLayoutContext.tsx`
- `server.mjs`
- `fusion-ring-audio.ts`, `fusion-ring-input.ts`, `fusion-ring-profile.ts`, `fusion-ring-transit.ts`
- `FusionRingWebsiteCanvas.tsx` (kept as V1 fallback)

## Rollback

Set `localStorage.setItem('ff_signatur_engine_v2', 'false')` in browser console → app falls back to V1 everywhere instantly. No deployment needed.

## Branch

Work on `feature/signatur-v2-engine`.
