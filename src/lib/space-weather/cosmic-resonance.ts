/**
 * Cosmic Resonance Engine
 *
 * Computes personalized sensitivity coefficients for space weather events
 * based on the individual's natal chart configuration.
 *
 * Core principle: Space weather affects everyone, but the RESONANCE —
 * how strongly and WHERE it shows in the Signatur — depends on your chart.
 *
 * Layer 1 (now):  Elemental resonance from astrological tradition
 * Layer 2 (now):  Planetary resonance from natal planet positions
 * Layer 3 (future): Empirical refinement from logged Signatur snapshots
 */

import { DIMENSION_DEFS as DIMENSIONS } from '@/packages/shared/src/signatur/dimension-defs';

// ═══════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════

export interface ResonanceProfile {
  /** Overall sensitivity 0–1 (how much space weather affects this chart) */
  globalSensitivity: number;
  /** Per-dimension sensitivity coefficients */
  dimensions: Record<string, DimensionResonance>;
  /** Dominant element driving the resonance character */
  dominantElement: CosmicElement;
  /** Resonance type label (for UI display) */
  resonanceType: ResonanceType;
}

export interface DimensionResonance {
  /** Base sensitivity for this dimension 0–1 */
  sensitivity: number;
  /** How this dimension responds: absorption, reaction, distribution, or resistance */
  responseType: ResponseType;
  /** Modulation multiplier applied to solar modulation for this dimension's poles */
  solarMultiplier: number;
}

export type CosmicElement = 'water' | 'fire' | 'earth' | 'air';
export type ResonanceType = 'absorptiv' | 'reaktiv' | 'distributiv' | 'resistiv';
export type ResponseType = 'absorb' | 'react' | 'distribute' | 'resist';

// ═══════════════════════════════════════
//  ELEMENT SENSITIVITY MODEL
// ═══════════════════════════════════════

/**
 * Elemental resonance coefficients derived from astrological tradition.
 *
 * Water absorbs: deep deformation, slow return to baseline.
 * Fire reacts: fast spikes, quick normalization.
 * Air distributes: broad but shallow modulation across all dimensions.
 * Earth resists: minimal visible change, grounding effect.
 */
const ELEMENT_SENSITIVITY: Record<CosmicElement, {
  base: number;
  kpMultiplier: number;
  cmeMultiplier: number;
  responseType: ResponseType;
  resonanceType: ResonanceType;
}> = {
  water: {
    base: 0.85,
    kpMultiplier: 1.4,
    cmeMultiplier: 1.6,
    responseType: 'absorb',
    resonanceType: 'absorptiv',
  },
  fire: {
    base: 0.65,
    kpMultiplier: 1.2,
    cmeMultiplier: 1.0,
    responseType: 'react',
    resonanceType: 'reaktiv',
  },
  air: {
    base: 0.50,
    kpMultiplier: 0.9,
    cmeMultiplier: 0.8,
    responseType: 'distribute',
    resonanceType: 'distributiv',
  },
  earth: {
    base: 0.30,
    kpMultiplier: 0.6,
    cmeMultiplier: 0.5,
    responseType: 'resist',
    resonanceType: 'resistiv',
  },
};

// ═══════════════════════════════════════
//  PLANET → ELEMENT MAPPING
// ═══════════════════════════════════════

/**
 * Classical Western planetary rulership elements (4-element system: fire/water/air/earth).
 * DISTINCT from the BaZi Wu-Xing mapping in src/lib/fusion-bazi/resonance.ts
 * (5-element system: wood/fire/earth/metal/water, German planet keys).
 * DEC-fusion-bazi-sheng-ke restricts *Wu-Xing* inline mappings — this map uses
 * Western classical elements and English keys, so it is not a DEC violation.
 */
const PLANET_ELEMENT: Record<string, CosmicElement> = {
  Sun: 'fire',
  Moon: 'water',
  Mercury: 'air',
  Venus: 'earth',
  Mars: 'fire',
  Jupiter: 'fire',
  Saturn: 'earth',
};

/** V3 dimension → planet mapping (from bipolar engine) */
const DIMENSION_PLANET: Record<string, string> = {
  assertion: 'Mars',
  empathy: 'Moon',
  creativity: 'Sun',
  logic: 'Mercury',
  intuition: 'Jupiter',
  discipline: 'Saturn',
};

// ═══════════════════════════════════════
//  ZODIAC SIGN → ELEMENT
// ═══════════════════════════════════════

const SIGN_ELEMENT: Record<string, CosmicElement> = {
  Aries: 'fire', Taurus: 'earth', Gemini: 'air',
  Cancer: 'water', Leo: 'fire', Virgo: 'earth',
  Libra: 'air', Scorpio: 'water', Sagittarius: 'fire',
  Capricorn: 'earth', Aquarius: 'air', Pisces: 'water',
};

// ═══════════════════════════════════════
//  RESONANCE COMPUTATION
// ═══════════════════════════════════════

/**
 * Compute the cosmic resonance profile from natal planet weights
 * and optionally the user's sun/moon signs for refined element weighting.
 *
 * @param natalWeights - 7 planet weights from soulprintToNatalWeights()
 * @param sunSign - Western sun sign (optional, improves accuracy)
 * @param moonSign - Western moon sign (optional, improves accuracy)
 * @param ascSign - Ascendant sign (optional)
 */
export function computeCosmicResonance(
  natalWeights: Record<string, number>,
  sunSign?: string,
  moonSign?: string,
  ascSign?: string,
): ResonanceProfile {
  // Step 1: Determine elemental balance from natal weights
  const elementScores: Record<CosmicElement, number> = {
    water: 0, fire: 0, earth: 0, air: 0,
  };

  for (const [planet, weight] of Object.entries(natalWeights)) {
    const element = PLANET_ELEMENT[planet];
    if (element) {
      elementScores[element] += weight;
    }
  }

  // Boost from sign placements (Big Three carry extra weight)
  if (sunSign && SIGN_ELEMENT[sunSign]) {
    elementScores[SIGN_ELEMENT[sunSign]!] += 0.3;
  }
  if (moonSign && SIGN_ELEMENT[moonSign]) {
    elementScores[SIGN_ELEMENT[moonSign]!] += 0.25;
  }
  if (ascSign && SIGN_ELEMENT[ascSign]) {
    elementScores[SIGN_ELEMENT[ascSign]!] += 0.15;
  }

  // Step 2: Normalize to find dominant element
  const totalScore = Object.values(elementScores).reduce((a, b) => a + b, 0) || 1;
  const elementRatios: Record<CosmicElement, number> = {
    water: elementScores.water / totalScore,
    fire: elementScores.fire / totalScore,
    earth: elementScores.earth / totalScore,
    air: elementScores.air / totalScore,
  };

  const dominantElement = (Object.entries(elementRatios) as [CosmicElement, number][])
    .sort((a, b) => b[1] - a[1])[0]![0];

  // Step 3: Compute global sensitivity as weighted blend of all elements
  let globalSensitivity = 0;
  for (const [element, ratio] of Object.entries(elementRatios) as [CosmicElement, number][]) {
    globalSensitivity += ratio * ELEMENT_SENSITIVITY[element].base;
  }

  // Step 4: Compute per-dimension resonance
  const dimensions: Record<string, DimensionResonance> = {};

  for (const dim of DIMENSIONS) {
    const planet = DIMENSION_PLANET[dim.id];
    const planetWeight = planet ? (natalWeights[planet] ?? 0.5) : 0.5;
    const planetElement = planet ? (PLANET_ELEMENT[planet] ?? 'air') : 'air';
    const elemConfig = ELEMENT_SENSITIVITY[planetElement as CosmicElement];

    // Dimension sensitivity = element base × natal planet weight
    // Higher natal weight → this dimension is more "active" → more responsive
    const sensitivity = clamp(elemConfig.base * (0.5 + planetWeight * 0.5), 0, 1);

    // Solar multiplier combines Kp and CME response characteristics
    const solarMultiplier = (elemConfig.kpMultiplier + elemConfig.cmeMultiplier) / 2;

    dimensions[dim.id] = {
      sensitivity,
      responseType: elemConfig.responseType,
      solarMultiplier,
    };
  }

  const resonanceType = ELEMENT_SENSITIVITY[dominantElement].resonanceType;

  return {
    globalSensitivity,
    dimensions,
    dominantElement,
    resonanceType,
  };
}

// ═══════════════════════════════════════
//  APPLY RESONANCE TO SOLAR MODULATION
// ═══════════════════════════════════════

/**
 * Apply the resonance profile to raw solar modulation values,
 * producing per-dimension modulation that respects the individual's chart.
 *
 * @param resonance - The user's cosmic resonance profile
 * @param rawRingModulation - Raw ring modulation from space weather (1.0–1.5)
 * @returns Per-dimension solar multipliers for the V3 engine
 */
export function applyResonance(
  resonance: ResonanceProfile,
  rawRingModulation: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  const excess = rawRingModulation - 1.0; // 0–0.5 range

  for (const [dimId, dimResonance] of Object.entries(resonance.dimensions)) {
    // Scale the raw modulation by this dimension's sensitivity and solar multiplier
    const personalizedExcess = excess * dimResonance.sensitivity * dimResonance.solarMultiplier;

    // Apply response type shaping
    let shaped: number;
    switch (dimResonance.responseType) {
      case 'absorb':
        // Water: smooth, deep absorption — logarithmic curve
        shaped = Math.log1p(personalizedExcess * 3) / Math.log1p(1.5);
        break;
      case 'react':
        // Fire: sharp spike — exponential onset
        shaped = Math.pow(personalizedExcess * 2, 1.5);
        break;
      case 'distribute':
        // Air: linear, evenly spread
        shaped = personalizedExcess;
        break;
      case 'resist':
        // Earth: dampened — square root compression
        shaped = Math.sqrt(personalizedExcess * 0.5);
        break;
    }

    // Final modulation: 1.0 (no effect) to ~1.8 (extreme personal resonance)
    // Capped at 2.0 to prevent visual explosion
    result[dimId] = clamp(1.0 + shaped, 1.0, 2.0);
  }

  return result;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
