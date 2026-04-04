import { describe, it, expect } from 'vitest';
import { syntheticSoulprintFromSign } from '../lib/signatur/weight-utils';

describe('syntheticSoulprintFromSign', () => {
  it('returns a 12-element array for a valid sign', () => {
    const result = syntheticSoulprintFromSign('Aries');
    expect(result).toHaveLength(12);
    expect(result.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('returns the same array for the same sign (deterministic)', () => {
    const a = syntheticSoulprintFromSign('Cancer');
    const b = syntheticSoulprintFromSign('Cancer');
    expect(a).toEqual(b);
  });

  it('has the highest value at the sign index (0=Aries...11=Pisces)', () => {
    const result = syntheticSoulprintFromSign('Cancer'); // index 3
    expect(result[3]).toBeGreaterThan(result[0]);
  });

  it('returns a uniform 0.5 array for empty string', () => {
    const result = syntheticSoulprintFromSign('');
    expect(result).toEqual(Array(12).fill(0.5));
  });

  it('returns a uniform 0.5 array for unknown sign', () => {
    const result = syntheticSoulprintFromSign('NotASign');
    expect(result).toEqual(Array(12).fill(0.5));
  });
});
