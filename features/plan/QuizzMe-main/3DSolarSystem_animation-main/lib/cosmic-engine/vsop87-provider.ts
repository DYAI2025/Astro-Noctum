/**
 * VSOP87 Planet Position Provider
 *
 * High-precision planet position calculations using the VSOP87 theory.
 * Provides positions in multiple coordinate systems suitable for 3D visualization.
 *
 * @module cosmic-engine/vsop87-provider
 */

import type {
  PlanetName,
  PlanetPosition,
  Position3D,
  Position3DOptions,
  Coord,
} from './types';

import {
  getPlanetInstance,
  getHeliocentricPosition,
  eclipticToCartesian,
  eclipticToEquatorial,
  dateToJulian,
  normalizeAngle,
  toDegrees,
  OBLIQUITY_J2000,
} from './astronomia-adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default scale factor for visualization */
const DEFAULT_SCALE = 25;

/** List of all supported planets (excluding Earth for geocentric views) */
export const ALL_PLANETS: PlanetName[] = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];

/** Inner planets for filtering */
export const INNER_PLANETS: PlanetName[] = ['mercury', 'venus', 'earth', 'mars'];

/** Outer planets for filtering */
export const OUTER_PLANETS: PlanetName[] = ['jupiter', 'saturn', 'uranus', 'neptune'];

// =============================================================================
// SCALING FUNCTIONS
// =============================================================================

/**
 * Logarithmic scaling function for better visualization of planetary distances
 *
 * @param distance - Distance in AU
 * @param scale - Base scale factor
 * @returns Scaled distance for rendering
 */
export function logarithmicScale(distance: number, scale: number = DEFAULT_SCALE): number {
  return Math.log10(distance + 1) * scale;
}

/**
 * Linear scaling function
 *
 * @param distance - Distance in AU
 * @param scale - Scale factor
 * @returns Scaled distance
 */
export function linearScale(distance: number, scale: number = 10): number {
  return distance * scale;
}

/**
 * Square root scaling function (compromise between linear and log)
 *
 * @param distance - Distance in AU
 * @param scale - Base scale factor
 * @returns Scaled distance
 */
export function sqrtScale(distance: number, scale: number = 15): number {
  return Math.sqrt(distance) * scale;
}

// =============================================================================
// POSITION CALCULATIONS
// =============================================================================

/**
 * Gets the complete position of a planet using VSOP87
 *
 * @param planet - Planet name
 * @param jde - Julian Ephemeris Day
 * @param options - Position calculation options
 * @returns Complete planet position with all coordinate systems
 */
export function getPlanetPositionVSOP87(
  planet: PlanetName,
  jde: number,
  options: Position3DOptions = {}
): PlanetPosition {
  const {
    scale = DEFAULT_SCALE,
    logarithmic = true,
    scalingFn,
  } = options;

  // Get heliocentric ecliptic coordinates
  const heliocentric = getHeliocentricPosition(planet, jde);

  // Calculate 3D Cartesian coordinates (unscaled)
  const cartesian = eclipticToCartesian(heliocentric);

  // Calculate equatorial coordinates
  const equatorial = eclipticToEquatorial(
    { lon: heliocentric.lon, lat: heliocentric.lat },
    OBLIQUITY_J2000
  );

  // Apply scaling for visualization
  const scaler = scalingFn ?? (logarithmic ? logarithmicScale : linearScale);
  const scaledDistance = scaler(heliocentric.range, scale);
  const scaleFactor = heliocentric.range > 0 ? scaledDistance / heliocentric.range : 0;

  return {
    // 3D position (scaled, with Y-up convention for Three.js)
    x: cartesian.x * scaleFactor,
    y: cartesian.z * scaleFactor,  // Z becomes Y (up)
    z: -cartesian.y * scaleFactor, // Y becomes -Z (into screen)

    // Distance
    distance: heliocentric.range,

    // Equatorial coordinates
    ra: equatorial.ra,
    dec: equatorial.dec,

    // Ecliptic coordinates
    lon: heliocentric.lon,
    lat: heliocentric.lat,
  };
}

/**
 * Gets positions of all planets at a given time
 *
 * @param jde - Julian Ephemeris Day
 * @param options - Position calculation options
 * @returns Record of planet positions keyed by planet name
 */
export function getAllPlanetPositions(
  jde: number,
  options: Position3DOptions = {}
): Record<PlanetName, PlanetPosition> {
  const positions: Partial<Record<PlanetName, PlanetPosition>> = {};

  for (const planet of ALL_PLANETS) {
    positions[planet] = getPlanetPositionVSOP87(planet, jde, options);
  }

  return positions as Record<PlanetName, PlanetPosition>;
}

/**
 * Gets positions for a specific date
 *
 * @param date - JavaScript Date object
 * @param options - Position calculation options
 * @returns Record of planet positions
 */
export function getPlanetPositionsForDate(
  date: Date,
  options: Position3DOptions = {}
): Record<PlanetName, PlanetPosition> {
  const { jde } = dateToJulian(date);
  return getAllPlanetPositions(jde, options);
}

// =============================================================================
// GEOCENTRIC CALCULATIONS
// =============================================================================

/**
 * Gets geocentric position of a planet (as seen from Earth)
 *
 * @param planet - Planet name (cannot be 'earth')
 * @param jde - Julian Ephemeris Day
 * @param options - Position calculation options
 * @returns Geocentric planet position
 */
export function getGeocentricPosition(
  planet: PlanetName,
  jde: number,
  options: Position3DOptions = {}
): PlanetPosition {
  if (planet === 'earth') {
    throw new Error('Cannot calculate geocentric position of Earth');
  }

  // Get heliocentric positions
  const planetPos = getHeliocentricPosition(planet, jde);
  const earthPos = getHeliocentricPosition('earth', jde);

  // Convert to Cartesian
  const planetCart = eclipticToCartesian(planetPos);
  const earthCart = eclipticToCartesian(earthPos);

  // Calculate geocentric Cartesian (planet relative to Earth)
  const geoCart = {
    x: planetCart.x - earthCart.x,
    y: planetCart.y - earthCart.y,
    z: planetCart.z - earthCart.z,
  };

  // Calculate geocentric distance
  const distance = Math.sqrt(
    geoCart.x * geoCart.x +
    geoCart.y * geoCart.y +
    geoCart.z * geoCart.z
  );

  // Calculate geocentric ecliptic coordinates
  const lon = normalizeAngle(Math.atan2(geoCart.y, geoCart.x));
  const lat = Math.asin(geoCart.z / distance);

  // Convert to equatorial
  const equatorial = eclipticToEquatorial({ lon, lat }, OBLIQUITY_J2000);

  // Apply scaling
  const {
    scale = DEFAULT_SCALE,
    logarithmic = true,
    scalingFn,
  } = options;

  const scaler = scalingFn ?? (logarithmic ? logarithmicScale : linearScale);
  const scaledDistance = scaler(distance, scale);
  const scaleFactor = distance > 0 ? scaledDistance / distance : 0;

  return {
    x: geoCart.x * scaleFactor,
    y: geoCart.z * scaleFactor,
    z: -geoCart.y * scaleFactor,
    distance,
    ra: equatorial.ra,
    dec: equatorial.dec,
    lon,
    lat,
  };
}

/**
 * Gets geocentric positions of all planets except Earth
 *
 * @param jde - Julian Ephemeris Day
 * @param options - Position calculation options
 * @returns Record of geocentric positions
 */
export function getAllGeocentricPositions(
  jde: number,
  options: Position3DOptions = {}
): Record<Exclude<PlanetName, 'earth'>, PlanetPosition> {
  const positions: Partial<Record<Exclude<PlanetName, 'earth'>, PlanetPosition>> = {};

  for (const planet of ALL_PLANETS) {
    if (planet !== 'earth') {
      positions[planet] = getGeocentricPosition(planet, jde, options);
    }
  }

  return positions as Record<Exclude<PlanetName, 'earth'>, PlanetPosition>;
}

// =============================================================================
// ORBIT CALCULATIONS
// =============================================================================

/**
 * Generates orbit path points for a planet
 *
 * @param planet - Planet name
 * @param jde - Base Julian Ephemeris Day
 * @param numPoints - Number of points to generate (default: 360)
 * @param options - Position calculation options
 * @returns Array of 3D positions forming the orbit
 */
export function getOrbitPath(
  planet: PlanetName,
  jde: number,
  numPoints: number = 360,
  options: Position3DOptions = {}
): Position3D[] {
  // Get orbital period in days (approximate)
  const orbitalPeriods: Record<PlanetName, number> = {
    mercury: 87.97,
    venus: 224.7,
    earth: 365.25,
    mars: 686.98,
    jupiter: 4332.59,
    saturn: 10759.22,
    uranus: 30688.5,
    neptune: 60182,
  };

  const period = orbitalPeriods[planet];
  const points: Position3D[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = jde + (i / numPoints) * period;
    const pos = getPlanetPositionVSOP87(planet, t, options);
    points.push({ x: pos.x, y: pos.y, z: pos.z });
  }

  return points;
}

/**
 * Gets orbital elements for a planet at a given time
 *
 * @param planet - Planet name
 * @param jde - Julian Ephemeris Day
 * @returns Orbital elements in degrees/AU
 */
export function getOrbitalElements(
  planet: PlanetName,
  jde: number
): {
  a: number;
  e: number;
  i: number;
  omega: number;
  w: number;
  L: number;
} {
  // Get position
  const pos = getHeliocentricPosition(planet, jde);

  // These are approximations from the VSOP87 position
  // For more accurate elements, use the planetelements module
  return {
    a: pos.range, // Semi-major axis approximation
    e: 0, // Would need more data to calculate
    i: toDegrees(pos.lat), // Inclination approximation
    omega: 0, // Longitude of ascending node
    w: 0, // Argument of perihelion
    L: toDegrees(pos.lon), // Mean longitude
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets the planet closest to Earth at a given time
 *
 * @param jde - Julian Ephemeris Day
 * @returns Planet name and distance
 */
export function getClosestPlanet(
  jde: number
): { planet: PlanetName; distance: number } {
  let closest: PlanetName = 'venus';
  let minDistance = Infinity;

  for (const planet of ALL_PLANETS) {
    if (planet === 'earth') continue;

    const pos = getGeocentricPosition(planet, jde);
    if (pos.distance < minDistance) {
      minDistance = pos.distance;
      closest = planet;
    }
  }

  return { planet: closest, distance: minDistance };
}

/**
 * Checks if a planet is visible from Earth (above horizon)
 *
 * @param planet - Planet name
 * @param jde - Julian Ephemeris Day
 * @param latitude - Observer latitude in degrees
 * @param longitude - Observer longitude in degrees
 * @returns True if planet is above horizon
 */
export function isPlanetVisible(
  planet: PlanetName,
  jde: number,
  latitude: number,
  longitude: number
): boolean {
  // This would require calculating horizontal coordinates
  // For now, return true as a placeholder
  // Full implementation would use equatorialToHorizontal
  return true;
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Position functions
  getPlanetPositionVSOP87,
  getAllPlanetPositions,
  getPlanetPositionsForDate,
  getGeocentricPosition,
  getAllGeocentricPositions,

  // Orbit functions
  getOrbitPath,
  getOrbitalElements,

  // Utility functions
  getClosestPlanet,
  isPlanetVisible,

  // Scaling functions
  logarithmicScale,
  linearScale,
  sqrtScale,

  // Planet lists
  ALL_PLANETS,
  INNER_PLANETS,
  OUTER_PLANETS,
};
