import type { ChladniParams, WuxingElement } from './bazi-to-chladni';

const DEFAULT_SECTORS = new Array(12).fill(0.5);
const ELEMENTS: WuxingElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeSectors(sectors?: number[] | null): number[] {
  if (!sectors || sectors.length !== 12) return DEFAULT_SECTORS;
  return sectors.map(clamp01);
}

export function sectorsToChladniParams(sectors?: number[] | null): ChladniParams {
  const normalized = normalizeSectors(sectors);

  const m = 2 + Math.round(((normalized[0] + normalized[3]) / 2) * 4);
  const n = 2 + Math.round(((normalized[6] + normalized[9]) / 2) * 4);
  const harmonyIndex = clamp01(normalized.reduce((acc, value) => acc + value, 0) / normalized.length);

  const a = 0.3 + harmonyIndex * 0.7;
  const b = 1.0 - a * 0.6;

  const elementBuckets = ELEMENTS.map((_, idx) =>
    normalized.filter((__, sectorIdx) => sectorIdx % 5 === idx).reduce((acc, value) => acc + value, 0)
  );
  const dominantElement = ELEMENTS[elementBuckets.indexOf(Math.max(...elementBuckets))] ?? 'Water';

  return {
    m,
    n,
    a,
    b,
    dominantElement,
    harmonyIndex,
  };
}

const V3_DIMENSIONS = ['wood', 'fire', 'earth', 'metal', 'water', 'yin', 'yang', 'resonance', 'focus', 'flow', 'depth', 'spark'] as const;

export function dimensionWeightsToChladniParams(weights?: Record<string, number> | null): ChladniParams {
  if (!weights) return sectorsToChladniParams(DEFAULT_SECTORS);

  const sectors = V3_DIMENSIONS.map((key) => clamp01(weights[key] ?? 0.5));
  return sectorsToChladniParams(sectors);
}
