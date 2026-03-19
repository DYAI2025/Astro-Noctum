import { describe, it, expect } from 'vitest';
import {
  computeSolarPressureScore,
  computeRingModulation,
  kpToVisualIntensity,
} from '@/src/lib/space-weather/solar-pressure';

describe('computeSolarPressureScore', () => {
  it('returns 0 for calm conditions', () => {
    expect(computeSolarPressureScore(0, 0, 0)).toBe(0);
  });

  it('returns moderate value for Kp 5 + C-class', () => {
    const score = computeSolarPressureScore(5, 1e-6, 1);
    expect(score).toBeGreaterThan(0.25);
    expect(score).toBeLessThan(0.65);
  });

  it('returns near 1.0 for extreme storm', () => {
    const score = computeSolarPressureScore(9, 1e-4, 1000);
    expect(score).toBeGreaterThan(0.85);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('is always in [0, 1]', () => {
    expect(computeSolarPressureScore(-1, -1, -1)).toBeGreaterThanOrEqual(0);
    expect(computeSolarPressureScore(99, 1, 99999)).toBeLessThanOrEqual(1);
  });
});

describe('computeRingModulation', () => {
  it('returns 1.0 for no pressure', () => {
    expect(computeRingModulation(0, 0)).toBe(1.0);
  });

  it('is capped at 1.5', () => {
    expect(computeRingModulation(1.0, 1.0)).toBe(1.5);
  });

  it('returns intermediate for moderate conditions', () => {
    const mod = computeRingModulation(0.5, 0.3);
    expect(mod).toBeGreaterThan(1.0);
    expect(mod).toBeLessThan(1.5);
  });
});

describe('kpToVisualIntensity', () => {
  it('G0 for Kp < 5', () => {
    expect(kpToVisualIntensity(4).gScale).toBe('G0');
    expect(kpToVisualIntensity(4).triggerEffect).toBe(false);
  });

  it('G3+ triggers visual effect', () => {
    expect(kpToVisualIntensity(7).triggerEffect).toBe(true);
    expect(kpToVisualIntensity(7).gScale).toBe('G3');
    expect(kpToVisualIntensity(7).intensityBoost).toBe(0.25);
  });

  it('G5 at Kp 9 has max boost', () => {
    expect(kpToVisualIntensity(9).intensityBoost).toBe(0.50);
    expect(kpToVisualIntensity(9).gScale).toBe('G5');
  });
});
