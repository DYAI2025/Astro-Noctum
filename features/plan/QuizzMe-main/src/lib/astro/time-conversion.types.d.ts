/**
 * Time Conversion API Types and Function Signatures
 *
 * Comprehensive API for handling time conversions in astrological calculations.
 * Extends the existing getJulianDate, getGMST, and getLST functions with:
 * - Timezone handling
 * - Julian Date inverse conversion
 * - Solar time calculations
 * - Chinese calendar utilities
 * - Epoch conversions
 *
 * Based on "Astronomical Algorithms" (Meeus) and SOFA library standards.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TIMEZONE CONVERSION TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Timezone offset information
 * Represents both standard and daylight saving time
 */
export interface TimezoneInfo {
  /** IANA timezone identifier (e.g., "America/New_York") */
  ianaIdentifier: string;
  /** Standard time offset from UTC in hours (e.g., -5 for EST) */
  standardOffsetHours: number;
  /** Daylight saving offset from UTC in hours (e.g., -4 for EDT) */
  daylightOffsetHours?: number;
  /** Whether daylight saving time is currently active */
  isDaylightSavingActive: boolean;
  /** Abbreviation (e.g., "EST", "EDT") */
  abbreviation: string;
}

/**
 * Result of local time conversion
 * Contains both the converted time and metadata
 */
export interface TimeConversionResult {
  /** Converted Date object in target timezone */
  date: Date;
  /** Timezone offset applied in hours */
  offsetHours: number;
  /** Unix timestamp (milliseconds since epoch) */
  unixTimestamp: number;
  /** Whether daylight saving was active at this time */
  isDaylightSavingActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// JULIAN DATE INVERSE CONVERSION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gregorian calendar date with fractional day
 * Represents a complete date down to arbitrary precision
 */
export interface GregorianDate {
  /** Gregorian year (e.g., 2024) */
  year: number;
  /** Month (1-12) */
  month: number;
  /** Day (1-31) */
  day: number;
  /** Hour (0-23) */
  hour: number;
  /** Minute (0-59) */
  minute: number;
  /** Second (0-59) */
  second: number;
  /** Millisecond (0-999) */
  millisecond: number;
  /** Fractional day component for sub-millisecond precision */
  dayFraction: number;
}

/**
 * Options for Julian Date inverse conversion
 */
export interface JulianDateInverseOptions {
  /** Include milliseconds in output (default: true) */
  includeMilliseconds?: boolean;
  /** Include sub-millisecond precision (default: false) */
  includeFraction?: boolean;
  /** Specify output timezone (default: UTC) */
  timezone?: TimezoneInfo;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR TIME TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Time of day with precision level
 */
export interface TimeOfDay {
  /** Hour (0-23) */
  hour: number;
  /** Minute (0-59) */
  minute: number;
  /** Second (0-59) */
  second: number;
  /** Millisecond (0-999) */
  millisecond?: number;
}

/**
 * Solar time calculation parameters and results
 */
export interface SolarTimeData {
  /** Julian Date for calculation */
  jd: number;
  /** Geographic longitude in degrees (positive East) */
  longitudeDegrees: number;
  /** Local Mean Time (LMT) */
  localMeanTime: TimeOfDay;
  /** Local Apparent Time (LAT) / True Solar Time */
  localApparentTime: TimeOfDay;
  /** Equation of Time correction in minutes */
  equationOfTime: number;
  /** Apparent Solar Time offset from Mean Solar Time */
  apparentOffset: number;
}

/**
 * Equation of Time parameters
 * Describes the relationship between Mean Solar Time and Apparent Solar Time
 */
export interface EquationOfTimeResult {
  /** Equation of Time in decimal minutes */
  minutes: number;
  /** Equation of Time in decimal seconds */
  seconds: number;
  /** Equation of Time in fractional hours */
  hours: number;
  /** Component due to eccentricity of Earth's orbit */
  eccentricityComponent: number;
  /** Component due to obliquity of the ecliptic */
  obliquityComponent: number;
  /** Julian Date used for calculation */
  jd: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHINESE LUNAR CALENDAR TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chinese lunar calendar date
 */
export interface ChineseLunarDate {
  /** Lunar year */
  lunarYear: number;
  /** Lunar month (1-12, with leap month as 13) */
  lunarMonth: number;
  /** Lunar day (1-30) */
  lunarDay: number;
  /** Is this a leap month? */
  isLeapMonth: boolean;
  /** Corresponding Gregorian date (approximation or start of period) */
  gregorianDate: Date;
}

/**
 * Chinese lunar calendar calculations metadata
 */
export interface ChineseLunarCalendarData {
  /** The Chinese lunar date */
  lunarDate: ChineseLunarDate;
  /** New Moon (start of lunar month) date */
  newMoonDate: Date;
  /** Full Moon date */
  fullMoonDate: Date;
  /** Age of the moon (days into current lunar month, 1-30) */
  moonAge: number;
  /** Lunar phase illumination (0-1) */
  lunarIllumination: number;
  /** Julian Date of New Moon */
  newMoonJD: number;
  /** Julian Date of Full Moon */
  fullMoonJD: number;
}

/**
 * Lunar month boundaries for transition calculations
 */
export interface LunarMonthBoundaries {
  /** Start JD of the lunar month */
  startJD: number;
  /** End JD of the lunar month */
  endJD: number;
  /** Gregorian start date */
  startGregorian: Date;
  /** Gregorian end date */
  endGregorian: Date;
  /** Lunar month ordinal (1-12 or 13 for leap) */
  monthOrdinal: number;
  /** Is this a leap month? */
  isLeapMonth: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// EPOCH CONVERSION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unix timestamp with nanosecond precision
 */
export interface HighPrecisionTimestamp {
  /** Seconds since Unix epoch (1970-01-01T00:00:00Z) */
  seconds: number;
  /** Nanoseconds component (0-999999999) */
  nanoseconds: number;
  /** Total as decimal (seconds + nanoseconds as fraction) */
  decimal: number;
}

/**
 * Epoch conversion result with multiple formats
 */
export interface EpochConversionResult {
  /** Standard Unix timestamp (milliseconds) */
  unixMilliseconds: number;
  /** High-precision timestamp with nanoseconds */
  highPrecision: HighPrecisionTimestamp;
  /** Julian Date equivalent */
  jd: number;
  /** Modified Julian Date (JD - 2400000.5) */
  mjd: number;
  /** Reduced Julian Date (JD - 2451545.0, J2000.0 epoch) */
  rjd: number;
  /** Dublin Julian Date (JD - 2415020.0, 1900-01-01) */
  djd: number;
}

/**
 * Options for epoch conversion
 */
export interface EpochConversionOptions {
  /** Calculate reduced Julian Date (default: true) */
  calculateRJD?: boolean;
  /** Calculate Dublin Julian Date (default: false) */
  calculateDJD?: boolean;
  /** Calculate Modified Julian Date (default: true) */
  calculateMJD?: boolean;
  /** Include nanosecond precision (default: false, slower) */
  highPrecision?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DELTA TIME (TERRESTRIAL TIME - UNIVERSAL TIME) TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delta T represents the difference between Terrestrial Time (TT) and Universal Time (UT)
 * Important for accurate astronomical calculations over long time periods
 */
export interface DeltaTData {
  /** Delta T value in seconds */
  deltaT: number;
  /** Estimated uncertainty in seconds */
  uncertainty: number;
  /** Interpolation method used */
  method: "polynomial" | "table" | "nasa" | "meeus";
  /** Julian Date used for calculation */
  jd: number;
  /** Gregorian date for reference */
  date: Date;
}

/**
 * Options for Delta T calculation
 */
export interface DeltaTOptions {
  /** Method to use for calculation (default: "nasa") */
  method?: "polynomial" | "table" | "nasa" | "meeus";
  /** Include uncertainty estimate (default: true) */
  includeUncertainty?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIME SCALE CONVERSION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Different time scales used in astronomy
 */
export enum TimeScale {
  /** Coordinated Universal Time - the civil timescale */
  UTC = "UTC",
  /** Universal Time (raw observation time) */
  UT = "UT",
  /** Terrestrial Time (TT), also called Ephemeris Time (ET) */
  TT = "TT",
  /** Geocentric Coordinate Time (TCG) */
  TCG = "TCG",
  /** Barycentric Coordinate Time (TCB) */
  TCB = "TCB",
  /** International Atomic Time (TAI) */
  TAI = "TAI",
  /** GPS System Time */
  GPS = "GPS",
  /** Local Mean Time (astronomical) */
  LMT = "LMT",
  /** Local Apparent Time (True Solar Time) */
  LAT = "LAT"
}

/**
 * Time scale conversion data
 */
export interface TimeScaleConversion {
  /** Source time scale */
  source: TimeScale;
  /** Target time scale */
  target: TimeScale;
  /** Offset between scales in seconds */
  offsetSeconds: number;
  /** Julian Date */
  jd: number;
  /** Is the offset constant for this epoch? */
  isConstant: boolean;
  /** Additional metadata for complex conversions */
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL CALCULATION HELPER TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Time value in decimal format for internal calculations
 */
export interface DecimalTime {
  /** Fractional day (0-1) */
  dayFraction: number;
  /** Fractional hour (0-24) */
  hourFraction: number;
  /** Fractional minute (0-60) */
  minuteFraction: number;
  /** Fractional second (0-60) */
  secondFraction: number;
}

/**
 * Polynomial coefficients for approximation calculations
 */
export interface PolynomialCoefficients {
  /** Constant term (c0) */
  c0: number;
  /** Linear coefficient (c1 * T) */
  c1: number;
  /** Quadratic coefficient (c2 * T^2) */
  c2: number;
  /** Cubic coefficient (c3 * T^3) */
  c3?: number;
  /** Quartic coefficient (c4 * T^4) */
  c4?: number;
}

/**
 * Error/uncertainty tracking for calculations
 */
export interface CalculationError {
  /** Absolute error in the result */
  absolute: number;
  /** Relative error as percentage */
  relative: number;
  /** Source of the error estimate */
  source: string;
  /** Recommended for use cases requiring better than this precision? */
  recommendedFor: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION SIGNATURES
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// TIMEZONE HANDLING FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Get timezone information for a given IANA timezone identifier
 *
 * @param ianaIdentifier - IANA timezone (e.g., "America/New_York")
 * @param date - Reference date to determine DST status
 * @returns TimezoneInfo with current offset and DST status
 *
 * @example
 * const tz = getTimezoneInfo("America/New_York", new Date("2024-01-15"));
 * // { ianaIdentifier: "America/New_York", standardOffsetHours: -5, ... }
 */
export function getTimezoneInfo(ianaIdentifier: string, date: Date): TimezoneInfo;

/**
 * Convert local time to UTC given timezone offset or identifier
 *
 * @param localDate - Local date/time to convert
 * @param timezone - Either timezone identifier string or TimezoneInfo object
 * @returns TimeConversionResult with UTC equivalent and metadata
 *
 * @throws Error if timezone is invalid or cannot be resolved
 *
 * @example
 * const utc = localTimeToUTC(
 *   new Date("2024-06-15T14:30:00"),
 *   "America/Los_Angeles"
 * );
 * // Returns UTC equivalent and offset information
 */
export function localTimeToUTC(
  localDate: Date,
  timezone: string | TimezoneInfo
): TimeConversionResult;

/**
 * Convert UTC time to local time given timezone
 *
 * @param utcDate - UTC date/time to convert
 * @param timezone - Either timezone identifier string or TimezoneInfo object
 * @returns TimeConversionResult with local time equivalent
 *
 * @throws Error if timezone is invalid
 *
 * @example
 * const local = utcToLocalTime(
 *   new Date("2024-06-15T18:30:00Z"),
 *   "Europe/London"
 * );
 */
export function utcToLocalTime(
  utcDate: Date,
  timezone: string | TimezoneInfo
): TimeConversionResult;

/**
 * Get UTC offset in hours for a given timezone and date
 *
 * @param ianaIdentifier - IANA timezone identifier
 * @param date - Date to determine offset (accounts for DST transitions)
 * @returns Offset in hours (negative for west, positive for east)
 *
 * @example
 * const offset = getUTCOffset("Asia/Tokyo", new Date(2024, 0, 15));
 * // Returns 9 (JST is UTC+9)
 */
export function getUTCOffset(ianaIdentifier: string, date: Date): number;

/**
 * Convert between two timezones
 *
 * @param sourceDate - Date/time in source timezone
 * @param sourceTimezone - Source timezone identifier
 * @param targetTimezone - Target timezone identifier
 * @returns TimeConversionResult in target timezone
 *
 * @example
 * const result = convertBetweenTimezones(
 *   new Date("2024-06-15T09:00:00"),
 *   "America/New_York",
 *   "Europe/London"
 * );
 */
export function convertBetweenTimezones(
  sourceDate: Date,
  sourceTimezone: string,
  targetTimezone: string
): TimeConversionResult;

/**
 * Detect timezone from browser/system (client-side only)
 *
 * @returns IANA timezone identifier for the system
 *
 * @example
 * const tz = detectSystemTimezone();
 * // "America/Los_Angeles" or similar
 */
export function detectSystemTimezone(): string;

/**
 * Get list of all supported IANA timezone identifiers
 *
 * @param regionFilter - Optional ISO 3166-1 alpha-2 country code to filter
 * @returns Array of supported timezone identifiers
 *
 * @example
 * const tzs = getSupportedTimezones("US");
 * // Returns all US timezones
 */
export function getSupportedTimezones(regionFilter?: string): string[];

// ───────────────────────────────────────────────────────────────────────────
// JULIAN DATE INVERSE CONVERSION
// ───────────────────────────────────────────────────────────────────────────

/**
 * Convert Julian Date back to Gregorian date
 * Inverse operation of getJulianDate()
 *
 * @param jd - Julian Date to convert
 * @param options - Conversion options
 * @returns GregorianDate with all components
 *
 * @example
 * const jd = 2451545.5; // J2000.0 epoch
 * const greg = julianDateToGregorian(jd);
 * // { year: 2000, month: 1, day: 1, hour: 12, ... }
 */
export function julianDateToGregorian(
  jd: number,
  options?: JulianDateInverseOptions
): GregorianDate;

/**
 * Convert Julian Date to JavaScript Date object
 * Convenience wrapper around julianDateToGregorian()
 *
 * @param jd - Julian Date
 * @returns Date object representing the same moment in UTC
 *
 * @example
 * const date = jdToDate(2451545.5);
 * // Date object for 2000-01-01T12:00:00Z
 */
export function jdToDate(jd: number): Date;

/**
 * Convert Julian Date to ISO 8601 string
 *
 * @param jd - Julian Date
 * @param precision - Number of decimal places (default: 6)
 * @returns ISO 8601 formatted string
 *
 * @example
 * const iso = jdToISO8601(2451545.0);
 * // "2000-01-01T12:00:00.000Z"
 */
export function jdToISO8601(jd: number, precision?: number): string;

/**
 * Extract time component from Julian Date
 *
 * @param jd - Julian Date
 * @returns TimeOfDay object with hour, minute, second, millisecond
 *
 * @example
 * const time = getTimeFromJD(2451545.5);
 * // { hour: 12, minute: 0, second: 0, millisecond: 0 }
 */
export function getTimeFromJD(jd: number): TimeOfDay;

/**
 * Extract date component from Julian Date
 *
 * @param jd - Julian Date
 * @returns GregorianDate containing only date components
 *
 * @example
 * const dateOnly = getDateFromJD(2451545.5);
 * // { year: 2000, month: 1, day: 1, ... }
 */
export function getDateFromJD(jd: number): GregorianDate;

// ───────────────────────────────────────────────────────────────────────────
// SOLAR TIME CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Calculate the Equation of Time
 * Describes the difference between Mean Solar Time and Apparent Solar Time
 *
 * @param jd - Julian Date
 * @returns EquationOfTimeResult with time difference and components
 *
 * @remarks
 * The Equation of Time varies throughout the year due to:
 * 1. Eccentricity of Earth's orbit (affects speed)
 * 2. Obliquity of the ecliptic (affects apparent motion)
 * Ranges from about -14 to +16 minutes
 *
 * @example
 * const eot = calculateEquationOfTime(2451545.0);
 * // { minutes: 3.2, seconds: 192, hours: 0.053, ... }
 */
export function calculateEquationOfTime(jd: number): EquationOfTimeResult;

/**
 * Calculate Local Mean Time from Julian Date and longitude
 *
 * @param jd - Julian Date
 * @param longitudeDegrees - Geographic longitude (positive East, negative West)
 * @returns SolarTimeData with LMT and related calculations
 *
 * @remarks
 * Local Mean Time is the local time based on the mean sun.
 * Differs from clock time (which is typically standard time or daylight time).
 *
 * @example
 * const lmt = calculateLocalMeanTime(2451545.0, -75.0);
 * // Returns LMT for Philadelphia at J2000.0
 */
export function calculateLocalMeanTime(
  jd: number,
  longitudeDegrees: number
): SolarTimeData;

/**
 * Calculate Local Apparent Time (True Solar Time) from Julian Date and longitude
 *
 * @param jd - Julian Date
 * @param longitudeDegrees - Geographic longitude (positive East, negative West)
 * @returns SolarTimeData with LAT and equation of time
 *
 * @remarks
 * Local Apparent Time is the local time based on the true sun position.
 * Also called True Solar Time or Local Solar Time.
 *
 * @example
 * const lat = calculateLocalApparentTime(2451545.0, 0.0);
 * // Returns LAT for Greenwich at J2000.0
 */
export function calculateLocalApparentTime(
  jd: number,
  longitudeDegrees: number
): SolarTimeData;

/**
 * Get sunrise and sunset times for a given location and date
 *
 * @param date - Date to calculate for
 * @param latitude - Geographic latitude in degrees
 * @param longitude - Geographic longitude in degrees
 * @param timezone - Optional timezone for result (default: UTC)
 * @returns Object with sunrise and sunset times as Date objects
 *
 * @remarks
 * Sunrise/sunset defined as when sun center crosses horizon.
 * Does not account for atmospheric refraction effects on horizon.
 *
 * @example
 * const { sunrise, sunset } = calculateSunTimes(
 *   new Date(2024, 5, 21),
 *   40.7128,
 *   -74.0060,
 *   "America/New_York"
 * );
 */
export function calculateSunTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezone?: string
): { sunrise: Date; sunset: Date; duration: number };

/**
 * Get solar noon (culmination) time for a location and date
 *
 * @param date - Date to calculate for
 * @param longitude - Geographic longitude in degrees
 * @param timezone - Optional timezone for result
 * @returns Date object of solar noon
 *
 * @remarks
 * Solar noon is when the sun reaches its highest point in the sky,
 * transiting the meridian. Local Apparent Noon = 12:00 LAT.
 *
 * @example
 * const noon = calculateSolarNoon(new Date(2024, 5, 21), -74.0060);
 */
export function calculateSolarNoon(
  date: Date,
  longitude: number,
  timezone?: string
): Date;

/**
 * Calculate civil twilight times (sunrise/sunset with standard atmospheric refraction)
 *
 * @param date - Date to calculate for
 * @param latitude - Geographic latitude in degrees
 * @param longitude - Geographic longitude in degrees
 * @param timezone - Optional timezone for result
 * @returns Object with civil twilight start and end times
 *
 * @remarks
 * Civil twilight: sun 6 degrees below horizon
 * Nautical twilight: sun 12 degrees below horizon
 * Astronomical twilight: sun 18 degrees below horizon
 *
 * @example
 * const { start, end } = calculateCivilTwilight(
 *   new Date(2024, 5, 21),
 *   51.5074,
 *   -0.1278
 * );
 */
export function calculateCivilTwilight(
  date: Date,
  latitude: number,
  longitude: number,
  timezone?: string
): { start: Date; end: Date };

/**
 * Calculate nautical twilight times
 *
 * @param date - Date to calculate for
 * @param latitude - Geographic latitude in degrees
 * @param longitude - Geographic longitude in degrees
 * @param timezone - Optional timezone for result
 * @returns Object with nautical twilight start and end times
 */
export function calculateNauticalTwilight(
  date: Date,
  latitude: number,
  longitude: number,
  timezone?: string
): { start: Date; end: Date };

/**
 * Calculate astronomical twilight times
 *
 * @param date - Date to calculate for
 * @param latitude - Geographic latitude in degrees
 * @param longitude - Geographic longitude in degrees
 * @param timezone - Optional timezone for result
 * @returns Object with astronomical twilight start and end times
 */
export function calculateAstronomicalTwilight(
  date: Date,
  latitude: number,
  longitude: number,
  timezone?: string
): { start: Date; end: Date };

// ───────────────────────────────────────────────────────────────────────────
// CHINESE LUNAR CALENDAR
// ───────────────────────────────────────────────────────────────────────────

/**
 * Convert Gregorian date to Chinese lunar date
 *
 * @param date - Gregorian date to convert
 * @returns ChineseLunarCalendarData with lunar date and moon phase
 *
 * @remarks
 * Chinese calendar is lunisolar. Leap months occur periodically.
 * Years are typically 354-355 days (12 lunar months).
 * The algorithm uses astronomical calculations for new moon times.
 *
 * @example
 * const lunar = gregorianToChineseLunar(new Date(2024, 1, 10));
 * // { lunarDate: { year: 2024, month: 1, day: 1, ... }, ... }
 */
export function gregorianToChineseLunar(date: Date): ChineseLunarCalendarData;

/**
 * Convert Chinese lunar date to Gregorian date
 *
 * @param lunarYear - Lunar year
 * @param lunarMonth - Lunar month (1-12, 13 for leap month)
 * @param lunarDay - Lunar day (1-30)
 * @returns Date object with Gregorian equivalent
 *
 * @throws Error if lunar date is invalid
 *
 * @example
 * const greg = chineseLunarToGregorian(2024, 1, 1);
 * // Date representing the start of lunar month 1, year 2024
 */
export function chineseLunarToGregorian(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number
): Date;

/**
 * Get lunar new year date for a given Gregorian year
 *
 * @param year - Gregorian year
 * @returns Date of lunar new year (Spring Festival) for that year
 *
 * @remarks
 * Lunar new year is always the first day of the first lunar month.
 * Returns the Gregorian date of this event.
 *
 * @example
 * const cny = getLunarNewYearDate(2024);
 * // Date("2024-02-10") - Chinese New Year
 */
export function getLunarNewYearDate(year: number): Date;

/**
 * Calculate complete Chinese lunar calendar data for a date
 *
 * @param date - Gregorian date
 * @returns ChineseLunarCalendarData with detailed calculations
 *
 * @remarks
 * Includes moon phase, illumination, new moon and full moon dates.
 *
 * @example
 * const data = calculateChineseLunarCalendarData(new Date(2024, 5, 21));
 */
export function calculateChineseLunarCalendarData(
  date: Date
): ChineseLunarCalendarData;

/**
 * Get boundaries of a lunar month
 *
 * @param lunarYear - Lunar year
 * @param lunarMonth - Lunar month (1-12, 13 for leap)
 * @returns LunarMonthBoundaries with start/end dates
 *
 * @throws Error if month is invalid
 *
 * @example
 * const bounds = getLunarMonthBoundaries(2024, 1);
 * // { startJD: 2460370.5, endJD: 2460399.5, ... }
 */
export function getLunarMonthBoundaries(
  lunarYear: number,
  lunarMonth: number
): LunarMonthBoundaries;

/**
 * Check if a lunar year has a leap month
 *
 * @param lunarYear - Lunar year to check
 * @returns Object indicating if leap month exists and which month
 *
 * @example
 * const leap = getLeapMonthInfo(2024);
 * // { hasLeapMonth: false, leapMonth: null }
 */
export function getLeapMonthInfo(lunarYear: number): {
  hasLeapMonth: boolean;
  leapMonth: number | null;
};

/**
 * Get Chinese zodiac animal for lunar year
 *
 * @param lunarYear - Lunar year
 * @returns Chinese zodiac animal name (already exists in compute.ts)
 *
 * @example
 * const animal = getChineseZodiacFromLunarYear(2024);
 * // "dragon"
 */
export function getChineseZodiacFromLunarYear(
  lunarYear: number
): string;

/**
 * Find new moon date for or before a given date
 *
 * @param date - Reference date
 * @returns Date of the new moon
 *
 * @remarks
 * Searches for the most recent new moon on or before the given date.
 *
 * @example
 * const newMoon = findNewMoonBefore(new Date(2024, 5, 21));
 */
export function findNewMoonBefore(date: Date): Date;

/**
 * Find new moon date for or after a given date
 *
 * @param date - Reference date
 * @returns Date of the next new moon
 *
 * @example
 * const newMoon = findNewMoonAfter(new Date(2024, 5, 21));
 */
export function findNewMoonAfter(date: Date): Date;

/**
 * Calculate lunar age in days (days since new moon)
 *
 * @param date - Date to calculate for
 * @returns Days into current lunar month (1-30)
 *
 * @example
 * const age = calculateLunarAge(new Date(2024, 5, 21));
 * // 15 (approximately full moon)
 */
export function calculateLunarAge(date: Date): number;

// ───────────────────────────────────────────────────────────────────────────
// EPOCH CONVERSIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Convert Unix timestamp (milliseconds) to Julian Date
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @returns Julian Date equivalent
 *
 * @remarks
 * Unix epoch: 1970-01-01T00:00:00Z
 * Julian Day Number zero: -4712-01-01 (4713 BC) at noon
 * JD of Unix epoch: 2440587.5
 *
 * @example
 * const jd = unixTimestampToJD(1704067200000);
 * // JD for 2024-01-01T00:00:00Z
 */
export function unixTimestampToJD(unixMS: number): number;

/**
 * Convert Julian Date to Unix timestamp (milliseconds)
 *
 * @param jd - Julian Date
 * @returns Unix timestamp in milliseconds
 *
 * @example
 * const unix = jdToUnixTimestamp(2460310.5);
 */
export function jdToUnixTimestamp(jd: number): number;

/**
 * Convert Unix timestamp to JavaScript Date
 * Convenience wrapper (equivalent to `new Date(timestamp)`)
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @returns Date object
 *
 * @example
 * const date = unixTimestampToDate(1704067200000);
 */
export function unixTimestampToDate(unixMS: number): Date;

/**
 * Convert Date object to Unix timestamp
 * Convenience wrapper (equivalent to `date.getTime()`)
 *
 * @param date - Date to convert
 * @returns Unix timestamp in milliseconds
 *
 * @example
 * const unix = dateToUnixTimestamp(new Date("2024-01-01T00:00:00Z"));
 */
export function dateToUnixTimestamp(date: Date): number;

/**
 * Comprehensive epoch conversion function
 * Converts between multiple epoch systems with optional high precision
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @param options - Conversion options
 * @returns EpochConversionResult with multiple epoch formats
 *
 * @remarks
 * - JD: Julian Date (standard astronomical epoch)
 * - MJD: Modified JD (JD - 2400000.5, used in some contexts)
 * - RJD: Reduced JD (JD - 2451545.0, J2000.0 epoch)
 * - DJD: Dublin JD (JD - 2415020.0, 1900-01-01)
 *
 * @example
 * const result = epochConvert(Date.now(), {
 *   calculateRJD: true,
 *   calculateMJD: true,
 *   highPrecision: false
 * });
 */
export function epochConvert(
  unixMS: number,
  options?: EpochConversionOptions
): EpochConversionResult;

/**
 * Get Modified Julian Date (MJD) from Unix timestamp
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @returns Modified Julian Date
 *
 * @remarks
 * MJD = JD - 2400000.5
 * Epoch: 1858-11-17T00:00:00Z
 *
 * @example
 * const mjd = getModifiedJulianDate(1704067200000);
 */
export function getModifiedJulianDate(unixMS: number): number;

/**
 * Get Reduced Julian Date (RJD) from Unix timestamp
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @returns Reduced Julian Date
 *
 * @remarks
 * RJD = JD - 2451545.0
 * Epoch: 2000-01-01T12:00:00Z (J2000.0)
 *
 * @example
 * const rjd = getReducedJulianDate(1704067200000);
 */
export function getReducedJulianDate(unixMS: number): number;

/**
 * Get Dublin Julian Date (DJD) from Unix timestamp
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @returns Dublin Julian Date
 *
 * @remarks
 * DJD = JD - 2415020.0
 * Epoch: 1900-01-01T00:00:00Z
 *
 * @example
 * const djd = getDublinJulianDate(1704067200000);
 */
export function getDublinJulianDate(unixMS: number): number;

/**
 * Get Julian Day Number (integer part of JD) from Unix timestamp
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @returns Integer Julian Day Number
 *
 * @remarks
 * The JD integer part represents the number of days since -4712-01-01.
 *
 * @example
 * const jdn = getJulianDayNumber(1704067200000);
 */
export function getJulianDayNumber(unixMS: number): number;

// ───────────────────────────────────────────────────────────────────────────
// DELTA TIME (ΔT) CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Calculate Delta T (Terrestrial Time - Universal Time)
 *
 * @param jd - Julian Date
 * @param options - Calculation options
 * @returns DeltaTData with ΔT value and metadata
 *
 * @remarks
 * Delta T = TT - UT, where:
 * - TT (Terrestrial Time) is a uniform time scale
 * - UT (Universal Time) is based on Earth rotation
 * ΔT changes over time due to variations in Earth's rotation.
 * Important for accurate historical and precise astronomical calculations.
 * Ranges from a few seconds to minutes depending on era.
 *
 * @example
 * const deltaT = calculateDeltaT(2451545.0);
 * // { deltaT: 63.8, uncertainty: 0.01, method: "nasa", ... }
 */
export function calculateDeltaT(jd: number, options?: DeltaTOptions): DeltaTData;

/**
 * Get Delta T from Unix timestamp
 *
 * @param unixMS - Unix timestamp in milliseconds
 * @param options - Calculation options
 * @returns DeltaTData
 *
 * @example
 * const deltaT = getDeltaTFromTimestamp(Date.now());
 */
export function getDeltaTFromTimestamp(
  unixMS: number,
  options?: DeltaTOptions
): DeltaTData;

/**
 * Convert between UTC and TT (Terrestrial Time) using Delta T
 *
 * @param utcDate - Date in UTC
 * @returns Date in Terrestrial Time
 *
 * @remarks
 * TT = UTC + Delta T
 *
 * @example
 * const tt = utcToTT(new Date("2024-01-01T00:00:00Z"));
 */
export function utcToTT(utcDate: Date): Date;

/**
 * Convert between TT and UTC using Delta T
 *
 * @param ttDate - Date in Terrestrial Time
 * @returns Date in UTC
 *
 * @remarks
 * UTC = TT - Delta T
 *
 * @example
 * const utc = ttToUTC(ttDate);
 */
export function ttToUTC(ttDate: Date): Date;

/**
 * Get historical Delta T polynomial approximation
 * Used for dates far in the past or future
 *
 * @param jd - Julian Date
 * @returns PolynomialCoefficients for approximation
 *
 * @remarks
 * For calculating Delta T over long time periods.
 * Different polynomial fits are used for different eras.
 *
 * @example
 * const poly = getDeltaTPolynomial(2451545.0);
 */
export function getDeltaTPolynomial(jd: number): PolynomialCoefficients;

// ───────────────────────────────────────────────────────────────────────────
// TIME SCALE CONVERSIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Convert between astronomical time scales
 *
 * @param date - Date to convert
 * @param sourceScale - Source time scale
 * @param targetScale - Target time scale
 * @returns TimeScaleConversion with offset and metadata
 *
 * @remarks
 * Supported conversions between:
 * - UTC, UT, TT, TAI, GPS, TCG, TCB, LMT, LAT
 *
 * @example
 * const conv = convertTimeScale(
 *   new Date("2024-01-01T00:00:00Z"),
 *   TimeScale.UTC,
 *   TimeScale.TT
 * );
 */
export function convertTimeScale(
  date: Date,
  sourceScale: TimeScale,
  targetScale: TimeScale
): TimeScaleConversion;

/**
 * Get offset between two time scales for a given date
 *
 * @param jd - Julian Date
 * @param sourceScale - Source time scale
 * @param targetScale - Target time scale
 * @returns Offset in seconds (positive if target is ahead of source)
 *
 * @example
 * const offset = getTimeScaleOffset(
 *   2451545.0,
 *   TimeScale.UTC,
 *   TimeScale.TT
 * );
 */
export function getTimeScaleOffset(
  jd: number,
  sourceScale: TimeScale,
  targetScale: TimeScale
): number;

/**
 * Check if time scale offset is constant (no variation over time)
 *
 * @param sourceScale - Source time scale
 * @param targetScale - Target time scale
 * @returns true if offset is constant, false if it varies
 *
 * @remarks
 * E.g., UTC-TAI is constant (defined as -10 seconds historically).
 * But UTC-UT varies due to Earth rotation variations.
 *
 * @example
 * const isConst = isTimeScaleOffsetConstant(TimeScale.TAI, TimeScale.GPS);
 * // true
 */
export function isTimeScaleOffsetConstant(
  sourceScale: TimeScale,
  targetScale: TimeScale
): boolean;

/**
 * Get all supported time scales
 *
 * @returns Array of TimeScale enum values
 *
 * @example
 * const scales = getSupportedTimeScales();
 */
export function getSupportedTimeScales(): TimeScale[];

// ───────────────────────────────────────────────────────────────────────────
// UTILITY & HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Convert decimal time fraction (0-1) to TimeOfDay
 *
 * @param dayFraction - Fractional day (0-1, where 1 = 24 hours)
 * @returns TimeOfDay object with hour, minute, second, millisecond
 *
 * @example
 * const time = decimalDayToTime(0.5);
 * // { hour: 12, minute: 0, second: 0, millisecond: 0 }
 */
export function decimalDayToTime(dayFraction: number): TimeOfDay;

/**
 * Convert TimeOfDay to decimal day fraction
 *
 * @param time - TimeOfDay object
 * @returns Decimal day fraction (0-1)
 *
 * @example
 * const frac = timeToDecimalDay({ hour: 12, minute: 0, second: 0 });
 * // 0.5
 */
export function timeToDecimalDay(time: TimeOfDay): number;

/**
 * Format TimeOfDay as readable string
 *
 * @param time - TimeOfDay to format
 * @param includeMs - Include milliseconds (default: false)
 * @returns Formatted time string (HH:MM:SS[.mmm])
 *
 * @example
 * const str = formatTimeOfDay({ hour: 14, minute: 30, second: 45 });
 * // "14:30:45"
 */
export function formatTimeOfDay(time: TimeOfDay, includeMs?: boolean): string;

/**
 * Format GregorianDate as readable string
 *
 * @param date - GregorianDate to format
 * @param format - Format string ("ISO" | "LONG" | "SHORT")
 * @returns Formatted date string
 *
 * @example
 * const str = formatGregorianDate(greg, "ISO");
 * // "2000-01-01T12:00:00"
 */
export function formatGregorianDate(
  date: GregorianDate,
  format?: "ISO" | "LONG" | "SHORT"
): string;

/**
 * Calculate time difference between two dates
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Object with difference in various units
 *
 * @example
 * const diff = calculateTimeDifference(new Date("2024-01-01"), new Date("2024-01-02"));
 * // { days: 1, hours: 24, minutes: 1440, seconds: 86400, ... }
 */
export function calculateTimeDifference(
  date1: Date,
  date2: Date
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

/**
 * Check if date is valid
 *
 * @param date - Date to validate
 * @returns true if date is valid
 *
 * @example
 * const valid = isValidDate(new Date("2024-01-01"));
 * // true
 */
export function isValidDate(date: Date | unknown): date is Date;

/**
 * Check if Julian Date is valid
 *
 * @param jd - Julian Date to validate
 * @returns true if JD is within reasonable bounds
 *
 * @remarks
 * Reasonable bounds: roughly -5000 to +10000 years from J2000.0
 *
 * @example
 * const valid = isValidJD(2451545.0);
 * // true
 */
export function isValidJD(jd: number): boolean;

/**
 * Calculate age in years from birthdate to reference date
 *
 * @param birthdate - Birth date
 * @param referenceDate - Reference date (default: today)
 * @returns Age in years (integer)
 *
 * @example
 * const age = calculateAge(new Date("1990-01-15"));
 * // 34 (as of 2024)
 */
export function calculateAge(
  birthdate: Date,
  referenceDate?: Date
): number;

/**
 * Get next occurrence of a specific date (e.g., birthday, anniversary)
 *
 * @param month - Month (1-12)
 * @param day - Day (1-31)
 * @param fromDate - Reference date (default: today)
 * @returns Date of next occurrence
 *
 * @example
 * const nextBday = getNextDateOccurrence(3, 15);
 * // Next March 15
 */
export function getNextDateOccurrence(
  month: number,
  day: number,
  fromDate?: Date
): Date;

/**
 * Get previous occurrence of a specific date
 *
 * @param month - Month (1-12)
 * @param day - Day (1-31)
 * @param fromDate - Reference date (default: today)
 * @returns Date of previous occurrence
 *
 * @example
 * const lastBday = getPreviousDateOccurrence(3, 15);
 */
export function getPreviousDateOccurrence(
  month: number,
  day: number,
  fromDate?: Date
): Date;

/**
 * Check if a date is during daylight saving time in a timezone
 *
 * @param date - Date to check
 * @param timezone - Timezone identifier
 * @returns true if DST is active
 *
 * @example
 * const isDST = isDaylightSavingActive(new Date("2024-06-21"), "America/New_York");
 * // true
 */
export function isDaylightSavingActive(
  date: Date,
  timezone: string
): boolean;

/**
 * Get next daylight saving time transition
 *
 * @param timezone - Timezone identifier
 * @param fromDate - Reference date (default: today)
 * @returns Date of next DST transition
 *
 * @example
 * const nextDST = getNextDSTTransition("America/New_York");
 */
export function getNextDSTTransition(
  timezone: string,
  fromDate?: Date
): Date;

/**
 * Get previous daylight saving time transition
 *
 * @param timezone - Timezone identifier
 * @param fromDate - Reference date (default: today)
 * @returns Date of previous DST transition
 *
 * @example
 * const prevDST = getPreviousDSTTransition("America/New_York");
 */
export function getPreviousDSTTransition(
  timezone: string,
  fromDate?: Date
): Date;

/**
 * Compare two GregorianDate objects
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 *
 * @example
 * const result = compareGregorianDates(greg1, greg2);
 * // -1 (greg1 is earlier)
 */
export function compareGregorianDates(
  date1: GregorianDate,
  date2: GregorianDate
): -1 | 0 | 1;
