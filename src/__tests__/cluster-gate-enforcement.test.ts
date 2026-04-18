import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  queueContribution,
  drainClusterContributions,
  loadPendingContributions,
} from '../lib/signatur/contribution-queue';
import {
  findClusterForModule,
  isClusterComplete,
  CLUSTER_REGISTRY,
} from '../lib/signatur/clusters';

// ── 1. Contribution queue — localStorage persistence ────────────────

describe('contribution-queue — localStorage persistence', () => {
  beforeEach(() => localStorage.removeItem('bazodiac_pending_contributions'));
  afterEach(() => localStorage.removeItem('bazodiac_pending_contributions'));

  it('queues a contribution and retrieves it', () => {
    const weights = Array(12).fill(0.5);
    queueContribution('quiz.aura_colors.v1', weights, 0.75);

    const pending = loadPendingContributions();
    expect(pending.size).toBe(1);
    expect(pending.get('quiz.aura_colors.v1')?.sectorWeights).toEqual(weights);
  });

  it('overwrites duplicate moduleId (latest wins)', () => {
    queueContribution('quiz.aura_colors.v1', Array(12).fill(0.3), 0.7);
    queueContribution('quiz.aura_colors.v1', Array(12).fill(0.8), 0.9);

    const pending = loadPendingContributions();
    expect(pending.size).toBe(1);
    expect(pending.get('quiz.aura_colors.v1')?.sectorWeights[0]).toBe(0.8);
    expect(pending.get('quiz.aura_colors.v1')?.confidence).toBe(0.9);
  });

  it('queues multiple different modules', () => {
    queueContribution('quiz.aura_colors.v1', Array(12).fill(0.3), 0.7);
    queueContribution('quiz.krafttier.v1', Array(12).fill(0.5), 0.75);

    const pending = loadPendingContributions();
    expect(pending.size).toBe(2);
  });
});

// ── 2. Drain — removes only cluster modules ─────────────────────────

describe('contribution-queue — drainClusterContributions', () => {
  beforeEach(() => localStorage.removeItem('bazodiac_pending_contributions'));
  afterEach(() => localStorage.removeItem('bazodiac_pending_contributions'));

  it('drains only the specified module IDs', () => {
    queueContribution('quiz.aura_colors.v1', Array(12).fill(0.3), 0.7);
    queueContribution('quiz.krafttier.v1', Array(12).fill(0.5), 0.75);
    queueContribution('quiz.love_languages.v1', Array(12).fill(0.6), 0.8);

    const drained = drainClusterContributions([
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
    ]);

    expect(drained).toHaveLength(2);
    expect(drained.map(d => d.moduleId).sort()).toEqual([
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
    ]);

    const remaining = loadPendingContributions();
    expect(remaining.size).toBe(1);
    expect(remaining.has('quiz.love_languages.v1')).toBe(true);
  });

  it('returns empty array when no matching entries', () => {
    const drained = drainClusterContributions(['quiz.nonexistent.v1']);
    expect(drained).toHaveLength(0);
  });

  it('handles partial matches (some modules not yet queued)', () => {
    queueContribution('quiz.aura_colors.v1', Array(12).fill(0.3), 0.7);

    const drained = drainClusterContributions([
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1', // not queued
    ]);

    expect(drained).toHaveLength(1);
    expect(drained[0]!.moduleId).toBe('quiz.aura_colors.v1');
  });
});

// ── 3. Cluster gate logic — pure function tests ─────────────────────

describe('cluster gate — isClusterComplete', () => {
  const naturkind = CLUSTER_REGISTRY.find(c => c.id === 'cluster.naturkind.v1')!;

  it('returns false when only 1 of 4 quizzes done', () => {
    const completed = new Set(['quiz.aura_colors.v1']);
    expect(isClusterComplete(naturkind, completed)).toBe(false);
  });

  it('returns false when 3 of 4 quizzes done', () => {
    const completed = new Set([
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
    ]);
    expect(isClusterComplete(naturkind, completed)).toBe(false);
  });

  it('returns true when all 4 quizzes done', () => {
    const completed = new Set([
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
      'quiz.energiestein.v1',
    ]);
    expect(isClusterComplete(naturkind, completed)).toBe(true);
  });

  it('returns true with extra modules beyond the cluster', () => {
    const completed = new Set([
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
      'quiz.energiestein.v1',
      'quiz.love_languages.v1',
    ]);
    expect(isClusterComplete(naturkind, completed)).toBe(true);
  });
});

describe('findClusterForModule', () => {
  it('finds naturkind cluster for its quizzes', () => {
    const cluster = findClusterForModule('quiz.aura_colors.v1');
    expect(cluster?.id).toBe('cluster.naturkind.v1');
  });

  it('returns null for unknown module', () => {
    expect(findClusterForModule('quiz.unknown.v1')).toBeNull();
  });
});

// ── 4. useQuizContribution integration — mock POST ──────────────────

vi.mock('../services/contribute', () => ({
  contributeQuizResult: vi.fn().mockResolvedValue(undefined),
}));

import { useQuizContribution } from '../hooks/useQuizContribution';
import { contributeQuizResult } from '../services/contribute';
import type { ContributionEvent } from '../lib/lme/types';
import { renderHook } from '@testing-library/react';

function makeEvent(moduleId: string): ContributionEvent {
  return {
    id: `evt_${moduleId}_${Date.now()}`,
    source: { moduleId },
    occurredAt: new Date().toISOString(),
    payload: {
      markers: [
        {
          id: `marker.test.keyword_${moduleId}`,
          weight: 0.8,
          evidence: { confidence: 0.9, source: 'quiz' },
        },
      ],
    },
  };
}

describe('useQuizContribution — cluster gate enforcement', () => {
  beforeEach(() => {
    localStorage.removeItem('bazodiac_pending_contributions');
    vi.mocked(contributeQuizResult).mockClear();
  });
  afterEach(() => {
    localStorage.removeItem('bazodiac_pending_contributions');
  });

  it('does NOT call contributeQuizResult when cluster is incomplete', () => {
    const completed = new Set<string>();
    const { result } = renderHook(() => useQuizContribution(completed));

    result.current(makeEvent('quiz.aura_colors.v1'));

    expect(contributeQuizResult).not.toHaveBeenCalled();
  });

  it('queues result locally when cluster is incomplete', () => {
    const completed = new Set<string>();
    const { result } = renderHook(() => useQuizContribution(completed));

    result.current(makeEvent('quiz.aura_colors.v1'));

    const pending = loadPendingContributions();
    expect(pending.has('quiz.aura_colors.v1')).toBe(true);
  });

  it('batch-POSTs all queued results when cluster completes', () => {
    const naturkindModules = [
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
      'quiz.energiestein.v1',
    ];

    // Simulate completing quizzes 1-3 (each queued, none POSTed)
    const step1Completed = new Set<string>();
    const { result: hook1 } = renderHook(() => useQuizContribution(step1Completed));
    hook1.current(makeEvent(naturkindModules[0]!));
    expect(contributeQuizResult).not.toHaveBeenCalled();

    const step2Completed = new Set([naturkindModules[0]!]);
    const { result: hook2 } = renderHook(() => useQuizContribution(step2Completed));
    hook2.current(makeEvent(naturkindModules[1]!));
    expect(contributeQuizResult).not.toHaveBeenCalled();

    const step3Completed = new Set([naturkindModules[0]!, naturkindModules[1]!]);
    const { result: hook3 } = renderHook(() => useQuizContribution(step3Completed));
    hook3.current(makeEvent(naturkindModules[2]!));
    expect(contributeQuizResult).not.toHaveBeenCalled();

    // Quiz 4 completes the cluster — should batch-POST all 4
    const step4Completed = new Set([
      naturkindModules[0]!,
      naturkindModules[1]!,
      naturkindModules[2]!,
    ]);
    const { result: hook4 } = renderHook(() => useQuizContribution(step4Completed));
    hook4.current(makeEvent(naturkindModules[3]!));

    expect(contributeQuizResult).toHaveBeenCalledTimes(4);
    const postedModules = vi.mocked(contributeQuizResult).mock.calls.map(c => c[0]);
    expect(postedModules.sort()).toEqual(naturkindModules.sort());
  });

  it('clears queue after successful cluster drain', () => {
    const naturkindModules = [
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
      'quiz.energiestein.v1',
    ];

    // Queue all 4
    for (const id of naturkindModules) {
      queueContribution(id, Array(12).fill(0.5), 0.75);
    }

    // Complete the cluster
    const completed = new Set(naturkindModules.slice(0, 3));
    const { result } = renderHook(() => useQuizContribution(completed));
    result.current(makeEvent(naturkindModules[3]!));

    const remaining = loadPendingContributions();
    expect(remaining.size).toBe(0);
  });

  it('POSTs immediately for standalone quizzes (no cluster)', () => {
    const completed = new Set<string>();
    const { result } = renderHook(() => useQuizContribution(completed));

    // Module not in any cluster
    result.current(makeEvent('quiz.standalone_test.v1'));

    expect(contributeQuizResult).toHaveBeenCalledTimes(1);
    expect(contributeQuizResult).toHaveBeenCalledWith(
      'quiz.standalone_test.v1',
      expect.any(Array),
      0.75,
    );
  });

  it('does NOT queue to localStorage for standalone quizzes (no cluster)', () => {
    const completed = new Set<string>();
    const { result } = renderHook(() => useQuizContribution(completed));

    // quiz.standalone_test.v1 is not in any cluster
    result.current(makeEvent('quiz.standalone_test.v1'));

    const pending = loadPendingContributions();
    expect(pending.has('quiz.standalone_test.v1')).toBe(false);
  });
});
