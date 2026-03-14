/**
 * Fusion Ring Profile System
 *
 * The ring's permanent shape is built from two additive layers:
 *
 * 1. ASTRO BASE (immutable) — From the user's birth chart.
 *    - 12 zodiac sector signals (0–1) → radial deformation (hills/valleys)
 *    - 5 Wu Xing element strengths (0–1) → sector color intensity
 *    - BaZi pillars → roughness/texture quality
 *
 * 2. QUIZ OVERLAY (permanent, accumulating) — From completed QuissMe quizzes.
 *    - Each quiz cluster produces deformation "stamps" at specific sectors
 *    - Stamps have type (dent/bulge/ridge/groove/thickening/thinning) + magnitude
 *    - Over time, stamps accumulate → ring evolves permanently
 *
 * Both layers compile into 5 continuous deformation channels:
 *   radiusOffset, tubeScale, roughness, colorTint, coronaFactor
 *
 * Transit effects (temporary) are applied ON TOP of these permanent channels.
 */

// ──────────────────────────────────────────
// DATA TYPES
// ──────────────────────────────────────────

/** The 5 Wu Xing elements */
export type WuXingElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export const WU_XING_ORDER: WuXingElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];

/** Wu Xing element visual properties */
export const WU_XING_VISUALS: Record<WuXingElement, { color: [number, number, number]; glow: number }> = {
  wood:  { color: [0.23, 1.0, 0.42],  glow: 0x3aff6a },
  fire:  { color: [1.0, 0.29, 0.23],  glow: 0xff4a3a },
  earth: { color: [1.0, 0.78, 0.23],  glow: 0xffc83a },
  metal: { color: [0.82, 0.85, 0.94], glow: 0xd0d8f0 },
  water: { color: [0.23, 0.60, 1.0],  glow: 0x3a9aff },
};

/** 12 zodiac sector labels */
export const ZODIAC_SECTORS = [
  'widder', 'stier', 'zwillinge', 'krebs',
  'loewe', 'jungfrau', 'waage', 'skorpion',
  'schuetze', 'steinbock', 'wassermann', 'fische',
] as const;
export type ZodiacSector = typeof ZODIAC_SECTORS[number];

/** Zodiac sector visual domains */
export const ZODIAC_DOMAINS: Record<ZodiacSector, { label: string; domain: string; element: WuXingElement }> = {
  widder:      { label: 'Widder',      domain: 'Antrieb',       element: 'fire' },
  stier:       { label: 'Stier',       domain: 'Stabilität',    element: 'earth' },
  zwillinge:   { label: 'Zwillinge',   domain: 'Kommunikation', element: 'wood' },
  krebs:       { label: 'Krebs',       domain: 'Geborgenheit',  element: 'water' },
  loewe:       { label: 'Löwe',        domain: 'Ausdruck',      element: 'fire' },
  jungfrau:    { label: 'Jungfrau',    domain: 'Ordnung',       element: 'earth' },
  waage:       { label: 'Waage',       domain: 'Balance',       element: 'metal' },
  skorpion:    { label: 'Skorpion',    domain: 'Tiefe',         element: 'water' },
  schuetze:    { label: 'Schütze',     domain: 'Expansion',     element: 'fire' },
  steinbock:   { label: 'Steinbock',   domain: 'Struktur',      element: 'earth' },
  wassermann:  { label: 'Wassermann',  domain: 'Freiheit',      element: 'metal' },
  fische:      { label: 'Fische',      domain: 'Intuition',     element: 'water' },
};

/** Astro base profile — set once from birth chart, never changes */
export interface AstroBase {
  /** 12 zodiac sector signals (0–1). Higher = stronger presence in chart. */
  zodiacSignals: number[];
  /** 5 Wu Xing element strengths (0–1). From BaZi pillars. */
  wuxingStrengths: number[];
  /** Dominant element index (0–4) */
  dominantElement: number;
  /** Ascendant sector index (0–11) */
  ascendantSector: number;
  /** BaZi roughness factor (0–1): higher = more "weathered" ring texture */
  baziRoughness: number;
}

/** Types of permanent deformation a quiz can produce */
export type DeformationType =
  | 'dent'        // inward compression — Talk Zone, unresolved tension
  | 'bulge'       // outward expansion — Flow Zone, strength
  | 'ridge'       // sharp raised line — Spark Zone, exciting contrast
  | 'groove'      // smooth channel cut — persistent pattern
  | 'thickening'  // tube gets wider — accumulated energy
  | 'thinning';   // tube gets narrower — energy drain

/** A single quiz-generated deformation stamp */
export interface DeformationStamp {
  /** Which zodiac sector center (0–11) */
  sectorIndex: number;
  /** Type of deformation */
  type: DeformationType;
  /** Intensity (0–1) */
  magnitude: number;
  /** Angular spread factor (0.5 = narrow, 2.0 = wide). Default 1.0 = ~30° */
  spread: number;
  /** Optional color tint override [r, g, b] in 0–1 */
  colorTint?: [number, number, number];
  /** Source quiz cluster ID (for traceability) */
  sourceQuiz?: string;
  /** When this stamp was added */
  timestamp?: number;
}

/** The complete profile that shapes the ring permanently */
export interface FusionRingProfile {
  astro: AstroBase;
  quizStamps: DeformationStamp[];
}

// ──────────────────────────────────────────
// COMPILED DEFORMATION CHANNELS
// ──────────────────────────────────────────

/** The 5 continuous channels the renderer reads, sampled at any angle */
export interface DeformationChannels {
  /** Radial offset: positive = bulge outward, negative = dent inward. Range roughly -0.4 to +0.4 */
  radiusOffset: (angle: number) => number;
  /** Tube cross-section scale: 1.0 = normal, >1 = thicker, <1 = thinner */
  tubeScale: (angle: number) => number;
  /** Surface roughness: 0 = smooth, 1 = max erosion/scatter */
  roughness: (angle: number) => number;
  /** Color tint at angle: [r, g, b, intensity]. Intensity 0 = no tint, 1 = full override */
  colorTint: (angle: number) => [number, number, number, number];
  /** Corona height multiplier: 1.0 = default, >1 = taller strands */
  coronaFactor: (angle: number) => number;
}

// ──────────────────────────────────────────
// PROFILE COMPILER
// ──────────────────────────────────────────

/** Smooth bell curve centered at 0 with given width */
function bell(x: number, width: number): number {
  const t = x / width;
  return Math.exp(-t * t * 2);
}

/** Wrap angle difference to [-PI, PI] */
function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Sector index (0–11) to angle in radians */
function sectorToAngle(index: number): number {
  return (index / 12) * Math.PI * 2;
}

/** Simple smoothstep for interpolation */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Compiles a FusionRingProfile into 5 continuous deformation channels.
 * The renderer calls these functions per-particle to get the local deformation.
 */
export function compileProfile(profile: FusionRingProfile): DeformationChannels {
  const { astro, quizStamps } = profile;
  const sectorAngleWidth = Math.PI / 6; // 30° per sector

  // Pre-compute astro base as smooth interpolated function
  function astroSignal(angle: number): number {
    const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const idx = (norm / (Math.PI * 2)) * 12;
    const i0 = Math.floor(idx) % 12;
    const i1 = (i0 + 1) % 12;
    const frac = idx - Math.floor(idx);
    const t = frac * frac * (3 - 2 * frac); // smoothstep
    return (astro.zodiacSignals[i0] ?? 0.5) * (1 - t) + (astro.zodiacSignals[i1] ?? 0.5) * t;
  }

  // Pre-compute Wu Xing element influence at any angle (5 sectors of 72°)
  function elementInfluence(angle: number): { strength: number; colorR: number; colorG: number; colorB: number } {
    const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const elemIdx = Math.floor((norm / (Math.PI * 2)) * 5) % 5;
    const elemCenter = (elemIdx + 0.5) / 5 * Math.PI * 2;
    const dist = Math.abs(angleDiff(norm, elemCenter));
    const blend = Math.max(0, 1 - dist / (Math.PI / 5));
    const str = (astro.wuxingStrengths[elemIdx] ?? 0.5) * blend;
    const elem = WU_XING_ORDER[elemIdx];
    const vis = WU_XING_VISUALS[elem];
    return { strength: str, colorR: vis.color[0], colorG: vis.color[1], colorB: vis.color[2] };
  }

  // ── CHANNEL 1: radiusOffset ──
  function radiusOffset(angle: number): number {
    // Astro base: zodiac signals create the fundamental hills/valleys
    const base = (astroSignal(angle) - 0.5) * 0.5; // range -0.25 to +0.25

    // Ascendant boost: subtle permanent bulge at ascendant
    const ascAngle = sectorToAngle(astro.ascendantSector);
    const ascBoost = bell(angleDiff(angle, ascAngle), sectorAngleWidth) * 0.08;

    // Quiz stamps
    let quizOffset = 0;
    for (const stamp of quizStamps) {
      const stampAngle = sectorToAngle(stamp.sectorIndex);
      const dist = angleDiff(angle, stampAngle);
      const spreadWidth = sectorAngleWidth * stamp.spread;
      const influence = bell(dist, spreadWidth) * stamp.magnitude;

      switch (stamp.type) {
        case 'dent':
          quizOffset -= influence * 0.35; // push inward
          break;
        case 'bulge':
          quizOffset += influence * 0.3; // push outward
          break;
        case 'ridge':
          // Sharp raised line — narrow, pointy
          quizOffset += bell(dist, spreadWidth * 0.4) * stamp.magnitude * 0.25;
          break;
        case 'groove':
          // Smooth channel — wider, shallower
          quizOffset -= influence * 0.2;
          break;
        default:
          break;
      }
    }

    return base + ascBoost + quizOffset;
  }

  // ── CHANNEL 2: tubeScale ──
  function tubeScale(angle: number): number {
    let scale = 1.0;

    // Astro: dominant element sector slightly thicker
    const domAngle = (astro.dominantElement + 0.5) / 5 * Math.PI * 2;
    scale += bell(angleDiff(angle, domAngle), Math.PI / 5) * 0.15;

    // Quiz stamps
    for (const stamp of quizStamps) {
      const stampAngle = sectorToAngle(stamp.sectorIndex);
      const dist = angleDiff(angle, stampAngle);
      const spreadWidth = sectorAngleWidth * stamp.spread;
      const influence = bell(dist, spreadWidth) * stamp.magnitude;

      if (stamp.type === 'thickening') {
        scale += influence * 0.4;
      } else if (stamp.type === 'thinning') {
        scale -= influence * 0.3;
        scale = Math.max(scale, 0.4); // never thinner than 40%
      }
    }

    return scale;
  }

  // ── CHANNEL 3: roughness ──
  function roughness(angle: number): number {
    // BaZi base roughness
    let r = astro.baziRoughness * 0.4;

    // Higher zodiac signal = slightly rougher (more energy = more texture)
    r += astroSignal(angle) * 0.2;

    // Talk-zone quiz stamps increase roughness (unresolved tension)
    for (const stamp of quizStamps) {
      if (stamp.type === 'dent' || stamp.type === 'groove') {
        const stampAngle = sectorToAngle(stamp.sectorIndex);
        const dist = angleDiff(angle, stampAngle);
        const spreadWidth = sectorAngleWidth * stamp.spread;
        r += bell(dist, spreadWidth) * stamp.magnitude * 0.3;
      }
    }

    return Math.min(1, Math.max(0, r));
  }

  // ── CHANNEL 4: colorTint ──
  function colorTint(angle: number): [number, number, number, number] {
    const elem = elementInfluence(angle);
    let r = elem.colorR;
    let g = elem.colorG;
    let b = elem.colorB;
    let intensity = elem.strength * 0.3; // base element tint at 30%

    // Quiz stamps can override/add color
    for (const stamp of quizStamps) {
      if (stamp.colorTint) {
        const stampAngle = sectorToAngle(stamp.sectorIndex);
        const dist = angleDiff(angle, stampAngle);
        const spreadWidth = sectorAngleWidth * stamp.spread;
        const influence = bell(dist, spreadWidth) * stamp.magnitude * 0.4;
        if (influence > 0.01) {
          // Blend quiz color on top
          const total = intensity + influence;
          r = (r * intensity + stamp.colorTint[0] * influence) / total;
          g = (g * intensity + stamp.colorTint[1] * influence) / total;
          b = (b * intensity + stamp.colorTint[2] * influence) / total;
          intensity = Math.min(1, total);
        }
      }
    }

    return [r, g, b, intensity];
  }

  // ── CHANNEL 5: coronaFactor ──
  function coronaFactor(angle: number): number {
    // Base: proportional to zodiac signal
    let factor = 0.5 + astroSignal(angle) * 1.0;

    // Bulge stamps boost corona
    for (const stamp of quizStamps) {
      if (stamp.type === 'bulge' || stamp.type === 'ridge') {
        const stampAngle = sectorToAngle(stamp.sectorIndex);
        const dist = angleDiff(angle, stampAngle);
        const spreadWidth = sectorAngleWidth * stamp.spread;
        factor += bell(dist, spreadWidth) * stamp.magnitude * 0.6;
      }
    }

    return Math.max(0.2, factor);
  }

  return { radiusOffset, tubeScale, roughness, colorTint, coronaFactor };
}

// ──────────────────────────────────────────
// DEMO PROFILE GENERATOR
// ──────────────────────────────────────────

/**
 * Creates a visually dramatic demo profile to showcase all deformation types.
 * In production, this would come from the user's actual birth chart + quiz results.
 */
export function createDemoProfile(): FusionRingProfile {
  return {
    astro: {
      // Scorpio-dominant chart with strong Water/Fire
      zodiacSignals: [
        0.55, // Widder — moderate fire
        0.35, // Stier — low earth
        0.70, // Zwillinge — communicative
        0.60, // Krebs — emotional depth
        0.80, // Löwe — strong expression
        0.30, // Jungfrau — low
        0.50, // Waage — balanced
        0.95, // Skorpion — DOMINANT
        0.75, // Schütze — expansion
        0.40, // Steinbock — moderate
        0.65, // Wassermann — freedom
        0.85, // Fische — high intuition
      ],
      wuxingStrengths: [
        0.5,  // Wood
        0.85, // Fire — strong
        0.4,  // Earth — moderate
        0.55, // Metal
        0.9,  // Water — dominant
      ],
      dominantElement: 4, // Water
      ascendantSector: 4, // Löwe rising
      baziRoughness: 0.6, // weathered texture
    },
    quizStamps: [
      // === Flow Zones → Bulges (strengths) ===
      {
        sectorIndex: 7,  // Skorpion — deep emotional flow
        type: 'bulge',
        magnitude: 0.8,
        spread: 1.2,
        colorTint: [0.3, 0.6, 1.0], // deep blue glow
        sourceQuiz: 'bindung_cluster_1',
      },
      {
        sectorIndex: 4,  // Löwe — expressive confidence
        type: 'bulge',
        magnitude: 0.6,
        spread: 1.0,
        colorTint: [1.0, 0.6, 0.2], // warm amber
        sourceQuiz: 'werte_cluster_2',
      },

      // === Talk Zones → Dents (areas needing work) ===
      {
        sectorIndex: 5,  // Jungfrau — order/structure tension
        type: 'dent',
        magnitude: 0.7,
        spread: 0.8,
        sourceQuiz: 'alltag_cluster_1',
      },
      {
        sectorIndex: 9,  // Steinbock — responsibility pressure
        type: 'dent',
        magnitude: 0.5,
        spread: 1.0,
        sourceQuiz: 'werte_cluster_3',
      },

      // === Spark Zones → Ridges (exciting contrasts) ===
      {
        sectorIndex: 2,  // Zwillinge — communication spark
        type: 'ridge',
        magnitude: 0.75,
        spread: 0.6,
        colorTint: [0.4, 1.0, 0.5], // bright green
        sourceQuiz: 'film_cluster_1',
      },

      // === Accumulated patterns ===
      {
        sectorIndex: 11, // Fische — intuition groove (deep channel)
        type: 'groove',
        magnitude: 0.6,
        spread: 1.4,
        sourceQuiz: 'intimität_cluster_1',
      },
      {
        sectorIndex: 0,  // Widder — energy thickening
        type: 'thickening',
        magnitude: 0.7,
        spread: 1.0,
        colorTint: [1.0, 0.3, 0.2], // fire red
        sourceQuiz: 'alltag_cluster_2',
      },
      {
        sectorIndex: 8,  // Schütze — expansion thinning (stretched)
        type: 'thinning',
        magnitude: 0.5,
        spread: 0.9,
        sourceQuiz: 'abenteuer_cluster_1',
      },
    ],
  };
}
