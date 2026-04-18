import { describe, it, expect } from 'vitest';
import {
  soulprintToNatalWeights,
  quizSectorsToQuizWeights,
} from '@/packages/shared/src/signatur/signatur-bridge';

describe('soulprintToNatalWeights', () => {
  it('returns weights for all 7 planets', () => {
    const sectors = [0.6, 0.45, 0.7, 0.55, 0.9, 0.65, 0.5, 0.8, 0.75, 0.4, 0.35, 0.6];
    const weights = soulprintToNatalWeights(sectors);

    expect(Object.keys(weights)).toHaveLength(7);
    expect(weights).toHaveProperty('Sun');
    expect(weights).toHaveProperty('Moon');
    expect(weights).toHaveProperty('Mercury');
    expect(weights).toHaveProperty('Venus');
    expect(weights).toHaveProperty('Mars');
    expect(weights).toHaveProperty('Jupiter');
    expect(weights).toHaveProperty('Saturn');
  });

  it('maps Leo sector to Sun', () => {
    const sectors = Array(12).fill(0.5);
    sectors[4] = 0.95; // Leo
    const weights = soulprintToNatalWeights(sectors);
    expect(weights.Sun).toBeCloseTo(0.95, 2);
  });

  it('averages multi-sector planets', () => {
    const sectors = Array(12).fill(0.5);
    sectors[2] = 0.8; // Gemini
    sectors[5] = 0.6; // Virgo
    const weights = soulprintToNatalWeights(sectors);
    expect(weights.Mercury).toBeCloseTo(0.7, 2);
  });

  it('clamps missing sectors to 0.5', () => {
    const short = [0.3, 0.4, 0.5];
    const weights = soulprintToNatalWeights(short);
    expect(weights.Sun).toBeCloseTo(0.5, 2);
  });

  it('all values are between 0 and 1', () => {
    const sectors = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.55];
    const weights = soulprintToNatalWeights(sectors);
    for (const v of Object.values(weights)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('quizSectorsToQuizWeights', () => {
  it('returns 6 quiz dimensions', () => {
    const sectors = Array(12).fill(0.5);
    const weights = quizSectorsToQuizWeights(sectors);
    expect(Object.keys(weights)).toHaveLength(6);
    expect(weights).toHaveProperty('assertion');
    expect(weights).toHaveProperty('empathy');
    expect(weights).toHaveProperty('logic');
    expect(weights).toHaveProperty('intuition');
    expect(weights).toHaveProperty('creativity');
    expect(weights).toHaveProperty('discipline');
  });

  it('maps specific sectors to dimensions', () => {
    const sectors = Array(12).fill(0.5);
    sectors[0] = 0.9;
    sectors[4] = 0.85;
    const weights = quizSectorsToQuizWeights(sectors);
    expect(weights.assertion).toBeCloseTo(0.9, 2);
    expect(weights.creativity).toBeCloseTo(0.85, 2);
  });
});
