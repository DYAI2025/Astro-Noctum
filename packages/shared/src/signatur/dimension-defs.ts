/**
 * Signatur V3 — Dimension Definitions (Single Source of Truth)
 *
 * 6 Dimensionen × 2 Pole = 12 Pole.
 * Pole A bei baseAngle, Pol B bei baseAngle + π (180° gegenüber).
 * Dimensionen im 60°-Abstand — wie Tierkreiszeichen.
 *
 * Frequenzen nach Hans Cousto, Kosmische Oktave.
 * Hz-Werte sind guard-tested — Änderungen erfordern explizite Intent-Bestätigung.
 *
 * Consumed by:
 *   - Web:  src/components/signatur-v3/bipolar-engine.ts
 *   - iOS:  SignaturV3Engine.swift (via SWIFT_CONSTANTS.md)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DimensionDef {
  /** Dimension identifier — matches quiz dimension keys */
  id: string;
  /** Pole A label (active / assertive side) */
  poleA: string;
  /** Pole B label (receptive / integrative side) */
  poleB: string;
  /**
   * Base angular position of Pole A on the circle (radians).
   * Pole B is always at baseAngle + π.
   * Matches zodiac sector placement (0 = Aries/Assertion, π/3 = Cancer/Empathy, …).
   */
  baseAngle: number;
  /**
   * Cousto frequency (Hz) of the associated planet.
   * Drives movement speed: baseSpeed = 0.003 + logNorm(hz) × 0.008.
   * Guard-tested — do not change without updating the test.
   */
  hz: number;
  /** RGB color triple [0, 1] for Pole A — immutable */
  colorA: readonly [number, number, number];
  /** RGB color triple [0, 1] for Pole B — immutable */
  colorB: readonly [number, number, number];
}

// ─── Definitions ─────────────────────────────────────────────────────────────

/**
 * DIMENSION_DEFS — canonical 6-dimension table for the Signatur V3 engine.
 *
 * Order matters: index 0 = 0°, index 1 = 60°, …, index 5 = 300°.
 * Do NOT reorder. Do NOT change hz values without updating SWIFT_CONSTANTS.md
 * and the hz guard-test (TASK-sbridge-hz-constants).
 */
export const DIMENSION_DEFS: readonly DimensionDef[] = Object.freeze([
  Object.freeze({
    id: 'assertion',
    poleA: 'Durchsetzung',
    poleB: 'Hingabe',
    baseAngle: 0,                     // 0° — Aries/Mars position
    hz: 144.72,                       // Mars — Cousto cosmic octave
    colorA: Object.freeze([1.0, 0.15, 0.12] as const),       // Mars red
    colorB: Object.freeze([0.68, 0.55, 1.0] as const),       // Soft violet (contra-pole)
  }),
  Object.freeze({
    id: 'empathy',
    poleA: 'Einfühlung',
    poleB: 'Abgrenzung',
    baseAngle: Math.PI / 3,           // 60° — Cancer-adjacent
    hz: 210.42,                       // Moon — fastest pole (highest Hz)
    colorA: Object.freeze([0.68, 0.55, 1.0] as const),       // Moon violet
    colorB: Object.freeze([0.38, 0.52, 0.72] as const),      // Saturn steel (contra-pole)
  }),
  Object.freeze({
    id: 'creativity',
    poleA: 'Schöpfung',
    poleB: 'Struktur',
    baseAngle: (2 * Math.PI) / 3,    // 120° — Leo position
    hz: 126.22,                       // Sun — slowest pole (lowest Hz)
    colorA: Object.freeze([1.0, 0.72, 0.12] as const),       // Sun gold
    colorB: Object.freeze([0.20, 0.95, 1.0] as const),       // Mercury cyan (contra-pole)
  }),
  Object.freeze({
    id: 'logic',
    poleA: 'Analyse',
    poleB: 'Synthese',
    baseAngle: Math.PI,               // 180° — Virgo–Libra axis
    hz: 141.27,                       // Mercury
    colorA: Object.freeze([0.20, 0.95, 1.0] as const),       // Mercury cyan
    colorB: Object.freeze([1.0, 0.40, 0.72] as const),       // Venus pink (contra-pole)
  }),
  Object.freeze({
    id: 'intuition',
    poleA: 'Ahnung',
    poleB: 'Evidenz',
    baseAngle: (4 * Math.PI) / 3,    // 240° — Sagittarius
    hz: 183.58,                       // Jupiter — 2nd fastest after Moon
    colorA: Object.freeze([1.0, 0.88, 0.0] as const),        // Jupiter gold
    colorB: Object.freeze([0.38, 0.52, 0.72] as const),      // Saturn steel (contra-pole)
  }),
  Object.freeze({
    id: 'discipline',
    poleA: 'Ordnung',
    poleB: 'Freiheit',
    baseAngle: (5 * Math.PI) / 3,    // 300° — Capricorn–Aquarius
    hz: 147.85,                       // Saturn
    colorA: Object.freeze([0.38, 0.52, 0.72] as const),      // Saturn steel
    colorB: Object.freeze([1.0, 0.88, 0.0] as const),        // Jupiter gold (contra-pole)
  }),
]) as readonly DimensionDef[];

// ─── Derived constants ────────────────────────────────────────────────────────

/**
 * Expected Hz values per dimension id — used by guard-tests.
 *
 * INTENTIONALLY NOT derived from DIMENSION_DEFS at runtime.
 * If derived, the Hz guard-test would only verify internal consistency,
 * not the actual spec values from SIGNATUR_V3_VISION.md.
 *
 * When updating Hz values, change ALL THREE in sync:
 *   1. DIMENSION_DEFS entry above
 *   2. EXPECTED_HZ here
 *   3. SWIFT_CONSTANTS.md
 */
export const EXPECTED_HZ: Readonly<Record<string, number>> = {
  assertion:  144.72,
  empathy:    210.42,
  creativity: 126.22,
  logic:      141.27,
  intuition:  183.58,
  discipline: 147.85,
} as const;

/** Expected base angles (radians) per dimension id — used by guard-tests */
export const EXPECTED_BASE_ANGLES: Readonly<Record<string, number>> = {
  assertion:  0,
  empathy:    Math.PI / 3,
  creativity: (2 * Math.PI) / 3,
  logic:      Math.PI,
  intuition:  (4 * Math.PI) / 3,
  discipline: (5 * Math.PI) / 3,
} as const;
