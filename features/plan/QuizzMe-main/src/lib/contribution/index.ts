/**
 * Contribution Module
 *
 * Validates and processes ContributionEvents.
 * Types are re-exported from lme/types for convenience.
 */

export * from "./validators";

// Re-export core types from lme/types
export type {
  ContributionEvent,
  Marker,
  TraitScore,
  Tag,
  Unlock,
  Field,
  AstroPayload,
  SpecVersion,
} from "@/lib/lme/types";
