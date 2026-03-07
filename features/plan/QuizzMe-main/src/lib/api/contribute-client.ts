/**
 * Contribute Client (Dual-Mode)
 *
 * Client-side API for submitting contributions.
 * Automatically detects static export mode vs server mode:
 *
 * - Static mode: Uses localStorage and local ingestion (no network)
 * - Server mode: Uses /api/contribute and /api/profile/snapshot endpoints
 *
 * The UI doesn't need to know which mode is active.
 */

import { ContributionEvent, ProfileSnapshot } from "@/lib/lme/types";
import { ingestContribution } from "@/lib/ingestion";
import { buildProfileSnapshot, createDefaultProfileState, ProfileState } from "@/lib/profile";
// Import directly from localstorage-store to avoid bundling server-side json-store
import {
  createLocalStorageStores,
  getLocalUserId,
  LocalStorageProfileStore,
  LocalStorageEventStore,
} from "@/lib/storage/localstorage-store";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ContributeClientResult = {
  accepted: boolean;
  snapshot: ProfileSnapshot;
  error?: string;
  mode: "local" | "api";
};

export type GetSnapshotResult = {
  snapshot: ProfileSnapshot;
  isNew: boolean;
  mode: "local" | "api";
};

// ═══════════════════════════════════════════════════════════════════════════
// MODE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if running in static export mode.
 *
 * Detection logic:
 * 1. If window is undefined (SSR), assume server mode
 * 2. Check for NEXT_PUBLIC_STATIC_MODE env variable
 * 3. Check if running on file:// protocol
 * 4. Check if running on GitHub Pages domain
 */
function isStaticMode(): boolean {
  if (typeof window === "undefined") return false;

  // Explicit environment variable
  if (process.env.NEXT_PUBLIC_STATIC_MODE === "true") return true;

  // File protocol (local static files)
  if (window.location.protocol === "file:") return true;

  // GitHub Pages or other static hosts
  const staticHosts = [
    "github.io",
    "netlify.app",
    "vercel.app",
    "pages.dev",
  ];
  if (staticHosts.some((host) => window.location.hostname.includes(host))) {
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL MODE (STATIC EXPORT)
// ═══════════════════════════════════════════════════════════════════════════

let localStores: { profiles: LocalStorageProfileStore; events: LocalStorageEventStore } | null = null;

function getLocalStores() {
  if (!localStores) {
    localStores = createLocalStorageStores();
  }
  return localStores;
}

/**
 * Submit contribution in local (static) mode.
 * Uses localStorage for persistence, no network calls.
 */
async function contributeLocal(event: ContributionEvent): Promise<ContributeClientResult> {
  const userId = getLocalUserId();
  const stores = getLocalStores();

  try {
    // Load current state
    const currentState = await stores.profiles.load(userId);

    // Ingest event
    const result = ingestContribution(currentState, event);

    if (result.accepted) {
      // Save updated state
      await stores.profiles.save(userId, result.state);

      // Append to event log
      await stores.events.append({
        userId,
        event,
        receivedAt: new Date().toISOString(),
        accepted: true,
      });
    }

    return {
      accepted: result.accepted,
      snapshot: result.snapshot,
      error: result.accepted
        ? undefined
        : `Validation failed: ${JSON.stringify(result.validation)}`,
      mode: "local",
    };
  } catch (err) {
    // Return error snapshot
    const snapshot = buildProfileSnapshot(createDefaultProfileState());
    return {
      accepted: false,
      snapshot,
      error: err instanceof Error ? err.message : "Unknown error",
      mode: "local",
    };
  }
}

/**
 * Get snapshot in local (static) mode.
 */
async function getSnapshotLocal(): Promise<GetSnapshotResult> {
  const userId = getLocalUserId();
  const stores = getLocalStores();

  const state = await stores.profiles.load(userId);

  if (state) {
    return {
      snapshot: buildProfileSnapshot(state),
      isNew: false,
      mode: "local",
    };
  } else {
    return {
      snapshot: buildProfileSnapshot(createDefaultProfileState()),
      isNew: true,
      mode: "local",
    };
  }
}

/**
 * Get current profile state in local mode.
 */
async function getStateLocal(): Promise<ProfileState | null> {
  const userId = getLocalUserId();
  const stores = getLocalStores();
  return stores.profiles.load(userId);
}

// ═══════════════════════════════════════════════════════════════════════════
// API MODE (SERVER)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Submit contribution via API.
 */
async function contributeApi(
  event: ContributionEvent,
  userId?: string
): Promise<ContributeClientResult> {
  try {
    const response = await fetch("/api/contribute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, userId }),
    });

    const data = await response.json();

    return {
      accepted: data.accepted ?? false,
      snapshot: data.snapshot,
      error: data.error,
      mode: "api",
    };
  } catch (err) {
    const snapshot = buildProfileSnapshot(createDefaultProfileState());
    return {
      accepted: false,
      snapshot,
      error: err instanceof Error ? err.message : "Network error",
      mode: "api",
    };
  }
}

/**
 * Get snapshot via API.
 */
async function getSnapshotApi(userId?: string): Promise<GetSnapshotResult> {
  try {
    const url = userId 
      ? `/api/profile/snapshot?userId=${encodeURIComponent(userId)}`
      : "/api/profile/snapshot";
      
    const response = await fetch(url);

    const data = await response.json();

    return {
      snapshot: data.snapshot,
      isNew: data.isNew ?? true,
      mode: "api",
    };
  } catch {
    return {
      snapshot: buildProfileSnapshot(createDefaultProfileState()),
      isNew: true,
      mode: "api",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API (AUTO-DETECT MODE)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Submit a contribution event.
 * Automatically uses local or API mode based on environment.
 *
 * @param event - The ContributionEvent to submit
 * @param userId - Optional user ID (only used in API mode)
 */
export async function contribute(
  event: ContributionEvent,
  userId?: string
): Promise<ContributeClientResult> {
  if (isStaticMode()) {
    return contributeLocal(event);
  }
  return contributeApi(event, userId);
}

/**
 * Get current profile snapshot.
 * Automatically uses local or API mode based on environment.
 *
 * @param userId - Optional user ID (only used in API mode)
 */
export async function getSnapshot(userId?: string): Promise<GetSnapshotResult> {
  if (isStaticMode()) {
    return getSnapshotLocal();
  }
  return getSnapshotApi(userId);
}

/**
 * Get current profile state (for advanced use).
 * Only available in local mode; returns null in API mode.
 */
export async function getProfileState(): Promise<ProfileState | null> {
  if (isStaticMode()) {
    return getStateLocal();
  }
  // In API mode, state is server-side only
  return null;
}

/**
 * Check which mode the client is using.
 */
export function getClientMode(): "local" | "api" {
  return isStaticMode() ? "local" : "api";
}

/**
 * Reset local profile (only works in static mode).
 * Useful for testing or "start over" functionality.
 */
export async function resetLocalProfile(): Promise<void> {
  if (!isStaticMode()) {
    console.warn("resetLocalProfile only works in static mode");
    return;
  }

  const userId = getLocalUserId();
  const stores = getLocalStores();

  await stores.profiles.delete(userId);
  await stores.events.clear(userId);
}
