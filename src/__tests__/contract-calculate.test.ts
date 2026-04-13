/**
 * contract-calculate.test.ts
 *
 * API contract tests for src/services/api.ts mapper assumptions.
 * Validates /api/calculate/* and /api/chart request shapes + response mapping.
 * These are schema/contract tests — no network calls.
 */

import { describe, it, expect, vi } from 'vitest';

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GERMAN_PILLARS = {
  year:  { stamm: 'Geng', zweig: 'Zi',  tier: 'Ratte',  element: 'Metall' },
  month: { stamm: 'Bing', zweig: 'Yin', tier: 'Tiger',  element: 'Feuer'  },
  day:   { stamm: 'Jia',  zweig: 'Wu',  tier: 'Pferd',  element: 'Holz'   },
  hour:  { stamm: 'Wu',   zweig: 'Xu',  tier: 'Hund',   element: 'Erde'   },
};

const ENGLISH_PILLARS = {
  year:  { stem: 'Geng', branch: 'Zi',  animal: 'Ratte',  element: 'Metall' },
  month: { stem: 'Bing', branch: 'Yin', animal: 'Tiger',  element: 'Feuer'  },
  day:   { stem: 'Jia',  branch: 'Wu',  animal: 'Pferd',  element: 'Holz'   },
  hour:  { stem: 'Wu',   branch: 'Xu',  animal: 'Hund',   element: 'Erde'   },
};

const POSITIONS_PAYLOAD = {
  Sun:  { zodiac_sign: 0 }, // Aries
  Moon: { zodiac_sign: 6 }, // Libra
};

const CHART_BASE: Omit<ChartResponse, 'positions' | 'bodies'> = {
  bazi: {
    pillars: GERMAN_PILLARS,
    chinese: { day_master: 'Jia', year: { animal: 'Ratte' } },
  },
  angles: { Ascendant: 60 },  // 60° = Gemini
  houses: { '1': 60, '7': 240 },
  wuxing: {
    wu_xing_vector: { Holz: 3, Feuer: 1, Erde: 2, Metall: 1, Wasser: 3 },
    dominant_element: 'Holz',
  },
  fusion: { theme: 'Harmony' },
  time_scales: { macro: 'test' },
};

// ── BaZi pillar key mapping ───────────────────────────────────────────────────

describe('mapChartToApiResults — BaZi German key mapping', () => {
  it('maps stamm → stem, zweig → branch, tier → animal', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);

    expect(result.bazi.pillars?.year.stem).toBe('Geng');
    expect(result.bazi.pillars?.year.branch).toBe('Zi');
    expect(result.bazi.pillars?.year.animal).toBe('Ratte');
    expect(result.bazi.pillars?.year.element).toBe('Metall');
  });

  it('maps all four pillars (year/month/day/hour)', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);

    expect(result.bazi.pillars?.month.stem).toBe('Bing');
    expect(result.bazi.pillars?.day.stem).toBe('Jia');
    expect(result.bazi.pillars?.hour.stem).toBe('Wu');
  });

  it('maps English key pillars when stamm/zweig/tier absent', () => {
    const chart: ChartResponse = {
      ...CHART_BASE,
      positions: POSITIONS_PAYLOAD,
      bazi: {
        pillars: ENGLISH_PILLARS,
        chinese: { day_master: 'Jia', year: { animal: 'Ratte' } },
      },
    };
    const result = mapChartToApiResults(chart);

    expect(result.bazi.pillars?.year.stem).toBe('Geng');
    expect(result.bazi.pillars?.year.branch).toBe('Zi');
    expect(result.bazi.pillars?.year.animal).toBe('Ratte');
  });

  it('extracts day_master from bazi.chinese.day_master', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);
    expect(result.bazi.day_master).toBe('Jia');
  });

  it('extracts zodiac_sign (BaZi animal) from bazi.chinese.year.animal', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);
    expect(result.bazi.zodiac_sign).toBe('Ratte');
  });

  it('falls back to pillars.day.stamm for day_master when chinese missing', () => {
    const chart: ChartResponse = {
      ...CHART_BASE,
      positions: POSITIONS_PAYLOAD,
      bazi: { pillars: GERMAN_PILLARS },
    };
    const result = mapChartToApiResults(chart);
    expect(result.bazi.day_master).toBe('Jia');
  });
});

// ── positions vs bodies dual-key support ─────────────────────────────────────

describe('mapChartToApiResults — positions / bodies dual-key', () => {
  it('reads Sun/Moon zodiac_sign from positions key', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);
    expect(result.western.zodiac_sign).toBe('Aries');
    expect(result.western.moon_sign).toBe('Libra');
  });

  it('reads Sun/Moon zodiac_sign from bodies key when positions absent', () => {
    const chart: ChartResponse = { ...CHART_BASE, bodies: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);
    expect(result.western.zodiac_sign).toBe('Aries');
    expect(result.western.moon_sign).toBe('Libra');
  });

  it('prefers positions over bodies when both present', () => {
    const altBodies = {
      Sun:  { zodiac_sign: 1 }, // Taurus
      Moon: { zodiac_sign: 7 }, // Scorpio
    };
    const chart: ChartResponse = {
      ...CHART_BASE,
      positions: POSITIONS_PAYLOAD,
      bodies: altBodies,
    };
    const result = mapChartToApiResults(chart);
    expect(result.western.zodiac_sign).toBe('Aries');  // from positions
  });

  it('throws when neither positions nor bodies present', () => {
    const chart: ChartResponse = { ...CHART_BASE };
    expect(() => mapChartToApiResults(chart)).toThrow('/chart response missing positions/bodies');
  });
});

// ── Wu-Xing German / English dual-key mapping ────────────────────────────────

describe('mapChartToApiResults — Wu-Xing bilingual keys', () => {
  it('maps German wu_xing_vector keys to English element names', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);
    expect(result.wuxing.elements.Wood).toBe(3);   // Holz → Wood
    expect(result.wuxing.elements.Fire).toBe(1);   // Feuer → Fire
    expect(result.wuxing.elements.Earth).toBe(2);  // Erde → Earth
    expect(result.wuxing.elements.Metal).toBe(1);  // Metall → Metal
    expect(result.wuxing.elements.Water).toBe(3);  // Wasser → Water
  });

  it('retains German keys alongside English keys', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };
    const result = mapChartToApiResults(chart);
    expect(result.wuxing.elements.Holz).toBe(3);
    expect(result.wuxing.elements.Feuer).toBe(1);
  });

  it('maps English wu_xing_vector keys when German absent', () => {
    const chart: ChartResponse = {
      ...CHART_BASE,
      positions: POSITIONS_PAYLOAD,
      wuxing: {
        wu_xing_vector: { Wood: 4, Fire: 2, Earth: 1, Metal: 2, Water: 1 },
        dominant_element: 'Wood',
      },
    };
    const result = mapChartToApiResults(chart);
    expect(result.wuxing.elements.Wood).toBe(4);
    expect(result.wuxing.elements.Holz).toBe(4); // should mirror
  });
});

// ── Zodiac index → sign name mapping ─────────────────────────────────────────

describe('mapChartToApiResults — zodiac index mapping', () => {
  const SIGN_CASES: Array<[number, string]> = [
    [0, 'Aries'], [1, 'Taurus'], [2, 'Gemini'], [3, 'Cancer'],
    [4, 'Leo'], [5, 'Virgo'], [6, 'Libra'], [7, 'Scorpio'],
    [8, 'Sagittarius'], [9, 'Capricorn'], [10, 'Aquarius'], [11, 'Pisces'],
  ];

  it.each(SIGN_CASES)('index %i maps to %s', (index, expected) => {
    const chart: ChartResponse = {
      ...CHART_BASE,
      positions: { Sun: { zodiac_sign: index }, Moon: { zodiac_sign: 0 } },
    };
    const result = mapChartToApiResults(chart);
    expect(result.western.zodiac_sign).toBe(expected);
  });

  it('converts Ascendant degrees to sign name (60° = Gemini)', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD, angles: { Ascendant: 60 } };
    const result = mapChartToApiResults(chart);
    expect(result.western.ascendant_sign).toBe('Gemini');
  });

  it('converts house cusp degrees to sign names', () => {
    const chart: ChartResponse = {
      ...CHART_BASE,
      positions: POSITIONS_PAYLOAD,
      houses: { '1': 0, '4': 90, '7': 180, '10': 270 },
    };
    const result = mapChartToApiResults(chart);
    expect(result.western.houses['1']).toBe('Aries');
    expect(result.western.houses['4']).toBe('Cancer');
    expect(result.western.houses['7']).toBe('Libra');
    expect(result.western.houses['10']).toBe('Capricorn');
  });
});

// ── Error contract ────────────────────────────────────────────────────────────

describe('mapChartToApiResults — missing required fields', () => {
  it('throws when bazi.pillars missing', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD, bazi: {} };
    expect(() => mapChartToApiResults(chart)).toThrow('/chart response missing bazi.pillars');
  });

  it('throws when wuxing missing', () => {
    const chart: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD, wuxing: undefined };
    expect(() => mapChartToApiResults(chart)).toThrow('/chart response missing wuxing');
  });
});

// ── calculateAll request body contract ───────────────────────────────────────

describe('calculateAll — /api/chart request body contract', () => {
  it('sends local_datetime (not date) + tz + lon + lat', async () => {
    const { calculateAll } = await import('../services/api');
    const chartPayload: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => chartPayload,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1990-01-15T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body).toHaveProperty('local_datetime', '1990-01-15T12:00:00');
    expect(body).not.toHaveProperty('date');
    expect(body).toHaveProperty('tz', 'Europe/Berlin');
    expect(body).toHaveProperty('lon', 13.4);
    expect(body).toHaveProperty('lat', 52.5);

    vi.unstubAllGlobals();
  });

  it('calls /api/chart — not /api/calculate/chart', async () => {
    const { calculateAll } = await import('../services/api');
    const chartPayload: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => chartPayload,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1990-01-15T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/\/api\/chart$/);
    expect(calledUrl).not.toContain('/calculate/');

    vi.unstubAllGlobals();
  });

  it('returns issues: [] on success', async () => {
    const { calculateAll } = await import('../services/api');
    const chartPayload: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => chartPayload,
    }));

    const result = await calculateAll({ date: '1990-01-15T12:00:00', tz: 'UTC', lon: 0, lat: 0 });
    expect(result.issues).toEqual([]);

    vi.unstubAllGlobals();
  });
});
