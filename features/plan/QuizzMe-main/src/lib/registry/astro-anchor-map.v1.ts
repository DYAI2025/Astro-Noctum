/**
 * Astro Anchor Map v1
 *
 * Maps astrological data to trait base scores.
 * This is the SINGLE source of truth for astro → trait anchoring.
 *
 * Weight hierarchy:
 * - sunSign: 1.0 (always known)
 * - ascendant: 0.6 (requires birth time)
 * - moonSign: 0.4 (requires birth time)
 * - chineseAnimal: 0.25
 *
 * Only ANCHORABLE traits are affected. Non-anchorable traits stay at 50.
 */

import { TRAITS } from "./traits";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type ChineseAnimal =
  | "rat"
  | "ox"
  | "tiger"
  | "rabbit"
  | "dragon"
  | "snake"
  | "horse"
  | "goat"
  | "monkey"
  | "rooster"
  | "dog"
  | "pig";

export type AstroInput = {
  sunSign: ZodiacSign;
  ascendant?: ZodiacSign;
  moonSign?: ZodiacSign;
  chineseAnimal?: ChineseAnimal;
};

// Trait deltas: positive = increase from 50, negative = decrease
type TraitDelta = Record<string, number>;

// ═══════════════════════════════════════════════════════════════════════════
// ANCHORABLE TRAIT IDS
// ═══════════════════════════════════════════════════════════════════════════

export const ANCHORABLE_TRAIT_IDS = TRAITS.filter((t) => t.anchorable).map(
  (t) => t.id
);

// ═══════════════════════════════════════════════════════════════════════════
// ZODIAC SIGN MAPPINGS (Western)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Each sign affects multiple traits with different intensities.
 * Values are deltas from 50 (neutral).
 * Range: -30 to +30 (keeping final scores well within 1-100)
 */
const ZODIAC_DELTAS: Record<ZodiacSign, TraitDelta> = {
  aries: {
    "trait.values.autonomy": 15,
    "trait.values.achievement": 10,
    "trait.motivation.power": 12,
    "trait.social.dominance": 15,
    "trait.lifestyle.adventure": 18,
    "trait.lifestyle.spontaneity": 12,
    "trait.aura.energy": 20,
    "trait.aura.authority": 10,
    "trait.values.security": -10,
  },
  taurus: {
    "trait.values.security": 20,
    "trait.values.connection": 10,
    "trait.lifestyle.spontaneity": -15,
    "trait.aura.warmth": 12,
    "trait.interest.spirituality": 8,
    "trait.lifestyle.adventure": -10,
    "trait.skills.creativity": 10,
  },
  gemini: {
    "trait.social.openness": 18,
    "trait.skills.language": 15,
    "trait.skills.curiosity": 18,
    "trait.lifestyle.spontaneity": 12,
    "trait.cognition.abstract_concrete": 10,
    "trait.aura.energy": 12,
    "trait.social.introversion": -15,
  },
  cancer: {
    "trait.values.connection": 20,
    "trait.eq.empathy": 18,
    "trait.motivation.affiliation": 15,
    "trait.aura.warmth": 15,
    "trait.love.independence": -12,
    "trait.values.security": 12,
    "trait.interest.spirituality": 10,
  },
  leo: {
    "trait.motivation.power": 15,
    "trait.social.dominance": 12,
    "trait.aura.authority": 15,
    "trait.aura.energy": 15,
    "trait.skills.creativity": 12,
    "trait.values.achievement": 10,
    "trait.social.openness": 10,
  },
  virgo: {
    "trait.cognition.system_vs_story": 15,
    "trait.skills.intellect": 12,
    "trait.values.achievement": 12,
    "trait.lifestyle.spontaneity": -12,
    "trait.skills.math": 10,
    "trait.aura.mystery": -8,
  },
  libra: {
    "trait.values.connection": 15,
    "trait.eq.empathy": 12,
    "trait.social.openness": 12,
    "trait.aura.warmth": 10,
    "trait.motivation.affiliation": 12,
    "trait.social.dominance": -10,
    "trait.skills.creativity": 10,
  },
  scorpio: {
    "trait.aura.mystery": 20,
    "trait.interest.spirituality": 15,
    "trait.cognition.abstract_concrete": 12,
    "trait.motivation.power": 10,
    "trait.social.introversion": 12,
    "trait.aura.authority": 10,
    "trait.social.openness": -12,
  },
  sagittarius: {
    "trait.lifestyle.adventure": 20,
    "trait.values.growth": 15,
    "trait.skills.curiosity": 15,
    "trait.social.openness": 12,
    "trait.values.autonomy": 12,
    "trait.interest.spirituality": 10,
    "trait.values.security": -12,
  },
  capricorn: {
    "trait.values.achievement": 18,
    "trait.motivation.achievement": 15,
    "trait.values.security": 12,
    "trait.cognition.system_vs_story": 12,
    "trait.aura.authority": 12,
    "trait.lifestyle.spontaneity": -15,
    "trait.motivation.power": 10,
  },
  aquarius: {
    "trait.values.autonomy": 18,
    "trait.skills.creativity": 15,
    "trait.cognition.abstract_concrete": 15,
    "trait.values.growth": 12,
    "trait.social.openness": 10,
    "trait.aura.mystery": 10,
    "trait.motivation.affiliation": -8,
  },
  pisces: {
    "trait.interest.spirituality": 20,
    "trait.eq.empathy": 18,
    "trait.skills.creativity": 15,
    "trait.aura.mystery": 12,
    "trait.cognition.abstract_concrete": -10,
    "trait.values.connection": 12,
    "trait.social.introversion": 10,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CHINESE ANIMAL MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

const CHINESE_DELTAS: Record<ChineseAnimal, TraitDelta> = {
  rat: {
    "trait.skills.intellect": 8,
    "trait.skills.curiosity": 6,
    "trait.social.openness": 5,
  },
  ox: {
    "trait.values.security": 8,
    "trait.motivation.achievement": 6,
    "trait.lifestyle.spontaneity": -5,
  },
  tiger: {
    "trait.motivation.power": 8,
    "trait.aura.authority": 6,
    "trait.lifestyle.adventure": 6,
  },
  rabbit: {
    "trait.eq.empathy": 6,
    "trait.aura.warmth": 6,
    "trait.values.connection": 5,
  },
  dragon: {
    "trait.aura.energy": 8,
    "trait.motivation.power": 6,
    "trait.values.achievement": 5,
  },
  snake: {
    "trait.aura.mystery": 8,
    "trait.skills.intellect": 6,
    "trait.interest.spirituality": 5,
  },
  horse: {
    "trait.lifestyle.adventure": 8,
    "trait.aura.energy": 6,
    "trait.values.autonomy": 5,
  },
  goat: {
    "trait.skills.creativity": 8,
    "trait.interest.spirituality": 6,
    "trait.eq.empathy": 5,
  },
  monkey: {
    "trait.skills.curiosity": 8,
    "trait.social.openness": 6,
    "trait.lifestyle.spontaneity": 6,
  },
  rooster: {
    "trait.values.achievement": 6,
    "trait.cognition.system_vs_story": 6,
    "trait.aura.authority": 5,
  },
  dog: {
    "trait.values.connection": 8,
    "trait.eq.empathy": 6,
    "trait.motivation.affiliation": 5,
  },
  pig: {
    "trait.aura.warmth": 8,
    "trait.values.connection": 6,
    "trait.lifestyle.spontaneity": 5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// WEIGHT CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
  sunSign: 1.0,
  ascendant: 0.6,
  moonSign: 0.4,
  chineseAnimal: 0.25,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTE BASE SCORES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute base scores for all anchorable traits from astro data.
 *
 * Algorithm:
 * 1. Start all anchorable traits at 50
 * 2. Apply weighted deltas from each astro component
 * 3. Clamp final values to 1-100
 *
 * @param astro - Astrological input data
 * @returns Map of traitId -> baseScore (1-100)
 */
export function computeBaseScores(astro: AstroInput): Record<string, number> {
  // Initialize all anchorable traits at neutral (50)
  const scores: Record<string, number> = {};
  for (const traitId of ANCHORABLE_TRAIT_IDS) {
    scores[traitId] = 50;
  }

  // Apply sun sign deltas (always present, weight 1.0)
  const sunDeltas = ZODIAC_DELTAS[astro.sunSign] ?? {};
  for (const [traitId, delta] of Object.entries(sunDeltas)) {
    if (traitId in scores) {
      scores[traitId] += delta * WEIGHTS.sunSign;
    }
  }

  // Apply ascendant deltas (if known, weight 0.6)
  if (astro.ascendant) {
    const ascDeltas = ZODIAC_DELTAS[astro.ascendant] ?? {};
    for (const [traitId, delta] of Object.entries(ascDeltas)) {
      if (traitId in scores) {
        scores[traitId] += delta * WEIGHTS.ascendant;
      }
    }
  }

  // Apply moon sign deltas (if known, weight 0.4)
  if (astro.moonSign) {
    const moonDeltas = ZODIAC_DELTAS[astro.moonSign] ?? {};
    for (const [traitId, delta] of Object.entries(moonDeltas)) {
      if (traitId in scores) {
        scores[traitId] += delta * WEIGHTS.moonSign;
      }
    }
  }

  // Apply chinese animal deltas (if known, weight 0.25)
  if (astro.chineseAnimal) {
    const chineseDeltas = CHINESE_DELTAS[astro.chineseAnimal] ?? {};
    for (const [traitId, delta] of Object.entries(chineseDeltas)) {
      if (traitId in scores) {
        scores[traitId] += delta * WEIGHTS.chineseAnimal;
      }
    }
  }

  // Clamp all scores to 1-100 and round to integers
  for (const traitId of Object.keys(scores)) {
    scores[traitId] = Math.round(Math.max(1, Math.min(100, scores[traitId])));
  }

  return scores;
}

/**
 * Check if a trait ID is anchorable
 */
export function isAnchorableTrait(traitId: string): boolean {
  return ANCHORABLE_TRAIT_IDS.includes(traitId);
}
