import { describe, expect, it } from 'vitest';
import { soulprintToNatalWeights, quizSectorsToQuizWeights } from '@/src/components/fusion-ring-website/signatur-bridge';
import {
  hasFullSectorSet,
  toNatalWeightsOrUndefined,
  toQuizWeightsOrUndefined,
} from '@/src/lib/signatur/weight-utils';

describe('signatur weight utils', () => {
  const sectors = Array(12).fill(0.5) as number[];

  it('hasFullSectorSet only accepts 12 sectors', () => {
    expect(hasFullSectorSet(sectors)).toBe(true);
    expect(hasFullSectorSet([])).toBe(false);
    expect(hasFullSectorSet(null)).toBe(false);
    expect(hasFullSectorSet(undefined)).toBe(false);
    expect(hasFullSectorSet(Array(11).fill(0.5) as number[])).toBe(false);
  });

  it('toNatalWeightsOrUndefined delegates to shared bridge for valid sectors', () => {
    expect(toNatalWeightsOrUndefined(sectors)).toEqual(soulprintToNatalWeights(sectors));
    expect(toNatalWeightsOrUndefined(null)).toBeUndefined();
    expect(toNatalWeightsOrUndefined(Array(11).fill(0.5) as number[])).toBeUndefined();
  });

  it('toQuizWeightsOrUndefined delegates to shared bridge for valid sectors', () => {
    expect(toQuizWeightsOrUndefined(sectors)).toEqual(quizSectorsToQuizWeights(sectors));
    expect(toQuizWeightsOrUndefined(undefined)).toBeUndefined();
    expect(toQuizWeightsOrUndefined(Array(13).fill(0.5) as number[])).toBeUndefined();
  });
});
