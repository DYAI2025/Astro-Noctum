import { describe, it, expect } from 'vitest';
import { syntheticSoulprintFromSign, isSyntheticSoulprint } from '../lib/signatur/weight-utils';

describe('isSyntheticSoulprint', () => {
  it('returns true for synthetic soulprint from known sign', () => {
    const synthetic = syntheticSoulprintFromSign('Leo');
    expect(isSyntheticSoulprint(synthetic)).toBe(true);
  });

  it('returns true for uniform 0.5 fallback (unknown sign)', () => {
    expect(isSyntheticSoulprint(Array(12).fill(0.5))).toBe(true);
  });

  it('returns false for real soulprint with varied distribution', () => {
    const real = [0.1, 0.9, 0.3, 0.7, 0.85, 0.2, 0.6, 0.4, 0.15, 0.95, 0.5, 0.35];
    expect(isSyntheticSoulprint(real)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isSyntheticSoulprint(null as unknown as number[])).toBe(false);
    expect(isSyntheticSoulprint(undefined as unknown as number[])).toBe(false);
  });
});
