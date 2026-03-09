/**
 * JSON File Store
 *
 * File-based persistence using JSON for profile state and JSONL for event audit.
 * Uses atomic writes (write to temp, then rename) to prevent corruption.
 *
 * Data stored in .data/ directory (gitignored).
 *
 * Concurrency: Uses in-process locks per userId. For multi-instance deployment,
 * switch to SQLite or Redis.
 */

import fs from "node:fs/promises";
import path from "node:path";
import type {
  ProfileStateStore,
  EventStore,
  EventRecord,
  UserId,
} from "./store-types";
import { ProfileState } from "@/lib/profile";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DATA_DIR = path.join(process.cwd(), ".data");

// ═══════════════════════════════════════════════════════════════════════════
// IN-PROCESS LOCKS (MVP concurrency protection)
// ═══════════════════════════════════════════════════════════════════════════

const locks = new Map<string, Promise<void>>();

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any existing lock on this key
  const existing = locks.get(key);
  if (existing) {
    await existing;
  }

  // Create new lock
  let resolve: () => void;
  const lock = new Promise<void>((r) => {
    resolve = r;
  });
  locks.set(key, lock);

  try {
    return await fn();
  } finally {
    resolve!();
    locks.delete(key);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function profilePath(userId: UserId): string {
  // Sanitize userId to prevent path traversal
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_DIR, `profile.${safe}.json`);
}

function eventsPath(userId: UserId): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_DIR, `events.${safe}.jsonl`);
}

/**
 * Atomic write: write to temp file, then rename.
 * Prevents partial writes from corrupting data.
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp.${Date.now()}`;
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, filePath);
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE STATE STORE
// ═══════════════════════════════════════════════════════════════════════════

export class JsonProfileStateStore implements ProfileStateStore {
  async load(userId: UserId): Promise<ProfileState | null> {
    await ensureDir();
    const p = profilePath(userId);

    try {
      const raw = await fs.readFile(p, "utf8");
      return JSON.parse(raw) as ProfileState;
    } catch (err) {
      // File doesn't exist or is invalid
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      // Log but don't crash on parse errors
      console.error(`[JsonProfileStateStore] Failed to parse ${p}:`, err);
      return null;
    }
  }

  async save(userId: UserId, state: ProfileState): Promise<void> {
    await ensureDir();
    const p = profilePath(userId);

    await withLock(`profile:${userId}`, async () => {
      await atomicWrite(p, JSON.stringify(state, null, 2));
    });
  }

  async exists(userId: UserId): Promise<boolean> {
    await ensureDir();
    const p = profilePath(userId);

    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  async delete(userId: UserId): Promise<void> {
    await ensureDir();
    const p = profilePath(userId);

    try {
      await fs.unlink(p);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT STORE (JSONL audit log)
// ═══════════════════════════════════════════════════════════════════════════

export class JsonlEventStore implements EventStore {
  async append(record: EventRecord): Promise<void> {
    await ensureDir();
    const p = eventsPath(record.userId);
    const line = JSON.stringify(record) + "\n";

    await withLock(`events:${record.userId}`, async () => {
      await fs.appendFile(p, line, "utf8");
    });
  }

  async list(userId: UserId): Promise<EventRecord[]> {
    await ensureDir();
    const p = eventsPath(userId);

    try {
      const raw = await fs.readFile(p, "utf8");
      const lines = raw.trim().split("\n").filter(Boolean);
      return lines.map((line) => JSON.parse(line) as EventRecord);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      console.error(`[JsonlEventStore] Failed to read ${p}:`, err);
      return [];
    }
  }

  async count(userId: UserId): Promise<number> {
    const events = await this.list(userId);
    return events.length;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT INSTANCES (singleton for convenience)
// ═══════════════════════════════════════════════════════════════════════════

let defaultProfileStore: JsonProfileStateStore | null = null;
let defaultEventStore: JsonlEventStore | null = null;

export function getDefaultProfileStore(): JsonProfileStateStore {
  if (!defaultProfileStore) {
    defaultProfileStore = new JsonProfileStateStore();
  }
  return defaultProfileStore;
}

export function getDefaultEventStore(): JsonlEventStore {
  if (!defaultEventStore) {
    defaultEventStore = new JsonlEventStore();
  }
  return defaultEventStore;
}
