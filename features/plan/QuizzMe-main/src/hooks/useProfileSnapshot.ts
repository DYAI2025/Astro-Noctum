"use client";

/**
 * Profile Snapshot Hook
 *
 * Provides the current profile snapshot for UI consumption.
 * Automatically detects static vs API mode.
 *
 * Usage:
 * ```tsx
 * const { snapshot, isLoading, isNew, error, refetch } = useProfileSnapshot();
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { ProfileSnapshot } from "@/lib/lme/types";
import { getSnapshotClient, ClientGetSnapshotResult } from "@/lib/api";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UseProfileSnapshotResult = {
  /** The current profile snapshot */
  snapshot: ProfileSnapshot | null;
  /** Whether the snapshot is loading */
  isLoading: boolean;
  /** Whether this is a new user with no data */
  isNew: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** The mode being used (local or api) */
  mode: "local" | "api" | null;
  /** Refetch the snapshot */
  refetch: () => Promise<void>;
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to get the current profile snapshot.
 *
 * @param userId - Optional user ID (only used in API mode)
 * @returns Snapshot state with loading/error handling
 */
export function useProfileSnapshot(userId?: string): UseProfileSnapshotResult {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNew, setIsNew] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"local" | "api" | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result: ClientGetSnapshotResult = await getSnapshotClient(userId);
      setSnapshot(result.snapshot);
      setIsNew(result.isNew);
      setMode(result.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch on mount
  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  return {
    snapshot,
    isLoading,
    isNew,
    error,
    mode,
    refetch: fetchSnapshot,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if astro onboarding is complete.
 */
export function useHasAstro(snapshot: ProfileSnapshot | null): boolean {
  return !!snapshot?.astro?.western?.sunSign;
}

/**
 * Get the primary archetype from snapshot.
 */
export function usePrimaryArchetype(
  snapshot: ProfileSnapshot | null
): { archetypeId: string; weight: number; name?: string } | null {
  if (!snapshot?.psyche?.archetypeMix?.[0]) return null;
  const primary = snapshot.psyche.archetypeMix[0];
  return {
    archetypeId: primary.archetypeId,
    weight: primary.weight,
    name: primary.archetype?.name,
  };
}

/**
 * Get completion percentage.
 */
export function useCompletionPercent(snapshot: ProfileSnapshot | null): number {
  return snapshot?.meta?.completion?.percent ?? 0;
}
