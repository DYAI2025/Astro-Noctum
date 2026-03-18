import { describe, it, expect } from 'vitest';
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/fusion-ring/quiz-maps';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';

describe('quiz-maps', () => {
  it('MODULE_TO_QUIZ_ID covers every module in CLUSTER_REGISTRY', () => {
    const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
    for (const moduleId of allModules) {
      expect(MODULE_TO_QUIZ_ID[moduleId], `Missing mapping for ${moduleId}`).toBeDefined();
    }
  });

  it('QUIZ_NAMES covers every module in CLUSTER_REGISTRY', () => {
    const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
    for (const moduleId of allModules) {
      expect(QUIZ_NAMES[moduleId], `Missing name for ${moduleId}`).toBeDefined();
      expect(QUIZ_NAMES[moduleId].de).toBeTruthy();
      expect(QUIZ_NAMES[moduleId].en).toBeTruthy();
    }
  });
});
