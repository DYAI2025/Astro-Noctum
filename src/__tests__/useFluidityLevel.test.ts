import { describe, it, expect } from 'vitest';
import {
  countCompletedClusters,
  clusterCountToTier,
} from '@/src/hooks/useFluidityLevel';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';

describe('countCompletedClusters', () => {
  it('returns 0 for empty set', () => {
    expect(countCompletedClusters(new Set())).toBe(0);
  });

  it('returns 0 when no cluster is fully completed', () => {
    // Only one quiz from naturkind cluster
    expect(countCompletedClusters(new Set(['quiz.aura_colors.v1']))).toBe(0);
  });

  it('returns 1 when exactly one cluster is complete', () => {
    // Complete the mentalist cluster (3 quizzes)
    const mentalist = CLUSTER_REGISTRY.find(c => c.id === 'cluster.mentalist.v1')!;
    const completed = new Set(mentalist.quizModuleIds);
    expect(countCompletedClusters(completed)).toBe(1);
  });

  it('returns 6 when all clusters are complete', () => {
    const allModules = new Set(CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds));
    expect(countCompletedClusters(allModules)).toBe(6);
  });

  it('counts only fully completed clusters, not partial ones', () => {
    const mentalist = CLUSTER_REGISTRY.find(c => c.id === 'cluster.mentalist.v1')!;
    // Complete mentalist + partial naturkind
    const completed = new Set([...mentalist.quizModuleIds, 'quiz.aura_colors.v1']);
    expect(countCompletedClusters(completed)).toBe(1);
  });
});

describe('clusterCountToTier', () => {
  it('returns tier 0 for 0 clusters', () => {
    expect(clusterCountToTier(0, false)).toBe(0);
  });

  it('returns tier 1 for 1 cluster', () => {
    expect(clusterCountToTier(1, false)).toBe(1);
  });

  it('returns tier 1 for 5 clusters', () => {
    expect(clusterCountToTier(5, false)).toBe(1);
  });

  it('returns tier 2 for 6 clusters', () => {
    expect(clusterCountToTier(6, false)).toBe(2);
  });

  it('forces tier 0 when reducedMotion is true regardless of cluster count', () => {
    expect(clusterCountToTier(0, true)).toBe(0);
    expect(clusterCountToTier(3, true)).toBe(0);
    expect(clusterCountToTier(6, true)).toBe(0);
  });
});
