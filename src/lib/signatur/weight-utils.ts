import { soulprintToNatalWeights, quizSectorsToQuizWeights } from '@/src/components/fusion-ring-website/signatur-bridge';

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
