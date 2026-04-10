import { describe, it, expect } from 'vitest';
import {
  aspectNarrative,
  synastryTemplateSummary,
  PLANET_DE,
  ASPECT_DE,
} from '../lib/synastry/templates';

describe('PLANET_DE / ASPECT_DE', () => {
  it('maps all 7 synastry planets to German names', () => {
    expect(PLANET_DE.Sun).toBe('Sonne');
    expect(PLANET_DE.Moon).toBe('Mond');
    expect(PLANET_DE.Mercury).toBe('Merkur');
    expect(PLANET_DE.Venus).toBe('Venus');
    expect(PLANET_DE.Mars).toBe('Mars');
    expect(PLANET_DE.Jupiter).toBe('Jupiter');
    expect(PLANET_DE.Saturn).toBe('Saturn');
  });

  it('maps all 5 aspect types to German names', () => {
    expect(ASPECT_DE.conjunction).toBe('Konjunktion');
    expect(ASPECT_DE.opposition).toBe('Opposition');
    expect(ASPECT_DE.trine).toBe('Trigon');
    expect(ASPECT_DE.square).toBe('Quadrat');
    expect(ASPECT_DE.sextile).toBe('Sextil');
  });
});

describe('aspectNarrative', () => {
  it('returns a non-empty German string for each aspect type', () => {
    const types = ['conjunction', 'opposition', 'trine', 'square', 'sextile'] as const;
    for (const type of types) {
      const text = aspectNarrative({ planet1: 'Sun', planet2: 'Moon', type, exact: false, orb: 3 });
      expect(text.length).toBeGreaterThan(20);
    }
  });

  it('uses German planet names in the output', () => {
    const text = aspectNarrative({ planet1: 'Sun', planet2: 'Moon', type: 'conjunction', exact: false, orb: 2 });
    expect(text).toContain('Sonne');
    expect(text).toContain('Mond');
  });

  it('exact conjunctions get a different (exact) sentence', () => {
    const exact  = aspectNarrative({ planet1: 'Mars', planet2: 'Venus', type: 'conjunction', exact: true,  orb: 0.5 });
    const approx = aspectNarrative({ planet1: 'Mars', planet2: 'Venus', type: 'conjunction', exact: false, orb: 6 });
    expect(exact).not.toBe(approx);
    expect(exact).toContain('exakter');
  });

  it('exact trigon differs from approximate trigon', () => {
    const exact  = aspectNarrative({ planet1: 'Sun', planet2: 'Jupiter', type: 'trine', exact: true,  orb: 1 });
    const approx = aspectNarrative({ planet1: 'Sun', planet2: 'Jupiter', type: 'trine', exact: false, orb: 5 });
    expect(exact).not.toBe(approx);
  });
});

describe('synastryTemplateSummary', () => {
  it('returns a fallback sentence for empty aspect list', () => {
    const text = synastryTemplateSummary([]);
    expect(text).toContain('keine signifikanten Hauptaspekte');
  });

  it('mentions total aspect count', () => {
    const aspects = [
      { planet1: 'Sun',  planet2: 'Moon', type: 'trine'       as const, exact: false, orb: 3 },
      { planet1: 'Mars', planet2: 'Venus', type: 'conjunction' as const, exact: true,  orb: 0 },
    ];
    const text = synastryTemplateSummary(aspects);
    expect(text).toContain('2 Hauptaspekte');
  });

  it('reports exact count when any exact aspects present', () => {
    const aspects = [
      { planet1: 'Sun',  planet2: 'Moon',  type: 'trine'    as const, exact: true,  orb: 1 },
      { planet1: 'Mars', planet2: 'Venus', type: 'square'   as const, exact: false, orb: 5 },
    ];
    const text = synastryTemplateSummary(aspects);
    expect(text).toContain('1 präzise');
  });

  it('uses harmonious tone when trines + sextiles > squares + oppositions', () => {
    const aspects = [
      { planet1: 'Sun',    planet2: 'Moon',    type: 'trine'   as const, exact: false, orb: 2 },
      { planet1: 'Venus',  planet2: 'Jupiter', type: 'sextile' as const, exact: false, orb: 3 },
      { planet1: 'Saturn', planet2: 'Mars',    type: 'square'  as const, exact: false, orb: 4 },
    ];
    const text = synastryTemplateSummary(aspects);
    expect(text).toContain('fließende Qualität');
  });

  it('uses tense tone when squares + oppositions > trines + sextiles', () => {
    const aspects = [
      { planet1: 'Mars',    planet2: 'Saturn',  type: 'square'     as const, exact: false, orb: 2 },
      { planet1: 'Moon',    planet2: 'Saturn',  type: 'opposition' as const, exact: false, orb: 3 },
      { planet1: 'Jupiter', planet2: 'Moon',    type: 'trine'      as const, exact: false, orb: 4 },
    ];
    const text = synastryTemplateSummary(aspects);
    expect(text).toContain('produktive Spannung');
  });

  it('uses balanced tone when harmonic === tense', () => {
    const aspects = [
      { planet1: 'Sun',  planet2: 'Moon',  type: 'trine'       as const, exact: false, orb: 2 },
      { planet1: 'Mars', planet2: 'Venus', type: 'opposition'  as const, exact: false, orb: 3 },
    ];
    const text = synastryTemplateSummary(aspects);
    expect(text).toContain('vielschichtige Begegnung');
  });

  it('highlights the top 3 most exact aspects', () => {
    const aspects = [
      { planet1: 'Sun',     planet2: 'Moon',    type: 'conjunction' as const, exact: true,  orb: 0.1 },
      { planet1: 'Mars',    planet2: 'Venus',   type: 'trine'       as const, exact: false, orb: 2.5 },
      { planet1: 'Jupiter', planet2: 'Saturn',  type: 'sextile'     as const, exact: false, orb: 3.8 },
      { planet1: 'Mercury', planet2: 'Moon',    type: 'square'      as const, exact: false, orb: 5.0 },
    ];
    const text = synastryTemplateSummary(aspects);
    // Top 3: Sun-Moon (exact), Mars-Venus (orb 2.5), Jupiter-Saturn (orb 3.8)
    expect(text).toContain('Sonne–Mond');
    expect(text).toContain('Besonders prägend:');
  });
});
