import { describe, it, expect } from 'vitest';
import { soulprintToPlanetWeights } from '../soulprint-to-planets';
import type { PlanetName } from '../planets';

const ALL_PLANETS: readonly PlanetName[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;

/** Sum numeric values of a planet-weight record. */
const sumValues = (r: Record<PlanetName, number>): number =>
  ALL_PLANETS.reduce((acc, p) => acc + r[p], 0);

describe('soulprintToPlanetWeights', () => {
  it('throws when given fewer than 12 sectors', () => {
    expect(() => soulprintToPlanetWeights([])).toThrow(
      /expects 12 sectors, got 0/,
    );
    expect(() => soulprintToPlanetWeights([1, 2, 3])).toThrow(
      /expects 12 sectors, got 3/,
    );
  });

  it('throws when given more than 12 sectors', () => {
    const thirteen: number[] = new Array(13).fill(0);
    expect(() => soulprintToPlanetWeights(thirteen)).toThrow(
      /expects 12 sectors, got 13/,
    );
  });

  it('maps an all-zero input to an all-zero output', () => {
    const zeros: number[] = new Array(12).fill(0);
    const result = soulprintToPlanetWeights(zeros);
    for (const planet of ALL_PLANETS) {
      expect(result[planet]).toBe(0);
    }
  });

  it('preserves total weight for a uniform input (rows sum to 1.0)', () => {
    const uniform: number[] = new Array(12).fill(1);
    const result = soulprintToPlanetWeights(uniform);
    // Each sector row sums to 1.0 → 12 sectors × 1.0 weight each = 12.0 total.
    expect(sumValues(result)).toBeCloseTo(12, 10);
  });

  it('routes Aries (sector 0) to Mars (0.7) + Pluto (0.3)', () => {
    const ariesOnly: number[] = new Array(12).fill(0);
    ariesOnly[0] = 1;
    const result = soulprintToPlanetWeights(ariesOnly);
    expect(result.Mars).toBeCloseTo(0.7, 10);
    expect(result.Pluto).toBeCloseTo(0.3, 10);
    // All other planets must be exactly 0.
    for (const planet of ALL_PLANETS) {
      if (planet !== 'Mars' && planet !== 'Pluto') {
        expect(result[planet]).toBe(0);
      }
    }
  });

  it('routes Cancer (sector 3) exclusively to the Moon', () => {
    const cancerOnly: number[] = new Array(12).fill(0);
    cancerOnly[3] = 1;
    const result = soulprintToPlanetWeights(cancerOnly);
    expect(result.Moon).toBeCloseTo(1.0, 10);
    for (const planet of ALL_PLANETS) {
      if (planet !== 'Moon') {
        expect(result[planet]).toBe(0);
      }
    }
  });

  it('is deterministic — same input yields identical output across calls', () => {
    const input: number[] = [0.1, 0.2, 0.05, 0.3, 0.15, 0.0, 0.4, 0.25, 0.1, 0.33, 0.08, 0.12];
    const a = soulprintToPlanetWeights(input);
    const b = soulprintToPlanetWeights(input);
    for (const planet of ALL_PLANETS) {
      expect(a[planet]).toBe(b[planet]);
    }
  });

  it('always returns all 10 planet keys regardless of input sparsity', () => {
    const sparse: number[] = new Array(12).fill(0);
    sparse[4] = 1; // Leo → Sun only
    const result = soulprintToPlanetWeights(sparse);
    const keys = Object.keys(result).sort();
    const expected = [...ALL_PLANETS].sort();
    expect(keys).toEqual(expected);
  });
});
