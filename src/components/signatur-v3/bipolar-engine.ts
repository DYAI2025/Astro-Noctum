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

export interface DissonanceState {
  /** Per-dimension dissonance [0,1] — how much the quiz deviates from natal for this axis */
  dimensional: Map<string, number>;
  /** Global natal dissonance */
  dNatal: number;
  /** Global accumulated dissonance */
  dAccumulated: number;
  /** Elemental quality: -1 = Ke (crystalline), 0 = neutral, 1 = Sheng (organic) */
  elementalQuality: number;
}

// ═══════════════════════════════════════
//  DIMENSION DEFINITIONS
// ═══════════════════════════════════════

/**
 * 6 Dimensions, each with 2 poles = 12 poles.
 * Placed at 60° intervals around the circle (like every other zodiac sign).
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

export function computeDissonance(
  natalWeights: Map<string, number>,
  quizWeights: Map<string, number>,
): DissonanceState {
  const dimensional = new Map<string, number>();
  let totalDeviation = 0;

  for (const dim of DIMENSIONS) {
    const natal = natalWeights.get(dim.id) ?? 0.5;
    const quiz = quizWeights.get(dim.id) ?? 0.5;
    const deviation = Math.abs(quiz - natal);
    dimensional.set(dim.id, deviation);
    totalDeviation += deviation;
  }

  const dNatal = clamp(totalDeviation / DIMENSIONS.length / 0.5, 0, 1);

  // TODO Phase 2: d_accumulated from quiz history
  const dAccumulated = 0;

  // TODO Phase 2: elemental quality from Wu-Xing Sheng/Ke analysis
  // For now: derive rough quality from whether dominant dimensions clash
  const elementalQuality = 0;

  return { dimensional, dNatal, dAccumulated, elementalQuality };
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
  dissonance: DissonanceState,
  config: SignaturV3Config,
  time: number,
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
    const symmetricBx = Math.cos(poleB.theta) * poleB.radius;
    const symmetricBy = Math.sin(poleB.theta) * poleB.radius;

    // === DISSONANT MODE (d → 1): Counter-directional through center ===
    // Lissajous pattern: poles cross through center with frequency ratios
    const freqRatio = 1 + hash01(dim.hz, 3) * 2; // 1-3 ratio for variety
    const lissajousAx = Math.cos(poleA.theta) * poleA.radius;
    const lissajousAy = Math.sin(poleA.theta * freqRatio) * poleA.radius;
    const lissajousBx = Math.cos(poleB.theta) * poleB.radius;
    const lissajousBy = Math.sin(poleB.theta * freqRatio) * poleB.radius;

    // === BLEND between consonant and dissonant ===
    // d=0 → pure symmetric, d=1 → pure lissajous
    const blend = clamp(d * 2, 0, 1); // amplify small dissonances

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
    const capacity = pole.trail.length / 2;
    if (pole.trailLength === 0 || capacity === 0) {
      continue;
    }
    // Oldest logical point in the ring buffer
    const oldestIdx = (pole.trailHead - pole.trailLength + capacity) % capacity;

    for (let i = 0; i < pole.trailLength; i++) {
      const readIdx = (oldestIdx + i) % capacity;
      const x = pole.trail[readIdx * 2]!;
      const y = pole.trail[readIdx * 2 + 1]!;

      // Map to grid coordinates
      const gx = Math.floor(x * scale + halfRes);
      const gy = Math.floor(y * scale + halfRes);

      if (gx >= 0 && gx < resolution && gy >= 0 && gy < resolution) {
        // Newer trail points contribute more: age = 0 (newest) → max freshness
        const age = pole.trailLength - 1 - i;
        const freshness = 1 - (age / pole.trailLength) * (1 - config.trailPersistence);

        const idx = gy * resolution + gx;
        grid[idx]! += freshness;
        if (grid[idx]! > maxDensity) maxDensity = grid[idx]!;
      }
    }
  }

  return { grid, width: resolution, height: resolution, maxDensity };
}
