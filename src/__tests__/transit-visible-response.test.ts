import { describe, it, expect } from 'vitest';
import {
  applyPowerCurve,
  applyGaussSpread,
  calculateFusionSignal,
  clamp01,
} from '../utils/math';
import { soulprintToNatalWeights } from '../components/fusion-ring-website/signatur-bridge';

// ── 1. Power curve perceptibility ─────────────────────────────────────

describe('applyPowerCurve — transit delta perceptibility', () => {
  it('preserves sign', () => {
    expect(applyPowerCurve(0.5)).toBeGreaterThan(0);
    expect(applyPowerCurve(-0.5)).toBeLessThan(0);
  });

  it('maps ±1 to ±1', () => {
    expect(applyPowerCurve(1)).toBeCloseTo(1);
    expect(applyPowerCurve(-1)).toBeCloseTo(-1);
  });

  it('maps 0 to 0', () => {
    expect(applyPowerCurve(0)).toBe(0);
  });

  it('default exponent (1.2) preserves more of small signals than 1.5', () => {
    const smallSignal = 0.1;
    const withDefault = applyPowerCurve(smallSignal);
    const withOld = applyPowerCurve(smallSignal, 1.5);
    expect(withDefault).toBeGreaterThan(withOld);
    expect(withDefault).toBeGreaterThan(0.05);
  });

  it('small delta (0.05) stays above perceptibility floor', () => {
    const result = applyPowerCurve(0.05);
    expect(result).toBeGreaterThan(0.02);
  });

  it('accepts custom exponent parameter', () => {
    expect(applyPowerCurve(0.5, 1.0)).toBeCloseTo(0.5);
    expect(applyPowerCurve(0.5, 2.0)).toBeCloseTo(0.25);
  });
});

// ── 2. Signal pipeline produces distinct outputs for distinct transits ──

describe('transit signal pipeline — distinct inputs → distinct outputs', () => {
  const baseSoulprint = [0.6, 0.5, 0.4, 0.7, 0.55, 0.45, 0.5, 0.6, 0.5, 0.4, 0.55, 0.5];

  function computeTargetSignals(
    ringSectors: number[],
    soulprint: number[],
    avg30: number[],
    transitIntensity: number,
  ) {
    const rawTargets = ringSectors.map((ring, i) =>
      calculateFusionSignal(
        clamp01(ring),
        soulprint[i] ?? 0,
        avg30[i] ?? 0,
        transitIntensity,
      ),
    );
    const spread = applyGaussSpread(rawTargets);
    return spread.map(v => Math.max(-1, Math.min(2, applyPowerCurve(v))));
  }

  it('different ring sectors produce different targetSignals', () => {
    const ringA = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const ringB = [0.7, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const avg30 = baseSoulprint.map(() => 0.5);

    const targetsA = computeTargetSignals(ringA, baseSoulprint, avg30, 0.5);
    const targetsB = computeTargetSignals(ringB, baseSoulprint, avg30, 0.5);

    const maxDelta = Math.max(...targetsA.map((a, i) => Math.abs(a - targetsB[i]!)));
    expect(maxDelta).toBeGreaterThan(0.01);
  });

  it('different transit intensity produces different targetSignals', () => {
    const ring = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const avg30 = baseSoulprint.map(() => 0.5);

    const targetsLow = computeTargetSignals(ring, baseSoulprint, avg30, 0.2);
    const targetsHigh = computeTargetSignals(ring, baseSoulprint, avg30, 0.8);

    const maxDelta = Math.max(...targetsLow.map((a, i) => Math.abs(a - targetsHigh[i]!)));
    expect(maxDelta).toBeGreaterThan(0.01);
  });

  it('targetSignals → natalWeights produces distinct V2 weights', () => {
    const ring = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const ringShifted = [0.7, 0.5, 0.3, 0.5, 0.8, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const avg30 = baseSoulprint.map(() => 0.5);

    const targetsA = computeTargetSignals(ring, baseSoulprint, avg30, 0.5);
    const targetsB = computeTargetSignals(ringShifted, baseSoulprint, avg30, 0.5);

    const clampedA = targetsA.map(v => Math.max(0, Math.min(1, v)));
    const clampedB = targetsB.map(v => Math.max(0, Math.min(1, v)));

    const weightsA = soulprintToNatalWeights(clampedA);
    const weightsB = soulprintToNatalWeights(clampedB);

    const planets = Object.keys(weightsA);
    const maxWeightDelta = Math.max(
      ...planets.map(p => Math.abs((weightsA[p] ?? 0) - (weightsB[p] ?? 0))),
    );
    expect(maxWeightDelta).toBeGreaterThan(0.01);
  });
});

// ── 3. Perceptibility threshold — AC: visible change within 5s ──

describe('transit perceptibility — AC: visible within 5s', () => {
  it('a 0.1 ring sector shift produces > 0.02 natal weight delta', () => {
    const base = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const shifted = [0.6, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    const weightsBase = soulprintToNatalWeights(base);
    const weightsShifted = soulprintToNatalWeights(shifted);

    const marsBase = weightsBase['Mars'] ?? 0;
    const marsShifted = weightsShifted['Mars'] ?? 0;
    expect(Math.abs(marsShifted - marsBase)).toBeGreaterThan(0.02);
  });

  it('full pipeline: 0.15 transit delta → weight change exceeds rebuild threshold (0.01)', () => {
    const soulprint = [0.6, 0.5, 0.4, 0.7, 0.55, 0.45, 0.5, 0.6, 0.5, 0.4, 0.55, 0.5];
    const avg30 = soulprint.map(() => 0.5);
    const ringBefore = soulprint.map(() => 0.5);
    const ringAfter = soulprint.map((v, i) => i < 3 ? v + 0.15 : v);

    const compute = (ring: number[]) => {
      const raw = ring.map((r, i) =>
        calculateFusionSignal(clamp01(r), soulprint[i]!, avg30[i]!, 0.5),
      );
      const spread = applyGaussSpread(raw);
      return spread.map(v => Math.max(0, Math.min(1, applyPowerCurve(v))));
    };

    const before = soulprintToNatalWeights(compute(ringBefore));
    const after = soulprintToNatalWeights(compute(ringAfter));

    const maxDelta = Math.max(
      ...Object.keys(before).map(p => Math.abs((before[p] ?? 0) - (after[p] ?? 0))),
    );
    expect(maxDelta).toBeGreaterThanOrEqual(0.01);
  });
});

// ── 4. Gaussian spread preserves array length and signal range ──

describe('applyGaussSpread — invariants', () => {
  it('returns same length as input', () => {
    const input = Array(12).fill(0.5);
    expect(applyGaussSpread(input)).toHaveLength(12);
  });

  it('returns input unchanged for non-12 arrays', () => {
    const input = [0.5, 0.6];
    expect(applyGaussSpread(input)).toEqual(input);
  });

  it('output values stay bounded for bounded input', () => {
    const input = Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 0.8 : 0.2));
    const result = applyGaussSpread(input);
    result.forEach(v => {
      expect(v).toBeGreaterThan(-1);
      expect(v).toBeLessThan(2);
    });
  });
});

// ── 5. calculateFusionSignal — clamping and weights ──

describe('calculateFusionSignal — clamping', () => {
  it('output clamped to [-1, 1]', () => {
    expect(calculateFusionSignal(1, 1, 1, 1)).toBeLessThanOrEqual(1);
    expect(calculateFusionSignal(-1, -1, -1, -1)).toBeGreaterThanOrEqual(-1);
  });

  it('neutral inputs (0.5) produce positive output', () => {
    const result = calculateFusionSignal(0.5, 0.5, 0.5, 0.5);
    // 0.375*0.5 + 0.375*0.5 + 0.25*0.5 + 0.2*0.5 = 0.6
    expect(result).toBeCloseTo(0.6, 1);
  });
});
