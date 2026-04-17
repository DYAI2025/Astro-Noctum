import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isFeatureEnabled } from '../lib/feature-flags';

describe('signature_engine_cymatics flag', () => {
  beforeEach(() => { localStorage.clear(); });

  it('is on by default', () => {
    expect(isFeatureEnabled('signature_engine_cymatics')).toBe(true);
  });

  it('can be enabled via localStorage override', () => {
    localStorage.setItem('ff_signature_engine_cymatics', 'true');
    expect(isFeatureEnabled('signature_engine_cymatics')).toBe(true);
  });

  it('returns false when override is explicitly false', () => {
    localStorage.setItem('ff_signature_engine_cymatics', 'false');
    expect(isFeatureEnabled('signature_engine_cymatics')).toBe(false);
  });
});

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
      '[FeatureFlags] Critical flag disabled via override:',
      'signature_onboarding_v1'
    );
  });

  it('warns when signature_engine_v2 is overridden to false', async () => {
    localStorage.setItem('ff_signature_engine_v2', 'false');
    vi.resetModules();
    const { validateCriticalFlags } = await import('../lib/feature-flags');
    validateCriticalFlags();
    expect(console.warn).toHaveBeenCalledWith(
      '[FeatureFlags] Critical flag disabled via override:',
      'signature_engine_v2'
    );
  });
});
