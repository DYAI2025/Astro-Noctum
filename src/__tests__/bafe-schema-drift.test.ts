/**
 * BAFE schema-drift regression test.
 *
 * Real prod response observed on 2026-04-21 (user ba719e2f-...) had:
 *   - western.bodies as ARRAY of {name, sign_index, sign_name, longitude_deg, ...}
 *   - wuxing.dominant_element = "" but wuxing.dominant_bazi = "Erde"
 *   - western.ascendant_sign = "Gemini" (still works)
 *
 * The mapper must surface sun_sign + moon_sign from the array-shaped bodies
 * and fill dominant_element from dominant_bazi/dominant_planet when
 * dominant_element itself is empty. This test locks that contract so a
 * future BAFE upgrade that reverts or changes the shape doesn't silently
 * empty out the dashboard.
 */
import { describe, it, expect } from 'vitest';
import { mapChartToApiResults } from '../services/api';
import type { ChartResponse } from '../types/bafe';

/** Minimal chart response mirroring the 2026-04-21 BAFE shape. */
function buildNewShapeResponse(): ChartResponse {
  return {
    bazi: {
      pillars: {
        year:  { stamm: 'Ji', zweig: 'Mao', tier: 'Rabbit', element: 'Earth' },
        month: { stamm: 'Bing', zweig: 'Chen', tier: 'Dragon', element: 'Fire' },
        day:   { stamm: 'Ji', zweig: 'Wei', tier: 'Goat', element: 'Earth' },
        hour:  { stamm: 'Xin', zweig: 'You', tier: 'Rooster', element: 'Metal' },
      },
      chinese: { day_master: 'Ji', year: { animal: 'Rabbit' } },
    },
    // New shape: array of body objects
    bodies: [
      { name: 'Sun',   sign_index: 10, sign_name: 'Aquarius',   longitude_deg: 303.75 },
      { name: 'Moon',  sign_index: 6,  sign_name: 'Libra',      longitude_deg: 187.19 },
      { name: 'Mercury', sign_index: 9, sign_name: 'Capricorn', longitude_deg: 291.45 },
    ],
    // Ascendant stays a degree value in angles.
    angles: { Ascendant: 81.14, MC: 314.01, Vertex: 217.74 },
    // dominant_element empty, but dominant_bazi populated.
    wuxing: {
      elements: { Wood: 6, Fire: 4, Earth: 6, Metal: 4.3, Water: 5.8 },
      from_planets: { Holz: 4.9, Feuer: 3, Erde: 2, Metall: 1, Wasser: 4.3 },
      from_bazi: { Holz: 1.1, Feuer: 1, Erde: 4, Metall: 3.3, Wasser: 1.5 },
      dominant_bazi: 'Erde',
      dominant_planet: 'Holz',
      dominant_element: '',
      harmony_index: 0.6211,
    },
    houses: {},
    fusion: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/** Minimal chart response in the OLD shape (object keyed by body name). */
function buildOldShapeResponse(): ChartResponse {
  return {
    bazi: {
      pillars: {
        year:  { stamm: 'Ji', zweig: 'Mao', tier: 'Rabbit', element: 'Earth' },
        month: { stamm: 'Bing', zweig: 'Chen', tier: 'Dragon', element: 'Fire' },
        day:   { stamm: 'Ji', zweig: 'Wei', tier: 'Goat', element: 'Earth' },
        hour:  { stamm: 'Xin', zweig: 'You', tier: 'Rooster', element: 'Metal' },
      },
      chinese: { day_master: 'Ji', year: { animal: 'Rabbit' } },
    },
    // Old shape: dict keyed by body name
    bodies: {
      Sun:  { zodiac_sign: 0,  longitude: 15 },
      Moon: { zodiac_sign: 3,  longitude: 95 },
    } as unknown as never,
    angles: { Ascendant: 120, MC: 200, Vertex: 270 },
    wuxing: {
      elements: { Wood: 1, Fire: 1, Earth: 1, Metal: 1, Water: 1 },
      dominant_element: 'Fire',
      harmony_index: 0.8,
    },
    houses: {},
    fusion: { harmony_index: 0.75 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('mapChartToApiResults — BAFE schema drift', () => {
  it('resolves sun/moon from new ARRAY-shaped bodies via sign_index', () => {
    const mapped = mapChartToApiResults(buildNewShapeResponse());
    expect(mapped.western.zodiac_sign).toBe('Aquarius');
    expect(mapped.western.moon_sign).toBe('Libra');
  });

  it('resolves ascendant from angles.Ascendant degrees (new shape)', () => {
    const mapped = mapChartToApiResults(buildNewShapeResponse());
    // 81.14° → Gemini (60°..90°)
    expect(mapped.western.ascendant_sign).toBe('Gemini');
  });

  it('fills dominant_element from dominant_bazi when BAFE leaves it empty', () => {
    const mapped = mapChartToApiResults(buildNewShapeResponse());
    // dominant_bazi "Erde" → normalised to English "Earth"
    expect(mapped.wuxing.dominant_element).toBe('Earth');
  });

  it('keeps dominant_element as-is when BAFE supplies it directly', () => {
    const mapped = mapChartToApiResults(buildOldShapeResponse());
    expect(mapped.wuxing.dominant_element).toBe('Fire');
  });

  it('resolves sun/moon from old OBJECT-shaped bodies via zodiac_sign index', () => {
    const mapped = mapChartToApiResults(buildOldShapeResponse());
    expect(mapped.western.zodiac_sign).toBe('Aries');   // index 0
    expect(mapped.western.moon_sign).toBe('Cancer');    // index 3
  });

  it('falls back to longitude_deg when sign_index is missing', () => {
    const response = buildNewShapeResponse();
    // Remove sign_index + sign_name, keep longitude_deg (which is 303.75 → Aquarius)
    (response.bodies as unknown as Array<Record<string, unknown>>)[0] = {
      name: 'Sun',
      longitude_deg: 303.75,
    };
    const mapped = mapChartToApiResults(response);
    expect(mapped.western.zodiac_sign).toBe('Aquarius');
  });

  it('returns undefined sun_sign when body entry is completely empty', () => {
    const response = buildNewShapeResponse();
    (response.bodies as unknown as Array<Record<string, unknown>>)[0] = { name: 'Sun' };
    const mapped = mapChartToApiResults(response);
    expect(mapped.western.zodiac_sign).toBeUndefined();
  });

  it('dominant_element falls back to dominant_planet when dominant_bazi is also empty', () => {
    const response = buildNewShapeResponse();
    const wx = response.wuxing as unknown as Record<string, unknown>;
    wx.dominant_bazi = '';
    wx.dominant_planet = 'Wasser';
    const mapped = mapChartToApiResults(response);
    expect(mapped.wuxing.dominant_element).toBe('Water');
  });
});
