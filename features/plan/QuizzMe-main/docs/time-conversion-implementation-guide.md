# Time Conversion API - Implementation Guide

## Overview

This guide provides algorithm outlines, mathematical formulas, and pseudocode patterns for implementing the time conversion API. It serves as a bridge between API design and actual implementation.

---

## Part 1: Timezone Handling Implementation

### 1.1 getTimezoneInfo()

**Algorithm**:
```
function getTimezoneInfo(ianaIdentifier, date):
  1. Validate IANA identifier against supported list
  2. Look up timezone rules for given identifier
  3. Check if date falls in DST period
  4. Return TimezoneInfo with:
     - ianaIdentifier
     - standardOffsetHours
     - daylightOffsetHours (if DST exists)
     - isDaylightSavingActive (boolean)
     - abbreviation (EST, EDT, etc.)
```

**Dependencies**:
- Intl.DateTimeFormat API (browser)
- tzdata library (Node.js)
- IANA timezone database

**Implementation Approach**:
```typescript
// Option A: Use native Intl API (browsers)
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

// Option B: Use zonedTimeToUtc from date-fns-tz
// Option C: Use Temporal proposal (future)
```

### 1.2 localTimeToUTC()

**Mathematical Formula**:
```
UTC_time = Local_time - Timezone_Offset

Where:
- Timezone_Offset = standard offset + DST offset (if active)
- Positive offset → Eastern hemisphere (add to get UTC)
- Negative offset → Western hemisphere (subtract to get UTC)

Example:
  Local: 2:00 PM (14:00) in New York (UTC-5)
  UTC = 14:00 - (-5) = 14:00 + 5 = 19:00 UTC
```

**Algorithm**:
```
function localTimeToUTC(localDate, timezone):
  1. Parse timezone (string → TimezoneInfo object if needed)
  2. Get offset using getTimezoneInfo(timezone, localDate)
  3. Calculate UTC by subtracting offset
  4. Return TimeConversionResult with:
     - UTC Date object
     - offsetHours
     - unixTimestamp
     - isDaylightSavingActive flag
```

**Edge Cases to Handle**:
- DST transition ambiguities (spring forward: hour doesn't exist)
- DST transition gaps (fall back: hour occurs twice)
- Standard offset changes (rare, but happens historically)
- Invalid dates (e.g., 2:30 AM on spring-forward date)

### 1.3 convertBetweenTimezones()

**Algorithm**:
```
function convertBetweenTimezones(sourceDate, sourceZone, targetZone):
  1. sourceDate → UTC using localTimeToUTC(sourceDate, sourceZone)
  2. UTC → targetDate using utcToLocalTime(utc, targetZone)
  3. Return TimeConversionResult for target zone

Benefit: More reliable than direct offset arithmetic
```

### 1.4 detectSystemTimezone()

**Browser Implementation**:
```typescript
function detectSystemTimezone(): string {
  // Method 1: Intl API (modern browsers)
  return Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Method 2: Fallback - calculate from local offset
  // (Less reliable, may not distinguish DST)
  const offset = new Date().getTimezoneOffset();
  return findClosestTimezoneByOffset(offset);
}
```

**Note**: Returns IANA identifier like "America/New_York", not abbreviation

---

## Part 2: Julian Date Inverse Conversion

### 2.1 julianDateToGregorian()

**Mathematical Algorithm (Meeus Algorithm)** :
```
Given JD (Julian Date):

1. Calculate intermediate values:
   Z = floor(JD + 0.5)
   F = JD + 0.5 - Z

2. Handle Julian vs Gregorian calendar:
   α = floor((Z - 1867216.25) / 36524.25)
   A = Z + 1 + α - floor(α / 4)

3. Calculate day-based values:
   B = A + 1524
   C = floor((B - 122.1) / 365.25)
   D = floor(365.25 × C)
   E = floor((B - D) / 30.6001)

4. Extract date components:
   day = B - D - floor(30.6001 × E)
   month = E < 14 ? (E - 1) : (E - 13)
   year = C - 4716 if month > 2 else C - 4715

5. Calculate time from fraction F:
   dayFraction = F
   totalSeconds = F × 86400
   hour = floor(totalSeconds / 3600) mod 24
   minute = floor((totalSeconds mod 3600) / 60)
   second = totalSeconds mod 60
   millisecond = (second - floor(second)) × 1000
```

**Pseudocode Implementation**:
```typescript
function julianDateToGregorian(jd, options?): GregorianDate {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  // Gregorian calendar correction
  const alpha = Math.floor((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - Math.floor(alpha / 4);

  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? (e - 1) : (e - 13);
  const year = c - (month > 2 ? 4716 : 4715);

  // Time from fractional part
  const secondsInDay = f * 86400;
  const hour = Math.floor(secondsInDay / 3600) % 24;
  const minute = Math.floor((secondsInDay % 3600) / 60);
  const second = Math.floor(secondsInDay % 60);
  const ms = ((secondsInDay % 60) - second) * 1000;

  return { year, month, day, hour, minute, second, millisecond: ms, dayFraction: f };
}
```

**Precision Notes**:
- This algorithm is accurate to milliseconds
- For sub-millisecond precision, preserve `dayFraction`
- Inverse of getJulianDate() within floating-point precision

### 2.2 jdToISO8601()

**Algorithm**:
```
function jdToISO8601(jd, precision = 6):
  1. Use julianDateToGregorian(jd) to get components
  2. Format as: YYYY-MM-DDTHH:MM:SS.sssZ
  3. Optionally apply timezone offset
  4. Return string

Example:
  Input: 2451545.5
  Output: "2000-01-01T12:00:00.000Z"
```

---

## Part 3: Equation of Time Implementation

### 3.1 calculateEquationOfTime()

**Mathematical Formula**:
```
The Equation of Time has two main components:

1. Eccentricity component (due to Earth's elliptical orbit):
   C_e = -2.468 × sin(2λ) + 3.260 × sin(4λ) - 0.202 × sin(6λ)
   (in minutes, where λ is ecliptic longitude)

2. Obliquity component (due to axial tilt):
   C_o = 7.343 × sin(2λ) + 1.280 × sin(4λ) - 0.868 × sin(6λ)

Equation of Time = C_e + C_o

Ranges: approximately -14 minutes to +16 minutes throughout year
```

**Algorithm Outline**:
```
function calculateEquationOfTime(jd):
  1. Calculate century T = (jd - 2451545.0) / 36525.0
  2. Calculate mean longitude of sun:
     L0 = 280.4664567 + (36000.76982779 + 0.0003032028 * T) * T + ...
  3. Calculate mean anomaly:
     M = 357.52910918 + (35999.05029094 + 0.0001536667 * T) * T
  4. Calculate eccentricity component (sin terms in M)
  5. Calculate obliquity component (sin terms in 2M)
  6. Sum components and convert to minutes/seconds
  7. Return EquationOfTimeResult
```

**Implementation Source**:
- Based on NOAA Solar Position Calculator
- Or use simplified approximation for sufficient accuracy

### 3.2 calculateLocalMeanTime()

**Mathematical Formula**:
```
Local Mean Time differs from UTC by:
1. Time zone offset (standard offset + DST)
2. Equation of Time correction

LMT = UTC + (longitude / 15) hours
(where longitude is positive East, negative West)

Example:
  Longitude: 75°W (Philadelphia)
  Offset: 75 / 15 = 5 hours behind Greenwich
  12:00 UTC → 7:00 LMT
```

**Algorithm**:
```
function calculateLocalMeanTime(jd, longitudeDegrees):
  1. Calculate GMST from JD
  2. Calculate LST from GMST and longitude
  3. Extract time from LST (hours/minutes/seconds)
  4. Calculate Equation of Time for this JD
  5. Return SolarTimeData with:
     - localMeanTime
     - equationOfTime
     - metadata
```

---

## Part 4: Chinese Lunar Calendar Implementation

### 4.1 Lunar Calendar Base Algorithm

**Key Concept**: Chinese calendar is lunisolar
- Year has 12 lunar months (354 days)
- Leap month (13 months) added periodically
- Leap months follow specific rules (7 times in 19 years - Metonic cycle)
- New moon = start of month

**Algorithm Framework**:
```
Metonic Cycle (19-year pattern):
Years 1, 3, 6, 8, 11, 14, 17 have leap months
Pattern repeats every 19 years

Leap month calculation:
1. For given lunar year, check position in Metonic cycle
2. If cycle position matches leap year list, determine which month
3. Leap month is typically after month 6 (historically variable)
```

### 4.2 gregorianToChineseLunar()

**Algorithm**:
```
function gregorianToChineseLunar(gregorianDate):
  1. Find nearest new moon dates (before and after)
  2. Identify which new moon marks lunar month start
  3. Count lunar months from lunar year 1 epoch (1900 or similar reference)
  4. Determine lunar month and day
  5. Identify leap month (if applicable)
  6. Return ChineseLunarCalendarData with:
     - lunarDate
     - moon phase information
     - new/full moon dates
     - illumination percentage
```

**New Moon Calculation** (Simplified):
```
Moon phase is determined by:
angle = (sun_longitude - moon_longitude) mod 360

New Moon: angle ≈ 0° (sun and moon conjunct)
Full Moon: angle ≈ 180° (sun and moon opposite)

Lunar phase = (angle / 360) × 29.5 days (lunar month)
```

### 4.3 getLunarNewYearDate()

**Algorithm**:
```
function getLunarNewYearDate(gregorianYear):
  1. Lunar New Year is fixed: Lunar month 1, day 1
  2. Find new moon dates around expected range:
     - Usually between Jan 21 and Feb 20
  3. Return first new moon after winter solstice
     (within the expected Gregorian year)
  4. Return Date object
```

**Historical Reference Data** (Examples):
```
2024: Feb 10 (Dragon year)
2025: Jan 29 (Snake year)
2026: Feb 17 (Horse year)
...
```

---

## Part 5: Epoch Conversion Implementation

### 5.1 unixTimestampToJD()

**Mathematical Formula**:
```
Unix Epoch: 1970-01-01T00:00:00Z
JD of Unix Epoch: 2440587.5

Conversion:
JD = 2440587.5 + (unixMS / 1000 / 86400)

Where:
- unixMS: milliseconds since Unix epoch
- 1000: convert ms to seconds
- 86400: seconds in a day
```

**Pseudocode**:
```typescript
function unixTimestampToJD(unixMS: number): number {
  const JD_UNIX_EPOCH = 2440587.5;
  const secondsSinceEpoch = unixMS / 1000;
  const daysSinceEpoch = secondsSinceEpoch / 86400;
  return JD_UNIX_EPOCH + daysSinceEpoch;
}
```

### 5.2 jdToUnixTimestamp()

**Inverse Formula**:
```
unixMS = (JD - JD_UNIX_EPOCH) × 86400 × 1000

Example:
  JD = 2451545.5 (J2000.0 = 2000-01-01T12:00:00Z)
  Days since Unix: 2451545.5 - 2440587.5 = 10958 days
  Seconds: 10958 × 86400 = 946684800 seconds
  Milliseconds: 946684800 × 1000 = 946684800000 ms
```

**Pseudocode**:
```typescript
function jdToUnixTimestamp(jd: number): number {
  const JD_UNIX_EPOCH = 2440587.5;
  const daysSinceEpoch = jd - JD_UNIX_EPOCH;
  const secondsSinceEpoch = daysSinceEpoch * 86400;
  return secondsSinceEpoch * 1000;
}
```

### 5.3 epochConvert() - Multi-Format

**Algorithm**:
```
function epochConvert(unixMS, options):
  1. Calculate JD from Unix timestamp
  2. If calculateRJD: compute RJD = JD - 2451545.0
  3. If calculateMJD: compute MJD = JD - 2400000.5
  4. If calculateDJD: compute DJD = JD - 2415020.0
  5. If highPrecision: include nanosecond component
  6. Return EpochConversionResult with all requested values
```

**Constants Reference**:
```typescript
const EPOCH_CONSTANTS = {
  JD_UNIX: 2440587.5,
  JD_J2000: 2451545.0,        // 2000-01-01T12:00:00Z
  JD_EPOCH_MJD: 2400000.5,    // 1858-11-17T00:00:00Z
  JD_EPOCH_DJD: 2415020.0,    // 1900-01-01T00:00:00Z
} as const;

type EpochType = "JD" | "MJD" | "RJD" | "DJD" | "Unix";

function convertEpoch(value: number, from: EpochType, to: EpochType): number {
  // Convert to JD as intermediary
  let jd = value;
  if (from === "Unix") jd = unixTimestampToJD(value);
  else if (from === "MJD") jd = value + EPOCH_CONSTANTS.JD_EPOCH_MJD;
  else if (from === "RJD") jd = value + EPOCH_CONSTANTS.JD_J2000;
  else if (from === "DJD") jd = value + EPOCH_CONSTANTS.JD_EPOCH_DJD;

  // Convert from JD to target
  if (to === "JD") return jd;
  if (to === "Unix") return jdToUnixTimestamp(jd);
  if (to === "MJD") return jd - EPOCH_CONSTANTS.JD_EPOCH_MJD;
  if (to === "RJD") return jd - EPOCH_CONSTANTS.JD_J2000;
  if (to === "DJD") return jd - EPOCH_CONSTANTS.JD_EPOCH_DJD;
}
```

---

## Part 6: Delta T Implementation

### 6.1 calculateDeltaT() - NASA Method

**Polynomial Coefficients** (Different eras):
```
Era 1: -500 to 500 (ancient/far future)
  u = (year - 1820) / 100
  ΔT = -20 + 32 * u^2

Era 2: 500 to 1600
  u = (year - 1000) / 100
  ΔT = 1574.1 - 556.01*u - 9.20*u^2 + ...

Era 3: 1600 to 1700
  t = year - 1600
  ΔT = 120 - 0.9188*t - 0.3226*t^2 + ...

Era 4: 1700 to 1800
  t = year - 1700
  ΔT = 8.83 + 0.1603*t - 0.0059*t^2 + ...

Era 5: 1800 to 2024 (current era)
  t = year - 1820
  ΔT = -20 + 32 * (t/100)^2 + polynomial

Era 6: 2024 to 2100+ (future projection)
  ΔT = 62.92 + 0.32217 * (year - 2000) + 0.005589 * (year - 2000)^2
```

**Algorithm Outline**:
```
function calculateDeltaT(jd, options):
  1. Convert JD to Gregorian year
  2. Determine which era the year falls into
  3. Select appropriate polynomial coefficients
  4. Calculate ΔT using polynomial
  5. If includeUncertainty:
       estimate uncertainty based on era
       (historical data has higher uncertainty)
  6. Return DeltaTData
```

### 6.2 Table-Based Method

**For high accuracy over specific range** (1600-2100):
```
1. Pre-compute/store ΔT values at key points (every year or decade)
2. For query date, use:
   - Direct lookup if exact year
   - Linear interpolation between years
   - Polynomial fit within decade

Advantage: Very accurate (matches NASA tables)
Disadvantage: Requires data table (space)
```

---

## Part 7: Solar Time Functions

### 7.1 calculateSunTimes() - Sunrise/Sunset

**Algorithm Overview**:
```
This is a transcendental problem (requires iteration or approximation)

Simplified Algorithm:
1. For given date and location:
   - Calculate JD at local noon
   - Calculate sun's declination (δ)
   - Calculate sun's equation of time (E)

2. Calculate hour angle at sunrise/sunset:
   cos(H) = -tan(lat) * tan(δ) - sin(h₀) / cos(lat) / cos(δ)

   where:
   - lat = latitude
   - δ = declination
   - h₀ = -0.833° (refraction + semi-diameter)
   - H = hour angle (in degrees)

3. Convert hour angle to time:
   time = 12:00 + (H / 15) - equation_of_time

4. Apply timezone offset

5. Return sunrise and sunset times
```

**Implementation Pattern**:
```typescript
interface SunTimes {
  sunrise: Date;
  sunset: Date;
  duration: number; // in milliseconds
}

function calculateSunTimes(date, latitude, longitude, timezone?): SunTimes {
  const jd = getJulianDate(date);

  // 1. Calculate declination for this date
  const declination = calculateSunDeclination(jd);

  // 2. Calculate equation of time
  const eot = calculateEquationOfTime(jd);

  // 3. Calculate hour angle
  const refraction = 0.833; // degrees
  const cosH = -Math.tan(lat * RADS) * Math.tan(dec * RADS)
             - Math.sin(-refraction * RADS) / Math.cos(lat * RADS) / Math.cos(dec * RADS);

  if (cosH > 1 || cosH < -1) {
    return { sunrise: null, sunset: null }; // Polar night/day
  }

  const H = Math.acos(cosH) * DEGS / 15; // in hours

  // 4. Calculate times
  const sunriseHours = 12 - H - eot.hours - (longitude / 15);
  const sunsetHours = 12 + H - eot.hours - (longitude / 15);

  // 5. Convert to Date objects and apply timezone
  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseHours), ...);

  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetHours), ...);

  return { sunrise, sunset, duration: sunset - sunrise };
}
```

---

## Part 8: Type Safety Patterns

### 8.1 Branded Types (for JD, Unix timestamps)

**Motivation**: Prevent confusing JD with Unix timestamp

**Implementation**:
```typescript
// Branded types at module level
declare const JDType: unique symbol;
export type JD = number & { readonly [JDType]: true };

declare const UnixTimestampType: unique symbol;
export type UnixTimestamp = number & { readonly [UnixTimestampType]: true };

// Helper function to create branded types
function createJD(value: number): JD {
  if (value < 0 || value > 3000000) {
    throw new Error(`JD out of reasonable range: ${value}`);
  }
  return value as JD;
}

function createUnixTimestamp(value: number): UnixTimestamp {
  return value as UnixTimestamp;
}

// Usage prevents mixing:
// const jd: JD = unixTimestampToJD(1704067200000);
// const unix: UnixTimestamp = jdToUnixTimestamp(jd);
```

### 8.2 Discriminated Unions for Options

**Pattern for flexible function signatures**:
```typescript
type TimeScaleOptions =
  | { includeUncertainty?: true; method: "nasa" }
  | { includeUncertainty?: true; method: "meeus" }
  | { includeUncertainty?: false; method: "polynomial" };

function calculateDeltaT(jd: number, options?: TimeScaleOptions): DeltaTData {
  // Type system ensures valid combinations
}
```

---

## Part 9: Performance Optimization Patterns

### 9.1 Memoization for Expensive Calculations

```typescript
// Cache calculated values
class TimezoneCache {
  private static cache = new Map<string, TimezoneInfo>();

  static getTimezoneInfo(ianaId: string, date: Date): TimezoneInfo {
    const key = `${ianaId}:${date.getFullYear()}`;

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const info = computeTimezoneInfo(ianaId, date);
    this.cache.set(key, info);
    return info;
  }

  static clearCache() {
    this.cache.clear();
  }
}
```

### 9.2 Lazy Initialization

```typescript
let SUPPORTED_TIMEZONES: string[] | null = null;

export function getSupportedTimezones(): string[] {
  if (SUPPORTED_TIMEZONES === null) {
    // Load/compute only once
    SUPPORTED_TIMEZONES = loadTimezoneDatabase();
  }
  return SUPPORTED_TIMEZONES;
}
```

### 9.3 Batch Operations

```typescript
// Instead of calculating each sunrise individually
interface SunTimesMulti {
  [dateString: string]: { sunrise: Date; sunset: Date };
}

function calculateSunTimesRange(
  startDate: Date,
  endDate: Date,
  latitude: number,
  longitude: number
): SunTimesMulti {
  // Pre-compute ephemerides once
  // Iterate through date range efficiently
  // Return batch results
}
```

---

## Part 10: Testing Strategy by Domain

### 10.1 Timezone Testing

**Test Cases**:
```typescript
describe("Timezone Conversions", () => {
  // Standard cases
  test("UTC+9 (JST) conversion");
  test("UTC-5 (EST) conversion");
  test("UTC+5:30 (IST) with fractional hour");

  // DST boundaries
  test("Spring forward (2:00 AM → 3:00 AM)");
  test("Fall back (2:00 AM → 1:00 AM)");
  test("Non-existent times during spring forward");
  test("Ambiguous times during fall back");

  // Edge cases
  test("Highest offset (+14:00 UTC)");
  test("Lowest offset (-12:00 UTC)");
  test("Year/month boundaries");

  // Historical
  test("Historical timezone offset changes");
  test("Fixed timezones without DST");
});
```

### 10.2 Julian Date Testing

**Validation Against Known Epochs**:
```typescript
describe("Julian Date Conversions", () => {
  // Well-known dates
  test("J2000.0 epoch: 2000-01-01T12:00:00Z = JD 2451545.0");
  test("Unix epoch: 1970-01-01T00:00:00Z = JD 2440587.5");
  test("Gregorian calendar adoption: 1582-10-04/15");

  // Round-trip
  test("getJulianDate(date) → julianDateToGregorian() returns original");

  // Precision
  test("Sub-millisecond precision with dayFraction");
  test("Fractional vs integer JD differences");

  // Edge cases
  test("Leap seconds (if applicable)");
  test("Leap years (2000, 2024, etc.)");
  test("Leap seconds in February");
});
```

### 10.3 Lunar Calendar Testing

**Validation Against Historical Data**:
```typescript
describe("Chinese Lunar Calendar", () => {
  // Known lunar new years (verified)
  test("2024: Lunar 1/1 = Gregorian 2024-02-10");
  test("2025: Lunar 1/1 = Gregorian 2025-01-29");

  // Leap months
  test("2023 has leap month (month 2)");
  test("2026 has no leap month");

  // Moon phases
  test("New moon detected at month start");
  test("Full moon approximately 15 days in");

  // Round-trip
  test("gregorianToChineseLunar() → chineseLunarToGregorian() = original");

  // Zodiac
  test("Year zodiac animal matches expected (2024 = Dragon)");
});
```

---

## Part 11: Error Handling Patterns

### 11.1 Validation Functions

```typescript
class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    public readonly reason: string
  ) {
    super(`Invalid ${field}: ${value} (${reason})`);
  }
}

function validateTimezoneId(id: string): id is string {
  const supported = getSupportedTimezones();
  if (!supported.includes(id)) {
    throw new ValidationError("timezone", id, "not in supported list");
  }
  return true;
}

function validateJulianDate(jd: number): jd is number {
  const MIN_JD = 0; // Approx -4712-01-01
  const MAX_JD = 3000000; // Approx year 8500

  if (!Number.isFinite(jd)) {
    throw new ValidationError("jd", jd, "must be finite");
  }
  if (jd < MIN_JD || jd > MAX_JD) {
    throw new ValidationError("jd", jd, `outside range [${MIN_JD}, ${MAX_JD}]`);
  }
  return true;
}
```

### 11.2 Graceful Degradation

```typescript
// When timezone can't be determined
function detectSystemTimezone(): string {
  try {
    // Preferred: Intl API
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback: calculate from offset
    try {
      return estimateTimezoneFromOffset();
    } catch {
      // Last resort: assume UTC
      console.warn("Could not detect timezone, using UTC");
      return "UTC";
    }
  }
}
```

---

## Part 12: Constants & Reference Values

### 12.1 Mathematical Constants

```typescript
export const TIME_CONSTANTS = {
  // Time unit conversions
  MS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_DAY: 86400,
  MS_PER_DAY: 86400000,

  // Julian Date constants
  JD_UNIX_EPOCH: 2440587.5,
  JD_J2000_EPOCH: 2451545.0,
  JD_MJD_EPOCH: 2400000.5,
  JD_DJD_EPOCH: 2415020.0,

  // Astronomical constants
  DEGREES_PER_HOUR_SIDEREAL: 15,
  HOURS_PER_SIDEREAL_DAY: 23.9344696,

  // DST constants
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,

  // Lunar constants
  SYNODIC_MONTH: 29.530588861, // days
  LUNAR_MONTH_MIN: 29,
  LUNAR_MONTH_MAX: 30,
} as const;
```

### 12.2 Lookup Tables

```typescript
// DST rules by country/region
const DST_RULES: Record<string, DSTRule[]> = {
  "US_Eastern": [
    { start: { month: 3, nthDayOfWeek: 2, dayOfWeek: "Sunday" }, ... },
    { end: { month: 11, nthDayOfWeek: 1, dayOfWeek: "Sunday" }, ... }
  ],
  // ... more rules
};

// Known lunar new years (for validation/caching)
const LUNAR_NEW_YEARS: Record<number, Date> = {
  2024: new Date(2024, 1, 10), // Gregorian equivalent
  2025: new Date(2025, 0, 29),
  // ... more years
};
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up type definitions (time-conversion.types.ts)
- [ ] Implement timezone constants and utilities
- [ ] Implement Julian Date inverse functions
- [ ] Implement basic epoch conversions
- [ ] Add unit tests and validation

### Phase 2: Solar Time & Calendar
- [ ] Implement Equation of Time calculation
- [ ] Implement sunrise/sunset calculations
- [ ] Implement Chinese lunar calendar functions
- [ ] Integration tests with known data points
- [ ] Performance benchmarks

### Phase 3: Advanced Features
- [ ] Delta T implementations (NASA, Meeus, table)
- [ ] Time scale conversions
- [ ] High-precision nanosecond support
- [ ] Comprehensive documentation

### Quality Assurance
- [ ] Unit test coverage > 90%
- [ ] Integration tests against reference data
- [ ] Performance testing (target < 1ms per calculation)
- [ ] Type coverage check (100%)
- [ ] Documentation completeness check

---

## References for Implementation

### Scientific Papers & Books
- Meeus, J. (1998). Astronomical Algorithms (2nd ed.). Willmann-Bell.
- Morrison, L. V., & Stephenson, F. R. (2004). Historical values of the Earth's clock error ΔT and the calculation of eclipses.
- USNO Circular 179: "The Equation of Time"

### Web Standards & APIs
- [IANA Timezone Database](https://www.iana.org/time-zones)
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
- [ECMAScript Temporal Proposal](https://tc39.es/proposal-temporal/)

### Software Libraries (Reference Implementation)
- [date-fns](https://date-fns.org/) - Date manipulation
- [date-fns-tz](https://github.com/marnusw/date-fns-tz) - Timezone handling
- [astronomy-engine](https://github.com/cosinekitty/astronomy) - Astronomical calculations
- [SOFA Library](https://www.iausofa.org/) - Standard Observers Function Library

### Online Tools
- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/) - Validate planetary positions
- [NOAA Solar Calculator](https://www.esrl.noaa.gov/gmd/grad/solcalc/) - Validate sunrise/sunset
- [Wolfram Alpha](https://www.wolframalpha.com/) - Quick calculations

---

**End of Implementation Guide**

This guide serves as a bridge between the API specification and actual implementation. Refer back to specific sections when implementing individual domains.
