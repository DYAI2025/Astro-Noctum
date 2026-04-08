import { describe, it, expect } from 'vitest';
import {
  calculatePlanetBaziResonance,
  PLANET_ELEMENT,
  SHENG_NEXT,
  KE_NEXT,
} from '../resonance';

describe('resonance module — DEC-fusion-bazi-sheng-ke contract', () => {
  // ── gleichklang ──────────────────────────────────────────────────────────
  it('gleichklang: planet and dayMaster share same element', () => {
    // Sonne=fire, Bing=fire
    const result = calculatePlanetBaziResonance('Sonne', 'Bing');
    expect(result.type).toBe('gleichklang');
    expect(result.intensity).toBeGreaterThanOrEqual(0.80);
    expect(result.intensity).toBeLessThanOrEqual(0.90);
    expect(result.planetElement).toBe('fire');
    expect(result.dayMasterElement).toBe('fire');
  });

  // ── naehrung forward ─────────────────────────────────────────────────────
  it('naehrung forward: planet generates dayMaster via Sheng', () => {
    // Jupiter=wood, Bing=fire; wood→fire in Sheng cycle
    const result = calculatePlanetBaziResonance('Jupiter', 'Bing');
    expect(result.type).toBe('naehrung');
    expect(result.direction).toBe('forward');
    expect(result.intensity).toBeGreaterThanOrEqual(0.70);
    expect(result.intensity).toBeLessThanOrEqual(0.80);
  });

  // ── naehrung backward ────────────────────────────────────────────────────
  it('naehrung backward: dayMaster generates planet via Sheng', () => {
    // Sonne=fire, Jia=wood; SHENG_NEXT[wood]=fire → dayMaster(wood) generates planet(fire)
    const result = calculatePlanetBaziResonance('Sonne', 'Jia');
    expect(result.type).toBe('naehrung');
    expect(result.direction).toBe('backward');
    expect(result.intensity).toBeGreaterThanOrEqual(0.60);
    expect(result.intensity).toBeLessThanOrEqual(0.70);
  });

  // ── kontrolle forward ────────────────────────────────────────────────────
  it('kontrolle forward: planet controls dayMaster via Ke', () => {
    // Jupiter=wood, Wu=earth; wood→earth in Ke cycle
    const result = calculatePlanetBaziResonance('Jupiter', 'Wu');
    expect(result.type).toBe('kontrolle');
    expect(result.direction).toBe('forward');
    expect(result.intensity).toBeGreaterThanOrEqual(0.65);
    expect(result.intensity).toBeLessThanOrEqual(0.75);
  });

  // ── kontrolle backward ───────────────────────────────────────────────────
  it('kontrolle backward: dayMaster controls planet via Ke', () => {
    // Ke: wood→earth, so dayMaster=wood controls planet=earth → planet=Saturn, dayMaster=Jia
    const result = calculatePlanetBaziResonance('Saturn', 'Jia');
    expect(result.type).toBe('kontrolle');
    expect(result.direction).toBe('backward');
    expect(result.intensity).toBeGreaterThanOrEqual(0.65);
    expect(result.intensity).toBeLessThanOrEqual(0.75);
  });

  // ── neutral branch: safety net ───────────────────────────────────────────
  // MATHEMATICAL INVARIANT: With the locked 5-element Wu-Xing system, every pair
  // of distinct elements has exactly one Sheng or Ke relationship — neutral is
  // unreachable for all valid (planet, stem) inputs.
  // The neutral branch exists as a runtime safety net for future dynamic planets
  // not yet in PLANET_ELEMENT (e.g., outer planets added without a DEC update).
  // This test proves no known combination reaches neutral, which is the expected behavior.
  it('neutral: exhaustive matrix — no known planet+stem combo returns neutral', () => {
    const planets = [
      'Sonne', 'Mond', 'Merkur', 'Venus', 'Mars', 'Jupiter', 'Saturn',
    ] as const;
    const stems = [
      'Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui',
    ] as const;

    for (const planet of planets) {
      for (const stem of stems) {
        const result = calculatePlanetBaziResonance(planet, stem);
        // With the locked mapping no valid combo should reach the neutral safety-net path
        expect(result.type).not.toBe('neutral');
        expect(result.intensity).toBeGreaterThan(0);
        expect(result.quote.length).toBeGreaterThan(0);
      }
    }
  });

  // ── locked contract checks ───────────────────────────────────────────────
  it('PLANET_ELEMENT has exactly 7 entries', () => {
    expect(Object.keys(PLANET_ELEMENT)).toHaveLength(7);
  });

  it('SHENG_NEXT has exactly 5 entries', () => {
    expect(Object.keys(SHENG_NEXT)).toHaveLength(5);
  });

  it('KE_NEXT has exactly 5 entries', () => {
    expect(Object.keys(KE_NEXT)).toHaveLength(5);
  });

  it('quote is non-empty for all resonance types', () => {
    const results = [
      calculatePlanetBaziResonance('Sonne', 'Bing'),   // gleichklang
      calculatePlanetBaziResonance('Jupiter', 'Bing'),  // naehrung forward
      calculatePlanetBaziResonance('Sonne', 'Jia'),     // naehrung backward (Jia=wood; SHENG_NEXT[wood]=fire; dayMaster generates planet)
      calculatePlanetBaziResonance('Jupiter', 'Wu'),    // kontrolle forward
      calculatePlanetBaziResonance('Saturn', 'Jia'),    // kontrolle backward
    ];
    results.forEach(r => expect(r.quote.length).toBeGreaterThan(0));
  });

  // ── brand-voice quote length ─────────────────────────────────────────────
  it('all quotes are at most 80 chars', () => {
    const results = [
      calculatePlanetBaziResonance('Sonne', 'Bing'),
      calculatePlanetBaziResonance('Jupiter', 'Bing'),
      calculatePlanetBaziResonance('Sonne', 'Jia'),
      calculatePlanetBaziResonance('Jupiter', 'Wu'),
      calculatePlanetBaziResonance('Saturn', 'Jia'),
    ];
    results.forEach(r => expect(r.quote.length).toBeLessThanOrEqual(80));
  });
});
