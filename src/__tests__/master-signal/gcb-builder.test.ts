import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { buildGCB } from '@/src/lib/master-signal/gcb-builder';

describe('buildGCB', () => {
  beforeAll(() => {
    // Freeze time so age and life_stage calculations are deterministic
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterAll(() => {
    // Restore real timers after tests complete
    vi.useRealTimers();
  });
  it('computes correct fields for 1988 birth year', () => {
    const gcb = buildGCB(1988);
    expect(gcb.birth_year).toBe(1988);
    expect(gcb.age).toBeGreaterThanOrEqual(37);
    expect(gcb.cohort_5y).toBe('1985-1989');
    expect(gcb.cohort_10y).toBe('1980-1989');
    expect(gcb.generation_label).toBe('millennial');
    expect(gcb.life_stage).toBe('mid_adulthood');
    expect(gcb.evidence_mode).toBe('heuristic_v1');
  });

  it('computes gen_z for 2000 birth year', () => {
    const gcb = buildGCB(2000);
    expect(gcb.generation_label).toBe('gen_z');
    expect(gcb.cohort_5y).toBe('2000-2004');
    expect(gcb.life_stage).toBe('early_adulthood');
  });

  it('computes baby_boomer for 1955', () => {
    const gcb = buildGCB(1955);
    expect(gcb.generation_label).toBe('baby_boomer');
    expect(gcb.life_stage).toBe('senior');
  });

  it('baseline_vector is normalized (all values 0..1)', () => {
    const gcb = buildGCB(1988);
    const vals = Object.values(gcb.baseline_vector);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
    expect(vals.some(v => v > 0)).toBe(true);
  });

  it('baseline_explanation contains context-only disclaimers', () => {
    const gcb = buildGCB(1988);
    expect(gcb.baseline_explanation.length).toBeGreaterThan(0);
    expect(gcb.baseline_explanation.some(e =>
      e.toLowerCase().includes('context') || e.toLowerCase().includes('reference')
    )).toBe(true);
  });

  it('has all 5 dimension keys in baseline_vector', () => {
    const gcb = buildGCB(1995);
    const keys = Object.keys(gcb.baseline_vector).sort();
    expect(keys).toEqual(['autonomy', 'connection', 'future', 'passion', 'stability']);
  });

  it('clamps age to 0 for future birth years', () => {
    const gcb = buildGCB(2090);
    expect(gcb.age).toBe(0);
    expect(gcb.life_stage).toBe('childhood');
    expect(gcb.baseline_vector.passion).toBeGreaterThan(0);
  });

  it('different life stages produce different baseline vectors', () => {
    const young = buildGCB(2005);
    const mature = buildGCB(1970);
    const dims = Object.keys(young.baseline_vector) as Array<keyof typeof young.baseline_vector>;
    const diffs = dims.map(k => Math.abs(young.baseline_vector[k] - mature.baseline_vector[k]));
    expect(Math.max(...diffs)).toBeGreaterThan(0.05);
  });
});
