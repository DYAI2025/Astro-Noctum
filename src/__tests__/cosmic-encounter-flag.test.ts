import { describe, it, expect, beforeEach } from 'vitest';
import { isFeatureEnabled } from '../lib/feature-flags';

describe('cosmic_encounter_v1 feature flag', () => {
  beforeEach(() => {
    localStorage.removeItem('ff_cosmic_encounter_v1');
  });

  it('defaults to false', () => {
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });

  it('can be enabled via localStorage override', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'true');
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(true);
  });

  it('can be explicitly disabled via localStorage', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'false');
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });
});
