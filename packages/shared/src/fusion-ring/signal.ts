import { NEIGHBOR_PULL, OPPOSITION_FACTOR, SECTOR_COUNT, SECTORS } from "./constants";

export type FusionRingSignal = {
  sectors: number[];
  components: {
    western: number[];
    bazi: number[];
    wuxing: number[];
    quiz: number[];
  };
  weights: { w1: number; w2: number; w3: number; w4: number };
  peakSectors: number[];
  resolution: number;
};

export function computeFusionSignal(
  western: number[],
  bazi: number[],
  wuxing: number[],
  quiz: number[],
  completedTests: number,
  totalTests: number,
): FusionRingSignal {
  const hasQuizSignals = completedTests > 0 && quiz.some((value) => value !== 0);
  const weights = hasQuizSignals
    ? { w1: 0.3, w2: 0.3, w3: 0.2, w4: 0.2 }
    : { w1: 0.375, w2: 0.375, w3: 0.25, w4: 0 };

  const raw = new Array(SECTOR_COUNT).fill(0);
  for (let index = 0; index < SECTOR_COUNT; index += 1) {
    raw[index] =
      weights.w1 * (western[index] ?? 0) +
      weights.w2 * (bazi[index] ?? 0) +
      weights.w3 * (wuxing[index] ?? 0) +
      weights.w4 * (quiz[index] ?? 0);
  }

  const withOpposition = [...raw];
  for (let index = 0; index < SECTOR_COUNT; index += 1) {
    const opp = SECTORS[index].opp;
    withOpposition[index] += -raw[opp] * OPPOSITION_FACTOR;
  }

  const smoothed = [...withOpposition];
  for (let index = 0; index < SECTOR_COUNT; index += 1) {
    const prev = (index - 1 + SECTOR_COUNT) % SECTOR_COUNT;
    const next = (index + 1) % SECTOR_COUNT;
    const avg = (withOpposition[prev] + withOpposition[next]) / 2;
    smoothed[index] += (avg - withOpposition[index]) * NEIGHBOR_PULL;
  }

  const peakSectors = smoothed
    .map((value, idx) => ({ value, idx }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((entry) => entry.idx);

  return {
    sectors: smoothed,
    components: { western, bazi, wuxing, quiz },
    weights,
    peakSectors,
    resolution: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0,
  };
}
