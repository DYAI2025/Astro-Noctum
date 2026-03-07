/**
 * Time Conversion and Solar Terms Helper Functions
 *
 * Implements time conversion utilities and 24 Chinese Solar Terms (节气) calculations
 * for the QuizzMe Horoscope System.
 *
 * Based on:
 * - "Astronomical Algorithms" by Jean Meeus
 * - SOFA (Standards of Fundamental Astronomy) library
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Julian Date of Unix epoch (1970-01-01T00:00:00Z) */
const JD_UNIX_EPOCH = 2440587.5;

/** Julian Date of J2000.0 epoch (2000-01-01T12:00:00Z) */
const JD_J2000 = 2451545.0;

/** Days in a Julian century */
const JULIAN_CENTURY = 36525.0;

/** Milliseconds per day */
const MS_PER_DAY = 86400000;

/** Degrees to radians */
const DEG_TO_RAD = Math.PI / 180;

/** Radians to degrees */
const RAD_TO_DEG = 180 / Math.PI;

/** Sun's average motion in degrees per day */
const SUN_MOTION_PER_DAY = 0.98565;

/** Convergence tolerance for iterative algorithms (degrees) */
const CONVERGENCE_TOLERANCE = 0.0001;

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR TERMS DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The 24 Solar Terms (节气) with their ecliptic longitudes
 * Ordered by longitude starting from Li Chun (315°)
 */
export const SOLAR_TERMS = [
  { longitude: 315, pinyin: "Li Chun", chinese: "立春", english: "Spring Begins" },
  { longitude: 330, pinyin: "Yu Shui", chinese: "雨水", english: "Rain Water" },
  { longitude: 345, pinyin: "Jing Zhe", chinese: "驚蟄", english: "Awakening of Insects" },
  { longitude: 0, pinyin: "Chun Fen", chinese: "春分", english: "Spring Equinox" },
  { longitude: 15, pinyin: "Qing Ming", chinese: "清明", english: "Pure Brightness" },
  { longitude: 30, pinyin: "Gu Yu", chinese: "穀雨", english: "Grain Rain" },
  { longitude: 45, pinyin: "Li Xia", chinese: "立夏", english: "Summer Begins" },
  { longitude: 60, pinyin: "Xiao Man", chinese: "小滿", english: "Grain Buds" },
  { longitude: 75, pinyin: "Mang Zhong", chinese: "芒種", english: "Grain in Ear" },
  { longitude: 90, pinyin: "Xia Zhi", chinese: "夏至", english: "Summer Solstice" },
  { longitude: 105, pinyin: "Xiao Shu", chinese: "小暑", english: "Minor Heat" },
  { longitude: 120, pinyin: "Da Shu", chinese: "大暑", english: "Major Heat" },
  { longitude: 135, pinyin: "Li Qiu", chinese: "立秋", english: "Autumn Begins" },
  { longitude: 150, pinyin: "Chu Shu", chinese: "處暑", english: "End of Heat" },
  { longitude: 165, pinyin: "Bai Lu", chinese: "白露", english: "White Dew" },
  { longitude: 180, pinyin: "Qiu Fen", chinese: "秋分", english: "Autumn Equinox" },
  { longitude: 195, pinyin: "Han Lu", chinese: "寒露", english: "Cold Dew" },
  { longitude: 210, pinyin: "Shuang Jiang", chinese: "霜降", english: "Frost Descent" },
  { longitude: 225, pinyin: "Li Dong", chinese: "立冬", english: "Winter Begins" },
  { longitude: 240, pinyin: "Xiao Xue", chinese: "小雪", english: "Minor Snow" },
  { longitude: 255, pinyin: "Da Xue", chinese: "大雪", english: "Major Snow" },
  { longitude: 270, pinyin: "Dong Zhi", chinese: "冬至", english: "Winter Solstice" },
  { longitude: 285, pinyin: "Xiao Han", chinese: "小寒", english: "Minor Cold" },
  { longitude: 300, pinyin: "Da Han", chinese: "大寒", english: "Major Cold" },
] as const;

/** Initial date guesses for solar term calculations [month, day] */
const SOLAR_TERM_INITIAL_DATES: Record<number, [number, number]> = {
  0: [3, 21],    // Spring Equinox
  15: [4, 5],    // Qing Ming
  30: [4, 20],   // Gu Yu
  45: [5, 6],    // Li Xia
  60: [5, 21],   // Xiao Man
  75: [6, 6],    // Mang Zhong
  90: [6, 21],   // Summer Solstice
  105: [7, 7],   // Xiao Shu
  120: [7, 23],  // Da Shu
  135: [8, 8],   // Li Qiu
  150: [8, 23],  // Chu Shu
  165: [9, 8],   // Bai Lu
  180: [9, 23],  // Autumn Equinox
  195: [10, 8],  // Han Lu
  210: [10, 24], // Shuang Jiang
  225: [11, 8],  // Li Dong
  240: [11, 22], // Xiao Xue
  255: [12, 7],  // Da Xue
  270: [12, 22], // Winter Solstice
  285: [1, 6],   // Xiao Han
  300: [1, 20],  // Da Han
  315: [2, 4],   // Li Chun
  330: [2, 19],  // Yu Shui
  345: [3, 6],   // Jing Zhe
};

export type SolarTerm = typeof SOLAR_TERMS[number];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface GregorianDateComponents {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface SolarTermInfo {
  term: SolarTerm;
  index: number;
  startDate: Date;
  endDate?: Date;
}

export interface SolarTermDates {
  term: SolarTerm;
  date: Date;
  julianDate: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// JULIAN DATE CONVERSIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert Unix timestamp (milliseconds) to Julian Date
 */
export function unixToJulianDate(unixMs: number): number {
  return JD_UNIX_EPOCH + unixMs / MS_PER_DAY;
}

/**
 * Convert Julian Date to Unix timestamp (milliseconds)
 */
export function julianDateToUnix(jd: number): number {
  return (jd - JD_UNIX_EPOCH) * MS_PER_DAY;
}

/**
 * Convert Julian Date to JavaScript Date object
 */
export function julianDateToDate(jd: number): Date {
  return new Date(julianDateToUnix(jd));
}

/**
 * Convert JavaScript Date to Julian Date
 */
export function dateToJulianDate(date: Date): number {
  return unixToJulianDate(date.getTime());
}

/**
 * Convert Julian Date to Gregorian date components
 * Inverse of getJulianDate from astronomy.ts
 */
export function julianDateToGregorian(jd: number): GregorianDateComponents {
  // Algorithm from Meeus "Astronomical Algorithms" Chapter 7
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;

  let A: number;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const dayWithFraction = B - D - Math.floor(30.6001 * E) + F;
  const day = Math.floor(dayWithFraction);

  let month: number;
  if (E < 14) {
    month = E - 1;
  } else {
    month = E - 13;
  }

  let year: number;
  if (month > 2) {
    year = C - 4716;
  } else {
    year = C - 4715;
  }

  // Extract time from fractional day
  const fractionalDay = dayWithFraction - day;
  const totalSeconds = fractionalDay * 86400;
  const hour = Math.floor(totalSeconds / 3600);
  const minute = Math.floor((totalSeconds % 3600) / 60);
  const second = Math.floor(totalSeconds % 60);
  const millisecond = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  return { year, month, day, hour, minute, second, millisecond };
}

/**
 * Convert Gregorian components to Julian Date
 */
export function gregorianToJulianDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): number {
  // Adjust for January/February
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  // Decimal day
  const dayDec = day + (hour + minute / 60 + second / 3600) / 24;

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + dayDec + B - 1524.5;
}

/**
 * Get Modified Julian Date (MJD = JD - 2400000.5)
 */
export function getModifiedJulianDate(jd: number): number {
  return jd - 2400000.5;
}

/**
 * Get Julian Day Number (integer part)
 */
export function getJulianDayNumber(jd: number): number {
  return Math.floor(jd + 0.5);
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR LONGITUDE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate Sun's ecliptic longitude for a given Julian Date
 * Uses the full Equation of Center for high accuracy
 *
 * @param jd - Julian Date
 * @returns Solar longitude in degrees (0-360)
 */
export function calculateSolarLongitude(jd: number): number {
  // Julian centuries from J2000.0
  const T = (jd - JD_J2000) / JULIAN_CENTURY;

  // Mean longitude of the Sun (Meeus, Table 47.a)
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;

  // Mean anomaly of the Sun (Meeus, Table 47.a)
  let g = 357.52911 + 35999.05029 * T - 0.0001536 * T * T;

  // Convert to radians for trig functions
  const gRad = g * DEG_TO_RAD;

  // Equation of Center (Meeus, Chapter 25)
  const C1 = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(gRad);
  const C2 = (0.019993 - 0.000101 * T) * Math.sin(2 * gRad);
  const C3 = 0.000289 * Math.sin(3 * gRad);
  const C = C1 + C2 + C3;

  // True longitude
  let longitude = L0 + C;

  // Normalize to 0-360
  longitude = longitude % 360;
  if (longitude < 0) longitude += 360;

  return longitude;
}

/**
 * Find the Julian Date when the Sun reaches a specific longitude
 * Uses Newton-Raphson iteration for fast convergence
 *
 * @param targetLongitude - Target solar longitude in degrees
 * @param year - Year to search in
 * @returns Julian Date when sun reaches the target longitude
 */
export function findSolarLongitudeJD(targetLongitude: number, year: number): number {
  // Get initial guess from lookup table
  const normalizedLon = ((targetLongitude % 360) + 360) % 360;
  const initialDate = SOLAR_TERM_INITIAL_DATES[normalizedLon] || [3, 21];

  // Adjust year for terms that occur in next calendar year
  let searchYear = year;
  if (normalizedLon >= 285 && normalizedLon < 315) {
    // Xiao Han and Da Han occur in January (next year if starting from spring)
    searchYear = year;
  }

  let jd = gregorianToJulianDate(searchYear, initialDate[0], initialDate[1], 12);

  // Newton-Raphson iteration
  for (let i = 0; i < 50; i++) {
    const currentLon = calculateSolarLongitude(jd);

    // Calculate difference, handling wrap-around at 0/360
    let diff = targetLongitude - currentLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) < CONVERGENCE_TOLERANCE) {
      break;
    }

    // Adjust JD based on sun's motion
    jd += diff / SUN_MOTION_PER_DAY;
  }

  return jd;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR TERMS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the current solar term for a given date
 *
 * @param date - Date to check
 * @returns SolarTermInfo with current term and dates
 */
export function getCurrentSolarTerm(date: Date): SolarTermInfo {
  const jd = dateToJulianDate(date);
  const longitude = calculateSolarLongitude(jd);

  // Find which term the sun is currently in
  // Solar terms start at specific longitudes and span 15°

  // Normalize longitude to start from Li Chun (315°)
  let normalizedLon = longitude - 315;
  if (normalizedLon < 0) normalizedLon += 360;

  // Find segment (0-23)
  const segment = Math.floor(normalizedLon / 15);
  const termIndex = segment % 24;

  const term = SOLAR_TERMS[termIndex];
  const year = date.getFullYear();

  // Get start date of current term
  const startJD = findSolarLongitudeJD(term.longitude, year);
  const startDate = julianDateToDate(startJD);

  // Get end date (start of next term)
  const nextTermIndex = (termIndex + 1) % 24;
  const nextTerm = SOLAR_TERMS[nextTermIndex];
  const nextYear = nextTerm.longitude < term.longitude ? year + 1 : year;
  const endJD = findSolarLongitudeJD(nextTerm.longitude, nextYear);
  const endDate = julianDateToDate(endJD);

  return {
    term,
    index: termIndex,
    startDate,
    endDate,
  };
}

/**
 * Get the date of a specific solar term in a given year
 *
 * @param termIndex - Index of the solar term (0-23)
 * @param year - Year to calculate for
 * @returns SolarTermDates with date and Julian Date
 */
export function getSolarTermDate(termIndex: number, year: number): SolarTermDates {
  const term = SOLAR_TERMS[termIndex % 24];
  const jd = findSolarLongitudeJD(term.longitude, year);

  return {
    term,
    date: julianDateToDate(jd),
    julianDate: jd,
  };
}

/**
 * Get all 24 solar terms for a given year
 *
 * @param year - Year to calculate for
 * @returns Array of SolarTermDates for all 24 terms
 */
export function getAllSolarTerms(year: number): SolarTermDates[] {
  return SOLAR_TERMS.map((term, index) => {
    // Handle terms that fall in the next calendar year
    let searchYear = year;
    if (term.longitude >= 285 && term.longitude <= 300) {
      // Xiao Han (285°) and Da Han (300°) occur in January
      // If we're calculating for year Y, these fall in Y+1
      searchYear = year + 1;
    }

    const jd = findSolarLongitudeJD(term.longitude, searchYear);
    return {
      term,
      date: julianDateToDate(jd),
      julianDate: jd,
    };
  });
}

/**
 * Find the solar term that contains a specific date
 *
 * @param date - Date to find term for
 * @returns SolarTerm object
 */
export function getSolarTermForDate(date: Date): SolarTerm {
  const info = getCurrentSolarTerm(date);
  return info.term;
}

/**
 * Check if a date is on a specific solar term (within ±12 hours)
 *
 * @param date - Date to check
 * @param termIndex - Index of the solar term (0-23)
 * @returns true if the date falls on the solar term
 */
export function isOnSolarTerm(date: Date, termIndex: number): boolean {
  const year = date.getFullYear();
  const termData = getSolarTermDate(termIndex, year);

  // Check if within ±12 hours (0.5 days)
  const diff = Math.abs(date.getTime() - termData.date.getTime());
  return diff < 12 * 60 * 60 * 1000; // 12 hours in milliseconds
}

/**
 * Get the next solar term after a given date
 *
 * @param date - Reference date
 * @returns SolarTermDates for the next term
 */
export function getNextSolarTerm(date: Date): SolarTermDates {
  const current = getCurrentSolarTerm(date);
  const nextIndex = (current.index + 1) % 24;
  const nextTerm = SOLAR_TERMS[nextIndex];

  // Determine year for next term
  let year = date.getFullYear();
  if (nextTerm.longitude < SOLAR_TERMS[current.index].longitude) {
    // Next term is in the following year (wrapping around from Da Han to Li Chun)
    year += 1;
  }

  return getSolarTermDate(nextIndex, year);
}

/**
 * Get the previous solar term before a given date
 *
 * @param date - Reference date
 * @returns SolarTermDates for the previous term
 */
export function getPreviousSolarTerm(date: Date): SolarTermDates {
  const current = getCurrentSolarTerm(date);
  const prevIndex = (current.index - 1 + 24) % 24;
  const prevTerm = SOLAR_TERMS[prevIndex];

  // Determine year for previous term
  let year = date.getFullYear();
  if (prevTerm.longitude > SOLAR_TERMS[current.index].longitude) {
    // Previous term was in the previous year
    year -= 1;
  }

  return getSolarTermDate(prevIndex, year);
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMEZONE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get UTC offset in hours for a given timezone and date
 *
 * @param date - Date to check (for DST handling)
 * @param timeZone - IANA timezone identifier
 * @returns Offset in hours (negative for west, positive for east)
 */
export function getTimezoneOffset(date: Date, timeZone: string): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / (60 * 60 * 1000);
}

/**
 * Convert local time to UTC
 *
 * @param localDate - Date in local timezone
 * @param timeZone - IANA timezone identifier
 * @returns Date in UTC
 */
export function localToUTC(localDate: Date, timeZone: string): Date {
  // Create a date string in the local timezone format
  const dateStr = localDate.toLocaleString('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Parse and convert to UTC
  const offset = getTimezoneOffset(localDate, timeZone);
  return new Date(localDate.getTime() - offset * 60 * 60 * 1000);
}

/**
 * Convert UTC to local time
 *
 * @param utcDate - Date in UTC
 * @param timeZone - IANA timezone identifier
 * @returns Date in local timezone
 */
export function utcToLocal(utcDate: Date, timeZone: string): Date {
  const offset = getTimezoneOffset(utcDate, timeZone);
  return new Date(utcDate.getTime() + offset * 60 * 60 * 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// EQUATION OF TIME
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the Equation of Time
 * Represents the difference between apparent and mean solar time
 *
 * @param jd - Julian Date
 * @returns Equation of Time in minutes (can be negative)
 */
export function calculateEquationOfTime(jd: number): number {
  const T = (jd - JD_J2000) / JULIAN_CENTURY;

  // Mean longitude of the Sun
  const L0 = (280.46646 + 36000.76983 * T) * DEG_TO_RAD;

  // Mean anomaly of the Sun
  const M = (357.52911 + 35999.05029 * T) * DEG_TO_RAD;

  // Eccentricity of Earth's orbit
  const e = 0.016708634 - 0.000042037 * T;

  // Obliquity of the ecliptic
  const epsilon = (23.439291 - 0.0130042 * T) * DEG_TO_RAD;

  const y = Math.tan(epsilon / 2) ** 2;

  // Equation of Time formula
  const EoT = y * Math.sin(2 * L0)
            - 2 * e * Math.sin(M)
            + 4 * e * y * Math.sin(M) * Math.cos(2 * L0)
            - 0.5 * y * y * Math.sin(4 * L0)
            - 1.25 * e * e * Math.sin(2 * M);

  // Convert radians to minutes (4 minutes per degree)
  return EoT * RAD_TO_DEG * 4;
}

/**
 * Calculate Local Mean Time from UTC
 *
 * @param utcDate - Date in UTC
 * @param longitude - Geographic longitude in degrees (positive East)
 * @returns Local Mean Time as Date
 */
export function calculateLocalMeanTime(utcDate: Date, longitude: number): Date {
  // LMT = UTC + longitude/15 hours
  const lmtOffset = longitude / 15; // hours
  return new Date(utcDate.getTime() + lmtOffset * 60 * 60 * 1000);
}

/**
 * Calculate Local Apparent (True Solar) Time
 *
 * @param utcDate - Date in UTC
 * @param longitude - Geographic longitude in degrees (positive East)
 * @returns Local Apparent Time as Date
 */
export function calculateLocalApparentTime(utcDate: Date, longitude: number): Date {
  const jd = dateToJulianDate(utcDate);
  const eot = calculateEquationOfTime(jd); // in minutes

  // LAT = LMT + Equation of Time
  const lmt = calculateLocalMeanTime(utcDate, longitude);
  return new Date(lmt.getTime() + eot * 60 * 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format Julian Date as ISO 8601 string
 */
export function jdToISO8601(jd: number): string {
  const date = julianDateToDate(jd);
  return date.toISOString();
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get the day of year (1-366)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / MS_PER_DAY);
}

/**
 * Calculate time difference in various units
 */
export function calculateTimeDifference(date1: Date, date2: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
} {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return {
    milliseconds: diffMs,
    seconds: diffMs / 1000,
    minutes: diffMs / (1000 * 60),
    hours: diffMs / (1000 * 60 * 60),
    days: diffMs / MS_PER_DAY,
  };
}

/**
 * Validate a Julian Date is within reasonable bounds
 */
export function isValidJulianDate(jd: number): boolean {
  // Reasonable bounds: approximately -5000 to +5000 years from J2000.0
  const minJD = JD_J2000 - 5000 * 365.25;
  const maxJD = JD_J2000 + 5000 * 365.25;
  return jd >= minJD && jd <= maxJD && !isNaN(jd) && isFinite(jd);
}

/**
 * Calculate age in years from birthdate
 */
export function calculateAge(birthdate: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - birthdate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthdate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthdate.getDate())) {
    age--;
  }

  return age;
}
