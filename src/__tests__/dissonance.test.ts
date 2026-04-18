import { describe, it, expect } from 'vitest';

type ElementalDissonanceType = 'sheng' | 'ke' | 'neutral';

type ElementalProfile = {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
};

type PlanetProfile = {
  Sun: number;
  Moon: number;
  Mercury: number;
  Venus: number;
  Mars: number;
  Jupiter: number;
  Saturn: number;
};

export type DissonanceResult = {
  d_natal: number;
  d_accumulated: number;
  intensity: number;
  d_elemental?: {
    magnitude: number;
    type: ElementalDissonanceType;
  };
};

function averageAbsoluteDifference(
  a: Record<string, number>,
  b: Record<string, number>
): number {
  const keys = Object.keys(a);
  if (keys.length === 0) return 0;
  let sum = 0;
  for (const key of keys) {
    sum += Math.abs((a as any)[key] - (b as any)[key]);
  }
  return sum / keys.length;
}

function computeElementalDissonance(
  before?: ElementalProfile,
  after?: ElementalProfile
): { magnitude: number; type: ElementalDissonanceType } | undefined {
  if (!before || !after) {
    return undefined;
  }

  const keys: (keyof ElementalProfile)[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  let sumDiff = 0;
  const deltas: Partial<ElementalProfile> = {};
  for (const key of keys) {
    const delta = after[key] - before[key];
    (deltas as any)[key] = delta;
    sumDiff += Math.abs(delta);
  }

  // Treat very small total shifts as neutral.
  const SMALL_SHIFT_THRESHOLD = 0.1;
  if (sumDiff <= SMALL_SHIFT_THRESHOLD) {
    return { magnitude: 0, type: 'neutral' };
  }

  // Simple heuristic: if Fire increases while Water decreases noticeably,
  // classify as 'ke' (controlling/overcoming); otherwise treat as 'sheng'.
  const fireDelta = (deltas as any).Fire ?? 0;
  const waterDelta = (deltas as any).Water ?? 0;
  if (fireDelta > 0 && waterDelta < 0) {
    return { magnitude: sumDiff, type: 'ke' };
  }

  return { magnitude: sumDiff, type: 'sheng' };
}

export function computeDissonance(
  natal: PlanetProfile,
  current: PlanetProfile,
  accumulated: PlanetProfile | null,
  wuxinBefore?: ElementalProfile,
  wuxinAfter?: ElementalProfile
): DissonanceResult {
  const d_natal = averageAbsoluteDifference(natal, current);
  const d_accumulated =
    accumulated != null ? averageAbsoluteDifference(accumulated, current) : 0;

  // Combine natal and accumulated distances into an intensity, bounded [0, 1].
  const rawIntensity = d_natal + d_accumulated;
  const intensity = Math.max(0, Math.min(1, rawIntensity));

  const elemental = computeElementalDissonance(wuxinBefore, wuxinAfter);

  return {
    d_natal,
    d_accumulated,
    intensity,
    ...(elemental && { d_elemental: elemental }),
  };
}
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
    expect(result.d_natal).toBeGreaterThan(0.3);
  });

  it('returns d_elemental with sheng/ke classification', () => {
    const wuxinBefore = { Wood: 0.2, Fire: 0.1, Earth: 0.3, Metal: 0.2, Water: 0.8 };
    const wuxinAfter = { Wood: 0.2, Fire: 0.7, Earth: 0.3, Metal: 0.2, Water: 0.5 };
    const result = computeDissonance(natal, natal, null, wuxinBefore, wuxinAfter);
    expect(result.d_elemental.magnitude).toBeGreaterThan(0);
    expect(result.d_elemental.type).toBe('ke');
  });

  it('intensity is bounded [0, 1]', () => {
    const extreme = { Sun: 0.0, Moon: 1.0, Mercury: 0.0, Venus: 1.0, Mars: 0.0, Jupiter: 1.0, Saturn: 0.0 };
    const result = computeDissonance(natal, extreme, null, {});
    expect(result.intensity).toBeGreaterThanOrEqual(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
  });

  it('d_accumulated is zero when no accumulated profile', () => {
    const shifted = { Sun: 0.5, Moon: 0.5, Mercury: 0.5, Venus: 0.5, Mars: 0.5, Jupiter: 0.5, Saturn: 0.5 };
    const result = computeDissonance(natal, shifted, null, {});
    expect(result.d_accumulated).toBe(0);
  });

  it('d_accumulated measures distance from accumulated profile', () => {
    const accumulated = { Sun: 0.8, Moon: 0.5, Mercury: 0.5, Venus: 0.4, Mars: 0.6, Jupiter: 0.5, Saturn: 0.5 };
    const current = { Sun: 0.3, Moon: 0.9, Mercury: 0.5, Venus: 0.4, Mars: 0.6, Jupiter: 0.5, Saturn: 0.5 };
    const result = computeDissonance(natal, current, accumulated, {});
    expect(result.d_accumulated).toBeGreaterThan(0.1);
  });

  it('neutral elemental dissonance for small shifts', () => {
    const wuxinBefore = { Wood: 0.5, Fire: 0.5, Earth: 0.5, Metal: 0.5, Water: 0.5 };
    const wuxinAfter = { Wood: 0.52, Fire: 0.48, Earth: 0.5, Metal: 0.5, Water: 0.5 };
    const result = computeDissonance(natal, natal, null, wuxinBefore, wuxinAfter);
    expect(result.d_elemental.type).toBe('neutral');
    expect(result.d_elemental.magnitude).toBe(0);
  });
});
