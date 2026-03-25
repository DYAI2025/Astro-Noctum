# Signatur Bug Root Cause Analysis — S08-01 Preparation

> Generated 2026-03-25 from branch `feature/fusion-ring-integration-v3`

---

## Bug S-SIG-01: Bloom strength overwritten every frame (solar/dissonance modulation lost)

**File:** `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:1079–1085`

**Symptom:** Solar modulation and dissonance fractalBoost have no visible effect on bloom intensity during normal operation. The ring looks the same regardless of active space weather or dissonance state.

**Root cause:** The render loop contains two separate bloom-setting blocks. The first (lines 939–953) correctly reads `solarModulation` and `dissonanceModulation` from `bazStateRef` and scales `bloomPass.strength`. However, the second block (lines 1079–1084) unconditionally overwrites `bloomPass.strength` with a fixed sine-wave formula every frame, after `processEffect()` returns but immediately before `composer.render()`. The second write always wins, rendering the first block a no-op.

```ts
// Block 1 (lines 939-953) — correct, but overwritten before render
bloomPass.strength = lerp(0.4, 0.9, emergenceVal);
// ... solarMod + dissonanceMod applied ...

// Block 2 (lines 1080-1084) — overwrites Block 1 every frame
bloomPass.strength = 1.2 + Math.sin(t * 0.5) * 0.3 * intensityBase;
bloomPass.threshold = 0.2 + Math.sin(t * 0.3) * 0.1;
```

**Proposed fix:** Remove Block 2 entirely. Block 1 already produces a dynamic bloom value (emergence-driven). Apply the time-based pulse as a multiplicative factor there rather than as a separate assignment. The threshold oscillation in Block 2 is also unnecessary and increases overdraw.

---

## Bug S-SIG-02: Audio progress calculation uses wrong unit (seconds vs milliseconds)

**File:** `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:1064`

**Symptom:** Audio sync is off — the `audioIntensity` sine envelope completes far earlier than the visual effect, producing silence during the second half of every effect. For a 4-second effect the audio envelope peaks in ~4 ms and is functionally zero for the remaining duration.

**Root cause:** The effect duration stored in `effectRef.current.duration` is in **seconds**, but the audio progress formula divides by `eff.duration * 1000`, treating it as milliseconds:

```ts
// eff.duration is in seconds (e.g. 4.0)
const progress = Math.min(1, (Date.now() - eff.startTime) / (eff.duration * 1000));
```

`processEffect()` at line 800 correctly uses `elapsed / eff.duration` (both in seconds). The audio block at line 1064 should match that pattern.

**Proposed fix:** Change the audio progress line to:
```ts
const progress = Math.min(1, (Date.now() - eff.startTime) / 1000 / eff.duration);
```

---

## Bug S-SIG-03: GPU resources not disposed on unmount (memory leak)

**File:** `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:1094–1109`

**Symptom:** Repeated mount/unmount of the Signatur page (e.g. navigating away and back) leaks GPU memory. On mobile or low-VRAM devices this causes increasing frame drops or a WebGL context loss after several navigations.

**Root cause:** The `ThreeScene` cleanup function (lines 1094–1109) only calls `renderer.dispose()` and removes the DOM element. It does not dispose:
- `geometry` and its six `BufferAttribute`s (positions, colors, sizes, alphas, layers, phases)
- `particleMat` (ShaderMaterial)
- `dustGeo`, `dustMat`
- `bgGeo`, `bgMat`
- `particleSystem`, `dust`, `bgSphere` (Three.js `Points`/`Mesh` objects)
- Zodiac sprite materials and textures (the `createZodiacRing` function disposes materials when *rebuilding*, but not on final unmount)
- `composer` (EffectComposer)

**Proposed fix:** Extend the cleanup function to explicitly dispose all geometry, materials, and the composer:
```ts
geometry.dispose();
particleMat.dispose();
dustGeo.dispose();
dustMat.dispose();
bgGeo.dispose();
bgMat.dispose();
zodiacSprites.forEach(sprite => { /* existing disposeMaterial logic */ });
composer?.dispose();
```

---

## Bug S-SIG-04: `__fusionRingRebuild` is a global window side-effect with no cleanup

**File:** `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:577`

**Symptom:** When two instances of `FusionRingCanvasV2` are mounted simultaneously (e.g. on the Signatur page during the onboarding `SignatureReveal` phase), only one instance — the most recently mounted — responds to prop changes. The other instance becomes a zombie that never rebuilds its particle signature.

**Root cause:** The scene bridge function is written to the global `window.__fusionRingRebuild` property on every mount:
```ts
(window as any).__fusionRingRebuild = rebuildFromState;
```
A subsequent mount overwrites the reference. The prop-sync effect in the parent component (line 1365) calls this global reference, so only the latest instance ever rebuilds.

**Proposed fix:** Return the rebuild callback from `ThreeScene` via a ref or a provided setter prop rather than using the window global. Example: add `onRebuildReady?: (fn: () => void) => void` to `ThreeScene` props and wire it to a `rebuildRef` in the parent component.

---

## Bug S-SIG-05: `useFusionSignal` — `userId` change does not reset accumulated state

**File:** `src/hooks/useFusionSignal.ts:42–112`

**Symptom:** If a user logs out and another user logs in within the same session, the Signatur ring briefly displays the previous user's signal data while loading the new user's transit state.

**Root cause:** `fetchTransitState` is memoized with `useCallback([userId])`, so it recreates on userId change. However, `hasLoadedRef`, `retryCountRef`, `signalData`, and `events` are *not reset* when `userId` changes. The `useEffect` that runs the poll loop also depends on `fetchTransitState` (which wraps `userId`), but there is no explicit reset of loaded state before the first poll for the new userId completes.

**Proposed fix:** Add a reset block inside the `useEffect` before `void poll()` is called, triggered when `fetchTransitState` changes:
```ts
useEffect(() => {
  mountedRef.current = true;
  // Reset stale state from previous userId
  hasLoadedRef.current = false;
  retryCountRef.current = 0;
  setSignalData(null);
  setEvents([]);
  setError(null);
  setLoading(true);
  // ... rest of effect
}, [fetchTransitState]);
```

---

## Bug S-SIG-06: `quizSectorsToQuizWeights` — sector indices are hardcoded and not validated

**File:** `src/components/fusion-ring-website/signatur-bridge.ts:54–66`

**Symptom:** If the soulprint sectors array has fewer than 10 entries (e.g. a freshly bootstrapped user with partial data), the `discipline` (`sectors[9]`) and `intuition` (`sectors[8]`) dimensions silently fall back to the global `fallback` average. The ring appears with incorrect quiz dimension weighting that is not related to the user's actual profile.

**Root cause:** The function accesses fixed indices (0, 3, 4, 5, 8, 9) into the `sectors` array using `?? fallback`. For a 12-element soulprint this is correct, but no length guard is applied. Additionally, `sectors[4]` is mapped to `creativity` while `sectors[5]` is mapped to `logic`, which corresponds to a specific (undocumented) sector ordering assumption about the Bootstrap API response. A mismatch in that ordering would silently corrupt all quiz dimension weights.

**Proposed fix:** Add an explicit guard and document the assumed sector ordering:
```ts
if (sectors.length < 12) {
  // Return flat defaults; do not silently use partial data
  return { assertion: 0.5, empathy: 0.5, logic: 0.5, intuition: 0.5, creativity: 0.5, discipline: 0.5 };
}
```
Also add a comment documenting which Bootstrap API sector index maps to which astrological domain.

---

## Bug S-SIG-07: `masterSignal` is always `null` — dead placeholder in `useFusionRing`

**File:** `src/hooks/useFusionRing.ts:93–96`

**Symptom:** The `masterSignal` export from `useFusionRing` is consumed by callers but is always `null`. Any downstream component checking `masterSignal` for content will always see an empty state, even when `apiResults` contains full BAFE data.

**Root cause:** The `useMemo` for `masterSignal` contains only a placeholder comment and unconditionally returns `null`:
```ts
const masterSignal: MasterSignal | null = useMemo(() => {
  // Placeholder: Will be connected when birthYear is available in context
  return null;
}, [apiResults, events]);
```
The comment references a dependency (`birthYear`) that is not currently wired from `BirthForm` context, so the implementation was deferred indefinitely. The `masterSignal` field appears in the return value of the hook but carries no real data.

**Proposed fix (S08):** Either wire `birthYear` from `BirthForm` context into `useFusionRing` and implement `buildGCB()` → `computeMasterSignal()` using the existing `src/lib/master-signal/` modules, or remove `masterSignal` from the hook's return type until it is implemented to avoid misleading callers.

---

## Bug S-SIG-08: BUG-04 (tracked) — Postprocessing silent-fail partially surfaced but `onPostProcessDegraded` called twice on Vignette/OutputPass failure

**File:** `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:121–176`

**Symptom:** When postprocessing degrades (most commonly on mobile Safari), the `REDUZIERTER MODUS` banner appears correctly. However, `onPostProcessDegraded()` can be called a second time from the inner try/catch at line 173–175 after the outer try/catch already set the degraded state at line 122–124. In React strict mode (double-invoke), this triggers two state updates calling `setPostProcessDegraded(true)`, which is benign but also means the outer failure (missing EffectComposer) and the inner failure (missing Vignette/OutputPass) are not distinguished in the UI.

**Root cause:** Two separate try/catch blocks each call `onPostProcessDegraded?.()` — the first for the initial bloom import failure, the second for the Vignette/OutputPass failure. There is no flag to prevent double invocation, and the degraded state provided to the UI is binary (true/false) rather than tiered.

**Proposed fix:** Track whether `onPostProcessDegraded` has already been called using a local `degradedFired` flag inside `initScene`. This avoids double state updates. Optionally add a `degradedReason: 'bloom' | 'vignette' | 'output'` parameter to the callback to enable more specific UI messaging.

---

## Bug S-SIG-09: `effectLight1.intensity` double-multiplied during effects

**File:** `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:1071–1073`

**Symptom:** During certain effects (`resonanzsprung`, `korona_eruption`, `burst`), light intensity spikes beyond the intended maximum, causing unintended overexposure on the ring. Most visible at `intensity=1.0` with `korona_eruption` (effectLight1 reaches intensity 16 instead of the authored 4).

**Root cause:** `processEffect()` sets `effectLight1.intensity = amp * N` (e.g. `amp * 4`). Immediately after `processEffect()` returns, the animate loop multiplies again:
```ts
effectLight1.intensity *= effectIntensityMultiplier;  // line 1072
```
`effectIntensityMultiplier` is set to `eff.intensity` (0–1) inside `processEffect()`. So the final intensity is `(amp * N) * eff.intensity`, which double-applies the intensity factor since `amp = ease * eff.intensity` already.

**Proposed fix:** Remove lines 1072–1073 from the animate loop. The intent of `effectIntensityMultiplier` is unclear — `processEffect` already accounts for `eff.intensity` in the `amp` calculation. If a separate global modulation of lights is desired, document and isolate it from the per-effect intensity.

---

## Bug S-SIG-10: `FusionRing3D` passes `queuedEffect` to V1 but not to V2 canvas

**File:** `src/components/fusion-ring-3d/FusionRing3D.tsx:117–134`

**Symptom:** When the V2 engine is active (`signature_engine_v2` flag enabled), transit events from `useFusionSignal` do not trigger visual effects on the ring. The ring is visually inert to incoming transit events unless an external `effectTrigger` prop is passed from the parent page.

**Root cause:** The effect queue in `FusionRing3D` converts transit events to `RingEffectType` via `mapTransitEventToEffect()` and stores the result in `queuedEffect` state. In the V1 branch this is passed directly to `FusionRingWebsiteCanvas` as the `queuedEffect` prop. In the V2 branch, `queuedEffect` is **not forwarded** to `FusionRingCanvasV2` — only the externally-provided `effectTrigger` prop is passed:

```tsx
// V2 branch — queuedEffect is never forwarded
<FusionRingCanvasV2
  natalWeights={v2NatalWeights}
  quizWeights={quizWeights}
  effectTrigger={effectTrigger}   // ← only external trigger; queuedEffect ignored
  ...
/>
```

**Proposed fix:** Map `queuedEffect` to an `effectTrigger`-compatible object and merge it with any externally provided `effectTrigger` before passing to `FusionRingCanvasV2`. The V2 component already accepts `effectTrigger` via `useEffect` at line 1424, so the prop shape is compatible — it just needs a `timestamp` field added from `Date.now()` when `queuedEffect` changes.
