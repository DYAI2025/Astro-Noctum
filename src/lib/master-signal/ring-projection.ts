import type { MasterSignal, RingProjectionInput, DimensionKey } from './types';
import { DIMENSION_KEYS } from './dimensions';

/**
 * Fusion Ring Projection — Master Signal 5D → 12-sector modulation
 * Prepared output contract; full UI integration deferred.
 */

type SectorAffinity = { primary: DimensionKey; secondary: DimensionKey };

const SECTOR_AFFINITIES: SectorAffinity[] = [
  { primary: 'passion',    secondary: 'autonomy' },    // 0  Aries
  { primary: 'stability',  secondary: 'connection' },   // 1  Taurus
  { primary: 'future',     secondary: 'autonomy' },     // 2  Gemini
  { primary: 'connection', secondary: 'stability' },     // 3  Cancer
  { primary: 'passion',    secondary: 'autonomy' },      // 4  Leo
  { primary: 'stability',  secondary: 'future' },        // 5  Virgo
  { primary: 'connection', secondary: 'future' },        // 6  Libra
  { primary: 'passion',    secondary: 'connection' },     // 7  Scorpio
  { primary: 'future',     secondary: 'passion' },       // 8  Sagittarius
  { primary: 'stability',  secondary: 'autonomy' },      // 9  Capricorn
  { primary: 'autonomy',   secondary: 'future' },        // 10 Aquarius
  { primary: 'connection', secondary: 'passion' },       // 11 Pisces
];

const PRIMARY_WEIGHT = 0.65;
const SECONDARY_WEIGHT = 0.35;

export function projectToRing(masterSignal: MasterSignal): RingProjectionInput {
  const n = masterSignal.subsignals.natal.dimensions;
  const q = masterSignal.subsignals.quiz.dimensions;
  const nCoverage = masterSignal.subsignals.natal.coverage;
  const qCoverage = masterSignal.subsignals.quiz.coverage;

  const totalCoverage = nCoverage + qCoverage;
  const nWeight = totalCoverage > 0 ? nCoverage / totalCoverage : 0.5;
  const qWeight = totalCoverage > 0 ? qCoverage / totalCoverage : 0.5;

  const blended: Record<DimensionKey, number> = {
    passion: 0, stability: 0, future: 0, connection: 0, autonomy: 0,
  };
  for (const k of DIMENSION_KEYS) {
    blended[k] = n[k] * nWeight + q[k] * qWeight;
  }

  const sector_modulation: number[] = [];
  const sector_sources: Array<{ dominant_dimension: DimensionKey; weight: number }> = [];

  for (let s = 0; s < 12; s++) {
    const { primary, secondary } = SECTOR_AFFINITIES[s];
    const value = blended[primary] * PRIMARY_WEIGHT + blended[secondary] * SECONDARY_WEIGHT;
    sector_modulation.push(value);
    sector_sources.push({ dominant_dimension: primary, weight: value });
  }

  const signal_strength = masterSignal.relations.overall_integration * ((nCoverage + qCoverage) / 2);

  return {
    sector_modulation,
    sector_sources,
    signal_strength: Math.max(0, Math.min(1, signal_strength)),
    source: 'master_signal_v1',
  };
}
