/**
 * Phase H7 — Adapter: BaZi pillars + Wu-Xing elements → 10 Cousto planet weights.
 *
 * Pure, deterministic, side-effect-free. No randomness, no time, no I/O.
 *
 * This adapter replaces the previous `signalData.baseSignals` → `soulprintToPlanetWeights`
 * pipeline for the 3D SignatureSphere. The transit-state hook occasionally delivered
 * null / neutral data on initial mount, causing every user to see the same 0.5-uniform
 * sphere. The BaZi data source used here (same one that already powers the 2D
 * Cymatics renderer via `baziToChladniParams`) is loaded synchronously with the
 * page via AppLayoutContext → user-specific weights are always available once
 * apiData has resolved.
 *
 * Mapping logic:
 *   1. Baseline: each planet inherits the weight of its Wu-Xing element from the
 *      user's elemental distribution (`apiData.wuxing.elements`).
 *   2. Pillar boosts: each of the 4 BaZi pillars adds element-weighted energy
 *      (day 0.40, year 0.25, month 0.20, hour 0.15) to planets matching that
 *      pillar's element.
 *   3. Normalize by max so the highest-weighted planet = 1.0.
 *
 * Result domain: Record<PlanetName, number> with all 10 keys, values in [0, 1].
 */

import { PLANETS, type PlanetName, type WuxingElement } from './planets';
import type { MappedBazi, MappedWuxing } from '../../types/bafe';

/**
 * Relative importance of the four BaZi pillars, following the same
 * weighting used in `computeNatalDimensions` on the server (day is the
 * "day master" → most formative).
 */
const PILLAR_WEIGHTS = {
  day: 0.40,
  year: 0.25,
  month: 0.20,
  hour: 0.15,
} as const;

/**
 * Multiplier applied to the pillar boost when added on top of the
 * wuxing baseline. 0.5 means a pillar's element match adds up to 50%
 * of the pillar's positional weight on top of the baseline — enough to
 * create visible differentiation without dominating.
 */
const PILLAR_BOOST_SCALE = 0.5;

/**
 * Fallback baseline when wuxing has no reading for a given element —
 * keeps all 10 planets at a low but non-zero weight so the sphere stays
 * coherent rather than collapsing toward a flat shape.
 */
const MIN_BASELINE = 0.1;

/**
 * Neutral fallback weights when bazi or wuxing data is missing entirely.
 * Slight variation across planets so even the fallback produces a
 * recognisable sphere rather than a perfectly uniform one.
 */
export const NEUTRAL_BAZI_WEIGHTS: Readonly<Record<PlanetName, number>> = Object.freeze({
  Sun: 0.55,
  Moon: 0.55,
  Mercury: 0.45,
  Venus: 0.50,
  Mars: 0.55,
  Jupiter: 0.50,
  Saturn: 0.45,
  Uranus: 0.40,
  Neptune: 0.45,
  Pluto: 0.40,
});

/**
 * Derive 10-planet weights from BaZi + Wu-Xing data.
 *
 * @param bazi   - User's BaZi pillars (from apiData.bazi). When undefined, only
 *                 wuxing is used for baseline; no pillar boosts applied.
 * @param wuxing - User's Wu-Xing element distribution (from apiData.wuxing).
 *                 When undefined, NEUTRAL_BAZI_WEIGHTS is returned.
 * @returns Record keyed by every PlanetName — all 10 keys always present,
 *          values in [0, 1], max element always = 1.0 when any data present.
 */
export function baziToPlanetWeights(
  bazi: MappedBazi | undefined,
  wuxing: MappedWuxing | undefined,
): Record<PlanetName, number> {
  const wuxingWeights = wuxing?.elements;
  if (!wuxingWeights || Object.keys(wuxingWeights).length === 0) {
    // No elemental data at all — return the neutral profile.
    return { ...NEUTRAL_BAZI_WEIGHTS };
  }

  // Step 1: baseline from wuxing element distribution.
  const result: Record<PlanetName, number> = {
    Sun: 0, Moon: 0, Mercury: 0, Venus: 0, Mars: 0,
    Jupiter: 0, Saturn: 0, Uranus: 0, Neptune: 0, Pluto: 0,
  };
  for (const planet of PLANETS) {
    const element = planet.wuxing_element;
    const w = wuxingWeights[element];
    result[planet.name] = Number.isFinite(w) ? Math.max(0, w) : MIN_BASELINE;
  }

  // Step 2: pillar boosts. Each pillar adds PILLAR_BOOST_SCALE × pillarWeight
  // to every planet whose wuxing_element matches the pillar's element.
  const pillars = bazi?.pillars;
  if (pillars) {
    for (const [pillarKey, pillarWeight] of Object.entries(PILLAR_WEIGHTS)) {
      const pillar = pillars[pillarKey as keyof typeof pillars];
      const element = pillar?.element as WuxingElement | undefined;
      if (!element) continue;
      const boost = pillarWeight * PILLAR_BOOST_SCALE;
      for (const planet of PLANETS) {
        if (planet.wuxing_element === element) {
          result[planet.name] += boost;
        }
      }
    }
  }

  // Step 3: normalize so the strongest planet = 1.0. Preserves relative
  // proportions while guaranteeing the Chladni displacement has enough
  // amplitude to show through (otherwise sub-0.5 sphere stays too uniform).
  let max = 0;
  for (const k of Object.keys(result) as PlanetName[]) {
    if (result[k] > max) max = result[k];
  }
  if (max > 0) {
    for (const k of Object.keys(result) as PlanetName[]) {
      result[k] = result[k] / max;
    }
  }

  return result;
}
