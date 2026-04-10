import { describe, it, expect } from 'vitest';
import {
  angularSeparation,
  computeAspects,
  extractLongitudes,
  ASPECT_DEFINITIONS,
  SYNASTRY_PLANETS,
} from '../lib/synastry/aspects';

describe('angularSeparation', () => {
  it('returns 0 for identical longitudes', () => {
    expect(angularSeparation(45, 45)).toBe(0);
  });

  it('returns shortest arc — 90° and 270° both give 90', () => {
    expect(angularSeparation(0, 90)).toBe(90);
    expect(angularSeparation(0, 270)).toBe(90);
  });

  it('returns 180 for opposition', () => {
    expect(angularSeparation(0, 180)).toBe(180);
    expect(angularSeparation(30, 210)).toBe(180);
  });

  it('handles wraparound correctly', () => {
    expect(angularSeparation(350, 10)).toBe(20);
    expect(angularSeparation(10, 350)).toBe(20);
  });
});

describe('ASPECT_DEFINITIONS — orb values (DEC-aspect-orb-tolerances)', () => {
  const orbs = Object.fromEntries(ASPECT_DEFINITIONS.map(d => [d.name, d.orb]));

  it('conjunction ±8°', () => expect(orbs.conjunction).toBe(8));
  it('opposition ±8°',  () => expect(orbs.opposition).toBe(8));
  it('trine ±6°',       () => expect(orbs.trine).toBe(6));
  it('square ±6°',      () => expect(orbs.square).toBe(6));
  it('sextile ±4°',     () => expect(orbs.sextile).toBe(4));
  it('exactly 5 aspects in V1', () => expect(ASPECT_DEFINITIONS).toHaveLength(5));
});

describe('computeAspects', () => {
  it('detects exact conjunction (Sun–Sun at same longitude)', () => {
    const pos1 = { Sun: 45 };
    const pos2 = { Sun: 45 };
    const aspects = computeAspects(pos1, pos2);
    expect(aspects.some(a => a.type === 'conjunction' && a.planet1 === 'Sun' && a.planet2 === 'Sun')).toBe(true);
  });

  it('detects trine within orb (120° ± 6°)', () => {
    const pos1 = { Sun: 0 };
    const pos2 = { Sun: 123 }; // 3° from exact trine — within ±6°
    const aspects = computeAspects(pos1, pos2);
    expect(aspects.some(a => a.type === 'trine')).toBe(true);
    const trine = aspects.find(a => a.type === 'trine')!;
    expect(trine.orb).toBe(3);
  });

  it('rejects sextile outside orb (60° + 5° = 65°, orb is ±4°)', () => {
    const pos1 = { Sun: 0 };
    const pos2 = { Sun: 65 }; // 5° from exact sextile — outside ±4°
    const aspects = computeAspects(pos1, pos2);
    expect(aspects.some(a => a.type === 'sextile')).toBe(false);
  });

  it('marks aspect as exact when orb ≤ half the tolerance', () => {
    const pos1 = { Moon: 0 };
    const pos2 = { Moon: 2 }; // 2° from conjunction — exact (≤ 4°)
    const aspects = computeAspects(pos1, pos2);
    const conj = aspects.find(a => a.type === 'conjunction');
    expect(conj?.exact).toBe(true);
  });

  it('marks aspect as non-exact when orb > half the tolerance', () => {
    const pos1 = { Moon: 0 };
    const pos2 = { Moon: 7 }; // 7° from conjunction — within ±8° but not exact (> 4°)
    const aspects = computeAspects(pos1, pos2);
    const conj = aspects.find(a => a.type === 'conjunction');
    expect(conj?.exact).toBe(false);
  });

  it('returns empty array when no aspects found', () => {
    const pos1 = { Sun: 0 };
    const pos2 = { Sun: 45 }; // 45° — no main aspect within orbs
    expect(computeAspects(pos1, pos2)).toHaveLength(0);
  });

  it('skips planets missing from either set', () => {
    const pos1 = { Sun: 0, Moon: 90 };
    const pos2 = { Mars: 0 }; // no Sun or Moon in pos2
    // Sun–Mars at 0° → conjunction; Moon–Mars at 90° → square
    const aspects = computeAspects(pos1, pos2);
    expect(aspects.some(a => a.planet1 === 'Sun' && a.planet2 === 'Mars')).toBe(true);
    expect(aspects.some(a => a.planet1 === 'Moon' && a.planet2 === 'Mars')).toBe(true);
  });

  it('covers all 7 traditional planets in SYNASTRY_PLANETS', () => {
    expect(SYNASTRY_PLANETS).toEqual(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']);
  });
});

describe('extractLongitudes', () => {
  it('extracts known planets from FuFirE bodies map', () => {
    const bodies = {
      Sun:     { longitude: 45.5 },
      Moon:    { longitude: 200.0 },
      Chiron:  { longitude: 15.0 }, // not a synastry planet — excluded
      Mercury: { longitude: 50.2 },
    };
    const result = extractLongitudes(bodies);
    expect(result.Sun).toBe(45.5);
    expect(result.Moon).toBe(200.0);
    expect(result.Mercury).toBeCloseTo(50.2, 10);
    expect(result['Chiron']).toBeUndefined();
  });

  it('normalises negative longitudes to [0, 360)', () => {
    const bodies = { Sun: { longitude: -10 } };
    const result = extractLongitudes(bodies);
    expect(result.Sun).toBe(350);
  });

  it('returns empty object for undefined input', () => {
    expect(extractLongitudes(undefined)).toEqual({});
  });

  it('skips planets without longitude', () => {
    const bodies = { Sun: { zodiac_sign: 2 } }; // no longitude field
    const result = extractLongitudes(bodies as Record<string, { longitude?: number }>);
    expect(result.Sun).toBeUndefined();
  });
});
