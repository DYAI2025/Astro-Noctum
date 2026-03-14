import { describe, it, expect } from 'vitest';
import { projectQuiz } from '@/src/lib/master-signal/quiz-projection';
import type { ContributionEvent } from '@/src/lib/lme/types';

function makeEvent(markers: Array<{ id: string; weight: number }>): ContributionEvent {
  return {
    specVersion: 'sp.contribution.v1',
    eventId: 'test-' + Math.random().toString(36).slice(2),
    occurredAt: new Date().toISOString(),
    source: { vertical: 'quiz', moduleId: 'quiz.test.v1' },
    payload: { markers },
  };
}

describe('projectQuiz', () => {
  it('returns quiz signal type with heuristic_v1 mode', () => {
    const result = projectQuiz([makeEvent([{ id: 'marker.love.physical_touch', weight: 0.8 }])]);
    expect(result.signal_type).toBe('quiz');
    expect(result.projection_mode).toBe('heuristic_v1');
  });

  it('produces values in 0..1 range', () => {
    const events = [makeEvent([
      { id: 'marker.love.physical_touch', weight: 0.9 },
      { id: 'marker.leadership.visionary', weight: 0.7 },
    ])];
    const result = projectQuiz(events);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('handles empty events array', () => {
    const result = projectQuiz([]);
    expect(result.coverage).toBe(0);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v === 0)).toBe(true);
  });

  it('love markers boost connection dimension', () => {
    const loveHeavy = [makeEvent([
      { id: 'marker.love.physical_touch', weight: 0.9 },
      { id: 'marker.love.expression', weight: 0.8 },
    ])];
    const leaderHeavy = [makeEvent([
      { id: 'marker.leadership.visionary', weight: 0.9 },
      { id: 'marker.leadership.servant_leader', weight: 0.8 },
    ])];
    const loveResult = projectQuiz(loveHeavy);
    const leaderResult = projectQuiz(leaderHeavy);
    expect(loveResult.dimensions.connection).toBeGreaterThan(leaderResult.dimensions.connection);
  });

  it('coverage scales with number of events', () => {
    const one = projectQuiz([makeEvent([{ id: 'marker.love.physical_touch', weight: 0.5 }])]);
    const three = projectQuiz([
      makeEvent([{ id: 'marker.love.physical_touch', weight: 0.5 }]),
      makeEvent([{ id: 'marker.social.extroversion', weight: 0.6 }]),
      makeEvent([{ id: 'marker.freedom.autonomy', weight: 0.7 }]),
    ]);
    expect(three.coverage).toBeGreaterThan(one.coverage);
  });
});
