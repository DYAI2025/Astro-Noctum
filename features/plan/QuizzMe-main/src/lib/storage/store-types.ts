/**
 * Storage Interface Types
 *
 * Abstract interfaces for profile state and event persistence.
 * Implementations can be swapped (JSON files, SQLite, Redis) without
 * changing the ingestion pipeline.
 */

import { ContributionEvent } from "@/lib/lme/types";
import { ProfileState } from "@/lib/profile";

// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserId = string;

/**
 * Audit log record for a processed contribution event
 */
export type EventRecord = {
  userId: UserId;
  event: ContributionEvent;
  receivedAt: string; // ISO timestamp
  accepted: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Profile state persistence
 */
export interface ProfileStateStore {
  /**
   * Load a user's profile state
   * @returns ProfileState or null if not found
   */
  load(userId: UserId): Promise<ProfileState | null>;

  /**
   * Save a user's profile state (overwrites existing)
   */
  save(userId: UserId, state: ProfileState): Promise<void>;

  /**
   * Check if a user profile exists
   */
  exists(userId: UserId): Promise<boolean>;

  /**
   * Delete a user's profile (for testing/reset)
   */
  delete(userId: UserId): Promise<void>;
}

/**
 * Event audit log persistence
 */
export interface EventStore {
  /**
   * Append an event record to the audit log
   */
  append(record: EventRecord): Promise<void>;

  /**
   * Get all events for a user (for debugging/replay)
   */
  list(userId: UserId): Promise<EventRecord[]>;

  /**
   * Count events for a user
   */
  count(userId: UserId): Promise<number>;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORE FACTORY (for DI)
// ═══════════════════════════════════════════════════════════════════════════

export interface StoreFactory {
  createProfileStore(): ProfileStateStore;
  createEventStore(): EventStore;
}
