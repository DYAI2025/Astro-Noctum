/**
 * useFluidityLevel — Progressive UI fluidity based on engagement depth
 *
 * Maps completed quiz cluster count to a fluidity tier:
 *   0 clusters → tier 0 (conventional UI)
 *   1-5 clusters → tier 1 (first fluid affordances)
 *   6 clusters → tier 2 (full fluidity)
 *
 * prefers-reduced-motion forces tier 0 regardless of cluster count.
 *
 * Requirement: REQ-F-progressive-ui-fluidity
 */

import { useMemo } from 'react';
import { useReducedMotion } from 'motion/react';
import { CLUSTER_REGISTRY, isClusterComplete } from '@/src/lib/signatur/clusters';

export type FluidityTier = 0 | 1 | 2;

export interface FluidityLevel {
  /** Current fluidity tier: 0=conventional, 1=first affordances, 2=full fluidity */
  tier: FluidityTier;
  /** Number of fully completed quiz clusters (0–6) */
  completedClusters: number;
  /** Whether reduced motion is active (forces tier 0) */
  reducedMotion: boolean;
}

/**
 * Computes the number of fully completed clusters from a set of completed module IDs.
 */
export function countCompletedClusters(completedModuleIds: Set<string>): number {
  return CLUSTER_REGISTRY.filter(cluster =>
    isClusterComplete(cluster, completedModuleIds),
  ).length;
}

/**
 * Maps cluster count to fluidity tier.
 */
export function clusterCountToTier(count: number, reducedMotion: boolean): FluidityTier {
  if (reducedMotion) return 0;
  if (count >= 6) return 2;
  if (count >= 1) return 1;
  return 0;
}

/**
 * Hook that provides the current fluidity tier based on completed quiz clusters.
 *
 * @param completedModuleIds — Set of completed quiz module IDs (from useCompletedModules)
 */
export function useFluidityLevel(completedModuleIds: Set<string>): FluidityLevel {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return useMemo(() => {
    const completedClusters = countCompletedClusters(completedModuleIds);
    const tier = clusterCountToTier(completedClusters, prefersReducedMotion);
    return { tier, completedClusters, reducedMotion: prefersReducedMotion };
  }, [completedModuleIds, prefersReducedMotion]);
}
