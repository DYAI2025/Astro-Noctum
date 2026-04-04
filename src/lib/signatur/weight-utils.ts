import {
  soulprintToNatalWeights,
  quizSectorsToQuizWeights,
  soulprintToDimensionWeights,
} from '@/src/components/fusion-ring-website/signatur-bridge';

// ── Synthetic soulprint fallback ────────────────────────────────────────────

const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/**
 * Generates a deterministic 12-sector soulprint array from a zodiac sign name.
 * Peak at the sign's index, smooth taper to neighbors, floor at 0.25.
 * Returns a uniform 0.5 array for unknown or empty input.
 */
export function syntheticSoulprintFromSign(sign: string): number[] {
  const idx = SIGN_ORDER.indexOf(sign);
  if (idx === -1) return Array(12).fill(0.5);
  return Array.from({ length: 12 }, (_, i) => {
    const dist = Math.min(Math.abs(i - idx), 12 - Math.abs(i - idx));
    return Math.max(0.25, 0.85 - dist * 0.1);
  });
}

// ── Sector guards & converters ──────────────────────────────────────────────

/**
 * Normalized guard for 12-sector arrays used across Dashboard/Signatur flows.
 * Prevents copy-paste conversion snippets and helper-name drift bugs.
 */
export function hasFullSectorSet(sectors: number[] | null | undefined): sectors is number[] {
  return Array.isArray(sectors) && sectors.length === 12;
}

export function toNatalWeightsOrUndefined(sectors: number[] | null | undefined): Record<string, number> | undefined {
  return hasFullSectorSet(sectors) ? soulprintToNatalWeights(sectors) : undefined;
}

export function toQuizWeightsOrUndefined(sectors: number[] | null | undefined): Record<string, number> | undefined {
  return hasFullSectorSet(sectors) ? quizSectorsToQuizWeights(sectors) : undefined;
}

export function toDimensionWeightsOrUndefined(sectors: number[] | null | undefined): Record<string, number> | undefined {
  return hasFullSectorSet(sectors) ? soulprintToDimensionWeights(sectors) : undefined;
}
