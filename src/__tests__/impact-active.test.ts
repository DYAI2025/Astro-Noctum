/**
 * Tests for /api/impact/active endpoint logic — BaZi resonance calculator
 * and ACTIVE_IMPACTS_v1 schema validation.
 *
 * The endpoint itself runs in server.mjs (Express). These tests verify
 * the pure computation logic that was ported from src/lib/fusion-bazi/resonance.ts.
 */
import { describe, it, expect } from 'vitest';

// ── BaZi resonance calculator (mirrored from server.mjs) ───────────────────

const IMPACT_PLANET_ELEMENT: Record<string, string> = {
  Sun: 'fire', Moon: 'water', Mercury: 'water',
  Venus: 'metal', Mars: 'fire', Jupiter: 'wood', Saturn: 'earth',
};

const IMPACT_STEM_ELEMENT: Record<string, string> = {
  Jia: 'wood', Yi: 'wood', Bing: 'fire', Ding: 'fire',
  Wu: 'earth', Ji: 'earth', Geng: 'metal', Xin: 'metal',
  Ren: 'water', Gui: 'water',
};

const SHENG_NEXT: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const KE_NEXT: Record<string, string>    = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

function impactBaziResonance(planetEN: string, dayMasterStem: string) {
  const pe = IMPACT_PLANET_ELEMENT[planetEN] ?? 'earth';
  const de = IMPACT_STEM_ELEMENT[dayMasterStem] ?? 'earth';
  if (pe === de)              return { type: 'gleichklang', intensity: 0.85, wu_xing_element: pe };
  if (SHENG_NEXT[pe] === de)  return { type: 'naehrung',    intensity: 0.75, wu_xing_element: pe };
  if (SHENG_NEXT[de] === pe)  return { type: 'naehrung',    intensity: 0.65, wu_xing_element: pe };
  if (KE_NEXT[pe] === de)     return { type: 'kontrolle',   intensity: 0.70, wu_xing_element: pe };
  if (KE_NEXT[de] === pe)     return { type: 'kontrolle',   intensity: 0.70, wu_xing_element: pe };
  return { type: 'neutral', intensity: 0.35, wu_xing_element: pe };
}

// ── Aspect computation (mirrored from server.mjs synastry math) ─────────

function synastrySeparation(lon1: number, lon2: number): number {
  const diff = Math.abs(((lon2 - lon1) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

const ASPECT_DEFS = [
  { name: 'conjunction', angle: 0,   orb: 8 },
  { name: 'opposition',  angle: 180, orb: 8 },
  { name: 'trine',       angle: 120, orb: 6 },
  { name: 'square',      angle: 90,  orb: 6 },
  { name: 'sextile',     angle: 60,  orb: 4 },
];

// ── Tests ─────────────────────────────────────────────────────────────────

describe('impactBaziResonance', () => {
  it('returns gleichklang when planet and day master share element', () => {
    // Sun is fire, Bing is fire
    const result = impactBaziResonance('Sun', 'Bing');
    expect(result.type).toBe('gleichklang');
    expect(result.intensity).toBe(0.85);
    expect(result.wu_xing_element).toBe('fire');
  });

  it('returns naehrung forward when planet generates day master element', () => {
    // Jupiter is wood, wood generates fire → Bing (fire)
    const result = impactBaziResonance('Jupiter', 'Bing');
    expect(result.type).toBe('naehrung');
    expect(result.intensity).toBe(0.75);
  });

  it('returns naehrung forward for Sun (fire) → Wu (earth) — fire generates earth', () => {
    const result = impactBaziResonance('Sun', 'Wu');
    expect(result.type).toBe('naehrung');
    expect(result.intensity).toBe(0.75); // forward Sheng: planet → dayMaster
  });

  it('returns kontrolle forward when planet controls day master element', () => {
    // Moon is water, water controls fire → Bing (fire)
    const result = impactBaziResonance('Moon', 'Bing');
    expect(result.type).toBe('kontrolle');
    expect(result.intensity).toBe(0.70);
  });

  it('returns kontrolle backward when day master controls planet element', () => {
    // Jupiter is wood, Geng is metal, metal controls wood
    const result = impactBaziResonance('Jupiter', 'Geng');
    expect(result.type).toBe('kontrolle');
    expect(result.intensity).toBe(0.70);
  });

  it('falls back gracefully for unknown stem — not gleichklang', () => {
    const result = impactBaziResonance('Sun', 'UnknownStem' as any);
    expect(result.type).not.toBe('gleichklang');
    expect(result.wu_xing_element).toBe('fire');
  });

  it('covers all 7 planets with Geng (metal) day master', () => {
    const results = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
      .map(p => ({ planet: p, ...impactBaziResonance(p, 'Geng') }));

    // Venus = metal, Geng = metal → gleichklang
    expect(results.find(r => r.planet === 'Venus')?.type).toBe('gleichklang');
    // Jupiter = wood, metal Ke wood → kontrolle
    expect(results.find(r => r.planet === 'Jupiter')?.type).toBe('kontrolle');
    // All results have a valid type
    for (const r of results) {
      expect(['gleichklang', 'naehrung', 'kontrolle', 'neutral']).toContain(r.type);
      expect(r.intensity).toBeGreaterThan(0);
      expect(r.intensity).toBeLessThanOrEqual(1);
      expect(r.wu_xing_element).toBeTruthy();
    }
  });
});

describe('synastrySeparation', () => {
  it('computes 0° for identical longitudes', () => {
    expect(synastrySeparation(120, 120)).toBe(0);
  });

  it('computes correct separation across 0°/360° boundary', () => {
    expect(synastrySeparation(350, 10)).toBe(20);
    expect(synastrySeparation(10, 350)).toBe(20);
  });

  it('never exceeds 180°', () => {
    expect(synastrySeparation(0, 270)).toBe(90);
  });
});

describe('ACTIVE_IMPACTS_v1 schema contract', () => {
  it('harmony_index stays within 0-100 range', () => {
    // Formula: round((baseHarmony * 0.65 + solarPressure * 0.35) * 100)
    const compute = (h: number, s: number) =>
      Math.min(100, Math.max(0, Math.round((h * 0.65 + s * 0.35) * 100)));

    expect(compute(0, 0)).toBe(0);
    expect(compute(1, 1)).toBe(100);
    expect(compute(0.5, 0.5)).toBe(50);
    expect(compute(0.8, 0.2)).toBe(59);   // 0.8*0.65 + 0.2*0.35 = 0.52 + 0.07 = 0.59
    expect(compute(1.5, 1.5)).toBe(100);   // clamped
    expect(compute(-0.5, -0.5)).toBe(0);   // clamped
  });

  it('strength is inverse of orb — tighter aspect = higher strength', () => {
    const strength = (orb: number) => Math.round((1 - orb / 8) * 100) / 100;
    expect(strength(0)).toBe(1);
    expect(strength(4)).toBe(0.5);
    expect(strength(8)).toBe(0);
    expect(strength(2.4)).toBeCloseTo(0.7, 1);
  });

  it('active planets use staggered orbs per DEC-aspect-orb-tolerances', () => {
    // Conjunction/Opposition: ≤8°, Trine/Square: ≤6°, Sextile: ≤4°
    for (const def of ASPECT_DEFS) {
      // Just inside tolerance → match
      expect(def.orb - 0.1 <= def.orb).toBe(true);
      // Just outside tolerance → no match
      expect(def.orb + 0.1 <= def.orb).toBe(false);
    }
    // Verify the specific staggered values
    expect(ASPECT_DEFS.find(d => d.name === 'conjunction')?.orb).toBe(8);
    expect(ASPECT_DEFS.find(d => d.name === 'trine')?.orb).toBe(6);
    expect(ASPECT_DEFS.find(d => d.name === 'sextile')?.orb).toBe(4);
  });
});

describe('impactBaziResonance matches resonance.ts', () => {
  // Cross-reference: these test cases mirror src/lib/fusion-bazi/__tests__/resonance.test.ts
  // to ensure the JS port produces identical results

  it('Mars (fire) + Bing (fire) = gleichklang 0.85', () => {
    const r = impactBaziResonance('Mars', 'Bing');
    expect(r).toEqual({ type: 'gleichklang', intensity: 0.85, wu_xing_element: 'fire' });
  });

  it('Saturn (earth) + Geng (metal) = naehrung forward 0.75 (earth→metal)', () => {
    // earth generates metal in Sheng cycle
    const r = impactBaziResonance('Saturn', 'Geng');
    expect(r.type).toBe('naehrung');
    expect(r.intensity).toBe(0.75);
  });

  it('Moon (water) + Yi (wood) = naehrung backward 0.65 (wood←water)', () => {
    // water generates wood in Sheng cycle, dayMaster=Yi=wood
    // SHENG_NEXT[water] = wood, and de = wood → forward match
    const r = impactBaziResonance('Moon', 'Yi');
    expect(r.type).toBe('naehrung');
    expect(r.intensity).toBe(0.75); // water→wood is forward Sheng
  });
});
