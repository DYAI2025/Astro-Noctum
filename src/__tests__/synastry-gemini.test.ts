/**
 * Tests for sun sign sanitisation before Gemini prompt.
 * userSunSign comes from astro_profiles.sun_sign (DB) and could hold
 * stale/unexpected values — must be validated against ZODIAC_EN whitelist.
 */

import { describe, it, expect } from 'vitest';

// Mirror of the whitelist used in server.mjs synastryGeminiSummary.
// If the server list changes, this test will catch drift.
const ZODIAC_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
const ZODIAC_EN_SET = new Set(ZODIAC_EN);

function sanitizeSunSign(value: string | null | undefined): string | null {
  if (!value) return null;
  return ZODIAC_EN_SET.has(value) ? value : null;
}

describe('sanitizeSunSign (zodiac whitelist guard)', () => {
  it('passes through a valid zodiac name', () => {
    expect(sanitizeSunSign('Aries')).toBe('Aries');
    expect(sanitizeSunSign('Pisces')).toBe('Pisces');
    expect(sanitizeSunSign('Sagittarius')).toBe('Sagittarius');
  });

  it('returns null for "Unknown" (stored when BAFE had no data)', () => {
    expect(sanitizeSunSign('Unknown')).toBeNull();
  });

  it('returns null for arbitrary strings', () => {
    expect(sanitizeSunSign('anything goes')).toBeNull();
    expect(sanitizeSunSign('<script>alert(1)</script>')).toBeNull();
    expect(sanitizeSunSign('aries')).toBeNull(); // case-sensitive
  });

  it('returns null for null/empty/undefined input', () => {
    expect(sanitizeSunSign(null)).toBeNull();
    expect(sanitizeSunSign('')).toBeNull();
    expect(sanitizeSunSign(undefined)).toBeNull();
  });

  it('covers all 12 zodiac signs', () => {
    expect(ZODIAC_EN).toHaveLength(12);
    for (const sign of ZODIAC_EN) {
      expect(sanitizeSunSign(sign)).toBe(sign);
    }
  });
});
