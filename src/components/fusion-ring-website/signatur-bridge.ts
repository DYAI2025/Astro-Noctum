/**
 * Bridge: Converts soulprint_sectors (12-sector array from Bootstrap API)
 * to natalWeights (7-planet map for Bazodiac Engine V2) and quiz dimensions.
 *
 * Mapping: Each planet has natural affinity to zodiac sectors.
 * Sun→Leo(4), Moon→Cancer(3), Mercury→Gemini(2)+Virgo(5), etc.
 */

const PLANET_SECTOR_MAP: Record<string, number[]> = {
  Sun:     [4],        // Leo
  Moon:    [3],        // Cancer
  Mercury: [2, 5],     // Gemini, Virgo
  Venus:   [1, 6],     // Taurus, Libra
  Mars:    [0, 7],     // Aries, Scorpio
  Jupiter: [8, 11],    // Sagittarius, Pisces
  Saturn:  [9, 10],    // Capricorn, Aquarius
};

export function soulprintToNatalWeights(sectors: number[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const [planet, indices] of Object.entries(PLANET_SECTOR_MAP)) {
    const avg = indices.reduce((sum, i) => sum + (sectors[i] ?? 0.5), 0) / indices.length;
    weights[planet] = avg;
  }
  return weights;
}

/**
 * Fallback: Derive natal weights from Western/BaZi API data when
 * no soulprint_sectors are available (pre-bootstrap users).
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

export function quizSectorsToQuizWeights(sectors: number[]): Record<string, number> {
  const fallback = sectors.length
    ? sectors.reduce((s, v) => s + v, 0) / sectors.length
    : 0.5;
  return {
    assertion:  sectors[0] ?? fallback,
    empathy:    sectors[3] ?? fallback,
    logic:      sectors[5] ?? fallback,
    intuition:  sectors[8] ?? fallback,
    creativity: sectors[4] ?? fallback,
    discipline: sectors[9] ?? fallback,
  };
}

/**
 * Signatur V3 expects weights keyed by dimension ids.
 * For 12-sector inputs we use the same deterministic mapping as quiz sectors.
 */
export function soulprintToDimensionWeights(sectors: number[]): Record<string, number> {
  return quizSectorsToQuizWeights(sectors);
}
