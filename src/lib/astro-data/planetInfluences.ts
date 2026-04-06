// ═══════════════════════════════════════════════════════════════════════════
// PLANET INFLUENCES — live daily transit positions vs. birth sign
// Computes real-time planetary aspects and derives resonance/tension fields.
// ═══════════════════════════════════════════════════════════════════════════

import { solveKepler, daysSinceJ2000 } from '../astronomy/calculations';
import { PLANETS } from '../astronomy/data';

// ── Zodiac helpers ────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** Map a zodiac sign name (any case) to 0-based sector index (0=Aries … 11=Pisces). Returns -1 if not found. */
export function zodiacSignToIndex(sign: string): number {
  if (!sign) return -1;
  return ZODIAC_SIGNS.findIndex(s => s.toLowerCase() === sign.toLowerCase());
}

// ── Ecliptic longitude computation ────────────────────────────────────────

interface OrbitalElements {
  e: number;    // eccentricity
  M0: number;   // mean anomaly at epoch (degrees)
  period: number; // orbital period (days)
  omega: number;  // longitude of ascending node (degrees)
  w: number;      // argument of perihelion (degrees)
}

/**
 * Simplified ecliptic longitude for a planet at `t` days since J2000.
 * Accurate to ~1° for outer planets — sufficient for 30° zodiac sector resolution.
 */
function getEclipticLongitudeDeg(planet: OrbitalElements, t: number): number {
  const n = 360 / planet.period; // mean motion (deg/day)
  const M_deg = ((planet.M0 + n * t) % 360 + 360) % 360;
  const M = M_deg * Math.PI / 180;
  const E = solveKepler(M, planet.e);
  const nu_rad = 2 * Math.atan2(
    Math.sqrt(1 + planet.e) * Math.sin(E / 2),
    Math.sqrt(1 - planet.e) * Math.cos(E / 2),
  );
  const nu_deg = nu_rad * 180 / Math.PI;
  return ((planet.omega + planet.w + nu_deg) % 360 + 360) % 360;
}

// ── Aspect mapping ────────────────────────────────────────────────────────

/**
 * Given the minimum sector difference (0-6) between planet and birth sign,
 * returns field strength (0-1) and resonance direction.
 */
function aspectFromDiff(diff: number): { fieldStrength: number; isResonant: boolean } {
  switch (diff) {
    case 0: return { fieldStrength: 0.85, isResonant: true };   // Conjunction  0°
    case 1: return { fieldStrength: 0.38, isResonant: true };   // Semi-sextile 30°
    case 2: return { fieldStrength: 0.62, isResonant: true };   // Sextile      60°
    case 3: return { fieldStrength: 0.72, isResonant: false };  // Square       90°
    case 4: return { fieldStrength: 0.88, isResonant: true };   // Trine        120°
    case 5: return { fieldStrength: 0.44, isResonant: false };  // Quincunx     150°
    case 6: return { fieldStrength: 0.78, isResonant: false };  // Opposition   180°
    default: return { fieldStrength: 0.20, isResonant: true };
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export interface PlanetInfluence {
  /** 0-1 strength of the field (how significant the aspect is) */
  fieldStrength: number;
  /** true = harmonious/resonant, false = challenging/tension */
  isResonant: boolean;
  /** Planet's current zodiac sector (0-11) */
  planetSector: number;
  /** Aspect angle in degrees (30° per sector) */
  aspectDeg: number;
}

const INFLUENCE_PLANETS = {
  Mars: PLANETS.mars,
  Jupiter: PLANETS.jupiter,
  Venus: PLANETS.venus,
  Saturn: PLANETS.saturn,
} as const;

/**
 * Compute today's planet influences for a birth sign.
 * Returns null for each planet if `birthSign` is unrecognised.
 * @param birthSign — The user's western zodiac sign
 * @param customSimTime — Optional days since J2000 (e.g. from planetarium)
 */
export function computeTodayPlanetInfluences(
  birthSign: string,
  customSimTime?: number,
): Record<string, PlanetInfluence> | null {
  const birthSector = zodiacSignToIndex(birthSign);
  if (birthSector === -1) return null;

  const t = customSimTime ?? daysSinceJ2000(new Date());
  const result: Record<string, PlanetInfluence> = {};

  for (const [key, planet] of Object.entries(INFLUENCE_PLANETS)) {
    const lon = getEclipticLongitudeDeg(planet, t);
    const planetSector = Math.floor(lon / 30) % 12;
    const rawDiff = Math.abs(planetSector - birthSector);
    const diff = Math.min(rawDiff, 12 - rawDiff); // 0-6
    const { fieldStrength, isResonant } = aspectFromDiff(diff);
    result[key] = { fieldStrength, isResonant, planetSector, aspectDeg: diff * 30 };
  }

  return result;
}
