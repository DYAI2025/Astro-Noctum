/**
 * Affinity Map Entry Generator
 *
 * Generates 12-element sector weight vectors for each marker keyword
 * in a DimensionSpec. The vectors encode how strongly each zodiac sector
 * is activated by a given marker, enabling the Fusion Ring to translate
 * quiz results into ring deformation.
 *
 * Weight distribution:
 *   - Primary sector:   ~0.45
 *   - Secondary sector:  ~0.25 (if defined)
 *   - Wu Xing element canonical sectors: remaining weight
 *   - All vectors normalize to sum = 1.0
 */

import type { DimensionSpec, AffinityMapEntry, ZodiacSectorIndex } from './generator-types';
import { ZODIAC_SECTORS } from './generator-types';

/**
 * Wu Xing element to canonical zodiac sector indices.
 * Derived from ZODIAC_SECTORS constant (element field).
 */
const ELEMENT_SECTORS: Record<string, ZodiacSectorIndex[]> = {
  Wood:  [0, 11],      // Aries, Pisces
  Fire:  [2, 3, 4],    // Gemini, Cancer, Leo
  Earth: [1, 10],      // Taurus, Aquarius
  Metal: [5, 6],       // Virgo, Libra
  Water: [7, 8, 9],    // Scorpio, Sagittarius, Capricorn
};

const PRIMARY_WEIGHT = 0.45;
const SECONDARY_WEIGHT = 0.25;

/**
 * Generate AFFINITY_MAP entries for all marker keywords across dimensions.
 *
 * @param dimensions - Array of DimensionSpec from QuizGeneratorInput
 * @returns One AffinityMapEntry per marker keyword, with normalized 12-element vectors
 */
export function generateAffinityEntries(dimensions: DimensionSpec[]): AffinityMapEntry[] {
  const entries: AffinityMapEntry[] = [];

  for (const dim of dimensions) {
    for (const keyword of dim.markerKeywords) {
      const weights: number[] = new Array(12).fill(0);
      const { primarySector, secondarySector, wuxingElement } = dim.fusionMapping;

      // Primary sector gets the highest weight
      weights[primarySector] = PRIMARY_WEIGHT;

      // Secondary sector gets second-highest weight (if defined)
      if (secondarySector !== undefined) {
        weights[secondarySector] = SECONDARY_WEIGHT;
      }

      // Distribute remaining weight across Wu Xing element's canonical sectors,
      // excluding any already-assigned sectors
      const elementSectors = ELEMENT_SECTORS[wuxingElement] ?? [];
      const usedSectors = new Set<number>([primarySector]);
      if (secondarySector !== undefined) usedSectors.add(secondarySector);
      const remaining = elementSectors.filter(s => !usedSectors.has(s));
      const remainingWeight = 1.0 - weights.reduce((a, b) => a + b, 0);

      if (remaining.length > 0 && remainingWeight > 0) {
        const perSector = remainingWeight / remaining.length;
        for (const s of remaining) {
          weights[s] = perSector;
        }
      } else if (remainingWeight > 0) {
        // All element sectors already used — spread across empty sectors
        const empty = weights
          .map((w, i) => (w === 0 ? i : -1))
          .filter(i => i >= 0);
        if (empty.length > 0) {
          const per = remainingWeight / empty.length;
          for (const i of empty) weights[i] = per;
        }
      }

      // Normalize to sum = 1.0 and round to 3 decimal places
      const sum = weights.reduce((a, b) => a + b, 0);
      const normalized = weights.map(w =>
        Math.round((w / sum) * 1000) / 1000,
      ) as AffinityMapEntry['sectorWeights'];

      entries.push({
        keyword,
        sectorWeights: normalized,
        domain: dim.markerDomain,
        rationale: `${dim.label} (${wuxingElement}, primary: ${ZODIAC_SECTORS[primarySector].sign})`,
      });
    }
  }

  return entries;
}
