import { describe, it, expect, beforeEach } from 'vitest';
import { isFeatureEnabled } from '../lib/feature-flags';

describe('cosmic_encounter_v1 feature flag', () => {
  beforeEach(() => {
    localStorage.removeItem('ff_cosmic_encounter_v1');
  });

  it('is locked off by default (not yet released)', () => {
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });

  it('cannot be enabled via localStorage — flag is locked off', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'true');
    // LOCKED_OFF flags ignore localStorage overrides
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });

  it('can be explicitly disabled via localStorage (redundant but valid)', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'false');
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });
});
