import type { ApiData } from '@/src/types/bafe';
import type { ProjectedSignal, DimensionVector } from './types';
import { zeroDimensions, clampVector, DIMENSION_KEYS } from './dimensions';

/**
 * Natal Projection — BAFE natal data → 5D dimension space
 * Internal heuristic abstraction v1. NOT a canonical astrological ontology.
 */

const ELEMENT_DIMENSION_MAP: Record<string, Partial<DimensionVector>> = {
  Fire:  { passion: 0.8, stability: 0.1, future: 0.2, connection: 0.3, autonomy: 0.6 },
  Earth: { passion: 0.2, stability: 0.8, future: 0.3, connection: 0.7, autonomy: 0.2 },
  Metal: { passion: 0.1, stability: 0.6, future: 0.7, connection: 0.2, autonomy: 0.5 },
  Water: { passion: 0.3, stability: 0.3, future: 0.6, connection: 0.8, autonomy: 0.3 },
  Wood:  { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.4, autonomy: 0.7 },
};

const SIGN_ELEMENT: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Metal', Libra: 'Metal', Aquarius: 'Metal',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

function signToDimensions(sign: string | undefined): DimensionVector {
  if (!sign) return zeroDimensions();
  const element = SIGN_ELEMENT[sign];
  if (!element) return zeroDimensions();
  const affinity = ELEMENT_DIMENSION_MAP[element];
  if (!affinity) return zeroDimensions();
  const out = zeroDimensions();
  for (const k of DIMENSION_KEYS) {
    out[k] = affinity[k] ?? 0;
  }
  return out;
}

function elementCountsToDimensions(elements: Record<string, number> | undefined): DimensionVector {
  if (!elements) return zeroDimensions();
  const total = Object.values(elements).reduce((s, v) => s + v, 0);
  if (total === 0) return zeroDimensions();
  const out = zeroDimensions();
  for (const [elem, count] of Object.entries(elements)) {
    const ratio = count / total;
    const affinity = ELEMENT_DIMENSION_MAP[elem];
    if (!affinity) continue;
    for (const k of DIMENSION_KEYS) {
      out[k] += ratio * (affinity[k] ?? 0);
    }
  }
  return out;
}

function baziToDimensions(bazi: ApiData['bazi']): DimensionVector {
  if (!bazi?.pillars) return zeroDimensions();
  const out = zeroDimensions();
  const weights = { day: 0.40, year: 0.25, month: 0.20, hour: 0.15 };
  for (const [pillar, weight] of Object.entries(weights)) {
    const p = bazi.pillars[pillar as keyof typeof bazi.pillars];
    if (!p?.element) continue;
    const affinity = ELEMENT_DIMENSION_MAP[p.element];
    if (!affinity) continue;
    for (const k of DIMENSION_KEYS) {
      out[k] += weight * (affinity[k] ?? 0);
    }
  }
  return out;
}

export function projectNatal(apiData: ApiData): ProjectedSignal {
  let sources = 0;
  const totalSources = 3;

  const sunD = signToDimensions(apiData.western?.zodiac_sign);
  const moonD = signToDimensions(apiData.western?.moon_sign);
  const ascD = signToDimensions(apiData.western?.ascendant_sign);
  const western = zeroDimensions();
  const hasWestern = !!(
    apiData.western?.zodiac_sign ||
    apiData.western?.moon_sign ||
    apiData.western?.ascendant_sign
  );
  if (hasWestern) {
    sources++;
    for (const k of DIMENSION_KEYS) {
      western[k] = 0.50 * sunD[k] + 0.30 * moonD[k] + 0.20 * ascD[k];
    }
  }

  const bazi = baziToDimensions(apiData.bazi);
  const hasBazi = !!(apiData.bazi?.pillars);
  if (hasBazi) sources++;

  const wuxing = elementCountsToDimensions(apiData.wuxing?.elements);
  const hasWuxing = !!(apiData.wuxing?.elements);
  if (hasWuxing) sources++;

  const dimensions = zeroDimensions();
  if (sources === 0) {
    return { signal_type: 'natal', dimensions, projection_mode: 'heuristic_v1', coverage: 0 };
  }

  for (const k of DIMENSION_KEYS) {
    let sum = 0;
    if (hasWestern) sum += western[k];
    if (hasBazi) sum += bazi[k];
    if (hasWuxing) sum += wuxing[k];
    dimensions[k] = sum / sources;
  }

  return {
    signal_type: 'natal',
    dimensions: clampVector(dimensions),
    projection_mode: 'heuristic_v1',
    coverage: sources / totalSources,
  };
}
