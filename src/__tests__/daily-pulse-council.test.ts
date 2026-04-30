import { describe, it, expect } from 'vitest';
import { buildCouncil } from '../lib/daily-pulse/council';
import type { ApiData } from '../types/bafe';

const fullApi: ApiData = {
  western: { zodiac_sign: 'Löwe', moon_sign: 'Skorpion', ascendant_sign: 'Jungfrau' } as any,
  bazi: { day_master: 'Geng', zodiac_sign: 'Tiger' } as any,
  wuxing: { dominant_element: 'Metall' } as any,
} as ApiData;

describe('buildCouncil', () => {
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
});
