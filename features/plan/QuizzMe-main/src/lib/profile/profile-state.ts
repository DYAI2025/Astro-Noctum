/**
 * Profile State (Internal)
 *
 * This is the internal, mutable state used by the ingestion pipeline.
 * It differs from ProfileSnapshot (UI) in that traits are stored as
 * TraitState objects (baseScore + shiftZ) rather than rendered scores.
 *
 * The snapshot builder converts ProfileState → ProfileSnapshot for UI consumption.
 */

import { PsycheState, DEFAULT_PSYCHE_STATE } from "@/lib/lme/psyche-state";
import { TraitState } from "@/lib/traits";
import { Tag, Unlock, Field, AstroPayload, ArchetypeMixItem } from "@/lib/lme/types";

// ═══════════════════════════════════════════════════════════════════════════
// ANCHOR TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Astro anchor metadata (runOnce enforcement)
 */
export type AstroAnchor = {
  /** Version of the anchor map used */
  anchorVersion: string;
  /** When the anchor was created */
  createdAt: string;
  /** Western astro data stored at anchor time */
  western: {
    sunSign: string;
  };
  /** Chinese astro data stored at anchor time */
  chinese: {
    animal: string;
    element: string;
    yinYang: string;
  };
};

/**
 * Anchors for runOnce modules (astro onboarding, etc.)
 */
export type ProfileAnchors = {
  astro?: AstroAnchor;
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE STATE (INTERNAL)
// ═══════════════════════════════════════════════════════════════════════════

export type ProfileState = {
  /**
   * LME psyche dimensions (shadow, connection, structure, emergence, depth)
   */
  psycheState: PsycheState;

  /**
   * Two-layer trait states (baseScore + shiftZ)
   * Key: trait ID (e.g., "trait.values.security")
   */
  traitStates: Record<string, TraitState>;

  /**
   * Computed archetype mix from psyche state
   */
  archetypeMix: ArchetypeMixItem[];

  /**
   * Avatar visual parameters derived from psyche
   */
  avatarParams: Record<string, number | string>;

  /**
   * User identity info
   */
  identity: {
    displayName?: string;
    birth?: {
      date?: string;
      time?: string;
      place?: string;
    };
  };

  /**
   * Astro data (western, chinese, addons)
   */
  astro?: AstroPayload;

  /**
   * Tags (archetype, shadow, style, etc.)
   */
  tags: Tag[];

  /**
   * Unlocks (achievements, badges)
   */
  unlocks: Record<string, Unlock>;

  /**
   * Free-text content fields
   */
  fields: Record<string, Field>;

  /**
   * Anchors for runOnce modules (astro, etc.)
   */
  anchors: ProfileAnchors;

  /**
   * Metadata
   */
  meta: {
    createdAt: string;
    lastUpdatedAt: string;
    eventCount: number;
    completion: {
      percent: number;
      filledBlocks: string[];
      unlockCount: number;
    };
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT STATE
// ═══════════════════════════════════════════════════════════════════════════

export function createDefaultProfileState(): ProfileState {
  const now = new Date().toISOString();

  return {
    psycheState: { ...DEFAULT_PSYCHE_STATE },
    traitStates: {},
    archetypeMix: [],
    avatarParams: {},
    identity: {},
    astro: undefined,
    tags: [],
    unlocks: {},
    fields: {},
    anchors: {},
    meta: {
      createdAt: now,
      lastUpdatedAt: now,
      eventCount: 0,
      completion: {
        percent: 0,
        filledBlocks: [],
        unlockCount: 0,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MERGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merge tags (unique by ID, newer wins)
 */
export function mergeTags(current: Tag[], incoming: Tag[]): Tag[] {
  const map = new Map(current.map((t) => [t.id, t]));
  incoming.forEach((t) => map.set(t.id, t));
  return Array.from(map.values());
}

/**
 * Merge unlocks (higher level wins)
 */
export function mergeUnlocks(
  current: Record<string, Unlock>,
  incoming: Unlock[]
): Record<string, Unlock> {
  const next = { ...current };
  incoming.forEach((u) => {
    const existing = next[u.id];
    if (!existing || (u.level || 0) > (existing.level || 0)) {
      next[u.id] = u;
    }
  });
  return next;
}

/**
 * Merge fields (newer wins)
 */
export function mergeFields(
  current: Record<string, Field>,
  incoming: Field[]
): Record<string, Field> {
  const next = { ...current };
  incoming.forEach((f) => {
    next[f.id] = f;
  });
  return next;
}

/**
 * Merge astro payloads (deep merge, newer wins for each field)
 */
export function mergeAstro(
  current: AstroPayload | undefined,
  incoming: AstroPayload | undefined
): AstroPayload | undefined {
  if (!incoming) return current;
  if (!current) return incoming;

  return {
    western: incoming.western
      ? { ...current.western, ...incoming.western }
      : current.western,
    chinese: incoming.chinese
      ? { ...current.chinese, ...incoming.chinese }
      : current.chinese,
    addons: incoming.addons
      ? { ...current.addons, ...incoming.addons }
      : current.addons,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETION CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Character sheet blocks for completion tracking
 */
const CHARACTER_BLOCKS = [
  "values",
  "eq",
  "social",
  "love",
  "shadow",
  "lifestyle",
  "skills",
  "mind",
  "spirit",
  "astro",
] as const;

type CharacterBlock = (typeof CHARACTER_BLOCKS)[number];

/**
 * Calculate completion stats from state
 */
export function calculateCompletion(state: ProfileState): {
  percent: number;
  filledBlocks: string[];
  unlockCount: number;
} {
  const filledBlocks: string[] = [];

  // Check each block for content
  CHARACTER_BLOCKS.forEach((block) => {
    const hasTraits = Object.keys(state.traitStates).some((id) =>
      id.includes(block)
    );
    const hasTags = state.tags.some((t) => t.id.includes(block));
    const hasFields = Object.keys(state.fields).some((id) => id.includes(block));

    // Astro block is special
    if (block === "astro" && state.astro?.western?.sunSign) {
      filledBlocks.push(block);
    } else if (hasTraits || hasTags || hasFields) {
      filledBlocks.push(block);
    }
  });

  // Calculate percentage (each block is ~10%)
  const percent = Math.min(100, Math.round((filledBlocks.length / CHARACTER_BLOCKS.length) * 100));

  return {
    percent,
    filledBlocks,
    unlockCount: Object.keys(state.unlocks).length,
  };
}
