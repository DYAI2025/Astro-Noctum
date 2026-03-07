/**
 * In-Memory Store
 *
 * For testing without file system side effects.
 * Not for production use - data is lost on restart.
 */

import type {
  ProfileStateStore,
  EventStore,
  EventRecord,
  UserId,
} from "./store-types";
import { ProfileState } from "@/lib/profile";

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY PROFILE STATE STORE
// ═══════════════════════════════════════════════════════════════════════════

export class MemoryProfileStateStore implements ProfileStateStore {
  private data = new Map<UserId, ProfileState>();

  async load(userId: UserId): Promise<ProfileState | null> {
    return this.data.get(userId) ?? null;
  }

  async save(userId: UserId, state: ProfileState): Promise<void> {
    // Deep clone to prevent mutation bugs
    this.data.set(userId, JSON.parse(JSON.stringify(state)));
  }

  async exists(userId: UserId): Promise<boolean> {
    return this.data.has(userId);
  }

  async delete(userId: UserId): Promise<void> {
    this.data.delete(userId);
  }

  // Test helper: clear all data
  clear(): void {
    this.data.clear();
  }

  // Test helper: get raw data
  getAll(): Map<UserId, ProfileState> {
    return new Map(this.data);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY EVENT STORE
// ═══════════════════════════════════════════════════════════════════════════

export class MemoryEventStore implements EventStore {
  private data = new Map<UserId, EventRecord[]>();

  async append(record: EventRecord): Promise<void> {
    const existing = this.data.get(record.userId) ?? [];
    existing.push(JSON.parse(JSON.stringify(record)));
    this.data.set(record.userId, existing);
  }

  async list(userId: UserId): Promise<EventRecord[]> {
    return this.data.get(userId) ?? [];
  }

  async count(userId: UserId): Promise<number> {
    return (this.data.get(userId) ?? []).length;
  }

  // Test helper: clear all data
  clear(): void {
    this.data.clear();
  }

  // Test helper: get all events
  getAll(): Map<UserId, EventRecord[]> {
    return new Map(this.data);
  }
}
