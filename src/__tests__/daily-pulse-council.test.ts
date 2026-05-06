import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCouncil, __resetCouncilWarnState } from '../lib/daily-pulse/council';
import type { ApiData } from '../types/bafe';

const fullApi: ApiData = {
  western: { zodiac_sign: 'Löwe', moon_sign: 'Skorpion', ascendant_sign: 'Jungfrau' } as any,
  bazi: { day_master: 'Geng', zodiac_sign: 'Tiger' } as any,
  wuxing: { dominant_element: 'Metall' } as any,
} as ApiData;

describe('buildCouncil', () => {
  beforeEach(() => {
    __resetCouncilWarnState();
  });

  it('returns six figures in canonical order', () => {
    const c = buildCouncil(fullApi);
    expect(c.map(f => f.key)).toEqual(['sonne','mond','aszendent','day_master','jahrestier','wuxing_dom']);
  });

  it('maps signs / elements correctly', () => {
    const c = buildCouncil(fullApi);
    expect(c[0]).toMatchObject({ key: 'sonne', signOrElement: 'Löwe' });
    expect(c[3]).toMatchObject({ key: 'day_master', signOrElement: 'Geng' });
    expect(c[5]).toMatchObject({ key: 'wuxing_dom', signOrElement: 'Metall' });
  });

  it('uses em-dash placeholder for missing fields', () => {
    const partial = { western: {}, bazi: {}, wuxing: {} } as any;
    const c = buildCouncil(partial);
    expect(c).toHaveLength(6);
    expect(c.every(f => f.signOrElement === '—')).toBe(true);
  });

  it('display names are German-localised by default', () => {
    const c = buildCouncil(fullApi);
    expect(c[0].displayName).toBe('Sonne');
    expect(c[3].displayName).toBe('Day-Master');
  });

  it('localises display names to English when lang="en"', () => {
    const c = buildCouncil(fullApi, 'en');
    expect(c[0].displayName).toBe('Sun');
    expect(c[1].displayName).toBe('Moon');
    expect(c[2].displayName).toBe('Ascendant');
    expect(c[3].displayName).toBe('Day Master');
    expect(c[4].displayName).toBe('Year Animal');
    expect(c[5].displayName).toBe('Wu Xing');
    // signOrElement is NOT translated — it's pass-through from ApiData.
    expect(c[0].signOrElement).toBe('Löwe');
  });

  it('warns once when all six figures collapse to "—" (BAFE drift signal)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const empty = { western: {}, bazi: {}, wuxing: {} } as any;
    buildCouncil(empty);
    buildCouncil(empty); // second call — must NOT warn again
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/buildCouncil.*all six figures.*—/i);
    warn.mockRestore();
  });

  it('does NOT warn when at least one figure resolves', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    buildCouncil({ western: { zodiac_sign: 'Löwe' }, bazi: {}, wuxing: {} } as any);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
