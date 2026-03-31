# Signatur V3 as Default Renderer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the V3 Bipolar Trail engine the default Signatur renderer on all three mount points (FuRingPage, SignatureReveal, Dashboard MiniSignature), with V2 as fallback.

**Architecture:** Add `signature_engine_v3` flag check as primary in `FusionRing3D.tsx` and `SignatureReveal.tsx`. V3 renders via Canvas 2D (lightweight, no device gating needed). V2 remains as fallback via `signature_engine_v2`. Fix the data bridge: V3 needs 6 dimension weights via `soulprintToDimensionWeights()`, not 7 planet weights from `soulprintToNatalWeights()`.

**Tech Stack:** React 19, Canvas 2D, feature-flags.ts, Vitest

---

## Task 1: Fix V3 data bridge in Dashboard MiniSignature

The Dashboard currently passes `soulprintToNatalWeights()` (7 planet keys) to `MiniSignature` → `SignaturV3Canvas`, but V3's `initializePoles()` looks up 6 dimension IDs. The engine silently falls back to 0.5 for all weights — meaning the MiniSignature is running V3 visually but with **no personalized data**.

**Files:**
- Modify: `src/components/Dashboard.tsx:387` (pass dimension weights instead of planet weights)
- Modify: `src/components/dashboard/MiniSignature.tsx:11` (add `dimensionWeights` prop)
- Test: `src/__tests__/signatur-v3-mount.test.ts` (new)

### Step 1: Write the failing test

Create `src/__tests__/signatur-v3-mount.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { soulprintToDimensionWeights } from '@/packages/shared/src/signatur';

describe('V3 data bridge', () => {
  it('soulprintToDimensionWeights returns 6 dimension keys', () => {
    const sectors = [0.8, 0.6, 0.4, 0.7, 0.5, 0.3, 0.9, 0.2, 0.6, 0.4, 0.8, 0.5];
    const result = soulprintToDimensionWeights(sectors);
    const keys = Object.keys(result);
    expect(keys.length).toBe(6);
    // Keys should be dimension IDs, not planet names
    expect(keys.every(k => !['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(k))).toBe(true);
    // All values in [0,1]
    expect(Object.values(result).every(v => v >= 0 && v <= 1)).toBe(true);
  });
});
```

### Step 2: Run test to verify it passes (bridge already exists)

Run: `npx vitest run src/__tests__/signatur-v3-mount.test.ts -v`
Expected: PASS — bridge function exists in shared package

### Step 3: Fix Dashboard to pass dimension weights to MiniSignature

In `src/components/Dashboard.tsx`, add the import and compute dimension weights:

```typescript
// Add to existing imports from signatur-bridge:
import { soulprintToNatalWeights, soulprintToDimensionWeights } from "./fusion-ring-website/signatur-bridge";

// After existing natalWeights computation (search for "soulprintToNatalWeights"), add:
const v3DimensionWeights = useMemo(
  () => profileMeta.soulprintSectors ? soulprintToDimensionWeights(profileMeta.soulprintSectors) : undefined,
  [profileMeta.soulprintSectors],
);
```

Update the MiniSignature JSX to pass dimension weights:

```tsx
<MiniSignature
  natalWeights={v3DimensionWeights}
  quizWeights={{}}
  dayHarmonic={dayHarmonic}
  onExpand={() => navigate('/signatur')}
/>
```

### Step 4: Verify — `npm run lint` clean

Run: `npm run lint`
Expected: clean (no type errors)

### Step 5: Commit

```bash
git add src/components/Dashboard.tsx src/__tests__/signatur-v3-mount.test.ts
git commit -m "fix(signatur): pass 6D dimension weights to MiniSignature V3 (was receiving 7-planet weights)"
```

---

## Task 2: Add V3 rendering cascade to FusionRing3D

Currently `FusionRing3D.tsx:117` checks only `signature_engine_v2`. Add V3 as the primary renderer.

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx`
- Test: `src/__tests__/signatur-v3-mount.test.ts` (extend)

### Step 1: Add V3 imports to FusionRing3D.tsx

At the top of `src/components/fusion-ring-3d/FusionRing3D.tsx`, add:

```typescript
import { lazy, Suspense } from 'react';
import { soulprintToDimensionWeights, quizSectorsToQuizWeights } from '@/src/components/fusion-ring-website/signatur-bridge';

const SignaturV3Canvas = lazy(() => import('@/src/components/signatur-v3/SignaturV3Canvas'));
```

Also import `useDissonance` types:
```typescript
import type { DissonanceResult } from '../../lib/fusion-ring/dissonance';
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
import type { SolarModulation } from '../signatur-v3/bipolar-engine';
```

### Step 2: Add V3-specific props to FusionRing3DProps

Add these optional props to `FusionRing3DProps`:

```typescript
type FusionRing3DProps = {
  // ... existing props ...
  /** External dissonance result for V3 engine */
  externalDissonance?: DissonanceResult | null;
  /** Day harmonic state for V3 engine */
  dayHarmonic?: DayHarmonicState | null;
};
```

### Step 3: Compute V3 weights in the component

Inside the `FusionRing3D` component, add dimension weight computation:

```typescript
const v3DimensionWeights = useMemo(
  () => signalData?.baseSignals ? soulprintToDimensionWeights(signalData.baseSignals) : undefined,
  [signalData?.baseSignals],
);

const v3QuizWeights = useMemo(
  () => quizWeights ? quizWeights : {},
  [quizWeights],
);
```

### Step 4: Replace the render cascade

Replace lines 117–132 in `FusionRing3D.tsx`:

```tsx
{isFeatureEnabled('signature_engine_v3') && v3DimensionWeights ? (
  <Suspense fallback={<div className="h-full w-full bg-black/20" />}>
    <SignaturV3Canvas
      natalWeights={v3DimensionWeights}
      quizWeights={v3QuizWeights}
      dayHarmonic={dayHarmonic ?? undefined}
      externalDissonance={externalDissonance}
      solarModulation={solarModulation ? { ringModulation: solarModulation, maxEventWeight: 0 } : undefined}
      className="h-full w-full"
      quality="auto"
    />
  </Suspense>
) : isFeatureEnabled('signature_engine_v2') ? (
  <FusionRingCanvasV2
    natalWeights={v2NatalWeights}
    quizWeights={quizWeights}
    effectTrigger={effectTrigger}
    solarModulation={solarModulation}
    dissonanceModulation={dissonanceModulation}
    className="h-full w-full"
  />
) : (
  <FusionRingWebsiteCanvas
    queuedEffect={queuedEffect}
    className="h-full w-full"
    soulProfile={signalData?.baseSignals ?? null}
  />
)}
```

**Note:** `solarModulation` in FuRingPage is a `number` but V3 expects `SolarModulation` object `{ ringModulation: number, maxEventWeight: number }`. Wrap accordingly.

### Step 5: Update FuRingPage to pass V3 props

In `src/pages/FuRingPage.tsx`, pass `externalDissonance` and `dayHarmonic` to `FusionRing3D`:

Find the `<FusionRing3D` JSX and add:

```tsx
<FusionRing3D
  userId={userId!}
  labels={labels}
  quizWeights={liveQuizWeights}
  effectTrigger={ringEffect}
  solarModulation={spaceWeather.solarPressure}
  dissonanceModulation={dissonanceModulation}
  externalDissonance={dissonance}
  dayHarmonic={null}
/>
```

### Step 6: Run tests and lint

Run: `npm run lint && npx vitest run src/__tests__/signatur-v3-mount.test.ts -v`
Expected: clean + pass

### Step 7: Commit

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx src/pages/FuRingPage.tsx
git commit -m "feat(signatur): V3 bipolar trails as primary renderer on /signatur, V2 fallback"
```

---

## Task 3: Add V3 rendering cascade to SignatureReveal

Currently `SignatureReveal.tsx:32` checks only `signature_engine_v2`. Add V3 as primary.

**Files:**
- Modify: `src/components/onboarding/SignatureReveal.tsx`

### Step 1: Add V3 imports

At top of `SignatureReveal.tsx`:

```typescript
import { soulprintToDimensionWeights } from '@/src/components/fusion-ring-website/signatur-bridge';

const SignaturV3Canvas = lazy(() => import('@/src/components/signatur-v3/SignaturV3Canvas'));
```

### Step 2: Compute V3 weights

Add after existing `natalWeights` computation:

```typescript
const dimensionWeights = useMemo(() => soulprintToDimensionWeights(sectors), [sectors]);
const neutralDimensionWeights = useMemo(() => soulprintToDimensionWeights(DEFAULT_SECTORS), []);
```

### Step 3: Add V3 flag check

Replace line 32:

```typescript
// BEFORE:
const useV2 = isFeatureEnabled('signature_engine_v2') && canRunV2();

// AFTER:
const useV3 = isFeatureEnabled('signature_engine_v3');
const useV2 = !useV3 && isFeatureEnabled('signature_engine_v2') && canRunV2();
```

### Step 4: Update render cascade

Replace lines 52–65 (the Suspense block):

```tsx
<Suspense fallback={<div className="w-full h-full bg-[#010409]" />}>
  {useV3 ? (
    <SignaturV3Canvas
      natalWeights={revealProgress > 0 ? dimensionWeights : neutralDimensionWeights}
      quizWeights={{}}
      width={200}
      height={200}
      quality="medium"
    />
  ) : useV2 ? (
    <FusionRingCanvasV2
      natalWeights={revealProgress > 0 ? natalWeights : undefined}
      isMini
      revealProgress={revealProgress}
      className="w-full h-full"
    />
  ) : (
    <FusionRingWebsiteCanvas
      soulProfile={revealProgress > 0 ? sectors : DEFAULT_SECTORS}
    />
  )}
</Suspense>
```

### Step 5: Run lint

Run: `npm run lint`
Expected: clean

### Step 6: Commit

```bash
git add src/components/onboarding/SignatureReveal.tsx
git commit -m "feat(signatur): V3 bipolar trails as primary renderer in onboarding, V2 fallback"
```

---

## Task 4: Make V3 canvas responsive (full-size on /signatur)

`SignaturV3Canvas` currently accepts fixed `width`/`height` props (default 500). On `/signatur` it needs to fill the container like V2 does. Add a `fillContainer` mode.

**Files:**
- Modify: `src/components/signatur-v3/SignaturV3Canvas.tsx`

### Step 1: Add ResizeObserver for container fill

Replace the fixed canvas sizing in `SignaturV3Canvas`. Add at the beginning of the component:

```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [size, setSize] = useState({ w: width, h: height });

useEffect(() => {
  if (width && height) {
    setSize({ w: width, h: height });
    return;
  }
  const container = containerRef.current;
  if (!container) return;

  const observer = new ResizeObserver(entries => {
    const entry = entries[0];
    if (entry) {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    }
  });
  observer.observe(container);
  return () => observer.disconnect();
}, [width, height]);
```

Update the config to use `size`:
```typescript
const config = useMemo(
  () => buildConfig(size.w, size.h, quality),
  [size.w, size.h, quality],
);
```

Update all references from `width`/`height` to `size.w`/`size.h` in the render callback.

Wrap the canvas in a container div when no explicit size:
```tsx
return (
  <div ref={containerRef} className={className} style={{ width: width || '100%', height: height || '100%' }}>
    <canvas
      ref={canvasRef}
      style={{
        width: size.w,
        height: size.h,
        background: 'radial-gradient(ellipse at center, #0d0a1a 0%, #050308 100%)',
      }}
    />
  </div>
);
```

### Step 2: Run lint + tests

Run: `npm run lint && npm run test`
Expected: clean + all pass

### Step 3: Commit

```bash
git add src/components/signatur-v3/SignaturV3Canvas.tsx
git commit -m "feat(signatur): make V3 canvas responsive with ResizeObserver for fullscreen mount"
```

---

## Task 5: Full suite verification

### Step 1: Run full test suite

Run: `npm run test`
Expected: ALL PASS

### Step 2: Run lint

Run: `npm run lint`
Expected: clean

### Step 3: Manual verification checklist

1. Open `/signatur` — should show V3 bipolar trails (12 colored poles drawing trails), not V2 (static particle cloud)
2. Open Dashboard — MiniSignature should show V3 with personalized dimension weights
3. Toggle flag in console: `localStorage.setItem('ff_signature_engine_v3', 'false')` → refresh → should fall back to V2 spirograph
4. Toggle both off: `localStorage.setItem('ff_signature_engine_v2', 'false')` → refresh → should fall back to V1 canvas

### Step 4: Final commit if any cleanup needed

If manual testing or lint surfaced issues, fix and commit.
