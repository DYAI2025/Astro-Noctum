import { useCallback } from 'react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';
import { contributeQuizResult } from '@/src/services/contribute';
import { findClusterForModule, isClusterComplete } from '@/src/lib/fusion-ring/clusters';

/**
 * Returns a handler for quiz onComplete that:
 * 1. Converts ContributionEvent → sector weights via AFFINITY_MAP
 * 2. Checks cluster completion gate
 * 3. POSTs to /api/contribute (fire-and-forget)
 *
 * @param completedModuleIds - Set of already-completed module IDs for this user
 */
export function useQuizContribution(completedModuleIds: Set<string>) {
  return useCallback((event: ContributionEvent) => {
    const moduleId = event.source?.moduleId;
    if (!moduleId) return;

    const sectorWeights = eventToSectorSignals(event);
    if (!sectorWeights || sectorWeights.length !== 12) return;

    // Map signals from [-1, 1] to [0, 1] as required by /api/contribute
    const normalizedSectorWeights = sectorWeights.map((signal) => (signal + 1) / 2);

    // Check cluster gate — only contribute if entire cluster is complete
    const cluster = findClusterForModule(moduleId);
    if (cluster) {
      const updatedCompleted = new Set(completedModuleIds);
      updatedCompleted.add(moduleId);
      if (!isClusterComplete(cluster, updatedCompleted)) {
        console.log('[quiz] cluster incomplete, deferring contribution');
        return;
      }
    }

    // Fire and forget — never blocks UI
    void contributeQuizResult(moduleId, normalizedSectorWeights, 0.75);
  }, [completedModuleIds]);
}
