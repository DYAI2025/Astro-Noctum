import { describe, it, expect } from 'vitest';
import { computeJieqiState, solarLongitude } from '../lib/jieqi/compute';

describe('solarLongitude', () => {
  it('returns ~0 deg around March equinox (2026-03-20)', () => {
    const date = new Date('2026-03-20T12:00:00Z');
    const lon = solarLongitude(date);
    // Spring equinox: should be near 0 or near 360
    expect(lon > 355 || lon < 5).toBe(true);
  });

  it('returns ~90 deg around June solstice (2026-06-21)', () => {
    const date = new Date('2026-06-21T12:00:00Z');
    const lon = solarLongitude(date);
    expect(lon).toBeGreaterThan(85);
    expect(lon).toBeLessThan(95);
  });
});

describe('computeJieqiState', () => {
  it('returns valid JieqiState with current and next term', () => {
    const state = computeJieqiState(new Date('2026-03-19T12:00:00Z'));
    expect(state.current.name).toBeDefined();
    expect(state.next.name).toBeDefined();
    expect(state.secondsToNext).toBeGreaterThan(0);
    expect(typeof state.isTransitionWindow).toBe('boolean');
  });

  it('identifies Jing Zhe period on March 19 heading toward Chun Fen', () => {
    const state = computeJieqiState(new Date('2026-03-19T12:00:00Z'));
    expect(state.current.name).toBe('Jing Zhe');
    expect(state.next.name).toBe('Chun Fen');
    expect(state.isTransitionWindow).toBe(true);
  });

  it('returns positive countdown', () => {
    const state = computeJieqiState();
    expect(state.secondsToNext).toBeGreaterThan(0);
    expect(state.nextTransitionAt).toBeTruthy();
  });
});
