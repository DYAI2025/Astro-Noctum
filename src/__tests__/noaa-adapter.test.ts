import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNoaaAdapter, createV1Adapter, createV2Adapter } from '@/src/lib/space-weather/noaa-adapter';

// ── Structural tests ──────────────────────────────────────────────────────────

describe('NOAA Adapter module', () => {
  it('exports createNoaaAdapter', () => {
    expect(createNoaaAdapter).toBeDefined();
    expect(typeof createNoaaAdapter).toBe('function');
  });

  it('adapter has all required methods', () => {
    const adapter = createNoaaAdapter();
    expect(adapter.version).toBe('v2');
    expect(typeof adapter.fetchKp).toBe('function');
    expect(typeof adapter.fetchF107).toBe('function');
    expect(typeof adapter.fetchXray).toBe('function');
    expect(typeof adapter.fetchProton).toBe('function');
    expect(typeof adapter.fetchKpForecast).toBe('function');
    expect(typeof adapter.fetch3DayForecast).toBe('function');
  });

  it('v1 adapter version tag is "v1"', () => {
    expect(createV1Adapter().version).toBe('v1');
  });

  it('v2 adapter version tag is "v2"', () => {
    expect(createV2Adapter().version).toBe('v2');
  });
});

// ── v2/v1 field-name parsing (mocked fetch) ───────────────────────────────────

describe('NOAA Adapter v2→v1 fallback chain (mocked)', () => {
  const KP_V1_PAYLOAD = [
    { kp_index: 3.33, time_tag: '2026-03-22T12:00:00Z', estimated: false, noaa_scale: 'G1' },
  ];
  const KP_V2_PAYLOAD = [
    { kp_value: 4.67, timestamp: '2026-03-22T12:00:00Z', is_estimated: false, g_scale: 'G2' },
  ];
  const KP_MIXED_PAYLOAD = [
    // Both v1 and v2 keys present (transition period)
    {
      kp_index: 2.0,
      kp_value: 2.33,
      time_tag: '2026-03-22T11:00:00Z',
      timestamp: '2026-03-22T12:00:00Z',
      estimated: false,
      is_estimated: false,
      noaa_scale: 'G0',
      g_scale: 'G0',
    },
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(payload: unknown, ok = true) {
    vi.mocked(fetch).mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => payload,
    } as Response);
  }

  it('v2 adapter reads kp_value field', async () => {
    mockFetch(KP_V2_PAYLOAD);
    const adapter = createV2Adapter();
    const result = await adapter.fetchKp();
    expect(result).not.toBeNull();
    expect(result!.kp).toBeCloseTo(4.67);
    expect(result!.noaaScale).toBe('G2');
    expect(result!.estimated).toBe(false);
  });

  it('v1 adapter reads kp_index field', async () => {
    mockFetch(KP_V1_PAYLOAD);
    const adapter = createV1Adapter();
    const result = await adapter.fetchKp();
    expect(result).not.toBeNull();
    expect(result!.kp).toBeCloseTo(3.33);
    expect(result!.noaaScale).toBe('G1');
  });

  it('composite adapter falls back to v1 when v2 returns null', async () => {
    // First call returns v2 payload with null kp_value, second call returns v1 payload
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ kp_value: null, kp_index: 5.0, estimated: false }] } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => KP_V1_PAYLOAD } as Response);
    const adapter = createNoaaAdapter();
    const result = await adapter.fetchKp();
    expect(result).not.toBeNull();
  });

  it('composite adapter handles v2+v1 mixed payload (transition period)', async () => {
    mockFetch(KP_MIXED_PAYLOAD);
    const adapter = createNoaaAdapter();
    const result = await adapter.fetchKp();
    expect(result).not.toBeNull();
    // v2 key should win: kp_value=2.33
    expect(result!.kp).toBeCloseTo(2.33);
  });

  it('fetchKp returns null on empty array', async () => {
    mockFetch([]);
    const adapter = createV1Adapter();
    const result = await adapter.fetchKp();
    expect(result).toBeNull();
  });

  it('fetchKp returns null on HTTP error', async () => {
    mockFetch(null, false);
    const adapter = createV1Adapter();
    const result = await adapter.fetchKp();
    expect(result).toBeNull();
  });
});

describe('Space Weather types', () => {
  it('exports all required types', async () => {
    const mod = await import('@/src/lib/space-weather/types');
    expect(mod).toBeDefined();
  });
});
