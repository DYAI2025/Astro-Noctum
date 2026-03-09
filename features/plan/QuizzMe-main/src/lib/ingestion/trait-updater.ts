/**
 * Trait Updater
 *
 * Handles trait updates from ContributionEvents using the two-layer system.
 *
 * Two update modes:
 * 1. Explicit evidence: markers with trait mappings
 * 2. Observation nudge: legacy payload.traits treated as "observed scores"
 *
 * The observation mode converges shiftZ toward the desired state without
 * overriding baseScore anchors. This maintains anchor dominance.
 */

import { ContributionEvent, TraitScore } from "@/lib/lme/types";
import {
  TraitState,
  createTraitState,
  createDefaultTraitState,
  applyEvidence,
  logit,
  scoreToP,
  DEFAULT_CONFIG,
} from "@/lib/traits";
import { TIER_Z_GAIN, Tier } from "@/lib/traits";
import { MARKER_BY_ID } from "@/lib/registry/markers";
import { TRAIT_BY_ID, TraitDefinition } from "@/lib/registry/traits";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Learn rate for observation nudging.
 * Controls how quickly shiftZ moves toward observed values.
 * Lower = more gradual convergence (respects anchor more).
 */
const OBSERVATION_LEARN_RATE = 0.3;

/**
 * Marker-to-trait mapping for explicit evidence.
 * Maps marker IDs to trait IDs they affect.
 */
const MARKER_TO_TRAIT: Record<string, { traitId: string; direction: 1 | -1 }[]> = {
  // EQ markers → EQ traits
  "marker.eq.self_awareness": [
    { traitId: "trait.eq.self_awareness", direction: 1 },
  ],
  "marker.eq.self_regulation": [
    { traitId: "trait.eq.self_regulation", direction: 1 },
  ],
  "marker.eq.impulsivity": [
    { traitId: "trait.eq.self_regulation", direction: -1 },
  ],
  "marker.eq.empathy": [{ traitId: "trait.eq.empathy", direction: 1 }],
  "marker.eq.detachment": [{ traitId: "trait.eq.empathy", direction: -1 }],
  "marker.eq.motivation": [{ traitId: "trait.eq.motivation", direction: 1 }],
  "marker.eq.social_skill": [{ traitId: "trait.eq.social_skill", direction: 1 }],
  "marker.eq.stress_tolerance": [
    { traitId: "trait.eq.stress_tolerance", direction: 1 },
  ],
  "marker.eq.stress_sensitivity": [
    { traitId: "trait.eq.stress_tolerance", direction: -1 },
  ],

  // Social markers → Social traits
  "marker.social.extroversion": [
    { traitId: "trait.social.extroversion", direction: 1 },
  ],
  "marker.social.introversion": [
    { traitId: "trait.social.introversion", direction: 1 },
  ],
  "marker.social.dominance": [
    { traitId: "trait.social.dominance", direction: 1 },
  ],
  "marker.social.submission": [
    { traitId: "trait.social.dominance", direction: -1 },
  ],
  "marker.social.openness": [
    { traitId: "trait.social.openness", direction: 1 },
  ],
  "marker.social.reserve": [
    { traitId: "trait.social.openness", direction: -1 },
  ],

  // Values markers → Values traits
  "marker.values.security": [
    { traitId: "trait.values.security", direction: 1 },
  ],
  "marker.values.risk_taking": [
    { traitId: "trait.values.security", direction: -1 },
  ],
  "marker.values.autonomy": [
    { traitId: "trait.values.autonomy", direction: 1 },
  ],
  "marker.values.conformity": [
    { traitId: "trait.values.autonomy", direction: -1 },
  ],
  "marker.values.achievement": [
    { traitId: "trait.values.achievement", direction: 1 },
  ],
  "marker.values.connection": [
    { traitId: "trait.values.connection", direction: 1 },
  ],
  "marker.values.growth": [{ traitId: "trait.values.growth", direction: 1 }],

  // Love markers → Love traits
  "marker.love.attachment_secure": [
    { traitId: "trait.love.independence", direction: 1 },
  ],
  "marker.love.attachment_anxious": [
    { traitId: "trait.love.independence", direction: -1 },
  ],
  "marker.love.independence": [
    { traitId: "trait.love.independence", direction: 1 },
  ],
  "marker.love.merger": [{ traitId: "trait.love.independence", direction: -1 }],

  // Cognition markers
  "marker.cognition.system_thinking": [
    { traitId: "trait.cognition.system_vs_story", direction: 1 },
  ],
  "marker.cognition.narrative_thinking": [
    { traitId: "trait.cognition.system_vs_story", direction: -1 },
  ],
  "marker.cognition.abstract": [
    { traitId: "trait.cognition.abstract_concrete", direction: 1 },
  ],
  "marker.cognition.concrete": [
    { traitId: "trait.cognition.abstract_concrete", direction: -1 },
  ],

  // Lifestyle markers
  "marker.lifestyle.spontaneity": [
    { traitId: "trait.lifestyle.spontaneity", direction: 1 },
  ],
  "marker.lifestyle.planning": [
    { traitId: "trait.lifestyle.spontaneity", direction: -1 },
  ],
  "marker.lifestyle.adventure": [
    { traitId: "trait.lifestyle.adventure", direction: 1 },
  ],
  "marker.lifestyle.comfort": [
    { traitId: "trait.lifestyle.adventure", direction: -1 },
  ],

  // Skills markers
  "marker.skills.intellect": [
    { traitId: "trait.skills.intellect", direction: 1 },
  ],
  "marker.skills.creativity": [
    { traitId: "trait.skills.creativity", direction: 1 },
  ],
  "marker.skills.curiosity": [
    { traitId: "trait.skills.curiosity", direction: 1 },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MODULE ID → TIER MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine tier from module ID.
 * Default: GROWTH tier for quizzes, FLAVOR for astro.
 */
function getTierForModule(moduleId: string): Tier {
  // Personality/EQ quizzes are CORE
  if (
    moduleId.includes("personality") ||
    moduleId.includes("eq") ||
    moduleId.includes("values")
  ) {
    return "CORE";
  }

  // Most quizzes are GROWTH
  if (moduleId.startsWith("quiz.")) {
    return "GROWTH";
  }

  // Astro is FLAVOR
  if (moduleId.includes("astro") || moduleId.includes("horoscope")) {
    return "FLAVOR";
  }

  // Default to GROWTH
  return "GROWTH";
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPLICIT EVIDENCE (from markers)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply explicit trait evidence from markers.
 * Uses marker weights and sign to compute deltaZ.
 */
export function applyMarkerEvidence(
  traitStates: Record<string, TraitState>,
  event: ContributionEvent
): Record<string, TraitState> {
  const { payload, source } = event;
  const tier = getTierForModule(source.moduleId);
  const tierGain = TIER_Z_GAIN[tier];
  const occurredAt = event.occurredAt;

  const newStates = { ...traitStates };

  for (const marker of payload.markers) {
    const markerDef = MARKER_BY_ID[marker.id];
    if (!markerDef) continue; // Unknown marker, skip

    const traitMappings = MARKER_TO_TRAIT[marker.id];
    if (!traitMappings) continue; // No trait mapping for this marker

    for (const mapping of traitMappings) {
      const { traitId, direction } = mapping;

      // Get or create trait state
      let state = newStates[traitId];
      if (!state) {
        // Check if trait exists in registry
        const traitDef = TRAIT_BY_ID[traitId] as TraitDefinition | undefined;
        if (traitDef?.anchorable) {
          // Anchorable traits start at 50 (neutral) until astro seeds them
          state = createTraitState(traitId, 50);
        } else {
          state = createDefaultTraitState(traitId);
        }
      }

      // Compute deltaZ:
      // weight (positive magnitude) * sign (marker direction) * direction (mapping) * tierGain
      const confidence = marker.evidence?.confidence ?? 1.0;
      const signedWeight = marker.weight * markerDef.sign * direction;
      const deltaZ = signedWeight * tierGain * confidence;

      // Apply evidence
      newStates[traitId] = applyEvidence(state, deltaZ, DEFAULT_CONFIG, occurredAt);
    }
  }

  return newStates;
}

// ═══════════════════════════════════════════════════════════════════════════
// OBSERVATION NUDGE (legacy payload.traits)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply observed trait scores as nudges toward desired state.
 *
 * Strategy:
 * 1. Convert observed score to logit space (obsZ)
 * 2. Compute desired shift: desiredShift = obsZ - baseZ
 * 3. Nudge current shift toward desired: delta = (desiredShift - currentShift) * learnRate
 * 4. Apply with anchor dominance caps
 *
 * This converges, saturates, and respects anchor dominance.
 */
export function applyObservationNudge(
  traitStates: Record<string, TraitState>,
  observations: TraitScore[],
  occurredAt: string
): Record<string, TraitState> {
  const newStates = { ...traitStates };

  for (const obs of observations) {
    const traitId = obs.id;
    const observedScore = obs.score;

    // Get or create trait state
    let state = newStates[traitId];
    if (!state) {
      state = createDefaultTraitState(traitId);
    }

    // Convert scores to logit space
    const baseZ = logit(scoreToP(state.baseScore, DEFAULT_CONFIG.EPS));
    const obsZ = logit(scoreToP(observedScore, DEFAULT_CONFIG.EPS));

    // Desired shift to reach observed score
    const desiredShift = obsZ - baseZ;

    // Nudge current shift toward desired
    const delta = (desiredShift - state.shiftZ) * OBSERVATION_LEARN_RATE;

    // Apply confidence weighting
    const confidence = obs.confidence ?? 0.7;
    const weightedDelta = delta * confidence;

    // Apply evidence (uses anchor dominance caps)
    newStates[traitId] = applyEvidence(
      state,
      weightedDelta,
      DEFAULT_CONFIG,
      occurredAt
    );
  }

  return newStates;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED UPDATE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply all trait updates from a ContributionEvent.
 *
 * Order:
 * 1. Explicit evidence from markers (if mappings exist)
 * 2. Observation nudge from legacy payload.traits
 */
export function applyTraitUpdates(
  state: { traitStates: Record<string, TraitState> },
  event: ContributionEvent
): { traitStates: Record<string, TraitState> } {
  const occurredAt = event.occurredAt;
  let traitStates = state.traitStates;

  // 1. Explicit evidence from markers
  traitStates = applyMarkerEvidence(traitStates, event);

  // 2. Observation nudge from legacy payload.traits
  if (event.payload.traits && event.payload.traits.length > 0) {
    traitStates = applyObservationNudge(
      traitStates,
      event.payload.traits,
      occurredAt
    );
  }

  return { traitStates };
}
