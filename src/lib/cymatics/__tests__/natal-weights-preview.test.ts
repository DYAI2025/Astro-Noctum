/**
 * Unit tests for natalWeightsToChladniPreview (Phase C1 helper).
 *
 * Contract (matches the neutral preset in bazi-to-chladni.ts):
 *   - progress=0 or missing weights → { m:3, n:3, a:0.4, b:0.4, harmonyIndex:0.5, dominantElement:'Earth' }
 *   - progress=1 → deterministic target derived from sector array
 *   - progress in (0, 1) → linear interpolation (rounded for m/n)
 */
import { describe, it, expect } from 'vitest';
import {
  natalWeightsToChladniPreview,
  type ChladniParams,
} from '../bazi-to-chladni';

const NEUTRAL: ChladniParams = {
  m: 3,
  n: 3,
  a: 0.4,
  b: 0.4,
  harmonyIndex: 0.5,
  dominantElement: 'Earth',
};

describe('natalWeightsToChladniPreview — neutral branches', () => {
  it('returns neutral preset when weights is undefined', () => {
    const result = natalWeightsToChladniPreview(undefined, 1);
    expect(result).toEqual(NEUTRAL);
  });

  it('returns neutral preset when weights is empty', () => {
    const result = natalWeightsToChladniPreview([], 1);
    expect(result).toEqual(NEUTRAL);
  });

  it('returns neutral preset when progress=0 regardless of weights', () => {
    const weights = [0.9, 0.1, 0.8, 0.2, 0.9, 0.1, 0.8, 0.2, 0.9, 0.1, 0.8, 0.2];
    const result = natalWeightsToChladniPreview(weights, 0);
    expect(result).toEqual(NEUTRAL);
  });
});

describe('natalWeightsToChladniPreview — progress=1 target derivation', () => {
  it('is deterministic for the same input', () => {
    const weights = [0.5, 0.3, 0.8, 0.2, 0.9, 0.1, 0.7, 0.4, 0.6, 0.2, 0.5, 0.3];
    const a = natalWeightsToChladniPreview(weights, 1);
    const b = natalWeightsToChladniPreview(weights, 1);
    expect(a).toEqual(b);
  });

  it('keeps m and n as integers in [2, 6]', () => {
    const weights = [0.5, 0.3, 0.8, 0.2, 0.9, 0.1, 0.7, 0.4, 0.6, 0.2, 0.5, 0.3];
    const result = natalWeightsToChladniPreview(weights, 1);
    expect(Number.isInteger(result.m)).toBe(true);
    expect(Number.isInteger(result.n)).toBe(true);
    expect(result.m).toBeGreaterThanOrEqual(2);
    expect(result.m).toBeLessThanOrEqual(6);
    expect(result.n).toBeGreaterThanOrEqual(2);
    expect(result.n).toBeLessThanOrEqual(6);
  });

  it('a is in [0.30, 1.00]', () => {
    const weights = [0.9, 0.2, 0.8, 0.1, 0.5, 0.3, 0.7, 0.4, 0.6, 0.2, 0.5, 0.3];
    const result = natalWeightsToChladniPreview(weights, 1);
    expect(result.a).toBeGreaterThanOrEqual(0.3);
    expect(result.a).toBeLessThanOrEqual(1.0);
  });

  it('b is in [0.10, 0.70]', () => {
    const weights = [0.9, 0.2, 0.8, 0.1, 0.5, 0.3, 0.7, 0.4, 0.6, 0.2, 0.5, 0.3];
    const result = natalWeightsToChladniPreview(weights, 1);
    expect(result.b).toBeGreaterThanOrEqual(0.1);
    expect(result.b).toBeLessThanOrEqual(0.7);
  });

  it('harmonyIndex is in [0, 1]', () => {
    const weights = [0.9, 0.2, 0.8, 0.1, 0.5, 0.3, 0.7, 0.4, 0.6, 0.2, 0.5, 0.3];
    const result = natalWeightsToChladniPreview(weights, 1);
    expect(result.harmonyIndex).toBeGreaterThanOrEqual(0);
    expect(result.harmonyIndex).toBeLessThanOrEqual(1);
  });

  it('high-variance weights produce higher n than uniform weights', () => {
    const uniform = Array(12).fill(0.5);
    const spiky = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    const a = natalWeightsToChladniPreview(uniform, 1);
    const b = natalWeightsToChladniPreview(spiky, 1);
    expect(b.n).toBeGreaterThan(a.n);
  });

  it('picks dominantElement based on sector-element sums (Fire dominant)', () => {
    // Fire sectors: 0 (Aries), 4 (Leo), 8 (Sagittarius). Load them heavily.
    const weights = Array(12).fill(0);
    weights[0] = 1.0;
    weights[4] = 1.0;
    weights[8] = 1.0;
    const result = natalWeightsToChladniPreview(weights, 1);
    expect(result.dominantElement).toBe('Fire');
  });

  it('picks dominantElement = Water when Cancer/Scorpio/Pisces loaded', () => {
    // Water sectors: 3 (Cancer), 7 (Scorpio), 11 (Pisces).
    const weights = Array(12).fill(0);
    weights[3] = 1.0;
    weights[7] = 1.0;
    weights[11] = 1.0;
    const result = natalWeightsToChladniPreview(weights, 1);
    expect(result.dominantElement).toBe('Water');
  });
});

describe('natalWeightsToChladniPreview — morph interpolation', () => {
  // Build weights whose target differs from neutral (high variance → high n)
  const extreme = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

  it('progress=0.5 yields values strictly between neutral and target', () => {
    const target = natalWeightsToChladniPreview(extreme, 1);
    const mid = natalWeightsToChladniPreview(extreme, 0.5);

    // `a` is a float — strict midpoint interpolation
    expect(mid.a).toBeCloseTo((NEUTRAL.a + target.a) / 2, 6);
    expect(mid.b).toBeCloseTo((NEUTRAL.b + target.b) / 2, 6);
    expect(mid.harmonyIndex).toBeCloseTo((NEUTRAL.harmonyIndex + target.harmonyIndex) / 2, 6);

    // `m` and `n` are rounded ints — must still lie within [min, max] of endpoints
    expect(mid.m).toBeGreaterThanOrEqual(Math.min(NEUTRAL.m, target.m));
    expect(mid.m).toBeLessThanOrEqual(Math.max(NEUTRAL.m, target.m));
    expect(mid.n).toBeGreaterThanOrEqual(Math.min(NEUTRAL.n, target.n));
    expect(mid.n).toBeLessThanOrEqual(Math.max(NEUTRAL.n, target.n));
  });

  it('clamps progress outside [0, 1] to the boundaries', () => {
    const over = natalWeightsToChladniPreview(extreme, 2);
    const target = natalWeightsToChladniPreview(extreme, 1);
    expect(over).toEqual(target);

    const under = natalWeightsToChladniPreview(extreme, -5);
    expect(under).toEqual(NEUTRAL);
  });
});
