import { SECTOR_COUNT, SECTORS, OPPOSITION_FACTOR, NEIGHBOR_PULL } from './constants';
import { powerCurve } from './math';

export type FusionRingSignal = {
  sectors: number[];
  components: {
    W: number[];
    B: number[];
    X: number[];
    T: number[];
  };
  weights: { w1: number; w2: number; w3: number; w4: number };
  peakSectors: number[];
  resolution: number;
};

/**
 * Masterformel:
 *   Signal(s) = w1·W(s) + w2·B(s) + w3·X(s) + w4·T(s)
 */
export function computeFusionSignal(
  W: number[],
  B: number[],
  X: number[],
  T: number[],
  completedTests: number,
  totalTests: number,
): FusionRingSignal {
  const hasTests = completedTests > 0 && T.some(v => v !== 0);
  const weights = hasTests
    ? { w1: 0.30, w2: 0.30, w3: 0.20, w4: 0.20 }
    : { w1: 0.375, w2: 0.375, w3: 0.25, w4: 0.0 };

  const raw = new Array(SECTOR_COUNT).fill(0);
  for (let s = 0; s < SECTOR_COUNT; s++) {
    raw[s] = weights.w1 * (W[s] ?? 0)
           + weights.w2 * (B[s] ?? 0)
           + weights.w3 * (X[s] ?? 0)
           + weights.w4 * (T[s] ?? 0);
  }

  const withTension = [...raw];
  for (let s = 0; s < SECTOR_COUNT; s++) {
    const opp = SECTORS[s].opp;
    withTension[s] += -raw[opp] * OPPOSITION_FACTOR;
  }

  const smoothed = [...withTension];
  for (let s = 0; s < SECTOR_COUNT; s++) {
    const prev = (s - 1 + SECTOR_COUNT) % SECTOR_COUNT;
    const next = (s + 1) % SECTOR_COUNT;
    const avg = (withTension[prev] + withTension[next]) / 2;
    smoothed[s] += (avg - withTension[s]) * NEIGHBOR_PULL;
  }

  const indexed = smoothed.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => b.val - a.val);
  const peakSectors = indexed.slice(0, 3).map(e => e.idx);

  return {
    sectors: smoothed,
    components: { W, B, X, T },
    weights,
    peakSectors,
    resolution: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0,
  };
}
