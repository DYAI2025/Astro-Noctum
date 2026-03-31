import { describe, it, expect } from 'vitest';
import { soulprintToDimensionWeights } from '@/packages/shared/src/signatur';

describe('V3 data bridge', () => {
  it('soulprintToDimensionWeights returns 6 dimension keys', () => {
    const sectors = [0.8, 0.6, 0.4, 0.7, 0.5, 0.3, 0.9, 0.2, 0.6, 0.4, 0.8, 0.5];
    const result = soulprintToDimensionWeights(sectors);
    const keys = Object.keys(result);
    expect(keys.length).toBe(6);
    expect(keys.every(k => !['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(k))).toBe(true);
    expect(Object.values(result).every(v => v >= 0 && v <= 1)).toBe(true);
  });
});
