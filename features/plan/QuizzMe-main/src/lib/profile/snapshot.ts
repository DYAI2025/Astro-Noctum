/**
 * Snapshot Builder
 *
 * Converts ProfileState (internal) → ProfileSnapshot (UI).
 *
 * Key transformation: TraitState objects are rendered to uiScore(1-100).
 * UI code should NEVER call uiScore() directly - always use the snapshot.
 */

import { ProfileSnapshot, TraitScore } from "@/lib/lme/types";
import { ProfileState, calculateCompletion } from "./profile-state";
import { uiScore, TraitState } from "@/lib/traits";

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert internal ProfileState to UI-ready ProfileSnapshot.
 *
 * This is the ONLY place where uiScore() should be called.
 * UI components receive pre-computed integer scores.
 */
export function buildProfileSnapshot(state: ProfileState): ProfileSnapshot {
  // Render trait scores from two-layer states
  const traits = renderTraitScoresForSnapshot(state.traitStates);

  // Calculate completion stats
  const completion = calculateCompletion(state);

  return {
    psyche: {
      state: state.psycheState,
      archetypeMix: state.archetypeMix,
      visualAxes: buildVisualAxes(state),
      avatarParams: state.avatarParams,
    },
    identity: state.identity,
    astro: state.astro,
    traits,
    tags: state.tags,
    unlocks: state.unlocks,
    fields: state.fields,
    meta: {
      completion,
      lastUpdatedAt: state.meta.lastUpdatedAt,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAIT RENDERING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert TraitState map to TraitScore map for UI.
 * Computes uiScore() once and never again.
 */
function renderTraitScoresForSnapshot(
  traitStates: Record<string, TraitState>
): Record<string, TraitScore> {
  const result: Record<string, TraitScore> = {};

  for (const [traitId, state] of Object.entries(traitStates)) {
    const score = uiScore(state);
    const band = scoreToBand(score);

    result[traitId] = {
      id: traitId,
      score,
      band,
      // Confidence based on how much evidence we've accumulated
      confidence: calculateTraitConfidence(state),
    };
  }

  return result;
}

/**
 * Convert numeric score to descriptive band
 */
function scoreToBand(score: number): "low" | "midlow" | "mid" | "midhigh" | "high" {
  if (score <= 20) return "low";
  if (score <= 40) return "midlow";
  if (score <= 60) return "mid";
  if (score <= 80) return "midhigh";
  return "high";
}

/**
 * Calculate confidence based on accumulated evidence (shiftStrength)
 * More evidence = higher confidence, saturating at 1.0
 */
function calculateTraitConfidence(state: TraitState): number {
  // shiftStrength accumulates abs(deltaZ) over time
  // Use sigmoid-like saturation: high strength → confidence approaches 1
  const strength = state.shiftStrength;

  // Threshold where we consider the trait "confident"
  const CONFIDENCE_THRESHOLD = 3.0;

  // Saturating curve: 0 → 0.5, THRESHOLD → ~0.88, 2*THRESHOLD → ~0.96
  const confidence = 1 - Math.exp(-strength / CONFIDENCE_THRESHOLD);

  return Math.round(confidence * 100) / 100; // Round to 2 decimals
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL AXES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build visual axes for UI rendering (future: radar chart, etc.)
 * These are normalized 0-1 values derived from psyche dimensions.
 */
function buildVisualAxes(state: ProfileState): Record<string, number> {
  const { psycheState } = state;

  // Map psyche dimensions to visual axes
  return {
    shadow: psycheState.shadow?.value ?? 0.5,
    connection: psycheState.connection?.value ?? 0.5,
    structure: psycheState.structure?.value ?? 0.5,
    emergence: psycheState.emergence?.value ?? 0.5,
    depth: psycheState.depth?.value ?? 0.5,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT DIFF (for optimization)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if two snapshots are meaningfully different.
 * Useful for avoiding unnecessary UI re-renders.
 */
export function hasSnapshotChanged(
  prev: ProfileSnapshot,
  next: ProfileSnapshot
): boolean {
  // Quick check: last updated timestamp
  if (prev.meta.lastUpdatedAt !== next.meta.lastUpdatedAt) {
    return true;
  }

  // Check trait count
  const prevTraitCount = Object.keys(prev.traits).length;
  const nextTraitCount = Object.keys(next.traits).length;
  if (prevTraitCount !== nextTraitCount) {
    return true;
  }

  // Check tag count
  if (prev.tags.length !== next.tags.length) {
    return true;
  }

  // Check completion percent
  if (prev.meta.completion.percent !== next.meta.completion.percent) {
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTIAL SNAPSHOT (for targeted UI updates)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a partial snapshot containing only specific trait categories.
 * Useful for optimized rendering of character sheet blocks.
 */
export function buildPartialSnapshot(
  state: ProfileState,
  categories: string[]
): Partial<ProfileSnapshot> {
  const filteredTraitStates: Record<string, TraitState> = {};

  for (const [id, traitState] of Object.entries(state.traitStates)) {
    if (categories.some((cat) => id.includes(cat))) {
      filteredTraitStates[id] = traitState;
    }
  }

  const traits = renderTraitScoresForSnapshot(filteredTraitStates);
  const filteredTags = state.tags.filter((t) =>
    categories.some((cat) => t.id.includes(cat))
  );

  return {
    traits,
    tags: filteredTags,
    meta: {
      completion: calculateCompletion(state),
      lastUpdatedAt: state.meta.lastUpdatedAt,
    },
  };
}
