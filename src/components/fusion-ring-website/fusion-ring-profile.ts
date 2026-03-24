/**
 * Fusion Ring Profile System — Symmetric Fractal v3
 *
 * The visualization is a SYMMETRIC FRACTAL FORM (no longer a ring):
 * N-fold rotational symmetry with recursive branching, shaped by birth chart.
 *
 * SIGNAL LAYER A: Planetary Harmonics (from natal chart)
 *   - Dominant harmonic order determines PRIMARY SYMMETRY (e.g., 6-fold, 8-fold)
 *   - Secondary harmonics create sub-branching patterns
 *   - Phase = starting rotation offset
 *   - Amplitude = arm length/intensity weighting
 *
 * SIGNAL LAYER B: Wu Xing Fractal Character (from fusion calculation)
 *   - Holz → organic, asymmetric growth (uneven arm lengths)
 *   - Feuer → deep branching, sharp tips (more recursive depth)
 *   - Erde → wide, shallow spread (fewer branches, broader bases)
 *   - Metall → precise geometry, clean symmetry
 *   - Wasser → flowing, soft edges, subtle movement
 *
 * SIGNAL LAYER C: BaZi Deep Structure (from bazi calculation)
 *   - Day Master → fractal spine character (sharp/soft/angular)
 *   - 4 Pillars → brightness at 0°/90°/180°/270° axes
 *   - Kohärenz-Index → coherence vs fragmentation
 *
 * Plus two overlay layers:
 *   QUIZ OVERLAY (permanent) — local thickness/color modifications
 *   TRANSIT EFFECTS (temporary) — applied on top by the renderer
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

// ──────────────────────────────────────────
// PLANETARY HARMONIC TYPES
// ──────────────────────────────────────────

export type PlanetName = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';

/** Harmonic order for each planet (number of symmetry lobes) */
export const PLANET_HARMONICS: Record<PlanetName, number> = {
  sun:     4,   // Quadrat — annual rhythm, fundamental structure
  moon:    6,   // Hexagonal — monthly cycle, flowing
  mercury: 5,   // Pentagon — duality (day/night rule)
  venus:   8,   // Octagonal — 8/5 resonance with Earth
  mars:    3,   // Triangle — aggressive, direct
  jupiter: 12,  // Dodecagonal — matches 12 zodiac sectors
  saturn:  7,   // Heptagonal — prime, unresolvable, structure
};

/** A single planet's contribution to the harmonic shape */
export interface PlanetHarmonic {
  planet: PlanetName;
  /** Weight / amplitude factor (0–1.5). From planet importance in chart. */
  weight: number;
  /** Phase in degrees (0–360). Planet position in zodiac. */
  phaseDeg: number;
}

// ──────────────────────────────────────────
// BAZI TYPES
// ──────────────────────────────────────────

export type HeavenlyStemElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** A single BaZi pillar */
export interface BaZiPillar {
  /** Heavenly stem element */
  stemElement: HeavenlyStemElement;
  /** Earthly branch element */
  branchElement: HeavenlyStemElement;
  /** Hidden stem elements with weights (main=1.0, middle=0.5, residual=0.3) */
  hiddenStems: { element: HeavenlyStemElement; weight: number }[];
  /** Computed pillar strength (sum of weighted element contributions) */
  strength: number;
}

/** Complete BaZi data for ring shaping */
export interface BaZiData {
  /** Day Master element (the core identity) */
  dayMasterElement: HeavenlyStemElement;
  /** Four pillars: Year (0°), Month (90°), Day (180°), Hour (270°) */
  pillars: [BaZiPillar, BaZiPillar, BaZiPillar, BaZiPillar];
  /** Kohärenz-Index: cosine similarity between Western and BaZi Wu Xing vectors (0–1) */
  harmonyIndex: number;
  /** BaZi-derived Wu Xing strengths (may differ from Western) */
  baziWuxingStrengths: number[];
}

// ──────────────────────────────────────────
// ASTRO BASE (extended)
// ──────────────────────────────────────────

/** Astro base profile — set once from birth chart, never changes */
export interface AstroBase {
  /** 12 zodiac sector signals (0–1). Higher = stronger presence in chart. */
  zodiacSignals: number[];
  /** 5 Wu Xing element strengths (0–1). From Western chart analysis. */
  wuxingStrengths: number[];
  /** Dominant element index (0–4) */
  dominantElement: number;
  /** Ascendant sector index (0–11) */
  ascendantSector: number;
  /** BaZi roughness factor (0–1): higher = more "weathered" ring texture */
  baziRoughness: number;
  /** Planetary harmonics from natal chart */
  planets: PlanetHarmonic[];
  /** BaZi data for deep structure */
  bpiData: BaZiData;
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

// ──────────────────────────────────────────
// SOULPRINT SEDIMENTATION (Term S)
// ──────────────────────────────────────────

/** Transit event types that can deposit sediment */
export type SedimentEventType = 'resonance_jump' | 'dominance_shift' | 'moon_event';

/** Sedimentation configuration constants */
export const SEDIMENTATION_CONFIG = {
  /** Weight per event type (how much deposit per occurrence) */
  EVENT_WEIGHTS: {
    resonance_jump: 0.020,    // Strongest — rare, significant
    dominance_shift: 0.015,   // Medium — seldom, meaningful
    moon_event: 0.008,        // Lightest — frequent, fleeting
  } as Record<SedimentEventType, number>,
  
  /** Priority decay factors (higher priority = stronger deposit) */
  PRIORITY_DECAY: {
    1: 1.0,   // Highest priority, full strength
    2: 0.6,   // Medium priority
    3: 0.3,   // Lower priority
  } as Record<number, number>,
  
  /** Global sedimentation rate (tuning knob: 0.5–2.0 range) */
  SEDIMENTATION_RATE: 1.0,
  
  /** Gaussian spread in radians (~30° = one sector width) */
  DEFAULT_SPREAD: 0.52, // ~30° in radians
  
  /** Maximum sediment per sector (prevents runaway growth) */
  MAX_SECTOR_SEDIMENT: 5.0,
} as const;

/** A single sediment deposit from a transit event */
export interface TransitSediment {
  /** When this deposit was created */
  eventDate: string;
  /** Type of transit event */
  eventType: SedimentEventType;
  /** Which sector (0–11) received the deposit */
  sector: number;
  /** Planet that triggered the event */
  triggerPlanet: string;
  /** Calculated deposit strength */
  depositStrength: number;
  /** Gaussian spread in radians */
  spread: number;
}

/** Accumulated sedimentation state */
export interface SedimentationState {
  /** Accumulated sediment per sector (12 values) */
  sectors: number[];
  /** Historical deposits for analytics (optional, can be trimmed) */
  history: TransitSediment[];
  /** Last update timestamp */
  updatedAt: number;
}

/** Creates a fresh sedimentation state */
export function createEmptySedimentationState(): SedimentationState {
  return {
    sectors: new Array(12).fill(0),
    history: [],
    updatedAt: Date.now(),
  };
}

/**
 * Calculates deposit strength for a transit event.
 * deposit_strength = event_weight × impact × decay_factor × SEDIMENTATION_RATE
 */
export function calculateDepositStrength(
  eventType: SedimentEventType,
  impact: number, // 0–1: transit_intensity × soulprint_strength at sector
  priority: number
): number {
  const eventWeight = SEDIMENTATION_CONFIG.EVENT_WEIGHTS[eventType] ?? 0.01;
  const decayFactor = SEDIMENTATION_CONFIG.PRIORITY_DECAY[priority] ?? 0.3;
  const rate = SEDIMENTATION_CONFIG.SEDIMENTATION_RATE;
  
  return eventWeight * impact * decayFactor * rate;
}

/**
 * Applies a sediment deposit to the sectors array using Gaussian distribution.
 * Modifies the sectors array in-place.
 */
export function applySedimentDeposit(
  sectors: number[],
  sectorCenter: number,
  depositStrength: number,
  spread: number = SEDIMENTATION_CONFIG.DEFAULT_SPREAD
): void {
  const centerAngle = (sectorCenter / 12) * Math.PI * 2;
  
  // Apply to all 12 sectors with Gaussian falloff
  for (let i = 0; i < 12; i++) {
    const sectorAngle = (i / 12) * Math.PI * 2;
    
    // Angular distance (wrapped to [-π, π])
    let dist = sectorAngle - centerAngle;
    while (dist > Math.PI) dist -= Math.PI * 2;
    while (dist < -Math.PI) dist += Math.PI * 2;
    
    // Gaussian bell curve
    const influence = Math.exp(-(dist * dist) / (2 * spread * spread));
    
    // Add deposit with cap
    sectors[i] = Math.min(
      SEDIMENTATION_CONFIG.MAX_SECTOR_SEDIMENT,
      sectors[i] + depositStrength * influence
    );
  }
}

/**
 * Interpolates sedimentation value at any angle using Gaussian blending.
 * Returns the continuous S(θ) value.
 */
export function interpolateSediment(sectors: number[], angle: number): number {
  const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let total = 0;
  let weight = 0;
  
  const spread = SEDIMENTATION_CONFIG.DEFAULT_SPREAD;
  
  for (let i = 0; i < 12; i++) {
    const sectorAngle = (i / 12) * Math.PI * 2;
    let dist = norm - sectorAngle;
    while (dist > Math.PI) dist -= Math.PI * 2;
    while (dist < -Math.PI) dist += Math.PI * 2;
    
    const influence = Math.exp(-(dist * dist) / (2 * spread * spread));
    total += sectors[i] * influence;
    weight += influence;
  }
  
  return weight > 0 ? total / weight : 0;
}

/** The complete profile that shapes the ring permanently */
export interface FusionRingProfile {
  astro: AstroBase;
  quizStamps: DeformationStamp[];
  /** Soulprint Sedimentation — accumulated transit deposits (Term S) */
  sedimentation: SedimentationState;
}

// ──────────────────────────────────────────
// COMPILED DEFORMATION CHANNELS (6 + depth)
// ──────────────────────────────────────────

/**
 * The continuous deformation channels the renderer reads, sampled at any angle.
 * 
 * Shape Formula: Shape(θ, T) = H(θ) + S(θ, T) + Q(θ, T)
 *   H(θ) = Natal Harmonic (harmonicShape) — unchanging
 *   S(θ, T) = Soulprint Sedimentation (sedimentOffset) — accumulating from transits
 *   Q(θ, T) = Quiz Deformations (quizOffset part of radiusOffset) — accumulating from quizzes
 */
export interface DeformationChannels {
  /** Ch1: Radial offset from zodiac signals + quiz stamps. Range roughly -0.4 to +0.4 */
  radiusOffset: (angle: number) => number;
  /** Ch2: Tube cross-section scale: 1.0 = normal, >1 = thicker, <1 = thinner */
  tubeScale: (angle: number) => number;
  /** Ch3: Surface roughness: 0 = smooth, 1 = max erosion/scatter */
  roughness: (angle: number) => number;
  /** Ch4: Color tint at angle: [r, g, b, intensity]. Intensity 0 = no tint, 1 = full override */
  colorTint: (angle: number) => [number, number, number, number];
  /** Ch5: Corona height multiplier: 1.0 = default, >1 = taller strands */
  coronaFactor: (angle: number) => number;
  /** Ch6: H(θ) — Natal Harmonic. Standing wave from planetary positions. Range ~-0.3 to +0.3 */
  harmonicShape: (angle: number) => number;
  /** Ch7: Pillar depth: brightness/density modulation from BaZi 4-pillar axes. Range ~0.5 to 1.5 */
  pillarDepth: (angle: number) => number;
  /** Ch8: Tension factor: 1.0 = harmonious, >1 = tense zone (more roughness, damped amplitude) */
  tensionFactor: (angle: number) => number;
  /** Ch9: S(θ) — Sedimentation offset from accumulated transit deposits. Range 0 to ~3.0 */
  sedimentOffset: (angle: number) => number;
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

/** Degrees to radians */
function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

// ──────────────────────────────────────────
// SIGNAL LAYER B: Wu Xing Wave Modifiers
// ──────────────────────────────────────────

/** Holz: odd harmonics boosted, even dampened */
function oddHarmonicBoost(harmonicOrder: number): number {
  return harmonicOrder % 2 === 1 ? 1.3 : 0.7;
}

/** Feuer: higher harmonics sharpened (more detail at high orders) */
function highFreqSharpen(harmonicOrder: number): number {
  return 1.0 + 0.1 * harmonicOrder;
}

/** Erde: low frequencies dominant, high dampened → soft plateaus */
function lowFreqFlatten(harmonicOrder: number): number {
  if (harmonicOrder <= 4) return 1.5;
  if (harmonicOrder > 6) return 0.5;
  return 1.0; // 5-6 are neutral
}

/** Metall: integer ratio lock — snaps phase to 0 or PI for clean geometry */
function integerRatioLock(_harmonicOrder: number): { amplitudeMod: number; phaseSnap: boolean } {
  return { amplitudeMod: 1.0, phaseSnap: true };
}

/** Wasser: phase drift — slow modulation creates asymmetry */
function phaseDrift(angle: number, _harmonicOrder: number): number {
  return Math.sin(angle * 0.1) * 0.15;
}

/**
 * Combined Wu Xing modifier for a given harmonic at a given angle.
 * wuxingStrengths = [wood, fire, earth, metal, water] each 0–1
 */
function wuxingModifier(angle: number, harmonicOrder: number, wuxingStrengths: number[]): { ampMod: number; phaseMod: number } {
  const [wood, fire, earth, metal, water] = wuxingStrengths;

  // Amplitude modulation: each element shapes the wave differently
  let ampMod = 0;
  ampMod += wood  * oddHarmonicBoost(harmonicOrder);
  ampMod += fire  * highFreqSharpen(harmonicOrder);
  ampMod += earth * lowFreqFlatten(harmonicOrder);
  ampMod += metal * integerRatioLock(harmonicOrder).amplitudeMod;
  ampMod += water * 1.0; // water doesn't change amplitude, only phase

  // Normalize by total strength so it's a weighted average
  const totalStrength = wood + fire + earth + metal + water;
  if (totalStrength > 0.01) ampMod /= totalStrength;
  else ampMod = 1.0;

  // Phase modulation: Metall snaps, Wasser drifts
  let phaseMod = 0;
  if (metal > 0.3) {
    // Metall tries to snap phases — proportional to its dominance
    // (handled in the main loop by snapping phase to nearest π/harmonicOrder)
  }
  if (water > 0.2) {
    phaseMod += water * phaseDrift(angle, harmonicOrder);
  }

  return { ampMod, phaseMod };
}

// ──────────────────────────────────────────
// SIGNAL LAYER C: BaZi Waveform Factors
// ──────────────────────────────────────────

/**
 * Day Master determines the base waveform character via Fourier coefficients.
 * Returns a multiplier that shapes how the harmonic sum "sounds".
 *
 * Holz  → sawtooth (asymmetric rise, soft fall)
 * Feuer → triangle (sharp peaks, fast fall)
 * Erde  → square (plateaus, flat segments)
 * Metall → pure sine (mathematically clean)
 * Wasser → sine + noise (grundform with micro-movement)
 */
function dayMasterWaveform(angle: number, element: HeavenlyStemElement): number {
  // Fourier series coefficients for each waveform type
  // Applied as a shaping envelope over the angle
  switch (element) {
    case 'wood': {
      // Sawtooth-ish: asymmetric, gradual rise then drop
      // Fourier: Σ (-1)^(n+1) / n × sin(nθ)
      let v = 0;
      for (let n = 1; n <= 6; n++) {
        v += (Math.pow(-1, n + 1) / n) * Math.sin(n * angle);
      }
      return 1.0 + v * 0.15; // subtle shaping, centered around 1
    }
    case 'fire': {
      // Triangle: sharp peaks
      // Fourier: Σ (-1)^n / (2n+1)^2 × sin((2n+1)θ)
      let v = 0;
      for (let n = 0; n <= 4; n++) {
        const k = 2 * n + 1;
        v += (Math.pow(-1, n) / (k * k)) * Math.sin(k * angle);
      }
      return 1.0 + v * 0.25; // stronger shaping for fire
    }
    case 'earth': {
      // Square-ish: flat plateaus
      // Fourier: Σ 1/(2n+1) × sin((2n+1)θ)
      let v = 0;
      for (let n = 0; n <= 3; n++) {
        const k = 2 * n + 1;
        v += (1 / k) * Math.sin(k * angle);
      }
      return 1.0 + v * 0.12; // mild plateau effect
    }
    case 'metal': {
      // Pure sine — no additional harmonics, mathematically clean
      return 1.0;
    }
    case 'water': {
      // Sine + subtle noise-like modulation
      const noise = Math.sin(angle * 13.7) * 0.04 + Math.sin(angle * 23.1) * 0.03;
      return 1.0 + noise;
    }
    default:
      return 1.0;
  }
}

/** Pillar axes: Year=0°, Month=90°, Day=180°, Hour=270° */
const PILLAR_AXES = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];

/**
 * BaZi pillar depth modulation: stronger pillars create brighter/denser zones.
 * Returns a multiplier ~0.5 to ~1.5.
 */
function computePillarDepth(angle: number, bpiData: BaZiData): number {
  let depth = 0;
  for (let p = 0; p < 4; p++) {
    const pillar = bpiData.pillars[p];
    const axis = PILLAR_AXES[p];
    const dist = angleDiff(angle, axis);
    // Broad cosine falloff (covers ~90° each side of axis)
    const falloff = Math.max(0, Math.cos(dist * 0.8)) ; // cos falloff, ~112° half-width
    depth += pillar.strength * falloff;
  }
  // Normalize: 4 pillars each max ~1.0 strength, max falloff 1.0
  // Typical range 0..~2.0 → map to 0.5..1.5
  return 0.5 + depth * 0.5;
}

/**
 * Tension zones: where Western and BaZi Wu Xing diverge.
 * Returns tension factor: 1.0 = harmonious, >1 = tension.
 */
function computeTensionFactor(angle: number, astro: AstroBase, bpiData: BaZiData): number {
  if (bpiData.harmonyIndex >= 0.8) return 1.0; // highly harmonious, no tension

  // Map angle to Wu Xing element (5 sectors of 72°)
  const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const elemIdx = Math.floor((norm / (Math.PI * 2)) * 5) % 5;
  const nextIdx = (elemIdx + 1) % 5;
  const frac = ((norm / (Math.PI * 2)) * 5) - elemIdx;

  // Interpolate tension between adjacent elements
  const westernA = astro.wuxingStrengths[elemIdx] ?? 0.5;
  const westernB = astro.wuxingStrengths[nextIdx] ?? 0.5;
  const baziA = bpiData.baziWuxingStrengths[elemIdx] ?? 0.5;
  const baziB = bpiData.baziWuxingStrengths[nextIdx] ?? 0.5;

  const western = westernA * (1 - frac) + westernB * frac;
  const bazi = baziA * (1 - frac) + baziB * frac;
  const divergence = Math.abs(western - bazi);

  // Threshold: only create tension where divergence > 0.15
  if (divergence <= 0.15) return 1.0;

  // Scale tension: more divergence + lower harmony = more tension
  const harmonyDampen = 1.0 - bpiData.harmonyIndex; // 0..1 (low harmony = high dampen factor)
  return 1.0 + (divergence - 0.15) * 2.0 * harmonyDampen;
}

// ──────────────────────────────────────────
// MAIN COMPILER
// ──────────────────────────────────────────

/**
 * Compiles a FusionRingProfile into 6+2 continuous deformation channels.
 * The renderer calls these functions per-particle to get the local deformation.
 */
export function compileProfile(profile: FusionRingProfile): DeformationChannels {
  const { astro, quizStamps } = profile;
  const sectorAngleWidth = Math.PI / 6; // 30° per sector
  const bpiData = astro.bpiData;

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

  // ══════════════════════════════════════════
  // CHANNEL 6: harmonicShape — THE CORE GEOMETRY
  // ══════════════════════════════════════════

  /**
   * Pre-compute the harmonic shape function:
   * harmonicShape(θ) = waveform_factor(θ) × Σ_planets( w_p × wuxing_mod(θ,n_p) × sin(n_p×θ + φ_p) )
   */
  function harmonicShape(angle: number): number {
    const waveformFactor = dayMasterWaveform(angle, bpiData.dayMasterElement);
    const tension = computeTensionFactor(angle, astro, bpiData);

    let sum = 0;
    for (const planet of astro.planets) {
      const n = PLANET_HARMONICS[planet.planet];
      let phase = degToRad(planet.phaseDeg);

      // Wu Xing modifier for this harmonic at this angle
      const mod = wuxingModifier(angle, n, astro.wuxingStrengths);

      // Metall phase snap: if metal is dominant, snap phase to nearest π/n
      const metalStr = astro.wuxingStrengths[3] ?? 0;
      if (metalStr > 0.3) {
        const snapGrid = Math.PI / n;
        const snapped = Math.round(phase / snapGrid) * snapGrid;
        // Blend toward snapped position based on metal strength
        phase = phase + (snapped - phase) * (metalStr - 0.3) / 0.7;
      }

      // Apply Wasser phase drift
      phase += mod.phaseMod;

      // Amplitude = planet weight × wu xing amplitude modifier
      const amp = planet.weight * mod.ampMod;

      sum += amp * Math.sin(n * angle + phase);
    }

    // Apply waveform shaping from Day Master
    sum *= waveformFactor;

    // Tension zones dampen the harmonic
    if (tension > 1.0) {
      sum *= 1.0 / (tension * 0.6 + 0.4); // dampen in tension zones
    }

    // Normalize: max theoretical sum ≈ Σweights × 1.5 ≈ 6-8.
    // We want output range roughly -0.3 to +0.3 for reasonable ring deformation.
    // With 7 planets total weight ~5.2, max possible ~5.2 × 1.5 = 7.8
    // Scale to ±0.3 → divide by ~13
    return sum * 0.04;
  }

  // ── CHANNEL 1: radiusOffset ──
  function radiusOffset(angle: number): number {
    // Astro base: zodiac signals create the fundamental hills/valleys
    const base = (astroSignal(angle) - 0.5) * 0.5;

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
          quizOffset -= influence * 0.35;
          break;
        case 'bulge':
          quizOffset += influence * 0.3;
          break;
        case 'ridge':
          quizOffset += bell(dist, spreadWidth * 0.4) * stamp.magnitude * 0.25;
          break;
        case 'groove':
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

    // Pillar depth subtly influences thickness
    const depth = computePillarDepth(angle, bpiData);
    scale *= (1.0 + (depth - 1.0) * 0.15); // ±15% from pillar depth

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
        scale = Math.max(scale, 0.4);
      }
    }

    return scale;
  }

  // ── CHANNEL 3: roughness ──
  function roughness(angle: number): number {
    let r = astro.baziRoughness * 0.4;
    r += astroSignal(angle) * 0.2;

    // Tension zones increase roughness
    const tension = computeTensionFactor(angle, astro, bpiData);
    if (tension > 1.0) {
      r += (tension - 1.0) * 0.5; // tension → rougher texture
    }

    // Talk-zone quiz stamps increase roughness
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
    let cr = elem.colorR;
    let cg = elem.colorG;
    let cb = elem.colorB;
    let intensity = elem.strength * 0.8 + 0.15;

    // Quiz stamps can override/add color
    for (const stamp of quizStamps) {
      if (stamp.colorTint) {
        const stampAngle = sectorToAngle(stamp.sectorIndex);
        const dist = angleDiff(angle, stampAngle);
        const spreadWidth = sectorAngleWidth * stamp.spread;
        const influence = bell(dist, spreadWidth) * stamp.magnitude * 0.7;
        if (influence > 0.01) {
          const total = intensity + influence;
          cr = (cr * intensity + stamp.colorTint[0] * influence) / total;
          cg = (cg * intensity + stamp.colorTint[1] * influence) / total;
          cb = (cb * intensity + stamp.colorTint[2] * influence) / total;
          intensity = Math.min(1, total);
        }
      }
    }

    return [cr, cg, cb, intensity];
  }

  // ── CHANNEL 5: coronaFactor ──
  function coronaFactor(angle: number): number {
    let factor = 0.5 + astroSignal(angle) * 1.0;

    // Pillar depth boosts corona at strong pillar axes
    const depth = computePillarDepth(angle, bpiData);
    factor *= (1.0 + (depth - 1.0) * 0.2);

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

  // ── CHANNEL 7: pillarDepth ──
  function pillarDepth(angle: number): number {
    return computePillarDepth(angle, bpiData);
  }

  // ── CHANNEL 8: tensionFactor ──
  function tensionFactor(angle: number): number {
    return computeTensionFactor(angle, astro, bpiData);
  }

  // ── CHANNEL 9: sedimentOffset — S(θ) from accumulated transit deposits ──
  function sedimentOffset(angle: number): number {
    // Interpolate the accumulated sediment sectors
    const rawSediment = interpolateSediment(profile.sedimentation.sectors, angle);
    
    // Scale to appropriate visual range
    // Typical accumulated values after 1 year: 0.5–1.0
    // After 3 years: 1.5–3.0
    // We scale to match H(θ) range (~0.04 scale factor)
    // So sediment contributes similarly to harmonicShape
    return rawSediment * 0.05;
  }

  return { radiusOffset, tubeScale, roughness, colorTint, coronaFactor, harmonicShape, pillarDepth, tensionFactor, sedimentOffset };
}

// ──────────────────────────────────────────
// FRACTAL GEOMETRY SYSTEM
// ──────────────────────────────────────────

/**
 * Fractal Configuration derived from birth chart data.
 * Determines the geometric structure of the symmetric fractal.
 */
export interface FractalConfig {
  /** N-fold rotational symmetry (3-12, from dominant planetary harmonic) */
  primarySymmetry: number;
  /** Secondary harmonic orders for sub-branching */
  secondaryHarmonics: number[];
  /** Recursion depth (1-4), from Fire/Erde balance */
  branchingDepth: number;
  /** Angle of sub-branches from parent (radians) */
  branchingAngle: number;
  /** Base arm length (scaled 1.5-3.0) */
  armLength: number;
  /** Taper factor: how much arms thin toward tips (0.3-0.8) */
  armTaper: number;
  /** Organic asymmetry factor from Holz (0-1) */
  organicFactor: number;
  /** Tip sharpness from Feuer (0-1) */
  sharpness: number;
  /** Phase rotation offset (radians) */
  phaseOffset: number;
  /** Sub-branch length ratio */
  subBranchRatio: number;
  /** Wasser flow factor for soft movement */
  flowFactor: number;
}

/**
 * A single point in the fractal structure.
 */
export interface FractalPoint {
  x: number;
  y: number;
  z: number;
  /** Brightness from pillar depth + position */
  brightness: number;
  /** Thickness for particle spread */
  thickness: number;
  /** RGBA color modification */
  colorMod: [number, number, number, number];
  /** Roughness at this position */
  roughness: number;
  /** Angle from center (for deformation channel lookups) */
  angle: number;
}

/**
 * Computes fractal configuration from the birth chart profile.
 * The dominant planetary harmonic determines primary symmetry.
 * Wu Xing balance determines branching character.
 */
export function computeFractalConfig(profile: FusionRingProfile): FractalConfig {
  const { astro } = profile;
  const planets = astro.planets;
  const wuxing = astro.wuxingStrengths;
  const [wood, fire, earth, metal, water] = wuxing;

  // Find dominant harmonic by weighted planet contributions
  const harmonicWeights: Map<number, number> = new Map();
  for (const p of planets) {
    const n = PLANET_HARMONICS[p.planet];
    harmonicWeights.set(n, (harmonicWeights.get(n) || 0) + p.weight);
  }

  // Sort by weight to find primary and secondary
  const sorted = Array.from(harmonicWeights.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const primarySymmetry = sorted[0]?.[0] ?? 6;
  const secondaryHarmonics = sorted.slice(1, 4).map(s => s[0]);

  // Wu Xing determines fractal character:
  // Feuer → deep branching (2-4 levels)
  // Erde → shallow, wide (1-2 levels)
  // Holz → organic asymmetry
  // Metall → clean geometry
  // Wasser → flowing softness

  const branchingDepth = Math.round(1 + fire * 2.5 - earth * 1.5);
  const clampedDepth = Math.max(1, Math.min(4, branchingDepth));

  // Branching angle: Metall → narrow/precise, others → wider
  const baseAngle = Math.PI / (3 + metal * 2);
  const branchingAngle = baseAngle + wood * 0.15; // Wood adds slight variation

  // Arm length: balanced, slightly longer for Fire-dominant
  const armLength = 2.0 + fire * 0.5 - earth * 0.3;

  // Taper: Fire → sharp tips (low taper at end), Earth → broad bases
  const armTaper = 0.5 - fire * 0.2 + earth * 0.15;

  // Organic factor from Wood
  const organicFactor = wood;

  // Sharpness from Fire
  const sharpness = fire;

  // Phase offset from strongest planet's position
  const strongestPlanet = planets.reduce((a, b) => a.weight > b.weight ? a : b);
  const phaseOffset = degToRad(strongestPlanet.phaseDeg);

  // Sub-branch length ratio
  const subBranchRatio = 0.5 + metal * 0.15 - fire * 0.1;

  // Flow factor from Water
  const flowFactor = water;

  return {
    primarySymmetry,
    secondaryHarmonics,
    branchingDepth: clampedDepth,
    branchingAngle,
    armLength,
    armTaper,
    organicFactor,
    sharpness,
    phaseOffset,
    subBranchRatio,
    flowFactor,
  };
}

/**
 * Samples a point on the fractal structure.
 * 
 * @param t Position along arm (0 = center, 1 = tip)
 * @param armIndex Which primary arm (0 to N-1)
 * @param branchLevel Recursion level (0 = main arm, 1+ = sub-branches)
 * @param branchIndex Which sub-branch at this level
 * @param config Fractal configuration
 * @param channels Deformation channels for color/brightness
 * @param time Animation time for flow effects
 */
export function sampleFractalPoint(
  t: number,
  armIndex: number,
  branchLevel: number,
  branchIndex: number,
  config: FractalConfig,
  channels: DeformationChannels,
  time: number = 0
): FractalPoint {
  const N = config.primarySymmetry;
  
  // Base angle for this arm
  const armAngle = (armIndex / N) * Math.PI * 2 + config.phaseOffset;
  
  // Calculate branch direction
  let angle = armAngle;
  let baseRadius = 0;
  let lengthScale = config.armLength;
  
  // For sub-branches, offset angle and reduce length
  if (branchLevel > 0) {
    // Alternate left/right for sub-branches
    const side = branchIndex % 2 === 0 ? 1 : -1;
    const branchOffset = config.branchingAngle * side * (Math.floor(branchIndex / 2) + 1);
    angle += branchOffset;
    
    // Sub-branches start partway along parent
    baseRadius = config.armLength * 0.4 * branchLevel;
    lengthScale *= Math.pow(config.subBranchRatio, branchLevel);
  }
  
  // Organic variation (Wood influence)
  if (config.organicFactor > 0.1) {
    const organicWobble = Math.sin(armIndex * 2.7 + t * 5.3) * config.organicFactor * 0.1;
    angle += organicWobble;
    lengthScale *= (1.0 + Math.sin(armIndex * 1.3 + branchIndex * 0.7) * config.organicFactor * 0.15);
  }
  
  // Water flow effect (subtle animation)
  if (config.flowFactor > 0.1) {
    const flowWave = Math.sin(time * 0.3 + t * 2 + armIndex) * config.flowFactor * 0.05;
    angle += flowWave;
  }
  
  // Position along arm
  const r = baseRadius + t * lengthScale;
  
  // Spiral twist - arms curve outward instead of being straight radial
  // Creates more dynamic, fractal-like appearance
  const spiralTwist = t * 0.4 * (1 + config.organicFactor * 0.5); // More twist for organic profiles
  const twistedAngle = angle + spiralTwist;
  
  // Tapering: thickness decreases toward tips
  // t=0 → full thickness, t=1 → tapered
  const taperFactor = 1.0 - t * (1.0 - config.armTaper);
  
  // Sharpness affects the tip shape
  // High sharpness → exponential taper, low → linear
  const sharpTaper = config.sharpness > 0.3 
    ? Math.pow(taperFactor, 1 + config.sharpness)
    : taperFactor;
  
  // 3D position (fractal is mostly flat in XZ plane with subtle Y variation)
  const x = Math.cos(twistedAngle) * r;
  const z = Math.sin(twistedAngle) * r;
  
  // Y has subtle depth variation (pillar-influenced + branch level)
  const baseY = branchLevel * 0.05; // Sub-branches slightly elevated
  const pillarDepth = channels.pillarDepth(angle);
  const y = baseY + (pillarDepth - 1.0) * 0.1;
  
  // Get deformation channels at this angle
  const colorMod = channels.colorTint(angle);
  const roughness = channels.roughness(angle);
  
  // Brightness from pillar depth and position
  // Tips are slightly dimmer, bases brighter
  const baseBrightness = 0.6 + pillarDepth * 0.3;
  const tipDim = 1.0 - t * 0.3;
  const brightness = baseBrightness * tipDim;
  
  // Thickness for particle spread - very narrow for distinct arms
  const baseThickness = 0.025 * sharpTaper; // Very narrow for clear arm visibility
  const tubeScale = channels.tubeScale(angle);
  const thickness = baseThickness * tubeScale;
  
  return {
    x,
    y,
    z,
    brightness,
    thickness,
    colorMod,
    roughness,
    angle: twistedAngle, // Use twisted angle for visual continuity
  };
}

/**
 * Generates all fractal arm segments for particle distribution.
 * Returns an array of arm descriptors for the canvas to iterate over.
 */
export interface FractalArm {
  armIndex: number;
  branchLevel: number;
  branchIndex: number;
  startT: number;
  endT: number;
  particleWeight: number; // Relative particle density for this segment
}

export function generateFractalArms(config: FractalConfig): FractalArm[] {
  const arms: FractalArm[] = [];
  const N = config.primarySymmetry;
  
  // Generate primary arms
  for (let i = 0; i < N; i++) {
    arms.push({
      armIndex: i,
      branchLevel: 0,
      branchIndex: 0,
      startT: 0,
      endT: 1,
      particleWeight: 1.0,
    });
  }
  
  // Generate sub-branches based on branching depth
  if (config.branchingDepth >= 2) {
    const secondaryN = config.secondaryHarmonics[0] ?? 3;
    for (let i = 0; i < N; i++) {
      for (let b = 0; b < Math.min(secondaryN, 4); b++) {
        arms.push({
          armIndex: i,
          branchLevel: 1,
          branchIndex: b,
          startT: 0.3,
          endT: 1,
          particleWeight: 0.6,
        });
      }
    }
  }
  
  // Third level for deep branching
  if (config.branchingDepth >= 3) {
    const tertiaryN = config.secondaryHarmonics[1] ?? 2;
    for (let i = 0; i < N; i++) {
      for (let b = 0; b < Math.min(tertiaryN, 3); b++) {
        arms.push({
          armIndex: i,
          branchLevel: 2,
          branchIndex: b,
          startT: 0.5,
          endT: 1,
          particleWeight: 0.35,
        });
      }
    }
  }
  
  // Fourth level (only for very fire-dominant)
  if (config.branchingDepth >= 4) {
    for (let i = 0; i < N; i++) {
      for (let b = 0; b < 2; b++) {
        arms.push({
          armIndex: i,
          branchLevel: 3,
          branchIndex: b,
          startT: 0.6,
          endT: 1,
          particleWeight: 0.2,
        });
      }
    }
  }
  
  return arms;
}

// ──────────────────────────────────────────
// DEMO PROFILE GENERATOR
// ──────────────────────────────────────────

/**
 * Creates a visually dramatic demo profile based on the spec's test person:
 * 15.07.1990 Berlin — Krebs-Sonne, echte FuFirE-inspirierte Daten.
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
        0.64, // Wood — dominant in western
        0.43, // Fire
        0.17, // Earth — weakest
        0.26, // Metal
        0.56, // Water — second strongest
      ],
      dominantElement: 0, // Wood
      ascendantSector: 4, // Löwe rising
      baziRoughness: 0.6,

      // ── Planetary Harmonics (Schicht A) ──
      planets: [
        { planet: 'sun',     weight: 1.0,  phaseDeg: 112.8 }, // Krebs-Sonne
        { planet: 'moon',    weight: 0.9,  phaseDeg: 23.5 },  // Widder-Mond
        { planet: 'mercury', weight: 0.7,  phaseDeg: 126.8 }, // Löwe-Merkur
        { planet: 'venus',   weight: 0.8,  phaseDeg: 98.5 },  // Krebs-Venus
        { planet: 'mars',    weight: 0.65, phaseDeg: 42.1 },  // Stier-Mars
        { planet: 'jupiter', weight: 0.6,  phaseDeg: 112.6 }, // Krebs-Jupiter
        { planet: 'saturn',  weight: 0.5,  phaseDeg: 292.0 }, // Steinbock-Saturn
      ],

      // ── BaZi Data (Schicht C) ──
      bpiData: {
        dayMasterElement: 'metal', // Xin (辛) = Yin Metal → pure sine waveform
        pillars: [
          // Year Pillar (0°): Geng-Wu = Metal stem + Fire branch
          {
            stemElement: 'metal',
            branchElement: 'fire',
            hiddenStems: [
              { element: 'fire', weight: 1.0 },
              { element: 'earth', weight: 0.3 },
            ],
            strength: 0.75,
          },
          // Month Pillar (90°): Gui-Wei = Water stem + Earth branch
          {
            stemElement: 'water',
            branchElement: 'earth',
            hiddenStems: [
              { element: 'earth', weight: 1.0 },
              { element: 'fire', weight: 0.5 },
              { element: 'wood', weight: 0.3 },
            ],
            strength: 0.65,
          },
          // Day Pillar (180°): Xin-Si = Metal stem + Fire branch
          {
            stemElement: 'metal',
            branchElement: 'fire',
            hiddenStems: [
              { element: 'fire', weight: 1.0 },
              { element: 'metal', weight: 0.5 },
              { element: 'earth', weight: 0.3 },
            ],
            strength: 0.85,
          },
          // Hour Pillar (270°): Yi-Wei = Wood stem + Earth branch
          {
            stemElement: 'wood',
            branchElement: 'earth',
            hiddenStems: [
              { element: 'earth', weight: 1.0 },
              { element: 'fire', weight: 0.5 },
              { element: 'wood', weight: 0.3 },
            ],
            strength: 0.55,
          },
        ],
        harmonyIndex: 0.77, // Good congruence between Western and BaZi
        baziWuxingStrengths: [
          0.31, // Wood
          0.58, // Fire — BaZi dominant
          0.54, // Earth
          0.48, // Metal
          0.19, // Water — BaZi weakest
        ],
      },
    },
    quizStamps: [
      // === Flow Zones → Bulges (strengths) ===
      {
        sectorIndex: 7,
        type: 'bulge',
        magnitude: 0.8,
        spread: 1.2,
        colorTint: [0.3, 0.6, 1.0],
        sourceQuiz: 'bindung_cluster_1',
      },
      {
        sectorIndex: 4,
        type: 'bulge',
        magnitude: 0.6,
        spread: 1.0,
        colorTint: [1.0, 0.6, 0.2],
        sourceQuiz: 'werte_cluster_2',
      },

      // === Talk Zones → Dents (areas needing work) ===
      {
        sectorIndex: 5,
        type: 'dent',
        magnitude: 0.7,
        spread: 0.8,
        sourceQuiz: 'alltag_cluster_1',
      },
      {
        sectorIndex: 9,
        type: 'dent',
        magnitude: 0.5,
        spread: 1.0,
        sourceQuiz: 'werte_cluster_3',
      },

      // === Spark Zones → Ridges (exciting contrasts) ===
      {
        sectorIndex: 2,
        type: 'ridge',
        magnitude: 0.75,
        spread: 0.6,
        colorTint: [0.4, 1.0, 0.5],
        sourceQuiz: 'film_cluster_1',
      },

      // === Accumulated patterns ===
      {
        sectorIndex: 11,
        type: 'groove',
        magnitude: 0.6,
        spread: 1.4,
        sourceQuiz: 'intimität_cluster_1',
      },
      {
        sectorIndex: 0,
        type: 'thickening',
        magnitude: 0.7,
        spread: 1.0,
        colorTint: [1.0, 0.3, 0.2],
        sourceQuiz: 'alltag_cluster_2',
      },
      {
        sectorIndex: 8,
        type: 'thinning',
        magnitude: 0.5,
        spread: 0.9,
        sourceQuiz: 'abenteuer_cluster_1',
      },
    ],

    // ── Soulprint Sedimentation (Term S) ──
    // Demo: Simulates ~1 year of transit accumulation
    // Test person born 15.07.1990 → some sectors have accumulated sediment
    sedimentation: {
      sectors: [
        0.25,  // Widder — moderate Mars transits
        0.08,  // Stier — low activity
        0.42,  // Zwillinge — Mercury transits
        0.65,  // Krebs — STRONGEST (natal Sun, Jupiter return zone)
        0.35,  // Löwe — moderate Sun transits
        0.12,  // Jungfrau — low
        0.18,  // Waage — low
        0.55,  // Skorpion — second strongest (dominant sector)
        0.30,  // Schütze — Jupiter resonance
        0.15,  // Steinbock — Saturn passing
        0.22,  // Wassermann — Uranus influence
        0.48,  // Fische — strong intuition sector
      ],
      history: [
        // Sample historical deposits
        {
          eventDate: '2025-07-15',
          eventType: 'resonance_jump',
          sector: 3, // Krebs — Jupiter return
          triggerPlanet: 'jupiter',
          depositStrength: 0.0102,
          spread: 0.52,
        },
        {
          eventDate: '2025-10-01',
          eventType: 'dominance_shift',
          sector: 7, // Skorpion
          triggerPlanet: 'mars',
          depositStrength: 0.0075,
          spread: 0.52,
        },
        {
          eventDate: '2026-01-20',
          eventType: 'moon_event',
          sector: 11, // Fische
          triggerPlanet: 'moon',
          depositStrength: 0.0048,
          spread: 0.52,
        },
      ],
      updatedAt: Date.now(),
    },
  };
}
