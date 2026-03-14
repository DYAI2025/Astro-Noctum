import { describe, it, expect } from 'vitest';
import { projectNatal } from '@/src/lib/master-signal/natal-projection';
import type { ApiData } from '@/src/types/bafe';

const MOCK_API_DATA: ApiData = {
  bazi: {
    pillars: {
      day:   { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      month: { stem: 'Ren', branch: 'Yin',  animal: 'Tiger',  element: 'Water' },
      year:  { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      hour:  { stem: 'Jia', branch: 'Zi',   animal: 'Rat',    element: 'Wood' },
    },
    day_master: 'Wu',
    zodiac_sign: 'Dragon',
  },
  western: {
    zodiac_sign: 'Aries',
    moon_sign: 'Cancer',
    ascendant_sign: 'Scorpio',
    houses: {},
  },
  wuxing: {
    elements: { Wood: 1, Fire: 2, Earth: 4, Metal: 1, Water: 2 },
    dominant_element: 'Earth',
  },
};

describe('projectNatal', () => {
  it('returns natal signal type with heuristic_v1 mode', () => {
    const result = projectNatal(MOCK_API_DATA);
    expect(result.signal_type).toBe('natal');
    expect(result.projection_mode).toBe('heuristic_v1');
  });

  it('produces values in 0..1 range', () => {
    const result = projectNatal(MOCK_API_DATA);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('has all 5 dimension keys', () => {
    const result = projectNatal(MOCK_API_DATA);
    expect(Object.keys(result.dimensions).sort()).toEqual(
      ['autonomy', 'connection', 'future', 'passion', 'stability']
    );
  });

  it('coverage reflects available data', () => {
    const result = projectNatal(MOCK_API_DATA);
    expect(result.coverage).toBeGreaterThan(0.5);
  });

  it('handles missing bazi gracefully', () => {
    const partial: ApiData = { western: MOCK_API_DATA.western, wuxing: MOCK_API_DATA.wuxing };
    const result = projectNatal(partial);
    expect(result.coverage).toBeLessThan(1);
    expect(result.dimensions.passion).toBeGreaterThanOrEqual(0);
  });

  it('handles completely empty data', () => {
    const result = projectNatal({});
    expect(result.coverage).toBe(0);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v === 0)).toBe(true);
  });

  it('fire-heavy elements boost passion', () => {
    const fireHeavy: ApiData = {
      ...MOCK_API_DATA,
      wuxing: { elements: { Wood: 0, Fire: 8, Earth: 1, Metal: 0, Water: 1 }, dominant_element: 'Fire' },
    };
    const earthHeavy: ApiData = {
      ...MOCK_API_DATA,
      wuxing: { elements: { Wood: 0, Fire: 0, Earth: 8, Metal: 1, Water: 1 }, dominant_element: 'Earth' },
    };
    const fireResult = projectNatal(fireHeavy);
    const earthResult = projectNatal(earthHeavy);
    expect(fireResult.dimensions.passion).toBeGreaterThan(earthResult.dimensions.passion);
  });
});
