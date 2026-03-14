import type { DimensionKey, DimensionVector } from './types';

export const DIMENSION_KEYS: readonly DimensionKey[] = [
  'passion', 'stability', 'future', 'connection', 'autonomy',
] as const;

export const DIMENSION_COUNT = 5;

export function zeroDimensions(): DimensionVector {
  return { passion: 0, stability: 0, future: 0, connection: 0, autonomy: 0 };
}

export function clampVector(v: DimensionVector): DimensionVector {
  const out = { ...v };
  for (const k of DIMENSION_KEYS) {
    out[k] = Math.max(0, Math.min(1, out[k]));
  }
  return out;
}

export function normalizeVector(v: DimensionVector): DimensionVector {
  const max = Math.max(...DIMENSION_KEYS.map(k => Math.abs(v[k])));
  if (max === 0) return zeroDimensions();
  const out = { ...v };
  for (const k of DIMENSION_KEYS) {
    out[k] = v[k] / max;
  }
  return out;
}

export function cosineSimilarity(a: DimensionVector, b: DimensionVector): number {
  let dot = 0, magA = 0, magB = 0;
  for (const k of DIMENSION_KEYS) {
    dot  += a[k] * b[k];
    magA += a[k] * a[k];
    magB += b[k] * b[k];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return Math.max(0, Math.min(1, dot / denom));
}

export function normalizedDistance(a: DimensionVector, b: DimensionVector): number {
  let sum = 0;
  for (const k of DIMENSION_KEYS) {
    const d = a[k] - b[k];
    sum += d * d;
  }
  return Math.sqrt(sum) / Math.sqrt(DIMENSION_COUNT);
}

export function blendVectors(a: DimensionVector, b: DimensionVector, weightA: number): DimensionVector {
  const weightB = 1 - weightA;
  const out = zeroDimensions();
  for (const k of DIMENSION_KEYS) {
    out[k] = a[k] * weightA + b[k] * weightB;
  }
  return out;
}
