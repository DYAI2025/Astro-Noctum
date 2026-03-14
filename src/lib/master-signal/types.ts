/**
 * Master Signal V1 — Type Definitions
 *
 * Shared 5D dimension space = internal heuristic abstraction v1
 * for cross-signal comparability. NOT a canonical ontology.
 */

export type DimensionKey = 'passion' | 'stability' | 'future' | 'connection' | 'autonomy';
export type DimensionVector = Record<DimensionKey, number>;
export type EvidenceMode = 'heuristic_v1' | 'empirical_v1';
export type WeightsMode = 'experimental_v1';
export type ProjectionMode = 'heuristic_v1';
export type SignalType = 'natal' | 'quiz' | 'generational_context';

export interface ProjectedSignal {
  signal_type: SignalType;
  dimensions: DimensionVector;
  projection_mode: ProjectionMode;
  coverage: number;
}

export type LifeStage =
  | 'childhood' | 'adolescence' | 'early_adulthood'
  | 'mid_adulthood' | 'mature_adulthood' | 'senior';

export interface GenerationalContextBaseline {
  birth_year: number;
  age: number;
  cohort_5y: string;
  cohort_10y: string;
  generation_label: string;
  life_stage: LifeStage;
  baseline_vector: DimensionVector;
  baseline_explanation: string[];
  evidence_mode: EvidenceMode;
}

export interface RelationScores {
  alignment_nq: number;
  alignment_ng: number;
  alignment_qg: number;
  internal_coherence: number;
  context_fit: number;
  overall_integration: number;
}

export interface Narratives {
  core_summary: string;
  context_summary: string;
  integration_summary: string;
}

export interface MasterSignal {
  subsignals: {
    natal: ProjectedSignal;
    quiz: ProjectedSignal;
    generational_context: ProjectedSignal;
  };
  relations: RelationScores;
  narratives: Narratives;
  metadata: {
    dimension_space: '5d_heuristic_v1';
    weights_mode: WeightsMode;
    evidence_mode: EvidenceMode;
    computed_at: string;
  };
}

export interface RingProjectionInput {
  sector_modulation: number[];
  sector_sources: Array<{ dominant_dimension: DimensionKey; weight: number }>;
  signal_strength: number;
  source: 'master_signal_v1';
}
