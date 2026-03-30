/**
 * Life Area Mapping — 12 zodiac sectors → 7 life areas
 *
 * Maps soulprint sector weights to 7 life domains for Weekly Insights.
 * Each life area draws from 2–3 zodiac sectors based on traditional
 * house rulership and element affinity.
 *
 * The mapping is deterministic: same soulprint + same transit = same area scores.
 */

// ── Life Area Definitions ────────────────────────────────────────────

export type LifeAreaKey =
  | 'freundschaften'
  | 'liebe'
  | 'sex_zaertlichkeit'
  | 'beruf'
  | 'alltag'
  | 'karriere'
  | 'gesundheit';

export interface LifeAreaDef {
  key: LifeAreaKey;
  label: { de: string; en: string };
  /** Zodiac sector indices (0-11) that contribute to this area */
  sectorIndices: number[];
  /** Weights for each contributing sector (same order as sectorIndices) */
  sectorWeights: number[];
  /** Default tendency labels for fallback */
  tendencyLabels: { de: string[]; en: string[] };
}

/**
 * Mapping rationale (house-based):
 * - Freundschaften: 11th house (Aquarius/10) + 3rd house (Gemini/2) — social circles + communication
 * - Liebe: 5th house (Leo/4) + 7th house (Libra/6) — romance + partnership
 * - Sex/Zärtlichkeit: 8th house (Scorpio/7) + 5th house (Leo/4) — intimacy + passion
 * - Beruf: 6th house (Virgo/5) + 10th house (Capricorn/9) — daily work + career authority
 * - Alltag: 4th house (Cancer/3) + 6th house (Virgo/5) + 1st house (Aries/0) — home + routine + self
 * - Karriere: 10th house (Capricorn/9) + 2nd house (Taurus/1) — ambition + resources
 * - Gesundheit: 6th house (Virgo/5) + 1st house (Aries/0) + 12th house (Pisces/11) — vitality + body + healing
 */
export const LIFE_AREAS: LifeAreaDef[] = [
  {
    key: 'freundschaften',
    label: { de: 'Freundschaften', en: 'Friendships' },
    sectorIndices: [10, 2],
    sectorWeights: [0.6, 0.4],
    tendencyLabels: {
      de: ['Offenheit', 'Rückzug', 'Klärung', 'Spannung', 'Verbundenheit'],
      en: ['Openness', 'Withdrawal', 'Clarification', 'Tension', 'Connection'],
    },
  },
  {
    key: 'liebe',
    label: { de: 'Liebe', en: 'Love' },
    sectorIndices: [4, 6],
    sectorWeights: [0.55, 0.45],
    tendencyLabels: {
      de: ['Intensität', 'Distanz', 'Nähe', 'Spannung', 'Harmonie'],
      en: ['Intensity', 'Distance', 'Closeness', 'Tension', 'Harmony'],
    },
  },
  {
    key: 'sex_zaertlichkeit',
    label: { de: 'Sex & Zärtlichkeit', en: 'Intimacy' },
    sectorIndices: [7, 4],
    sectorWeights: [0.6, 0.4],
    tendencyLabels: {
      de: ['Leidenschaft', 'Zurückhaltung', 'Tiefe', 'Spielerisch', 'Intensität'],
      en: ['Passion', 'Reserve', 'Depth', 'Playful', 'Intensity'],
    },
  },
  {
    key: 'beruf',
    label: { de: 'Beruf', en: 'Work' },
    sectorIndices: [5, 9],
    sectorWeights: [0.5, 0.5],
    tendencyLabels: {
      de: ['Fokus', 'Ablenkung', 'Produktivität', 'Erschöpfung', 'Klarheit'],
      en: ['Focus', 'Distraction', 'Productivity', 'Exhaustion', 'Clarity'],
    },
  },
  {
    key: 'alltag',
    label: { de: 'Alltag', en: 'Daily Life' },
    sectorIndices: [3, 5, 0],
    sectorWeights: [0.4, 0.35, 0.25],
    tendencyLabels: {
      de: ['Routine', 'Unruhe', 'Leichtigkeit', 'Überforderung', 'Struktur'],
      en: ['Routine', 'Restlessness', 'Ease', 'Overwhelm', 'Structure'],
    },
  },
  {
    key: 'karriere',
    label: { de: 'Karriere', en: 'Career' },
    sectorIndices: [9, 1],
    sectorWeights: [0.6, 0.4],
    tendencyLabels: {
      de: ['Ambition', 'Stillstand', 'Wachstum', 'Umbruch', 'Stabilität'],
      en: ['Ambition', 'Stagnation', 'Growth', 'Upheaval', 'Stability'],
    },
  },
  {
    key: 'gesundheit',
    label: { de: 'Gesundheit', en: 'Health' },
    sectorIndices: [5, 0, 11],
    sectorWeights: [0.4, 0.35, 0.25],
    tendencyLabels: {
      de: ['Vitalität', 'Erschöpfung', 'Regeneration', 'Anspannung', 'Balance'],
      en: ['Vitality', 'Exhaustion', 'Recovery', 'Tension', 'Balance'],
    },
  },
];

// ── Computation ─────────────────────────────────────────────────────

export interface LifeAreaScore {
  key: LifeAreaKey;
  label: { de: string; en: string };
  /** Composite score 0–1 representing area intensity for the period */
  score: number;
  /** Rank among all 7 areas (1 = highest score) */
  rank: number;
  /** Whether this area is in the top 3 */
  isHighlighted: boolean;
}

/**
 * Compute life area scores from 12-element soulprint sectors.
 *
 * Each area's score is the weighted sum of its mapped zodiac sectors.
 * Scores are normalized to 0–1 range and ranked for top-3 highlighting.
 *
 * @param sectors - 12-element array of sector weights (from soulprint or transit)
 * @returns 7 LifeAreaScores sorted by the LIFE_AREAS order (not by rank)
 */
export function computeLifeAreaScores(sectors: number[]): LifeAreaScore[] {
  if (!sectors || sectors.length < 12) {
    // Fallback: equal scores for all areas
    return LIFE_AREAS.map((area, i) => ({
      key: area.key,
      label: area.label,
      score: 0.5,
      rank: i + 1,
      isHighlighted: i < 3,
    }));
  }

  // Compute raw scores
  const rawScores = LIFE_AREAS.map((area) => {
    let score = 0;
    for (let i = 0; i < area.sectorIndices.length; i++) {
      const sectorIdx = area.sectorIndices[i];
      const weight = area.sectorWeights[i];
      score += (sectors[sectorIdx] ?? 0) * weight;
    }
    return { key: area.key, label: area.label, score };
  });

  // Normalize to 0–1
  const maxScore = Math.max(...rawScores.map((r) => r.score), 0.001);
  const minScore = Math.min(...rawScores.map((r) => r.score));
  const range = maxScore - minScore || 1;

  const normalized = rawScores.map((r) => ({
    ...r,
    score: Math.round(((r.score - minScore) / range) * 1000) / 1000,
  }));

  // Rank (highest score = rank 1)
  const sorted = [...normalized].sort((a, b) => b.score - a.score);
  const rankMap = new Map<LifeAreaKey, number>();
  sorted.forEach((item, idx) => rankMap.set(item.key, idx + 1));

  return normalized.map((item) => ({
    ...item,
    rank: rankMap.get(item.key)!,
    isHighlighted: rankMap.get(item.key)! <= 3,
  }));
}

/**
 * Combine soulprint sectors with transit sectors for weekly scoring.
 *
 * Uses 60/40 blend: soulprint provides the personal baseline,
 * transit provides the weekly modulation.
 *
 * @param soulprint - 12-element personal soulprint sectors
 * @param transit - 12-element current transit sectors (optional)
 * @returns Blended 12-element sector array
 */
export function blendSectorsForWeekly(
  soulprint: number[],
  transit?: number[] | null,
): number[] {
  if (!transit || transit.length < 12) return soulprint;

  return soulprint.map((s, i) => {
    const t = transit[i] ?? 0;
    return s * 0.6 + t * 0.4;
  });
}
