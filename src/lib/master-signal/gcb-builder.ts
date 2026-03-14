import type { GenerationalContextBaseline, LifeStage, DimensionVector } from './types';
import { clampVector } from './dimensions';

const CURRENT_YEAR = new Date().getFullYear();

function generationLabel(year: number): string {
  if (year <= 1945) return 'silent_generation';
  if (year <= 1964) return 'baby_boomer';
  if (year <= 1980) return 'gen_x';
  if (year <= 1996) return 'millennial';
  if (year <= 2012) return 'gen_z';
  return 'gen_alpha';
}

function lifeStage(age: number): LifeStage {
  if (age <= 12) return 'childhood';
  if (age <= 19) return 'adolescence';
  if (age <= 29) return 'early_adulthood';
  if (age <= 44) return 'mid_adulthood';
  if (age <= 59) return 'mature_adulthood';
  return 'senior';
}

function cohort5y(year: number): string {
  const start = year - (year % 5);
  return `${start}-${start + 4}`;
}

function cohort10y(year: number): string {
  const start = year - (year % 10);
  return `${start}-${start + 9}`;
}

const LIFE_STAGE_BASELINES: Record<LifeStage, DimensionVector> = {
  childhood:        { passion: 0.70, stability: 0.30, future: 0.40, connection: 0.65, autonomy: 0.25 },
  adolescence:      { passion: 0.75, stability: 0.25, future: 0.55, connection: 0.60, autonomy: 0.55 },
  early_adulthood:  { passion: 0.65, stability: 0.40, future: 0.65, connection: 0.55, autonomy: 0.70 },
  mid_adulthood:    { passion: 0.52, stability: 0.61, future: 0.56, connection: 0.58, autonomy: 0.64 },
  mature_adulthood: { passion: 0.45, stability: 0.70, future: 0.45, connection: 0.65, autonomy: 0.55 },
  senior:           { passion: 0.40, stability: 0.75, future: 0.35, connection: 0.70, autonomy: 0.50 },
};

export function buildGCB(birthYear: number): GenerationalContextBaseline {
  const age = CURRENT_YEAR - birthYear;
  const stage = lifeStage(age);

  return {
    birth_year: birthYear,
    age,
    cohort_5y: cohort5y(birthYear),
    cohort_10y: cohort10y(birthYear),
    generation_label: generationLabel(birthYear),
    life_stage: stage,
    baseline_vector: clampVector({ ...LIFE_STAGE_BASELINES[stage] }),
    baseline_explanation: [
      'context reference only — not a personality claim',
      `life_stage "${stage}" baseline (heuristic_v1)`,
      'generation_label is communication aid only, not used in model computation',
    ],
    evidence_mode: 'heuristic_v1',
  };
}
