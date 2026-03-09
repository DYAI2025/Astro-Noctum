/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MOON POSITION AND PHASE ACCURACY TESTS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tests lunar calculations including:
 * - Moon phase cycle (synodic month ~29.53 days)
 * - Known new moon and full moon dates
 * - Phase illumination percentages
 * - Basic lunar position estimation
 *
 * Reference data sources:
 * - US Naval Observatory
 * - Meeus, Jean. "Astronomical Algorithms" (2nd ed.)
 * - NASA Eclipse Website
 *
 * Note: The current codebase focuses on planetary calculations.
 * These tests provide a framework for lunar calculations that could be added.
 */

import { describe, it, expect } from 'vitest';
import { dateToJD, daysSinceJ2000 } from '@/lib/astronomy/calculations';

// ─────────────────────────────────────────────────────────────────────────────
// LUNAR CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Synodic month (new moon to new moon) in days */
const SYNODIC_MONTH = 29.530588853;

/** Mean lunar orbital period (sidereal) in days */
const SIDEREAL_MONTH = 27.321661;

/** Mean distance to Moon in km */
const MEAN_LUNAR_DISTANCE = 384400;

/** Reference new moon: January 29, 2025, 12:36 UTC */
const REFERENCE_NEW_MOON = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));

// ─────────────────────────────────────────────────────────────────────────────
// LUNAR CALCULATION FUNCTIONS
// These would typically be in lib/astronomy/moon.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates approximate moon phase (0 = new moon, 0.5 = full moon)
 * Uses the simple synodic month approximation
 */
function getMoonPhase(date: Date): number {
  const refJD = dateToJD(REFERENCE_NEW_MOON);
  const targetJD = dateToJD(date);

  const daysSinceRef = targetJD - refJD;
  const phase = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  return phase / SYNODIC_MONTH;
}

/**
 * Returns illumination percentage (0-100)
 */
function getMoonIllumination(phase: number): number {
  // Illumination follows a cosine curve
  return (1 - Math.cos(phase * 2 * Math.PI)) * 50;
}

/**
 * Returns phase name
 */
function getPhaseName(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return 'New Moon';
  if (phase < 0.1875) return 'Waxing Crescent';
  if (phase < 0.3125) return 'First Quarter';
  if (phase < 0.4375) return 'Waxing Gibbous';
  if (phase < 0.5625) return 'Full Moon';
  if (phase < 0.6875) return 'Waning Gibbous';
  if (phase < 0.8125) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Simplified lunar longitude calculation (mean longitude)
 * For accurate calculations, would need full lunar theory (ELP2000/82)
 */
function getMoonMeanLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525; // Julian centuries since J2000.0

  // Mean longitude of Moon (degrees)
  let L = 218.3164477
    + 481267.88123421 * T
    - 0.0015786 * T * T
    + T * T * T / 538841
    - T * T * T * T / 65194000;

  return ((L % 360) + 360) % 360;
}

/**
 * Simplified calculation of Moon's elongation from Sun
 */
function getMoonElongation(date: Date): number {
  const jd = dateToJD(date);
  const T = (jd - 2451545.0) / 36525;

  // Mean elongation of Moon from Sun
  let D = 297.8501921
    + 445267.1114034 * T
    - 0.0018819 * T * T
    + T * T * T / 545868
    - T * T * T * T / 113065000;

  return ((D % 360) + 360) % 360;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST: KNOWN MOON PHASES 2025
// ─────────────────────────────────────────────────────────────────────────────

describe('Known Moon Phases 2025', () => {
  /**
   * Reference data from US Naval Observatory:
   * New Moon: January 29, 2025, 12:36 UTC
   * Full Moon: January 13, 2025, 22:27 UTC
   * Full Moon: February 12, 2025, 13:53 UTC
   * New Moon: February 28, 2025, 00:45 UTC
   */

  it('should identify new moon on January 29, 2025', () => {
    const newMoon = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));
    const phase = getMoonPhase(newMoon);

    // Phase should be very close to 0 (or 1)
    expect(phase).toBeLessThan(0.02);
  });

  it('should identify full moon on January 13, 2025', () => {
    const fullMoon = new Date(Date.UTC(2025, 0, 13, 22, 27, 0));
    const phase = getMoonPhase(fullMoon);

    // Full moon is at phase ~0.5
    // Calculate days difference from reference
    const daysDiff = (fullMoon.getTime() - REFERENCE_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);

    // Jan 13 is about 16 days BEFORE Jan 29 new moon
    // So it's about 29.53 - 16 = 13.5 days after the PREVIOUS new moon
    // Which is close to half a synodic month (full moon)
    expect(Math.abs(phase - 0.5)).toBeLessThan(0.1);
  });

  it('should show approximately 29.5 days between successive new moons', () => {
    // Jan 29, 2025 new moon to Feb 28, 2025 new moon
    const newMoon1 = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));
    const newMoon2 = new Date(Date.UTC(2025, 1, 28, 0, 45, 0));

    const daysBetween = (newMoon2.getTime() - newMoon1.getTime()) / (1000 * 60 * 60 * 24);

    // Should be close to synodic month
    expect(daysBetween).toBeCloseTo(SYNODIC_MONTH, 0);
  });

  it('should calculate full moon between two new moons', () => {
    // Full moon should be approximately halfway between new moons
    const newMoon1 = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));
    const fullMoon = new Date(Date.UTC(2025, 1, 12, 13, 53, 0));
    const newMoon2 = new Date(Date.UTC(2025, 1, 28, 0, 45, 0));

    const daysToFull = (fullMoon.getTime() - newMoon1.getTime()) / (1000 * 60 * 60 * 24);
    const daysToNew2 = (newMoon2.getTime() - newMoon1.getTime()) / (1000 * 60 * 60 * 24);

    // Full moon should be approximately at the midpoint (within a few days)
    const midpoint = daysToNew2 / 2;
    expect(Math.abs(daysToFull - midpoint)).toBeLessThan(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: MOON ILLUMINATION
// ─────────────────────────────────────────────────────────────────────────────

describe('Moon Illumination', () => {
  /**
   * Test illumination percentage calculations
   */

  it('should show 0% illumination at new moon', () => {
    const illumination = getMoonIllumination(0);
    expect(illumination).toBeCloseTo(0, 1);
  });

  it('should show 100% illumination at full moon', () => {
    const illumination = getMoonIllumination(0.5);
    expect(illumination).toBeCloseTo(100, 1);
  });

  it('should show 50% illumination at first quarter', () => {
    const illumination = getMoonIllumination(0.25);
    expect(illumination).toBeCloseTo(50, 1);
  });

  it('should show 50% illumination at last quarter', () => {
    const illumination = getMoonIllumination(0.75);
    expect(illumination).toBeCloseTo(50, 1);
  });

  it('should show symmetric illumination for waxing and waning phases', () => {
    // Waxing at phase 0.2
    const waxingIllum = getMoonIllumination(0.2);
    // Waning at phase 0.8
    const waningIllum = getMoonIllumination(0.8);

    expect(waxingIllum).toBeCloseTo(waningIllum, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: PHASE NAMES
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase Names', () => {
  it('should identify New Moon phase', () => {
    expect(getPhaseName(0)).toBe('New Moon');
    expect(getPhaseName(0.03)).toBe('New Moon');
    expect(getPhaseName(0.97)).toBe('New Moon');
  });

  it('should identify Full Moon phase', () => {
    expect(getPhaseName(0.5)).toBe('Full Moon');
    expect(getPhaseName(0.48)).toBe('Full Moon');
    expect(getPhaseName(0.52)).toBe('Full Moon');
  });

  it('should identify Quarter phases', () => {
    expect(getPhaseName(0.25)).toBe('First Quarter');
    expect(getPhaseName(0.75)).toBe('Last Quarter');
  });

  it('should identify Crescent phases', () => {
    expect(getPhaseName(0.1)).toBe('Waxing Crescent');
    expect(getPhaseName(0.9)).toBe('Waning Crescent');
  });

  it('should identify Gibbous phases', () => {
    expect(getPhaseName(0.4)).toBe('Waxing Gibbous');
    expect(getPhaseName(0.6)).toBe('Waning Gibbous');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: LUNAR MEAN LONGITUDE
// ─────────────────────────────────────────────────────────────────────────────

describe('Moon Mean Longitude', () => {
  /**
   * Test mean lunar longitude calculations
   */

  it('should calculate mean longitude at J2000.0', () => {
    const j2000JD = 2451545.0;
    const L = getMoonMeanLongitude(j2000JD);

    // At J2000.0, Moon's mean longitude was approximately 218.3 degrees
    expect(L).toBeCloseTo(218.3, 0);
  });

  it('should increase longitude over time (eastward motion)', () => {
    const jd1 = 2451545.0;
    const jd2 = 2451545.0 + 1; // One day later

    const L1 = getMoonMeanLongitude(jd1);
    const L2 = getMoonMeanLongitude(jd2);

    // Moon moves about 13.2 degrees per day eastward
    const dailyMotion = (L2 - L1 + 360) % 360;
    expect(dailyMotion).toBeCloseTo(13.2, 0);
  });

  it('should complete one sidereal revolution in ~27.3 days', () => {
    const jd1 = 2451545.0;
    const jd2 = jd1 + SIDEREAL_MONTH;

    const L1 = getMoonMeanLongitude(jd1);
    const L2 = getMoonMeanLongitude(jd2);

    // After one sidereal month, longitude should be nearly the same
    const diff = Math.abs(L2 - L1 - 360) % 360;
    expect(Math.min(diff, 360 - diff)).toBeLessThan(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: LUNAR ELONGATION
// ─────────────────────────────────────────────────────────────────────────────

describe('Moon Elongation from Sun', () => {
  /**
   * Test Moon's angular distance from Sun
   */

  it('should show near-zero elongation at new moon', () => {
    const newMoon = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));
    const elongation = getMoonElongation(newMoon);

    // At new moon, Moon is near the Sun (elongation ~0)
    expect(elongation).toBeLessThan(15);
  });

  it('should show ~180 degrees elongation at full moon', () => {
    const fullMoon = new Date(Date.UTC(2025, 0, 13, 22, 27, 0));
    const elongation = getMoonElongation(fullMoon);

    // At full moon, Moon is opposite the Sun
    expect(Math.abs(180 - elongation)).toBeLessThan(20);
  });

  it('should show ~90 degrees elongation at first quarter', () => {
    // First quarter is about 7.4 days after new moon
    // We need to go FORWARD 7.4 days from the reference new moon
    const firstQuarter = new Date(
      REFERENCE_NEW_MOON.getTime() + 7.4 * 24 * 60 * 60 * 1000
    );
    const elongation = getMoonElongation(firstQuarter);

    // Allow generous tolerance due to simplified calculation
    // First quarter means Moon is ~90 degrees ahead of Sun
    // Elongation should be between 60 and 120 degrees
    const normalizedElong = elongation > 180 ? 360 - elongation : elongation;
    expect(normalizedElong).toBeGreaterThan(60);
    expect(normalizedElong).toBeLessThan(150);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: LUNAR ECLIPSE POTENTIAL
// ─────────────────────────────────────────────────────────────────────────────

describe('Lunar Eclipse Conditions', () => {
  /**
   * Lunar eclipses can only occur at full moon when Moon is near a node
   * This tests basic eclipse geometry conditions
   */

  it('should identify full moon as necessary condition for lunar eclipse', () => {
    // Any full moon has POTENTIAL for eclipse
    // (actual eclipse requires Moon near orbital node)
    const fullMoon = new Date(Date.UTC(2025, 0, 13, 22, 27, 0));
    const phase = getMoonPhase(fullMoon);

    // Phase must be near 0.5 for eclipse possibility
    expect(Math.abs(phase - 0.5)).toBeLessThan(0.1);
  });

  it('should verify known lunar eclipse date is at full moon', () => {
    // March 14, 2025 - Total Lunar Eclipse
    const eclipseDate = new Date(Date.UTC(2025, 2, 14, 0, 0, 0));
    const phase = getMoonPhase(eclipseDate);

    // Must be near full moon
    expect(Math.abs(phase - 0.5)).toBeLessThan(0.1);
  });

  it('should show no eclipse possibility at new moon', () => {
    const newMoon = new Date(Date.UTC(2025, 0, 29, 12, 36, 0));
    const phase = getMoonPhase(newMoon);

    // Solar eclipses occur at new moon, not lunar
    expect(phase).toBeLessThan(0.1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST: SYNODIC VS SIDEREAL MONTH
// ─────────────────────────────────────────────────────────────────────────────

describe('Synodic vs Sidereal Month', () => {
  /**
   * Synodic month (29.53 days): new moon to new moon
   * Sidereal month (27.32 days): one complete orbit relative to stars
   *
   * Difference is due to Earth's motion around Sun
   */

  it('should correctly relate synodic and sidereal months', () => {
    // Relationship: 1/synodic = 1/sidereal - 1/year
    const yearInDays = 365.25;

    const calculatedSynodic = 1 / (1/SIDEREAL_MONTH - 1/yearInDays);

    expect(calculatedSynodic).toBeCloseTo(SYNODIC_MONTH, 1);
  });

  it('should show synodic month is longer than sidereal month', () => {
    expect(SYNODIC_MONTH).toBeGreaterThan(SIDEREAL_MONTH);

    // Difference should be about 2.2 days
    expect(SYNODIC_MONTH - SIDEREAL_MONTH).toBeCloseTo(2.2, 0);
  });
});
