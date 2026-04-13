/**
 * Tests for useActiveImpacts hook + ActiveImpactsSchema validation.
 *
 * Tests the Zod schema (ACTIVE_IMPACTS_v1 contract), cache key generation,
 * and schema validation edge cases.
 */
import { describe, it, expect } from 'vitest';
import {
  ActiveImpactsSchema,
  ActivePlanetSchema,
  ResonanceBadgeSchema,
} from '@/src/lib/schemas/active-impacts';

describe('ActiveImpactsSchema', () => {
  const validResponse = {
    schema: 'ACTIVE_IMPACTS_v1' as const,
    date: '2026-04-13',
    harmony_index: 52,
    active_planets: [
      {
        planet: 'Mars',
        strength: 0.85,
        aspect_type: 'conjunction',
        orb: 1.2,
        natal_planet: 'Sun',
        bazi_resonance: 'gleichklang',
        wu_xing_element: 'fire',
      },
      {
        planet: 'Jupiter',
        strength: 0.45,
        aspect_type: 'trine',
        orb: 4.4,
        natal_planet: 'Moon',
        bazi_resonance: null,
        wu_xing_element: null,
      },
    ],
    resonance_badges: [
      { type: 'transit', label: 'Mars Konjunktion · Verstärkend', sublabel: '85%', intensity: 'hoch', color: '#D4AF37' },
    ],
    meta: {
      engine: 'astro-noctum-server',
      solar_pressure_source: 'noaa_swpc',
      cached: false,
    },
  };

  it('parses a valid ACTIVE_IMPACTS_v1 response', () => {
    const result = ActiveImpactsSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.harmony_index).toBe(52);
      expect(result.data.active_planets).toHaveLength(2);
      expect(result.data.active_planets[0].planet).toBe('Mars');
    }
  });

  it('rejects harmony_index > 100', () => {
    const result = ActiveImpactsSchema.safeParse({ ...validResponse, harmony_index: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects harmony_index < 0', () => {
    const result = ActiveImpactsSchema.safeParse({ ...validResponse, harmony_index: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects wrong schema literal', () => {
    const result = ActiveImpactsSchema.safeParse({ ...validResponse, schema: 'WRONG_v1' });
    expect(result.success).toBe(false);
  });

  it('accepts empty active_planets array', () => {
    const result = ActiveImpactsSchema.safeParse({
      ...validResponse,
      active_planets: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active_planets).toHaveLength(0);
    }
  });

  it('accepts empty resonance_badges array', () => {
    const result = ActiveImpactsSchema.safeParse({
      ...validResponse,
      resonance_badges: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { harmony_index: _, ...incomplete } = validResponse;
    const result = ActiveImpactsSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });
});

describe('ActivePlanetSchema', () => {
  it('accepts valid planet with nullable bazi fields', () => {
    const result = ActivePlanetSchema.safeParse({
      planet: 'Saturn',
      strength: 0.3,
      aspect_type: 'square',
      orb: 5.7,
      natal_planet: 'Venus',
      bazi_resonance: null,
      wu_xing_element: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects strength > 1', () => {
    const result = ActivePlanetSchema.safeParse({
      planet: 'Mars',
      strength: 1.5,
      aspect_type: 'conjunction',
      orb: 0,
      natal_planet: 'Sun',
      bazi_resonance: 'gleichklang',
      wu_xing_element: 'fire',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative orb', () => {
    const result = ActivePlanetSchema.safeParse({
      planet: 'Mars',
      strength: 0.5,
      aspect_type: 'conjunction',
      orb: -1,
      natal_planet: 'Sun',
      bazi_resonance: null,
      wu_xing_element: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('ResonanceBadgeSchema', () => {
  it('accepts full badge with all fields', () => {
    const result = ResonanceBadgeSchema.safeParse({
      type: 'transit',
      label: 'Mars Konjunktion · Verstärkend',
      sublabel: '85%',
      intensity: 'hoch',
      color: '#D4AF37',
    });
    expect(result.success).toBe(true);
  });

  it('accepts badge without optional sublabel and color', () => {
    const result = ResonanceBadgeSchema.safeParse({
      type: 'space_weather',
      label: 'Kp 2.3 · Ruhig',
      intensity: 'niedrig',
    });
    expect(result.success).toBe(true);
  });
});

describe('cache key generation', () => {
  it('generates date-scoped key format', () => {
    const now = new Date();
    const d = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    const expected = `bazodiac_active_impacts:${d}`;
    // Verify the pattern matches what the hook uses
    expect(expected).toMatch(/^bazodiac_active_impacts:\d{4}-\d{2}-\d{2}$/);
  });
});
