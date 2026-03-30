import { describe, it, expect } from 'vitest';
import {
  LIFE_AREAS,
  computeLifeAreaScores,
  blendSectorsForWeekly,
  type LifeAreaScore,
} from '../life-area-mapping';

describe('LIFE_AREAS constants', () => {
  it('defines exactly 7 life areas', () => {
    expect(LIFE_AREAS).toHaveLength(7);
  });

  it('all areas have de and en labels', () => {
    for (const area of LIFE_AREAS) {
      expect(area.label.de).toBeTruthy();
      expect(area.label.en).toBeTruthy();
    }
  });

  it('all sector weights sum to ~1.0 per area', () => {
    for (const area of LIFE_AREAS) {
      const sum = area.sectorWeights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('all sector indices are in range 0-11', () => {
    for (const area of LIFE_AREAS) {
      for (const idx of area.sectorIndices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(11);
      }
    }
  });

  it('each area has 2-5 tendency labels in both languages', () => {
    for (const area of LIFE_AREAS) {
      expect(area.tendencyLabels.de.length).toBeGreaterThanOrEqual(2);
      expect(area.tendencyLabels.en.length).toBeGreaterThanOrEqual(2);
      expect(area.tendencyLabels.de.length).toBe(area.tendencyLabels.en.length);
    }
  });

  it('covers the required 7 keys', () => {
    const keys = LIFE_AREAS.map(a => a.key);
    expect(keys).toContain('freundschaften');
    expect(keys).toContain('liebe');
    expect(keys).toContain('sex_zaertlichkeit');
    expect(keys).toContain('beruf');
    expect(keys).toContain('alltag');
    expect(keys).toContain('karriere');
    expect(keys).toContain('gesundheit');
  });
});

describe('computeLifeAreaScores', () => {
  it('returns 7 scores', () => {
    const sectors = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const scores = computeLifeAreaScores(sectors);
    expect(scores).toHaveLength(7);
  });

  it('returns fallback scores for empty/short input', () => {
    const scores = computeLifeAreaScores([]);
    expect(scores).toHaveLength(7);
    expect(scores[0].score).toBe(0.5);
  });

  it('returns fallback for null input', () => {
    const scores = computeLifeAreaScores(null as any);
    expect(scores).toHaveLength(7);
  });

  it('scores are normalized 0-1', () => {
    const sectors = [0.1, 0.2, 0.3, 0.4, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
    const scores = computeLifeAreaScores(sectors);
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
    }
  });

  it('exactly 3 areas are highlighted', () => {
    const sectors = [0.1, 0.2, 0.3, 0.4, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
    const scores = computeLifeAreaScores(sectors);
    const highlighted = scores.filter(s => s.isHighlighted);
    expect(highlighted).toHaveLength(3);
  });

  it('highlighted areas have rank 1-3', () => {
    const sectors = [0.1, 0.2, 0.3, 0.4, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
    const scores = computeLifeAreaScores(sectors);
    const highlighted = scores.filter(s => s.isHighlighted);
    for (const h of highlighted) {
      expect(h.rank).toBeLessThanOrEqual(3);
    }
  });

  it('ranks are unique 1-7', () => {
    const sectors = [0.1, 0.2, 0.3, 0.4, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
    const scores = computeLifeAreaScores(sectors);
    const ranks = scores.map(s => s.rank).sort();
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('is deterministic', () => {
    const sectors = [0.3, 0.7, 0.1, 0.9, 0.5, 0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.3];
    const a = computeLifeAreaScores(sectors);
    const b = computeLifeAreaScores(sectors);
    expect(a).toEqual(b);
  });

  it('high Leo+Libra sectors boost Liebe area', () => {
    // Leo = index 4, Libra = index 6 → Liebe area
    const sectors = [0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1];
    const scores = computeLifeAreaScores(sectors);
    const liebe = scores.find(s => s.key === 'liebe')!;
    expect(liebe.rank).toBeLessThanOrEqual(2); // Should be top ranked
  });
});

describe('blendSectorsForWeekly', () => {
  it('returns soulprint unchanged when no transit', () => {
    const sp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    expect(blendSectorsForWeekly(sp)).toEqual(sp);
    expect(blendSectorsForWeekly(sp, null)).toEqual(sp);
  });

  it('blends 60/40 when transit provided', () => {
    const sp = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const tr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = blendSectorsForWeekly(sp, tr);
    expect(result[0]).toBeCloseTo(0.6); // 1 * 0.6 + 0 * 0.4
  });

  it('returns 12-element array', () => {
    const sp = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const tr = [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3];
    const result = blendSectorsForWeekly(sp, tr);
    expect(result).toHaveLength(12);
  });
});
