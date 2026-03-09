import { describe, it, expect } from 'vitest';
import {
  circularDistance,
  gaussBell,
  westernToSectors,
  AFFINITY_MAP,
  resolveMarkerToSectors,
  eventToSectorSignals,
  computeFusionSignal,
  SECTOR_COUNT,
} from '@/src/lib/fusion-ring';
import type { ContributionEvent, Marker } from '@/src/lib/lme/types';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeEvent(markers: Array<{ id: string; weight: number }>): ContributionEvent {
  return {
    specVersion: 'sp.contribution.v1',
    eventId: 'test-' + Date.now(),
    occurredAt: new Date().toISOString(),
    source: { vertical: 'quiz', moduleId: 'test' },
    payload: {
      markers: markers.map(m => ({ id: m.id, weight: m.weight })),
    },
  };
}

function peakIndex(arr: number[]): number {
  let maxIdx = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[maxIdx]) maxIdx = i;
  }
  return maxIdx;
}

// ===========================================================================
// 1. Gauss Bell Math
// ===========================================================================
describe('Gauss Bell Math', () => {
  it('gaussBell(4, 4) === 1.0 (identity)', () => {
    expect(gaussBell(4, 4)).toBe(1.0);
  });

  it('gaussBell(3, 4) ~ 0.707 (sigma=1.2, d=1)', () => {
    expect(gaussBell(3, 4)).toBeCloseTo(0.707, 2);
  });

  it('gaussBell(2, 4) ~ 0.249 (d=2)', () => {
    expect(gaussBell(2, 4)).toBeCloseTo(0.249, 2);
  });

  it('circularDistance(0, 11) === 1 (wrap-around)', () => {
    expect(circularDistance(0, 11)).toBe(1);
  });
});

// ===========================================================================
// 2. Western Component
// ===========================================================================
describe('Western Component', () => {
  // Sun=Leo(4), Moon=Pisces(11), Asc=Scorpio(7)
  const W = westernToSectors('leo', 'pisces', 'scorpio');

  it('W(4) ~ 0.50 (sun peak)', () => {
    expect(W[4]).toBeCloseTo(0.50, 1);
  });

  it('W(11) ~ 0.30 (moon peak)', () => {
    expect(W[11]).toBeCloseTo(0.30, 1);
  });

  it('W(7) ~ 0.20 (asc peak)', () => {
    expect(W[7]).toBeCloseTo(0.20, 1);
  });

  it('W(3) has Gauss neighbor influence from sun (~0.35)', () => {
    expect(W[3]).toBeCloseTo(0.35, 1);
  });

  it('all W values >= 0, no NaN', () => {
    for (let s = 0; s < SECTOR_COUNT; s++) {
      expect(W[s]).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(W[s])).toBe(false);
    }
  });
});

// ===========================================================================
// 3. Semantic Marker Resolution
// ===========================================================================
describe('Semantic Marker Resolution', () => {
  it('marker.love.physical_touch (w=0.95) uses keyword-match, S7 is peak', () => {
    const result = resolveMarkerToSectors({ id: 'marker.love.physical_touch', weight: 0.95 });
    expect(result).toHaveLength(12);
    expect(peakIndex(result)).toBe(7);
  });

  it('marker.love.unknown_keyword falls back to domain "love"', () => {
    const result = resolveMarkerToSectors({ id: 'marker.love.unknown_keyword', weight: 0.80 });
    // Should use AFFINITY_MAP['love'], not zeros
    const loveMap = AFFINITY_MAP['love'];
    for (let s = 0; s < SECTOR_COUNT; s++) {
      expect(result[s]).toBeCloseTo(loveMap[s] * 0.80, 5);
    }
  });

  it('marker.xyzzy.foobar returns 12x 0 (unknown)', () => {
    const result = resolveMarkerToSectors({ id: 'marker.xyzzy.foobar', weight: 1.0 });
    expect(result).toHaveLength(12);
    for (const v of result) {
      expect(v).toBe(0);
    }
  });
});

// ===========================================================================
// 4. Proof: Love Languages Event ("Die Flamme")
// ===========================================================================
describe('Proof: Love Languages Event ("Die Flamme")', () => {
  const event = makeEvent([
    { id: 'marker.love.physical_touch',      weight: 0.95 },
    { id: 'marker.love.sensory_connection',  weight: 0.80 },
    { id: 'marker.emotion.body_awareness',   weight: 0.75 },
    { id: 'marker.love.physical_expression', weight: 0.72 },
    { id: 'marker.love.togetherness',        weight: 0.56 },
    { id: 'marker.love.passionate',          weight: 0.68 },
  ]);

  const signal = eventToSectorSignals(event);

  const expected = [0.08, 0.53, 0, 0.15, 0.17, 0, 0.13, 1.00, 0, 0, 0.07, 0.55];

  it('S7 MUST be the absolute peak', () => {
    expect(peakIndex(signal)).toBe(7);
  });

  it.each(
    expected.map((val, idx) => ({ sector: idx, expected: val })),
  )('S$sector ~ $expected (tolerance +-0.05)', ({ sector, expected: exp }) => {
    expect(signal[sector]).toBeCloseTo(exp, 1); // 1 decimal = +-0.05
  });
});

// ===========================================================================
// 5. Proof: Wolf Event
// ===========================================================================
describe('Proof: Wolf Event', () => {
  const event = makeEvent([
    { id: 'marker.social.pack_loyalty',       weight: 0.82 },
    { id: 'marker.instinct.primal_sense',     weight: 0.75 },
    { id: 'marker.leadership.servant_leader', weight: 0.68 },
  ]);

  const signal = eventToSectorSignals(event);

  it('S10 must be the peak (1.00)', () => {
    expect(peakIndex(signal)).toBe(10);
    expect(signal[10]).toBeCloseTo(1.00, 1);
  });

  it('S0 ~ 0.91', () => {
    expect(signal[0]).toBeCloseTo(0.91, 1);
  });

  it('S11 ~ 0.91', () => {
    expect(signal[11]).toBeCloseTo(0.91, 1);
  });

  it('S9 ~ 0.83', () => {
    expect(signal[9]).toBeCloseTo(0.83, 1);
  });
});

// ===========================================================================
// 6. Master Formula (no completed quizzes)
// ===========================================================================
describe('Master Formula (no completed quizzes)', () => {
  it('T = 12x0 → weights are 0.375/0.375/0.25/0.0', () => {
    const W = new Array(12).fill(0.5);
    const B = new Array(12).fill(0.3);
    const X = new Array(12).fill(0.2);
    const T = new Array(12).fill(0);

    const result = computeFusionSignal(W, B, X, T, 0, 0);

    expect(result.weights).toEqual({ w1: 0.375, w2: 0.375, w3: 0.25, w4: 0.0 });
  });

  it('T contribution is zero when no quizzes completed', () => {
    const W = new Array(12).fill(0);
    W[0] = 1.0;
    const B = new Array(12).fill(0);
    B[6] = 1.0;
    const X = new Array(12).fill(0);
    X[3] = 1.0;
    const T = new Array(12).fill(0);
    T[9] = 99; // should be ignored

    const result = computeFusionSignal(W, B, X, T, 0, 0);
    expect(result.weights.w4).toBe(0.0);

    // Compute expected S9 without T contribution
    const resultWithoutT = computeFusionSignal(W, B, X, new Array(12).fill(0), 0, 0);
    expect(result.sectors[9]).toBeCloseTo(resultWithoutT.sectors[9], 10);
  });
});

// ===========================================================================
// 7. Opposition Tension
// ===========================================================================
describe('Opposition Tension', () => {
  it('strong S0 signal creates negative offset on S6 (-0.15 * S0)', () => {
    const W = new Array(12).fill(0);
    W[0] = 1.0; // strong Aries
    const B = new Array(12).fill(0);
    const X = new Array(12).fill(0);
    const T = new Array(12).fill(0);

    const result = computeFusionSignal(W, B, X, T, 0, 0);

    // S0 raw = 0.375 * 1.0 = 0.375
    // S6 (Libra) is opposition of S0 (Aries), opp factor = 0.15
    // S6 gets tension offset: -raw[0] * 0.15 = -0.375 * 0.15
    // So S6 should be negative (before smoothing can pull it slightly)
    // The final value at S6 should be less than 0
    expect(result.sectors[6]).toBeLessThan(0);
  });
});

// ===========================================================================
// 8. AFFINITY_MAP Integrity
// ===========================================================================
describe('AFFINITY_MAP Integrity', () => {
  const entries = Object.entries(AFFINITY_MAP);

  it.each(entries)('row "%s" sums to ~1.0 (tolerance +-0.15)', (key, row) => {
    expect(row).toHaveLength(12);
    const sum = row.reduce((a, b) => a + b, 0);
    // Some rows (social, leadership) sum to 0.9 — accept +-0.15 to catch gross errors
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.15);
  });

  it.each(entries)('row "%s" has no negative values', (key, row) => {
    for (const v of row) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(entries)('row "%s" has exactly 12 entries', (key, row) => {
    expect(row).toHaveLength(12);
  });
});
