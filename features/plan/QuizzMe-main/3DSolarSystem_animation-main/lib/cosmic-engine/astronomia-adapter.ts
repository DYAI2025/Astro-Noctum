/**
 * Astronomia Library Adapter
 *
 * Provides TypeScript-typed interfaces to the astronomia JavaScript library
 * for high-precision astronomical calculations using VSOP87 theory.
 *
 * @module cosmic-engine/astronomia-adapter
 */

import type {
  Coord,
  EquatorialCoord,
  HorizontalCoord,
  EclipticCoord,
  PlanetName,
  VSOP87Data,
  ObserverLocation,
  JulianDate,
} from './types';

// =============================================================================
// MODULE IMPORTS
// Dynamic imports for astronomia ES modules
// =============================================================================

// Base utilities
import base from '../../astronomia-master/src/base.js';
import julian from '../../astronomia-master/src/julian.js';
import coord from '../../astronomia-master/src/coord.js';

// Planet position calculations
import { Planet } from '../../astronomia-master/src/planetposition.js';

// Moon calculations
import moonposition from '../../astronomia-master/src/moonposition.js';
import moonillum from '../../astronomia-master/src/moonillum.js';
import moonphase from '../../astronomia-master/src/moonphase.js';

// VSOP87 planet data (Type B - heliocentric, ecliptic J2000.0)
import vsop87Bmercury from '../../astronomia-master/data/vsop87Bmercury.js';
import vsop87Bvenus from '../../astronomia-master/data/vsop87Bvenus.js';
import vsop87Bearth from '../../astronomia-master/data/vsop87Bearth.js';
import vsop87Bmars from '../../astronomia-master/data/vsop87Bmars.js';
import vsop87Bjupiter from '../../astronomia-master/data/vsop87Bjupiter.js';
import vsop87Bsaturn from '../../astronomia-master/data/vsop87Bsaturn.js';
import vsop87Buranus from '../../astronomia-master/data/vsop87Buranus.js';
import vsop87Bneptune from '../../astronomia-master/data/vsop87Bneptune.js';

// =============================================================================
// CONSTANTS
// =============================================================================

/** J2000.0 epoch as Julian Date */
export const J2000 = 2451545.0;

/** Julian century in days */
export const JULIAN_CENTURY = 36525;

/** Obliquity of the ecliptic at J2000.0 in radians */
export const OBLIQUITY_J2000 = 23.4392911 * Math.PI / 180;

/** Degrees to radians conversion */
export const DEG_TO_RAD = Math.PI / 180;

/** Radians to degrees conversion */
export const RAD_TO_DEG = 180 / Math.PI;

/** Hours to radians conversion */
export const HOURS_TO_RAD = Math.PI / 12;

/** AU in kilometers */
export const AU_KM = 149597870.7;

// =============================================================================
// PLANET DATA MAP
// =============================================================================

/**
 * Map of planet names to their VSOP87 data
 */
const PLANET_DATA: Record<PlanetName, VSOP87Data> = {
  mercury: vsop87Bmercury as unknown as VSOP87Data,
  venus: vsop87Bvenus as unknown as VSOP87Data,
  earth: vsop87Bearth as unknown as VSOP87Data,
  mars: vsop87Bmars as unknown as VSOP87Data,
  jupiter: vsop87Bjupiter as unknown as VSOP87Data,
  saturn: vsop87Bsaturn as unknown as VSOP87Data,
  uranus: vsop87Buranus as unknown as VSOP87Data,
  neptune: vsop87Bneptune as unknown as VSOP87Data,
};

/**
 * Cached Planet instances for performance
 */
const planetCache = new Map<PlanetName, InstanceType<typeof Planet>>();

// =============================================================================
// JULIAN DATE UTILITIES
// =============================================================================

/**
 * Converts a JavaScript Date to Julian Date information
 *
 * @param date - JavaScript Date object
 * @returns Julian date information including JD, JDE, and T
 */
export function dateToJulian(date: Date): JulianDate {
  const jd = julian.DateToJD(date);
  const jde = julian.DateToJDE(date);
  const T = base.J2000Century(jde);

  return { jd, jde, T };
}

/**
 * Converts Julian Date to JavaScript Date
 *
 * @param jd - Julian Day number
 * @returns JavaScript Date object
 */
export function julianToDate(jd: number): Date {
  return julian.JDToDate(jd);
}

/**
 * Converts Julian Ephemeris Date to JavaScript Date
 *
 * @param jde - Julian Ephemeris Day
 * @returns JavaScript Date object
 */
export function jdeToDate(jde: number): Date {
  return julian.JDEToDate(jde);
}

/**
 * Gets the current Julian Ephemeris Date
 *
 * @returns Current JDE
 */
export function getCurrentJDE(): number {
  return julian.DateToJDE(new Date());
}

/**
 * Converts decimal year to JDE
 *
 * @param year - Decimal year (e.g., 2024.5 for July 2024)
 * @returns Julian Ephemeris Day
 */
export function yearToJDE(year: number): number {
  return base.JulianYearToJDE(year);
}

/**
 * Converts JDE to decimal year
 *
 * @param jde - Julian Ephemeris Day
 * @returns Decimal year
 */
export function jdeToYear(jde: number): number {
  return base.JDEToJulianYear(jde);
}

// =============================================================================
// PLANET POSITION FUNCTIONS
// =============================================================================

/**
 * Gets a Planet instance for VSOP87 calculations
 * Uses caching for performance
 *
 * @param planet - Planet name
 * @returns Planet instance
 */
export function getPlanetInstance(planet: PlanetName): InstanceType<typeof Planet> {
  if (!planetCache.has(planet)) {
    const data = PLANET_DATA[planet];
    if (!data) {
      throw new Error(`Unknown planet: ${planet}`);
    }
    planetCache.set(planet, new Planet(data));
  }
  return planetCache.get(planet)!;
}

/**
 * Gets heliocentric position of a planet using VSOP87
 *
 * @param planet - Planet name
 * @param jde - Julian Ephemeris Day
 * @returns Heliocentric ecliptic coordinates (J2000.0)
 */
export function getHeliocentricPosition(planet: PlanetName, jde: number): Coord {
  const planetInstance = getPlanetInstance(planet);
  const pos = planetInstance.position2000(jde);

  return {
    lon: pos.lon,
    lat: pos.lat,
    range: pos.range ?? 1, // Default to 1 AU if range not available
  };
}

/**
 * Gets heliocentric position at equinox of date
 *
 * @param planet - Planet name
 * @param jde - Julian Ephemeris Day
 * @returns Heliocentric ecliptic coordinates (equinox of date)
 */
export function getHeliocentricPositionOfDate(planet: PlanetName, jde: number): Coord {
  const planetInstance = getPlanetInstance(planet);
  const pos = planetInstance.position(jde);

  return {
    lon: pos.lon,
    lat: pos.lat,
    range: pos.range ?? 1, // Default to 1 AU if range not available
  };
}

/**
 * Converts heliocentric ecliptic coordinates to 3D Cartesian
 *
 * @param coord - Ecliptic coordinates
 * @returns 3D position in ecliptic reference frame
 */
export function eclipticToCartesian(ecliptic: Coord): { x: number; y: number; z: number } {
  const { lon, lat, range } = ecliptic;
  const cosLat = Math.cos(lat);

  return {
    x: range * cosLat * Math.cos(lon),
    y: range * cosLat * Math.sin(lon),
    z: range * Math.sin(lat),
  };
}

/**
 * Converts ecliptic to equatorial coordinates
 *
 * @param ecliptic - Ecliptic coordinates
 * @param obliquity - Obliquity of the ecliptic in radians (defaults to J2000.0 value)
 * @returns Equatorial coordinates
 */
export function eclipticToEquatorial(
  ecliptic: EclipticCoord,
  obliquity: number = OBLIQUITY_J2000
): EquatorialCoord {
  const ecl = new coord.Ecliptic(ecliptic.lon, ecliptic.lat);
  const equ = ecl.toEquatorial(obliquity);

  return {
    ra: equ.ra,
    dec: equ.dec,
  };
}

/**
 * Converts equatorial to ecliptic coordinates
 *
 * @param equatorial - Equatorial coordinates
 * @param obliquity - Obliquity of the ecliptic in radians
 * @returns Ecliptic coordinates
 */
export function equatorialToEcliptic(
  equatorial: EquatorialCoord,
  obliquity: number = OBLIQUITY_J2000
): EclipticCoord {
  const equ = new coord.Equatorial(equatorial.ra, equatorial.dec);
  const ecl = equ.toEcliptic(obliquity);

  return {
    lon: ecl.lon,
    lat: ecl.lat,
  };
}

/**
 * Converts equatorial to horizontal coordinates
 *
 * @param equatorial - Equatorial coordinates
 * @param observer - Observer location
 * @param lst - Local Sidereal Time in hours
 * @returns Horizontal coordinates
 */
export function equatorialToHorizontal(
  equatorial: EquatorialCoord,
  observer: ObserverLocation,
  lst: number
): HorizontalCoord {
  const equ = new coord.Equatorial(equatorial.ra, equatorial.dec);
  const g = {
    lat: observer.latitude * DEG_TO_RAD,
    lon: observer.longitude * DEG_TO_RAD,
  };

  // LST is passed in hours, but toHorizontal expects it in hours as well
  const hz = equ.toHorizontal(g, lst);

  return {
    az: hz.az,
    alt: hz.alt,
  };
}

// =============================================================================
// MOON FUNCTIONS
// =============================================================================

/**
 * Gets geocentric moon position
 *
 * @param jde - Julian Ephemeris Day
 * @returns Moon position in ecliptic coordinates
 */
export function getMoonPosition(jde: number): Coord {
  const pos = moonposition.position(jde);

  return {
    lon: pos.lon,
    lat: pos.lat,
    range: pos.range ?? 384400, // Default to mean lunar distance in km
  };
}

/**
 * Gets moon's true ascending node longitude
 *
 * @param jde - Julian Ephemeris Day
 * @returns Longitude of true ascending node in radians
 */
export function getMoonTrueNode(jde: number): number {
  return moonposition.trueNode(jde);
}

/**
 * Calculates moon phase angle
 *
 * @param jde - Julian Ephemeris Day
 * @returns Phase angle in radians (0 = new moon, PI = full moon)
 */
export function getMoonPhaseAngle(jde: number): number {
  return moonillum.phaseAngle3(jde);
}

/**
 * Calculates illuminated fraction of the moon
 *
 * @param phaseAngle - Phase angle in radians
 * @returns Illuminated fraction (0 to 1)
 */
export function getMoonIllumination(phaseAngle: number): number {
  return base.illuminated(phaseAngle);
}

/**
 * Gets the next new moon after a given date
 *
 * @param year - Decimal year
 * @returns JDE of the next new moon
 */
export function getNextNewMoon(year: number): number {
  return moonphase.newMoon(year);
}

/**
 * Gets the next full moon after a given date
 *
 * @param year - Decimal year
 * @returns JDE of the next full moon
 */
export function getNextFullMoon(year: number): number {
  return moonphase.full(year);
}

/**
 * Gets the next first quarter moon after a given date
 *
 * @param year - Decimal year
 * @returns JDE of the next first quarter moon
 */
export function getNextFirstQuarter(year: number): number {
  return moonphase.first(year);
}

/**
 * Gets the next last quarter moon after a given date
 *
 * @param year - Decimal year
 * @returns JDE of the next last quarter moon
 */
export function getNextLastQuarter(year: number): number {
  return moonphase.last(year);
}

/**
 * Mean synodic lunar month in days
 */
export const LUNAR_MONTH = moonphase.meanLunarMonth;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Normalizes an angle to the range [0, 2*PI)
 *
 * @param angle - Angle in radians
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number {
  return base.pmod(angle, 2 * Math.PI);
}

/**
 * Converts radians to degrees
 *
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function toDegrees(radians: number): number {
  return radians * RAD_TO_DEG;
}

/**
 * Converts degrees to radians
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function toRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/**
 * Converts Right Ascension from radians to hours
 *
 * @param ra - Right Ascension in radians
 * @returns Right Ascension in hours (0-24)
 */
export function raToHours(ra: number): number {
  return normalizeAngle(ra) / HOURS_TO_RAD;
}

/**
 * Converts Right Ascension from hours to radians
 *
 * @param hours - Right Ascension in hours
 * @returns Right Ascension in radians
 */
export function hoursToRa(hours: number): number {
  return hours * HOURS_TO_RAD;
}

// =============================================================================
// SIDEREAL TIME
// =============================================================================

/**
 * Calculates Greenwich Mean Sidereal Time
 *
 * @param jd - Julian Date
 * @returns GMST in hours
 */
export function getGMST(jd: number): number {
  const T = (jd - J2000) / JULIAN_CENTURY;
  let gmst = 280.46061837 +
    360.98564736629 * (jd - J2000) +
    0.000387933 * T * T -
    T * T * T / 38710000;

  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15; // Convert to hours
}

/**
 * Calculates Local Sidereal Time
 *
 * @param jd - Julian Date
 * @param longitude - Observer's longitude in degrees (positive east)
 * @returns LST in hours
 */
export function getLST(jd: number, longitude: number): number {
  const gmst = getGMST(jd);
  let lst = gmst + longitude / 15;
  return ((lst % 24) + 24) % 24;
}

// =============================================================================
// EXPORT DEFAULT ADAPTER OBJECT
// =============================================================================

export default {
  // Time functions
  dateToJulian,
  julianToDate,
  jdeToDate,
  getCurrentJDE,
  yearToJDE,
  jdeToYear,

  // Planet functions
  getPlanetInstance,
  getHeliocentricPosition,
  getHeliocentricPositionOfDate,
  eclipticToCartesian,
  eclipticToEquatorial,
  equatorialToEcliptic,
  equatorialToHorizontal,

  // Moon functions
  getMoonPosition,
  getMoonTrueNode,
  getMoonPhaseAngle,
  getMoonIllumination,
  getNextNewMoon,
  getNextFullMoon,
  getNextFirstQuarter,
  getNextLastQuarter,
  LUNAR_MONTH,

  // Utility functions
  normalizeAngle,
  toDegrees,
  toRadians,
  raToHours,
  hoursToRa,
  getGMST,
  getLST,

  // Constants
  J2000,
  JULIAN_CENTURY,
  OBLIQUITY_J2000,
  DEG_TO_RAD,
  RAD_TO_DEG,
  HOURS_TO_RAD,
  AU_KM,
};
