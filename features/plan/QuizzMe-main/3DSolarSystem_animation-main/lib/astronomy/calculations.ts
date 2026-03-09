// ═══════════════════════════════════════════════════════════════════════════════
// ASTRONOMICAL CALCULATIONS
// Mathematical functions for planetary positions and sky coordinates
// ═══════════════════════════════════════════════════════════════════════════════

import { PlanetData, EquatorialCoordinates, HorizontalCoordinates, Position3D } from './types';

/**
 * Solves Kepler's equation using Newton-Raphson iteration
 * @param M Mean anomaly in radians
 * @param e Eccentricity
 * @param tol Tolerance for convergence
 * @returns Eccentric anomaly in radians
 */
export function solveKepler(M: number, e: number, tol: number = 1e-8): number {
  let E = M;
  for (let i = 0; i < 100; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

/**
 * Calculates planet position using Keplerian orbital mechanics
 * @param planet Planet orbital data
 * @param daysSinceJ2000 Days since J2000.0 epoch
 * @param scale Scaling factor for display
 * @returns 3D position and distance
 */
export function getPlanetPosition(
  planet: PlanetData,
  daysSinceJ2000: number,
  scale: number = 25
): Position3D & { distance: number; ra: number; dec: number } {
  const { a, e, i, omega, w, M0, period } = planet;

  // Mean motion
  const n = (2 * Math.PI) / period;

  // Mean anomaly
  const M = ((M0 * Math.PI / 180) + n * daysSinceJ2000) % (2 * Math.PI);

  // Eccentric anomaly
  const E = solveKepler(M, e);

  // True anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );

  // Heliocentric distance
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Convert to radians
  const iRad = i * Math.PI / 180;
  const omegaRad = omega * Math.PI / 180;
  const wRad = w * Math.PI / 180;

  // Rotation matrices
  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);
  const cosW = Math.cos(wRad);
  const sinW = Math.sin(wRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  // Transform to ecliptic coordinates
  const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;

  // Logarithmic scaling for better visualization
  const scaled = Math.log10(r + 1) * scale;
  const factor = scaled / r;

  return {
    x: x * factor,
    y: z * factor,
    z: -y * factor,
    distance: r,
    ra: 0,
    dec: 0
  };
}

/**
 * Converts Date to Julian Date
 * @param date JavaScript Date object
 * @returns Julian Date
 */
export function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;

  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;

  return d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045;
}

/**
 * Calculates days since J2000.0 epoch
 * @param date JavaScript Date object
 * @returns Days since J2000.0
 */
export function daysSinceJ2000(date: Date): number {
  return dateToJD(date) - 2451545.0;
}

/**
 * Calculates Greenwich Mean Sidereal Time
 * @param jd Julian Date
 * @returns GMST in hours
 */
export function getGMST(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    T * T * T / 38710000;

  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15; // Convert to hours
}

/**
 * Calculates Local Sidereal Time
 * @param jd Julian Date
 * @param longitude Observer's longitude in degrees
 * @returns LST in hours
 */
export function getLST(jd: number, longitude: number): number {
  const gmst = getGMST(jd);
  let lst = gmst + longitude / 15;
  return ((lst % 24) + 24) % 24;
}

/**
 * Converts equatorial to horizontal coordinates
 * @param ra Right Ascension in hours
 * @param dec Declination in degrees
 * @param lat Observer's latitude in degrees
 * @param lst Local Sidereal Time in hours
 * @returns Horizontal coordinates (altitude and azimuth)
 */
export function equatorialToHorizontal(
  ra: number,
  dec: number,
  lat: number,
  lst: number
): HorizontalCoordinates {
  const raRad = ra * 15 * Math.PI / 180;
  const decRad = dec * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const lstRad = lst * 15 * Math.PI / 180;

  const ha = lstRad - raRad; // Hour Angle

  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha);
  const alt = Math.asin(sinAlt);

  const cosAz = (Math.sin(decRad) - Math.sin(alt) * Math.sin(latRad)) /
    (Math.cos(alt) * Math.cos(latRad));
  const sinAz = -Math.cos(decRad) * Math.sin(ha) / Math.cos(alt);
  let az = Math.atan2(sinAz, cosAz);

  return {
    altitude: alt * 180 / Math.PI,
    azimuth: ((az * 180 / Math.PI) + 360) % 360
  };
}

/**
 * Converts horizontal coordinates to 3D position on sky dome
 * @param alt Altitude in degrees
 * @param az Azimuth in degrees
 * @param radius Sky dome radius
 * @returns 3D position
 */
export function horizontalTo3D(alt: number, az: number, radius: number = 100): Position3D {
  const altRad = alt * Math.PI / 180;
  const azRad = az * Math.PI / 180;

  // Y is up, X is east, Z is north
  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const y = radius * Math.sin(altRad);
  const z = radius * Math.cos(altRad) * Math.cos(azRad);

  return { x, y, z };
}

/**
 * Converts ecliptic to equatorial coordinates
 * @param x X coordinate in ecliptic system
 * @param y Y coordinate in ecliptic system
 * @param z Z coordinate in ecliptic system
 * @param obliquity Obliquity of the ecliptic in degrees
 * @returns Equatorial coordinates (RA in hours, Dec in degrees)
 */
export function eclipticToEquatorial(
  x: number,
  y: number,
  z: number,
  obliquity: number = 23.439
): EquatorialCoordinates {
  const eps = obliquity * Math.PI / 180;

  const xEq = x;
  const yEq = y * Math.cos(eps) - z * Math.sin(eps);
  const zEq = y * Math.sin(eps) + z * Math.cos(eps);

  const r = Math.sqrt(xEq * xEq + yEq * yEq + zEq * zEq);
  const dec = Math.asin(zEq / r) * 180 / Math.PI;
  let ra = Math.atan2(yEq, xEq) * 180 / Math.PI;
  ra = ((ra + 360) % 360) / 15; // Convert to hours

  return { ra, dec };
}
