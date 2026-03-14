import { describe, it, expect } from 'vitest';
import { buildMasterSignal } from '@/src/lib/master-signal/master-signal-builder';
import type { ApiData } from '@/src/types/bafe';
import type { ContributionEvent } from '@/src/lib/lme/types';

const MOCK_API: ApiData = {
  bazi: {
    pillars: {
      day:   { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      month: { stem: 'Ren', branch: 'Yin',  animal: 'Tiger',  element: 'Water' },
      year:  { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      hour:  { stem: 'Jia', branch: 'Zi',   animal: 'Rat',    element: 'Wood' },
    },
    day_master: 'Wu',
    zodiac_sign: 'Dragon',
  },
  western: { zodiac_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Scorpio', houses: {} },
  wuxing: { elements: { Wood: 1, Fire: 2, Earth: 4, Metal: 1, Water: 2 }, dominant_element: 'Earth' },
};

const MOCK_EVENTS: ContributionEvent[] = [{
  specVersion: 'sp.contribution.v1',
  eventId: 'e1',
  occurredAt: new Date().toISOString(),
  source: { vertical: 'quiz', moduleId: 'quiz.love_languages.v1' },
  payload: { markers: [
    { id: 'marker.love.physical_touch', weight: 0.9 },
    { id: 'marker.love.expression', weight: 0.6 },
  ]},
}];

describe('buildMasterSignal', () => {
  it('produces complete MasterSignal structure', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(ms.subsignals.natal.signal_type).toBe('natal');
    expect(ms.subsignals.quiz.signal_type).toBe('quiz');
    expect(ms.subsignals.generational_context.signal_type).toBe('generational_context');
    expect(ms.metadata.dimension_space).toBe('5d_heuristic_v1');
    expect(ms.metadata.weights_mode).toBe('experimental_v1');
    expect(ms.metadata.evidence_mode).toBe('heuristic_v1');
  });

  it('has all relation scores', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(typeof ms.relations.alignment_nq).toBe('number');
    expect(typeof ms.relations.alignment_ng).toBe('number');
    expect(typeof ms.relations.alignment_qg).toBe('number');
    expect(typeof ms.relations.internal_coherence).toBe('number');
    expect(typeof ms.relations.context_fit).toBe('number');
    expect(typeof ms.relations.overall_integration).toBe('number');
  });

  it('narratives contain no absolute identity claims', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    const allNarratives = Object.values(ms.narratives).join(' ');
    const forbidden = ['wahres Selbst', 'wahre Grundpersönlichkeit', 'true self',
      'fundamental identity', 'who this person fundamentally is',
      'wissenschaftlich bewiesen', 'scientifically proven'];
    for (const f of forbidden) {
      expect(allNarratives.toLowerCase()).not.toContain(f.toLowerCase());
    }
  });

  it('context_summary mentions evidence_mode', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(ms.narratives.context_summary).toContain('heuristic');
  });

  it('handles empty quiz events', () => {
    const ms = buildMasterSignal(MOCK_API, [], 1988, 'de');
    expect(ms.subsignals.quiz.coverage).toBe(0);
  });

  it('handles missing API data', () => {
    const ms = buildMasterSignal({}, MOCK_EVENTS, 1988, 'de');
    expect(ms.subsignals.natal.coverage).toBe(0);
    expect(ms.relations.overall_integration).toBeGreaterThanOrEqual(0);
  });

  it('produces EN narratives when requested', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'en');
    expect(ms.narratives.core_summary).not.toContain('Kernmuster');
  });

  it('metadata.computed_at is a valid ISO timestamp', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(() => new Date(ms.metadata.computed_at)).not.toThrow();
    expect(new Date(ms.metadata.computed_at).getFullYear()).toBeGreaterThan(2020);
  });
});
