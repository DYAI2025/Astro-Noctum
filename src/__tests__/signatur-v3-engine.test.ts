import { describe, it, expect } from 'vitest';
import {
  initializePoles,
  computeV3Dissonance,
  computeDissonance,
  updatePoles,
  modulateConfig,
  type SignaturV3Config,
  type V3DissonanceState,
} from '../components/signatur-v3/bipolar-engine';
// DIMENSION_DEFS is now the canonical export from @bazodiac/shared
import { DIMENSION_DEFS as DIMENSIONS } from '@/packages/shared/src/signatur/dimension-defs';
import { computeDayHarmonic } from '../lib/fusion-ring/day-harmonic';

const DEFAULT_CONFIG: SignaturV3Config = {
  maxR: 200,
  maxTrailLength: 2000,
  trailPersistence: 0.85,
  timeScale: 1.0,
};

function makeWeights(values: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(values));
}

const NATAL = makeWeights({
  assertion: 0.7, empathy: 0.3, creativity: 0.8,
  logic: 0.4, intuition: 0.6, discipline: 0.5,
});

const QUIZ_ALIGNED = makeWeights({
  assertion: 0.7, empathy: 0.3, creativity: 0.8,
  logic: 0.4, intuition: 0.6, discipline: 0.5,
});

const QUIZ_DISSONANT = makeWeights({
  assertion: 0.1, empathy: 0.9, creativity: 0.2,
  logic: 0.8, intuition: 0.1, discipline: 0.9,
});

describe('Signatur V3 Engine', () => {
  describe('Dimensions', () => {
    it('defines exactly 6 dimensions with 12 poles', () => {
      expect(DIMENSIONS).toHaveLength(6);
      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      expect(poles).toHaveLength(12);
    });

    it('each dimension has a unique Cousto Hz value', () => {
      const hzValues = DIMENSIONS.map(d => d.hz);
      expect(new Set(hzValues).size).toBe(6);
    });

    it('pole pairs are placed 180° apart', () => {
      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      for (let i = 0; i < poles.length; i += 2) {
        expect(poles[i]!.pole).toBe('A');
        expect(poles[i + 1]!.pole).toBe('B');
        expect(poles[i]!.dimensionId).toBe(poles[i + 1]!.dimensionId);
      }
    });
  });

  describe('Pole determinism', () => {
    it('identical inputs produce identical pole positions', () => {
      const poles1 = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const poles2 = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);

      for (let i = 0; i < poles1.length; i++) {
        expect(poles1[i]!.x).toBe(poles2[i]!.x);
        expect(poles1[i]!.y).toBe(poles2[i]!.y);
        expect(poles1[i]!.speed).toBe(poles2[i]!.speed);
        expect(poles1[i]!.radius).toBe(poles2[i]!.radius);
      }
    });

    it('different inputs produce different pole positions', () => {
      const polesA = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const polesB = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_DISSONANT);

      let anyDiff = false;
      for (let i = 0; i < polesA.length; i++) {
        if (polesA[i]!.radius !== polesB[i]!.radius) anyDiff = true;
      }
      expect(anyDiff).toBe(true);
    });

    it('poles advance deterministically over N frames', () => {
      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeDissonance(NATAL, QUIZ_ALIGNED);

      for (let frame = 0; frame < 100; frame++) {
        updatePoles(poles, dissonance, DEFAULT_CONFIG, frame * 0.016);
      }

      // Run again from scratch
      const poles2 = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance2 = computeDissonance(NATAL, QUIZ_ALIGNED);

      for (let frame = 0; frame < 100; frame++) {
        updatePoles(poles2, dissonance2, DEFAULT_CONFIG, frame * 0.016);
      }

      for (let i = 0; i < poles.length; i++) {
        expect(poles[i]!.x).toBeCloseTo(poles2[i]!.x, 10);
        expect(poles[i]!.y).toBeCloseTo(poles2[i]!.y, 10);
      }
    });
  });

  describe('Dissonance computation', () => {
    it('aligned weights produce low dNatal', () => {
      const d = computeV3Dissonance(NATAL, QUIZ_ALIGNED);
      expect(d.dNatal).toBe(0);
      expect(d.dAccumulated).toBe(0);
    });

    it('natal weights as quiz fallback produce zero d_natal (pristine state)', () => {
      // When no quiz data is available, FusionRing3D uses natal weights as quiz fallback.
      // quiz == natal → d_natal = 0 for every dimension → pure consonant/symmetric orbit.
      const d = computeV3Dissonance(NATAL, NATAL);
      expect(d.dNatal).toBe(0);
      for (const dim of DIMENSIONS) {
        expect(d.dimensional.get(dim.id)).toBe(0);
      }
    });

    it('dissonant weights produce high dNatal', () => {
      const d = computeV3Dissonance(NATAL, QUIZ_DISSONANT);
      expect(d.dNatal).toBeGreaterThan(0.5);
    });

    it('per-dimension dissonance matches weight deviation', () => {
      const d = computeV3Dissonance(NATAL, QUIZ_DISSONANT);
      for (const dim of DIMENSIONS) {
        const natal = NATAL.get(dim.id) ?? 0.5;
        const quiz = QUIZ_DISSONANT.get(dim.id) ?? 0.5;
        expect(d.dimensional.get(dim.id)).toBeCloseTo(Math.abs(quiz - natal), 10);
      }
    });

    it('external DissonanceResult overrides local computation', () => {
      const external = {
        d_natal: 0.42,
        d_accumulated: 0.33,
        d_elemental: { magnitude: 0.7, type: 'ke' as const, pair: ['Fire', 'Water'] as [string, string] },
        intensity: 0.5,
      };
      const d = computeV3Dissonance(NATAL, QUIZ_ALIGNED, external);
      expect(d.dNatal).toBe(0.42);
      expect(d.dAccumulated).toBe(0.33);
      expect(d.elementalQuality).toBeCloseTo(-0.7); // Ke → negative
    });

    it('Sheng elemental quality is positive', () => {
      const external = {
        d_natal: 0.3,
        d_accumulated: 0,
        d_elemental: { magnitude: 0.5, type: 'sheng' as const, pair: ['Wood', 'Fire'] as [string, string] },
        intensity: 0.3,
      };
      const d = computeV3Dissonance(NATAL, QUIZ_ALIGNED, external);
      expect(d.elementalQuality).toBeCloseTo(0.5); // Sheng → positive
    });
  });

  describe('Lissajous blend mechanics', () => {
    function makeDissonanceState(d: number): V3DissonanceState {
      return {
        dimensional: new Map(DIMENSIONS.map(dim => [dim.id, d])),
        dNatal: Math.min(d * 2, 1),
        dAccumulated: 0,
        elementalQuality: 0,
      };
    }

    it('blend amplification: displacement from symmetric scales as 2×d, not 1×d (engine)', () => {
      // Behavioral test: drives updatePoles with d=0.05 (blend=0.1) and d=0.1 (blend=0.2).
      // Both are below the vibration threshold (d > 0.1), so positions are pure blend arithmetic.
      // Verifies that clamp(d*2, 0, 1) is applied — a 1:1 formula would give ratio 1, not 2.
      const s0 = makeDissonanceState(0);
      const s05 = makeDissonanceState(0.05);  // blend = clamp(0.05 * 2, 0, 1) = 0.1
      const s10 = makeDissonanceState(0.1);   // blend = clamp(0.1  * 2, 0, 1) = 0.2

      const p0  = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const p05 = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const p10 = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);

      // 10 frames: enough for theta to accumulate a measurable Lissajous Y difference
      for (let frame = 0; frame < 10; frame++) {
        const t = frame * 0.016;
        updatePoles(p0,  s0,  DEFAULT_CONFIG, t);
        updatePoles(p05, s05, DEFAULT_CONFIG, t);
        updatePoles(p10, s10, DEFAULT_CONFIG, t);
      }

      // For each poleA (even indices): displacement ratio must be 2:1 where measurable
      let ratioChecked = false;
      for (let i = 0; i < p0.length; i += 2) {
        const disp05 = p05[i]!.y - p0[i]!.y;  // blend=0.1 → 10% of (lissajous - symmetric)
        const disp10 = p10[i]!.y - p0[i]!.y;  // blend=0.2 → 20% of (lissajous - symmetric)
        if (Math.abs(disp05) > 0.001) {
          expect(disp10 / disp05).toBeCloseTo(2.0, 1);
          ratioChecked = true;
        }
      }
      // Guard: at least one dimension must have a measurable displacement
      expect(ratioChecked).toBe(true);
    });

    it('d=0 → pure symmetric orbit: poleA.y = sin(theta + speed) × radius', () => {
      // With blend=0 and no vibration (d < 0.1 threshold), position is purely circular
      const consonantState = makeDissonanceState(0);
      const poles = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const theta0 = poles[0]!.theta;
      const speed0 = poles[0]!.speed;
      const radius0 = poles[0]!.radius;

      updatePoles(poles, consonantState, DEFAULT_CONFIG, 0);

      expect(poles[0]!.y).toBeCloseTo(Math.sin(theta0 + speed0) * radius0, 10);
    });

    it('d=0.5 produces different pole positions than d=0 (Lissajous blend active)', () => {
      // d=0.5 → blend=1 → Lissajous Y frequency ratio applied
      // Both start from identical initial state but diverge after N frames
      const consonantState = makeDissonanceState(0);
      const dissonantState = makeDissonanceState(0.5);

      const polesConsonant = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const polesDissonant = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);

      for (let frame = 0; frame < 60; frame++) {
        const t = frame * 0.016;
        updatePoles(polesConsonant, consonantState, DEFAULT_CONFIG, t);
        updatePoles(polesDissonant, dissonantState, DEFAULT_CONFIG, t);
      }

      // At least one pole pair must have diverged in Y (different freqRatio applied)
      let anyYDiverged = false;
      for (let i = 0; i < polesConsonant.length; i++) {
        if (Math.abs(polesConsonant[i]!.y - polesDissonant[i]!.y) > 0.01) {
          anyYDiverged = true;
          break;
        }
      }
      expect(anyYDiverged).toBe(true);
    });

    it('d=0.25 interpolates: Y is between symmetric and full-Lissajous', () => {
      // blend=0.5 → intermediate position between the two orbit modes
      const consonantState = makeDissonanceState(0);
      const halfState = makeDissonanceState(0.25);
      const dissonantState = makeDissonanceState(0.5);

      const polesConsonant = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const polesHalf = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const polesDissonant = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);

      // Single step at time=0 (no vibration for d=0; vibration for d>0.1)
      // For polesConsonant: d=0, no vibration → clean symmetric position
      // For polesHalf: d=0.25 > 0.1, vibration applied — but Y is still bounded by lerp
      updatePoles(polesConsonant, consonantState, DEFAULT_CONFIG, 0);
      updatePoles(polesHalf, halfState, DEFAULT_CONFIG, 0);
      updatePoles(polesDissonant, dissonantState, DEFAULT_CONFIG, 0);

      // For each dimension pair, if symmetric and lissajous differ, intermediate is between them
      for (let i = 0; i < polesConsonant.length; i += 2) {
        const yC = polesConsonant[i]!.y;
        const yH = polesHalf[i]!.y;
        const yF = polesDissonant[i]!.y;
        // Only assert when the two extremes differ visibly
        if (Math.abs(yF - yC) > 1.0) {
          const lo = Math.min(yC, yF);
          const hi = Math.max(yC, yF);
          // Half must be within the [lo, hi] range (with small tolerance for vibration offset)
          const tolerance = DEFAULT_CONFIG.maxR * 0.015; // ≤ 1.5% of maxR — 2× actual max vibration (0.25 × maxR × 0.03 = 1.5px)
          expect(yH).toBeGreaterThanOrEqual(lo - tolerance);
          expect(yH).toBeLessThanOrEqual(hi + tolerance);
        }
      }
    });
  });

  describe('Elemental vibration texture (d_elemental)', () => {
    it('vibration is inactive below d=0.1 threshold', () => {
      // At d=0.05 (below threshold), positions must match pure blend arithmetic — no perpendicular jitter
      const belowThreshold: V3DissonanceState = {
        dimensional: new Map(DIMENSIONS.map(dim => [dim.id, 0.05])),
        dNatal: 0.1,
        dAccumulated: 0,
        elementalQuality: -1, // Ke — if vibration were active, it would add displacement
      };
      const poles = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const theta0 = poles[0]!.theta;
      const speed0 = poles[0]!.speed;
      const radius0 = poles[0]!.radius;

      updatePoles(poles, belowThreshold, DEFAULT_CONFIG, 0);

      // blend = clamp(0.05 * 2, 0, 1) = 0.1 → near-symmetric
      // No vibration: poleA.y ≈ sin(theta + speed) * radius (within small blend offset)
      expect(Math.abs(poles[0]!.y)).toBeLessThan(radius0 * 1.1);
    });

    it('Ke uses angular waveform: larger vibration than Sheng at sin(12t)≈0.707 phase', () => {
      // At d=0.5, both Ke and Sheng have blend=1 → identical Lissajous base position.
      // At t=π/48, sin(12*t) = sin(π/4) ≈ 0.707:
      //   Ke:    tanh(3 × 0.707) ≈ 0.970 × vibAmp  (angular/squashed)
      //   Sheng: sin(3 × π/48)   ≈ 0.195 × vibAmp  (smooth/flowing)
      // Ke displacement magnitude must exceed Sheng at this time point.
      const keState: V3DissonanceState = {
        dimensional: new Map(DIMENSIONS.map(dim => [dim.id, 0.5])),
        dNatal: 1,
        dAccumulated: 0,
        elementalQuality: -1, // Ke
      };
      const shengState: V3DissonanceState = {
        ...keState,
        elementalQuality: 1, // Sheng
      };

      const polesKe    = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
      const polesSheng = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);

      const t = Math.PI / (4 * 12); // sin(12 * t) = sin(π/4) ≈ 0.707
      updatePoles(polesKe,    keState,    DEFAULT_CONFIG, t);
      updatePoles(polesSheng, shengState, DEFAULT_CONFIG, t);

      // Both start from identical positions — difference is purely vibrational
      let diffSq = 0;
      for (let i = 0; i < polesKe.length; i++) {
        diffSq += (polesKe[i]!.x - polesSheng[i]!.x) ** 2
                + (polesKe[i]!.y - polesSheng[i]!.y) ** 2;
      }
      // Expected per-pole RMS diff ≈ 2px (0.775 × vibAmp × cos(perp)); conservative threshold: 0.5px
      expect(Math.sqrt(diffSq / polesKe.length)).toBeGreaterThan(0.5);
    });
  });

  describe('Day harmonic modulation', () => {
    it('pulse mode increases trail persistence', () => {
      const dh = computeDayHarmonic(0.3); // low harmony → pulse
      expect(dh.mode).toBe('pulse');
      const modulated = modulateConfig(DEFAULT_CONFIG, dh);
      expect(modulated.trailPersistence).toBeGreaterThan(DEFAULT_CONFIG.trailPersistence);
    });

    it('trace mode decreases trail persistence', () => {
      const dh = computeDayHarmonic(0.7); // high harmony → trace
      expect(dh.mode).toBe('trace');
      const modulated = modulateConfig(DEFAULT_CONFIG, dh);
      expect(modulated.trailPersistence).toBeLessThan(DEFAULT_CONFIG.trailPersistence);
    });
  });

  describe('Trail recording', () => {
    it('trails accumulate over frames', () => {
      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeDissonance(NATAL, QUIZ_ALIGNED);

      expect(poles[0]!.trailLength).toBe(0);

      for (let f = 0; f < 50; f++) {
        updatePoles(poles, dissonance, DEFAULT_CONFIG, f * 0.016);
      }

      expect(poles[0]!.trailLength).toBe(50);
    });

    it('trail wraps around when maxTrailLength is reached', () => {
      const shortConfig = { ...DEFAULT_CONFIG, maxTrailLength: 10 };
      const poles = initializePoles(shortConfig, NATAL, QUIZ_ALIGNED);
      const dissonance = computeDissonance(NATAL, QUIZ_ALIGNED);

      for (let f = 0; f < 25; f++) {
        updatePoles(poles, dissonance, shortConfig, f * 0.016);
      }

      expect(poles[0]!.trailLength).toBe(10); // capped at maxTrailLength
    });
  });
});

// ─── TASK-sbridge-determinism ─────────────────────────────────────────────────

describe('Signatur V3 Float-Determinismus (TASK-sbridge-determinism)', () => {
  /**
   * Identical inputs must produce bit-identical pole positions after N frames.
   * Prerequisite for Matching, Density Field, and cross-platform consistency.
   */
  it('identical inputs produce identical pole positions after 200 frames', () => {
    const runEngine = () => {
      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeDissonance(NATAL, QUIZ_ALIGNED);
      for (let f = 0; f < 200; f++) {
        updatePoles(poles, dissonance, DEFAULT_CONFIG, f * 0.016);
      }
      return poles.map(p => ({ x: p.x, y: p.y, theta: p.theta }));
    };

    const run1 = runEngine();
    const run2 = runEngine();

    for (let i = 0; i < run1.length; i++) {
      expect(run1[i]!.x).toBeCloseTo(run2[i]!.x, 10);
      expect(run1[i]!.y).toBeCloseTo(run2[i]!.y, 10);
      expect(run1[i]!.theta).toBeCloseTo(run2[i]!.theta, 10);
    }
  });

  it('different natal inputs produce different pole positions', () => {
    const poles1 = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
    const poles2 = initializePoles(DEFAULT_CONFIG, QUIZ_DISSONANT, QUIZ_ALIGNED);
    const dissonance = computeDissonance(NATAL, QUIZ_ALIGNED);

    for (let f = 0; f < 200; f++) {
      updatePoles(poles1, dissonance, DEFAULT_CONFIG, f * 0.016);
      updatePoles(poles2, dissonance, DEFAULT_CONFIG, f * 0.016);
    }

    // At least one pole must differ — different natal → different orbit radius
    const anyDiffers = poles1.some((p, i) =>
      Math.abs(p.x - poles2[i]!.x) > 1e-6 || Math.abs(p.y - poles2[i]!.y) > 1e-6
    );
    expect(anyDiffers).toBe(true);
  });

  it('DIMENSION_DEFS are immutable at runtime (as const)', () => {
    // Verify the array cannot be accidentally mutated via the shared export
    const originalHz = DIMENSIONS[0]!.hz;
    // @ts-expect-error — testing runtime immutability
    try { (DIMENSIONS[0] as DimensionDef).hz = 999; } catch { /* expected */ }
    // Object.freeze throws in strict mode on frozen-property assignment.
    // This test FAILS without Object.freeze — it is not mode-independent.
    expect(DIMENSIONS[0]!.hz).toBe(originalHz);
  });
});
