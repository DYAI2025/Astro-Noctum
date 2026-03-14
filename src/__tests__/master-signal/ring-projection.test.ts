import { describe, it, expect } from 'vitest';
import { projectToRing } from '@/src/lib/master-signal/ring-projection';
import type { MasterSignal } from '@/src/lib/master-signal/types';

function makeMockMasterSignal(): MasterSignal {
  return {
    subsignals: {
      natal: {
        signal_type: 'natal',
        dimensions: { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.6, autonomy: 0.4 },
        projection_mode: 'heuristic_v1', coverage: 1,
      },
      quiz: {
        signal_type: 'quiz',
        dimensions: { passion: 0.6, stability: 0.4, future: 0.6, connection: 0.5, autonomy: 0.5 },
        projection_mode: 'heuristic_v1', coverage: 0.5,
      },
      generational_context: {
        signal_type: 'generational_context',
        dimensions: { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 },
        projection_mode: 'heuristic_v1', coverage: 1,
      },
    },
    relations: {
      alignment_nq: 0.85, alignment_ng: 0.70, alignment_qg: 0.75,
      internal_coherence: 0.85, context_fit: 0.725, overall_integration: 0.79,
    },
    narratives: { core_summary: 'test', context_summary: 'test', integration_summary: 'test' },
    metadata: { dimension_space: '5d_heuristic_v1', weights_mode: 'experimental_v1', evidence_mode: 'heuristic_v1', computed_at: new Date().toISOString() },
  };
}

describe('projectToRing', () => {
  it('produces 12-sector modulation array', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.sector_modulation).toHaveLength(12);
    expect(result.sector_modulation.every(v => typeof v === 'number')).toBe(true);
  });

  it('sector_sources has 12 entries', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.sector_sources).toHaveLength(12);
    expect(result.sector_sources.every(s => s.dominant_dimension && typeof s.weight === 'number')).toBe(true);
  });

  it('signal_strength is in 0..1 range', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.signal_strength).toBeGreaterThanOrEqual(0);
    expect(result.signal_strength).toBeLessThanOrEqual(1);
  });

  it('source is master_signal_v1', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.source).toBe('master_signal_v1');
  });
});
