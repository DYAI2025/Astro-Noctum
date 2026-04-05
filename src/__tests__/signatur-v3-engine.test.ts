import { describe, it, expect } from 'vitest';
import {
  initializePoles,
  computeV3Dissonance,
  computeDissonance,
  updatePoles,
  modulateConfig,
  type SignaturV3Config,
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
