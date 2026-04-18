import { describe, it, expect } from 'vitest';
import { computeVisualModulation, NEUTRAL_MODULATION, type VisualModulation } from '../lib/dissonance/dissonance-visual';
import type { DissonanceResult } from '../lib/dissonance/dissonance';

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
    expect(mod.vibrationStyle).toBe('neutral');
  });

  it('geometry skew increases with d_natal', () => {
    const high: DissonanceResult = { ...zero, d_natal: 0.8, intensity: 0.5 };
    const mod = computeVisualModulation(high);
    expect(mod.geometrySkew).toBeGreaterThan(0.3);
    expect(mod.penDistanceShift).toBeGreaterThan(0);
  });

  it('fractal boost increases with d_accumulated', () => {
    const high: DissonanceResult = { ...zero, d_accumulated: 0.9, intensity: 0.5 };
    const mod = computeVisualModulation(high);
    expect(mod.fractalBoost).toBeGreaterThan(0.3);
    expect(mod.emergenceBoost).toBeGreaterThan(0);
    expect(mod.tierPressure).toBeGreaterThan(0);
  });

  it('ke dissonance produces angular vibration pattern', () => {
    const ke: DissonanceResult = {
      ...zero,
      d_elemental: { magnitude: 0.7, type: 'ke', pair: ['Water', 'Fire'] },
      intensity: 0.5,
    };
    const mod = computeVisualModulation(ke);
    expect(mod.vibrationStyle).toBe('angular');
    expect(mod.colorTempShift).toBeLessThan(0); // cool
    expect(mod.flickerRate).toBeGreaterThan(0.3);
  });

  it('sheng dissonance produces organic vibration pattern', () => {
    const sheng: DissonanceResult = {
      ...zero,
      d_elemental: { magnitude: 0.7, type: 'sheng', pair: ['Wood', 'Fire'] },
      intensity: 0.5,
    };
    const mod = computeVisualModulation(sheng);
    expect(mod.vibrationStyle).toBe('organic');
    expect(mod.colorTempShift).toBeGreaterThan(0); // warm
    expect(mod.flickerRate).toBeLessThan(0.3);
  });

  it('NEUTRAL_MODULATION has all zero values', () => {
    expect(NEUTRAL_MODULATION.geometrySkew).toBe(0);
    expect(NEUTRAL_MODULATION.vibrationAmplitude).toBe(0);
    expect(NEUTRAL_MODULATION.vibrationStyle).toBe('neutral');
  });

  it('all modulation values are bounded', () => {
    const extreme: DissonanceResult = {
      d_natal: 1, d_accumulated: 1,
      d_elemental: { magnitude: 1, type: 'ke', pair: ['Water', 'Fire'] },
      intensity: 1,
    };
    const mod = computeVisualModulation(extreme);
    expect(mod.geometrySkew).toBeLessThanOrEqual(1);
    expect(mod.fractalBoost).toBeLessThanOrEqual(1);
    expect(mod.vibrationAmplitude).toBeLessThanOrEqual(1);
    expect(mod.flickerRate).toBeLessThanOrEqual(1);
  });
});
