import { describe, it, expect } from 'vitest';
import { daysSinceJ2000 } from '../lib/astronomy/calculations';

/**
 * Reproduces BUG-15: Planetarium stars used stale `currentDate` (React state)
 * instead of `simTimeRef.current` (mutated every frame).
 *
 * The fix replaces `dateToJD(currentDate)` with `2451545.0 + simTimeRef.current`
 * inside the animation loop. This test validates the JD calculation is equivalent.
 */
describe('BUG-15: Planetarium JD calculation from simTime vs Date', () => {
  it('simTime-based JD matches Date-based JD for birth date', () => {
    const birthDate = new Date('1990-06-15T14:30:00Z');
    const simTime = daysSinceJ2000(birthDate);

    // Our fix: JD = J2000_EPOCH + simTime
    const jdFromSimTime = 2451545.0 + simTime;

    // Original: JD from dateToJD(date)
    // dateToJD computes JD from UTC year/month/day/hour/min/sec
    // We verify they produce the same result
    const y = birthDate.getUTCFullYear();
    const m = birthDate.getUTCMonth() + 1;
    const d = birthDate.getUTCDate() +
      birthDate.getUTCHours() / 24 +
      birthDate.getUTCMinutes() / 1440 +
      birthDate.getUTCSeconds() / 86400;
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    const jdFromDate = d +
      Math.floor((153 * mm + 2) / 5) +
      365 * yy +
      Math.floor(yy / 4) -
      Math.floor(yy / 100) +
      Math.floor(yy / 400) - 32045;

    // Should match within floating-point precision (< 1 second = 1/86400 day)
    expect(Math.abs(jdFromSimTime - jdFromDate)).toBeLessThan(1 / 86400);
  });

  it('simTime-based JD matches for "now" (current sky scenario)', () => {
    const now = new Date();
    const simTime = daysSinceJ2000(now);
    const jdFromSimTime = 2451545.0 + simTime;

    // Quick sanity: JD for 2026 should be ~2461000+
    expect(jdFromSimTime).toBeGreaterThan(2460000);
    expect(jdFromSimTime).toBeLessThan(2470000);
  });

  it('birth sky and current sky produce different JD values', () => {
    const birthDate = new Date('1990-06-15T14:30:00Z');
    const birthSimTime = daysSinceJ2000(birthDate);
    const nowSimTime = daysSinceJ2000(new Date());

    const birthJD = 2451545.0 + birthSimTime;
    const nowJD = 2451545.0 + nowSimTime;

    // ~36 years difference = ~13000 days
    expect(Math.abs(nowJD - birthJD)).toBeGreaterThan(10000);
  });
});
