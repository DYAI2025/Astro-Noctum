/**
 * contract-chart.test.ts
 *
 * Contract tests for the canonical /api/chart endpoint.
 * Validates request body shape and response mapper field extractions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      refreshSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

import { mapChartToApiResults, calculateAll } from '../services/api';
import type { ChartResponse } from '../types/bafe';

// ── Shared fixture ────────────────────────────────────────────────────────────

const FULL_CHART: ChartResponse = {
  bazi: {
    pillars: {
      year:  { stamm: 'Ren', zweig: 'Chen', tier: 'Drache', element: 'Wasser' },
      month: { stamm: 'Wu',  zweig: 'Xu',   tier: 'Hund',   element: 'Erde'   },
      day:   { stamm: 'Yi',  zweig: 'Hai',  tier: 'Schwein',element: 'Holz'   },
      hour:  { stamm: 'Gui', zweig: 'You',  tier: 'Hahn',   element: 'Wasser' },
    },
    chinese: { day_master: 'Yi', year: { animal: 'Drache' } },
  },
  positions: {
    Sun:  { zodiac_sign: 5 },  // Virgo
    Moon: { zodiac_sign: 11 }, // Pisces
  },
  angles: { Ascendant: 120 }, // 120° = Leo
  houses: {
    '1': 120, '2': 150, '3': 180,
    '4': 210, '5': 240, '6': 270,
    '7': 300, '8': 330, '9': 0,
    '10': 30, '11': 60, '12': 90,
  },
  wuxing: {
    wu_xing_vector: { Holz: 2, Feuer: 0, Erde: 3, Metall: 1, Wasser: 4 },
    dominant_element: 'Water',
  },
  fusion: { theme: 'Depth', summary: 'Water-heavy chart' },
  time_scales: { decade: 'Water-Horse' },
};

// ── Request body contract ─────────────────────────────────────────────────────

describe('/api/chart request body', () => {
  beforeEach(() => { vi.unstubAllGlobals(); });

  it('uses local_datetime field (not date)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => FULL_CHART,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1988-08-08T08:08:00', tz: 'Asia/Shanghai', lon: 121.47, lat: 31.23 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.local_datetime).toBe('1988-08-08T08:08:00');
    expect(body).not.toHaveProperty('date');
  });

  it('includes tz, lat, lon in request body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => FULL_CHART,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1988-08-08T08:08:00', tz: 'Asia/Shanghai', lon: 121.47, lat: 31.23 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.tz).toBe('Asia/Shanghai');
    expect(body.lat).toBe(31.23);
    expect(body.lon).toBe(121.47);
  });

  it('includes ambiguousTime and nonexistentTime sentinel values', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => FULL_CHART,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1988-08-08T08:08:00', tz: 'UTC', lon: 0, lat: 0 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.ambiguousTime).toBe('earlier');
    expect(body.nonexistentTime).toBe('error');
  });

  it('sends to /api/chart not /api/calculate/chart', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => FULL_CHART,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1988-08-08T08:08:00', tz: 'UTC', lon: 0, lat: 0 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/\/api\/chart$/);
    expect(calledUrl).not.toContain('/calculate/');
  });
});

// ── Response mapper — field extraction contract ───────────────────────────────

describe('/api/chart response mapper — field extractions', () => {
  it('extracts sun_sign from positions.Sun.zodiac_sign (Virgo = index 5)', () => {
    const result = mapChartToApiResults(FULL_CHART);
    expect(result.western.zodiac_sign).toBe('Virgo');
  });

  it('extracts moon_sign from positions.Moon.zodiac_sign (Pisces = index 11)', () => {
    const result = mapChartToApiResults(FULL_CHART);
    expect(result.western.moon_sign).toBe('Pisces');
  });

  it('extracts ascendant_sign from angles.Ascendant degrees (120° = Leo)', () => {
    const result = mapChartToApiResults(FULL_CHART);
    expect(result.western.ascendant_sign).toBe('Leo');
  });

  it('extracts day_master from bazi.chinese.day_master', () => {
    const result = mapChartToApiResults(FULL_CHART);
    expect(result.bazi.day_master).toBe('Yi');
  });

  it('passes through fusion theme and summary', () => {
    const result = mapChartToApiResults(FULL_CHART);
    expect(result.fusion.theme).toBe('Depth');
    expect((result.fusion as Record<string, unknown>).summary).toBe('Water-heavy chart');
  });

  it('maps time_scales to tst in output', () => {
    const result = mapChartToApiResults(FULL_CHART);
    expect((result.tst as Record<string, unknown>).decade).toBe('Water-Horse');
  });

  it('converts all 12 house cusp degrees to sign name strings', () => {
    const result = mapChartToApiResults(FULL_CHART);
    // House 1 = 120° = Leo, House 7 = 300° = Aquarius (300/30=10)
    expect(result.western.houses['1']).toBe('Leo');
    expect(result.western.houses['7']).toBe('Aquarius');
    expect(typeof result.western.houses['12']).toBe('string');
    expect(result.western.houses['12']).not.toBe('');
  });

  it('passes string house values through unchanged', () => {
    const chartWithStringHouses: ChartResponse = {
      ...FULL_CHART,
      houses: { '1': 'Leo', '7': 'Aquarius' },
    };
    const result = mapChartToApiResults(chartWithStringHouses);
    expect(result.western.houses['1']).toBe('Leo');
    expect(result.western.houses['7']).toBe('Aquarius');
  });
});

// ── Validation: input should be rejected ─────────────────────────────────────

describe('calculateAll — input validation', () => {
  it('throws for missing date', async () => {
    await expect(
      calculateAll({ date: '', tz: 'UTC', lon: 0, lat: 0 }),
    ).rejects.toThrow(/incomplete/i);
  });

  it('throws for missing timezone', async () => {
    await expect(
      calculateAll({ date: '1990-01-15T12:00:00', tz: '', lon: 0, lat: 0 }),
    ).rejects.toThrow(/incomplete/i);
  });

  it('throws for out-of-range latitude', async () => {
    await expect(
      calculateAll({ date: '1990-01-15T12:00:00', tz: 'UTC', lon: 0, lat: 91 }),
    ).rejects.toThrow(/Latitude/i);
  });

  it('throws for out-of-range longitude', async () => {
    await expect(
      calculateAll({ date: '1990-01-15T12:00:00', tz: 'UTC', lon: 181, lat: 0 }),
    ).rejects.toThrow(/Longitude/i);
  });
});
