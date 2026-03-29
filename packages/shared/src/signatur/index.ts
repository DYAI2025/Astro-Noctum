/**
 * @bazodiac/shared — Signatur V3 exports
 *
 * Single Source of Truth for all Signatur V3 data contracts.
 * Consumed by Web (TypeScript) and iOS (Swift, via SWIFT_CONSTANTS.md).
 */

// Dimension definitions — MUST be the canonical source for hz, angles, colors
export {
  DIMENSION_DEFS,
  EXPECTED_HZ,
  EXPECTED_BASE_ANGLES,
} from './dimension-defs';
export type { DimensionDef } from './dimension-defs';

// Bridge functions — soulprint/quiz sectors → V3 engine input weights
export {
  soulprintToNatalWeights,
  soulprintToDimensionWeights,
  quizSectorsToQuizWeights,
  deriveWeightsFromApiData,
} from './signatur-bridge';

// V2 engine math — kept for mobile app compatibility
export * from './bazodiac-engine';
