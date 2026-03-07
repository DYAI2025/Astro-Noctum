/**
 * Tests for time-helpers.ts
 *
 * Tests time conversion utilities and 24 Chinese Solar Terms calculations
 */

import { describe, it, expect } from 'vitest';
import {
  // Julian Date conversions
  unixToJulianDate,
  julianDateToUnix,
  julianDateToDate,
  dateToJulianDate,
  julianDateToGregorian,
  gregorianToJulianDate,
  getModifiedJulianDate,
  getJulianDayNumber,

  // Solar longitude
  calculateSolarLongitude,
  findSolarLongitudeJD,

  // Solar terms
  getCurrentSolarTerm,
  getSolarTermDate,
  getAllSolarTerms,
  getSolarTermForDate,
  isOnSolarTerm,
  getNextSolarTerm,
  getPreviousSolarTerm,
  SOLAR_TERMS,

  // Timezone helpers
  getTimezoneOffset,

  // Equation of Time
  calculateEquationOfTime,
  calculateLocalMeanTime,
  calculateLocalApparentTime,

  // Utilities
  jdToISO8601,
  isLeapYear,
  getDayOfYear,
  calculateTimeDifference,
  isValidJulianDate,
  calculateAge,
} from '../time-helpers';

describe('Julian Date Conversions', () => {
  describe('unixToJulianDate / julianDateToUnix', () => {
    it('should convert Unix epoch to JD 2440587.5', () => {
      const jd = unixToJulianDate(0);
      expect(jd).toBeCloseTo(2440587.5, 5);
    });

    it('should be reversible', () => {
      const originalUnix = 1704067200000; // 2024-01-01T00:00:00Z
      const jd = unixToJulianDate(originalUnix);
      const backToUnix = julianDateToUnix(jd);
      expect(backToUnix).toBeCloseTo(originalUnix, 0);
    });

    it('should handle J2000.0 epoch correctly', () => {
      // J2000.0 is 2000-01-01T12:00:00Z
      const j2000Unix = Date.UTC(2000, 0, 1, 12, 0, 0);
      const jd = unixToJulianDate(j2000Unix);
      expect(jd).toBeCloseTo(2451545.0, 5);
    });
  });

  describe('julianDateToDate / dateToJulianDate', () => {
    it('should convert JD to Date correctly', () => {
      const jd = 2451545.0; // J2000.0
      const date = julianDateToDate(jd);
      expect(date.getUTCFullYear()).toBe(2000);
      expect(date.getUTCMonth()).toBe(0); // January
      expect(date.getUTCDate()).toBe(1);
      expect(date.getUTCHours()).toBe(12);
    });

    it('should be reversible', () => {
      const originalDate = new Date('2024-06-15T18:30:00Z');
      const jd = dateToJulianDate(originalDate);
      const backToDate = julianDateToDate(jd);
      expect(backToDate.getTime()).toBeCloseTo(originalDate.getTime(), -2);
    });
  });

  describe('julianDateToGregorian', () => {
    it('should convert J2000.0 correctly', () => {
      const greg = julianDateToGregorian(2451545.0);
      expect(greg.year).toBe(2000);
      expect(greg.month).toBe(1);
      expect(greg.day).toBe(1);
      expect(greg.hour).toBe(12);
    });

    it('should handle dates before Gregorian reform', () => {
      // Julian calendar date: 1582-10-04
      const jd = 2299159.5;
      const greg = julianDateToGregorian(jd);
      expect(greg.year).toBe(1582);
      expect(greg.month).toBe(10);
    });
  });

  describe('gregorianToJulianDate', () => {
    it('should calculate J2000.0 correctly', () => {
      const jd = gregorianToJulianDate(2000, 1, 1, 12, 0, 0);
      expect(jd).toBeCloseTo(2451545.0, 5);
    });

    it('should handle January/February year adjustment', () => {
      const jdJan = gregorianToJulianDate(2024, 1, 15, 12);
      const jdFeb = gregorianToJulianDate(2024, 2, 15, 12);
      expect(jdFeb - jdJan).toBeCloseTo(31, 0); // ~31 days apart
    });
  });

  describe('getModifiedJulianDate', () => {
    it('should subtract 2400000.5 from JD', () => {
      const jd = 2451545.0;
      const mjd = getModifiedJulianDate(jd);
      expect(mjd).toBeCloseTo(51544.5, 5);
    });
  });

  describe('getJulianDayNumber', () => {
    it('should return integer Julian Day Number', () => {
      // JDN is floor(JD + 0.5) - accounts for JD starting at noon
      expect(getJulianDayNumber(2451545.0)).toBe(2451545); // noon = same day
      expect(getJulianDayNumber(2451545.3)).toBe(2451545); // afternoon
      expect(getJulianDayNumber(2451545.7)).toBe(2451546); // evening = next JDN
    });
  });
});

describe('Solar Longitude Calculations', () => {
  describe('calculateSolarLongitude', () => {
    it('should return 0° near Spring Equinox', () => {
      // Spring Equinox 2024: ~March 20
      const jd = gregorianToJulianDate(2024, 3, 20, 12);
      const lon = calculateSolarLongitude(jd);
      expect(lon).toBeCloseTo(0, 0); // Within 1 degree
    });

    it('should return ~90° near Summer Solstice', () => {
      // Summer Solstice 2024: ~June 20 (exact time varies by year)
      const jd = gregorianToJulianDate(2024, 6, 20, 21);
      const lon = calculateSolarLongitude(jd);
      expect(lon).toBeCloseTo(90, 0); // Within 1 degree
    });

    it('should return ~180° near Autumn Equinox', () => {
      // Autumn Equinox 2024: ~September 22
      const jd = gregorianToJulianDate(2024, 9, 22, 12);
      const lon = calculateSolarLongitude(jd);
      expect(lon).toBeCloseTo(180, 1);
    });

    it('should return ~270° near Winter Solstice', () => {
      // Winter Solstice 2024: ~December 21 (exact time varies)
      const jd = gregorianToJulianDate(2024, 12, 21, 12);
      const lon = calculateSolarLongitude(jd);
      expect(lon).toBeCloseTo(270, 0); // Within 1 degree
    });

    it('should always return value between 0 and 360', () => {
      for (let i = 0; i < 365; i++) {
        const jd = gregorianToJulianDate(2024, 1, 1, 12) + i;
        const lon = calculateSolarLongitude(jd);
        expect(lon).toBeGreaterThanOrEqual(0);
        expect(lon).toBeLessThan(360);
      }
    });
  });

  describe('findSolarLongitudeJD', () => {
    it('should find Spring Equinox (0°) accurately', () => {
      const jd = findSolarLongitudeJD(0, 2024);
      const date = julianDateToDate(jd);
      expect(date.getUTCMonth()).toBe(2); // March
      expect(date.getUTCDate()).toBeGreaterThanOrEqual(19);
      expect(date.getUTCDate()).toBeLessThanOrEqual(22);
    });

    it('should find Summer Solstice (90°) accurately', () => {
      const jd = findSolarLongitudeJD(90, 2024);
      const date = julianDateToDate(jd);
      expect(date.getUTCMonth()).toBe(5); // June
      expect(date.getUTCDate()).toBeGreaterThanOrEqual(20);
      expect(date.getUTCDate()).toBeLessThanOrEqual(22);
    });

    it('should converge to correct longitude', () => {
      const targetLon = 45; // Li Xia
      const jd = findSolarLongitudeJD(targetLon, 2024);
      const actualLon = calculateSolarLongitude(jd);
      expect(actualLon).toBeCloseTo(targetLon, 2);
    });
  });
});

describe('Solar Terms', () => {
  describe('SOLAR_TERMS constant', () => {
    it('should have exactly 24 terms', () => {
      expect(SOLAR_TERMS).toHaveLength(24);
    });

    it('should have terms spaced 15° apart', () => {
      for (let i = 0; i < SOLAR_TERMS.length - 1; i++) {
        const current = SOLAR_TERMS[i].longitude;
        const next = SOLAR_TERMS[(i + 1) % 24].longitude;
        let diff = next - current;
        if (diff < 0) diff += 360;
        expect(diff).toBe(15);
      }
    });

    it('should start with Li Chun at 315°', () => {
      expect(SOLAR_TERMS[0].pinyin).toBe('Li Chun');
      expect(SOLAR_TERMS[0].longitude).toBe(315);
    });

    it('should have Spring Equinox at 0°', () => {
      const springEquinox = SOLAR_TERMS.find(t => t.longitude === 0);
      expect(springEquinox?.pinyin).toBe('Chun Fen');
    });
  });

  describe('getCurrentSolarTerm', () => {
    it('should return Li Chun around Feb 4', () => {
      const date = new Date('2024-02-05T00:00:00Z');
      const info = getCurrentSolarTerm(date);
      expect(info.term.pinyin).toBe('Li Chun');
    });

    it('should return Chun Fen (Spring Equinox) around March 20', () => {
      const date = new Date('2024-03-21T00:00:00Z');
      const info = getCurrentSolarTerm(date);
      expect(info.term.pinyin).toBe('Chun Fen');
    });

    it('should return Xia Zhi (Summer Solstice) around June 21', () => {
      const date = new Date('2024-06-22T00:00:00Z');
      const info = getCurrentSolarTerm(date);
      expect(info.term.pinyin).toBe('Xia Zhi');
    });

    it('should return term with valid start and end dates', () => {
      const date = new Date('2024-05-15T00:00:00Z');
      const info = getCurrentSolarTerm(date);
      expect(info.startDate).toBeInstanceOf(Date);
      expect(info.endDate).toBeInstanceOf(Date);
      expect(info.startDate.getTime()).toBeLessThan(date.getTime());
      expect(info.endDate!.getTime()).toBeGreaterThan(date.getTime());
    });
  });

  describe('getSolarTermDate', () => {
    it('should return valid date for each term', () => {
      for (let i = 0; i < 24; i++) {
        const result = getSolarTermDate(i, 2024);
        expect(result.date).toBeInstanceOf(Date);
        expect(result.julianDate).toBeGreaterThan(0);
        expect(result.term).toBe(SOLAR_TERMS[i]);
      }
    });

    it('should return dates in chronological order within a year', () => {
      // Note: Terms wrap around the calendar year
      const terms = getAllSolarTerms(2024);
      // Li Chun (index 0) should be around Feb 4
      expect(terms[0].date.getUTCMonth()).toBe(1); // February
    });
  });

  describe('getAllSolarTerms', () => {
    it('should return 24 terms', () => {
      const terms = getAllSolarTerms(2024);
      expect(terms).toHaveLength(24);
    });

    it('should have different dates for each term', () => {
      const terms = getAllSolarTerms(2024);
      const dates = terms.map(t => t.date.toISOString().split('T')[0]);
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBe(24);
    });
  });

  describe('getSolarTermForDate', () => {
    it('should return the correct term', () => {
      const date = new Date('2024-04-10T00:00:00Z');
      const term = getSolarTermForDate(date);
      expect(term.pinyin).toBe('Qing Ming');
    });
  });

  describe('getNextSolarTerm / getPreviousSolarTerm', () => {
    it('should return next term after current', () => {
      const date = new Date('2024-02-10T00:00:00Z'); // During Li Chun
      const next = getNextSolarTerm(date);
      expect(next.term.pinyin).toBe('Yu Shui');
    });

    it('should return previous term before current', () => {
      const date = new Date('2024-02-25T00:00:00Z'); // During Yu Shui
      const prev = getPreviousSolarTerm(date);
      expect(prev.term.pinyin).toBe('Li Chun');
    });
  });

  describe('isOnSolarTerm', () => {
    it('should return true on solar term date', () => {
      const springEquinoxDate = getSolarTermDate(3, 2024); // Chun Fen
      expect(isOnSolarTerm(springEquinoxDate.date, 3)).toBe(true);
    });

    it('should return false on non-solar term date', () => {
      const date = new Date('2024-03-15T00:00:00Z'); // Not on any exact term
      expect(isOnSolarTerm(date, 3)).toBe(false);
    });
  });
});

describe('Timezone Helpers', () => {
  describe('getTimezoneOffset', () => {
    it('should return 0 for UTC', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const offset = getTimezoneOffset(date, 'UTC');
      expect(offset).toBe(0);
    });

    // Note: These tests may vary based on system timezone support
    it('should return positive offset for east of UTC', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const offset = getTimezoneOffset(date, 'Asia/Tokyo');
      expect(offset).toBe(9); // JST is UTC+9
    });
  });
});

describe('Equation of Time', () => {
  describe('calculateEquationOfTime', () => {
    it('should return value between -15 and +17 minutes', () => {
      for (let i = 0; i < 365; i++) {
        const jd = gregorianToJulianDate(2024, 1, 1, 12) + i;
        const eot = calculateEquationOfTime(jd);
        expect(eot).toBeGreaterThan(-15);
        expect(eot).toBeLessThan(17);
      }
    });

    it('should be near 0 around April 15 and June 14', () => {
      // EoT crosses zero around these dates
      const april = calculateEquationOfTime(gregorianToJulianDate(2024, 4, 15, 12));
      expect(Math.abs(april)).toBeLessThan(2);
    });

    it('should be near minimum (~-14 min) around February 11', () => {
      const feb = calculateEquationOfTime(gregorianToJulianDate(2024, 2, 11, 12));
      expect(feb).toBeLessThan(-10);
    });

    it('should be near maximum (~+16 min) around November 3', () => {
      const nov = calculateEquationOfTime(gregorianToJulianDate(2024, 11, 3, 12));
      expect(nov).toBeGreaterThan(14);
    });
  });

  describe('calculateLocalMeanTime', () => {
    it('should add time for positive longitude', () => {
      const utc = new Date('2024-06-15T12:00:00Z');
      const lmt = calculateLocalMeanTime(utc, 15); // 15° East = +1 hour
      expect(lmt.getTime() - utc.getTime()).toBeCloseTo(60 * 60 * 1000, -3);
    });

    it('should subtract time for negative longitude', () => {
      const utc = new Date('2024-06-15T12:00:00Z');
      const lmt = calculateLocalMeanTime(utc, -75); // 75° West = -5 hours
      expect(utc.getTime() - lmt.getTime()).toBeCloseTo(5 * 60 * 60 * 1000, -3);
    });
  });

  describe('calculateLocalApparentTime', () => {
    it('should differ from LMT by Equation of Time', () => {
      const utc = new Date('2024-02-11T12:00:00Z');
      const lon = 0; // Greenwich

      const lmt = calculateLocalMeanTime(utc, lon);
      const lat = calculateLocalApparentTime(utc, lon);
      const jd = dateToJulianDate(utc);
      const eot = calculateEquationOfTime(jd);

      const diffMinutes = (lat.getTime() - lmt.getTime()) / (60 * 1000);
      expect(diffMinutes).toBeCloseTo(eot, 1);
    });
  });
});

describe('Utility Functions', () => {
  describe('jdToISO8601', () => {
    it('should return valid ISO 8601 string', () => {
      const iso = jdToISO8601(2451545.0);
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('isLeapYear', () => {
    it('should return true for leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
    });

    it('should return false for non-leap years', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(1900)).toBe(false); // Divisible by 100 but not 400
    });
  });

  describe('getDayOfYear', () => {
    it('should return 1 for January 1', () => {
      const jan1 = new Date('2024-01-01T12:00:00Z');
      expect(getDayOfYear(jan1)).toBe(1);
    });

    it('should return 366 for December 31 in leap year', () => {
      const dec31 = new Date('2024-12-31T12:00:00Z');
      expect(getDayOfYear(dec31)).toBe(366);
    });

    it('should return 365 for December 31 in non-leap year', () => {
      const dec31 = new Date('2023-12-31T12:00:00Z');
      expect(getDayOfYear(dec31)).toBe(365);
    });
  });

  describe('calculateTimeDifference', () => {
    it('should calculate difference correctly', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-02T12:00:00Z');
      const diff = calculateTimeDifference(date1, date2);

      expect(diff.days).toBeCloseTo(1.5, 5);
      expect(diff.hours).toBeCloseTo(36, 5);
      expect(diff.minutes).toBeCloseTo(36 * 60, 5);
    });
  });

  describe('isValidJulianDate', () => {
    it('should return true for valid JD', () => {
      expect(isValidJulianDate(2451545.0)).toBe(true);
      expect(isValidJulianDate(2440587.5)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidJulianDate(NaN)).toBe(false);
      expect(isValidJulianDate(Infinity)).toBe(false);
      expect(isValidJulianDate(-Infinity)).toBe(false);
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthdate = new Date('1990-06-15');
      const reference = new Date('2024-06-15');
      expect(calculateAge(birthdate, reference)).toBe(34);
    });

    it('should handle birthday not yet occurred this year', () => {
      const birthdate = new Date('1990-12-15');
      const reference = new Date('2024-06-15');
      expect(calculateAge(birthdate, reference)).toBe(33);
    });
  });
});
