/**
 * Tier Gains
 *
 * Quiz tiers determine how much a quiz can influence trait values.
 * Higher tier = more influence on trait shifts.
 *
 * CORE (0.70): Major personality assessments, comprehensive tests
 * GROWTH (0.35): Micro quizzes, focused assessments
 * FLAVOR (0.12): Horoscope, astro markers (very light touch)
 */

export type Tier = "CORE" | "GROWTH" | "FLAVOR";

/**
 * Z-space gain per tier.
 *
 * These values multiply with evidence and confidence to produce deltaZ:
 *   deltaZ0 = TIER_Z_GAIN[tier] * evidence * confidence
 *
 * Example at evidence=1.0, confidence=1.0:
 * - CORE quiz: deltaZ = 0.70
 * - GROWTH quiz: deltaZ = 0.35
 * - FLAVOR astro: deltaZ = 0.12
 */
export const TIER_Z_GAIN: Record<Tier, number> = {
  CORE: 0.70,
  GROWTH: 0.35,
  FLAVOR: 0.12,
};

/**
 * Get the tier for a module based on its ID.
 *
 * Default tier assignments:
 * - personality, big5, mbti -> CORE
 * - love_languages, social_role -> GROWTH
 * - astro, horoscope -> FLAVOR
 *
 * @param moduleId - The source.moduleId from ContributionEvent
 * @returns The tier for the module
 */
export function getTierForModule(moduleId: string): Tier {
  // CORE tier modules
  if (
    moduleId.includes("personality") ||
    moduleId.includes("big5") ||
    moduleId.includes("mbti") ||
    moduleId.includes("eq_assessment")
  ) {
    return "CORE";
  }

  // FLAVOR tier modules
  if (
    moduleId.includes("astro") ||
    moduleId.includes("horoscope") ||
    moduleId.includes("onboarding.astro") ||
    moduleId.includes("destiny")
  ) {
    return "FLAVOR";
  }

  // Default to GROWTH for everything else
  return "GROWTH";
}

/**
 * Default confidence values per tier.
 *
 * These are used when a quiz doesn't provide explicit confidence.
 * Higher tiers have higher default confidence because they typically
 * use more rigorous methodology.
 */
export const DEFAULT_CONFIDENCE: Record<Tier, number> = {
  CORE: 0.8,
  GROWTH: 0.6,
  FLAVOR: 0.4,
};
