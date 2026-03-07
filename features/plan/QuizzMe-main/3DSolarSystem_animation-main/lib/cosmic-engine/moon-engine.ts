/**
 * Moon Engine
 *
 * Comprehensive lunar calculations including position, phases, and events.
 * Uses the astronomia library for high-precision calculations.
 *
 * @module cosmic-engine/moon-engine
 */

import type {
  MoonPosition,
  MoonPhaseEvent,
  MoonPhaseInfo,
  Position3DOptions,
  Coord,
} from './types';

import {
  getMoonPosition as getAstronomiaMoonPosition,
  getMoonPhaseAngle,
  getMoonIllumination,
  getNextNewMoon,
  getNextFullMoon,
  getNextFirstQuarter,
  getNextLastQuarter,
  eclipticToEquatorial,
  dateToJulian,
  jdeToDate,
  jdeToYear,
  yearToJDE,
  OBLIQUITY_J2000,
  LUNAR_MONTH,
  normalizeAngle,
  toDegrees,
} from './astronomia-adapter';

import { logarithmicScale, linearScale } from './vsop87-provider';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Average Moon distance in km */
export const MOON_MEAN_DISTANCE = 384400;

/** Moon distance in AU (for scaling consistency with planets) */
export const MOON_DISTANCE_AU = MOON_MEAN_DISTANCE / 149597870.7;

/** Lunar phase names */
export const PHASE_NAMES = {
  NEW: 'New Moon',
  WAXING_CRESCENT: 'Waxing Crescent',
  FIRST_QUARTER: 'First Quarter',
  WAXING_GIBBOUS: 'Waxing Gibbous',
  FULL: 'Full Moon',
  WANING_GIBBOUS: 'Waning Gibbous',
  LAST_QUARTER: 'Last Quarter',
  WANING_CRESCENT: 'Waning Crescent',
} as const;

// =============================================================================
// POSITION CALCULATIONS
// =============================================================================

/**
 * Gets the complete Moon position including phase information
 *
 * @param jde - Julian Ephemeris Day
 * @param options - Position calculation options
 * @returns Complete Moon position with phase data
 */
export function getMoonPosition(
  jde: number,
  options: Position3DOptions = {}
): MoonPosition {
  const {
    scale = 25,
    logarithmic = true,
    scalingFn,
  } = options;

  // Get geocentric ecliptic position
  const ecliptic = getAstronomiaMoonPosition(jde);

  // Convert to Cartesian (ecliptic frame)
  const cosLat = Math.cos(ecliptic.lat);
  const cartesian = {
    x: (ecliptic.range / MOON_MEAN_DISTANCE) * cosLat * Math.cos(ecliptic.lon),
    y: (ecliptic.range / MOON_MEAN_DISTANCE) * cosLat * Math.sin(ecliptic.lon),
    z: (ecliptic.range / MOON_MEAN_DISTANCE) * Math.sin(ecliptic.lat),
  };

  // Convert to equatorial coordinates
  const equatorial = eclipticToEquatorial(
    { lon: ecliptic.lon, lat: ecliptic.lat },
    OBLIQUITY_J2000
  );

  // Calculate phase
  const phaseAngle = getMoonPhaseAngle(jde);
  const illumination = getMoonIllumination(phaseAngle);

  // Apply scaling - use a smaller scale for the Moon since it's close
  const distanceAU = ecliptic.range / 149597870.7;
  const scaler = scalingFn ?? (logarithmic ? logarithmicScale : linearScale);
  const scaledDistance = scaler(distanceAU * 100, scale); // Multiply to make visible
  const distanceNormalized = ecliptic.range / MOON_MEAN_DISTANCE;
  const scaleFactor = distanceNormalized > 0 ? scaledDistance / distanceNormalized : 0;

  return {
    // 3D position (scaled, Y-up for Three.js)
    x: cartesian.x * scaleFactor,
    y: cartesian.z * scaleFactor,
    z: -cartesian.y * scaleFactor,

    // Distance in km
    distance: ecliptic.range,

    // Equatorial coordinates
    ra: equatorial.ra,
    dec: equatorial.dec,

    // Ecliptic coordinates
    lon: ecliptic.lon,
    lat: ecliptic.lat,

    // Phase information
    phase: phaseAngle,
    illumination,
  };
}

/**
 * Gets Moon position for a JavaScript Date
 *
 * @param date - JavaScript Date object
 * @param options - Position calculation options
 * @returns Moon position with phase data
 */
export function getMoonPositionForDate(
  date: Date,
  options: Position3DOptions = {}
): MoonPosition {
  const { jde } = dateToJulian(date);
  return getMoonPosition(jde, options);
}

// =============================================================================
// PHASE CALCULATIONS
// =============================================================================

/**
 * Gets detailed Moon phase information
 *
 * @param jde - Julian Ephemeris Day
 * @returns Phase information including name and age
 */
export function getMoonPhase(
  jde: number
): MoonPhaseInfo {
  const phaseAngle = getMoonPhaseAngle(jde);
  const illumination = getMoonIllumination(phaseAngle);

  // Calculate phase age (days since last new moon)
  const year = jdeToYear(jde);
  const lastNewMoon = getNextNewMoon(year - 0.1); // Look back slightly
  const age = jde - lastNewMoon;

  // Determine phase name based on illumination and whether waxing or waning
  // Phase angle increases from 0 (new) to PI (full) to 2*PI (new again)
  const normalizedPhase = normalizeAngle(phaseAngle);
  const phaseFraction = normalizedPhase / (2 * Math.PI);

  let phase: string;
  if (phaseFraction < 0.025 || phaseFraction >= 0.975) {
    phase = PHASE_NAMES.NEW;
  } else if (phaseFraction < 0.225) {
    phase = PHASE_NAMES.WAXING_CRESCENT;
  } else if (phaseFraction < 0.275) {
    phase = PHASE_NAMES.FIRST_QUARTER;
  } else if (phaseFraction < 0.475) {
    phase = PHASE_NAMES.WAXING_GIBBOUS;
  } else if (phaseFraction < 0.525) {
    phase = PHASE_NAMES.FULL;
  } else if (phaseFraction < 0.725) {
    phase = PHASE_NAMES.WANING_GIBBOUS;
  } else if (phaseFraction < 0.775) {
    phase = PHASE_NAMES.LAST_QUARTER;
  } else {
    phase = PHASE_NAMES.WANING_CRESCENT;
  }

  return {
    phase,
    illumination,
    phaseAngle,
    age: age > 0 ? age : age + LUNAR_MONTH,
  };
}

/**
 * Gets Moon phase for a JavaScript Date
 *
 * @param date - JavaScript Date object
 * @returns Phase information
 */
export function getMoonPhaseForDate(date: Date): MoonPhaseInfo {
  const { jde } = dateToJulian(date);
  return getMoonPhase(jde);
}

// =============================================================================
// PHASE EVENTS
// =============================================================================

/**
 * Gets upcoming Moon phase events
 *
 * @param jde - Starting Julian Ephemeris Day
 * @param count - Number of events to return (default: 4)
 * @returns Array of upcoming phase events
 */
export function getNextMoonPhases(
  jde: number,
  count: number = 4
): MoonPhaseEvent[] {
  const events: MoonPhaseEvent[] = [];
  let year = jdeToYear(jde);

  // Generate more events than needed, then sort and filter
  const candidates: MoonPhaseEvent[] = [];

  for (let i = 0; i < Math.ceil(count / 4) + 2; i++) {
    const searchYear = year + (i * LUNAR_MONTH) / 365.25;

    // Get each phase type
    const newMoonJDE = getNextNewMoon(searchYear);
    if (newMoonJDE > jde) {
      candidates.push({
        jde: newMoonJDE,
        date: jdeToDate(newMoonJDE),
        type: 'new',
        name: PHASE_NAMES.NEW,
      });
    }

    const firstQuarterJDE = getNextFirstQuarter(searchYear);
    if (firstQuarterJDE > jde) {
      candidates.push({
        jde: firstQuarterJDE,
        date: jdeToDate(firstQuarterJDE),
        type: 'first',
        name: PHASE_NAMES.FIRST_QUARTER,
      });
    }

    const fullMoonJDE = getNextFullMoon(searchYear);
    if (fullMoonJDE > jde) {
      candidates.push({
        jde: fullMoonJDE,
        date: jdeToDate(fullMoonJDE),
        type: 'full',
        name: PHASE_NAMES.FULL,
      });
    }

    const lastQuarterJDE = getNextLastQuarter(searchYear);
    if (lastQuarterJDE > jde) {
      candidates.push({
        jde: lastQuarterJDE,
        date: jdeToDate(lastQuarterJDE),
        type: 'last',
        name: PHASE_NAMES.LAST_QUARTER,
      });
    }
  }

  // Sort by JDE and remove duplicates
  candidates.sort((a, b) => a.jde - b.jde);

  const seen = new Set<number>();
  for (const event of candidates) {
    // Round to nearest hour to detect duplicates
    const roundedJDE = Math.round(event.jde * 24) / 24;
    if (!seen.has(roundedJDE) && events.length < count) {
      seen.add(roundedJDE);
      events.push(event);
    }
  }

  return events;
}

/**
 * Gets upcoming Moon phase events from a JavaScript Date
 *
 * @param date - Starting date
 * @param count - Number of events to return
 * @returns Array of upcoming phase events
 */
export function getNextMoonPhasesFromDate(
  date: Date,
  count: number = 4
): MoonPhaseEvent[] {
  const { jde } = dateToJulian(date);
  return getNextMoonPhases(jde, count);
}

/**
 * Gets the next specific phase after a given date
 *
 * @param jde - Starting Julian Ephemeris Day
 * @param phaseType - Type of phase to find
 * @returns Phase event
 */
export function getNextPhaseOfType(
  jde: number,
  phaseType: 'new' | 'first' | 'full' | 'last'
): MoonPhaseEvent {
  const year = jdeToYear(jde);

  let phaseJDE: number;
  let name: string;

  switch (phaseType) {
    case 'new':
      phaseJDE = getNextNewMoon(year);
      name = PHASE_NAMES.NEW;
      break;
    case 'first':
      phaseJDE = getNextFirstQuarter(year);
      name = PHASE_NAMES.FIRST_QUARTER;
      break;
    case 'full':
      phaseJDE = getNextFullMoon(year);
      name = PHASE_NAMES.FULL;
      break;
    case 'last':
      phaseJDE = getNextLastQuarter(year);
      name = PHASE_NAMES.LAST_QUARTER;
      break;
  }

  // If the found phase is before the requested JDE, search again
  if (phaseJDE <= jde) {
    const newYear = year + LUNAR_MONTH / 365.25;
    switch (phaseType) {
      case 'new':
        phaseJDE = getNextNewMoon(newYear);
        break;
      case 'first':
        phaseJDE = getNextFirstQuarter(newYear);
        break;
      case 'full':
        phaseJDE = getNextFullMoon(newYear);
        break;
      case 'last':
        phaseJDE = getNextLastQuarter(newYear);
        break;
    }
  }

  return {
    jde: phaseJDE,
    date: jdeToDate(phaseJDE),
    type: phaseType,
    name,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculates the Moon's age in days
 *
 * @param jde - Julian Ephemeris Day
 * @returns Age in days since last new moon
 */
export function getMoonAge(jde: number): number {
  const year = jdeToYear(jde);

  // Find the most recent new moon
  let lastNewMoon = getNextNewMoon(year - 0.1);

  // If we got a future new moon, go back further
  while (lastNewMoon > jde) {
    lastNewMoon = getNextNewMoon(jdeToYear(lastNewMoon) - 0.1);
  }

  return jde - lastNewMoon;
}

/**
 * Gets the Moon's distance as a fraction of mean distance
 *
 * @param jde - Julian Ephemeris Day
 * @returns Distance fraction (1.0 = mean distance)
 */
export function getMoonDistanceFraction(jde: number): number {
  const pos = getAstronomiaMoonPosition(jde);
  return pos.range / MOON_MEAN_DISTANCE;
}

/**
 * Checks if the Moon is at perigee (closest approach)
 *
 * @param jde - Julian Ephemeris Day
 * @param tolerance - Tolerance in days
 * @returns True if near perigee
 */
export function isNearPerigee(jde: number, tolerance: number = 1): boolean {
  const distNow = getMoonDistanceFraction(jde);
  const distBefore = getMoonDistanceFraction(jde - tolerance);
  const distAfter = getMoonDistanceFraction(jde + tolerance);

  return distNow < distBefore && distNow < distAfter;
}

/**
 * Checks if the Moon is at apogee (farthest distance)
 *
 * @param jde - Julian Ephemeris Day
 * @param tolerance - Tolerance in days
 * @returns True if near apogee
 */
export function isNearApogee(jde: number, tolerance: number = 1): boolean {
  const distNow = getMoonDistanceFraction(jde);
  const distBefore = getMoonDistanceFraction(jde - tolerance);
  const distAfter = getMoonDistanceFraction(jde + tolerance);

  return distNow > distBefore && distNow > distAfter;
}

/**
 * Determines if it's a "supermoon" (full moon near perigee)
 *
 * @param jde - Julian Ephemeris Day
 * @returns True if supermoon
 */
export function isSupermoon(jde: number): boolean {
  const phase = getMoonPhase(jde);
  const distance = getMoonDistanceFraction(jde);

  // Supermoon: full moon when closer than average
  return phase.phase === PHASE_NAMES.FULL && distance < 0.95;
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Position functions
  getMoonPosition,
  getMoonPositionForDate,

  // Phase functions
  getMoonPhase,
  getMoonPhaseForDate,

  // Phase events
  getNextMoonPhases,
  getNextMoonPhasesFromDate,
  getNextPhaseOfType,

  // Utility functions
  getMoonAge,
  getMoonDistanceFraction,
  isNearPerigee,
  isNearApogee,
  isSupermoon,

  // Constants
  MOON_MEAN_DISTANCE,
  MOON_DISTANCE_AU,
  PHASE_NAMES,
  LUNAR_MONTH,
};
