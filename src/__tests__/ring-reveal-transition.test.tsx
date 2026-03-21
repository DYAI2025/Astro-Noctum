/**
 * ring-reveal-transition.test.tsx
 *
 * Tests for the ring-reveal natalWeights derivation via soulprintToNatalWeights.
 *
 * Planet → sector(s) mapping (from signatur-bridge.ts):
 *   Sun     → [4]        (Leo)
 *   Moon    → [3]        (Cancer)
 *   Mercury → [2, 5]     (Gemini, Virgo)
 *   Venus   → [1, 6]     (Taurus, Libra)
 *   Mars    → [0, 7]     (Aries, Scorpio)
 *   Jupiter → [8, 11]    (Sagittarius, Pisces)
 *   Saturn  → [9, 10]    (Capricorn, Aquarius)
 */

import { describe, it, expect } from 'vitest';
import { soulprintToNatalWeights } from '@/src/components/fusion-ring-website/signatur-bridge';

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;

// ---------------------------------------------------------------------------
// 1. Output shape — 7 planet keys, correct values for a sample input
// ---------------------------------------------------------------------------
describe('soulprintToNatalWeights — output shape and key values', () => {
  // Sector index → zodiac sign:
  // 0=Aries, 1=Taurus, 2=Gemini, 3=Cancer, 4=Leo, 5=Virgo, 6=Libra,
  // 7=Scorpio, 8=Sagittarius, 9=Capricorn, 10=Aquarius, 11=Pisces
  const sectors = [
    0.6,  // 0  Aries      → Mars
    0.45, // 1  Taurus     → Venus
    0.7,  // 2  Gemini     → Mercury
    0.55, // 3  Cancer     → Moon
    0.9,  // 4  Leo        → Sun
    0.65, // 5  Virgo      → Mercury
    0.5,  // 6  Libra      → Venus
    0.8,  // 7  Scorpio    → Mars
    0.75, // 8  Sagittarius → Jupiter
    0.4,  // 9  Capricorn  → Saturn
    0.35, // 10 Aquarius   → Saturn
    0.6,  // 11 Pisces     → Jupiter
  ];

  it('returns exactly 7 planet keys', () => {
    const weights = soulprintToNatalWeights(sectors);
    expect(Object.keys(weights)).toHaveLength(7);
    for (const planet of PLANETS) {
      expect(weights).toHaveProperty(planet);
    }
  });

  it('single-sector planets map directly (Sun = sector[4])', () => {
    const weights = soulprintToNatalWeights(sectors);
    // Sun → Leo (index 4) = 0.9 directly
    expect(weights.Sun).toBeCloseTo(0.9, 5);
    // Moon → Cancer (index 3) = 0.55 directly
    expect(weights.Moon).toBeCloseTo(0.55, 5);
  });

  it('multi-sector planets are averaged (Mercury = avg(sector[2], sector[5]))', () => {
    const weights = soulprintToNatalWeights(sectors);
    // Mercury → avg(0.7, 0.65) = 0.675
    expect(weights.Mercury).toBeCloseTo(0.675, 5);
    // Venus → avg(0.45, 0.5) = 0.475
    expect(weights.Venus).toBeCloseTo(0.475, 5);
    // Mars → avg(0.6, 0.8) = 0.7
    expect(weights.Mars).toBeCloseTo(0.7, 5);
    // Jupiter → avg(0.75, 0.6) = 0.675
    expect(weights.Jupiter).toBeCloseTo(0.675, 5);
    // Saturn → avg(0.4, 0.35) = 0.375
    expect(weights.Saturn).toBeCloseTo(0.375, 5);
  });
});

// ---------------------------------------------------------------------------
// 2. Neutral sectors (all 0.5) — all planet weights should be exactly 0.5
// ---------------------------------------------------------------------------
describe('soulprintToNatalWeights — neutral sector array', () => {
  const neutralSectors = Array(12).fill(0.5);

  it('all 7 planet weights are 0.5 when all sectors are 0.5', () => {
    const weights = soulprintToNatalWeights(neutralSectors);
    for (const planet of PLANETS) {
      expect(weights[planet]).toBeCloseTo(0.5, 10);
    }
  });

  it('returns 7 keys even for the neutral case', () => {
    const weights = soulprintToNatalWeights(neutralSectors);
    expect(Object.keys(weights)).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// 3. Extreme values — 0.0 and 1.0 are preserved exactly
// ---------------------------------------------------------------------------
describe('soulprintToNatalWeights — extreme values', () => {
  it('sector value 1.0 on Leo (index 4) yields Sun weight of exactly 1.0', () => {
    const sectors = Array(12).fill(0.5);
    sectors[4] = 1.0; // Leo → Sun (single-sector mapping)
    const weights = soulprintToNatalWeights(sectors);
    expect(weights.Sun).toBeCloseTo(1.0, 10);
  });

  it('sector value 0.0 on Cancer (index 3) yields Moon weight of exactly 0.0', () => {
    const sectors = Array(12).fill(0.5);
    sectors[3] = 0.0; // Cancer → Moon (single-sector mapping)
    const weights = soulprintToNatalWeights(sectors);
    expect(weights.Moon).toBeCloseTo(0.0, 10);
  });

  it('extreme values on both Mercury sectors are averaged correctly', () => {
    const sectors = Array(12).fill(0.5);
    sectors[2] = 1.0; // Gemini → Mercury
    sectors[5] = 0.0; // Virgo → Mercury
    const weights = soulprintToNatalWeights(sectors);
    // avg(1.0, 0.0) = 0.5
    expect(weights.Mercury).toBeCloseTo(0.5, 10);
  });

  it('all-zero sectors produce all-zero weights', () => {
    const zeroSectors = Array(12).fill(0.0);
    const weights = soulprintToNatalWeights(zeroSectors);
    for (const planet of PLANETS) {
      expect(weights[planet]).toBeCloseTo(0.0, 10);
    }
  });

  it('all-one sectors produce all-one weights', () => {
    const oneSectors = Array(12).fill(1.0);
    const weights = soulprintToNatalWeights(oneSectors);
    for (const planet of PLANETS) {
      expect(weights[planet]).toBeCloseTo(1.0, 10);
    }
  });
});
