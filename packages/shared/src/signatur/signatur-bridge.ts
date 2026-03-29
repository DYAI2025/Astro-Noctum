/**
 * Bridge: Converts soulprint_sectors (12-sector array from Bootstrap API)
 * to natalWeights (7-planet map for Bazodiac Engine V2) and quiz dimensions.
 *
 * Mapping: Each planet has natural affinity to zodiac sectors.
 * Sun→Leo(4), Moon→Cancer(3), Mercury→Gemini(2)+Virgo(5), etc.
 *
 * All output weights are clamped to [0, 1].
 * Inputs outside this range (e.g. from malformed API responses) are silently
 * clamped rather than propagating to the engine as out-of-range values, which
 * would cause poles to exceed canvas boundaries.
 */

/** Clamps a value to [0, 1]. Used by all bridge output functions. */
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// ─── Planet Sector Map ────────────────────────────────────────────────────────

const PLANET_SECTOR_MAP: Record<string, number[]> = {
  Sun:     [4],        // Leo
  Moon:    [3],        // Cancer
  Mercury: [2, 5],     // Gemini, Virgo
  Venus:   [1, 6],     // Taurus, Libra
  Mars:    [0, 7],     // Aries, Scorpio
  Jupiter: [8, 11],    // Sagittarius, Pisces
  Saturn:  [9, 10],    // Capricorn, Aquarius
};

// ─── Bridge Functions ─────────────────────────────────────────────────────────

/**
 * Convert soulprint_sectors[12] → 7 planet weights [0,1].
 * Used by the V2 engine (bazodiac-engine.ts) and as an intermediate
 * step for 7-planet → 6-dimension projection.
 *
 * All outputs are clamped to [0, 1].
 */
export function soulprintToNatalWeights(sectors: number[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const [planet, indices] of Object.entries(PLANET_SECTOR_MAP)) {
    const avg = indices.reduce((sum, i) => sum + (sectors[i] ?? 0.5), 0) / indices.length;
    weights[planet] = clamp01(avg);
  }
  return weights;
}

/**
 * Fallback: Derive natal weights from Western/BaZi API data when
 * no soulprint_sectors are available (pre-bootstrap users).
 * Outputs are inherently bounded — no clamp needed (base values are [0,1]).
 */
const ZODIAC_RULER: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury',
  Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter',
  Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveWeightsFromApiData(apiData: any): Record<string, number> {
  const base: Record<string, number> = {
    Sun: 0.7, Moon: 0.5, Mercury: 0.4,
    Venus: 0.4, Mars: 0.5, Jupiter: 0.5, Saturn: 0.4,
  };
  const sunSign = apiData?.western?.zodiac_sign || apiData?.western?.sun_sign || apiData?.sun_sign;
  const moonSign = apiData?.western?.moon_sign || apiData?.moon_sign;
  const sunRuler = sunSign ? ZODIAC_RULER[sunSign] : undefined;
  if (sunRuler && base[sunRuler] !== undefined) base[sunRuler] = Math.min(base[sunRuler]! + 0.2, 1);
  const moonRuler = moonSign ? ZODIAC_RULER[moonSign] : undefined;
  if (moonRuler && base[moonRuler] !== undefined) base[moonRuler] = Math.min(base[moonRuler]! + 0.15, 1);
  return base;
}

/**
 * Convert quiz contribution sectors[12] → 6 V3 dimension weights [0,1].
 *
 * Sector index → dimension mapping (12-sector zodiac ring, 0 = Aries):
 *   assertion  ← sectors[0]  (Aries — Mars affinity)
 *   empathy    ← sectors[3]  (Cancer — Moon affinity)
 *   creativity ← sectors[4]  (Leo — Sun affinity)
 *   logic      ← sectors[5]  (Virgo — Mercury affinity)
 *   intuition  ← sectors[8]  (Sagittarius — Jupiter affinity)
 *   discipline ← sectors[9]  (Capricorn — Saturn affinity)
 *
 * Remaining sectors (1,2,6,7,10,11) have no direct dimension mapping
 * and contribute only to the fallback average.
 *
 * All outputs are clamped to [0, 1].
 */
export function quizSectorsToQuizWeights(sectors: number[]): Record<string, number> {
  const rawFallback = sectors.length
    ? sectors.reduce((s, v) => s + v, 0) / sectors.length
    : 0.5;
  const fallback = clamp01(rawFallback);
  return {
    assertion:  clamp01(sectors[0] ?? fallback),
    empathy:    clamp01(sectors[3] ?? fallback),
    logic:      clamp01(sectors[5] ?? fallback),
    intuition:  clamp01(sectors[8] ?? fallback),
    creativity: clamp01(sectors[4] ?? fallback),
    discipline: clamp01(sectors[9] ?? fallback),
  };
}

/**
 * Signatur V3 Bridge: Convert soulprint_sectors[12] directly to 6 dimension weights.
 *
 * Uses the same sector→dimension mapping as quiz contributions — both sources
 * (natal soulprint and quiz answers) are projected onto the same 6-dimensional space.
 * This is intentional: it allows the True North comparison (natal vs. quiz) to be
 * computed as a direct per-dimension diff.
 *
 * All outputs are clamped to [0, 1] (inherited from quizSectorsToQuizWeights).
 *
 * Consumed by: bipolar-engine.ts (initializePoles natal input)
 */
export function soulprintToDimensionWeights(sectors: number[]): Record<string, number> {
  return quizSectorsToQuizWeights(sectors);
}
