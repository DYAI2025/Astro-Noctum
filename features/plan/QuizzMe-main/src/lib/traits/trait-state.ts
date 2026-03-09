/**
 * Trait State Types
 *
 * The two-layer trait system:
 * - baseScore: Stable anchor from astro/birth data (1-100)
 * - shiftZ: Dynamic offset in logit space (updated by quizzes)
 *
 * UI score is computed deterministically: uiScore(state) -> 1..100
 * UI never computes stats directly - it reads ProfileSnapshot.traits only.
 */

/**
 * Internal state for a single trait.
 * This is the source of truth - UI reads derived values only.
 */
export type TraitState = {
  /** Registry trait ID (e.g., "trait.social.introversion") */
  traitId: string;

  /** Stable anchor from astro/birth data (1-100 integer) */
  baseScore: number;

  /** Dynamic offset in logit space (can be positive or negative) */
  shiftZ: number;

  /** Accumulated evidence weight (sum of abs(deltaZ) applied) */
  shiftStrength: number;

  /** Last update timestamp (ISO string) */
  updatedAt: string;
};

/**
 * Configuration for the trait engine math.
 * These values control saturation and anchor dominance behavior.
 */
export type TraitEngineConfig = {
  /** Maximum absolute value for z (prevents numeric overflow) */
  Z_MAX: number;

  /** Max drift when evidence aligns with base direction */
  MAX_ALIGN_Z: number;

  /** Max drift when evidence opposes base direction (asymmetric cap) */
  MAX_OPPOSE_Z: number;

  /** Multiplier applied to evidence that opposes base direction */
  OPPOSITION_FACTOR: number;

  /** Epsilon for numeric stability in logit/sigmoid */
  EPS: number;
};

/**
 * Default configuration values.
 * These create the desired behavior:
 * - Saturation near edges (harder to move from 90->95 than 50->55)
 * - Anchor dominance (base character is stable, quizzes adjust around it)
 * - Evidence opposing base is weakened and capped
 */
export const DEFAULT_CONFIG: TraitEngineConfig = {
  Z_MAX: 6,
  MAX_ALIGN_Z: 2.5,
  MAX_OPPOSE_Z: 1.0,
  OPPOSITION_FACTOR: 0.35,
  EPS: 1e-4,
};

/**
 * Map of trait IDs to their states.
 * This is the internal source of truth for all trait data.
 */
export type TraitStateMap = Record<string, TraitState>;

/**
 * Create a default trait state with neutral values.
 * Used when no astro base score is available.
 */
export function createDefaultTraitState(
  traitId: string,
  occurredAt: string = new Date().toISOString()
): TraitState {
  return {
    traitId,
    baseScore: 50,
    shiftZ: 0,
    shiftStrength: 0,
    updatedAt: occurredAt,
  };
}

/**
 * Create a trait state with a specific base score.
 * Used during astro onboarding to initialize anchors.
 */
export function createTraitState(
  traitId: string,
  baseScore: number,
  occurredAt: string = new Date().toISOString()
): TraitState {
  // Clamp to valid range
  const clampedBase = Math.max(1, Math.min(100, Math.round(baseScore)));

  return {
    traitId,
    baseScore: clampedBase,
    shiftZ: 0,
    shiftStrength: 0,
    updatedAt: occurredAt,
  };
}
