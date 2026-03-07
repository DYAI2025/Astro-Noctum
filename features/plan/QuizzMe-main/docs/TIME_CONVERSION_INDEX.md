# Time Conversion API - Quick Reference Index

## Document Map

### 1. Type Definitions & API Contract
**File**: `/src/lib/astro/time-conversion.types.ts`
**Content**:
- 14 TypeScript interface/type definitions
- 59 function signatures with full JSDoc
- Error handling types
- Options objects for function variations

**Quick Links to Functions by Category**:
- Timezone: Lines 153-217 | 7 functions
- Julian Inverse: Lines 220-296 | 5 functions
- Solar Time: Lines 299-464 | 8 functions
- Lunar Calendar: Lines 467-598 | 10 functions
- Epoch: Lines 601-745 | 8 functions
- Delta Time: Lines 748-829 | 5 functions
- Time Scales: Lines 832-887 | 4 functions
- Utilities: Lines 890-1098 | 12 functions

---

### 2. Architecture & Design Document
**File**: `/docs/time-conversion-api-design.md`
**Content**:
- High-level design philosophy (7 principles)
- Function organization (architecture diagram)
- Domain-by-domain breakdown (8 sections)
- Type system overview
- Integration with existing code
- Testing strategy
- Performance considerations
- References and standards

**Key Sections**:
- **Architecture**: Page 2-3 | System overview and function grouping
- **Timezone Handling**: Page 4-5 | Use cases and design notes
- **Julian Date Inverse**: Page 6 | Purposes and applications
- **Solar Time**: Page 7 | Calculations and accuracy
- **Lunar Calendar**: Page 8-9 | Lunisolar system and uses
- **Epoch Conversions**: Page 10 | Multiple epoch formats
- **Delta Time**: Page 11 | Earth rotation variations
- **Type System**: Page 13 | Interface definitions
- **Implementation Priorities**: Page 14 | Phases and timeline

---

### 3. Implementation Guide
**File**: `/docs/time-conversion-implementation-guide.md`
**Content**:
- Algorithm outlines and pseudocode
- Mathematical formulas (from authoritative sources)
- Implementation patterns
- Performance optimization techniques
- Error handling strategies
- Testing patterns with example test cases
- Constants and reference values

**Algorithm Coverage**:
- **Part 1**: Timezone Handling (4 algorithms)
- **Part 2**: Julian Date Inverse (2 algorithms)
- **Part 3**: Equation of Time (2 algorithms)
- **Part 4**: Lunar Calendar Base (3 algorithms)
- **Part 5**: Epoch Conversion (3 algorithms)
- **Part 6**: Delta T (2 algorithms)
- **Part 7**: Solar Times (1 algorithm)
- **Part 8-12**: Types, Testing, Error Handling, Constants, Checklist

**Mathematical Formulas**:
- UTC/Local conversion (1.2)
- Gregorian date from JD (2.1, Meeus Algorithm)
- Equation of Time (3.1)
- Epoch conversions (5.1-5.2)
- Delta T polynomial (6.1)

---

### 4. Executive Summary
**File**: `/docs/TIME_CONVERSION_API_SUMMARY.md`
**Content**:
- Project overview
- Architecture diagram
- Key design decisions
- Integration guidance
- Type system highlights
- Function complexity analysis
- Testing requirements
- Implementation phases
- Success criteria

**Best For**: Quick understanding, stakeholder presentation, timeline planning

---

## Function Directory

### Timezone Handling (7 functions)
| Function | File | Purpose |
|----------|------|---------|
| `getTimezoneInfo()` | types.ts:156 | Get timezone metadata |
| `localTimeToUTC()` | types.ts:176 | Convert local to UTC |
| `utcToLocalTime()` | types.ts:198 | Convert UTC to local |
| `getUTCOffset()` | types.ts:218 | Get offset for timezone |
| `convertBetweenTimezones()` | types.ts:234 | Direct timezone conversion |
| `detectSystemTimezone()` | types.ts:251 | Detect system timezone |
| `getSupportedTimezones()` | types.ts:267 | List all supported zones |

**Implementation Guide**: Part 1 (pages 2-5)

---

### Julian Date Inverse (5 functions)
| Function | File | Purpose |
|----------|------|---------|
| `julianDateToGregorian()` | types.ts:320 | JD to detailed Gregorian |
| `jdToDate()` | types.ts:342 | JD to Date object |
| `jdToISO8601()` | types.ts:360 | JD to ISO string |
| `getTimeFromJD()` | types.ts:376 | Extract time from JD |
| `getDateFromJD()` | types.ts:394 | Extract date from JD |

**Implementation Guide**: Part 2 (pages 6-7)
**Algorithm**: Meeus Algorithm with Gregorian correction

---

### Solar Time Calculations (8 functions)
| Function | File | Purpose |
|----------|------|---------|
| `calculateEquationOfTime()` | types.ts:419 | Mean vs Apparent solar time |
| `calculateLocalMeanTime()` | types.ts:451 | LMT from longitude |
| `calculateLocalApparentTime()` | types.ts:476 | LAT/True solar time |
| `calculateSunTimes()` | types.ts:507 | Sunrise/sunset times |
| `calculateSolarNoon()` | types.ts:537 | Solar culmination time |
| `calculateCivilTwilight()` | types.ts:558 | Civil twilight (-6°) |
| `calculateNauticalTwilight()` | types.ts:577 | Nautical twilight (-12°) |
| `calculateAstronomicalTwilight()` | types.ts:596 | Astronomical twilight (-18°) |

**Implementation Guide**: Part 3 (pages 8-9) and Part 7 (pages 24-26)

---

### Chinese Lunar Calendar (10 functions)
| Function | File | Purpose |
|----------|------|---------|
| `gregorianToChineseLunar()` | types.ts:627 | Gregorian to lunar date |
| `chineseLunarToGregorian()` | types.ts:654 | Lunar to Gregorian |
| `getLunarNewYearDate()` | types.ts:679 | Spring Festival date |
| `calculateChineseLunarCalendarData()` | types.ts:704 | Complete lunar data |
| `getLunarMonthBoundaries()` | types.ts:729 | Month start/end dates |
| `getLeapMonthInfo()` | types.ts:754 | Leap month detection |
| `findNewMoonBefore()` | types.ts:777 | New moon before date |
| `findNewMoonAfter()` | types.ts:796 | New moon after date |
| `calculateLunarAge()` | types.ts:816 | Days into lunar month |
| `getChineseZodiacFromLunarYear()` | types.ts:837 | Zodiac animal for year |

**Implementation Guide**: Part 4 (pages 10-13)
**Design Notes**: Lunisolar calendar, Metonic cycle, leap months

---

### Epoch Conversions (8 functions)
| Function | File | Purpose |
|----------|------|---------|
| `unixTimestampToJD()` | types.ts:872 | Unix to Julian Date |
| `jdToUnixTimestamp()` | types.ts:889 | Julian Date to Unix |
| `unixTimestampToDate()` | types.ts:906 | Unix to Date object |
| `dateToUnixTimestamp()` | types.ts:922 | Date to Unix timestamp |
| `epochConvert()` | types.ts:945 | Multi-format conversion |
| `getModifiedJulianDate()` | types.ts:968 | Get MJD from Unix |
| `getReducedJulianDate()` | types.ts:988 | Get RJD from Unix |
| `getDublinJulianDate()` | types.ts:1007 | Get DJD from Unix |

**Implementation Guide**: Part 5 (pages 14-19)
**Epoch Formats**:
- JD (Julian Date): Primary astronomical epoch
- MJD (Modified JD): JD - 2400000.5
- RJD (Reduced JD): JD - 2451545.0 (J2000.0)
- DJD (Dublin JD): JD - 2415020.0 (1900)

---

### Delta Time (ΔT) Calculations (5 functions)
| Function | File | Purpose |
|----------|------|---------|
| `calculateDeltaT()` | types.ts:1064 | Main ΔT calculation |
| `getDeltaTFromTimestamp()` | types.ts:1093 | ΔT from Unix timestamp |
| `utcToTT()` | types.ts:1112 | UTC to Terrestrial Time |
| `ttToUTC()` | types.ts:1130 | TT to UTC |
| `getDeltaTPolynomial()` | types.ts:1148 | Polynomial approximation |

**Implementation Guide**: Part 6 (pages 20-23)
**Importance**: Earth's rotation slowing over time, critical for historical accuracy

---

### Time Scale Conversions (4 functions)
| Function | File | Purpose |
|----------|------|---------|
| `convertTimeScale()` | types.ts:1200 | Between any time scales |
| `getTimeScaleOffset()` | types.ts:1228 | Offset in seconds |
| `isTimeScaleOffsetConstant()` | types.ts:1250 | Check if constant |
| `getSupportedTimeScales()` | types.ts:1270 | List all scales |

**Supported Scales**:
- UTC, UT, TT, TAI, GPS, TCG, TCB, LMT, LAT

---

### Utility & Helper Functions (12 functions)
| Function | File | Purpose |
|----------|------|---------|
| `decimalDayToTime()` | types.ts:1296 | Fraction to TimeOfDay |
| `timeToDecimalDay()` | types.ts:1313 | TimeOfDay to fraction |
| `formatTimeOfDay()` | types.ts:1330 | Format time as string |
| `formatGregorianDate()` | types.ts:1349 | Format date as string |
| `calculateTimeDifference()` | types.ts:1370 | Time span calculation |
| `isValidDate()` | types.ts:1394 | Validate Date object |
| `isValidJD()` | types.ts:1411 | Validate Julian Date |
| `calculateAge()` | types.ts:1431 | Age from birthdate |
| `getNextDateOccurrence()` | types.ts:1453 | Next birthday/anniversary |
| `getPreviousDateOccurrence()` | types.ts:1474 | Previous occurrence |
| `isDaylightSavingActive()` | types.ts:1495 | Check DST for timezone |
| `compareGregorianDates()` | types.ts:1536 | Compare two dates |

**Implementation Guide**: Part 8-12 (pages 27-35)

---

## Interface Reference

### Time Data Structures
```typescript
TimeOfDay              types.ts:107
GregorianDate          types.ts:124
TimezoneInfo           types.ts:40
TimeConversionResult   types.ts:59
SolarTimeData          types.ts:170
EquationOfTimeResult   types.ts:191
ChineseLunarDate       types.ts:215
ChineseLunarCalendarData types.ts:233
LunarMonthBoundaries   types.ts:257
```

### Options Objects
```typescript
JulianDateInverseOptions    types.ts:149
EpochConversionOptions      types.ts:334
DeltaTOptions               types.ts:372
DeltaTData                  types.ts:351
TimeScaleConversion         types.ts:407
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
**Functions**: 23 (39% of total)
- Timezone handling (7)
- Julian Date inverse (5)
- Epoch basics (5)
- Utilities (6)

**Dependencies**: IANA timezone data, Meeus algorithm
**Testing**: Unit tests, round-trip validation

### Phase 2: Core Features (Weeks 4-7)
**Functions**: 21 (36% of total)
- Solar time (8)
- Lunar calendar (10)
- Advanced epochs (3)

**Dependencies**: Astronomical references, lunar tables
**Testing**: Reference data validation (NOAA, JPL)

### Phase 3: Advanced (Weeks 8-10)
**Functions**: 15 (25% of total)
- Delta Time (5)
- Time scales (4)
- Nanosecond support (6)

**Dependencies**: SOFA library, Delta T tables
**Testing**: Precision benchmarks, historical validation

---

## Key Formulas Reference

### Timezone Conversion
```
UTC = Local - Offset
Local = UTC + Offset
```

### Julian Date Inverse (Meeus)
See **Implementation Guide Part 2** for full Meeus Algorithm

### Equation of Time
```
EoT = Eccentricity Component + Obliquity Component
Range: -14 to +16 minutes throughout year
```

### Epoch Conversions
```
JD = 2440587.5 + (unixMS / 1000 / 86400)
MJD = JD - 2400000.5
RJD = JD - 2451545.0
DJD = JD - 2415020.0
```

### Lunar Calendar (Metonic Cycle)
```
19-year cycle with leap months on years: 1, 3, 6, 8, 11, 14, 17
Lunar month = ~29.5 days (new moon to new moon)
```

---

## Testing Resources

### Reference Data Sources
- **JPL Horizons**: Planetary positions
- **NOAA Solar Calculator**: Sunrise/sunset
- **Meeus "Astronomical Algorithms"**: Worked examples
- **IANA tzdata**: Timezone rules
- **Chinese calendar**: Historical lunar data

### Test Coverage Target
- Unit tests: 90%+
- Integration tests: 80%+
- Type coverage: 100%
- Performance benchmarks: Documented

---

## Performance Targets

| Category | Target | Notes |
|----------|--------|-------|
| O(1) functions | < 0.1ms | Timezone offset, epoch conversions |
| O(log n) functions | < 1ms | Timezone lookups, lunar calculations |
| Iterative functions | < 10ms | Sunrise/sunset, DST transitions |
| Batch operations | N/A | Implement for multi-date scenarios |

---

## Integration Checklist

- [ ] Review type definitions (types.ts)
- [ ] Review architecture document
- [ ] Review implementation guide
- [ ] Validate against compute.ts integration points
- [ ] Create test infrastructure
- [ ] Implement Phase 1
- [ ] Validate Phase 1 with unit tests
- [ ] Implement Phase 2
- [ ] Validate with reference data
- [ ] Implement Phase 3
- [ ] Performance benchmarking
- [ ] Documentation review
- [ ] Code review & sign-off

---

## Document Maintenance

**Last Updated**: 2024-01-03
**Status**: Ready for implementation
**Maintainer**: System Architecture Team

### When Adding New Functions
1. Update type definitions (types.ts)
2. Add to implementation guide with algorithm
3. Update this index
4. Add test cases to test suite
5. Update summary with metrics

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-03 | Initial design and specification |

---

## Frequently Asked Questions

**Q: Which functions are critical for MVP?**
A: Phase 1 functions (23 total) - timezone, JD inverse, basic epochs, utilities.

**Q: Do we need to implement all 59 functions at once?**
A: No. Implement in three phases (3 weeks each). Start with Phase 1.

**Q: Can I use this without modifying existing astronomy.ts?**
A: Yes. The API is fully backward compatible and extends existing functions.

**Q: Where are the actual implementations?**
A: Not included in this design. This is the API contract and design document.

**Q: How do I handle DST edge cases?**
A: See implementation guide Part 1.2 and error handling section.

**Q: What about high-precision nanosecond timestamps?**
A: Phase 3 feature with HighPrecisionTimestamp interface (optional).

---

## Quick Start for Developers

1. **Start here**: `/docs/TIME_CONVERSION_API_SUMMARY.md`
2. **Read next**: `/docs/time-conversion-api-design.md` (your domain section)
3. **For implementation**: `/docs/time-conversion-implementation-guide.md` (specific algorithms)
4. **Reference contracts**: `/src/lib/astro/time-conversion.types.ts` (function signatures)
5. **Write tests**: Use patterns from Implementation Guide Part 10

---

**End of Index**

For questions or clarifications, refer to the main documents or contact the system architecture team.
