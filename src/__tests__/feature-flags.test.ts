import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('validateCriticalFlags', () => {
  beforeEach(() => {
    // Clear localStorage overrides before each test
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not warn when all critical flags are enabled (default state)', async () => {
    // Fresh import — no localStorage overrides set
    vi.resetModules();
    const { validateCriticalFlags } = await import('../lib/feature-flags');
    validateCriticalFlags();
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('[FeatureFlags]'),
      expect.anything()
    );
  });

  it('warns when signature_onboarding_v1 is overridden to false', async () => {
    localStorage.setItem('ff_signature_onboarding_v1', 'false');
    vi.resetModules();
    const { validateCriticalFlags } = await import('../lib/feature-flags');
    validateCriticalFlags();
    expect(console.warn).toHaveBeenCalledWith(
      '[FeatureFlags] Critical flag disabled:',
      'signature_onboarding_v1'
    );
  });

  it('warns when signature_engine_v2 is overridden to false', async () => {
    localStorage.setItem('ff_signature_engine_v2', 'false');
    vi.resetModules();
    const { validateCriticalFlags } = await import('../lib/feature-flags');
    validateCriticalFlags();
    expect(console.warn).toHaveBeenCalledWith(
      '[FeatureFlags] Critical flag disabled:',
      'signature_engine_v2'
    );
  });
});
