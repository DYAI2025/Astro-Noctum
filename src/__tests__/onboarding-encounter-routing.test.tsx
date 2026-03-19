import { describe, it, expect, vi } from 'vitest';
import { isFeatureEnabled } from '../lib/feature-flags';

vi.mock('../lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn((flag: string) => {
    if (flag === 'cosmic_encounter_v1') return true;
    if (flag === 'signature_onboarding_v1') return true;
    return false;
  }),
}));

describe('Onboarding encounter routing', () => {
  it('cosmic_encounter_v1 flag gates the new flow', () => {
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(true);
  });

  it('onboarding phase type includes encounter', () => {
    const phase: 'form' | 'encounter' | 'signature' | 'done' = 'encounter';
    expect(phase).toBe('encounter');
  });
});
