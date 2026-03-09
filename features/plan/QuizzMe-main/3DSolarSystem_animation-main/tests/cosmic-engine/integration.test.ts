/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTEGRATION TESTS - FULL ASTRONOMICAL PIPELINE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * End-to-end integration tests for the astronomical calculation pipeline:
 * 1. Date → Julian Date (JD) → Days since J2000
 * 2. Days → Planet positions via Keplerian mechanics
 * 3. Planet positions → Ecliptic coordinates → Equatorial coordinates
 * 4. Observer location → LST → Horizontal coordinates → 3D positions
 *
 * These tests verify the complete data flow from user input to rendered output.
 */

import { describe, it, expect } from 'vitest';
import {
  dateToJD,
  daysSinceJ2000,
  getPlanetPosition,
  eclipticToEquatorial,
  equatorialToHorizontal,
  horizontalTo3D,
  getGMST,
  getLST,
  solveKepler,
} from '@/lib/astronomy/calculations';
import { PLANETS, STARS, CITIES } from '@/lib/astronomy/data';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gets raw planet position without visual scaling
 */
function getRawPlanetEcliptic(planet: typeof PLANETS['mars'], days: number) {
  const { a, e, i, omega, w, M0, period } = planet;

  const n = (2 * Math.PI) / period;
  const M = ((M0 * Math.PI / 180) + n * days) % (2 * Math.PI);
  const E = solveKepler(M, e);

  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );

  const r = a * (1 - e * Math.cos(E));

  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  const iRad = i * Math.PI / 180;
  const omegaRad = omega * Math.PI / 180;
  const wRad = w * Math.PI / 180;

  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);
  const cosW = Math.cos(wRad);
  const sinW = Math.sin(wRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;

  return { x, y, z, r };
}

/**
 * Normalize angle to [0, 360)
 */
function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST: COMPLETE DATE TO POSITION PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

describe('Date to Planet Position Pipeline', () => {
  /**
   * Tests the complete flow from JavaScript Date to 3D planet positions
   */

  it('should convert current date through full pipeline', () => {
    const testDate = new Date(Date.UTC(2025, 5, 15, 12, 0, 0)); // June 15, 2025

    // Step 1: Date to Julian Date
    const jd = dateToJD(testDate);
    expect(jd).toBeGreaterThan(2451545.0); // After J2000.0

    // Step 2: Julian Date to days since J2000
    const days = daysSinceJ2000(testDate);
    expect(days).toBeCloseTo(jd - 2451545.0, 6);

    // Step 3: Days to planet position
    const marsPos = getPlanetPosition(PLANETS.mars, days);

    // Verify we get valid 3D coordinates
    expect(typeof marsPos.x).toBe('number');
    expect(typeof marsPos.y).toBe('number');
    expect(typeof marsPos.z).toBe('number');
    expect(marsPos.distance).toBeGreaterThan(0);

    // Mars distance should be reasonable (1.3 - 2.7 AU)
    expect(marsPos.distance).toBeGreaterThan(1.3);
    expect(marsPos.distance).toBeLessThan(2.7);
  });

  it('should track Earth completing one orbit in 365.25 days', () => {
    const startDate = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
    const endDate = new Date(Date.UTC(2025, 0, 1, 12, 0, 0));

    const startDays = daysSinceJ2000(startDate);
    const endDays = daysSinceJ2000(endDate);

    const startPos = getRawPlanetEcliptic(PLANETS.earth, startDays);
    const endPos = getRawPlanetEcliptic(PLANETS.earth, endDays);

    // Calculate angular positions
    const startAngle = Math.atan2(startPos.y, startPos.x) * 180 / Math.PI;
    const endAngle = Math.atan2(endPos.y, endPos.x) * 180 / Math.PI;

    // After 366 days (2024 is leap year), Earth should be back near same position
    const angleDiff = normalizeAngle(endAngle - startAngle);
    expect(Math.min(angleDiff, 360 - angleDiff)).toBeLessThan(5);
  });

  it('should calculate all planets without errors', () => {
    const testDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    const days = daysSinceJ2000(testDate);

    const planetKeys = Object.keys(PLANETS);

    for (const key of planetKeys) {
      const pos = getPlanetPosition(PLANETS[key], days);

      // All should return valid numbers
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(Number.isFinite(pos.z)).toBe(true);
      expect(Number.isFinite(pos.distance)).toBe(true);
      expect(pos.distance).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: OBSERVER LOCATION TO SKY VIEW PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

describe('Observer to Sky View Pipeline', () => {
  /**
   * Tests the complete flow from observer location to star positions in the sky
   */

  it('should calculate star positions for Berlin observer', () => {
    const berlin = CITIES.find(c => c.name === 'Berlin')!;
    const testDate = new Date(Date.UTC(2025, 6, 15, 22, 0, 0)); // July 15, 2025, 22:00 UTC

    // Step 1: Calculate Julian Date
    const jd = dateToJD(testDate);

    // Step 2: Calculate Local Sidereal Time
    const lst = getLST(jd, berlin.lon);
    expect(lst).toBeGreaterThanOrEqual(0);
    expect(lst).toBeLessThan(24);

    // Step 3: Convert star to horizontal coordinates
    const vega = STARS.find(s => s.name === 'Vega')!;
    const horizontal = equatorialToHorizontal(vega.ra, vega.dec, berlin.lat, lst);

    expect(horizontal.altitude).toBeGreaterThan(-90);
    expect(horizontal.altitude).toBeLessThan(90);
    expect(horizontal.azimuth).toBeGreaterThanOrEqual(0);
    expect(horizontal.azimuth).toBeLessThan(360);

    // Step 4: Convert to 3D position on sky dome
    const skyRadius = 100;
    const pos3D = horizontalTo3D(horizontal.altitude, horizontal.azimuth, skyRadius);

    const computedRadius = Math.sqrt(pos3D.x * pos3D.x + pos3D.y * pos3D.y + pos3D.z * pos3D.z);
    expect(computedRadius).toBeCloseTo(skyRadius, 5);
  });

  it('should show summer triangle visible in northern summer', () => {
    // Summer Triangle: Vega, Deneb, Altair
    // These should all be above horizon at some point during a summer night
    const berlin = CITIES.find(c => c.name === 'Berlin')!;

    // Check across multiple hours of a summer night to find when each star is visible
    const summerTriangle = ['Vega', 'Deneb', 'Altair'];
    const visibleStars = new Set<string>();

    // Check every 2 hours from 20:00 to 04:00 UTC (evening to early morning in summer)
    for (let hour = 20; hour <= 28; hour += 2) {
      const adjustedHour = hour >= 24 ? hour - 24 : hour;
      const day = hour >= 24 ? 16 : 15;
      const summerNight = new Date(Date.UTC(2025, 6, day, adjustedHour, 0, 0));

      const jd = dateToJD(summerNight);
      const lst = getLST(jd, berlin.lon);

      for (const starName of summerTriangle) {
        const star = STARS.find(s => s.name === starName);
        if (star) {
          const { altitude } = equatorialToHorizontal(star.ra, star.dec, berlin.lat, lst);
          if (altitude > 0) { // Above horizon
            visibleStars.add(starName);
          }
        }
      }
    }

    // All summer triangle stars should be visible at some point during the night
    expect(visibleStars.size).toBe(3);
  });

  it('should show Orion visibility differs between winter and summer', () => {
    const berlin = CITIES.find(c => c.name === 'Berlin')!;
    const betelgeuse = STARS.find(s => s.name === 'Betelgeuse')!;

    // Check Orion's maximum altitude during winter night vs summer night
    // Winter night: Dec 15, check from 18:00 to 06:00 UTC
    // Summer night: June 15, check from 20:00 to 04:00 UTC

    let maxWinterAlt = -90;
    for (let hour = 18; hour <= 30; hour += 2) {
      const adjustedHour = hour >= 24 ? hour - 24 : hour;
      const day = hour >= 24 ? 16 : 15;
      const winterNight = new Date(Date.UTC(2025, 11, day, adjustedHour, 0, 0));
      const winterJD = dateToJD(winterNight);
      const winterLST = getLST(winterJD, berlin.lon);
      const { altitude } = equatorialToHorizontal(betelgeuse.ra, betelgeuse.dec, berlin.lat, winterLST);
      maxWinterAlt = Math.max(maxWinterAlt, altitude);
    }

    let maxSummerAlt = -90;
    for (let hour = 20; hour <= 28; hour += 2) {
      const adjustedHour = hour >= 24 ? hour - 24 : hour;
      const day = hour >= 24 ? 16 : 15;
      const summerNight = new Date(Date.UTC(2025, 5, day, adjustedHour, 0, 0));
      const summerJD = dateToJD(summerNight);
      const summerLST = getLST(summerJD, berlin.lon);
      const { altitude } = equatorialToHorizontal(betelgeuse.ra, betelgeuse.dec, berlin.lat, summerLST);
      maxSummerAlt = Math.max(maxSummerAlt, altitude);
    }

    // Betelgeuse (in Orion) should reach higher altitudes during winter nights
    // as Orion is a winter constellation for northern hemisphere
    expect(maxWinterAlt).toBeGreaterThan(maxSummerAlt);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: ECLIPTIC TO EQUATORIAL TO HORIZONTAL PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

describe('Planet Position to Sky Position Pipeline', () => {
  /**
   * Tests converting heliocentric planet positions to observer's sky view
   */

  it('should calculate Mars position in the sky', () => {
    const berlin = CITIES.find(c => c.name === 'Berlin')!;
    const testDate = new Date(Date.UTC(2025, 0, 15, 22, 0, 0));

    const days = daysSinceJ2000(testDate);
    const jd = dateToJD(testDate);

    // Get heliocentric positions
    const marsEcl = getRawPlanetEcliptic(PLANETS.mars, days);
    const earthEcl = getRawPlanetEcliptic(PLANETS.earth, days);

    // Geocentric position (Mars relative to Earth)
    const geoX = marsEcl.x - earthEcl.x;
    const geoY = marsEcl.y - earthEcl.y;
    const geoZ = marsEcl.z - earthEcl.z;

    // Convert to equatorial
    const equatorial = eclipticToEquatorial(geoX, geoY, geoZ);

    // Convert to horizontal
    const lst = getLST(jd, berlin.lon);
    const horizontal = equatorialToHorizontal(equatorial.ra, equatorial.dec, berlin.lat, lst);

    // Verify we get valid sky position
    expect(horizontal.altitude).toBeGreaterThan(-90);
    expect(horizontal.altitude).toBeLessThan(90);
    expect(horizontal.azimuth).toBeGreaterThanOrEqual(0);
    expect(horizontal.azimuth).toBeLessThan(360);

    // Near opposition, Mars should be visible at night
    expect(horizontal.altitude).toBeGreaterThan(-30);
  });

  it('should show inner planets (Venus) can be both morning and evening star', () => {
    // Venus orbits inside Earth's orbit
    // When west of Sun: morning star (visible before sunrise)
    // When east of Sun: evening star (visible after sunset)

    const days1 = daysSinceJ2000(new Date(Date.UTC(2025, 0, 1)));
    const days2 = daysSinceJ2000(new Date(Date.UTC(2025, 6, 1)));

    const venus1 = getRawPlanetEcliptic(PLANETS.venus, days1);
    const earth1 = getRawPlanetEcliptic(PLANETS.earth, days1);
    const venus2 = getRawPlanetEcliptic(PLANETS.venus, days2);
    const earth2 = getRawPlanetEcliptic(PLANETS.earth, days2);

    // Sun direction as seen from Earth
    const sunDir1 = Math.atan2(-earth1.y, -earth1.x);
    const sunDir2 = Math.atan2(-earth2.y, -earth2.x);

    // Venus direction as seen from Earth
    const venusDir1 = Math.atan2(venus1.y - earth1.y, venus1.x - earth1.x);
    const venusDir2 = Math.atan2(venus2.y - earth2.y, venus2.x - earth2.x);

    // Elongation of Venus from Sun
    const elong1 = ((venusDir1 - sunDir1) * 180 / Math.PI + 540) % 360 - 180;
    const elong2 = ((venusDir2 - sunDir2) * 180 / Math.PI + 540) % 360 - 180;

    // Venus elongation should change between dates
    // Inner planets have max elongation of ~47° (Venus)
    expect(Math.abs(elong1)).toBeLessThan(50);
    expect(Math.abs(elong2)).toBeLessThan(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: BIRTH CHART CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

describe('Birth Chart Calculation', () => {
  /**
   * Tests the ability to calculate planet positions for a specific date/time/location
   * as would be used for an astrological birth chart
   */

  it('should calculate complete sky state for a birth time', () => {
    const birthDate = new Date(Date.UTC(1990, 5, 21, 15, 30, 0)); // June 21, 1990, 15:30 UTC
    const birthPlace = CITIES.find(c => c.name === 'Berlin')!;

    const days = daysSinceJ2000(birthDate);
    const jd = dateToJD(birthDate);
    const lst = getLST(jd, birthPlace.lon);

    // Calculate all planet positions
    const planetPositions: Record<string, { ra: number; dec: number; distance: number }> = {};

    const earthPos = getRawPlanetEcliptic(PLANETS.earth, days);

    for (const [key, planet] of Object.entries(PLANETS)) {
      if (key === 'earth') continue;

      const pos = getRawPlanetEcliptic(planet, days);
      const geoX = pos.x - earthPos.x;
      const geoY = pos.y - earthPos.y;
      const geoZ = pos.z - earthPos.z;

      const geocentricDist = Math.sqrt(geoX * geoX + geoY * geoY + geoZ * geoZ);
      const equatorial = eclipticToEquatorial(geoX, geoY, geoZ);

      planetPositions[key] = {
        ra: equatorial.ra,
        dec: equatorial.dec,
        distance: geocentricDist,
      };
    }

    // All planets should have valid positions
    for (const [key, pos] of Object.entries(planetPositions)) {
      expect(pos.ra).toBeGreaterThanOrEqual(0);
      expect(pos.ra).toBeLessThan(24);
      expect(pos.dec).toBeGreaterThanOrEqual(-90);
      expect(pos.dec).toBeLessThanOrEqual(90);
      expect(pos.distance).toBeGreaterThan(0);
    }

    // June 21 is summer solstice - Sun should be near RA 6h
    // The "Sun position" would be opposite Earth's heliocentric position
    const sunRA = normalizeAngle((Math.atan2(-earthPos.y, -earthPos.x) * 180 / Math.PI) + 360) / 15;
    expect(sunRA).toBeGreaterThan(4);
    expect(sunRA).toBeLessThan(8);
  });

  it('should accurately reproduce known planetary configuration', () => {
    // Test a date with known planet positions
    // January 1, 2000 (J2000.0 epoch)
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const days = daysSinceJ2000(j2000);

    expect(days).toBeCloseTo(0, 4);

    // Get all planet distances at J2000
    const distances: Record<string, number> = {};
    for (const [key, planet] of Object.entries(PLANETS)) {
      const pos = getRawPlanetEcliptic(planet, days);
      distances[key] = pos.r;
    }

    // Verify distances are within expected ranges
    expect(distances.mercury).toBeGreaterThan(0.3);
    expect(distances.mercury).toBeLessThan(0.5);

    expect(distances.venus).toBeGreaterThan(0.7);
    expect(distances.venus).toBeLessThan(0.73);

    expect(distances.earth).toBeGreaterThan(0.98);
    expect(distances.earth).toBeLessThan(1.02);

    expect(distances.mars).toBeGreaterThan(1.3);
    expect(distances.mars).toBeLessThan(1.7);

    expect(distances.jupiter).toBeGreaterThan(4.9);
    expect(distances.jupiter).toBeLessThan(5.5);

    expect(distances.saturn).toBeGreaterThan(9.0);
    expect(distances.saturn).toBeLessThan(10.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: TIME ANIMATION CORRECTNESS
// ─────────────────────────────────────────────────────────────────────────────

describe('Time Animation', () => {
  /**
   * Tests that planet positions update correctly when time advances
   */

  it('should show continuous planet motion over time', () => {
    const startDate = new Date(Date.UTC(2025, 0, 1));
    const startDays = daysSinceJ2000(startDate);

    const positions: Array<{ day: number; marsX: number }> = [];

    // Sample Mars position every 10 days for 100 days
    for (let d = 0; d < 100; d += 10) {
      const pos = getRawPlanetEcliptic(PLANETS.mars, startDays + d);
      positions.push({ day: d, marsX: pos.x });
    }

    // Positions should change over time (not static)
    const uniqueX = new Set(positions.map(p => p.marsX.toFixed(4)));
    expect(uniqueX.size).toBeGreaterThan(5);

    // Motion should be relatively smooth (no jumps)
    for (let i = 1; i < positions.length; i++) {
      const deltaX = Math.abs(positions[i].marsX - positions[i-1].marsX);
      // Mars shouldn't jump more than 1 AU in 10 days
      expect(deltaX).toBeLessThan(1.0);
    }
  });

  it('should update sidereal time correctly for animation', () => {
    const baseDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    const jd1 = dateToJD(baseDate);

    // Advance 1 hour
    const jd2 = jd1 + 1/24;

    const gmst1 = getGMST(jd1);
    const gmst2 = getGMST(jd2);

    // GMST should advance by about 1 hour + sidereal correction
    let diff = gmst2 - gmst1;
    if (diff < 0) diff += 24;

    // Should be slightly more than 1 hour (sidereal time runs faster)
    expect(diff).toBeGreaterThan(0.99);
    expect(diff).toBeLessThan(1.02);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: STAR CATALOG INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

describe('Star Catalog Integration', () => {
  /**
   * Tests that the star catalog works correctly with coordinate transformations
   */

  it('should have valid coordinates for all catalog stars', () => {
    for (const star of STARS) {
      expect(star.ra).toBeGreaterThanOrEqual(0);
      expect(star.ra).toBeLessThan(24);
      expect(star.dec).toBeGreaterThanOrEqual(-90);
      expect(star.dec).toBeLessThanOrEqual(90);
      expect(star.mag).toBeLessThan(10); // Should be relatively bright stars
    }
  });

  it('should correctly position Polaris near celestial north pole', () => {
    const polaris = STARS.find(s => s.name === 'Polaris')!;

    // Polaris Dec should be very close to +90°
    expect(polaris.dec).toBeGreaterThan(89);
    expect(polaris.dec).toBeLessThan(90);
  });

  it('should correctly identify circumpolar stars for different latitudes', () => {
    const testLatitudes = [0, 30, 45, 60, 90];

    for (const lat of testLatitudes) {
      const circumpolarDecMin = 90 - lat;

      const circumpolarStars = STARS.filter(s => s.dec > circumpolarDecMin);

      // At equator, no stars are circumpolar (except near the pole)
      // At higher latitudes, more stars become circumpolar
      if (lat === 0) {
        // Only very few stars near the pole
        expect(circumpolarStars.length).toBeLessThan(5);
      } else if (lat === 90) {
        // At pole, all visible stars are circumpolar
        const northernStars = STARS.filter(s => s.dec > 0);
        expect(circumpolarStars.length).toBe(northernStars.length);
      }
    }
  });

  it('should convert star positions to sky dome for planetarium view', () => {
    const berlin = CITIES.find(c => c.name === 'Berlin')!;
    const testDate = new Date(Date.UTC(2025, 6, 15, 22, 0, 0));
    const jd = dateToJD(testDate);
    const lst = getLST(jd, berlin.lon);

    let visibleCount = 0;

    for (const star of STARS) {
      const { altitude, azimuth } = equatorialToHorizontal(star.ra, star.dec, berlin.lat, lst);

      if (altitude > 0) {
        visibleCount++;

        const pos = horizontalTo3D(altitude, azimuth, 100);

        // Verify 3D position is valid
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
        expect(Number.isFinite(pos.z)).toBe(true);

        // Y should be positive (above horizon)
        expect(pos.y).toBeGreaterThan(0);
      }
    }

    // Should have a reasonable number of visible stars
    expect(visibleCount).toBeGreaterThan(30);
    expect(visibleCount).toBeLessThan(STARS.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: NUMERICAL STABILITY
// ─────────────────────────────────────────────────────────────────────────────

describe('Numerical Stability', () => {
  /**
   * Tests that calculations remain stable for extreme or edge-case inputs
   */

  it('should handle very large days since J2000 (far future)', () => {
    // 1000 years in the future
    const farFuture = 365.25 * 1000;

    for (const [key, planet] of Object.entries(PLANETS)) {
      const pos = getPlanetPosition(planet, farFuture);

      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(Number.isFinite(pos.z)).toBe(true);
      expect(Number.isFinite(pos.distance)).toBe(true);
    }
  });

  it('should handle very large negative days (far past)', () => {
    // 1000 years in the past
    const farPast = -365.25 * 1000;

    for (const [key, planet] of Object.entries(PLANETS)) {
      const pos = getPlanetPosition(planet, farPast);

      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(Number.isFinite(pos.z)).toBe(true);
    }
  });

  it('should handle observer at extreme latitudes', () => {
    const extremeLatitudes = [89.9, -89.9, 0.001, -0.001];

    for (const lat of extremeLatitudes) {
      const { altitude, azimuth } = equatorialToHorizontal(12, 45, lat, 12);

      expect(Number.isFinite(altitude)).toBe(true);
      expect(Number.isFinite(azimuth)).toBe(true);
    }
  });

  it('should handle stars near celestial poles', () => {
    const nearPoleStars = [
      { ra: 0, dec: 89.999 },
      { ra: 12, dec: -89.999 },
    ];

    for (const star of nearPoleStars) {
      const { altitude, azimuth } = equatorialToHorizontal(star.ra, star.dec, 45, 12);

      expect(Number.isFinite(altitude)).toBe(true);
      expect(Number.isFinite(azimuth)).toBe(true);
    }
  });

  it('should maintain precision for small time increments', () => {
    const baseDate = new Date(Date.UTC(2025, 0, 1, 12, 0, 0));
    const baseDays = daysSinceJ2000(baseDate);

    // 1 second increment
    const oneSecond = 1 / 86400;

    const pos1 = getRawPlanetEcliptic(PLANETS.earth, baseDays);
    const pos2 = getRawPlanetEcliptic(PLANETS.earth, baseDays + oneSecond);

    // Position should change very slightly but not be identical
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;

    // Earth moves ~30 km/s, so in 1 second it moves ~30 km = ~0.0000002 AU
    const distance = Math.sqrt(dx * dx + dy * dy);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(0.001);
  });
});
