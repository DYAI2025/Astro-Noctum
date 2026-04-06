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
 *
 * Debug-Integration (DevUI):
 *   - DebugInjection ermöglicht gesteuerte Overrides für Testing
 *   - Nur im Development-Build aktiv (NODE_ENV === 'development')
 *   - Wird in Production durch Tree-Shaking entfernt
 */

export type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
export { computeDayHarmonic } from '../../lib/fusion-ring/day-harmonic';
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
import type { DissonanceResult } from '../../lib/fusion-ring/dissonance';
import type { VisualModulation } from '../../lib/fusion-ring/dissonance-visual';

// DebugInjection für DevUI-Overrides
import { DebugInjection, isDebugMode } from '../../debug/debug-injection';
import type { DebugOverrides } from '../../debug/types';

// DimensionDef and DIMENSION_DEFS are the Single Source of Truth in @bazodiac/shared.
// Re-exported here so existing imports from this file continue to work.
export type { DimensionDef } from '@/packages/shared/src/signatur/dimension-defs';
export { DIMENSION_DEFS } from '@/packages/shared/src/signatur/dimension-defs';
import { DIMENSION_DEFS } from '@/packages/shared/src/signatur/dimension-defs';

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

// DIMENSIONS is an alias for DIMENSION_DEFS (imported from @bazodiac/shared).
// Kept for backward-compat with any internal usages within this file.
// External consumers should import DIMENSION_DEFS from @/packages/shared/src/signatur.
/** @deprecated Use DIMENSION_DEFS from @bazodiac/shared */
export const DIMENSIONS = DIMENSION_DEFS;

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
  // Debug-Overrides anwenden (NUR im Dev-Build)
  let effectiveNatal = natalWeights;
  let effectiveQuiz = quizWeights;

  if (isDebugMode()) {
    const debug = DebugInjection.getInstance();
    const overrides = debug.getOverrides();

    if (overrides.natalOverride) {
      effectiveNatal = overrides.natalOverride;
    }
    if (overrides.quizOverride) {
      effectiveQuiz = overrides.quizOverride;
    }
  }

  const poles: PoleState[] = [];

  for (const dim of DIMENSION_DEFS) {
    const natalValue = effectiveNatal.get(dim.id) ?? 0.5;
    const quizValue = effectiveQuiz.get(dim.id) ?? 0.5;
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
 *
 * Debug-Integration:
 *   - forceConsonance: setzt alle Dissonanzen auf 0
 *   - forceDissonance: setzt alle Dissonanzen auf 1
 *   - dissonanceOverride: manuelle Dissonanz-Werte pro Dimension
 *   - dissonanceScale: globale Skalierung (0-2)
 */
export function computeV3Dissonance(
  natalWeights: Map<string, number>,
  quizWeights: Map<string, number>,
  external?: DissonanceResult | null,
): V3DissonanceState {
  const dimensional = new Map<string, number>();
  let totalDeviation = 0;

  for (const dim of DIMENSION_DEFS) {
    const natal = natalWeights.get(dim.id) ?? 0.5;
    const quiz = quizWeights.get(dim.id) ?? 0.5;
    const deviation = Math.abs(quiz - natal);
    dimensional.set(dim.id, deviation);
    totalDeviation += deviation;
  }

  // Use external 3-layer dissonance if available, otherwise local approximation
  let dNatal = external?.d_natal ?? clamp(totalDeviation / DIMENSION_DEFS.length / 0.5, 0, 1);
  const dAccumulated = external?.d_accumulated ?? 0;

  // Map elemental type to quality scalar: Ke = -1, Sheng = +1, neutral = 0
  let elementalQuality = 0;
  if (external?.d_elemental) {
    const el = external.d_elemental;
    if (el.type === 'ke') elementalQuality = -clamp(el.magnitude, 0, 1);
    else if (el.type === 'sheng') elementalQuality = clamp(el.magnitude, 0, 1);
  }

  // Debug-Overrides anwenden (NUR im Dev-Build)
  if (isDebugMode()) {
    const debug = DebugInjection.getInstance();
    const overrides = debug.getOverrides();

    if (overrides.forceConsonance) {
      // Alle Dissonanzen auf 0 (reine Konsonanz)
      for (const dim of DIMENSION_DEFS) {
        dimensional.set(dim.id, 0);
      }
      dNatal = 0;
    } else if (overrides.forceDissonance) {
      // Alle Dissonanzen auf 1 (maximale Spannung)
      for (const dim of DIMENSION_DEFS) {
        dimensional.set(dim.id, 1);
      }
      dNatal = 1;
    } else if (overrides.dissonanceOverride) {
      // Manuelle Dissonanz-Werte pro Dimension
      for (const dim of DIMENSION_DEFS) {
        const overrideValue = overrides.dissonanceOverride!.get(dim.id);
        if (overrideValue !== undefined) {
          dimensional.set(dim.id, overrideValue);
        }
      }
      // dNatal als Durchschnitt berechnen
      let sum = 0;
      for (const d of dimensional.values()) sum += d;
      dNatal = sum / DIMENSION_DEFS.length;
    } else if (overrides.dissonanceScale !== undefined) {
      // Globale Skalierung
      for (const dim of DIMENSION_DEFS) {
        const scaled = clamp((dimensional.get(dim.id) ?? 0) * overrides.dissonanceScale!, 0, 1);
        dimensional.set(dim.id, scaled);
      }
      dNatal = clamp(dNatal * overrides.dissonanceScale!, 0, 1);
    }
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
//  DISSONANCE MORPH (Quiz-Completion Transitions)
// ═══════════════════════════════════════

/**
 * Active morph transition between two dissonance states.
 * Created by createV3Morph, advanced by tickV3Morph each render frame.
 */
export interface V3MorphState {
  from: V3DissonanceState;
  to: V3DissonanceState;
  /** Total duration in seconds (default 2.0) */
  duration: number;
  /** Elapsed time in seconds — mutated by tickV3Morph */
  elapsed: number;
  /** Whether the morph is still in progress */
  active: boolean;
}

/** Smooth S-curve easing for organic quiz-morph transitions (smoothstep) */
function morphEase(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Linearly interpolate between two V3DissonanceStates at position t ∈ [0,1].
 * Used internally by tickV3Morph; exported for testing.
 */
export function lerpV3DissonanceState(
  from: V3DissonanceState,
  to: V3DissonanceState,
  t: number,
): V3DissonanceState {
  const dimensional = new Map<string, number>();
  for (const [k, vFrom] of from.dimensional) {
    dimensional.set(k, lerp(vFrom, to.dimensional.get(k) ?? vFrom, t));
  }
  return {
    dimensional,
    dNatal: lerp(from.dNatal, to.dNatal, t),
    dAccumulated: lerp(from.dAccumulated, to.dAccumulated, t),
    elementalQuality: lerp(from.elementalQuality, to.elementalQuality, t),
  };
}

/**
 * Create a new morph transition from `from` → `to` over `durationSeconds` seconds.
 * Default 2.0s matches REQ-F-signatur-quiz-morph (~2 seconds gradual transition).
 */
export function createV3Morph(
  from: V3DissonanceState,
  to: V3DissonanceState,
  durationSeconds = 2.0,
): V3MorphState {
  return { from, to, duration: durationSeconds, elapsed: 0, active: true };
}

/**
 * Advance the morph by `dt` seconds and return the current interpolated dissonance state.
 * Mutates morph.elapsed and morph.active in-place.
 * When the morph completes, morph.active is set to false and the final state (morph.to) is returned.
 */
export function tickV3Morph(morph: V3MorphState, dt: number): V3DissonanceState {
  morph.elapsed = Math.min(morph.elapsed + dt, morph.duration);
  const rawT = morph.duration > 0 ? morph.elapsed / morph.duration : 1;
  morph.active = rawT < 1;
  return lerpV3DissonanceState(morph.from, morph.to, morphEase(rawT));
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
 *
 * Debug-Integration:
 *   - timeFreeze: Animation anhalten
 *   - timeScrub: Manueller Zeit-Offset
 *   - timeSpeed: Zeit-Geschwindigkeit (0.1x - 10x)
 *   - persistenceOverride: Trail-Persistenz überschreiben
 *   - trailLengthOverride: Trail-Länge überschreiben
 */
export function updatePoles(
  poles: PoleState[],
  dissonance: V3DissonanceState,
  config: SignaturV3Config,
  time: number,
  dayHarmonic?: DayHarmonicState,
  solar?: SolarModulation,
): void {
  // Debug Time-Controls anwenden (NUR im Dev-Build)
  let effectiveTime = time;
  let effectiveConfig = config;

  if (isDebugMode()) {
    const debug = DebugInjection.getInstance();
    const overrides = debug.getOverrides();

    // Time-Controls
    if (overrides.timeFreeze) {
      effectiveTime = 0;
    } else if (overrides.timeScrub !== undefined) {
      effectiveTime = overrides.timeScrub;
    } else if (overrides.timeSpeed !== undefined) {
      effectiveTime = time * overrides.timeSpeed;
    }

    // Config-Overrides
    if (overrides.persistenceOverride !== undefined || overrides.trailLengthOverride !== undefined) {
      effectiveConfig = {
        ...config,
        ...(overrides.persistenceOverride !== undefined && {
          trailPersistence: overrides.persistenceOverride,
        }),
        ...(overrides.trailLengthOverride !== undefined && {
          maxTrailLength: overrides.trailLengthOverride,
        }),
      };
    }
  }

  for (let i = 0; i < poles.length; i += 2) {
    const poleA = poles[i]!;
    const poleB = poles[i + 1]!;
    const dimId = poleA.dimensionId;
    const dim = DIMENSION_DEFS[i / 2]!;
    const d = dissonance.dimensional.get(dimId) ?? 0;

    // Advance theta (speed nicht modifizieren — bereits in initializePoles berechnet)
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
      const vibAmp = d * effectiveConfig.maxR * 0.03;
      const vibFreq = dissonance.elementalQuality < 0
        ? 12.0  // Ke: high-frequency angular vibration
        : 3.0;  // Sheng: slow organic pulse
      const rawWave = Math.sin(effectiveTime * vibFreq + dim.baseAngle);
      // Ke: tanh(3x) squashes the sine toward a square wave → angular/crystalline feel
      // Sheng: plain sine → smooth/organic/flowing
      const vib = (dissonance.elementalQuality < 0
        ? Math.tanh(3 * rawWave)
        : rawWave) * vibAmp;

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
      const vibAmp = dayHarmonic.intensity * effectiveConfig.maxR * 0.015;
      const vibFreq = 6.0 + dayHarmonic.intensity * 8.0; // faster when more intense
      const crossVib = Math.sin(effectiveTime * vibFreq + dim.baseAngle * 2) * vibAmp;
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
    // dimMul > 1.0 → expansion (water/fire dimensions pushed outward by storms)
    // dimMul < 1.0 → contraction (earth dimensions resist, pull inward — intentional)
    if (solar && solar.ringModulation > 1.0) {
      const dimMul = solar.dimensionMultipliers?.[dimId] ?? 1.0;
      const expansion = (solar.ringModulation - 1.0) * 0.5 * (dimMul - 0.5);

      poleA.x *= (1 + expansion);
      poleA.y *= (1 + expansion);
      poleB.x *= (1 + expansion);
      poleB.y *= (1 + expansion);

      // G3+ storms add high-frequency pulsation, scaled by dimension resonance
      if (solar.triggerEffect) {
        const stormPulse = Math.sin(effectiveTime * 20 + dim.hz * 0.1) * effectiveConfig.maxR * 0.02 * dimMul;
        poleA.x += stormPulse;
        poleB.x -= stormPulse;
      }
    }

    // === RECORD TRAIL ===
    recordTrail(poleA, effectiveConfig);
    recordTrail(poleB, effectiveConfig);
  }

  // Pole-States an DebugInjection melden (für State Inspector im Debug Panel)
  if (isDebugMode()) {
    const debug = DebugInjection.getInstance();
    const poleStates = poles.map(pole => ({
      dimensionId: pole.dimensionId,
      pole: pole.pole,
      x: pole.x,
      y: pole.y,
      radius: pole.radius,
      speed: pole.speed,
      dissonance: dissonance.dimensional.get(pole.dimensionId) ?? 0,
    }));
    debug.updatePoleStates(poleStates);
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
