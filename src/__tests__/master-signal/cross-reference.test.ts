import { describe, it, expect } from 'vitest';
import { computeRelations } from '@/src/lib/master-signal/cross-reference';
import type { ProjectedSignal } from '@/src/lib/master-signal/types';

function makeSignal(type: 'natal' | 'quiz' | 'generational_context', dims: Record<string, number>): ProjectedSignal {
  return {
    signal_type: type,
    dimensions: {
      passion: dims.passion ?? 0.5,
      stability: dims.stability ?? 0.5,
      future: dims.future ?? 0.5,
      connection: dims.connection ?? 0.5,
      autonomy: dims.autonomy ?? 0.5,
    },
    projection_mode: 'heuristic_v1',
    coverage: 1,
  };
}

describe('computeRelations', () => {
  it('identical signals produce high alignment', () => {
    const same = { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.6, autonomy: 0.4 };
    const n = makeSignal('natal', same);
    const q = makeSignal('quiz', same);
    const g = makeSignal('generational_context', same);
    const r = computeRelations(n, q, g);
    expect(r.alignment_nq).toBeGreaterThan(0.95);
    expect(r.alignment_ng).toBeGreaterThan(0.95);
    expect(r.alignment_qg).toBeGreaterThan(0.95);
    expect(r.internal_coherence).toBeGreaterThan(0.95);
  });

  it('orthogonal signals produce low alignment', () => {
    const n = makeSignal('natal', { passion: 1, stability: 0, future: 0, connection: 0, autonomy: 0 });
    const q = makeSignal('quiz', { passion: 0, stability: 1, future: 0, connection: 0, autonomy: 0 });
    const g = makeSignal('generational_context', { passion: 0, stability: 0, future: 1, connection: 0, autonomy: 0 });
    const r = computeRelations(n, q, g);
    expect(r.alignment_nq).toBeLessThan(0.3);
    expect(r.alignment_ng).toBeLessThan(0.3);
  });

  it('all scores are in 0..1 range', () => {
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.3, stability: 0.7, future: 0.4, connection: 0.2, autonomy: 0.8 });
    const g = makeSignal('generational_context', { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 });
    const r = computeRelations(n, q, g);
    const vals = Object.values(r);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('internal_coherence equals alignment_nq', () => {
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.3, stability: 0.7, future: 0.4, connection: 0.2, autonomy: 0.8 });
    const g = makeSignal('generational_context', { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 });
    const r = computeRelations(n, q, g);
    expect(r.internal_coherence).toBe(r.alignment_nq);
  });

  it('context_fit aggregates N↔G and Q↔G', () => {
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.3, stability: 0.7, future: 0.4, connection: 0.2, autonomy: 0.8 });
    const g = makeSignal('generational_context', { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 });
    const r = computeRelations(n, q, g);
    const min = Math.min(r.alignment_ng, r.alignment_qg);
    const max = Math.max(r.alignment_ng, r.alignment_qg);
    expect(r.context_fit).toBeGreaterThanOrEqual(min - 0.01);
    expect(r.context_fit).toBeLessThanOrEqual(max + 0.01);
  });

  it('GCB does not dominate overall_integration', () => {
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const gDifferent = makeSignal('generational_context', { passion: 0.1, stability: 0.9, future: 0.1, connection: 0.1, autonomy: 0.9 });
    const r = computeRelations(n, q, gDifferent);
    expect(r.overall_integration).toBeGreaterThan(0.5);
  });
});
