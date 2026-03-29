/**
 * S-BRIDGE: DIMENSION_DEFS Contract & Bridge Function Tests
 *
 * Guard-tests for REQ-F-signatur-shared-bridge and REQ-F-signatur-determinism.
 * Covers TASK-sbridge-dim-contract, TASK-sbridge-hz-constants, TASK-sbridge-bridge-contract.
 *
 * These tests are intentionally strict — they FAIL on unintended changes.
 * To update Hz values: change dimension-defs.ts, update EXPECTED_HZ/SPEC_HZ below,
 * and update SWIFT_CONSTANTS.md. All three must stay in sync.
 */

import { describe, it, expect } from 'vitest';
import {
  DIMENSION_DEFS,
  EXPECTED_HZ,
  EXPECTED_BASE_ANGLES,
  type DimensionDef,
} from '@/packages/shared/src/signatur/dimension-defs';
import {
  soulprintToNatalWeights,
  soulprintToDimensionWeights,
  quizSectorsToQuizWeights,
} from '@/packages/shared/src/signatur/signatur-bridge';

// ─── TASK-sbridge-dim-contract ────────────────────────────────────────────────

describe('DIMENSION_DEFS contract (TASK-sbridge-dim-contract)', () => {
  it('has exactly 6 dimensions', () => {
    expect(DIMENSION_DEFS).toHaveLength(6);
  });

  it('produces exactly 12 poles (2 per dimension)', () => {
    expect(DIMENSION_DEFS.length * 2).toBe(12);
  });

  it('all Hz values are unique', () => {
    const hzValues = DIMENSION_DEFS.map((d: DimensionDef) => d.hz);
    expect(new Set(hzValues).size).toBe(6);
  });

  it('all ids are unique and non-empty', () => {
    const ids = DIMENSION_DEFS.map((d: DimensionDef) => d.id);
    expect(new Set(ids).size).toBe(6);
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('all pole labels are non-empty', () => {
    for (const dim of DIMENSION_DEFS) {
      expect(dim.poleA.length).toBeGreaterThan(0);
      expect(dim.poleB.length).toBeGreaterThan(0);
    }
  });

  it('all colorA and colorB RGB components are in [0, 1]', () => {
    for (const dim of DIMENSION_DEFS) {
      for (const component of [...dim.colorA, ...dim.colorB]) {
        expect(component).toBeGreaterThanOrEqual(0);
        expect(component).toBeLessThanOrEqual(1);
      }
    }
  });

  it('base angles are exactly [0, π/3, 2π/3, π, 4π/3, 5π/3]', () => {
    const expectedAngles = [
      0,
      Math.PI / 3,
      (2 * Math.PI) / 3,
      Math.PI,
      (4 * Math.PI) / 3,
      (5 * Math.PI) / 3,
    ];
    DIMENSION_DEFS.forEach((dim: DimensionDef, i: number) => {
      expect(dim.baseAngle).toBeCloseTo(expectedAngles[i]!, 10);
    });
  });

  it('dimensions are in the expected zodiac order (assertion 0° → discipline 300°)', () => {
    const expectedOrder = ['assertion', 'empathy', 'creativity', 'logic', 'intuition', 'discipline'];
    expect(DIMENSION_DEFS.map((d: DimensionDef) => d.id)).toEqual(expectedOrder);
  });

  it('EXPECTED_HZ lookup matches DIMENSION_DEFS hz values', () => {
    for (const dim of DIMENSION_DEFS) {
      expect(EXPECTED_HZ[dim.id]).toBeCloseTo(dim.hz, 2);
    }
  });

  it('EXPECTED_BASE_ANGLES lookup matches DIMENSION_DEFS baseAngle values', () => {
    for (const dim of DIMENSION_DEFS) {
      expect(EXPECTED_BASE_ANGLES[dim.id]).toBeCloseTo(dim.baseAngle, 10);
    }
  });
});

// ─── TASK-sbridge-hz-constants — Guard test ───────────────────────────────────

describe('Hz guard-test (TASK-sbridge-hz-constants)', () => {
  /**
   * SPEC values from SIGNATUR_V3_VISION.md — Cousto cosmic octave.
   * If this test fails, update dimension-defs.ts AND SWIFT_CONSTANTS.md.
   */
  const SPEC_HZ: Record<string, number> = {
    assertion:  144.72,   // Mars
    empathy:    210.42,   // Moon — fastest (highest Hz)
    creativity: 126.22,   // Sun — slowest (lowest Hz)
    logic:      141.27,   // Mercury
    intuition:  183.58,   // Jupiter
    discipline: 147.85,   // Saturn
  };

  it('all Hz values match Cousto cosmic octave spec', () => {
    for (const [id, expectedHz] of Object.entries(SPEC_HZ)) {
      const dim = DIMENSION_DEFS.find((d: DimensionDef) => d.id === id);
      expect(dim, `Dimension "${id}" not found in DIMENSION_DEFS`).toBeDefined();
      expect(dim!.hz).toBeCloseTo(expectedHz, 2);
    }
  });

  it('Moon (empathy) has the highest Hz — fastest pole', () => {
    const moon = DIMENSION_DEFS.find((d: DimensionDef) => d.id === 'empathy')!;
    const maxHz = Math.max(...DIMENSION_DEFS.map((d: DimensionDef) => d.hz));
    expect(moon.hz).toBe(maxHz);
  });

  it('Sun (creativity) has the lowest Hz — slowest pole', () => {
    const sun = DIMENSION_DEFS.find((d: DimensionDef) => d.id === 'creativity')!;
    const minHz = Math.min(...DIMENSION_DEFS.map((d: DimensionDef) => d.hz));
    expect(sun.hz).toBe(minHz);
  });
});

// ─── TASK-sbridge-bridge-contract ────────────────────────────────────────────

describe('Bridge function contract (TASK-sbridge-bridge-contract)', () => {
  const TWELVE_ZEROS  = Array(12).fill(0) as number[];
  const TWELVE_HALVES = Array(12).fill(0.5) as number[];
  const TWELVE_ONES   = Array(12).fill(1) as number[];
  const MIXED         = [0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4, 0.6, 0.15, 0.85, 0.45];

  describe('quizSectorsToQuizWeights', () => {
    it('produces all 6 dimension keys', () => {
      const result = quizSectorsToQuizWeights(TWELVE_HALVES);
      const keys = Object.keys(result).sort();
      expect(keys).toEqual(['assertion', 'creativity', 'discipline', 'empathy', 'intuition', 'logic']);
    });

    it('all outputs in [0, 1] for typical input', () => {
      for (const v of Object.values(quizSectorsToQuizWeights(TWELVE_HALVES))) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it('uniform 0.5 input → all outputs 0.5', () => {
      for (const v of Object.values(quizSectorsToQuizWeights(TWELVE_HALVES))) {
        expect(v).toBeCloseTo(0.5, 10);
      }
    });

    it('uniform 1.0 input → all outputs 1.0', () => {
      for (const v of Object.values(quizSectorsToQuizWeights(TWELVE_ONES))) {
        expect(v).toBeCloseTo(1.0, 10);
      }
    });

    it('empty array falls back to 0.5 for all outputs', () => {
      for (const v of Object.values(quizSectorsToQuizWeights([]))) {
        expect(v).toBeCloseTo(0.5, 10);
      }
    });

    it('is deterministic — same input always produces same output', () => {
      const r1 = quizSectorsToQuizWeights(MIXED);
      const r2 = quizSectorsToQuizWeights(MIXED);
      expect(r1).toEqual(r2);
    });

    it('clamps over-range input (>1) to 1.0', () => {
      const over = quizSectorsToQuizWeights(Array(12).fill(1.5) as number[]);
      for (const v of Object.values(over)) {
        expect(v).toBeLessThanOrEqual(1.0);
        expect(v).toBeCloseTo(1.0, 10);
      }
    });

    it('clamps negative input (<0) to 0.0', () => {
      const neg = quizSectorsToQuizWeights(Array(12).fill(-0.5) as number[]);
      for (const v of Object.values(neg)) {
        expect(v).toBeGreaterThanOrEqual(0.0);
        expect(v).toBeCloseTo(0.0, 10);
      }
    });

    it('clamps mixed over/under-range fallback to [0,1]', () => {
      // Sectors where mapped indices (0,3,4,5,8,9) are > 1
      const mixed = Array(12).fill(0) as number[];
      mixed[0] = 2.0; mixed[3] = -1.0; mixed[4] = 1.8;
      mixed[5] = 0.5; mixed[8] = 1.1; mixed[9] = -0.3;
      const result = quizSectorsToQuizWeights(mixed);
      for (const v of Object.values(result)) {
        expect(v).toBeGreaterThanOrEqual(0.0);
        expect(v).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('soulprintToDimensionWeights', () => {
    it('all outputs in [0, 1]', () => {
      for (const v of Object.values(soulprintToDimensionWeights(TWELVE_HALVES))) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it('uses the same sector-to-dimension mapping as quizSectorsToQuizWeights', () => {
      expect(soulprintToDimensionWeights(MIXED)).toEqual(quizSectorsToQuizWeights(MIXED));
    });

    it('empty array falls back to 0.5', () => {
      for (const v of Object.values(soulprintToDimensionWeights([]))) {
        expect(v).toBeCloseTo(0.5, 10);
      }
    });
  });

  describe('soulprintToNatalWeights (7-planet bridge)', () => {
    it('produces exactly 7 planet weight keys', () => {
      expect(Object.keys(soulprintToNatalWeights(TWELVE_HALVES))).toHaveLength(7);
    });

    it('all outputs in [0, 1]', () => {
      for (const v of Object.values(soulprintToNatalWeights(TWELVE_HALVES))) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it('uniform 0.5 input → all outputs 0.5', () => {
      for (const v of Object.values(soulprintToNatalWeights(TWELVE_HALVES))) {
        expect(v).toBeCloseTo(0.5, 10);
      }
    });

    it('zero input → no NaN outputs', () => {
      for (const v of Object.values(soulprintToNatalWeights(TWELVE_ZEROS))) {
        expect(isNaN(v)).toBe(false);
        expect(v).toBeCloseTo(0, 10);
      }
    });

    it('clamps over-range input (>1) to 1.0', () => {
      const over = soulprintToNatalWeights(Array(12).fill(1.8) as number[]);
      for (const v of Object.values(over)) {
        expect(v).toBeLessThanOrEqual(1.0);
      }
    });

    it('clamps negative input (<0) to 0.0', () => {
      const neg = soulprintToNatalWeights(Array(12).fill(-0.5) as number[]);
      for (const v of Object.values(neg)) {
        expect(v).toBeGreaterThanOrEqual(0.0);
      }
    });
  });
});
