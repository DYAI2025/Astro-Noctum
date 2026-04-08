/**
 * fusion-bazi/resonance.ts — Planet-to-Wu-Xing mapping and Sheng/Ke resonance calculator
 *
 * LOCKED by DEC-fusion-bazi-sheng-ke. Do not change mappings without updating that decision.
 * Pure module — no IO, no side effects.
 *
 * Implements: REQ-F-dashboard-bazi-fusion-bridge
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type WuXingElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** German planet name as used by BAFE (planet keys in the transit bodies map) */
export type PlanetName =
  | 'Sonne'
  | 'Mond'
  | 'Merkur'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn';

/** English romanization of the 10 Heavenly Stems (BaZi day master) */
export type HeavenlyStem =
  | 'Jia' | 'Yi'       // Wood
  | 'Bing' | 'Ding'    // Fire
  | 'Wu' | 'Ji'        // Earth
  | 'Geng' | 'Xin'     // Metal
  | 'Ren' | 'Gui';     // Water

export type ResonanceType = 'gleichklang' | 'naehrung' | 'kontrolle' | 'neutral';

export interface ResonanceResult {
  type: ResonanceType;
  /** Direction within the resonance type (forward/backward Sheng or Ke). Absent for gleichklang/neutral. */
  direction?: 'forward' | 'backward';
  /** Intensity in range 0–1 per DEC-fusion-bazi-sheng-ke intensity ranges */
  intensity: number;
  /** Wu-Xing element of the transiting planet */
  planetElement: WuXingElement;
  /** Wu-Xing element of the user's day master stem */
  dayMasterElement: WuXingElement;
  /** German interpretation quote — brand-voice compliant, Du-address, ≤80 chars */
  quote: string;
}

// ── Locked mappings (DEC-fusion-bazi-sheng-ke) ────────────────────────────────

/** Planet-to-Wu-Xing element mapping (Traditional Chinese astronomy, locked). */
export const PLANET_ELEMENT: Record<PlanetName, WuXingElement> = {
  Sonne:   'fire',
  Mars:    'fire',
  Mond:    'water',
  Merkur:  'water',
  Jupiter: 'wood',
  Saturn:  'earth',
  Venus:   'metal',
};

/** Heavenly Stem to Wu-Xing element mapping */
export const STEM_ELEMENT: Record<HeavenlyStem, WuXingElement> = {
  Jia: 'wood',  Yi: 'wood',
  Bing: 'fire', Ding: 'fire',
  Wu: 'earth',  Ji: 'earth',
  Geng: 'metal', Xin: 'metal',
  Ren: 'water',  Gui: 'water',
};

/**
 * Sheng (generating) cycle: each element generates the next.
 * Holz→Feuer→Erde→Metall→Wasser→Holz
 */
export const SHENG_NEXT: Record<WuXingElement, WuXingElement> = {
  wood:  'fire',
  fire:  'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

/**
 * Ke (controlling) cycle: each element controls the next.
 * Holz→Erde→Wasser→Feuer→Metall→Holz
 */
export const KE_NEXT: Record<WuXingElement, WuXingElement> = {
  wood:  'earth',
  earth: 'water',
  water: 'fire',
  fire:  'metal',
  metal: 'wood',
};

// ── German quotes per resonance type (brand-voice compliant) ──────────────────

const QUOTES: Record<ResonanceType, Record<'forward' | 'backward' | 'same', string>> = {
  gleichklang: {
    same:     'Gleiche Frequenz — du schwingst heute mit dem Kosmos.',
    forward:  'Gleiche Frequenz — du schwingst heute mit dem Kosmos.',
    backward: 'Gleiche Frequenz — du schwingst heute mit dem Kosmos.',
  },
  naehrung: {
    forward:  'Du wirst genährt. Nimm an, was kommt.',
    backward: 'Du gibst Energie weiter. Teile mit Bedacht.',
    same:     'Du wirst genährt. Nimm an, was kommt.',
  },
  kontrolle: {
    forward:  'Eine strukturierende Kraft wirkt. Bleib in deiner Mitte.',
    backward: 'Du gestaltest das Feld um dich. Nutze das bewusst.',
    same:     'Eine strukturierende Kraft wirkt. Bleib in deiner Mitte.',
  },
  neutral: {
    same:     'Kein direkter Impuls heute. Innere Arbeit lohnt sich.',
    forward:  'Kein direkter Impuls heute. Innere Arbeit lohnt sich.',
    backward: 'Kein direkter Impuls heute. Innere Arbeit lohnt sich.',
  },
};

// ── Core calculator ───────────────────────────────────────────────────────────

/**
 * Calculates the Sheng/Ke resonance between a transiting planet and the user's BaZi day master.
 *
 * @param planet - German planet name (Sonne, Mond, Merkur, Venus, Mars, Jupiter, Saturn)
 * @param dayMasterStem - English romanized Heavenly Stem (e.g. 'Geng', 'Yi')
 * @returns ResonanceResult with type, direction, intensity, elements, and German quote
 * @throws never — unknown planets/stems map to 'neutral' via fallback
 */
export function calculatePlanetBaziResonance(
  planet: PlanetName,
  dayMasterStem: HeavenlyStem,
): ResonanceResult {
  const planetElement = PLANET_ELEMENT[planet] ?? 'earth';
  const dayMasterElement = STEM_ELEMENT[dayMasterStem] ?? 'earth';

  // ── gleichklang — same element ────────────────────────────────────────
  if (planetElement === dayMasterElement) {
    return {
      type: 'gleichklang',
      intensity: 0.85,
      planetElement,
      dayMasterElement,
      quote: QUOTES.gleichklang.same,
    };
  }

  // ── naehrung forward — planet generates dayMaster (Sheng) ─────────────
  if (SHENG_NEXT[planetElement] === dayMasterElement) {
    return {
      type: 'naehrung',
      direction: 'forward',
      intensity: 0.75,
      planetElement,
      dayMasterElement,
      quote: QUOTES.naehrung.forward,
    };
  }

  // ── naehrung backward — dayMaster generates planet (Sheng) ────────────
  if (SHENG_NEXT[dayMasterElement] === planetElement) {
    return {
      type: 'naehrung',
      direction: 'backward',
      intensity: 0.65,
      planetElement,
      dayMasterElement,
      quote: QUOTES.naehrung.backward,
    };
  }

  // ── kontrolle forward — planet controls dayMaster (Ke) ────────────────
  if (KE_NEXT[planetElement] === dayMasterElement) {
    return {
      type: 'kontrolle',
      direction: 'forward',
      intensity: 0.70,
      planetElement,
      dayMasterElement,
      quote: QUOTES.kontrolle.forward,
    };
  }

  // ── kontrolle backward — dayMaster controls planet (Ke) ───────────────
  if (KE_NEXT[dayMasterElement] === planetElement) {
    return {
      type: 'kontrolle',
      direction: 'backward',
      intensity: 0.70,
      planetElement,
      dayMasterElement,
      quote: QUOTES.kontrolle.backward,
    };
  }

  // ── neutral ───────────────────────────────────────────────────────────
  return {
    type: 'neutral',
    intensity: 0.35,
    planetElement,
    dayMasterElement,
    quote: QUOTES.neutral.same,
  };
}
