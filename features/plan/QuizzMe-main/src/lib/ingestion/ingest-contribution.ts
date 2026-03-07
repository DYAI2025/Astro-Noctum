/**
 * Ingestion Entry Point
 *
 * Takes a ContributionEvent → validates → updates ProfileState → renders ProfileSnapshot.
 *
 * This is the SINGLE entry point for all contribution processing.
 * All state mutations happen here, never in UI code.
 */

import { ContributionEvent, ProfileSnapshot, Marker } from "@/lib/lme/types";
import { PsycheDimensionId } from "@/lib/lme/psyche-dimensions";
import { updatePsycheState } from "@/lib/lme/lme-core";
import { computeArchetypeMix } from "@/lib/lme/archetype-mix";
import { mapPsycheToAvatar } from "@/lib/lme/avatar-mapper";
import {
  assertValidContributionEvent,
  FullValidationResult,
  validateContributionEvent,
} from "@/lib/contribution";
import {
  ProfileState,
  createDefaultProfileState,
  mergeTags,
  mergeUnlocks,
  mergeFields,
  mergeAstro,
  calculateCompletion,
  AstroAnchor,
} from "@/lib/profile";
import { buildProfileSnapshot } from "@/lib/profile";
import { applyTraitUpdates } from "./trait-updater";
import { MARKER_BY_ID } from "@/lib/registry/markers";
import { computeBaseScores, ANCHORABLE_TRAIT_IDS, AstroInput } from "@/lib/astro";
import { createTraitState } from "@/lib/traits";

// ═══════════════════════════════════════════════════════════════════════════
// MARKER → PSYCHE DIMENSION MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps registry marker categories to psyche dimensions.
 * This bridges our new registry markers to the legacy LME psyche system.
 */
const CATEGORY_TO_PSYCHE: Record<string, PsycheDimensionId> = {
  // Social markers → connection
  social: "connection",
  love: "connection",

  // Cognition/Structure markers → structure
  cognition: "structure",

  // Lifestyle/Emergence markers → emergence
  lifestyle: "emergence",
  skills: "emergence",

  // EQ/Values → mixed (handled specially)
  eq: "connection", // EQ relates to social-emotional
  values: "depth", // Values relate to depth/meaning

  // Aura → shadow (mysterious, complex aspects)
  aura: "shadow",

  // Astro → emergence (openness to cosmic influence)
  astro: "emergence",
};

/**
 * Special marker keywords that map to specific dimensions
 */
const KEYWORD_TO_PSYCHE: Record<string, PsycheDimensionId> = {
  shadow: "shadow",
  dark: "shadow",
  hidden: "shadow",
  complex: "shadow",

  social: "connection",
  empathy: "connection",
  love: "connection",
  bonding: "connection",

  system: "structure",
  logic: "structure",
  order: "structure",
  planning: "structure",

  open: "emergence",
  creative: "emergence",
  spontan: "emergence",
  adventure: "emergence",
  chaos: "emergence",

  reflect: "depth",
  spirit: "depth",
  philosoph: "depth",
  meaning: "depth",
  introspect: "depth",
};

/**
 * Map a marker to a psyche dimension.
 * Uses category first, then keyword fallback.
 */
function mapMarkerToPsycheDimension(marker: Marker): PsycheDimensionId | null {
  const markerDef = MARKER_BY_ID[marker.id];

  // First: try category mapping
  if (markerDef) {
    const dim = CATEGORY_TO_PSYCHE[markerDef.category];
    if (dim) return dim;
  }

  // Second: keyword matching in marker ID
  for (const [keyword, dim] of Object.entries(KEYWORD_TO_PSYCHE)) {
    if (marker.id.toLowerCase().includes(keyword)) {
      return dim;
    }
  }

  return null;
}

/**
 * Aggregate markers into psyche dimension scores.
 * Returns scores in range [0, 1] for each dimension.
 */
function aggregateMarkersToPsyche(
  markers: Marker[]
): Record<PsycheDimensionId, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const marker of markers) {
    const dim = mapMarkerToPsycheDimension(marker);
    if (!dim) continue;

    const markerDef = MARKER_BY_ID[marker.id];

    // Compute signed weight: weight * sign
    // Weight is always positive, sign gives direction
    const sign = markerDef?.sign ?? 1;
    const signedWeight = marker.weight * sign;

    // Convert from [-1, 1] to [0, 1] for psyche state
    const normalizedValue = (signedWeight + 1) / 2;

    sums[dim] = (sums[dim] || 0) + normalizedValue;
    counts[dim] = (counts[dim] || 0) + 1;
  }

  // Average per dimension
  const result: Record<string, number> = {};
  for (const [dim, sum] of Object.entries(sums)) {
    result[dim] = sum / counts[dim];
  }

  return result as Record<PsycheDimensionId, number>;
}

// ═══════════════════════════════════════════════════════════════════════════
// RELIABILITY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine reliability weight from module ID.
 * Higher reliability = faster psyche state changes.
 */
function getReliabilityForModule(moduleId: string): number {
  // Personality/EQ quizzes have high reliability
  if (
    moduleId.includes("personality") ||
    moduleId.includes("eq") ||
    moduleId.includes("values")
  ) {
    return 0.7;
  }

  // Most quizzes have medium reliability
  if (moduleId.startsWith("quiz.")) {
    return 0.5;
  }

  // Astro has low reliability (flavor)
  if (moduleId.includes("astro") || moduleId.includes("horoscope")) {
    return 0.2;
  }

  // Default
  return 0.5;
}

// ═══════════════════════════════════════════════════════════════════════════
// ASTRO ONBOARDING SPECIAL-CASE
// ═══════════════════════════════════════════════════════════════════════════

/** Module ID for astro onboarding (runOnce enforcement) */
const ASTRO_ONBOARDING_MODULE = "onboarding.astro.v1";

/** Current anchor map version */
const ASTRO_ANCHOR_VERSION = "astro-anchor-map.v1";

/**
 * Initialize trait baseScores from astro anchor map.
 * Sets shiftZ=0, shiftStrength=0 for all anchorable traits.
 */
function initializeAstroBaseScores(
  traitStates: Record<string, import("@/lib/traits").TraitState>,
  astroInput: AstroInput,
  occurredAt: string
): Record<string, import("@/lib/traits").TraitState> {
  // Compute base scores from anchor map
  const baseScores = computeBaseScores(astroInput);

  // Initialize/overwrite trait states for all anchorable traits
  const nextStates = { ...traitStates };

  for (const traitId of ANCHORABLE_TRAIT_IDS) {
    const baseScore = baseScores[traitId] ?? 50;
    nextStates[traitId] = createTraitState(traitId, baseScore, occurredAt);
  }

  return nextStates;
}

/**
 * Create astro anchor metadata for runOnce enforcement.
 */
function createAstroAnchor(
  event: ContributionEvent,
  occurredAt: string
): AstroAnchor {
  const astro = event.payload.astro;

  return {
    anchorVersion: ASTRO_ANCHOR_VERSION,
    createdAt: occurredAt,
    western: {
      sunSign: astro?.western?.sunSign ?? "unknown",
    },
    chinese: {
      animal: astro?.chinese?.animal ?? "unknown",
      element: astro?.chinese?.element ?? "unknown",
      yinYang: astro?.chinese?.yinYang ?? "unknown",
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INGESTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export type IngestResult = {
  accepted: boolean;
  state: ProfileState;
  snapshot: ProfileSnapshot;
  validation?: FullValidationResult;
};

/**
 * Ingest a ContributionEvent and update profile state.
 *
 * Steps:
 * 1. Validate event shape and IDs (throws on invalid)
 * 2. Update psyche state from markers (LME)
 * 3. Update traits (two-layer system)
 * 4. Merge cosmetics (tags, unlocks, fields, astro)
 * 5. Build snapshot for UI
 *
 * @param state Current profile state (or null for new profile)
 * @param event The contribution event to process
 * @param options Processing options
 * @returns Updated state and snapshot
 */
export function ingestContribution(
  state: ProfileState | null,
  event: ContributionEvent,
  options: { skipValidation?: boolean } = {}
): IngestResult {
  // Initialize state if needed
  let currentState = state ?? createDefaultProfileState();

  // 1. Validation (unless skipped for trusted events)
  let validation: FullValidationResult | undefined;
  if (!options.skipValidation) {
    validation = validateContributionEvent(event);
    if (!validation.valid) {
      // Return current state unchanged
      return {
        accepted: false,
        state: currentState,
        snapshot: buildProfileSnapshot(currentState),
        validation,
      };
    }
  }

  const { payload, source, occurredAt } = event;

  // 1.5. Astro onboarding special-case (runOnce + baseScore init)
  const isAstroOnboarding = source.moduleId === ASTRO_ONBOARDING_MODULE;

  if (isAstroOnboarding) {
    // Enforce runOnce: reject if anchor already exists
    if (currentState.anchors.astro) {
      return {
        accepted: false,
        state: currentState,
        snapshot: buildProfileSnapshot(currentState),
        validation: {
          valid: false,
          shapeErrors: [],
          idErrors: [],
          moduleErrors: [
            {
              moduleId: source.moduleId,
              rule: "runOnce",
              message: "Astro onboarding already completed (runOnce)",
            },
          ],
        },
      };
    }

    // Ensure astro payload exists for baseScore computation
    if (!payload.astro?.western?.sunSign) {
      return {
        accepted: false,
        state: currentState,
        snapshot: buildProfileSnapshot(currentState),
        validation: {
          valid: false,
          shapeErrors: [
            {
              field: "payload.astro.western.sunSign",
              message: "Missing sunSign for astro onboarding",
            },
          ],
          idErrors: [],
          moduleErrors: [],
        },
      };
    }

    // Build AstroInput for baseScore computation
    const astroInput: AstroInput = {
      sunSign: payload.astro.western.sunSign as import("@/lib/astro").ZodiacSign,
      chineseAnimal: payload.astro.chinese?.animal as import("@/lib/astro").ChineseAnimal | undefined,
    };

    // Initialize trait baseScores from anchor map
    currentState = {
      ...currentState,
      traitStates: initializeAstroBaseScores(currentState.traitStates, astroInput, occurredAt),
      anchors: {
        ...currentState.anchors,
        astro: createAstroAnchor(event, occurredAt),
      },
    };
  }

  // 2. Update psyche state from markers
  const psycheScores = aggregateMarkersToPsyche(payload.markers);
  const reliability = getReliabilityForModule(source.moduleId);
  const nextPsycheState = updatePsycheState(
    currentState.psycheState,
    psycheScores,
    reliability
  );

  // 3. Compute derived psyche data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextArchetypeMix = computeArchetypeMix(nextPsycheState) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextAvatarParams = mapPsycheToAvatar(nextPsycheState) as Record<string, any>;

  // 4. Update traits (two-layer system)
  const traitUpdate = applyTraitUpdates(
    { traitStates: currentState.traitStates },
    event
  );

  // 5. Merge cosmetics and content
  const nextTags = payload.tags
    ? mergeTags(currentState.tags, payload.tags)
    : currentState.tags;

  const nextUnlocks = payload.unlocks
    ? mergeUnlocks(currentState.unlocks, payload.unlocks)
    : currentState.unlocks;

  const nextFields = payload.fields
    ? mergeFields(currentState.fields, payload.fields)
    : currentState.fields;

  const nextAstro = mergeAstro(currentState.astro, payload.astro);

  // 6. Build updated state
  const nextState: ProfileState = {
    ...currentState,
    psycheState: nextPsycheState,
    traitStates: traitUpdate.traitStates,
    archetypeMix: nextArchetypeMix,
    avatarParams: nextAvatarParams,
    tags: nextTags,
    unlocks: nextUnlocks,
    fields: nextFields,
    astro: nextAstro,
    meta: {
      ...currentState.meta,
      lastUpdatedAt: occurredAt,
      eventCount: currentState.meta.eventCount + 1,
    },
  };

  // Update completion stats
  nextState.meta.completion = calculateCompletion(nextState);

  // 7. Build snapshot
  const snapshot = buildProfileSnapshot(nextState);

  return {
    accepted: true,
    state: nextState,
    snapshot,
    validation,
  };
}

/**
 * Validate-only mode for checking events before processing.
 */
export function validateEvent(event: unknown): FullValidationResult {
  return validateContributionEvent(event);
}

/**
 * Strict ingestion that throws on validation errors.
 * Use when you want to fail-fast on invalid events.
 */
export function ingestContributionStrict(
  state: ProfileState | null,
  event: unknown
): IngestResult {
  const validEvent = assertValidContributionEvent(event);
  return ingestContribution(state, validEvent, { skipValidation: true });
}
