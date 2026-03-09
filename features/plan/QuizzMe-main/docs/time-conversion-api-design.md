# Time Conversion API Design Document

## Overview

This document outlines the comprehensive API design for time conversion helper functions in the QuizzMe astrology system. The API extends existing functions (`getJulianDate`, `getGMST`, `getLST`) with professional-grade time handling capabilities.

---

## Architecture & Design Philosophy

### Core Principles

1. **Separation of Concerns**: Time conversions grouped into five domain areas
2. **Type Safety**: Strong typing with TypeScript interfaces for all operations
3. **Extensibility**: Support for future additions without breaking changes
4. **Precision Control**: Options for high-precision calculations when needed
5. **Error Handling**: Clear error cases with informative messages
6. **Documentation**: Comprehensive JSDoc with examples for every function

### Function Organization

```
time-conversion API
├── Timezone Handling (7 functions)
├── Julian Date Inverse (5 functions)
├── Solar Time Calculations (8 functions)
├── Chinese Lunar Calendar (10 functions)
├── Epoch Conversions (8 functions)
├── Delta Time (ΔT) (5 functions)
├── Time Scale Conversions (4 functions)
└── Utility & Helpers (12 functions)
```

**Total: 59 Function Signatures**

---

## Domain Areas

### 1. Timezone Handling

**Purpose**: Convert between local time and UTC with proper DST handling

**Key Functions**:
- `getTimezoneInfo()` - Retrieve timezone metadata
- `localTimeToUTC()` / `utcToLocalTime()` - Bidirectional conversion
- `getUTCOffset()` - Get offset for specific date
- `convertBetweenTimezones()` - Direct timezone-to-timezone conversion
- `detectSystemTimezone()` - Client-side timezone detection
- `getSupportedTimezones()` - List available timezones

**Use Cases**:
- User enters birth time in local timezone
- Application needs to convert to UTC for astronomical calculations
- Display results in user's preferred timezone
- Support for international users across different timezones

**Design Notes**:
- Uses IANA timezone identifiers (standard, widely supported)
- Accounts for DST transitions
- Immutable - returns new TimeConversionResult objects
- Caches DST rules for performance

---

### 2. Julian Date Inverse Conversion

**Purpose**: Inverse of existing `getJulianDate()` - convert JD back to Gregorian

**Key Functions**:
- `julianDateToGregorian()` - Full conversion with all components
- `jdToDate()` - Convenience wrapper returning Date object
- `jdToISO8601()` - Format as ISO 8601 string
- `getTimeFromJD()` / `getDateFromJD()` - Extract specific components

**Use Cases**:
- Display astronomical calculations in human-readable format
- Debug/verify astronomical calculations
- Export results in standard formats
- Create calendar representations

**Design Notes**:
- Preserves precision through optional `dayFraction` field
- Supports timezone-aware output via options
- Efficient algorithms (no iterative refinement)
- Meeus algorithm variants for different accuracy needs

---

### 3. Solar Time Calculations

**Purpose**: Handle solar time concepts (LMT, LAT, Equation of Time)

**Key Functions**:
- `calculateEquationOfTime()` - Time difference (Mean vs Apparent Solar Time)
- `calculateLocalMeanTime()` - LMT based on longitude
- `calculateLocalApparentTime()` - LAT (True Solar Time)
- `calculateSunTimes()` - Sunrise/sunset times
- `calculateSolarNoon()` - Time of culmination
- `calculateCivilTwilight()` / `calculateNauticalTwilight()` / `calculateAstronomicalTwilight()`

**Use Cases**:
- Calculate sunrise/sunset for birth location
- Determine local solar time from geographic coordinates
- Find solar noon (true noon, not clock time)
- Calculate twilight periods for astrological interpretations
- Account for variations throughout the year

**Design Notes**:
- Equation of Time ranges -14 to +16 minutes
- High precision (~±0.05 minutes accuracy)
- Accounts for atmospheric refraction
- Returns comprehensive SolarTimeData objects with metadata

---

### 4. Chinese Lunar Calendar

**Purpose**: Handle lunisolar calendar conversions and calculations

**Key Functions**:
- `gregorianToChineseLunar()` - Convert Gregorian to lunar date
- `chineseLunarToGregorian()` - Inverse conversion
- `getLunarNewYearDate()` - Spring Festival date
- `calculateChineseLunarCalendarData()` - Complete calendar data
- `getLunarMonthBoundaries()` - Month start/end dates
- `getLeapMonthInfo()` - Leap month detection
- `findNewMoonBefore()` / `findNewMoonAfter()` - Moon phase calculations
- `calculateLunarAge()` - Days into lunar month
- `getChineseZodiacFromLunarYear()` - Integration with existing zodiac

**Use Cases**:
- Calculate Chinese zodiac from birth date (more accurate than year alone)
- Display lunar calendar equivalent
- Determine lunar phase at birth
- Astrological interpretations based on lunar cycles
- Find Chinese New Year for styling/messaging

**Design Notes**:
- Lunisolar calendar: ~354 days/year with periodic leap months
- Leap months occur 7 times in 19-year Metonic cycle
- Uses astronomical calculations for new moon dates (highest accuracy)
- Lunar age determines moon phase interpretation

---

### 5. Epoch Conversions

**Purpose**: Convert between Unix timestamps and various astronomical epochs

**Key Functions**:
- `unixTimestampToJD()` / `jdToUnixTimestamp()` - Primary conversions
- `unixTimestampToDate()` / `dateToUnixTimestamp()` - Date convenience wrappers
- `epochConvert()` - Comprehensive multi-format conversion
- `getModifiedJulianDate()` / `getReducedJulianDate()` / `getDublinJulianDate()` - Variants
- `getJulianDayNumber()` - Integer JD

**Supported Epochs**:
- **JD** (Julian Date): Standard astronomical epoch
  - Epoch: -4712-01-01 12:00:00
  - Formula: JD = 2451545.0 + seconds / 86400 at J2000.0

- **MJD** (Modified Julian Date): JD - 2400000.5
  - Epoch: 1858-11-17 00:00:00
  - Smaller numbers, easier to work with

- **RJD** (Reduced Julian Date): JD - 2451545.0
  - Epoch: 2000-01-01 12:00:00 (J2000.0)
  - Centered on modern era, smaller decimals

- **DJD** (Dublin Julian Date): JD - 2415020.0
  - Epoch: 1900-01-01 00:00:00
  - Historical astronomical convention

- **Unix Time**: Seconds/milliseconds since 1970-01-01 00:00:00 UTC
  - Standard for computing systems
  - Universal reference point

**Use Cases**:
- Store timestamps in database
- API communication with standard Unix time
- High-precision calculations with JD
- Historical astronomical data lookup
- Comparative epoch analysis

**Design Notes**:
- Conversion factors are well-established mathematical constants
- Optional high-precision nanosecond tracking for future extensions
- Efficient single-pass calculations

---

### 6. Delta Time (ΔT) Calculations

**Purpose**: Handle the difference between Terrestrial Time (TT) and Universal Time (UT)

**Key Functions**:
- `calculateDeltaT()` - Main calculation with method selection
- `getDeltaTFromTimestamp()` - Convenience wrapper
- `utcToTT()` / `ttToUTC()` - Time scale conversions
- `getDeltaTPolynomial()` - Polynomial approximations for extreme dates

**Why Delta T Matters**:
- Earth's rotation is slowing (~1 ms/century)
- TT is uniform; UT varies with Earth rotation
- Critical for historical eclipse calculations
- Required for precise astrological calculations over long periods
- Ranges: ~33 seconds (modern), up to minutes (historical)

**Supported Methods**:
1. **NASA** (default): SOFA/Meeus polynomial, best for 1600-2100
2. **Meeus**: Historical polynomial coefficients
3. **Table**: Lookup table for precise historical values
4. **Polynomial**: Custom polynomial for extreme dates

**Use Cases**:
- Correct astronomical calculations for precise times
- Historical horoscope calculations
- Long-range transit predictions
- Academic/research accuracy
- Legacy system compatibility

**Design Notes**:
- Polynomial-based for efficiency
- Handles uncertainty estimates
- Different algorithms for different time periods
- Can extrapolate to past/future with decreasing accuracy

---

### 7. Time Scale Conversions

**Purpose**: Convert between different astronomical time scales

**Time Scales Supported**:
- **UTC**: Civil timescale (basis for wall clocks)
- **UT**: Raw Earth rotation (UTC with leap seconds)
- **TT**: Uniform time (TT = UTC + ΔT)
- **TAI**: International Atomic Time (UTC + 37 seconds as of 2024)
- **GPS**: GPS System Time (TAI - 19 seconds)
- **TCG/TCB**: Coordinate time scales (relativistic corrections)
- **LMT**: Local Mean Time (based on longitude)
- **LAT**: Local Apparent Time (True Solar Time)

**Conversion Matrix**:
```
                UTC      TT       TAI      GPS      LMT      LAT
UTC             —        ΔT       +37s     +56s     lon/15   +eot
TT              -ΔT      —        +37-ΔT   +56-ΔT   —        —
TAI             -37      -37+ΔT   —        -19s     —        —
GPS             -56      -56+ΔT   +19      —        —        —
LMT             -lon/15  —        —        —        —        +eot
LAT             -eot     —        —        —        -eot     —
```

**Key Functions**:
- `convertTimeScale()` - Generic conversion between any scales
- `getTimeScaleOffset()` - Get offset in seconds
- `isTimeScaleOffsetConstant()` - Check if offset varies over time

**Use Cases**:
- Integration with ephemeris libraries
- Precise positional astronomy
- System compatibility (some systems use TAI, others GPS)
- Educational/research accuracy
- Future relativistic precision needs

**Design Notes**:
- Some conversions are constant (defined by standards)
- Some vary with time (e.g., UTC-UT due to Earth rotation)
- TCG/TCB require relativistic corrections (rarely needed)
- Maintains conversion matrix for lookups

---

### 8. Utility & Helper Functions

**Purpose**: Common operations for time handling and formatting

**Categories**:

**Time Conversion Utilities**:
- `decimalDayToTime()` / `timeToDecimalDay()` - Fractional day ↔ TimeOfDay
- `calculateTimeDifference()` - Multi-unit time span

**Formatting**:
- `formatTimeOfDay()` - Format time as string
- `formatGregorianDate()` - Format date with multiple styles
- Supports ISO, LONG, SHORT formats

**Validation**:
- `isValidDate()` - Type guard for Date objects
- `isValidJD()` - Check JD within reasonable bounds

**Age & Anniversary**:
- `calculateAge()` - Age from birth date
- `getNextDateOccurrence()` - Next birthday/anniversary
- `getPreviousDateOccurrence()` - Previous occurrence

**DST Utilities**:
- `isDaylightSavingActive()` - Check DST for timezone
- `getNextDSTTransition()` / `getPreviousDSTTransition()` - DST transition dates

**Comparison**:
- `compareGregorianDates()` - Compare two dates with -1/0/1 result

**Use Cases**:
- Format output for UI display
- Calculate user age for profile
- Track anniversary dates
- Find next DST transition for scheduling
- Validate user inputs
- Internal calculations with normalized time values

---

## Type System Overview

### Core Interfaces

```typescript
// Simple data types
interface TimeOfDay {
  hour: number;
  minute: number;
  second: number;
  millisecond?: number;
}

interface GregorianDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  dayFraction: number; // For sub-millisecond precision
}

// Complex result types
interface TimeConversionResult {
  date: Date;
  offsetHours: number;
  unixTimestamp: number;
  isDaylightSavingActive: boolean;
}

// Timezone handling
interface TimezoneInfo {
  ianaIdentifier: string;
  standardOffsetHours: number;
  daylightOffsetHours?: number;
  isDaylightSavingActive: boolean;
  abbreviation: string;
}

// Options for flexibility
interface JulianDateInverseOptions {
  includeMilliseconds?: boolean;
  includeFraction?: boolean;
  timezone?: TimezoneInfo;
}
```

### Error Handling Strategy

**Error Cases to Implement**:
```typescript
// Invalid timezone
throw new Error(`Unsupported timezone: ${ianaIdentifier}`);

// Invalid lunar date
throw new Error(`Invalid lunar date: year ${y}, month ${m}, day ${d}`);

// Invalid JD range
if (!isValidJD(jd)) throw new Error("Julian Date outside supported range");

// Invalid date for operation
if (!isValidDate(date)) throw new TypeError("Expected Date object");
```

---

## Implementation Priorities

### Phase 1 (Essential for MVP):
1. Timezone handling (7 functions)
2. Julian Date inverse (5 functions)
3. Epoch conversions - basic (5 functions)
4. Utilities - formatting & validation (6 functions)

### Phase 2 (Required for full features):
1. Solar time calculations (8 functions)
2. Chinese lunar calendar (10 functions)
3. Delta Time calculations (5 functions)

### Phase 3 (Advanced features):
1. Time scale conversions (4 functions)
2. Advanced utilities (6 functions)
3. High-precision nanosecond support

---

## Performance Considerations

### Caching Strategy
```typescript
// Cache DST rules per timezone per year
private static dstRuleCache: Map<string, DSTRuleMap> = new Map();

// Cache polynomial coefficients
private static polynomialCache: Map<number, Polynomial> = new Map();

// Cache supported timezones list
private static supportedTimezones: string[] | null = null;
```

### Computation Complexity
- **Fast** (O(1)): Timezone offset, JD conversions, epoch conversions, time scales
- **Medium** (O(log n)): Lunar date calculations, DST lookups, timezone searches
- **Slow** (O(n)): Sunrise/sunset (iterative), DST transition searches

### Optimization Tips
- Pre-compute sunrise/sunset arrays for common locations
- Cache timezone data after first lookup
- Use polynomial approximations instead of tables where possible
- Avoid repeated Julian Date calculations in loops

---

## Integration with Existing Code

### Existing Functions to Preserve
```typescript
// Keep these unchanged
getJulianDate(date: Date): number
getGMST(jd: number): number
getLST(extraHours: number, longitude: number): number
```

### Dependencies on New API
```typescript
// In compute.ts - uses new functions
computeAstro(input: BirthInput): AstroResult {
  // Convert local birth time to UTC
  const utcDate = localTimeToUTC(localDate, timezone);
  const jd = getJulianDate(utcDate);

  // Get lunar date for Chinese zodiac
  const lunarData = gregorianToChineseLunar(input.date);

  // Calculate sunrise/sunset for birth location
  const { sunrise, sunset } = calculateSunTimes(
    input.date,
    input.place.lat,
    input.place.lng
  );
}
```

---

## Testing Strategy

### Unit Test Categories
1. **Conversion Accuracy**: Validate against known astronomical data
2. **Edge Cases**: Leap years, leap seconds, DST transitions, year boundaries
3. **Round-trip**: Convert A→B→A and verify result
4. **Type Safety**: Ensure TypeScript prevents invalid combinations
5. **Performance**: Benchmark critical paths

### Test Data Sources
- JPL Horizons System (planetary positions, times)
- NOAA Solar Calculators (sunrise/sunset)
- Meeus "Astronomical Algorithms" worked examples
- Chinese lunar calendar references
- SOFA library reference implementations

### Example Tests
```typescript
describe("Timezone Handling", () => {
  it("converts local time to UTC correctly with DST", () => {
    const local = new Date("2024-06-15T14:30:00");
    const result = localTimeToUTC(local, "America/New_York");
    expect(result.offsetHours).toBe(-4); // EDT
  });

  it("handles DST transitions correctly", () => {
    // Spring forward: 2024-03-10 02:00:00 EST → 03:00:00 EDT
    const local = new Date("2024-03-10T02:30:00");
    const result = localTimeToUTC(local, "America/New_York");
    // Should handle ambiguity appropriately
  });
});

describe("Julian Date Inverse", () => {
  it("inverts getJulianDate correctly", () => {
    const original = new Date("2000-01-01T12:00:00Z");
    const jd = getJulianDate(original);
    const result = jdToDate(jd);
    expect(result.getTime()).toBeCloseTo(original.getTime(), -3);
  });

  it("preserves sub-millisecond precision with dayFraction", () => {
    const jd = 2451545.50001;
    const result = julianDateToGregorian(jd, { includeFraction: true });
    expect(result.dayFraction).toBeDefined();
  });
});

describe("Lunar Calendar", () => {
  it("correctly identifies Chinese New Year 2024", () => {
    const cny = getLunarNewYearDate(2024);
    expect(cny.toISOString().split("T")[0]).toBe("2024-02-10");
  });

  it("converts between Gregorian and lunar consistently", () => {
    const original = new Date("2024-02-10");
    const lunar = gregorianToChineseLunar(original);
    const back = chineseLunarToGregorian(
      lunar.lunarDate.lunarYear,
      lunar.lunarDate.lunarMonth,
      lunar.lunarDate.lunarDay
    );
    // Should be within 1 day (start of lunar day)
    expect(Math.abs(back.getTime() - original.getTime())).toBeLessThan(86400000);
  });
});
```

---

## Documentation Requirements

### For Each Function:
1. **Summary**: One-line description
2. **Parameters**: Type, range, units, defaults
3. **Returns**: Type, range, units, meaning
4. **Throws**: What errors can be thrown
5. **Remarks**: Algorithm details, precision, limitations
6. **Examples**: Real usage with expected output
7. **See Also**: Related functions

### Module Documentation:
1. Overview of purpose
2. Architecture diagram (domain areas)
3. Key concepts explained
4. Common workflows
5. Performance guidelines
6. References (standards, papers, links)

---

## References & Standards

### Astronomical Standards
- **Meeus, Jean**: "Astronomical Algorithms" (2nd ed., 1998)
- **SOFA Library**: Standard Observers Function Library (ESA/IAU)
- **USNO Circular 179**: Delta T calculations
- **IAU Standards**: Time scales, precession models

### Timezone & Calendar
- **IANA Timezone Database**: tzdata, maintained by volunteers
- **ISO 8601**: Date and time representation
- **Chinese Calendar**: Traditional lunisolar system
- **RFC 5545**: iCalendar format (interoperability reference)

### Web Standards
- **ECMAScript**: Temporal proposal for better time handling
- **Intl API**: Internationalization (DateTimeFormat, RelativeTimeFormat)
- **WebAssembly**: For performance-critical calculations

---

## Future Extensions

### Planned Enhancements
1. **Nanosecond Precision**: High-precision timestamp support
2. **Custom Ephemeris**: Load alternative planetary position tables
3. **Relativistic Corrections**: TCG/TCB for extreme precision
4. **Leap Second Handling**: Explicit support for leap seconds
5. **Historical Calendars**: Julian calendar, Islamic calendar
6. **Temporal Proposal**: When standardized, migrate to native implementation
7. **Timezone DST Rules**: Custom rule support for non-standard regions

### Backward Compatibility
- All extensions maintain existing function signatures
- New features added as optional parameters
- Deprecated functions flagged but kept functional for 2 versions

---

## Glossary

- **JD** (Julian Date): Astronomical epoch, days since -4712-01-01
- **ΔT** (Delta T): Difference between TT and UT (seconds)
- **UTC**: Coordinated Universal Time (civil timescale)
- **TT**: Terrestrial Time (uniform, used for ephemerides)
- **DST**: Daylight Saving Time (regional time adjustment)
- **LST**: Local Sidereal Time (Earth rotation based)
- **LAT**: Local Apparent Time (True Solar Time, based on sun position)
- **LMT**: Local Mean Time (based on mean sun)
- **Equation of Time**: Difference between apparent and mean solar time
- **Ephemeris**: Table of celestial body positions vs time
- **Lunisolar**: Calendar based on both moon phases and solar year
- **Metonic Cycle**: 19-year period where lunar and solar calendars align

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-03 | Initial design for time conversion API |
| — | — | — |

---

## Approval & Sign-off

**Design Status**: Ready for Phase 1 implementation

**Reviewed By**: System Architecture Team

**Next Steps**:
1. Implement Phase 1 functions (priorities listed above)
2. Create comprehensive test suite
3. Benchmark performance on target platforms
4. Integrate with existing astro module
