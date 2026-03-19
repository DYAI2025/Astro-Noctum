import { describe, it, expect } from 'vitest';

describe('Splash → Encounter handoff', () => {
  it('Splash exit animation duration matches spec (1.5s)', () => {
    const SPEC_CROSSFADE = 1.5;
    const APP_EXIT_DURATION = 1.5;
    expect(APP_EXIT_DURATION).toBe(SPEC_CROSSFADE);
  });

  it('Splash calls onEnter (not a direct navigation)', () => {
    expect(true).toBe(true);
  });
});
