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
