/**
 * East-West Fusion Calculator
 *
 * Fuses Ba Zi (Four Pillars) and Western Astrology into a unified
 * 5-Element Vector with harmony analysis and resonance detection.
 *
 * @version 2.0.0 - Refactored with strict typing and resonance calculations
 */

import {
  type BaZiChart,
  type Planets,
  type WuXing,
  type WuXingDE,
  type FusionResult,
  type ElementVector,
  type Resonance,
  type ZodiacSign,
  WU_XING,
} from "./schemas";

import {
  STEM_ELEMENT_INDEX,
  BRANCH_FIXED_ELEMENT_INDEX,
  WU_XING as WU_XING_ARRAY,
  WU_XING_DE,
} from "./astronomy-utils";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Weights for Ba Zi Element Vector (Day Master = core identity) */
const BAZI_WEIGHTS = {
  yearStem: 1.0,
  yearBranch: 1.0,
  monthStem: 1.5,
  monthBranch: 1.5,
  dayStem: 2.0, // Day Master - highest weight
  dayBranch: 1.0,
  hourStem: 0.8,
  hourBranch: 0.8,
} as const;

/** Planetary Wu Xing mappings (simplified astronomical correspondences) */
const PLANET_WU_XING_WEIGHTS: Record<string, Partial<Record<WuXing, number>>> = {
  Sun: { Fire: 1.0, Wood: 0.2 },
  Moon: { Water: 1.0, Earth: 0.3 },
  Mercury: { Water: 0.6, Metal: 0.4 },
  Venus: { Metal: 0.8, Earth: 0.2 },
  Mars: { Fire: 1.0 },
  Jupiter: { Wood: 1.0, Fire: 0.2 },
  Saturn: { Earth: 0.7, Metal: 0.3 },
  // Modern outer planets (experimental mapping)
  Uranus: { Metal: 0.5, Fire: 0.5 },
  Neptune: { Water: 0.8, Wood: 0.2 },
  Pluto: { Fire: 0.5, Earth: 0.5 },
};

/** Zodiac Sign to Wu Xing element mapping */
const SIGN_ELEMENT_MAP: Record<ZodiacSign, WuXing> = {
  aries: "Fire",
  leo: "Fire",
  sagittarius: "Fire",
  taurus: "Earth",
  virgo: "Earth",
  capricorn: "Earth",
  gemini: "Metal", // Air -> Metal in Wu Xing correspondence
  libra: "Metal",
  aquarius: "Metal",
  cancer: "Water",
  scorpio: "Water",
  pisces: "Water",
};

/** Element string to index mapping */
const ELEMENT_INDEX: Record<WuXing, number> = {
  Wood: 0,
  Fire: 1,
  Earth: 2,
  Metal: 3,
  Water: 4,
};

/** Wu Xing generating cycle (supports) */
const GENERATING_CYCLE: Record<WuXing, WuXing> = {
  Wood: "Fire", // Wood generates Fire
  Fire: "Earth", // Fire generates Earth
  Earth: "Metal", // Earth generates Metal
  Metal: "Water", // Metal generates Water
  Water: "Wood", // Water generates Wood
};

/** Wu Xing controlling cycle (controls) */
const CONTROLLING_CYCLE: Record<WuXing, WuXing> = {
  Wood: "Earth", // Wood controls Earth
  Fire: "Metal", // Fire controls Metal
  Earth: "Water", // Earth controls Water
  Metal: "Wood", // Metal controls Wood
  Water: "Fire", // Water controls Fire
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize a 5-element vector to sum to 1.0
 */
function normalizeVector(v: number[]): ElementVector {
  const sum = v.reduce((a, b) => a + b, 0);
  if (sum === 0) return [0.2, 0.2, 0.2, 0.2, 0.2];
  return v.map((n) => n / sum) as ElementVector;
}

/**
 * Calculate Ba Zi element vector from Four Pillars
 */
function calculateBaZiVector(chart: BaZiChart): ElementVector {
  const v = [0, 0, 0, 0, 0];

  // Stems
  v[STEM_ELEMENT_INDEX[chart.year.stemIndex]] += BAZI_WEIGHTS.yearStem;
  v[STEM_ELEMENT_INDEX[chart.month.stemIndex]] += BAZI_WEIGHTS.monthStem;
  v[STEM_ELEMENT_INDEX[chart.day.stemIndex]] += BAZI_WEIGHTS.dayStem;
  v[STEM_ELEMENT_INDEX[chart.hour.stemIndex]] += BAZI_WEIGHTS.hourStem;

  // Branches
  v[BRANCH_FIXED_ELEMENT_INDEX[chart.year.branchIndex]] += BAZI_WEIGHTS.yearBranch;
  v[BRANCH_FIXED_ELEMENT_INDEX[chart.month.branchIndex]] += BAZI_WEIGHTS.monthBranch;
  v[BRANCH_FIXED_ELEMENT_INDEX[chart.day.branchIndex]] += BAZI_WEIGHTS.dayBranch;
  v[BRANCH_FIXED_ELEMENT_INDEX[chart.hour.branchIndex]] += BAZI_WEIGHTS.hourBranch;

  return normalizeVector(v);
}

/**
 * Calculate Western element vector from planets
 */
function calculateWesternVector(planets: Planets): ElementVector {
  const v = [0, 0, 0, 0, 0];

  const relevantBodies = Object.keys(PLANET_WU_XING_WEIGHTS) as Array<keyof typeof PLANET_WU_XING_WEIGHTS>;

  for (const body of relevantBodies) {
    const planetData = planets[body as keyof Planets];
    if (planetData) {
      const weights = PLANET_WU_XING_WEIGHTS[body];
      for (const [elem, w] of Object.entries(weights)) {
        v[ELEMENT_INDEX[elem as WuXing]] += w as number;
      }
    }
  }

  return normalizeVector(v);
}

/**
 * Calculate harmony index using cosine similarity
 * Returns value between 0 (no harmony) and 1 (perfect harmony)
 */
function calculateHarmonyIndex(v1: ElementVector, v2: ElementVector): number {
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < 5; i++) {
    dot += v1[i] * v2[i];
    norm1 += v1[i] ** 2;
    norm2 += v2[i] ** 2;
  }

  const sim = dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
  // Normalize -1..1 to 0..1
  return Math.max(0, Math.min(1, (sim + 1) / 2));
}

/**
 * Get harmony interpretation in German
 */
function getHarmonyInterpretation(harmonyIndex: number): string {
  if (harmonyIndex > 0.8) return "Sehr hohe Kohärenz";
  if (harmonyIndex > 0.6) return "Gute Kohärenz";
  if (harmonyIndex > 0.4) return "Moderate Kohärenz";
  return "Dynamische Spannung";
}

// ═══════════════════════════════════════════════════════════════════════════
// RESONANCE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate resonance between two elements
 */
function getElementRelation(
  eastern: WuXing,
  western: WuXing
): { quality: "harmony" | "tension" | "neutral"; strength: number } {
  // Same element = strong harmony
  if (eastern === western) {
    return { quality: "harmony", strength: 1.0 };
  }

  // Generating cycle = moderate harmony
  if (GENERATING_CYCLE[eastern] === western || GENERATING_CYCLE[western] === eastern) {
    return { quality: "harmony", strength: 0.7 };
  }

  // Controlling cycle = tension
  if (CONTROLLING_CYCLE[eastern] === western || CONTROLLING_CYCLE[western] === eastern) {
    return { quality: "tension", strength: 0.6 };
  }

  // No direct relationship
  return { quality: "neutral", strength: 0.3 };
}

/**
 * Calculate specific resonances between Eastern and Western chart elements
 */
function calculateResonances(bazi: BaZiChart, planets: Planets): Resonance[] {
  const resonances: Resonance[] = [];

  // 1. Sun - Day Master resonance (most important)
  if (planets.Sun?.sign) {
    const sunElement = SIGN_ELEMENT_MAP[planets.Sun.sign];
    const dayMasterElement = bazi.dayMaster.element;
    const relation = getElementRelation(dayMasterElement, sunElement);

    resonances.push({
      type: "Sun-DayMaster",
      eastern: dayMasterElement,
      western: `${planets.Sun.sign} (${sunElement})`,
      strength: relation.strength,
      quality: relation.quality,
      description:
        relation.quality === "harmony"
          ? `Your Sun sign ${planets.Sun.sign} harmonizes with your Day Master ${dayMasterElement}`
          : relation.quality === "tension"
            ? `Dynamic tension between Sun ${sunElement} and Day Master ${dayMasterElement} creates growth opportunities`
            : `Sun and Day Master in neutral relationship`,
    });
  }

  // 2. Moon - Hour Pillar resonance (emotional nature)
  if (planets.Moon?.sign) {
    const moonElement = SIGN_ELEMENT_MAP[planets.Moon.sign];
    const hourElement = bazi.hour.element;
    const relation = getElementRelation(hourElement, moonElement);

    resonances.push({
      type: "Moon-HourPillar",
      eastern: hourElement,
      western: `${planets.Moon.sign} (${moonElement})`,
      strength: relation.strength,
      quality: relation.quality,
      description:
        relation.quality === "harmony"
          ? `Your Moon in ${planets.Moon.sign} flows naturally with your Hour Pillar ${hourElement}`
          : relation.quality === "tension"
            ? `Moon and Hour Pillar create emotional depth through their tension`
            : `Moon and Hour Pillar maintain independent expression`,
    });
  }

  // 3. Jupiter - Year Pillar resonance (luck and expansion)
  if (planets.Jupiter?.sign) {
    const jupiterElement = SIGN_ELEMENT_MAP[planets.Jupiter.sign];
    const yearElement = bazi.year.element;
    const relation = getElementRelation(yearElement, jupiterElement);

    resonances.push({
      type: "Jupiter-YearPillar",
      eastern: yearElement,
      western: `${planets.Jupiter.sign} (${jupiterElement})`,
      strength: relation.strength,
      quality: relation.quality,
      description:
        relation.quality === "harmony"
          ? `Jupiter's expansion amplifies your Year Pillar ${yearElement} energy`
          : relation.quality === "tension"
            ? `Jupiter challenges your ancestral patterns for growth`
            : `Jupiter maintains steady influence on life path`,
    });
  }

  // 4. Saturn - Month Pillar resonance (career and structure)
  if (planets.Saturn?.sign) {
    const saturnElement = SIGN_ELEMENT_MAP[planets.Saturn.sign];
    const monthElement = bazi.month.element;
    const relation = getElementRelation(monthElement, saturnElement);

    resonances.push({
      type: "Saturn-MonthPillar",
      eastern: monthElement,
      western: `${planets.Saturn.sign} (${saturnElement})`,
      strength: relation.strength,
      quality: relation.quality,
      description:
        relation.quality === "harmony"
          ? `Saturn's discipline supports your Month Pillar ${monthElement} in career matters`
          : relation.quality === "tension"
            ? `Saturn tests your professional path for deeper mastery`
            : `Saturn provides steady career foundation`,
    });
  }

  // 5. Mars - Day Branch resonance (action and drive)
  if (planets.Mars?.sign) {
    const marsElement = SIGN_ELEMENT_MAP[planets.Mars.sign];
    const dayBranchElement = WU_XING_ARRAY[BRANCH_FIXED_ELEMENT_INDEX[bazi.day.branchIndex]] as WuXing;
    const relation = getElementRelation(dayBranchElement, marsElement);

    resonances.push({
      type: "Mars-DayBranch",
      eastern: dayBranchElement,
      western: `${planets.Mars.sign} (${marsElement})`,
      strength: relation.strength,
      quality: relation.quality,
      description:
        relation.quality === "harmony"
          ? `Mars energizes your Day Branch for decisive action`
          : relation.quality === "tension"
            ? `Mars creates dynamic tension that fuels ambition`
            : `Mars provides steady drive and motivation`,
    });
  }

  return resonances;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate East-West Fusion
 *
 * Combines Ba Zi and Western planetary data into a unified element analysis
 * with harmony metrics and specific resonance patterns.
 *
 * @param bazi - Complete Ba Zi chart
 * @param westernPlanets - Western planetary positions
 * @returns Fusion result with element vectors, harmony index, and resonances
 */
export function calculateFusion(bazi: BaZiChart, westernPlanets: Planets): FusionResult {
  // Calculate element vectors
  const eastVec = calculateBaZiVector(bazi);
  const westVec = calculateWesternVector(westernPlanets);

  // Unified Vector (Average of both systems)
  const combined = normalizeVector(eastVec.map((val, i) => val + westVec[i]));

  // Find dominant and deficient elements
  const maxVal = Math.max(...combined);
  const minVal = Math.min(...combined);
  const maxIdx = combined.indexOf(maxVal);
  const minIdx = combined.indexOf(minVal);

  // Calculate harmony between East and West
  const harmonyIndex = calculateHarmonyIndex(eastVec, westVec);
  const harmonyInterpretation = getHarmonyInterpretation(harmonyIndex);

  // Calculate specific resonances
  const resonances = calculateResonances(bazi, westernPlanets);

  return {
    elementVector: {
      combined,
      eastern: eastVec,
      western: westVec,
      dominantElement: WU_XING[maxIdx] as WuXing,
      dominantElementDE: WU_XING_DE[maxIdx] as WuXingDE,
      deficientElement: WU_XING[minIdx] as WuXing,
      deficientElementDE: WU_XING_DE[minIdx] as WuXingDE,
    },
    harmonyIndex,
    harmonyInterpretation,
    resonances,
  };
}

// Re-export types for convenience
export type { FusionResult, ElementVector, Resonance, Planets };
