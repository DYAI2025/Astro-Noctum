import { describe, it, expect } from 'vitest';
import { CLUSTER_REGISTRY, isClusterComplete, findClusterForModule } from '@/src/lib/fusion-ring/clusters';

describe('cluster completion flow', () => {
  it('each cluster has a significance weight between 0 and 1', () => {
    for (const cluster of CLUSTER_REGISTRY) {
      expect(cluster.significance).toBeGreaterThanOrEqual(0);
      expect(cluster.significance).toBeLessThanOrEqual(1);
    }
  });

  it('completing the last quiz in a cluster triggers isClusterComplete', () => {
    const cluster = CLUSTER_REGISTRY[0]; // naturkind
    const partial = new Set(cluster.quizModuleIds.slice(0, -1));
    expect(isClusterComplete(cluster, partial)).toBe(false);

    const full = new Set(cluster.quizModuleIds);
    expect(isClusterComplete(cluster, full)).toBe(true);
  });

  it('findClusterForModule returns cluster with significance', () => {
    const cluster = findClusterForModule('quiz.kinky_01.v1');
    expect(cluster).not.toBeNull();
    expect(cluster!.significance).toBe(0.9);
  });

  it('partner_match has highest significance (1.0)', () => {
    const cluster = findClusterForModule('quiz.partner_match_01.v1');
    expect(cluster!.significance).toBe(1.0);
  });

  it('all 6 clusters are defined', () => {
    expect(CLUSTER_REGISTRY).toHaveLength(6);
  });
});
