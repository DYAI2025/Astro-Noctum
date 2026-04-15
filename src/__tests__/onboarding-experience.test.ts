import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('Experience API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
  });

  it('bootstrapExperience sends correct payload', async () => {
    const { bootstrapExperience } = await import('../services/experience');
    const mockResponse = {
      profile: { sun_sign: 'Loewe', moon_sign: 'Waage', ascendant_sign: 'Jungfrau', day_master: 'Xin', harmony_index: 0.78 },
      soulprint_sectors: Array(12).fill(0.083),
      narratives: { core_summary: 'Core', context_summary: 'Context', integration_summary: 'Integration' },
      signature_blueprint: { seed: 'sig_v1_test', visual: { symmetry: 0.5, curvature: 0.5, angularity: 0.5, density: 0.5, contrast: 0.5, orbit_count: 3 } },
      meta: { engine_version: '1.0.0' },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await bootstrapExperience({
      date: '1990-08-14', time: '07:42:00', tz: 'Europe/Berlin',
      lat: 53.5511, lon: 9.9937,
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/experience/bootstrap', expect.objectContaining({
      method: 'POST',
      headers: expect.any(Headers),
    }));
    expect(result.profile.sun_sign).toBe('Loewe');
    expect(result.soulprint_sectors).toHaveLength(12);
  });

  it('bootstrapExperience throws on non-ok response', async () => {
    const { bootstrapExperience } = await import('../services/experience');
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });

    await expect(bootstrapExperience({
      date: '1990-08-14', time: '07:42:00', tz: 'Europe/Berlin',
      lat: 53.5511, lon: 9.9937,
    })).rejects.toThrow('Bootstrap failed: 502');
  });

  it('signatureDelta sends keyword correctly', async () => {
    const { signatureDelta } = await import('../services/experience');
    const mockResponse = {
      quiz_sectors: Array(12).fill(0.083),
      narratives: { core_summary: 'Core', context_summary: 'Context', integration_summary: 'Integration' },
      signature_delta: { curvature: 0.1, contrast: 0.05, density: -0.02 },
      signature_blueprint: { seed: 'sig_v1_new', visual: { symmetry: 0.5, curvature: 0.6, angularity: 0.5, density: 0.48, contrast: 0.55, orbit_count: 3 } },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await signatureDelta(
      Array(12).fill(0.083),
      { seed: 'sig_v1_test' },
      'expression',
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(Array.isArray(body.quiz_answer)).toBe(true);
    expect(body.quiz_answer[0]).toEqual({ id: 'expression', weight: 1.0 });
    expect(result.signature_delta.curvature).toBe(0.1);
  });

  it('fetchDailyExperience returns structured response', async () => {
    const { fetchDailyExperience } = await import('../services/experience');
    const mockResponse = {
      date: '2026-03-16',
      western: { summary: 'W', themes: ['A'], caution: 'C', opportunity: 'O', evidence: {} },
      eastern: { summary: 'E', themes: ['B'], caution: 'C', opportunity: 'O', evidence: {} },
      fusion: { summary: 'F', synthesis: 'S', action: 'A', pushworthy: false, harmony_index: 0.46, day_mode: 'pulse' },
      meta: { engine_version: '1.0.0' },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchDailyExperience(
      { date: '1990-08-14', time: '07:42:00', tz: 'Europe/Berlin', lat: 53.5511, lon: 9.9937 },
      Array(12).fill(0.083),
      Array(12).fill(0),
      '2026-03-16',
    );

    expect(result.date).toBe('2026-03-16');
    expect(result.western.themes).toContain('A');
    expect(result.fusion.synthesis).toBe('S');
  });
});

describe('Feature Flags', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('returns default flag values', async () => {
    const { isFeatureEnabled } = await import('../lib/feature-flags');
    expect(isFeatureEnabled('signature_onboarding_v1')).toBe(true);
    expect(isFeatureEnabled('daily_modal_v1')).toBe(true);
  });

  it('respects localStorage override', async () => {
    localStorage.setItem('ff_signature_onboarding_v1', 'false');
    const mod = await import('../lib/feature-flags');
    expect(mod.isFeatureEnabled('signature_onboarding_v1')).toBe(false);
  });
});

describe('Zod Schema Validation', () => {
  it('rejects bootstrap response with 11 sectors', async () => {
    const { BootstrapResponseSchema } = await import('../lib/schemas/experience');
    const bad = {
      profile: { sun_sign: 'X', moon_sign: 'X', ascendant_sign: 'X', day_master: 'X', harmony_index: 0.5 },
      soulprint_sectors: Array(11).fill(0.09),
      signature_blueprint: { seed: 'test' },
      meta: { engine_version: '1.0.0' },
    };
    expect(BootstrapResponseSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts valid daily response with null push_text', async () => {
    const { DailyResponseSchema } = await import('../lib/schemas/experience');
    const valid = {
      date: '2026-03-16',
      western: { summary: 'W', themes: ['A'], caution: 'C', opportunity: 'O', evidence: {} },
      eastern: { summary: 'E', themes: ['B'], caution: 'C', opportunity: 'O', evidence: {} },
      fusion: { summary: 'F', synthesis: 'S', action: 'A', pushworthy: false, push_text: null, harmony_index: 0.48, day_mode: 'pulse' },
      meta: { engine_version: '1.0.0' },
    };
    expect(DailyResponseSchema.safeParse(valid).success).toBe(true);
  });
});
