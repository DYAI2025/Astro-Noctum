/**
 * Ingestion Module
 *
 * Single entry point for processing ContributionEvents.
 *
 * Usage:
 * ```typescript
 * import { ingestContribution } from '@/lib/ingestion';
 *
 * const result = ingestContribution(currentState, event);
 * if (result.accepted) {
 *   saveState(result.state);
 *   updateUI(result.snapshot);
 * }
 * ```
 */

export {
  ingestContribution,
  ingestContributionStrict,
  validateEvent,
  type IngestResult,
} from "./ingest-contribution";

export {
  applyMarkerEvidence,
  applyObservationNudge,
  applyTraitUpdates,
} from "./trait-updater";
