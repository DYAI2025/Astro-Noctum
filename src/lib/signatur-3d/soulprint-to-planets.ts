/**
 * Phase H1 — Adapter: 12 zodiac-sector soulprint weights → 10 Cousto planet weights.
 *
 * Pure, deterministic, side-effect-free. No randomness, no time, no I/O.
 *
 * Consumes BootstrapResponse.soulprint_sectors (length 12, zodiac order
 * Aries..Pisces), distributes each sector's weight across the planets that
 * rule it via the classical + modern rulership matrix below.
 *
 * Every row in RULERSHIP sums to 1.0 — total weight is preserved across
 * the mapping (a uniform sector vector of sum S produces a planet vector
 * whose weights also sum to S).
 */

import type { PlanetName } from './planets';

/**
 * Sectors: 0=Aries, 1=Taurus, 2=Gemini, 3=Cancer, 4=Leo, 5=Virgo,
 *          6=Libra, 7=Scorpio, 8=Sagittarius, 9=Capricorn,
 *          10=Aquarius, 11=Pisces.
 *
 * Weights combine classical rulership (pre-Uranus discovery) with modern
 * co-rulership for the outer planets. Dual-rulership signs (Aries, Scorpio,
 * Sagittarius, Aquarius, Pisces) split 0.7 / 0.3 between classical + modern.
 * Single-rulership signs assign 1.0 to their ruler.
 */
export const RULERSHIP: Readonly<Record<number, Readonly<Partial<Record<PlanetName, number>>>>> = {
  0: { Mars: 0.7, Pluto: 0.3 }, // Aries — Mars classical, Pluto modern
  1: { Venus: 1.0 }, // Taurus
  2: { Mercury: 1.0 }, // Gemini
  3: { Moon: 1.0 }, // Cancer
  4: { Sun: 1.0 }, // Leo
  5: { Mercury: 1.0 }, // Virgo
  6: { Venus: 1.0 }, // Libra
  7: { Pluto: 0.7, Mars: 0.3 }, // Scorpio — Pluto modern, Mars classical
  8: { Jupiter: 0.7, Neptune: 0.3 }, // Sagittarius — Jupiter classical, Neptune modern accent
  9: { Saturn: 1.0 }, // Capricorn
  10: { Uranus: 0.7, Saturn: 0.3 }, // Aquarius — Uranus modern, Saturn classical
  11: { Neptune: 0.7, Jupiter: 0.3 }, // Pisces — Neptune modern, Jupiter classical
} as const;

/**
 * All 10 planet names in canonical order — used to seed the result Record
 * so every planet is always present (weight 0 if unreferenced).
 */
const ALL_PLANETS: readonly PlanetName[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;

/**
 * Maps 12 zodiac-sector weights to 10 planet weights via the RULERSHIP matrix.
 *
 * @param sectors 12-element readonly array (zodiac order Aries..Pisces).
 * @returns Record keyed by every PlanetName — all 10 keys always present.
 * @throws {Error} if sectors.length !== 12.
 *
 * @example
 *   // All-zero input yields all-zero output
 *   soulprintToPlanetWeights(new Array(12).fill(0))
 *   // → { Sun: 0, Moon: 0, ..., Pluto: 0 }
 *
 * @example
 *   // Aries-only input boosts Mars (0.7) + Pluto (0.3)
 *   soulprintToPlanetWeights([1,0,0,0,0,0,0,0,0,0,0,0])
 *   // → { Mars: 0.7, Pluto: 0.3, <others>: 0 }
 */
export function soulprintToPlanetWeights(
  sectors: readonly number[],
): Record<PlanetName, number> {
  if (sectors.length !== 12) {
    throw new Error(
      `soulprintToPlanetWeights expects 12 sectors, got ${sectors.length}`,
    );
  }

  // Seed every planet at 0 so all keys are always present.
  const result: Record<PlanetName, number> = {
    Sun: 0,
    Moon: 0,
    Mercury: 0,
    Venus: 0,
    Mars: 0,
    Jupiter: 0,
    Saturn: 0,
    Uranus: 0,
    Neptune: 0,
    Pluto: 0,
  };

  for (let sectorIdx = 0; sectorIdx < 12; sectorIdx++) {
    const sectorWeight = sectors[sectorIdx];
    const rulers = RULERSHIP[sectorIdx];
    if (!rulers) continue; // unreachable with 0..11 keys, but defensive

    for (const planet of ALL_PLANETS) {
      const share = rulers[planet];
      if (share !== undefined) {
        result[planet] += sectorWeight * share;
      }
    }
  }

  return result;
}
