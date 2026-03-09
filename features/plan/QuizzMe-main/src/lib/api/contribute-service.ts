/**
 * Contribute Service
 *
 * Orchestrates the contribution pipeline:
 * 1. Validate event
 * 2. Load current state
 * 3. Ingest contribution
 * 4. Persist state + audit log
 * 5. Return snapshot
 *
 * This is a pure service layer - no Next.js dependencies.
 */

import type {
  ProfileStateStore,
  EventStore,
  UserId,
  EventRecord,
} from "@/lib/storage";
import { ContributionEvent, ProfileSnapshot } from "@/lib/lme/types";
import {
  validateContributionEvent,
  assertValidContributionEvent,
  FullValidationResult,
} from "@/lib/contribution";
import { ingestContribution } from "@/lib/ingestion";
import { createDefaultProfileState, buildProfileSnapshot } from "@/lib/profile";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ContributeRequest = {
  userId: UserId;
  event: unknown; // Will be validated as ContributionEvent
};

export type ContributeResult = {
  accepted: boolean;
  snapshot: ProfileSnapshot;
  validation?: FullValidationResult;
  error?: string;
};

export type GetSnapshotResult = {
  snapshot: ProfileSnapshot;
  isNew: boolean;
};

export type Stores = {
  profiles: ProfileStateStore;
  events?: EventStore;
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTRIBUTE (POST)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process a contribution event.
 *
 * Flow:
 * 1. Validate event shape and IDs
 * 2. Load existing profile state (or create new)
 * 3. Run ingestion pipeline
 * 4. Persist audit log (optional)
 * 5. Persist updated state
 * 6. Return snapshot
 */
export async function contribute(
  stores: Stores,
  req: ContributeRequest
): Promise<ContributeResult> {
  const { userId, event } = req;

  // 1. Validate event
  const validation = validateContributionEvent(event);

  if (!validation.valid) {
    // Return current snapshot even on validation failure
    const currentState =
      (await stores.profiles.load(userId)) ?? createDefaultProfileState();
    const snapshot = buildProfileSnapshot(currentState);

    return {
      accepted: false,
      snapshot,
      validation,
      error: formatValidationErrors(validation),
    };
  }

  const validEvent = event as ContributionEvent;

  // 2. Load existing state
  const existingState =
    (await stores.profiles.load(userId)) ?? createDefaultProfileState();

  // 3. Run ingestion
  const result = ingestContribution(existingState, validEvent, {
    skipValidation: true, // Already validated above
  });

  // 4. Audit log (optional, fire-and-forget)
  if (stores.events) {
    const record: EventRecord = {
      userId,
      event: validEvent,
      receivedAt: new Date().toISOString(),
      accepted: result.accepted,
    };
    // Don't await - audit is best-effort
    stores.events.append(record).catch((err) => {
      console.error("[contribute] Failed to append event record:", err);
    });
  }

  // 5. Persist state
  await stores.profiles.save(userId, result.state);

  // 6. Build fresh snapshot from persisted state
  const snapshot = buildProfileSnapshot(result.state);

  return {
    accepted: result.accepted,
    snapshot,
  };
}

/**
 * Strict version that throws on validation errors.
 */
export async function contributeStrict(
  stores: Stores,
  req: ContributeRequest
): Promise<ContributeResult> {
  const validEvent = assertValidContributionEvent(req.event);
  return contribute(stores, { ...req, event: validEvent });
}

// ═══════════════════════════════════════════════════════════════════════════
// GET SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the current profile snapshot for a user.
 * Creates a default profile if none exists.
 */
export async function getSnapshot(
  store: ProfileStateStore,
  userId: UserId
): Promise<GetSnapshotResult> {
  const state = await store.load(userId);

  if (!state) {
    // Return empty/default snapshot
    const defaultState = createDefaultProfileState();
    return {
      snapshot: buildProfileSnapshot(defaultState),
      isNew: true,
    };
  }

  return {
    snapshot: buildProfileSnapshot(state),
    isNew: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatValidationErrors(validation: FullValidationResult): string {
  const errors: string[] = [];

  validation.shapeErrors.forEach((e) => {
    errors.push(`Shape: ${e.field} - ${e.message}`);
  });

  validation.idErrors.forEach((e) => {
    errors.push(`ID: ${e.path} - ${e.message}`);
  });

  validation.moduleErrors.forEach((e) => {
    errors.push(`Module: ${e.moduleId} - ${e.message}`);
  });

  return errors.join("; ");
}
