import { describe, it, expect } from 'vitest';
import { dayModeFromHarmony } from '../lib/daily-pulse/mode';

describe('dayModeFromHarmony', () => {
  it.each([
    [0.20, 'spannung', 0.45],
    [0.44, 'spannung', 0.018],
    [0.46, 'pulse', 0.018],
    [0.49, 'pulse', 0.072],
    [0.50, 'trace', 0.090],
    [0.78, 'trace', 0.6],
    [1.00, 'trace', 1.0],
  ])('h=%f → mode=%s, intensity≈%f', (h, mode, expected) => {
    const r = dayModeFromHarmony(h);
    expect(r.mode).toBe(mode);
    expect(r.intensity).toBeCloseTo(expected, 2);
  });

  it('clamps intensity to [0,1] for out-of-range h', () => {
    // h = -1 → |(-1) - 0.45| / 0.55 = 2.636 → clamped to 1
    expect(dayModeFromHarmony(-1).intensity).toBe(1);
    // h = 2 → |2 - 0.45| / 0.55 = 2.818 → clamped to 1
    expect(dayModeFromHarmony(2).intensity).toBe(1);
    // h = 0.45 → intensity ≈ 0 (closest to threshold)
    expect(dayModeFromHarmony(0.45).intensity).toBeCloseTo(0, 5);
  });
});
