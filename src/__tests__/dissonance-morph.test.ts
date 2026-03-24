import { describe, it, expect } from 'vitest';
import { lerpModulation, dissonanceEase, morphDuration } from '../lib/fusion-ring/dissonance-morph';
import type { VisualModulation } from '../lib/fusion-ring/dissonance-visual';

const neutral: VisualModulation = {
  geometrySkew: 0, penDistanceShift: 0,
  fractalBoost: 0, emergenceBoost: 0, tierPressure: 0,
  vibrationAmplitude: 0, vibrationStyle: 'neutral',
  colorTempShift: 0, flickerRate: 0,
};

const high: VisualModulation = {
  geometrySkew: 0.8, penDistanceShift: 0.4,
  fractalBoost: 0.6, emergenceBoost: 0.5, tierPressure: 0.4,
  vibrationAmplitude: 0.7, vibrationStyle: 'angular',
  colorTempShift: -0.7, flickerRate: 0.6,
};

describe('lerpModulation', () => {
  it('at t=0 returns first modulation', () => {
    const result = lerpModulation(neutral, high, 0);
    expect(result.geometrySkew).toBeCloseTo(0);
    expect(result.vibrationStyle).toBe('neutral');
  });

  it('at t=1 returns second modulation', () => {
    const result = lerpModulation(neutral, high, 1);
    expect(result.geometrySkew).toBeCloseTo(0.8);
    expect(result.vibrationStyle).toBe('angular');
  });

  it('at t=0.5 interpolates numeric fields', () => {
    const result = lerpModulation(neutral, high, 0.5);
    expect(result.geometrySkew).toBeCloseTo(0.4);
    expect(result.fractalBoost).toBeCloseTo(0.3);
  });

  it('vibrationStyle switches at t=0.5', () => {
    expect(lerpModulation(neutral, high, 0.49).vibrationStyle).toBe('neutral');
    expect(lerpModulation(neutral, high, 0.5).vibrationStyle).toBe('angular');
  });
});

describe('dissonanceEase', () => {
  it('returns 0 at t=0 for all styles', () => {
    expect(dissonanceEase(0, 'angular')).toBeCloseTo(0);
    expect(dissonanceEase(0, 'organic')).toBeCloseTo(0);
    expect(dissonanceEase(0, 'neutral')).toBeCloseTo(0);
  });

  it('returns 1 at t=1 for all styles', () => {
    expect(dissonanceEase(1, 'angular')).toBeCloseTo(1);
    expect(dissonanceEase(1, 'organic')).toBeCloseTo(1);
    expect(dissonanceEase(1, 'neutral')).toBeCloseTo(1);
  });

  it('angular eases faster initially than organic', () => {
    // At t=0.2, angular (sharp attack) should be further along than organic
    expect(dissonanceEase(0.2, 'angular')).toBeGreaterThan(dissonanceEase(0.2, 'organic'));
  });
});

describe('morphDuration', () => {
  it('returns ~800ms at zero intensity', () => {
    expect(morphDuration(0)).toBeCloseTo(800);
  });

  it('returns ~2500ms at max intensity', () => {
    expect(morphDuration(1)).toBeCloseTo(2500);
  });

  it('clamps values above 1', () => {
    expect(morphDuration(2)).toBeCloseTo(2500);
  });

  it('scales linearly between extremes', () => {
    expect(morphDuration(0.5)).toBeCloseTo(1650);
  });
});
