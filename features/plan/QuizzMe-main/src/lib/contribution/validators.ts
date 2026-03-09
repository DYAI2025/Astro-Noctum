/**
 * Contribution Event Validators
 *
 * Two-layer validation:
 * 1. Shape validation: Required fields, correct types, valid specVersion
 * 2. ID validation: All IDs must exist in registry (delegated to registry module)
 *
 * Module rules are also enforced here for specific source.moduleId patterns.
 */

import { ContributionEvent } from "@/lib/lme/types";
import { validateContributionIds, ValidationError } from "@/lib/registry";

// ═══════════════════════════════════════════════════════════════════════════
// SHAPE VALIDATION ERRORS
// ═══════════════════════════════════════════════════════════════════════════

export type ShapeValidationError = {
  field: string;
  message: string;
  expected?: string;
  received?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// SHAPE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate the shape of a ContributionEvent.
 * Checks required fields, types, and specVersion.
 *
 * @returns Array of errors (empty if valid)
 */
export function validateContributionEventShape(
  event: unknown
): ShapeValidationError[] {
  const errors: ShapeValidationError[] = [];

  // Must be an object
  if (!event || typeof event !== "object") {
    errors.push({
      field: "event",
      message: "Event must be a non-null object",
      expected: "object",
      received: typeof event,
    });
    return errors; // Can't validate further
  }

  const e = event as Record<string, unknown>;

  // specVersion: required, must be "sp.contribution.v1"
  if (!e.specVersion) {
    errors.push({
      field: "specVersion",
      message: "specVersion is required",
      expected: "sp.contribution.v1",
    });
  } else if (e.specVersion !== "sp.contribution.v1") {
    errors.push({
      field: "specVersion",
      message: "Invalid specVersion",
      expected: "sp.contribution.v1",
      received: String(e.specVersion),
    });
  }

  // eventId: required, must be non-empty string
  if (!e.eventId || typeof e.eventId !== "string") {
    errors.push({
      field: "eventId",
      message: "eventId is required and must be a string",
      expected: "string (uuid)",
      received: typeof e.eventId,
    });
  }

  // occurredAt: required, must be ISO string
  if (!e.occurredAt || typeof e.occurredAt !== "string") {
    errors.push({
      field: "occurredAt",
      message: "occurredAt is required and must be an ISO timestamp",
      expected: "string (ISO 8601)",
      received: typeof e.occurredAt,
    });
  }

  // source: required object with vertical and moduleId
  if (!e.source || typeof e.source !== "object") {
    errors.push({
      field: "source",
      message: "source is required and must be an object",
      expected: "{ vertical, moduleId, ... }",
      received: typeof e.source,
    });
  } else {
    const source = e.source as Record<string, unknown>;

    if (!source.vertical || typeof source.vertical !== "string") {
      errors.push({
        field: "source.vertical",
        message: "source.vertical is required",
        expected: '"character" | "quiz" | "horoscope" | "future"',
      });
    }

    if (!source.moduleId || typeof source.moduleId !== "string") {
      errors.push({
        field: "source.moduleId",
        message: "source.moduleId is required",
        expected: "string (e.g., quiz.personality.v1)",
      });
    }
  }

  // payload: required object with markers array
  if (!e.payload || typeof e.payload !== "object") {
    errors.push({
      field: "payload",
      message: "payload is required and must be an object",
      expected: "{ markers: [...], ... }",
      received: typeof e.payload,
    });
  } else {
    const payload = e.payload as Record<string, unknown>;

    // markers: required, must be a non-empty array
    if (!Array.isArray(payload.markers)) {
      errors.push({
        field: "payload.markers",
        message: "payload.markers is required and must be an array",
        expected: "Marker[]",
        received: typeof payload.markers,
      });
    } else if (payload.markers.length === 0) {
      errors.push({
        field: "payload.markers",
        message: "payload.markers must contain at least one marker",
        expected: "Marker[] (non-empty)",
        received: "empty array",
      });
    } else {
      // Validate each marker has required fields
      payload.markers.forEach((marker, index) => {
        if (!marker || typeof marker !== "object") {
          errors.push({
            field: `payload.markers[${index}]`,
            message: "Each marker must be an object",
          });
          return;
        }

        const m = marker as Record<string, unknown>;

        if (!m.id || typeof m.id !== "string") {
          errors.push({
            field: `payload.markers[${index}].id`,
            message: "Marker id is required and must be a string",
          });
        }

        if (typeof m.weight !== "number" || isNaN(m.weight)) {
          errors.push({
            field: `payload.markers[${index}].weight`,
            message: "Marker weight is required and must be a number",
          });
        }
      });
    }

    // Optional arrays - validate structure if present
    if (payload.traits && !Array.isArray(payload.traits)) {
      errors.push({
        field: "payload.traits",
        message: "payload.traits must be an array if present",
      });
    }

    if (payload.tags && !Array.isArray(payload.tags)) {
      errors.push({
        field: "payload.tags",
        message: "payload.tags must be an array if present",
      });
    }

    if (payload.unlocks && !Array.isArray(payload.unlocks)) {
      errors.push({
        field: "payload.unlocks",
        message: "payload.unlocks must be an array if present",
      });
    }

    if (payload.fields && !Array.isArray(payload.fields)) {
      errors.push({
        field: "payload.fields",
        message: "payload.fields must be an array if present",
      });
    }
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE RULES
// ═══════════════════════════════════════════════════════════════════════════

export type ModuleRuleError = {
  moduleId: string;
  rule: string;
  message: string;
};

/**
 * Module-specific validation rules.
 * These enforce domain constraints for specific source modules.
 */
export function validateModuleRules(
  event: ContributionEvent
): ModuleRuleError[] {
  const errors: ModuleRuleError[] = [];
  const { moduleId } = event.source;
  const { payload } = event;

  // Rule: onboarding.astro.v1 must only emit astro markers and requires payload.astro
  if (moduleId === "onboarding.astro.v1") {
    // Must have astro payload
    if (!payload.astro) {
      errors.push({
        moduleId,
        rule: "astro_required",
        message:
          "onboarding.astro.v1 module requires payload.astro to be present",
      });
    }

    // Markers must be astro-related (marker.astro.* namespace)
    const nonAstroMarkers = payload.markers.filter(
      (m) => !m.id.startsWith("marker.astro.")
    );
    if (nonAstroMarkers.length > 0) {
      errors.push({
        moduleId,
        rule: "astro_markers_only",
        message: `onboarding.astro.v1 module should only emit marker.astro.* markers. Found: ${nonAstroMarkers.map((m) => m.id).join(", ")}`,
      });
    }
  }

  // Rule: quiz.* modules should emit at least one trait or marker
  if (moduleId.startsWith("quiz.")) {
    if (payload.markers.length === 0 && (!payload.traits || payload.traits.length === 0)) {
      errors.push({
        moduleId,
        rule: "quiz_data_required",
        message:
          "Quiz modules must emit at least one marker or trait",
      });
    }
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export type FullValidationResult = {
  valid: boolean;
  shapeErrors: ShapeValidationError[];
  idErrors: ValidationError[];
  moduleErrors: ModuleRuleError[];
};

/**
 * Perform full validation of a ContributionEvent.
 *
 * Validation order:
 * 1. Shape validation (required fields, types)
 * 2. ID validation (all IDs exist in registry)
 * 3. Module rules (domain-specific constraints)
 *
 * Shape validation must pass before ID/module validation runs.
 */
export function validateContributionEvent(
  event: unknown
): FullValidationResult {
  const shapeErrors = validateContributionEventShape(event);

  // If shape is invalid, can't proceed with ID/module validation
  if (shapeErrors.length > 0) {
    return {
      valid: false,
      shapeErrors,
      idErrors: [],
      moduleErrors: [],
    };
  }

  const validEvent = event as ContributionEvent;

  // ID validation using registry
  const idErrors = validateContributionIds(validEvent.payload);

  // Module-specific rules
  const moduleErrors = validateModuleRules(validEvent);

  return {
    valid: idErrors.length === 0 && moduleErrors.length === 0,
    shapeErrors: [],
    idErrors,
    moduleErrors,
  };
}

/**
 * Validate and throw if invalid.
 * Convenience function for ingestion entry point.
 */
export function assertValidContributionEvent(event: unknown): ContributionEvent {
  const result = validateContributionEvent(event);

  if (!result.valid) {
    const allErrors = [
      ...result.shapeErrors.map((e) => `Shape: ${e.field} - ${e.message}`),
      ...result.idErrors.map((e) => `ID: ${e.path} - ${e.message}`),
      ...result.moduleErrors.map((e) => `Module: ${e.moduleId} - ${e.message}`),
    ];

    throw new Error(
      `Invalid ContributionEvent:\n${allErrors.join("\n")}`
    );
  }

  return event as ContributionEvent;
}
