# Signatur V2 Code Review Bugfixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all Critical, High, and Medium bugs found in code review of PR #88, organized into 3 sprints with cross-cutting optimizations.

**Architecture:** Sprint 1 fixes the most dangerous bugs in `FusionRingCanvasV2.tsx` (rebuild bridge, disposal, deps) plus the related `test-signal.ts` guard. Sprint 2 fixes integration-point issues in Dashboard and FusionRing3D. Sprint 3 addresses remaining medium issues.

**Tech Stack:** React 19, Three.js, Vitest, TypeScript

---

## Sprint 1: Critical + Related Canvas Fixes

All in `FusionRingCanvasV2.tsx` + `test-signal.ts`. One editing pass, one commit.

### Task 1: Fix C1 — `__fusionRingRebuild` stored on wrong object

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:539`

**Step 1: Fix the rebuild bridge**

At line 539, the rebuild function is stored on `renderer.domElement` but read from `window` at lines 1316 and 1327. Store it on `window` to match:

```ts
// Line 539 — BEFORE:
(renderer.domElement as any).__fusionRingRebuild = rebuildFromState;

// Line 539 — AFTER:
(window as any).__fusionRingRebuild = rebuildFromState;
```

Also clean up the global in the cleanup function (add before `renderer.dispose()` at line 1034):

```ts
delete (window as any).__fusionRingRebuild;
```

**Verify:** `npm run lint`

---

### Task 2: Fix H1 — `revealProgress` in useEffect deps causes full scene rebuild

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:1043, 89-94`

**Step 1: Add a ref for revealProgress inside ThreeScene**

The `ThreeScene` function (line 89) receives `revealProgress` as a prop. Instead of putting it in the useEffect deps, use a ref:

Add after line 96 (`const canvasRef = useRef<HTMLDivElement>(null);`):

```ts
const revealRef = useRef(revealProgress);
useEffect(() => { revealRef.current = revealProgress; }, [revealProgress]);
```

**Step 2: Use the ref inside the animation loop**

Find where `revealProgress` is used inside the useEffect (search for `uReveal` or `revealProgress`). It's used in the animation loop to set `particleUniforms.uReveal.value`. Change that line from reading the closure variable to reading the ref:

```ts
// BEFORE (wherever revealProgress is used in the animate function):
particleUniforms.uReveal.value = revealProgress;

// AFTER:
particleUniforms.uReveal.value = revealRef.current;
```

**Step 3: Remove revealProgress and isMini from useEffect deps**

```ts
// Line 1043 — BEFORE:
}, [revealProgress, isMini]);

// AFTER:
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

`isMini` only affects pointer events on the wrapper div (line 1051), which is already outside this useEffect.

**Verify:** `npm run lint`

---

### Task 3: Fix H2 + M1 — Three.js resource disposal + zodiac sprite leak

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:1023-1038, 316-319`

**Step 1: Fix zodiac sprite disposal (M1)**

In `createZodiacRing()` (line 316-319), dispose old sprites before removing them:

```ts
// Lines 317-319 — BEFORE:
zodiacSprites.forEach(s => ringGroup.remove(s));
zodiacSprites.length = 0;

// AFTER:
zodiacSprites.forEach(s => {
  ringGroup.remove(s);
  if (s.material instanceof THREE.SpriteMaterial) {
    s.material.map?.dispose();
    s.material.dispose();
  }
});
zodiacSprites.length = 0;
```

**Step 2: Add full resource disposal in cleanup (H2)**

Replace the cleanup function (lines 1023-1038) with:

```ts
return () => {
  disposed = true;
  cancelAnimationFrame(frameId);

  // Remove event listeners
  el.removeEventListener('wheel', onWheel);
  el.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  el.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
  window.removeEventListener('resize', onResize);

  // Clean up global rebuild bridge
  delete (window as any).__fusionRingRebuild;

  // Dispose zodiac sprites
  zodiacSprites.forEach(s => {
    if (s.material instanceof THREE.SpriteMaterial) {
      s.material.map?.dispose();
      s.material.dispose();
    }
  });

  // Dispose particle system
  geometry.dispose();
  particleMat.dispose();

  // Dispose dust layer
  if (dustGeo) dustGeo.dispose();
  if (dustMat) dustMat.dispose();

  // Dispose sky sphere
  if (bgGeo) bgGeo.dispose();
  if (bgMat) bgMat.dispose();

  // Dispose composer and render targets
  if (composer) {
    composer.renderTarget1?.dispose();
    composer.renderTarget2?.dispose();
  }

  // Dispose renderer and remove from DOM
  renderer.dispose();
  if (canvasRef.current?.contains?.(renderer.domElement)) {
    canvasRef.current.removeChild(renderer.domElement);
  }
};
```

Note: `dustGeo`, `dustMat`, `bgGeo`, `bgMat` — find these variable names in the file. They are defined where ambient dust and sky sphere are created. If the variable names differ, use the actual names from the file.

**Verify:** `npm run lint`

---

### Task 4: Fix C2 — `event.payload.tags` missing optional chaining

**Files:**
- Modify: `src/lib/fusion-ring/test-signal.ts:37-38`

**Step 1: Add optional chaining**

```ts
// Line 37-38 — BEFORE:
if (event.payload.tags) {
    for (const tag of event.payload.tags) {

// AFTER:
if (event.payload?.tags) {
    for (const tag of event.payload.tags) {
```

**Verify:** `npx vitest run src/__tests__/fusion-ring.test.ts`

---

### Task 5: Commit Sprint 1

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/lib/fusion-ring/test-signal.ts
git commit -m "fix(AN-signV2): critical canvas fixes — rebuild bridge, disposal, deps, tags guard"
```

---

## Sprint 2: Integration Points

### Task 6: Fix H3 — Dashboard `soulprintToNatalWeights` inline

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Add useMemo import if not present**

Check if `useMemo` is already imported from React at line 1. If not, add it:

```ts
import { useState, useEffect, useMemo } from "react";
```

**Step 2: Create memoized weights**

Inside the Dashboard component function, before the JSX return, add:

```ts
const v2NatalWeights = useMemo(
  () => profileMeta.soulprintSectors ? soulprintToNatalWeights(profileMeta.soulprintSectors) : undefined,
  [profileMeta.soulprintSectors]
);
```

**Step 3: Use memoized value in JSX**

```ts
// Line 237 — BEFORE:
natalWeights={soulprintToNatalWeights(profileMeta.soulprintSectors)}

// AFTER:
natalWeights={v2NatalWeights}
```

**Verify:** `npm run lint`

---

### Task 7: Fix H4 — FusionRing3D `soulprintToNatalWeights` inline

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx`

**Step 1: Add useMemo import if not present**

Line 1 already imports `useMemo`. Good.

**Step 2: Create memoized weights**

Inside the `FusionRing3D` component, after `const { kpIndex } = useSpaceWeather();` (line 69), add:

```ts
const v2NatalWeights = useMemo(
  () => signalData?.baseSignals ? soulprintToNatalWeights(signalData.baseSignals) : undefined,
  [signalData?.baseSignals]
);
```

**Step 3: Use memoized value in JSX**

```ts
// Line ~106 — BEFORE:
natalWeights={signalData?.baseSignals ? soulprintToNatalWeights(signalData.baseSignals) : undefined}

// AFTER:
natalWeights={v2NatalWeights}
```

**Verify:** `npm run lint`

---

### Task 8: Fix H5 — Add error boundary around Dashboard V2 widget

**Files:**
- Modify: `src/components/Dashboard.tsx:228-250`

**Step 1: Wrap the Signatur widget**

The widget is at lines 228-250. `SectionErrorBoundary` is already imported (line 22). Wrap the block:

```tsx
// BEFORE (line 228-250):
{/* ═══ PERSISTENT SIGNATURE WIDGET ═══════════════════════════════ */}
{profileMeta.soulprintSectors && (
  <motion.div ...>
    ...
  </motion.div>
)}

// AFTER:
{/* ═══ PERSISTENT SIGNATURE WIDGET ═══════════════════════════════ */}
<SectionErrorBoundary name="Signatur">
  {profileMeta.soulprintSectors && (
    <motion.div ...>
      ...
    </motion.div>
  )}
</SectionErrorBoundary>
```

**Verify:** `npm run lint`

---

### Task 9: Commit Sprint 2

```bash
git add src/components/Dashboard.tsx src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "fix(AN-signV2): memoize weights, add error boundary for Dashboard V2"
```

---

## Sprint 3: Medium Issues

### Task 10: Fix M3 — className vs inline style

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:1045-1053`

**Step 1: Restructure the wrapper div**

The outer component `FusionRingCanvas` (line 1408) already applies `className` to its wrapper `<div>`. The `ThreeScene` inner component (line 1045-1053) has inline styles that override className dimensions. Since `ThreeScene` is always wrapped by `FusionRingCanvas`, the fix is to remove dimensions from `ThreeScene`'s inline style and let the parent control size:

```ts
// Lines 1045-1053 — BEFORE:
return (
  <div
    ref={canvasRef}
    style={{
      width: '100%',
      height: '100%',
      pointerEvents: isMini ? 'none' : 'auto',
    }}
  />
);

// AFTER:
return (
  <div
    ref={canvasRef}
    style={{
      width: '100%',
      height: '100%',
      pointerEvents: isMini ? 'none' : 'auto',
      position: 'relative',
    }}
  />
);
```

Actually this is fine as-is — `ThreeScene` is an internal component that should always fill its parent. The `className` on the outer `FusionRingCanvas` div controls the actual dimensions. No change needed.

**Decision: Skip M3** — the architecture is correct. `className` on the outer wrapper controls size, inner `ThreeScene` fills it with 100%.

---

### Task 11: Fix M4 — Update dev brief flag name

**Files:**
- Modify: `DEV_BRIEF_SIGNATUR_V2_INTEGRATION.md`

**Step 1: Replace all occurrences of `signatur_engine_v2` with `signature_engine_v2`**

Search and replace in the dev brief:
- `signatur_engine_v2` → `signature_engine_v2`
- `ff_signatur_engine_v2` → `ff_signature_engine_v2`

**Verify:** Manual review

---

### Task 12: Commit Sprint 3

```bash
git add DEV_BRIEF_SIGNATUR_V2_INTEGRATION.md
git commit -m "docs(AN-signV2): fix flag name in dev brief to match implementation"
```

---

### Task 13: Full test suite + lint

**Step 1:** Run `npm run test`
Expected: 451/452 pass (same pre-existing api-routes failure)

**Step 2:** Run `npm run lint`
Expected: Clean

**Step 3:** Push

```bash
git push
```

---

## Summary

| Sprint | Bugs Fixed | Files Changed |
|--------|-----------|---------------|
| 1 | C1, C2, H1, H2, M1 | `FusionRingCanvasV2.tsx`, `test-signal.ts` |
| 2 | H3, H4, H5 | `Dashboard.tsx`, `FusionRing3D.tsx` |
| 3 | M4 | `DEV_BRIEF_SIGNATUR_V2_INTEGRATION.md` |
| Skip | M2 (perf), M3 (non-issue) | — |

**M2 (35K CPU iteration)** is deferred — requires shader refactoring which is a separate task, not a bug.
