/**
 * LocalStorage Store
 *
 * Client-side storage implementation for static export mode.
 * Uses localStorage for persistence with a single-user model.
 *
 * Keys:
 * - profile:{userId} - ProfileState JSON
 * - events:{userId} - EventRecord[] JSON
 */

import { ProfileState } from "@/lib/profile";
import {
  ProfileStateStore,
  EventStore,
  UserId,
  EventRecord,
} from "./store-types";

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════

const PROFILE_PREFIX = "quizzme.profile.";
const EVENTS_PREFIX = "quizzme.events.";

function profileKey(userId: UserId): string {
  return `${PROFILE_PREFIX}${userId}`;
}

function eventsKey(userId: UserId): string {
  return `${EVENTS_PREFIX}${userId}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if localStorage is available (SSR-safe)
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const test = "__ls_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get item from localStorage with JSON parsing
 */
function getJSON<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set item in localStorage with JSON serialization
 */
function setJSON<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Remove item from localStorage
 */
function removeKey(key: string): void {
  if (!isLocalStorageAvailable()) return;
  localStorage.removeItem(key);
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE STATE STORE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LocalStorage implementation of ProfileStateStore.
 * All operations are synchronous under the hood, but wrapped in Promise
 * to match the interface.
 */
export class LocalStorageProfileStore implements ProfileStateStore {
  async load(userId: UserId): Promise<ProfileState | null> {
    return getJSON<ProfileState>(profileKey(userId));
  }

  async save(userId: UserId, state: ProfileState): Promise<void> {
    setJSON(profileKey(userId), state);
  }

  async exists(userId: UserId): Promise<boolean> {
    if (!isLocalStorageAvailable()) return false;
    return localStorage.getItem(profileKey(userId)) !== null;
  }

  async delete(userId: UserId): Promise<void> {
    removeKey(profileKey(userId));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT STORE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LocalStorage implementation of EventStore.
 * Stores all events for a user in a single JSON array.
 */
export class LocalStorageEventStore implements EventStore {
  async append(record: EventRecord): Promise<void> {
    const key = eventsKey(record.userId);
    const events = getJSON<EventRecord[]>(key) ?? [];
    events.push(record);
    setJSON(key, events);
  }

  async list(userId: UserId): Promise<EventRecord[]> {
    return getJSON<EventRecord[]>(eventsKey(userId)) ?? [];
  }

  async count(userId: UserId): Promise<number> {
    const events = await this.list(userId);
    return events.length;
  }

  /**
   * Clear all events for a user (for testing/reset)
   */
  async clear(userId: UserId): Promise<void> {
    removeKey(eventsKey(userId));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create localStorage stores for static export mode.
 */
export function createLocalStorageStores(): {
  profiles: LocalStorageProfileStore;
  events: LocalStorageEventStore;
} {
  return {
    profiles: new LocalStorageProfileStore(),
    events: new LocalStorageEventStore(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT USER ID
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default user ID for single-user static export mode.
 * In static mode, there's no authentication, so we use a fixed ID.
 */
export const DEFAULT_LOCAL_USER_ID = "local-user";

/**
 * Get or create a user ID for localStorage mode.
 * Uses stored ID if available, otherwise generates and stores a new one.
 */
export function getLocalUserId(): string {
  if (!isLocalStorageAvailable()) return DEFAULT_LOCAL_USER_ID;

  const key = "quizzme.userId";
  let userId = localStorage.getItem(key);

  if (!userId) {
    // Generate a UUID-like ID
    userId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(key, userId);
  }

  return userId;
}
