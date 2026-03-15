import { describe, it, expect } from 'vitest';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';
import { findClusterForModule, isClusterComplete } from '@/src/lib/fusion-ring/clusters';
import type { ContributionEvent } from '@/src/lib/lme/types';

const makeEvent = (moduleId: string, markers: { id: string; weight: number }[]): ContributionEvent => ({
  specVersion: 'sp.contribution.v1',
  eventId: `test:${moduleId}:${Date.now()}`,
  occurredAt: new Date().toISOString(),
  source: { vertical: 'quiz', moduleId },
  payload: { markers },
});

describe('Contribution Pipeline', () => {
  describe('eventToSectorSignals', () => {
    it('returns 12-element array from a valid ContributionEvent', () => {
      const event = makeEvent('quiz.krafttier.v1', [
        { id: 'marker.instinct.fight_or_flight', weight: 0.8 },
      ]);
      const result = eventToSectorSignals(event);
      expect(result).toHaveLength(12);
      result.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      });
    });

    it('returns all zeros for unknown markers', () => {
      const event = makeEvent('quiz.test.v1', [
        { id: 'marker.nonexistent.xyz', weight: 0.5 },
      ]);
      const result = eventToSectorSignals(event);
      expect(result).toHaveLength(12);
      // All zeros normalized = all zeros
      expect(result.every((v) => v === 0)).toBe(true);
    });

    it('produces non-zero signals for known domain markers', () => {
      const event = makeEvent('quiz.test.v1', [
        { id: 'marker.love.touch', weight: 0.9 },
        { id: 'marker.instinct.fight', weight: 0.7 },
      ]);
      const result = eventToSectorSignals(event);
      expect(result).toHaveLength(12);
      // At least some sectors should be non-zero
      expect(result.some((v) => v !== 0)).toBe(true);
    });
  });

  describe('Cluster gate', () => {
    it('finds cluster for known kinky module', () => {
      const cluster = findClusterForModule('quiz.kinky_01.v1');
      expect(cluster).not.toBeNull();
      expect(cluster!.id).toBe('cluster.kinky.v1');
    });

    it('returns false for incomplete kinky cluster', () => {
      const cluster = findClusterForModule('quiz.kinky_01.v1')!;
      const completed = new Set(['quiz.kinky_01.v1', 'quiz.kinky_02.v1']);
      expect(isClusterComplete(cluster, completed)).toBe(false);
    });

    it('returns true when all kinky modules are complete', () => {
      const cluster = findClusterForModule('quiz.kinky_01.v1')!;
      const completed = new Set(cluster.quizModuleIds);
      expect(isClusterComplete(cluster, completed)).toBe(true);
    });

    it('returns null for unknown module', () => {
      expect(findClusterForModule('quiz.nonexistent.v1')).toBeNull();
    });

    it('finds partner_match cluster', () => {
      const cluster = findClusterForModule('quiz.partner_convo.v1');
      expect(cluster).not.toBeNull();
      expect(cluster!.id).toBe('cluster.partner_match.v1');
    });
  });
});
