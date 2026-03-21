import { describe, it, expect } from 'vitest';
import { isSignificantGeometryEvent } from '../lib/space-weather/geometry-gating';

describe('isSignificantGeometryEvent', () => {
  const baseContext = { kp: 2, hasCME: false, isJieqiTransition: false };

  it('returns false for conjunction without solar context', () => {
    expect(isSignificantGeometryEvent({ type: 'conjunction' }, baseContext)).toBe(false);
  });

  it('returns false for non-geometry event even with storm', () => {
    expect(isSignificantGeometryEvent({ type: 'transit' }, { ...baseContext, kp: 7 })).toBe(false);
  });

  it('returns true for conjunction + Kp >= 5', () => {
    expect(isSignificantGeometryEvent({ type: 'conjunction' }, { ...baseContext, kp: 5 })).toBe(true);
  });

  it('returns true for opposition + CME arrival', () => {
    expect(isSignificantGeometryEvent({ type: 'opposition' }, { ...baseContext, hasCME: true })).toBe(true);
  });

  it('returns true for equinox + Jieqi transition', () => {
    expect(isSignificantGeometryEvent({ type: 'equinox' }, { ...baseContext, isJieqiTransition: true })).toBe(true);
  });

  it('returns true for solstice + Kp >= 5', () => {
    expect(isSignificantGeometryEvent({ type: 'solstice' }, { ...baseContext, kp: 6 })).toBe(true);
  });
});
