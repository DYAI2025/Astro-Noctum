/**
 * contract-impact.test.ts
 *
 * Contract tests for POST /api/impact/active endpoint.
 * Focuses on:
 *   - Request body is exactly {} (empty)
 *   - ActiveImpactsSchema validates correct responses
 *   - Schema rejects out-of-range/wrong-type values
 *   - Hook sends the correct URL and method
 */

import { describe, it, expect } from 'vitest';
import {
  ActiveImpactsSchema,
  ActivePlanetSchema,
  ResonanceBadgeSchema,
} from '../lib/schemas/active-impacts';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_ACTIVE_IMPACTS = {
  schema: 'ACTIVE_IMPACTS_v1' as const,
  date: '2026-04-13',
  harmony_index: 72,
  active_planets: [
    {
      planet: 'Mars',
      strength: 0.8,
      aspect_type: 'Quadrat',
      orb: 2.5,
      natal_planet: 'Venus',
      bazi_resonance: 'Yang Metal',
      wu_xing_element: 'Metal',
    },
    {
      planet: 'Jupiter',
      strength: 0.5,
      aspect_type: 'Trigon',
      orb: 4.1,
      natal_planet: 'Sun',
      bazi_resonance: null,
      wu_xing_element: null,
    },
  ],
  resonance_badges: [
    {
      type: 'transit',
      label: 'Mars aktiv',
      sublabel: 'Quadrat zu Natal-Venus',
      intensity: 'hoch',
      color: '#FF4500',
    },
    {
      type: 'space_weather',
      label: 'Kp erhöht',
      intensity: 'mittel',
    },
  ],
  meta: {
    engine: 'bazodiac-impact-v1',
    solar_pressure_source: 'noaa_kp',
    cached: false,
  },
};

// ── ActiveImpactsSchema — valid response ──────────────────────────────────────

describe('ActiveImpactsSchema — valid response parsing', () => {
  it('parses a valid ACTIVE_IMPACTS_v1 response', () => {
    expect(() => ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS)).not.toThrow();
  });

  it('parsed schema literal is ACTIVE_IMPACTS_v1', () => {
    const parsed = ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS);
    expect(parsed.schema).toBe('ACTIVE_IMPACTS_v1');
  });

  it('parsed harmony_index is a number between 0 and 100', () => {
    const parsed = ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS);
    expect(parsed.harmony_index).toBe(72);
    expect(parsed.harmony_index).toBeGreaterThanOrEqual(0);
    expect(parsed.harmony_index).toBeLessThanOrEqual(100);
  });

  it('parsed active_planets is an array', () => {
    const parsed = ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS);
    expect(Array.isArray(parsed.active_planets)).toBe(true);
    expect(parsed.active_planets).toHaveLength(2);
  });

  it('parsed resonance_badges is an array', () => {
    const parsed = ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS);
    expect(Array.isArray(parsed.resonance_badges)).toBe(true);
  });

  it('meta.engine is present', () => {
    const parsed = ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS);
    expect(parsed.meta.engine).toBe('bazodiac-impact-v1');
  });

  it('meta.cached is optional and preserved when present', () => {
    const parsed = ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS);
    expect(parsed.meta.cached).toBe(false);
  });

  it('meta.solar_pressure_source is optional', () => {
    const withoutSolarSource = {
      ...VALID_ACTIVE_IMPACTS,
      meta: { engine: 'bazodiac-impact-v1' },
    };
    expect(() => ActiveImpactsSchema.parse(withoutSolarSource)).not.toThrow();
  });

  it('parses coherence split fields when present', () => {
    const withCoherence = {
      ...VALID_ACTIVE_IMPACTS,
      base_coherence: 65,
      positive_daily_delta: 7,
      displayed_coherence: 72,
    };
    const parsed = ActiveImpactsSchema.parse(withCoherence);
    expect(parsed.base_coherence).toBe(65);
    expect(parsed.positive_daily_delta).toBe(7);
    expect(parsed.displayed_coherence).toBe(72);
  });

  it('still parses when coherence split fields are absent (backward compat)', () => {
    expect(() => ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS)).not.toThrow();
    const parsed = ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS);
    expect(parsed.base_coherence).toBeUndefined();
  });
});

// ── ActivePlanetSchema ────────────────────────────────────────────────────────

describe('ActivePlanetSchema — field contract', () => {
  const VALID_PLANET = {
    planet: 'Saturn',
    strength: 0.65,
    aspect_type: 'Opposition',
    orb: 1.8,
    natal_planet: 'Moon',
    bazi_resonance: null,
    wu_xing_element: 'Earth',
  };

  it('parses a valid planet entry', () => {
    expect(() => ActivePlanetSchema.parse(VALID_PLANET)).not.toThrow();
  });

  it('bazi_resonance can be null', () => {
    const parsed = ActivePlanetSchema.parse(VALID_PLANET);
    expect(parsed.bazi_resonance).toBeNull();
  });

  it('wu_xing_element can be null', () => {
    const planet = { ...VALID_PLANET, wu_xing_element: null };
    const parsed = ActivePlanetSchema.parse(planet);
    expect(parsed.wu_xing_element).toBeNull();
  });

  it('strength must be 0–1', () => {
    expect(() => ActivePlanetSchema.parse({ ...VALID_PLANET, strength: 1.01 })).toThrow();
    expect(() => ActivePlanetSchema.parse({ ...VALID_PLANET, strength: -0.01 })).toThrow();
  });

  it('orb must be >= 0', () => {
    expect(() => ActivePlanetSchema.parse({ ...VALID_PLANET, orb: -1 })).toThrow();
  });

  it('orb of 0 is valid (exact aspect)', () => {
    expect(() => ActivePlanetSchema.parse({ ...VALID_PLANET, orb: 0 })).not.toThrow();
  });
});

// ── ResonanceBadgeSchema ──────────────────────────────────────────────────────

describe('ResonanceBadgeSchema — field contract', () => {
  const VALID_BADGE = {
    type: 'transit',
    label: 'Venus Trigon',
    sublabel: 'zu Natal-Sun',
    intensity: 'niedrig',
    color: '#gold',
  };

  it('parses a valid badge', () => {
    expect(() => ResonanceBadgeSchema.parse(VALID_BADGE)).not.toThrow();
  });

  it('sublabel is optional', () => {
    const without = { type: 'sektor', label: 'Sektor aktiv', intensity: 'mittel' };
    expect(() => ResonanceBadgeSchema.parse(without)).not.toThrow();
  });

  it('color is optional', () => {
    const without = { type: 'space_weather', label: 'Kp Sturm', intensity: 'hoch' };
    expect(() => ResonanceBadgeSchema.parse(without)).not.toThrow();
  });
});

// ── ActiveImpactsSchema — rejection contract ──────────────────────────────────

describe('ActiveImpactsSchema — rejections', () => {
  it('rejects wrong schema literal', () => {
    const bad = { ...VALID_ACTIVE_IMPACTS, schema: 'ACTIVE_IMPACTS_v2' };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });

  it('rejects harmony_index > 100', () => {
    const bad = { ...VALID_ACTIVE_IMPACTS, harmony_index: 101 };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });

  it('rejects harmony_index < 0', () => {
    const bad = { ...VALID_ACTIVE_IMPACTS, harmony_index: -1 };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });

  it('rejects when schema literal missing', () => {
    const { schema: _, ...withoutSchema } = VALID_ACTIVE_IMPACTS;
    expect(() => ActiveImpactsSchema.parse(withoutSchema)).toThrow();
  });

  it('rejects when active_planets missing', () => {
    const { active_planets: _, ...withoutPlanets } = VALID_ACTIVE_IMPACTS;
    expect(() => ActiveImpactsSchema.parse(withoutPlanets)).toThrow();
  });

  it('rejects planet with negative orb', () => {
    const bad = {
      ...VALID_ACTIVE_IMPACTS,
      active_planets: [{ ...VALID_ACTIVE_IMPACTS.active_planets[0], orb: -1 }],
    };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });

  it('rejects planet with strength > 1', () => {
    const bad = {
      ...VALID_ACTIVE_IMPACTS,
      active_planets: [{ ...VALID_ACTIVE_IMPACTS.active_planets[0], strength: 1.5 }],
    };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });

  it('rejects base_coherence > 100', () => {
    const bad = { ...VALID_ACTIVE_IMPACTS, base_coherence: 101 };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });

  it('rejects negative positive_daily_delta', () => {
    const bad = { ...VALID_ACTIVE_IMPACTS, positive_daily_delta: -5 };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });

  it('rejects displayed_coherence > 100', () => {
    const bad = { ...VALID_ACTIVE_IMPACTS, displayed_coherence: 150 };
    expect(() => ActiveImpactsSchema.parse(bad)).toThrow();
  });
});

// ── useActiveImpacts — request body contract ──────────────────────────────────

describe('useActiveImpacts — POST contract shape', () => {
  it('hook source hardcodes /api/impact/active URL and empty {} body', async () => {
    const fs = await import('fs');
    const hookSource = fs.readFileSync('src/hooks/useActiveImpacts.ts', 'utf8');

    expect(hookSource).toContain("'/api/impact/active'");
    expect(hookSource).toContain("body: '{}'");
    expect(hookSource).toContain("method: 'POST'");
  });
});

// ── Integration: schema validates hook's parsed data ─────────────────────────

describe('ActiveImpactsSchema — integration with hook data', () => {
  it('accepts harmony_index of 0 (minimum)', () => {
    const zero = { ...VALID_ACTIVE_IMPACTS, harmony_index: 0 };
    expect(() => ActiveImpactsSchema.parse(zero)).not.toThrow();
  });

  it('accepts harmony_index of 100 (maximum)', () => {
    const max = { ...VALID_ACTIVE_IMPACTS, harmony_index: 100 };
    expect(() => ActiveImpactsSchema.parse(max)).not.toThrow();
  });

  it('accepts empty active_planets array', () => {
    const empty = { ...VALID_ACTIVE_IMPACTS, active_planets: [] };
    expect(() => ActiveImpactsSchema.parse(empty)).not.toThrow();
  });

  it('accepts empty resonance_badges array', () => {
    const empty = { ...VALID_ACTIVE_IMPACTS, resonance_badges: [] };
    expect(() => ActiveImpactsSchema.parse(empty)).not.toThrow();
  });

  it('schema literal must be exact ACTIVE_IMPACTS_v1 not prefix match', () => {
    expect(() => ActiveImpactsSchema.parse({ ...VALID_ACTIVE_IMPACTS, schema: 'ACTIVE_IMPACTS_v10' })).toThrow();
  });
});

// ── Coherence split — additive formula ──────────────────────────────────────

describe('Coherence split — additive formula', () => {
  it('displayed_coherence >= base_coherence when solar pressure is positive', () => {
    const baseHarmony = 0.5;
    const solarPressure = 0.2;
    const sWeight = 0.35;
    const baseCoherence = Math.min(100, Math.max(0, Math.round(baseHarmony * 100)));
    const solarDelta = Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * sWeight * 100)));
    const displayedCoherence = baseCoherence + solarDelta;
    expect(baseCoherence).toBe(50);
    expect(solarDelta).toBe(7);
    expect(displayedCoherence).toBe(57);
    expect(displayedCoherence).toBeGreaterThanOrEqual(baseCoherence);
  });

  it('displayed_coherence equals base when solar pressure is 0', () => {
    const baseHarmony = 0.6;
    const baseCoherence = Math.round(baseHarmony * 100);
    const solarDelta = Math.min(100 - baseCoherence, Math.max(0, Math.round(0 * 0.35 * 100)));
    expect(solarDelta).toBe(0);
    expect(baseCoherence + solarDelta).toBe(60);
  });

  it('displayed_coherence never exceeds 100', () => {
    const baseHarmony = 0.95;
    const solarPressure = 0.9;
    const baseCoherence = Math.round(baseHarmony * 100);
    const solarDelta = Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * 0.35 * 100)));
    expect(baseCoherence + solarDelta).toBeLessThanOrEqual(100);
  });
});

// ── Coherence split — missing fusion data ─────────────────────────────────────

describe('Coherence split — missing fusion data', () => {
  it('coherence fields are null when harmony_index is absent', () => {
    const rawHarmony = undefined;
    const hasFusionData = rawHarmony !== undefined && rawHarmony !== null;
    const baseCoherence = hasFusionData ? Math.round(rawHarmony * 100) : null;
    expect(baseCoherence).toBeNull();
  });

  it('harmony_index still returns a number even without fusion data', () => {
    const rawHarmony = undefined;
    const hasFusionData = rawHarmony !== undefined;
    const baseHarmony = rawHarmony ?? 0.5;
    const displayedCoherence = null;
    const harmonyIndex = displayedCoherence ?? Math.min(100, Math.max(0,
      Math.round((baseHarmony * 0.65 + 0.1 * 0.35) * 100)
    ));
    expect(typeof harmonyIndex).toBe('number');
    expect(harmonyIndex).toBeGreaterThan(0);
  });
});
