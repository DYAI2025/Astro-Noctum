/**
 * Trait Engine
 *
 * Core math for the two-layer trait system:
 * - Score <-> Logit space transformations
 * - UI score computation from trait state
 * - Evidence application with anchor dominance
 *
 * Key behaviors:
 * - Saturation: Movement slows near edges (harder to go 90->95 than 50->55)
 * - Anchor dominance: Base character is stable, opposing evidence is weakened
 * - Bounds: UI score always in 1..100, never NaN
 */

import {
  TraitState,
  TraitStateMap,
  TraitEngineConfig,
  DEFAULT_CONFIG,
  createTraitState,
  createDefaultTraitState,
} from "./trait-state";
import { ANCHORABLE_TRAITS, TRAIT_BY_ID } from "../registry";

// ═══════════════════════════════════════════════════════════════════════════
// PURE MATH FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clamp a value to [a, b]
 */
export function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

/**
 * Convert score (1-100) to probability (0-1), with epsilon bounds
 */
export function scoreToP(score: number, eps: number): number {
  const clamped = clamp(score, 1, 100);
  const p = (clamped - 1) / 99;
  return clamp(p, eps, 1 - eps);
}

/**
 * Convert probability (0-1) to score (1-100)
 */
export function pToScore(p: number, eps: number): number {
  const pp = clamp(p, eps, 1 - eps);
  return Math.round(pp * 99 + 1);
}

/**
 * Logit function: p -> z (log-odds)
 */
export function logit(p: number): number {
  return Math.log(p / (1 - p));
}

/**
 * Sigmoid function: z -> p
 */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// ═══════════════════════════════════════════════════════════════════════════
// UI SCORE COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the UI-facing score (1-100) from trait state.
 *
 * This is the ONLY way UI should get trait values.
 * The math ensures:
 * - Always returns integer 1-100
 * - Saturation near edges (logit/sigmoid property)
 * - baseScore + shiftZ combined properly
 *
 * @param state - The internal trait state
 * @param config - Engine configuration (defaults to DEFAULT_CONFIG)
 * @returns Integer score 1-100
 */
export function uiScore(
  state: TraitState,
  config: TraitEngineConfig = DEFAULT_CONFIG
): number {
  // Convert base score to logit space
  const baseZ = logit(scoreToP(state.baseScore, config.EPS));

  // Add shift and clamp to prevent overflow
  const z = clamp(baseZ + state.shiftZ, -config.Z_MAX, config.Z_MAX);

  // Convert back to score
  return pToScore(sigmoid(z), config.EPS);
}

// ═══════════════════════════════════════════════════════════════════════════
// DRIFT CAPPING (ANCHOR DOMINANCE)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clamp shift based on direction relative to base.
 *
 * Asymmetric capping:
 * - Aligning with base direction: can drift up to MAX_ALIGN_Z
 * - Opposing base direction: capped at MAX_OPPOSE_Z (much smaller)
 *
 * This ensures the "base character" from astro remains stable
 * while allowing quizzes to adjust around it.
 */
export function clampShift(
  baseZ: number,
  shiftZ: number,
  config: TraitEngineConfig
): number {
  // If base is exactly neutral, allow equal drift either way
  const sameDir = baseZ === 0 ? true : Math.sign(baseZ) === Math.sign(shiftZ);

  // Choose limit based on direction
  const lim = sameDir ? config.MAX_ALIGN_Z : config.MAX_OPPOSE_Z;

  return clamp(shiftZ, -lim, +lim);
}

// ═══════════════════════════════════════════════════════════════════════════
// EVIDENCE APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply evidence to a trait state.
 *
 * Evidence that opposes the base direction is:
 * 1. Reduced by OPPOSITION_FACTOR
 * 2. Capped at MAX_OPPOSE_Z
 *
 * @param state - Current trait state
 * @param deltaZ0 - Raw evidence in logit space (from tier gain * evidence * confidence)
 * @param config - Engine configuration
 * @param occurredAt - Timestamp for the update
 * @returns New trait state (immutable update)
 */
export function applyEvidence(
  state: TraitState,
  deltaZ0: number,
  config: TraitEngineConfig = DEFAULT_CONFIG,
  occurredAt: string = new Date().toISOString()
): TraitState {
  // Get base direction in logit space
  const baseZ = logit(scoreToP(state.baseScore, config.EPS));

  // Check if evidence opposes the base direction
  const opposes = baseZ !== 0 && Math.sign(deltaZ0) !== Math.sign(baseZ);

  // Reduce opposing evidence by OPPOSITION_FACTOR
  const deltaZ = opposes ? deltaZ0 * config.OPPOSITION_FACTOR : deltaZ0;

  // Apply shift with asymmetric capping
  const nextShift = clampShift(baseZ, state.shiftZ + deltaZ, config);

  return {
    ...state,
    shiftZ: nextShift,
    shiftStrength: state.shiftStrength + Math.abs(deltaZ),
    updatedAt: occurredAt,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize trait states from base scores (astro onboarding).
 *
 * Only creates states for anchorable traits that have a base score.
 * Non-anchorable traits will get default states when first accessed.
 *
 * @param baseScores - Map of trait ID to base score (1-100)
 * @param occurredAt - Timestamp for initialization
 * @returns Map of trait states for anchorable traits
 */
export function initFromBaseScores(
  baseScores: Record<string, number>,
  occurredAt: string = new Date().toISOString()
): TraitStateMap {
  const states: TraitStateMap = {};

  for (const [traitId, baseScore] of Object.entries(baseScores)) {
    // Only create states for registered, anchorable traits
    const traitDef = TRAIT_BY_ID[traitId];
    if (traitDef && traitDef.anchorable) {
      states[traitId] = createTraitState(traitId, baseScore, occurredAt);
    }
  }

  return states;
}

/**
 * Get a trait state, creating a default if not present.
 *
 * @param states - Current trait state map
 * @param traitId - Trait ID to get
 * @param occurredAt - Timestamp for default creation
 * @returns The trait state (existing or newly created default)
 */
export function getOrCreateTraitState(
  states: TraitStateMap,
  traitId: string,
  occurredAt: string = new Date().toISOString()
): TraitState {
  if (states[traitId]) {
    return states[traitId];
  }
  return createDefaultTraitState(traitId, occurredAt);
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply evidence to multiple traits at once.
 *
 * @param states - Current trait state map
 * @param evidenceByTrait - Map of trait ID to evidence value [-1, +1]
 * @param tierGain - The tier's Z gain value
 * @param confidence - Confidence factor (0-1)
 * @param config - Engine configuration
 * @param occurredAt - Timestamp for updates
 * @returns Updated trait state map (immutable)
 */
export function applyBulkEvidence(
  states: TraitStateMap,
  evidenceByTrait: Record<string, number>,
  tierGain: number,
  confidence: number,
  config: TraitEngineConfig = DEFAULT_CONFIG,
  occurredAt: string = new Date().toISOString()
): TraitStateMap {
  const result = { ...states };

  for (const [traitId, evidence] of Object.entries(evidenceByTrait)) {
    // Clamp evidence to [-1, +1]
    const clampedEvidence = clamp(evidence, -1, 1);

    // Calculate raw delta Z
    const deltaZ0 = tierGain * clampedEvidence * confidence;

    // Get or create the trait state
    const current = getOrCreateTraitState(result, traitId, occurredAt);

    // Apply evidence
    result[traitId] = applyEvidence(current, deltaZ0, config, occurredAt);
  }

  return result;
}

/**
 * Convert trait states to UI scores for snapshot.
 *
 * @param states - Internal trait state map
 * @param config - Engine configuration
 * @returns Map of trait ID to UI score (1-100)
 */
export function renderTraitScores(
  states: TraitStateMap,
  config: TraitEngineConfig = DEFAULT_CONFIG
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [traitId, state] of Object.entries(states)) {
    result[traitId] = uiScore(state, config);
  }

  return result;
}

/**
 * Get all trait scores, including defaults for missing traits.
 *
 * @param states - Internal trait state map
 * @param traitIds - List of trait IDs to include
 * @param config - Engine configuration
 * @returns Map of trait ID to UI score (1-100)
 */
export function renderAllTraitScores(
  states: TraitStateMap,
  traitIds: string[],
  config: TraitEngineConfig = DEFAULT_CONFIG
): Record<string, number> {
  const result: Record<string, number> = {};
  const now = new Date().toISOString();

  for (const traitId of traitIds) {
    const state = getOrCreateTraitState(states, traitId, now);
    result[traitId] = uiScore(state, config);
  }

  return result;
}
