/**
 * Ba Zi (Four Pillars) Calculator
 *
 * Calculates the complete Ba Zi chart from birth data.
 * Uses strict TypeScript types from schemas.ts.
 *
 * @version 2.0.0 - Refactored with strict typing and integrated time-helpers
 */

import {
  type Stem,
  type Branch,
  type WuXing,
  type Polarity,
  type ZodiacAnimal,
  type BaZiPillar,
  type BaZiChart,
  type DayMaster,
  STEMS,
  BRANCHES,
  WU_XING,
  ZODIAC_ANIMALS,
} from "./schemas";

import {
  dateToJulianDate,
  calculateSolarLongitude,
} from "../../lib/astro/time-helpers";

import {
  STEMS_CN,
  BRANCHES_CN,
  ZODIAC_ANIMALS_DE,
  STEM_ELEMENT_INDEX,
  SOLAR_MONTH_START_LONS,
  calculateTrueSolarTime,
  normalizeDeg,
} from "./astronomy-utils";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Li Chun (立春) - Start of Spring, Chinese New Year solar boundary */
const LI_CHUN_LONGITUDE = 315;

/** Winter Solstice longitude */
const WINTER_SOLSTICE_LONGITUDE = 270;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mod function that handles negatives correctly
 */
const mod = (n: number, m: number): number => ((n % m) + m) % m;

/**
 * Get GanZhi (Stem/Branch) from 0-59 index
 */
function getPillarFromIndex(idx60: number): BaZiPillar {
  const stemIdx = mod(idx60, 10);
  const branchIdx = mod(idx60, 12);

  const stem = STEMS[stemIdx] as Stem;
  const branch = BRANCHES[branchIdx] as Branch;
  const element = WU_XING[STEM_ELEMENT_INDEX[stemIdx]] as WuXing;
  const polarity: Polarity = stemIdx % 2 === 0 ? "Yang" : "Yin";
  const animal = ZODIAC_ANIMALS[branchIdx] as ZodiacAnimal;

  return {
    stem,
    stemCN: STEMS_CN[stemIdx],
    branch,
    branchCN: BRANCHES_CN[branchIdx],
    element,
    polarity,
    animal,
    animalDE: ZODIAC_ANIMALS_DE[branchIdx],
    stemIndex: stemIdx,
    branchIndex: branchIdx,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PILLAR CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate Year Pillar
 *
 * The Chinese Solar Year changes at Li Chun (Sun Longitude 315°),
 * which is usually around Feb 4th. If we are before Li Chun,
 * we belong to the previous year's pillar.
 *
 * @param year - Civil year
 * @param month - Civil month (1-12)
 * @param sunLon - Sun longitude in degrees (0-360)
 */
function calculateYearPillar(
  year: number,
  month: number,
  sunLon: number
): BaZiPillar {
  // Reference: 1984 = Jia Zi (Index 0)
  // If date is Jan/Feb and SunLon is between 270° (Winter Solstice) and 315° (Li Chun),
  // we are in the previous Chinese Solar Year
  let chartYear = year;

  if (
    month <= 2 &&
    sunLon >= WINTER_SOLSTICE_LONGITUDE &&
    sunLon < LI_CHUN_LONGITUDE
  ) {
    chartYear = year - 1;
  }

  return getPillarFromIndex(mod(chartYear - 1984, 60));
}

/**
 * Calculate Month Pillar
 *
 * Uses the Five Tigers formula to determine the stem based on year stem.
 *
 * @param sunLon - Sun longitude in degrees
 * @param yearStemIndex - Year stem index (0-9)
 */
function calculateMonthPillar(
  sunLon: number,
  yearStemIndex: number
): BaZiPillar {
  // 1. Determine Solar Month Index (0 = Tiger/Yin = SunLon 315+)
  let monthIdx = 0;
  for (let i = 0; i < 12; i++) {
    const start = SOLAR_MONTH_START_LONS[i];
    const end = SOLAR_MONTH_START_LONS[(i + 1) % 12];

    // Handle wrap around 360 for first interval
    if (start < end) {
      if (sunLon >= start && sunLon < end) {
        monthIdx = i;
        break;
      }
    } else {
      // Wrap (e.g. 345 -> 15)
      if (sunLon >= start || sunLon < end) {
        monthIdx = i;
        break;
      }
    }
  }

  // 2. Branch Index
  // Tiger (Yin) is index 2 in the Branches array (Zi=0, Chou=1, Yin=2)
  // Solar Month 0 corresponds to Branch Index 2
  const branchIdx = mod(2 + monthIdx, 12);

  // 3. Stem Index (Five Tigers Formula)
  // Year Stem: Jia(0)/Ji(5) -> Bing(2) (Tiger)
  // Yi(1)/Geng(6) -> Wu(4)
  // Bing(2)/Xin(7) -> Geng(6)
  // Ding(3)/Ren(8) -> Ren(8)
  // Wu(4)/Gui(9) -> Jia(0)
  const tigerStarts = [2, 4, 6, 8, 0];
  const baseStem = tigerStarts[yearStemIndex % 5];
  const stemIdx = mod(baseStem + monthIdx, 10);

  // 60-cycle index using formula: (6*stem - 5*branch) mod 60
  const idx60 = mod(6 * stemIdx - 5 * branchIdx, 60);

  const pillar = getPillarFromIndex(idx60);
  // Override with calculated indices for accuracy
  pillar.stemIndex = stemIdx;
  pillar.branchIndex = branchIdx;
  return pillar;
}

/**
 * Calculate Day Pillar
 *
 * Uses a continuous 60-day cycle based on Julian Day Number.
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day
 */
function calculateDayPillar(year: number, month: number, day: number): BaZiPillar {
  // Calculate Julian Day Number
  // Using dateToJulianDate from time-helpers
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const jd = dateToJulianDate(date);
  const jdn = Math.floor(jd);

  // Formula: (JDN + 49) % 60
  // Verified: Jan 1 2024 (JDN 2460311) -> (2460311 + 49) % 60 = 0 = Jia Zi ✓
  const idx60 = mod(jdn + 49, 60);
  return getPillarFromIndex(idx60);
}

/**
 * Calculate Hour Pillar
 *
 * Uses True Solar Time and Five Rats formula based on day stem.
 *
 * @param trueSolarTimeMins - True Solar Time in minutes (0-1440)
 * @param dayStemIndex - Day stem index (0-9)
 */
function calculateHourPillar(
  trueSolarTimeMins: number,
  dayStemIndex: number
): BaZiPillar {
  // 1. Determine Double Hour Index (0 = Rat = 23:00 - 01:00)
  // Formula: floor((mins + 60) / 120) % 12
  const hourIdx = Math.floor((trueSolarTimeMins + 60) / 120) % 12;

  // 2. Branch Index = hourIdx (Rat=0, etc.)
  const branchIdx = hourIdx;

  // 3. Stem Index (Five Rats Formula)
  // Jia(0)/Ji(5) -> Jia(0) (Rat)
  // Yi(1)/Geng(6) -> Bing(2)
  // Bing(2)/Xin(7) -> Wu(4)
  // Ding(3)/Ren(8) -> Geng(6)
  // Wu(4)/Gui(9) -> Ren(8)
  const ratStarts = [0, 2, 4, 6, 8];
  const baseStem = ratStarts[dayStemIndex % 5];
  const stemIdx = mod(baseStem + hourIdx, 10);

  const idx60 = mod(6 * stemIdx - 5 * branchIdx, 60);

  const pillar = getPillarFromIndex(idx60);
  pillar.stemIndex = stemIdx;
  pillar.branchIndex = branchIdx;
  return pillar;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export interface BaZiInput {
  /** Birth year */
  year: number;
  /** Birth month (1-12) */
  month: number;
  /** Birth day (1-31) */
  day: number;
  /** Birth hour (0-23) */
  hour: number;
  /** Birth minute (0-59) */
  minute: number;
  /** Geographic longitude (degrees, -180 to 180) */
  longitude: number;
  /** Timezone offset in minutes (e.g., 60 for CET) */
  timezoneOffset: number;
}

export interface BaZiResult {
  /** Complete Ba Zi chart */
  chart: BaZiChart;
  /** Solar longitude at birth (degrees) */
  solarLongitude: number;
  /** Julian Date at birth */
  julianDate: number;
}

/**
 * Calculate complete Ba Zi (Four Pillars) chart
 *
 * This is the main entry point. It computes the solar longitude internally
 * using time-helpers, eliminating the need for external sun position data.
 *
 * @param input - Birth data
 * @returns Complete Ba Zi chart with metadata
 */
export function calculateBaZi(input: BaZiInput): BaZiResult {
  const { year, month, day, hour, minute, longitude, timezoneOffset } = input;

  // Calculate UTC date
  const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const utcDate = new Date(localDate.getTime() - timezoneOffset * 60000);

  // Calculate Julian Date and Solar Longitude
  const jd = dateToJulianDate(utcDate);
  const sunLon = normalizeDeg(calculateSolarLongitude(jd));

  // 1. Year Pillar (Corrected for Li Chun via SunLon)
  const yearPillar = calculateYearPillar(year, month, sunLon);

  // 2. Month Pillar
  const monthPillar = calculateMonthPillar(sunLon, yearPillar.stemIndex);

  // 3. Day Pillar
  const dayPillar = calculateDayPillar(year, month, day);

  // 4. Hour Pillar
  const tst = calculateTrueSolarTime(hour, minute, longitude, utcDate, timezoneOffset);
  const hourPillar = calculateHourPillar(tst, dayPillar.stemIndex);

  // Day Master (日主)
  const dayMaster: DayMaster = {
    stem: dayPillar.stem,
    stemCN: dayPillar.stemCN,
    element: dayPillar.element,
    polarity: dayPillar.polarity,
  };

  // Full notation
  const fullNotation = `${yearPillar.stemCN}${yearPillar.branchCN} ${monthPillar.stemCN}${monthPillar.branchCN} ${dayPillar.stemCN}${dayPillar.branchCN} ${hourPillar.stemCN}${hourPillar.branchCN}`;

  const chart: BaZiChart = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayMaster,
    fullNotation,
  };

  return {
    chart,
    solarLongitude: sunLon,
    julianDate: jd,
  };
}

/**
 * Legacy function signature for backwards compatibility
 *
 * @deprecated Use calculateBaZi(input: BaZiInput) instead
 */
export function calculateBaZiLegacy(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude: number,
  timezoneOffset: number,
  sunLongitude?: number
): BaZiChart {
  // If sunLongitude provided, use it (legacy behavior)
  if (sunLongitude !== undefined) {
    const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const utcDate = new Date(localDate.getTime() - timezoneOffset * 60000);

    const yearPillar = calculateYearPillar(year, month, sunLongitude);
    const monthPillar = calculateMonthPillar(sunLongitude, yearPillar.stemIndex);
    const dayPillar = calculateDayPillar(year, month, day);
    const tst = calculateTrueSolarTime(hour, minute, longitude, utcDate, timezoneOffset);
    const hourPillar = calculateHourPillar(tst, dayPillar.stemIndex);

    return {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
      dayMaster: {
        stem: dayPillar.stem,
        stemCN: dayPillar.stemCN,
        element: dayPillar.element,
        polarity: dayPillar.polarity,
      },
      fullNotation: `${yearPillar.stemCN}${yearPillar.branchCN} ${monthPillar.stemCN}${monthPillar.branchCN} ${dayPillar.stemCN}${dayPillar.branchCN} ${hourPillar.stemCN}${hourPillar.branchCN}`,
    };
  }

  // Use new calculation
  const result = calculateBaZi({
    year,
    month,
    day,
    hour,
    minute,
    longitude,
    timezoneOffset,
  });

  return result.chart;
}

// Re-export types for convenience
export type { BaZiPillar, BaZiChart, DayMaster, Stem, Branch, WuXing, Polarity, ZodiacAnimal };
