import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing api.ts
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      refreshSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

import { mapChartToApiResults } from '../services/api';
import type { ChartResponse } from '../types/bafe';

const MINIMAL_CHART: ChartResponse = {
  bazi: {
    pillars: {
      year:  { stamm: 'Geng', zweig: 'Zi', tier: 'Ratte',  element: 'Metall' },
      month: { stamm: 'Bing', zweig: 'Yin', tier: 'Tiger', element: 'Feuer'  },
      day:   { stamm: 'Jia', zweig: 'Wu',   tier: 'Pferd', element: 'Holz'   },
      hour:  { stamm: 'Wu',  zweig: 'Xu',   tier: 'Hund',  element: 'Erde'   },
    },
    chinese: { day_master: 'Jia', year: { animal: 'Ratte' } },
  },
  positions: {
    Sun:  { zodiac_sign: 9 },
    Moon: { zodiac_sign: 3 },
  },
  angles: { Ascendant: 180 },
  houses: { '1': 180, '2': 210, '3': 240, '4': 270, '5': 300, '6': 330,
            '7': 0,   '8': 30,  '9': 60,  '10': 90, '11': 120, '12': 150 },
  wuxing: {
    wu_xing_vector: { Holz: 2, Feuer: 1, Erde: 3, Metall: 2, Wasser: 2 },
    dominant_element: 'Earth',
  },
  fusion: { theme: 'Balance', summary: 'Test fusion' },
  time_scales: { scale: 'test' },
};

describe('mapChartToApiResults', () => {
  it('maps bazi pillars from German keys', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.bazi.pillars?.year.stem).toBe('Geng');
    expect(result.bazi.pillars?.year.branch).toBe('Zi');
    expect(result.bazi.pillars?.year.animal).toBe('Ratte');
  });

  it('extracts day_master and zodiac_sign from chinese field', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.bazi.day_master).toBe('Jia');
    expect(result.bazi.zodiac_sign).toBe('Ratte');
  });

  it('maps Sun to Capricorn (index 9)', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.western.zodiac_sign).toBe('Capricorn');
  });

  it('maps Moon to Cancer (index 3)', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.western.moon_sign).toBe('Cancer');
  });

  it('maps Ascendant degrees to sign name', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.western.ascendant_sign).toBe('Libra');
  });

  it('converts house cusp degrees to sign names', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.western.houses['1']).toBe('Libra');
    expect(result.western.houses['4']).toBe('Capricorn');
  });

  it('maps wuxing with English and German element keys', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.wuxing.elements.Wood).toBe(2);
    expect(result.wuxing.elements.Holz).toBe(2);
    expect(result.wuxing.dominant_element).toBe('Earth');
  });

  it('passes fusion through unchanged', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect(result.fusion.theme).toBe('Balance');
  });

  it('maps time_scales to tst', () => {
    const result = mapChartToApiResults(MINIMAL_CHART);
    expect((result.tst as Record<string, unknown>).scale).toBe('test');
  });

  it('falls back to bodies when positions is absent', () => {
    const chart: ChartResponse = {
      ...MINIMAL_CHART,
      positions: undefined,
      bodies: MINIMAL_CHART.positions,
    };
    const result = mapChartToApiResults(chart);
    expect(result.western.zodiac_sign).toBe('Capricorn');
  });

  it('throws when bazi.pillars is missing', () => {
    const chart: ChartResponse = { ...MINIMAL_CHART, bazi: {} };
    expect(() => mapChartToApiResults(chart)).toThrow('/chart response missing bazi.pillars');
  });

  it('throws when both positions and bodies are absent', () => {
    const chart: ChartResponse = { ...MINIMAL_CHART, positions: undefined, bodies: undefined };
    expect(() => mapChartToApiResults(chart)).toThrow('/chart response missing positions');
  });

  it('throws when wuxing is absent', () => {
    const chart: ChartResponse = { ...MINIMAL_CHART, wuxing: undefined };
    expect(() => mapChartToApiResults(chart)).toThrow('/chart response missing wuxing');
  });
});

import { calculateAll } from '../services/api';
import * as supabaseService from '../services/supabase';

describe('calculateAll', () => {
  it('throws when /chart returns 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server Error',
    }));

    await expect(calculateAll({
      date: '1990-01-15T12:00:00',
      tz: 'Europe/Berlin',
      lon: 13.4,
      lat: 52.5,
    })).rejects.toThrow();

    vi.unstubAllGlobals();
  });

  it('returns issues: [] on success', async () => {
    const chartPayload: ChartResponse = MINIMAL_CHART;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => chartPayload,
    }));

    const result = await calculateAll({
      date: '1990-01-15T12:00:00',
      tz: 'Europe/Berlin',
      lon: 13.4,
      lat: 52.5,
    });

    expect(result.issues).toEqual([]);
    expect(result.bazi.day_master).toBe('Jia');
    vi.unstubAllGlobals();
  });

  it('calls /api/chart — not /api/calculate/chart', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MINIMAL_CHART,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({
      date: '1990-01-15T12:00:00',
      tz: 'Europe/Berlin',
      lon: 13.4,
      lat: 52.5,
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/\/api\/chart$/);
    expect(calledUrl).not.toContain('/calculate/');
    vi.unstubAllGlobals();
  });
});

describe('no-partial-write guarantee', () => {
  it('upsertAstroProfile is never called when calculateAll throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server Error',
    }));
    const upsertSpy = vi.spyOn(supabaseService, 'upsertAstroProfile');

    let errorCaught = false;
    try {
      const results = await calculateAll({
        date: '1990-01-15T12:00:00',
        tz: 'Europe/Berlin',
        lon: 13.4,
        lat: 52.5,
      });
      await supabaseService.upsertAstroProfile(
        'user-123', { date: '1990-01-15T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 },
        results as any, 'interpretation', {}
      );
    } catch {
      errorCaught = true;
    }

    expect(errorCaught).toBe(true);
    expect(upsertSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
