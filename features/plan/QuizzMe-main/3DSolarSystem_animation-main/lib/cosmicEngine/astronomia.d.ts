/**
 * Type declarations for astronomia library
 * Based on astronomia v4.2.0 - JavaScript implementation of Jean Meeus algorithms
 * @see https://github.com/commenthol/astronomia
 */

declare module 'astronomia' {
  export * from 'astronomia/julian';
  export * from 'astronomia/planetposition';
  export * from 'astronomia/moonposition';
  export * from 'astronomia/moonphase';
  export * from 'astronomia/coord';
  export * from 'astronomia/sidereal';
  export * from 'astronomia/solar';
  export * from 'astronomia/nutation';
  export * from 'astronomia/base';
  export { data } from 'astronomia/data';
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/base' {
  /** Coordinate class returned by many astronomia functions */
  export class Coord {
    constructor(lon: number, lat: number, range?: number);
    lon: number;
    lat: number;
    range: number;
  }

  /** J2000.0 epoch as Julian Day */
  export const J2000: number;

  /** Julian Day modified epoch */
  export const JMod: number;

  /** Convert JDE to Julian centuries from J2000.0 */
  export function J2000Century(jde: number): number;

  /** Convert JDE to Julian year */
  export function JDEToJulianYear(jde: number): number;

  /** Polynomial evaluation using Horner's method */
  export function horner(x: number, ...coeffs: number[]): number;

  /** Floor division */
  export function floorDiv(a: number, b: number): number;

  /** Modulo that handles negative numbers correctly */
  export function pmod(x: number, y: number): number;

  /** Return integer and fractional parts */
  export function modf(x: number): [number, number];

  /** Round to specified decimal places */
  export function round(x: number, places: number): number;

  /** Sin and cos computed together */
  export function sincos(x: number): [number, number];

  const base: {
    Coord: typeof Coord;
    J2000: number;
    JMod: number;
    J2000Century: typeof J2000Century;
    JDEToJulianYear: typeof JDEToJulianYear;
    horner: typeof horner;
    floorDiv: typeof floorDiv;
    pmod: typeof pmod;
    modf: typeof modf;
    round: typeof round;
    sincos: typeof sincos;
  };
  export default base;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JULIAN MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/julian' {
  /** First Julian Day of Gregorian calendar */
  export const GREGORIAN0JD: number;

  /** Calendar base class */
  export class Calendar {
    constructor(year?: number | Date, month?: number, day?: number);
    year: number;
    month: number;
    day: number;

    getDate(): { year: number; month: number; day: number };
    getTime(): { hour: number; minute: number; second: number; millisecond: number };
    toISOString(): string;
    isGregorian(): boolean;
    fromDate(date: Date): this;
    toDate(): Date;
    toYear(): number;
    fromYear(year: number): this;
    isLeapYear(): boolean;
    toJD(): number;
    fromJD(jd: number): this;
    fromJDE(jde: number): this;
    toJDE(): number;
    midnight(): this;
    noon(): this;
    deltaT(td: boolean): this;
    dayOfWeek(): number;
    dayOfYear(): number;
  }

  /** Julian calendar */
  export class CalendarJulian extends Calendar {
    toGregorian(): CalendarGregorian;
  }

  /** Gregorian calendar */
  export class CalendarGregorian extends Calendar {
    toJulian(): CalendarJulian;
  }

  /** Convert calendar date to Julian Day */
  export function CalendarToJD(y: number, m: number, d: number, isJulian?: boolean): number;
  export function CalendarGregorianToJD(y: number, m: number, d: number): number;
  export function CalendarJulianToJD(y: number, m: number, d: number): number;

  /** Check if year is leap year */
  export function LeapYearJulian(y: number): boolean;
  export function LeapYearGregorian(y: number): boolean;

  /** Convert Julian Day to calendar date */
  export function JDToCalendar(jd: number, isJulian?: boolean): { year: number; month: number; day: number };
  export function JDToCalendarGregorian(jd: number): { year: number; month: number; day: number };
  export function JDToCalendarJulian(jd: number): { year: number; month: number; day: number };

  /** Check if JD is in Gregorian calendar */
  export function isJDCalendarGregorian(jd: number): boolean;
  export function isCalendarGregorian(year: number, month?: number, day?: number): boolean;

  /** Convert between JD and Date */
  export function JDToDate(jd: number): Date;
  export function DateToJD(date: Date): number;
  export function JDEToDate(jde: number): Date;
  export function DateToJDE(date: Date): number;

  /** Modified Julian Day conversions */
  export function MJDToJD(mjd: number): number;
  export function JDToMJD(jd: number): number;

  /** Day of week (0=Sunday) */
  export function DayOfWeek(jd: number): number;

  /** Day of year calculations */
  export function DayOfYearGregorian(y: number, m: number, d: number): number;
  export function DayOfYearJulian(y: number, m: number, d: number): number;
  export function DayOfYear(y: number, m: number, d: number, leap: boolean): number;
  export function DayOfYearToCalendar(n: number, leap: boolean): { month: number; day: number };
  export function DayOfYearToCalendarGregorian(year: number, n: number): CalendarGregorian;
  export function DayOfYearToCalendarJulian(year: number, n: number): CalendarJulian;

  const julian: {
    GREGORIAN0JD: number;
    Calendar: typeof Calendar;
    CalendarJulian: typeof CalendarJulian;
    CalendarGregorian: typeof CalendarGregorian;
    CalendarToJD: typeof CalendarToJD;
    CalendarGregorianToJD: typeof CalendarGregorianToJD;
    CalendarJulianToJD: typeof CalendarJulianToJD;
    LeapYearJulian: typeof LeapYearJulian;
    LeapYearGregorian: typeof LeapYearGregorian;
    JDToCalendar: typeof JDToCalendar;
    JDToCalendarGregorian: typeof JDToCalendarGregorian;
    JDToCalendarJulian: typeof JDToCalendarJulian;
    isJDCalendarGregorian: typeof isJDCalendarGregorian;
    isCalendarGregorian: typeof isCalendarGregorian;
    JDToDate: typeof JDToDate;
    DateToJD: typeof DateToJD;
    JDEToDate: typeof JDEToDate;
    DateToJDE: typeof DateToJDE;
    MJDToJD: typeof MJDToJD;
    JDToMJD: typeof JDToMJD;
    DayOfWeek: typeof DayOfWeek;
    DayOfYearGregorian: typeof DayOfYearGregorian;
    DayOfYearJulian: typeof DayOfYearJulian;
    DayOfYear: typeof DayOfYear;
    DayOfYearToCalendar: typeof DayOfYearToCalendar;
    DayOfYearToCalendarGregorian: typeof DayOfYearToCalendarGregorian;
    DayOfYearToCalendarJulian: typeof DayOfYearToCalendarJulian;
  };
  export default julian;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLANET POSITION MODULE (VSOP87)
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/planetposition' {
  import { Coord } from 'astronomia/base';

  /** VSOP87 planet data structure */
  export interface VSOP87Data {
    name: string;
    type?: 'B' | 'D';
    L: number[][][];
    B: number[][][];
    R: number[][][];
  }

  /** Planet class using VSOP87 theory */
  export class Planet {
    constructor(planet: VSOP87Data);
    name: string;
    type: 'B' | 'D';

    /**
     * Returns ecliptic position at equinox and ecliptic J2000.0
     * @param jde Julian ephemeris day
     * @returns Coord with lon, lat (radians), range (AU)
     */
    position2000(jde: number): Coord;

    /**
     * Returns ecliptic position at equinox and ecliptic of date
     * @param jde Julian ephemeris day
     * @returns Coord with lon, lat (radians), range (AU)
     */
    position(jde: number): Coord;
  }

  /**
   * Convert coordinates from dynamical frame to FK5
   * @param lon Ecliptic longitude in radians
   * @param lat Ecliptic latitude in radians
   * @param jde Julian ephemeris day
   * @returns Coord with FK5 lon, lat
   */
  export function toFK5(lon: number, lat: number, jde: number): Coord;

  const planetposition: {
    Planet: typeof Planet;
    toFK5: typeof toFK5;
  };
  export default planetposition;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOON POSITION MODULE (ELP2000)
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/moonposition' {
  import { Coord } from 'astronomia/base';

  /**
   * Returns geocentric position of the Moon
   * @param jde Julian ephemeris day
   * @returns Coord with lon, lat (radians), range (km)
   */
  export function position(jde: number): Coord;

  /**
   * Returns equatorial horizontal parallax of the Moon
   * @param distance Distance in km
   * @returns Parallax in radians
   */
  export function parallax(distance: number): number;

  /**
   * Returns longitude of mean ascending node
   * @param jde Julian ephemeris day
   * @returns Longitude in radians
   */
  export function node(jde: number): number;

  /**
   * Returns longitude of perigee
   * @param jde Julian ephemeris day
   * @returns Longitude in radians
   */
  export function perigee(jde: number): number;

  /**
   * Returns longitude of true ascending node
   * @param jde Julian ephemeris day
   * @returns Longitude in radians
   */
  export function trueNode(jde: number): number;

  const moonposition: {
    position: typeof position;
    parallax: typeof parallax;
    node: typeof node;
    perigee: typeof perigee;
    trueNode: typeof trueNode;
  };
  export default moonposition;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOON PHASE MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/moonphase' {
  /**
   * Returns JDE of mean new moon nearest to given decimal year
   * @param year Decimal year
   * @returns JDE of mean new moon
   */
  export function meanNew(year: number): number;

  /**
   * Returns JDE of new moon nearest to given decimal year
   * @param year Decimal year
   * @returns JDE of new moon
   */
  export function newMoon(year: number): number;

  /**
   * Returns JDE of first quarter nearest to given decimal year
   * @param year Decimal year
   * @returns JDE of first quarter
   */
  export function first(year: number): number;

  /**
   * Returns JDE of full moon nearest to given decimal year
   * @param year Decimal year
   * @returns JDE of full moon
   */
  export function full(year: number): number;

  /**
   * Returns JDE of last quarter nearest to given decimal year
   * @param year Decimal year
   * @returns JDE of last quarter
   */
  export function last(year: number): number;

  const moonphase: {
    meanNew: typeof meanNew;
    newMoon: typeof newMoon;
    first: typeof first;
    full: typeof full;
    last: typeof last;
  };
  export default moonphase;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATE TRANSFORMATION MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/coord' {
  /** Ecliptic coordinates */
  export class Ecliptic {
    constructor(lon: number, lat: number);
    lon: number;
    lat: number;

    /**
     * Convert to equatorial coordinates
     * @param obliquity Obliquity of ecliptic in radians
     * @returns Equatorial coordinates
     */
    toEquatorial(obliquity: number): Equatorial;
  }

  /** Equatorial coordinates */
  export class Equatorial {
    constructor(ra: number, dec: number);
    ra: number;
    dec: number;

    /**
     * Convert to ecliptic coordinates
     * @param obliquity Obliquity of ecliptic in radians
     * @returns Ecliptic coordinates
     */
    toEcliptic(obliquity: number): Ecliptic;

    /**
     * Convert to horizontal coordinates
     * @param lat Observer latitude in radians
     * @param lst Local sidereal time in radians
     * @returns Horizontal coordinates
     */
    toHorizontal(lat: number, lst: number): Horizontal;
  }

  /** Horizontal (altitude-azimuth) coordinates */
  export class Horizontal {
    constructor(az: number, alt: number);
    az: number;
    alt: number;

    /**
     * Convert to equatorial coordinates
     * @param lat Observer latitude in radians
     * @param lst Local sidereal time in radians
     * @returns Equatorial coordinates
     */
    toEquatorial(lat: number, lst: number): Equatorial;
  }

  /** Galactic coordinates */
  export class Galactic {
    constructor(lon: number, lat: number);
    lon: number;
    lat: number;

    toEquatorial(): Equatorial;
  }

  const coord: {
    Ecliptic: typeof Ecliptic;
    Equatorial: typeof Equatorial;
    Horizontal: typeof Horizontal;
    Galactic: typeof Galactic;
  };
  export default coord;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEREAL TIME MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/sidereal' {
  /**
   * Returns mean sidereal time at Greenwich
   * @param jd Julian day
   * @returns Sidereal time in radians
   */
  export function mean(jd: number): number;

  /**
   * Returns mean sidereal time at Greenwich (0h UT)
   * @param jd Julian day
   * @returns Sidereal time in radians
   */
  export function mean0UT(jd: number): number;

  /**
   * Returns apparent sidereal time at Greenwich
   * @param jd Julian day
   * @returns Sidereal time in radians
   */
  export function apparent(jd: number): number;

  /**
   * Returns apparent sidereal time at Greenwich (0h UT)
   * @param jd Julian day
   * @returns Sidereal time in radians
   */
  export function apparent0UT(jd: number): number;

  const sidereal: {
    mean: typeof mean;
    mean0UT: typeof mean0UT;
    apparent: typeof apparent;
    apparent0UT: typeof apparent0UT;
  };
  export default sidereal;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOLAR MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/solar' {
  import { Coord } from 'astronomia/base';

  /**
   * Returns apparent longitude of the sun
   * @param T Julian centuries from J2000.0
   * @returns Longitude in radians
   */
  export function apparentLongitude(T: number): number;

  /**
   * Returns true longitude of the sun
   * @param T Julian centuries from J2000.0
   * @returns Longitude in radians
   */
  export function trueLongitude(T: number): number;

  /**
   * Returns mean longitude of the sun
   * @param T Julian centuries from J2000.0
   * @returns Longitude in radians
   */
  export function meanLongitude(T: number): number;

  /**
   * Returns mean anomaly of the sun
   * @param T Julian centuries from J2000.0
   * @returns Anomaly in radians
   */
  export function meanAnomaly(T: number): number;

  /**
   * Returns radius vector of the sun in AU
   * @param T Julian centuries from J2000.0
   * @returns Distance in AU
   */
  export function radius(T: number): number;

  /**
   * Returns apparent equatorial coordinates of the sun
   * @param jde Julian ephemeris day
   * @returns Coord with ra, dec in radians
   */
  export function apparentEquatorial(jde: number): Coord;

  /**
   * Returns true geocentric position of the sun
   * @param jde Julian ephemeris day
   * @returns Coord with lon, lat in radians, range in AU
   */
  export function trueVSOP87(jde: number): Coord;

  /**
   * Returns apparent geocentric position of the sun
   * @param jde Julian ephemeris day
   * @returns Coord with lon, lat in radians, range in AU
   */
  export function apparentVSOP87(jde: number): Coord;

  const solar: {
    apparentLongitude: typeof apparentLongitude;
    trueLongitude: typeof trueLongitude;
    meanLongitude: typeof meanLongitude;
    meanAnomaly: typeof meanAnomaly;
    radius: typeof radius;
    apparentEquatorial: typeof apparentEquatorial;
    trueVSOP87: typeof trueVSOP87;
    apparentVSOP87: typeof apparentVSOP87;
  };
  export default solar;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NUTATION MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/nutation' {
  /**
   * Returns nutation in longitude and obliquity
   * @param jde Julian ephemeris day
   * @returns [Δψ, Δε] in radians
   */
  export function nutation(jde: number): [number, number];

  /**
   * Returns mean obliquity of the ecliptic
   * @param jde Julian ephemeris day
   * @returns Obliquity in radians
   */
  export function meanObliquity(jde: number): number;

  /**
   * Returns mean obliquity using Laskar formula
   * @param jde Julian ephemeris day
   * @returns Obliquity in radians
   */
  export function meanObliquityLaskar(jde: number): number;

  /**
   * Returns true obliquity (mean + nutation)
   * @param jde Julian ephemeris day
   * @returns Obliquity in radians
   */
  export function trueObliquity(jde: number): number;

  const nutationModule: {
    nutation: typeof nutation;
    meanObliquity: typeof meanObliquity;
    meanObliquityLaskar: typeof meanObliquityLaskar;
    trueObliquity: typeof trueObliquity;
  };
  export default nutationModule;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VSOP87 DATA MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/data' {
  import { VSOP87Data } from 'astronomia/planetposition';

  export const vsop87Bearth: VSOP87Data;
  export const vsop87Bjupiter: VSOP87Data;
  export const vsop87Bmars: VSOP87Data;
  export const vsop87Bmercury: VSOP87Data;
  export const vsop87Bneptune: VSOP87Data;
  export const vsop87Bsaturn: VSOP87Data;
  export const vsop87Buranus: VSOP87Data;
  export const vsop87Bvenus: VSOP87Data;

  export interface Data {
    vsop87Bearth: VSOP87Data;
    vsop87Bjupiter: VSOP87Data;
    vsop87Bmars: VSOP87Data;
    vsop87Bmercury: VSOP87Data;
    vsop87Bneptune: VSOP87Data;
    vsop87Bsaturn: VSOP87Data;
    vsop87Buranus: VSOP87Data;
    vsop87Bvenus: VSOP87Data;
  }

  export const data: Data;
  export default data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUMINATION MODULE
// ═══════════════════════════════════════════════════════════════════════════════

declare module 'astronomia/moonillum' {
  /**
   * Returns phase angle of the moon
   * @param jde Julian ephemeris day
   * @returns Phase angle in radians
   */
  export function phaseAngle(jde: number): number;

  /**
   * Returns illuminated fraction of the moon
   * @param jde Julian ephemeris day
   * @returns Fraction 0-1
   */
  export function illuminated(jde: number): number;

  /**
   * Returns phase angle from elongation
   * @param elong Elongation in radians
   * @returns Phase angle in radians
   */
  export function phaseAngle2(elong: number): number;

  /**
   * Returns illuminated fraction from phase angle
   * @param i Phase angle in radians
   * @returns Fraction 0-1
   */
  export function illuminated2(i: number): number;

  const moonillum: {
    phaseAngle: typeof phaseAngle;
    illuminated: typeof illuminated;
    phaseAngle2: typeof phaseAngle2;
    illuminated2: typeof illuminated2;
  };
  export default moonillum;
}
