# Dissonance Coefficient — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a three-layer dissonance system to the Bazodiac Signatur engine that measures how a new quiz input "resonates" against the user's existing profile, and translates that tension into coherent visual changes — geometry, complexity, and texture.

**Architecture:** Three dissonance values (d_natal, d_accumulated, d_elemental) are computed as vector distances against layered baselines. Each value modulates a distinct visual channel in FusionRingCanvasV2: spirograph geometry, fractal/emergence complexity, and particle vibration texture. The system uses the existing `computeWeights()` → `computeSpiroParams()` pipeline — no new rendering engine needed.

**Tech Stack:** TypeScript, Three.js (via FusionRingCanvasV2), existing bazodiac-engine.ts, wuxing-cycles.ts (Sheng/Ke detection), Supabase (persistence)

**Upgrade Path to Full Cymatics (Future):** The dissonance interface (`DissonanceResult`) is designed so Ansatz C (frequency-based beat detection) can replace the vector math without changing consumers. The visual modulation layer stays identical.

---

## Phase 1: Dissonance Math Engine

### Task 1: DissonanceResult Type + computeDissonance() Function

**Files:**
- Create: `src/lib/fusion-ring/dissonance.ts`
- Test: `src/__tests__/dissonance.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/dissonance.test.ts
import { describe, it, expect } from 'vitest';
import { computeDissonance, type DissonanceResult } from '../lib/fusion-ring/dissonance';

describe('computeDissonance', () => {
  const natal = { Sun: 0.9, Moon: 0.4, Mercury: 0.5, Venus: 0.3, Mars: 0.7, Jupiter: 0.6, Saturn: 0.4 };

  it('returns zero dissonance when current equals natal and no accumulated', () => {
    const result = computeDissonance(natal, natal, null, {});
    expect(result.d_natal).toBeCloseTo(0, 2);
    expect(result.d_accumulated).toBeCloseTo(0, 2);
    expect(result.intensity).toBeCloseTo(0, 1);
  });

  it('returns high d_natal when current differs strongly from natal', () => {
    const shifted = { Sun: 0.2, Moon: 0.9, Mercury: 0.5, Venus: 0.8, Mars: 0.1, Jupiter: 0.6, Saturn: 0.4 };
    const result = computeDissonance(natal, shifted, null, {});
    expect(result.d_natal).toBeGreaterThan(0.5);
  });

  it('returns d_elemental with sheng/ke classification', () => {
    // Water-dominant user getting Fire-heavy quiz result
    const wuxinBefore = { Wood: 0.2, Fire: 0.1, Earth: 0.3, Metal: 0.2, Water: 0.8 };
    const wuxinAfter = { Wood: 0.2, Fire: 0.7, Earth: 0.3, Metal: 0.2, Water: 0.5 };
    const result = computeDissonance(natal, natal, null, wuxinBefore, wuxinAfter);
    expect(result.d_elemental.magnitude).toBeGreaterThan(0);
    expect(result.d_elemental.type).toBe('ke'); // Water controls Fire = Ke tension
  });

  it('intensity is bounded [0, 1]', () => {
    const extreme = { Sun: 0.0, Moon: 1.0, Mercury: 0.0, Venus: 1.0, Mars: 0.0, Jupiter: 1.0, Saturn: 0.0 };
    const result = computeDissonance(natal, extreme, null, {});
    expect(result.intensity).toBeGreaterThanOrEqual(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dissonance.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/lib/fusion-ring/dissonance.ts

import { CONTROL_CYCLE, GENERATION_CYCLE } from '../astro-data/wuxing-cycles';
import { clamp } from '../../components/fusion-ring-website/bazodiac-engine';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ElementalDissonance {
  /** 0–1 magnitude of elemental tension */
  magnitude: number;
  /** 'sheng' = generation cycle disrupted (organic), 'ke' = control cycle (crystalline), 'neutral' = no elemental tension */
  type: 'sheng' | 'ke' | 'neutral';
  /** Which elements are in tension [dominant, controller/feeder] */
  pair: [string, string] | null;
}

export interface DissonanceResult {
  /** 0–1: Distance between current weights and natal baseline */
  d_natal: number;
  /** 0–1: Distance between current weights and accumulated profile (0 if no history) */
  d_accumulated: number;
  /** Elemental tension with Sheng/Ke classification */
  d_elemental: ElementalDissonance;
  /** 0–1: Combined intensity score (for quick checks) */
  intensity: number;
}

// ─── Planet Weight Vector ─────────────────────────────────────────────────

type WeightVector = Record<string, number>;

const PLANET_IDS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

/** Euclidean distance between two 7D weight vectors, normalized to [0, 1] */
function vectorDistance(a: WeightVector, b: WeightVector): number {
  let sumSq = 0;
  for (const id of PLANET_IDS) {
    const diff = (a[id] ?? 0.5) - (b[id] ?? 0.5);
    sumSq += diff * diff;
  }
  // Max possible distance: sqrt(7 * 1^2) ≈ 2.646
  return clamp(Math.sqrt(sumSq) / 2.646, 0, 1);
}

// ─── Elemental Dissonance ─────────────────────────────────────────────────

const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

function computeElementalDissonance(
  wuxinBefore?: Record<string, number>,
  wuxinAfter?: Record<string, number>,
): ElementalDissonance {
  if (!wuxinBefore || !wuxinAfter) {
    return { magnitude: 0, type: 'neutral', pair: null };
  }

  // Find biggest elemental shift
  let maxShiftElement = '';
  let maxShift = 0;
  for (const el of ELEMENTS) {
    const shift = Math.abs((wuxinAfter[el] ?? 0) - (wuxinBefore[el] ?? 0));
    if (shift > maxShift) {
      maxShift = shift;
      maxShiftElement = el;
    }
  }

  if (maxShift < 0.05) {
    return { magnitude: 0, type: 'neutral', pair: null };
  }

  // Check if the shift activates a Ke (control) relationship
  for (const edge of CONTROL_CYCLE) {
    const isController = edge.from === maxShiftElement;
    const isControlled = edge.to === maxShiftElement;
    if (isController || isControlled) {
      const otherEl = isController ? edge.to : edge.from;
      const otherVal = wuxinAfter[otherEl] ?? 0;
      const shiftVal = wuxinAfter[maxShiftElement] ?? 0;
      // Ke tension: both elements are active (> 0.3) and one is shifting
      if (otherVal > 0.3 && shiftVal > 0.3) {
        return {
          magnitude: clamp(maxShift * 1.5, 0, 1),
          type: 'ke',
          pair: [isController ? maxShiftElement : otherEl, isControlled ? maxShiftElement : otherEl],
        };
      }
    }
  }

  // Check Sheng (generation) cycle disruption
  for (const edge of GENERATION_CYCLE) {
    if (edge.from === maxShiftElement || edge.to === maxShiftElement) {
      return {
        magnitude: clamp(maxShift * 1.2, 0, 1),
        type: 'sheng',
        pair: [edge.from, edge.to],
      };
    }
  }

  return { magnitude: clamp(maxShift, 0, 1), type: 'neutral', pair: null };
}

// ─── Main Function ────────────────────────────────────────────────────────

/**
 * Compute three-layer dissonance between a user's profiles.
 *
 * @param natal       - Pure natal weights (from birth data, never changes)
 * @param current     - Current planet weights (after latest quiz modulation)
 * @param accumulated - Previous accumulated weights (before this quiz). Null for first quiz.
 * @param wuxinBefore - Wu-Xing element balance before quiz (optional)
 * @param wuxinAfter  - Wu-Xing element balance after quiz (optional)
 */
export function computeDissonance(
  natal: WeightVector,
  current: WeightVector,
  accumulated: WeightVector | null,
  wuxinBefore: Record<string, number>,
  wuxinAfter?: Record<string, number>,
): DissonanceResult {
  const d_natal = vectorDistance(natal, current);
  const d_accumulated = accumulated ? vectorDistance(accumulated, current) : 0;
  const d_elemental = computeElementalDissonance(wuxinBefore, wuxinAfter);

  // Combined intensity: weighted blend (natal baseline is most important)
  const intensity = clamp(
    d_natal * 0.4 + d_accumulated * 0.35 + d_elemental.magnitude * 0.25,
    0,
    1,
  );

  return { d_natal, d_accumulated, d_elemental, intensity };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/dissonance.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/fusion-ring/dissonance.ts src/__tests__/dissonance.test.ts
git commit -m "feat(signatur): add three-layer dissonance coefficient engine"
```

---

### Task 2: Visual Modulation Parameters

**Files:**
- Create: `src/lib/fusion-ring/dissonance-visual.ts`
- Test: `src/__tests__/dissonance-visual.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/dissonance-visual.test.ts
import { describe, it, expect } from 'vitest';
import { computeVisualModulation, type VisualModulation } from '../lib/fusion-ring/dissonance-visual';
import type { DissonanceResult } from '../lib/fusion-ring/dissonance';

describe('computeVisualModulation', () => {
  const zero: DissonanceResult = {
    d_natal: 0, d_accumulated: 0,
    d_elemental: { magnitude: 0, type: 'neutral', pair: null },
    intensity: 0,
  };

  it('returns neutral modulation at zero dissonance', () => {
    const mod = computeVisualModulation(zero);
    expect(mod.geometrySkew).toBeCloseTo(0);
    expect(mod.fractalBoost).toBeCloseTo(0);
    expect(mod.vibrationAmplitude).toBeCloseTo(0);
  });

  it('geometry skew increases with d_natal', () => {
    const high: DissonanceResult = { ...zero, d_natal: 0.8, intensity: 0.5 };
    const mod = computeVisualModulation(high);
    expect(mod.geometrySkew).toBeGreaterThan(0.3);
  });

  it('ke dissonance produces angular vibration pattern', () => {
    const ke: DissonanceResult = {
      ...zero,
      d_elemental: { magnitude: 0.7, type: 'ke', pair: ['Water', 'Fire'] },
      intensity: 0.5,
    };
    const mod = computeVisualModulation(ke);
    expect(mod.vibrationStyle).toBe('angular');
  });

  it('sheng dissonance produces organic vibration pattern', () => {
    const sheng: DissonanceResult = {
      ...zero,
      d_elemental: { magnitude: 0.7, type: 'sheng', pair: ['Wood', 'Fire'] },
      intensity: 0.5,
    };
    const mod = computeVisualModulation(sheng);
    expect(mod.vibrationStyle).toBe('organic');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dissonance-visual.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/fusion-ring/dissonance-visual.ts

import { clamp, lerp } from '../../components/fusion-ring-website/bazodiac-engine';
import type { DissonanceResult } from './dissonance';

export interface VisualModulation {
  // ── Layer 1: Geometry (d_natal) ──
  /** 0–1: How much to skew spirograph symmetry. 0 = perfect symmetry. */
  geometrySkew: number;
  /** Additive offset to spirograph pen distance (d param) */
  penDistanceShift: number;

  // ── Layer 2: Complexity (d_accumulated) ──
  /** 0–1: Boost to fractal depth (added to weight-based fractalDepth) */
  fractalBoost: number;
  /** 0–1: Emergence bridge activation boost */
  emergenceBoost: number;
  /** Tier shift: 0 = no change, 1 = push more planets into higher tiers */
  tierPressure: number;

  // ── Layer 3: Texture (d_elemental) ──
  /** 0–1: Particle vibration amplitude */
  vibrationAmplitude: number;
  /** 'organic' = smooth sinusoidal, 'angular' = sharp sawtooth, 'neutral' = none */
  vibrationStyle: 'organic' | 'angular' | 'neutral';
  /** Color temperature shift: -1 = cool (ke), 0 = neutral, +1 = warm (sheng) */
  colorTempShift: number;
  /** 0–1: Particle flicker rate (ke = high, sheng = low) */
  flickerRate: number;
}

export function computeVisualModulation(d: DissonanceResult): VisualModulation {
  // Layer 1: Geometry ← d_natal
  const geometrySkew = clamp(d.d_natal * 0.8, 0, 1);
  const penDistanceShift = lerp(0, 0.4, d.d_natal);

  // Layer 2: Complexity ← d_accumulated
  const fractalBoost = clamp(d.d_accumulated * 0.6, 0, 1);
  const emergenceBoost = clamp(d.d_accumulated * 0.5, 0, 1);
  const tierPressure = clamp(d.d_accumulated * 0.4, 0, 1);

  // Layer 3: Texture ← d_elemental
  const el = d.d_elemental;
  const vibrationAmplitude = clamp(el.magnitude * 0.7, 0, 1);

  let vibrationStyle: 'organic' | 'angular' | 'neutral';
  let colorTempShift: number;
  let flickerRate: number;

  switch (el.type) {
    case 'ke':
      vibrationStyle = 'angular';
      colorTempShift = -el.magnitude; // cool/crystalline
      flickerRate = lerp(0.3, 0.8, el.magnitude);
      break;
    case 'sheng':
      vibrationStyle = 'organic';
      colorTempShift = el.magnitude; // warm/flowing
      flickerRate = lerp(0, 0.2, el.magnitude);
      break;
    default:
      vibrationStyle = 'neutral';
      colorTempShift = 0;
      flickerRate = 0;
  }

  return {
    geometrySkew,
    penDistanceShift,
    fractalBoost,
    emergenceBoost,
    tierPressure,
    vibrationAmplitude,
    vibrationStyle,
    colorTempShift,
    flickerRate,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/dissonance-visual.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/fusion-ring/dissonance-visual.ts src/__tests__/dissonance-visual.test.ts
git commit -m "feat(signatur): add visual modulation layer for dissonance → geometry/complexity/texture"
```

---

## Phase 2: Engine Integration

### Task 3: Extend bazodiac-engine.ts with Modulation Hooks

**Files:**
- Modify: `src/components/fusion-ring-website/bazodiac-engine.ts`
- Test: `src/__tests__/dissonance.test.ts` (extend)

This task adds optional `VisualModulation` parameter to `computeSpiroParams()` and `generatePlanetParticles()` so they can be modulated by dissonance without breaking existing callers.

**Step 1: Write the failing test**

```typescript
// Add to src/__tests__/dissonance.test.ts

import { computeSpiroParams, generatePlanetParticles, PLANETS } from '../components/fusion-ring-website/bazodiac-engine';
import type { VisualModulation } from '../lib/fusion-ring/dissonance-visual';

describe('bazodiac-engine modulation', () => {
  const highSkew: Partial<VisualModulation> = {
    geometrySkew: 0.8,
    penDistanceShift: 0.3,
  };

  it('computeSpiroParams accepts optional modulation', () => {
    const base = computeSpiroParams(126.22);
    const modulated = computeSpiroParams(126.22, true, highSkew as VisualModulation);
    // Pen distance should differ
    expect(modulated.d).not.toBeCloseTo(base.d, 1);
  });

  it('generatePlanetParticles accepts optional modulation', () => {
    const sun = PLANETS[0]!;
    // Should not throw
    const particles = generatePlanetParticles(sun, 0.8, 2.0, 0.1, {
      vibrationAmplitude: 0.5,
      vibrationStyle: 'angular',
    } as VisualModulation);
    expect(particles.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dissonance.test.ts`
Expected: FAIL — signature mismatch

**Step 3: Modify bazodiac-engine.ts**

Add optional `modulation` parameter to `computeSpiroParams`:

```typescript
// In computeSpiroParams, add 3rd parameter:
export function computeSpiroParams(hz: number, harmLock = true, modulation?: VisualModulation): SpiroParams {
  // ... existing logic ...

  // Apply geometry modulation if present
  if (modulation) {
    // Skew symmetry: offset n slightly for asymmetry
    // (don't change n itself — that breaks the spirograph — instead skew pen distance and r ratio)
    d = d + (modulation.penDistanceShift ?? 0);
    // Asymmetric r-ratio: breaks perfect symmetry proportional to geometrySkew
    const skew = modulation.geometrySkew ?? 0;
    r = r * (1 + (skew * 0.15)); // subtle — 15% max deviation
  }

  return { kind, R, r, d, n, turns, harmLock };
}
```

Add optional `modulation` parameter to `generatePlanetParticles`:

```typescript
export function generatePlanetParticles(
  planet: PlanetDef,
  weight: number,
  maxR: number,
  budgetMultiplier: number = 1.0,
  modulation?: VisualModulation,
): BazParticle[] {
  // ... existing logic ...

  // At particle creation, add vibration data to phase/velocity if modulation present
  // (actual vibration is applied in the render loop, not here — we just tag particles)
}
```

**Important:** The existing API is preserved — `modulation` is optional, defaulting to `undefined` which means zero modulation. No existing callers break.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/dissonance.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm run test`
Expected: All 590+ tests pass (no regression)

**Step 6: Commit**

```bash
git add src/components/fusion-ring-website/bazodiac-engine.ts src/__tests__/dissonance.test.ts
git commit -m "feat(signatur): extend engine with optional visual modulation hooks"
```

---

### Task 4: Wire Dissonance into useQuizContribution

**Files:**
- Modify: `src/hooks/useQuizContribution.ts`
- Modify: `src/hooks/useFusionSignal.ts` (add dissonance to signal data)
- Create: `src/hooks/useDissonance.ts` (React hook wrapping computeDissonance)

**Step 1: Create useDissonance hook**

```typescript
// src/hooks/useDissonance.ts
import { useMemo } from 'react';
import { computeDissonance, type DissonanceResult } from '../lib/fusion-ring/dissonance';
import { computeVisualModulation, type VisualModulation } from '../lib/fusion-ring/dissonance-visual';

interface UseDissonanceProps {
  natalWeights: Record<string, number> | null;
  currentWeights: Record<string, number> | null;
  previousWeights: Record<string, number> | null;
  wuxinBalance?: Record<string, number>;
  previousWuxinBalance?: Record<string, number>;
}

export interface DissonanceState {
  dissonance: DissonanceResult | null;
  modulation: VisualModulation | null;
}

export function useDissonance({
  natalWeights,
  currentWeights,
  previousWeights,
  wuxinBalance,
  previousWuxinBalance,
}: UseDissonanceProps): DissonanceState {
  return useMemo(() => {
    if (!natalWeights || !currentWeights) {
      return { dissonance: null, modulation: null };
    }
    const dissonance = computeDissonance(
      natalWeights,
      currentWeights,
      previousWeights,
      wuxinBalance ?? {},
      previousWuxinBalance,
    );
    const modulation = computeVisualModulation(dissonance);
    return { dissonance, modulation };
  }, [natalWeights, currentWeights, previousWeights, wuxinBalance, previousWuxinBalance]);
}
```

**Step 2: Wire into FusionRingCanvasV2 via props**

The `VisualModulation` object gets passed through the existing prop chain:
`FuRingPage` → `FusionRing3D` → `FusionRingCanvasV2`

Add `modulation?: VisualModulation` prop to FusionRingCanvasV2. In the render loop, apply:
- `geometrySkew` + `penDistanceShift` when calling `computeSpiroParams()`
- `vibrationAmplitude` + `vibrationStyle` in the particle animation `useFrame()` callback
- `colorTempShift` to particle color HSL adjustment
- `flickerRate` to particle alpha oscillation speed

**Step 3: Commit**

```bash
git add src/hooks/useDissonance.ts
git commit -m "feat(signatur): add useDissonance hook for React integration"
```

---

## Phase 3: Real-Time Morph Animation

### Task 5: Morph Transition System

**Files:**
- Create: `src/lib/fusion-ring/dissonance-morph.ts`
- Test: `src/__tests__/dissonance-morph.test.ts`

**Concept:** When a quiz completes, the dissonance values change. Instead of jumping to the new state, we lerp over ~2 seconds with easing that depends on intensity:
- Low intensity: gentle ease-out (~1s)
- High intensity: dramatic ease with overshoot (~2.5s)
- Ke dissonance: sharp attack, slow decay
- Sheng dissonance: slow attack, smooth resolve

```typescript
// src/lib/fusion-ring/dissonance-morph.ts

import { lerp, clamp } from '../../components/fusion-ring-website/bazodiac-engine';
import type { VisualModulation } from './dissonance-visual';

export interface MorphState {
  /** Current interpolated modulation */
  current: VisualModulation;
  /** Is morph still in progress */
  active: boolean;
  /** 0–1 progress */
  progress: number;
}

export function lerpModulation(a: VisualModulation, b: VisualModulation, t: number): VisualModulation {
  return {
    geometrySkew: lerp(a.geometrySkew, b.geometrySkew, t),
    penDistanceShift: lerp(a.penDistanceShift, b.penDistanceShift, t),
    fractalBoost: lerp(a.fractalBoost, b.fractalBoost, t),
    emergenceBoost: lerp(a.emergenceBoost, b.emergenceBoost, t),
    tierPressure: lerp(a.tierPressure, b.tierPressure, t),
    vibrationAmplitude: lerp(a.vibrationAmplitude, b.vibrationAmplitude, t),
    vibrationStyle: t < 0.5 ? a.vibrationStyle : b.vibrationStyle,
    colorTempShift: lerp(a.colorTempShift, b.colorTempShift, t),
    flickerRate: lerp(a.flickerRate, b.flickerRate, t),
  };
}

/** Easing based on dissonance type */
export function dissonanceEase(t: number, style: 'organic' | 'angular' | 'neutral'): number {
  switch (style) {
    case 'angular':
      // Sharp attack, slow decay (like ke = sudden crystalline)
      return t < 0.3 ? t / 0.3 : 1 - (1 - t) * (1 - t) * (1 - t);
    case 'organic':
      // Smooth S-curve (like sheng = flowing)
      return t * t * (3 - 2 * t);
    default:
      // Standard ease-out
      return 1 - (1 - t) * (1 - t);
  }
}

/** Duration in ms based on intensity */
export function morphDuration(intensity: number): number {
  return lerp(800, 2500, clamp(intensity, 0, 1));
}
```

**Step 4: Commit**

```bash
git add src/lib/fusion-ring/dissonance-morph.ts src/__tests__/dissonance-morph.test.ts
git commit -m "feat(signatur): add morph transition system with dissonance-aware easing"
```

---

### Task 6: Apply Modulation in FusionRingCanvasV2 Render Loop

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`

This is the visual integration point. In the `useFrame()` animation callback:

1. **Geometry modulation** (d_natal): When regenerating particles after a weight change, pass `modulation` to `computeSpiroParams()`. The `geometrySkew` offsets the pen-to-wheel ratio, creating visible asymmetry.

2. **Complexity modulation** (d_accumulated): Boost `fractalDepth()` return value by `fractalBoost`. Increase emergence bridge activation threshold by `emergenceBoost`.

3. **Texture modulation** (d_elemental): Per-frame particle animation:
   - `angular` vibration: sawtooth displacement `= amp * (2 * frac(t * flickerRate) - 1)`
   - `organic` vibration: sinusoidal displacement `= amp * sin(t * flickerRate * TAU)`
   - `colorTempShift`: Shift particle hue toward warm (+ shift) or cool (- shift)

4. **Morph interpolation**: Use `lerpModulation()` + `dissonanceEase()` to smoothly transition between old and new modulation states.

**Commit:**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx
git commit -m "feat(signatur): integrate dissonance modulation into V2 render loop"
```

---

## Phase 4: Persistence + Premium

### Task 7: Store Dissonance Values in Supabase

**Files:**
- Create: `supabase-migrations/20260324_dissonance_state.sql`
- Modify: `src/services/supabase.ts` (add upsert/fetch for dissonance)

**Migration:**

```sql
-- Add dissonance columns to astro_profiles
ALTER TABLE astro_profiles
  ADD COLUMN IF NOT EXISTS natal_weights JSONB,
  ADD COLUMN IF NOT EXISTS accumulated_weights JSONB,
  ADD COLUMN IF NOT EXISTS dissonance_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS quiz_count INTEGER DEFAULT 0;
```

`dissonance_snapshot` stores the latest `DissonanceResult` as JSON. Updated on each quiz completion. Read on profile load to restore visual state.

**Commit:**

```bash
git add supabase-migrations/20260324_dissonance_state.sql src/services/supabase.ts
git commit -m "feat(signatur): persist dissonance state to Supabase"
```

---

### Task 8: Premium "Sichtbare Werte" Toggle

**Files:**
- Create: `src/components/settings/DissonanceValues.tsx`
- Modify: `src/pages/SettingsPage.tsx` (if exists) or settings section

**Behavior:**
- Gated by `usePremium()` — only renders for premium users
- Shows three gauges: d_natal, d_accumulated, d_elemental (with Sheng/Ke label)
- Combined intensity as percentage
- Toggle in settings: "Sichtbare Werte" (default: off)

**Commit:**

```bash
git add src/components/settings/DissonanceValues.tsx
git commit -m "feat(signatur): add premium-only dissonance value display"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| **1. Math** | 1–2 | DissonanceResult type, computeDissonance(), VisualModulation |
| **2. Integration** | 3–4 | Engine hooks, useDissonance, prop wiring |
| **3. Animation** | 5–6 | Morph transitions, render loop integration |
| **4. Persistence** | 7–8 | Supabase storage, Premium UI |

**Total: 8 tasks, ~4-6 hours implementation time**

**Upgrade Path to Ansatz C (Full Cymatics):**
- Replace `vectorDistance()` in `dissonance.ts` with beat-frequency computation
- Replace `computeElementalDissonance()` with full harmonic analysis
- `DissonanceResult` interface stays identical → no consumer changes
- `VisualModulation` interface stays identical → render loop unchanged
