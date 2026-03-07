/**
 * Registry Index
 *
 * Central export point for all registry definitions and validation utilities.
 * Use these validators at runtime and in CI to ensure all IDs are valid.
 */

// Re-export all registries
export * from "./traits";
export * from "./markers";
export * from "./tags";
export * from "./unlocks";
export * from "./fields";

// Import for validation
import { TRAIT_BY_ID, TRAIT_IDS } from "./traits";
import { MARKER_BY_ID, MARKER_IDS } from "./markers";
import { TAG_BY_ID, TAG_IDS } from "./tags";
import {
  UNLOCK_BY_ID,
  UNLOCK_IDS,
  isValidUnlockId as checkUnlockId,
} from "./unlocks";
import { FIELD_BY_ID, FIELD_IDS } from "./fields";

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION ERRORS
// ═══════════════════════════════════════════════════════════════════════════

export type ValidationError = {
  path: string;
  id: string;
  message: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// INDIVIDUAL VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a trait ID exists in the registry
 */
export function isValidTraitId(id: string): boolean {
  return id in TRAIT_BY_ID;
}

/**
 * Check if a marker ID exists in the registry
 */
export function isValidMarkerId(id: string): boolean {
  return id in MARKER_BY_ID;
}

/**
 * Check if a tag ID exists in the registry
 */
export function isValidTagId(id: string): boolean {
  return id in TAG_BY_ID;
}

/**
 * Check if an unlock ID is valid (exact match or valid prefix pattern)
 */
export function isValidUnlockId(id: string): boolean {
  return checkUnlockId(id);
}

/**
 * Check if a field ID exists in the registry
 */
export function isValidFieldId(id: string): boolean {
  return id in FIELD_BY_ID;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTRIBUTION EVENT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Marker type for validation (matches ContributionEvent spec)
 */
type MarkerLike = {
  id: string;
  weight: number;
  evidence?: {
    itemsAnswered?: number;
    confidence?: number;
  };
};

/**
 * TraitScore type for validation
 */
type TraitScoreLike = {
  id: string;
  score: number;
  confidence?: number;
};

/**
 * Tag type for validation
 */
type TagLike = {
  id: string;
  label?: string;
  kind?: string;
};

/**
 * Unlock type for validation
 */
type UnlockLike = {
  id: string;
  unlocked?: boolean;
};

/**
 * Field type for validation
 */
type FieldLike = {
  id: string;
  kind?: string;
  value?: string | string[];
};

/**
 * Contribution payload type for validation
 */
type PayloadLike = {
  markers?: MarkerLike[];
  traits?: TraitScoreLike[];
  tags?: TagLike[];
  unlocks?: UnlockLike[];
  fields?: FieldLike[];
};

/**
 * Validate all IDs in a ContributionEvent payload.
 * Returns structured errors with paths for easy debugging.
 *
 * @param payload - The payload object from a ContributionEvent
 * @returns Array of validation errors (empty if all valid)
 *
 * @example
 * const errors = validateContributionIds(event.payload);
 * if (errors.length > 0) {
 *   console.error('Invalid IDs:', errors);
 *   throw new Error('Invalid contribution event');
 * }
 */
export function validateContributionIds(
  payload: PayloadLike
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate markers
  if (payload.markers) {
    payload.markers.forEach((marker, index) => {
      if (!isValidMarkerId(marker.id)) {
        errors.push({
          path: `payload.markers[${index}].id`,
          id: marker.id,
          message: `Unknown marker ID: "${marker.id}". Must be defined in registry/markers.ts`,
        });
      }
      // Validate weight is positive
      if (marker.weight < 0) {
        errors.push({
          path: `payload.markers[${index}].weight`,
          id: marker.id,
          message: `Marker weight must be positive (0-1), got ${marker.weight}. Use marker sign for direction.`,
        });
      }
      if (marker.weight > 1) {
        errors.push({
          path: `payload.markers[${index}].weight`,
          id: marker.id,
          message: `Marker weight must be ≤1, got ${marker.weight}`,
        });
      }
    });
  }

  // Validate traits
  if (payload.traits) {
    payload.traits.forEach((trait, index) => {
      if (!isValidTraitId(trait.id)) {
        errors.push({
          path: `payload.traits[${index}].id`,
          id: trait.id,
          message: `Unknown trait ID: "${trait.id}". Must be defined in registry/traits.ts`,
        });
      }
      // Validate score range
      if (trait.score < 1 || trait.score > 100) {
        errors.push({
          path: `payload.traits[${index}].score`,
          id: trait.id,
          message: `Trait score must be 1-100, got ${trait.score}`,
        });
      }
    });
  }

  // Validate tags
  if (payload.tags) {
    payload.tags.forEach((tag, index) => {
      if (!isValidTagId(tag.id)) {
        errors.push({
          path: `payload.tags[${index}].id`,
          id: tag.id,
          message: `Unknown tag ID: "${tag.id}". Must be defined in registry/tags.ts`,
        });
      }
    });
  }

  // Validate unlocks
  if (payload.unlocks) {
    payload.unlocks.forEach((unlock, index) => {
      if (!isValidUnlockId(unlock.id)) {
        errors.push({
          path: `payload.unlocks[${index}].id`,
          id: unlock.id,
          message: `Unknown unlock ID: "${unlock.id}". Must be defined in registry/unlocks.ts or match a valid prefix pattern.`,
        });
      }
    });
  }

  // Validate fields
  if (payload.fields) {
    payload.fields.forEach((field, index) => {
      if (!isValidFieldId(field.id)) {
        errors.push({
          path: `payload.fields[${index}].id`,
          id: field.id,
          message: `Unknown field ID: "${field.id}". Must be defined in registry/fields.ts`,
        });
      }
    });
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALL IDS (for registry-lint script)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * All registered IDs by namespace prefix
 */
export const ALL_IDS = {
  trait: TRAIT_IDS,
  marker: MARKER_IDS,
  tag: TAG_IDS,
  unlock: UNLOCK_IDS,
  field: FIELD_IDS,
} as const;

/**
 * ID prefixes and their validators
 */
export const ID_VALIDATORS: Record<string, (id: string) => boolean> = {
  "trait.": isValidTraitId,
  "marker.": isValidMarkerId,
  "tag.": isValidTagId,
  "unlock.": isValidUnlockId,
  "field.": isValidFieldId,
};

/**
 * Check if any ID (regardless of type) is valid
 */
export function isValidId(id: string): boolean {
  for (const [prefix, validator] of Object.entries(ID_VALIDATORS)) {
    if (id.startsWith(prefix)) {
      return validator(id);
    }
  }
  // Unknown prefix
  return false;
}

/**
 * Get the type of an ID based on its prefix
 */
export function getIdType(
  id: string
): "trait" | "marker" | "tag" | "unlock" | "field" | "unknown" {
  if (id.startsWith("trait.")) return "trait";
  if (id.startsWith("marker.")) return "marker";
  if (id.startsWith("tag.")) return "tag";
  if (id.startsWith("unlock.")) return "unlock";
  if (id.startsWith("field.")) return "field";
  return "unknown";
}
