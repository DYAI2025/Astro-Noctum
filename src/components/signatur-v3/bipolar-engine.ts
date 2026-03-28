/**
 * Bazodiac Signature V3 — Bipolar Trail Engine
 *
 * 6 Dimensionen → 12 Pole (je 2 gegensätzliche Pole pro Dimension).
 * Jeder Pol bewegt sich auf einer eigenen Bahn und zeichnet eine Spur.
 * Die akkumulierten Spuren SIND die Signatur.
 *
 * Bewegungsmuster kodiert Dissonanz:
 *   - Konsonanz: Pole bewegen sich symmetrisch um den Mittelpunkt
 *   - Dissonanz: Pole bewegen sich gegenläufig DURCH den Mittelpunkt
 *
 * Die Form emergiert dort wo die meisten Spuren überlagern.
 */

export type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
export { computeDayHarmonic } from '../../lib/fusion-ring/day-harmonic';
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
import type { DissonanceResult } from '../../lib/fusion-ring/dissonance';
import type { VisualModulation } from '../../lib/fusion-ring/dissonance-visual';

// ═══════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════

export interface DimensionDef {
  id: string;
  poleA: string;         // e.g. "Durchsetzung"
  poleB: string;         // e.g. "Hingabe"
  /** Base angular position on the circle (radians) — like zodiac placement */
  baseAngle: number;
  /** Cousto Hz — drives movement speed and curve parameters */
  hz: number;
  /** Color for pole A */
  colorA: [number, number, number];
  /** Color for pole B */
  colorB: [number, number, number];
}

export interface PoleState {
  dimensionId: string;
  pole: 'A' | 'B';
  /** Current position */
  x: number;
  y: number;
  /** Angular parameter (advances each frame) */
  theta: number;
  /** Radial offset from dimension's base orbit */
  radius: number;
  /** Movement speed (radians per frame) */
  speed: number;
  /** Trail: accumulated positions */
  trail: Float32Array;
  /** Current write index in trail buffer */
  trailHead: number;
  /** How many trail points are filled */
  trailLength: number;
}

export interface SignaturV3Config {
  /** Canvas radius in pixels */
  maxR: number;
  /** Maximum trail length per pole */
  maxTrailLength: number;
  /** Trail fade factor (0-1, higher = longer persistence) */
  trailPersistence: number;
  /** Global time scale */
  timeScale: number;
}

export interface V3DissonanceState {
  /** Per-dimension dissonance [0,1] — how much the quiz deviates from natal for this axis */
  dimensional: Map<string, number>;
  /** Global natal dissonance */
  dNatal: number;
  /** Global accumulated dissonance */
  dAccumulated: number;
  /** Elemental quality: -1 = Ke (crystalline), 0 = neutral, 1 = Sheng (organic) */
  elementalQuality: number;
}

/** Solar weather modulation for the membrane layer */
export interface SolarModulation {
  /** Ring intensity multiplier 1.0 (calm) to 1.5 (extreme storm) */
  ringModulation: number;
  /** Whether a G3+ storm effect should trigger */
  triggerEffect: boolean;
  /** Kp index 0-9 for intensity scaling */
  kpIndex: number;
  /** Per-dimension solar multipliers from cosmic resonance (personalized) */
  dimensionMultipliers?: Record<string, number>;
}

// ═══════════════════════════════════════
//  DIMENSION DEFINITIONS
// ═══════════════════════════════════════

/**
 * 6 Dimensions, each with 2 poles = 12 poles.
 * Placed at 30° intervals around the circle (like zodiac signs).
 * Each dimension's poles are opposite (180° apart).
 *
 * Pole A sits at baseAngle, Pole B at baseAngle + π.
 */
export const DIMENSIONS: DimensionDef[] = [
  {
    id: 'assertion',
    poleA: 'Durchsetzung',
    poleB: 'Hingabe',
    baseAngle: 0,                    // 0° — Aries position
    hz: 144.72,                      // Mars frequency
    colorA: [1.0, 0.15, 0.12],      // Mars red
    colorB: [0.68, 0.55, 1.0],      // Soft violet
  },
  {
    id: 'empathy',
    poleA: 'Einfühlung',
    poleB: 'Abgrenzung',
    baseAngle: Math.PI / 3,          // 60° — Cancer-adjacent
    hz: 210.42,                      // Moon frequency
    colorA: [0.68, 0.55, 1.0],      // Moon violet
    colorB: [0.38, 0.52, 0.72],     // Saturn steel
  },
  {
    id: 'creativity',
    poleA: 'Schöpfung',
    poleB: 'Struktur',
    baseAngle: (2 * Math.PI) / 3,   // 120° — Leo position
    hz: 126.22,                      // Sun frequency
    colorA: [1.0, 0.72, 0.12],      // Sun gold
    colorB: [0.20, 0.95, 1.0],      // Mercury cyan
  },
  {
    id: 'logic',
    poleA: 'Analyse',
    poleB: 'Synthese',
    baseAngle: Math.PI,              // 180° — Virgo-Libra
    hz: 141.27,                      // Mercury frequency
    colorA: [0.20, 0.95, 1.0],      // Mercury cyan
    colorB: [1.0, 0.40, 0.72],      // Venus pink
  },
  {
    id: 'intuition',
    poleA: 'Ahnung',
    poleB: 'Evidenz',
    baseAngle: (4 * Math.PI) / 3,   // 240° — Sagittarius
    hz: 183.58,                      // Jupiter frequency
    colorA: [1.0, 0.88, 0.0],       // Jupiter gold
    colorB: [0.38, 0.52, 0.72],     // Saturn steel
  },
  {
    id: 'discipline',
    poleA: 'Ordnung',
    poleB: 'Freiheit',
    baseAngle: (5 * Math.PI) / 3,   // 300° — Capricorn-Aquarius
    hz: 147.85,                      // Saturn frequency
    colorA: [0.38, 0.52, 0.72],     // Saturn steel
    colorB: [1.0, 0.88, 0.0],       // Jupiter gold
  },
];

// ═══════════════════════════════════════
//  MATH UTILITIES
// ═══════════════════════════════════════

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Deterministic hash [0,1] */
function hash01(seed: number, k: number): number {
  return ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453123) % 1 + 1) % 1;
}

/** Log-normalize Hz to [0,1] range */
function logNormHz(freq: number): number {
  const lo = Math.log(100);
  const hi = Math.log(300);
  return clamp((Math.log(freq) - lo) / (hi - lo), 0, 1);
}

// ═══════════════════════════════════════
//  POLE INITIALIZATION
// ═══════════════════════════════════════

export function initializePoles(
  config: SignaturV3Config,
  natalWeights: Map<string, number>,
  quizWeights: Map<string, number>,
): PoleState[] {
  const poles: PoleState[] = [];

  for (const dim of DIMENSIONS) {
    const natalValue = natalWeights.get(dim.id) ?? 0.5;
    const quizValue = quizWeights.get(dim.id) ?? 0.5;
    const hzNorm = logNormHz(dim.hz);

    // Base orbital radius — natal determines the "home" radius
    const baseRadius = config.maxR * lerp(0.25, 0.75, natalValue);

    // Speed derived from Cousto frequency — faster planets move faster
    const baseSpeed = 0.003 + hzNorm * 0.008;

    for (const pole of ['A', 'B'] as const) {
      const angleOffset = pole === 'A' ? 0 : Math.PI;
      const startAngle = dim.baseAngle + angleOffset;

      // Pole B's radius is influenced by quiz deviation
      const radiusMod = pole === 'A' ? 1.0 : lerp(0.7, 1.3, quizValue);
      const radius = baseRadius * radiusMod;

      // Pole B moves slightly differently — phase offset from quiz
      const speedMod = pole === 'A' ? 1.0 : lerp(0.8, 1.2, 1 - quizValue);

      // Allocate trail buffer (x,y pairs)
      const trail = new Float32Array(config.maxTrailLength * 2);

      poles.push({
        dimensionId: dim.id,
        pole,
        x: Math.cos(startAngle) * radius,
        y: Math.sin(startAngle) * radius,
        theta: startAngle,
        radius,
        speed: baseSpeed * speedMod * config.timeScale,
        trail,
        trailHead: 0,
        trailLength: 0,
      });
    }
  }

  return poles;
}

// ═══════════════════════════════════════
//  DISSONANCE COMPUTATION
// ═══════════════════════════════════════

/**
 * Compute V3 per-dimension dissonance from natal and quiz weights.
 * When an external DissonanceResult is provided (from the full 3-layer model),
 * its global values (d_natal, d_accumulated, d_elemental) are used.
 * Otherwise falls back to local per-dimension deviation.
 */
export function computeV3Dissonance(
  natalWeights: Map<string, number>,
  quizWeights: Map<string, number>,
  external?: DissonanceResult | null,
): V3DissonanceState {
  const dimensional = new Map<string, number>();
  let totalDeviation = 0;

  for (const dim of DIMENSIONS) {
    const natal = natalWeights.get(dim.id) ?? 0.5;
    const quiz = quizWeights.get(dim.id) ?? 0.5;
    const deviation = Math.abs(quiz - natal);
    dimensional.set(dim.id, deviation);
    totalDeviation += deviation;
  }

  // Use external 3-layer dissonance if available, otherwise local approximation
  const dNatal = external?.d_natal ?? clamp(totalDeviation / DIMENSIONS.length / 0.5, 0, 1);
  const dAccumulated = external?.d_accumulated ?? 0;

  // Map elemental type to quality scalar: Ke = -1, Sheng = +1, neutral = 0
  let elementalQuality = 0;
  if (external?.d_elemental) {
    const el = external.d_elemental;
    if (el.type === 'ke') elementalQuality = -clamp(el.magnitude, 0, 1);
    else if (el.type === 'sheng') elementalQuality = clamp(el.magnitude, 0, 1);
  }

  return { dimensional, dNatal, dAccumulated, elementalQuality };
}

/** @deprecated Use computeV3Dissonance — kept for backward compat with MiniSignature */
export function computeDissonance(
  natalWeights: Map<string, number>,
  quizWeights: Map<string, number>,
): V3DissonanceState {
  return computeV3Dissonance(natalWeights, quizWeights);
}

/**
 * Return a modulated config based on the day's harmonic state.
 * Pulse → higher trailPersistence (trails condense, calm).
 * Trace → slightly lower trailPersistence (trails burn in, fade faster).
 */
export function modulateConfig(
  base: SignaturV3Config,
  dayHarmonic: DayHarmonicState,
): SignaturV3Config {
  let trailPersistence = base.trailPersistence;
  if (dayHarmonic.mode === 'pulse') {
    trailPersistence = clamp(base.trailPersistence + dayHarmonic.intensity * 0.12, 0, 0.99);
  } else {
    trailPersistence = clamp(base.trailPersistence - dayHarmonic.intensity * 0.06, 0, 0.99);
  }
  return { ...base, trailPersistence };
}

// ═══════════════════════════════════════
//  MOVEMENT UPDATE (per frame)
// ═══════════════════════════════════════

/**
 * Core movement law:
 *
 * Each pole pair moves according to their dimension's dissonance:
 *
 * LOW dissonance (consonant):
 *   Both poles orbit symmetrically around center.
 *   Smooth, circular paths. Trails overlap → form densifies.
 *
 * HIGH dissonance (dissonant):
 *   Poles move counter-directionally THROUGH the center.
 *   Lissajous-like crossings. Trails diverge → form breaks open.
 *
 * The interpolation between these two modes is continuous —
 * there's no switch, just a gradient from harmony to tension.
 */
export function updatePoles(
  poles: PoleState[],
  dissonance: V3DissonanceState,
  config: SignaturV3Config,
  time: number,
  dayHarmonic?: DayHarmonicState,
  solar?: SolarModulation,
): void {
  for (let i = 0; i < poles.length; i += 2) {
    const poleA = poles[i]!;
    const poleB = poles[i + 1]!;
    const dimId = poleA.dimensionId;
    const dim = DIMENSIONS[i / 2]!;
    const d = dissonance.dimensional.get(dimId) ?? 0;

    // Advance theta
    poleA.theta += poleA.speed;
    poleB.theta += poleB.speed;

    // === CONSONANT MODE (d → 0): Symmetric orbit ===
    // Both poles trace circles/ellipses around center, 180° apart
    const symmetricAx = Math.cos(poleA.theta) * poleA.radius;
    const symmetricAy = Math.sin(poleA.theta) * poleA.radius;
    const symmetricBx = Math.cos(poleB.theta + Math.PI) * poleB.radius;
    const symmetricBy = Math.sin(poleB.theta + Math.PI) * poleB.radius;

    // === DISSONANT MODE (d → 1): Counter-directional through center ===
    // Lissajous pattern: poles cross through center with frequency ratios
    const freqRatio = 1 + hash01(dim.hz, 3) * 2; // 1-3 ratio for variety
    const lissajousAx = Math.cos(poleA.theta) * poleA.radius;
    const lissajousAy = Math.sin(poleA.theta * freqRatio) * poleA.radius;
    const lissajousBx = Math.cos(poleB.theta + Math.PI) * poleB.radius;
    const lissajousBy = Math.sin(poleB.theta * freqRatio + Math.PI) * poleB.radius;

    // === BLEND between consonant and dissonant ===
    // d=0 → pure symmetric, d=1 → pure lissajous
    let blend = clamp(d * 2, 0, 1); // amplify small dissonances

    // Day-Trace: boost Lissajous blend for high-Hz dimensions (Moon ≈ 0.81, Jupiter ≈ 0.67).
    // Threshold 0.4 selects exactly these 2 out of 6 — matching design doc "top 2 crossing dims".
    // If adding new dimensions with Hz 140–150 range, re-verify this threshold holds.
    if (dayHarmonic?.mode === 'trace') {
      const hzNorm = logNormHz(dim.hz);
      // Boosts Moon (0.81) and Jupiter (0.67); skips Sun/Mercury/Mars/Saturn (≤ 0.38)
      if (hzNorm >= 0.4) {
        blend = clamp(blend + dayHarmonic.intensity * 0.6, 0, 1);
      }
    }

    poleA.x = lerp(symmetricAx, lissajousAx, blend);
    poleA.y = lerp(symmetricAy, lissajousAy, blend);
    poleB.x = lerp(symmetricBx, lissajousBx, blend);
    poleB.y = lerp(symmetricBy, lissajousBy, blend);

    // === DISSONANCE VIBRATION ===
    // High dissonance adds micro-oscillation (crystalline for Ke, flowing for Sheng)
    if (d > 0.1) {
      const vibAmp = d * config.maxR * 0.03;
      const vibFreq = dissonance.elementalQuality < 0
        ? 12.0  // Ke: high-frequency angular vibration
        : 3.0;  // Sheng: slow organic pulse
      const vib = Math.sin(time * vibFreq + dim.baseAngle) * vibAmp;

      // Apply perpendicular to movement direction
      const perpA = poleA.theta + Math.PI / 2;
      poleA.x += Math.cos(perpA) * vib;
      poleA.y += Math.sin(perpA) * vib;

      const perpB = poleB.theta + Math.PI / 2;
      poleB.x += Math.cos(perpB) * vib * -1; // opposite vibration
      poleB.y += Math.sin(perpB) * vib * -1;
    }

    // === DAY-TRACE: micro-vibration at crossing points ===
    if (dayHarmonic?.mode === 'trace' && blend > 0.3) {
      const vibAmp = dayHarmonic.intensity * config.maxR * 0.015;
      const vibFreq = 6.0 + dayHarmonic.intensity * 8.0; // faster when more intense
      const crossVib = Math.sin(time * vibFreq + dim.baseAngle * 2) * vibAmp;
      const perpA = poleA.theta + Math.PI / 2;
      poleA.x += Math.cos(perpA) * crossVib;
      poleA.y += Math.sin(perpA) * crossVib;
      const perpB = poleB.theta + Math.PI / 2;
      poleB.x += Math.cos(perpB) * crossVib * -1;
      poleB.y += Math.sin(perpB) * crossVib * -1;
    }

    // === ACCUMULATED DISSONANCE → trail complexity ===
    // High d_accumulated causes micro-jitter that creates richer trail patterns
    if (dissonance.dAccumulated > 0.1) {
      const jitterAmp = dissonance.dAccumulated * config.maxR * 0.015;
      const jitterFreq = 7.0 + dissonance.dAccumulated * 5.0;
      const jA = Math.sin(time * jitterFreq + dim.baseAngle * 3) * jitterAmp;
      const jB = Math.cos(time * jitterFreq + dim.baseAngle * 3) * jitterAmp;
      poleA.x += jA;
      poleA.y += jB;
      poleB.x -= jA;
      poleB.y -= jB;
    }

    // === SOLAR MODULATION → membrane intensity (personalized via resonance) ===
    if (solar && solar.ringModulation > 1.0) {
      // Per-dimension multiplier from cosmic resonance (default 1.0 if not available)
      const dimMul = solar.dimensionMultipliers?.[dimId] ?? 1.0;
      const expansion = (solar.ringModulation - 1.0) * 0.5 * (dimMul - 0.5); // resonance-weighted

      poleA.x *= (1 + expansion);
      poleA.y *= (1 + expansion);
      poleB.x *= (1 + expansion);
      poleB.y *= (1 + expansion);

      // G3+ storms add high-frequency pulsation, scaled by dimension resonance
      if (solar.triggerEffect) {
        const stormPulse = Math.sin(time * 20 + dim.hz * 0.1) * config.maxR * 0.02 * dimMul;
        poleA.x += stormPulse;
        poleB.x -= stormPulse;
      }
    }

    // === RECORD TRAIL ===
    recordTrail(poleA, config);
    recordTrail(poleB, config);
  }
}

function recordTrail(pole: PoleState, config: SignaturV3Config): void {
  const idx = pole.trailHead * 2;
  pole.trail[idx] = pole.x;
  pole.trail[idx + 1] = pole.y;
  pole.trailHead = (pole.trailHead + 1) % config.maxTrailLength;
  if (pole.trailLength < config.maxTrailLength) {
    pole.trailLength++;
  }
}

// ═══════════════════════════════════════
//  DENSITY FIELD (where trails accumulate)
// ═══════════════════════════════════════

/**
 * Compute a density map from all trails.
 * This is the "form" — where the most traces overlap,
 * the signature is densest/brightest.
 *
 * Returns a grid of accumulated intensities.
 */
export interface DensityField {
  grid: Float32Array;
  width: number;
  height: number;
  maxDensity: number;
}

export function computeDensityField(
  poles: PoleState[],
  config: SignaturV3Config,
  resolution: number = 128,
): DensityField {
  const grid = new Float32Array(resolution * resolution);
  const halfRes = resolution / 2;
  const scale = halfRes / config.maxR;
  let maxDensity = 0;

  for (const pole of poles) {
    for (let i = 0; i < pole.trailLength; i++) {
      const x = pole.trail[i * 2]!;
      const y = pole.trail[i * 2 + 1]!;

      // Map to grid coordinates
      const gx = Math.floor(x * scale + halfRes);
      const gy = Math.floor(y * scale + halfRes);

      if (gx >= 0 && gx < resolution && gy >= 0 && gy < resolution) {
        // Newer trail points contribute more
        const age = (pole.trailHead - i + pole.trailLength) % pole.trailLength;
        const freshness = 1 - (age / pole.trailLength) * (1 - config.trailPersistence);

        const idx = gy * resolution + gx;
        grid[idx]! += freshness;
        if (grid[idx]! > maxDensity) maxDensity = grid[idx]!;
      }
    }
  }

  return { grid, width: resolution, height: resolution, maxDensity };
}
