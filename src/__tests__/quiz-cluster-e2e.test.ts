import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CLUSTER_REGISTRY,
  isClusterComplete,
  clusterProgress,
  findClusterForModule,
} from '@/src/lib/fusion-ring/clusters';
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/fusion-ring/quiz-maps';
import { pickSuggestion } from '@/src/hooks/useQuizSuggestion';

describe('Quiz-Cluster E2E pipeline', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('every cluster moduleId has a quiz mapping', () => {
    for (const cluster of CLUSTER_REGISTRY) {
      for (const moduleId of cluster.quizModuleIds) {
        expect(MODULE_TO_QUIZ_ID[moduleId]).toBeDefined();
        expect(QUIZ_NAMES[moduleId]).toBeDefined();
        expect(QUIZ_NAMES[moduleId].de).toBeTruthy();
      }
    }
  });

  it('cluster completion gate works correctly', () => {
    const cluster = CLUSTER_REGISTRY[0]; // Naturkind — 4 quizzes
    const partial = new Set(cluster.quizModuleIds.slice(0, 3));
    expect(isClusterComplete(cluster, partial)).toBe(false);
    expect(clusterProgress(cluster, partial)).toBeCloseTo(0.75);

    const full = new Set(cluster.quizModuleIds);
    expect(isClusterComplete(cluster, full)).toBe(true);
    expect(clusterProgress(cluster, full)).toBe(1);
  });

  it('findClusterForModule resolves all 24 modules', () => {
    const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
    expect(allModules.length).toBe(24);
    for (const moduleId of allModules) {
      const cluster = findClusterForModule(moduleId);
      expect(cluster).not.toBeNull();
      expect(cluster!.quizModuleIds).toContain(moduleId);
    }
  });

  it('pickSuggestion returns null when all complete', () => {
    const allModules = new Set(CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds));
    const result = pickSuggestion(allModules);
    expect(result).toBeNull();
  });

  it('pickSuggestion respects once-per-day gate', () => {
    const empty = new Set<string>();
    pickSuggestion(empty);
    const second = pickSuggestion(empty);
    expect(second).toBeNull();
  });

  it('premium clusters are correctly identified', () => {
    const premiumClusters = CLUSTER_REGISTRY.filter(
      c => c.id === 'cluster.kinky.v1' || c.id === 'cluster.partner_match.v1'
    );
    expect(premiumClusters).toHaveLength(2);
    const freeClusters = CLUSTER_REGISTRY.filter(
      c => c.id !== 'cluster.kinky.v1' && c.id !== 'cluster.partner_match.v1'
    );
    expect(freeClusters).toHaveLength(4);
  });
});
