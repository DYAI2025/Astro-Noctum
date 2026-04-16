import { useCallback } from 'react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';
import { contributeQuizResult } from '@/src/services/contribute';
import { findClusterForModule, isClusterComplete } from '@/src/lib/fusion-ring/clusters';
import {
  queueContribution,
  drainClusterContributions,
} from '@/src/lib/fusion-ring/contribution-queue';

/**
 * Returns a handler for quiz onComplete that:
 * 1. Converts ContributionEvent → sector weights via AFFINITY_MAP
 * 2. Queues the result locally (localStorage)
 * 3. Checks cluster completion gate
 * 4. On full cluster: batch-POSTs all queued weights (fire-and-forget)
 *
 * @param completedModuleIds - Set of already-completed module IDs for this user
 */
export function useQuizContribution(completedModuleIds: Set<string>) {
  return useCallback((event: ContributionEvent) => {
    const moduleId = event.source?.moduleId;
    if (!moduleId) return;

    const sectorWeights = eventToSectorSignals(event);
    if (!sectorWeights || sectorWeights.length !== 12) return;

    const normalizedSectorWeights = sectorWeights.map((signal) => (signal + 1) / 2);

    // Always queue locally first
    queueContribution(moduleId, normalizedSectorWeights, 0.75);

    // Check cluster gate — only POST when entire cluster is complete
    const cluster = findClusterForModule(moduleId);
    if (cluster) {
      const updatedCompleted = new Set(completedModuleIds);
      updatedCompleted.add(moduleId);
      if (!isClusterComplete(cluster, updatedCompleted)) return;

      // Cluster complete — drain and POST all queued contributions for this cluster
      const drained = drainClusterContributions(cluster.quizModuleIds);
      for (const entry of drained) {
        void contributeQuizResult(entry.moduleId, entry.sectorWeights, entry.confidence);
      }
      return;
    }

    // No cluster (standalone quiz) — POST immediately
    void contributeQuizResult(moduleId, normalizedSectorWeights, 0.75);
  }, [completedModuleIds]);
}
