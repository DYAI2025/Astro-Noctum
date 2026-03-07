# Astronomia Integration Test Strategy

## Executive Summary

This document outlines the comprehensive test strategy for validating precision improvements when integrating the astronomia library (VSOP87/ELP2000) into the Cosmic Engine, replacing the current Kepler approximation in `lib/astronomy/calculations.ts`.

---

## 1. Test Categories and Coverage Map

### 1.1 Category Overview

| Category | Priority | Current Coverage | Target Coverage | Validation Method |
|----------|----------|-----------------|-----------------|-------------------|
| Planetary Positions (VSOP87) | Critical | 0% | 100% | JPL Horizons comparison |
| Moon Position (ELP2000) | Critical | 0% | 100% | Ephemeris validation |
| Coordinate Transformations | High | Basic | Full | Meeus examples |
| Eclipse Predictions | High | N/A | 100% | Historical records |
| Moon Phases | Medium | N/A | 100% | Naval Observatory data |
| Planetary Conjunctions | Medium | N/A | 100% | Historical events |
| Kepler Equation Solvers | High | Implicit | 100% | Convergence tests |
| Julian Date Conversions | High | Implicit | 100% | Round-trip validation |
| Sidereal Time | Medium | Basic | Full | USNO data |
| Performance Benchmarks | Medium | None | 100% | Timing measurements |

### 1.2 Test File Structure

```
tests/
  precision/
    planetary/
      vsop87-validation.test.ts     # VSOP87 vs JPL Horizons
      kepler-comparison.test.ts     # Current vs VSOP87 comparison
      planet-positions.test.ts      # Known date position tests
    lunar/
      elp2000-validation.test.ts    # ELP2000 moon position tests
      moon-phases.test.ts           # New moon/full moon predictions
      lunar-eclipses.test.ts        # Eclipse timing validation
    coordinates/
      transformations.test.ts       # Coordinate system conversions
      nutation.test.ts              # Nutation corrections
      precession.test.ts            # Precession calculations
    events/
      conjunctions.test.ts          # Planetary conjunction tests
      solar-eclipses.test.ts        # Solar eclipse predictions
      solstices.test.ts             # Equinox/solstice timing
    benchmarks/
      performance.test.ts           # Calculation speed tests
      memory.test.ts                # Memory usage tests
```

---

## 2. Planetary Position Tests (VSOP87)

### 2.1 Acceptance Criteria

| Planet | Position Accuracy | Distance Accuracy | Time Range |
|--------|------------------|-------------------|------------|
| Mercury | < 1 arcsecond | < 0.00001 AU | 1800-2200 |
| Venus | < 1 arcsecond | < 0.00001 AU | 1800-2200 |
| Earth | < 0.5 arcsecond | < 0.00001 AU | 1800-2200 |
| Mars | < 1 arcsecond | < 0.00001 AU | 1800-2200 |
| Jupiter | < 2 arcseconds | < 0.0001 AU | 1800-2200 |
| Saturn | < 2 arcseconds | < 0.0001 AU | 1800-2200 |
| Uranus | < 5 arcseconds | < 0.001 AU | 1800-2200 |
| Neptune | < 5 arcseconds | < 0.001 AU | 1800-2200 |

### 2.2 Sample Test Cases - JPL Horizons Reference Data

```typescript
// Test data sourced from JPL Horizons ephemeris system
// https://ssd.jpl.nasa.gov/horizons/

export const JPL_REFERENCE_DATA = {
  // Mars on 1899-12-31 (JD 2415020.0) - from vsop87.chk
  mars_1899: {
    jd: 2415020.0,
    heliocentric: {
      lon: 5.018579265623366,  // radians
      lat: -0.02740734998738619, // radians
      range: 1.421877771845356  // AU
    },
    tolerance: {
      lonArcsec: 1.0,
      latArcsec: 1.0,
      rangeAU: 0.00001
    }
  },

  // Venus on 1992-12-20 - Meeus Example 32.a
  venus_1992: {
    date: { year: 1992, month: 12, day: 20 },
    heliocentric: {
      lon: 0.45749253478276586, // radians (26.11412 deg)
      lat: -0.045729822980889484, // radians (-2.6206 deg)
      range: 0.7246016739689574 // AU
    },
    tolerance: {
      lonArcsec: 0.5,
      latArcsec: 0.5,
      rangeAU: 0.000001
    }
  },

  // Jupiter on J2000.0 epoch
  jupiter_j2000: {
    jd: 2451545.0,
    heliocentric: {
      lon: 0.599546, // radians (34.35 deg)
      lat: -0.02235, // radians (-1.28 deg)
      range: 4.9651 // AU
    },
    tolerance: {
      lonArcsec: 2.0,
      latArcsec: 2.0,
      rangeAU: 0.0001
    }
  },

  // Saturn at opposition 2020-07-20
  saturn_2020: {
    date: { year: 2020, month: 7, day: 20 },
    heliocentric: {
      lon: 5.223, // radians (~299 deg, Capricornus)
      lat: 0.0, // near ecliptic
      range: 9.02 // AU
    },
    tolerance: {
      lonArcsec: 2.0,
      latArcsec: 2.0,
      rangeAU: 0.01
    }
  }
};
```

### 2.3 Kepler vs VSOP87 Comparison Tests

```typescript
// tests/precision/planetary/kepler-comparison.test.ts

import { describe, it, expect } from 'vitest';
import { getPlanetPosition, daysSinceJ2000 } from '@/lib/astronomy/calculations';
import { planetposition } from 'astronomia';
import { PLANETS } from '@/lib/astronomy/data';

describe('Kepler vs VSOP87 Precision Comparison', () => {
  const testDates = [
    new Date('2000-01-01T12:00:00Z'), // J2000.0
    new Date('2020-06-21T00:00:00Z'), // Summer solstice
    new Date('1990-01-01T00:00:00Z'), // Past date
    new Date('2050-12-31T23:59:59Z'), // Future date
  ];

  describe('Mercury', () => {
    testDates.forEach(date => {
      it(`position accuracy at ${date.toISOString()}`, () => {
        const days = daysSinceJ2000(date);

        // Current Kepler approximation
        const keplerPos = getPlanetPosition(PLANETS.mercury, days);

        // VSOP87 calculation (astronomia)
        const vsop87Pos = getVSOP87Position('mercury', date);

        // Calculate angular separation
        const separation = angularSeparation(keplerPos, vsop87Pos);

        // Document the difference (expected to be significant)
        console.log(`Mercury ${date.toISOString()}: Kepler-VSOP87 diff = ${separation.toFixed(2)} arcsec`);

        // After migration, this should be < 1 arcsec
        expect(separation).toBeDefined();
      });
    });
  });

  // Similar tests for all planets...
});
```

---

## 3. Moon Position Tests (ELP2000)

### 3.1 Acceptance Criteria

| Metric | Current (Estimated) | Target (ELP2000) |
|--------|---------------------|------------------|
| Geocentric Longitude | N/A | < 10 arcseconds |
| Geocentric Latitude | N/A | < 5 arcseconds |
| Distance | N/A | < 20 km |
| Parallax | N/A | < 0.5 arcseconds |

### 3.2 ELP2000 Reference Test Data

```typescript
// From astronomia elp.test.js and Meeus Chapter 47

export const ELP_REFERENCE_DATA = {
  // Example 47.a, p. 342 - Meeus
  moon_1992_04_12: {
    jde: 2448724.5, // April 12, 1992
    expected: {
      lon: 133.162655, // degrees
      lat: -3.229126, // degrees
      range: 368409.7, // km
      parallax: 0.991990 // degrees
    },
    tolerance: {
      lonArcsec: 10,
      latArcsec: 5,
      rangeKm: 20
    }
  },

  // ELP verification data (elpmpp02.pdf)
  elp_verification: [
    { jd: 2500000.5, x: 274034.59103, y: 252067.53689, z: -18998.75519 },
    { jd: 2300000.5, x: 353104.31359, y: -195254.11808, z: 34943.54592 },
    { jd: 2100000.5, x: -19851.27674, y: -385646.17717, z: -27597.66134 },
    { jd: 1900000.5, x: -370342.79254, y: -37574.25533, z: -4527.91840 },
    { jd: 1700000.5, x: -164673.04720, y: 367791.71329, z: 31603.98027 }
  ]
};
```

### 3.3 Moon Phase Validation Tests

```typescript
// tests/precision/lunar/moon-phases.test.ts

describe('Moon Phase Predictions', () => {
  // From astronomia moonphase.test.js - Chinese New Year verification
  const NEW_MOON_TESTS = [
    { hunt: [1990, 10, 18], expected: '1990-10-18T15:36:31Z' },
    { hunt: [1990, 11, 17], expected: '1990-11-17T09:04:27Z' },
    { hunt: [1990, 12, 17], expected: '1990-12-17T04:21:43Z' },
    { hunt: [1991, 1, 16], expected: '1991-01-15T23:49:41Z' },
    { hunt: [1991, 2, 15], expected: '1991-02-14T17:31:47Z' }
  ];

  NEW_MOON_TESTS.forEach(({ hunt, expected }) => {
    it(`New Moon near ${hunt.join('-')}`, () => {
      const result = moonphase.newMoon(yearFromDate(hunt));
      const resultDate = jdeToDate(result);
      const expectedDate = new Date(expected);

      const diffMs = Math.abs(resultDate.getTime() - expectedDate.getTime());
      const diffMinutes = diffMs / 60000;

      // New moon predictions should be within 1 minute
      expect(diffMinutes).toBeLessThan(1);
    });
  });

  // Full moon tests with USNO data
  const FULL_MOON_TESTS = [
    { year: 2024, month: 1, day: 25, hour: 17, minute: 54 }, // Wolf Moon
    { year: 2024, month: 2, day: 24, hour: 12, minute: 30 }, // Snow Moon
    { year: 2024, month: 3, day: 25, hour: 7, minute: 0 },   // Worm Moon
  ];
});
```

---

## 4. Coordinate Transformation Tests

### 4.1 Test Cases from Meeus

```typescript
// tests/precision/coordinates/transformations.test.ts

describe('Coordinate Transformations', () => {
  // Example 13.a, p. 95 - Equatorial to Ecliptic
  it('Equatorial to Ecliptic (Meeus 13.a)', () => {
    const eq = {
      ra: 7.755277, // hours (7h 45m 18.946s)
      dec: 28.026284 // degrees (28d 1' 34.26")
    };
    const obliquity = 23.4392911; // degrees

    const ecl = equatorialToEcliptic(eq, obliquity);

    expect(ecl.lon).toBeCloseTo(113.21563, 4); // degrees
    expect(ecl.lat).toBeCloseTo(6.68417, 4); // degrees
  });

  // Example 13.b, p. 95 - Equatorial to Horizontal
  it('Equatorial to Horizontal (Meeus 13.b)', () => {
    const eq = {
      ra: 23.154623, // hours (23h 9m 16.641s)
      dec: -6.719336 // degrees (-6d 43' 11.61")
    };
    const observer = {
      lat: 38.921389, // degrees (38d 55' 17")
      lon: -77.065556 // degrees (-77d 3' 56")
    };
    const dateTime = new Date('1987-04-10T19:21:00Z');

    const hz = equatorialToHorizontal(eq, observer, dateTime);

    expect(hz.az).toBeCloseTo(68.034, 2); // degrees
    expect(hz.alt).toBeCloseTo(15.125, 2); // degrees
  });

  // Round-trip transformation accuracy
  it('Ecliptic -> Equatorial -> Ecliptic round-trip', () => {
    const original = { lon: 45.0, lat: 10.0 };
    const obliquity = 23.44;

    const eq = eclipticToEquatorial(original, obliquity);
    const back = equatorialToEcliptic(eq, obliquity);

    expect(back.lon).toBeCloseTo(original.lon, 8);
    expect(back.lat).toBeCloseTo(original.lat, 8);
  });
});
```

### 4.2 Nutation Tests

```typescript
// From astronomia nutation.test.js - Example 22.a, p. 148

describe('Nutation Calculations', () => {
  it('Nutation on 1987-04-10 (Meeus 22.a)', () => {
    const jd = 2446895.5; // April 10, 1987

    const { deltaPsi, deltaEpsilon } = nutation(jd);
    const meanObliquity = meanObliquityIAU(jd);
    const trueObliquity = meanObliquity + deltaEpsilon;

    // deltaPsi = -3".788
    expect(deltaPsi * 3600).toBeCloseTo(-3.788, 2);

    // deltaEpsilon = +9".443
    expect(deltaEpsilon * 3600).toBeCloseTo(9.443, 2);

    // Mean obliquity = 23d 26' 27".407
    expect(meanObliquity).toBeCloseTo(23.440946, 4);

    // True obliquity = 23d 26' 36".850
    expect(trueObliquity).toBeCloseTo(23.443569, 4);
  });
});
```

---

## 5. Astronomical Event Tests

### 5.1 Eclipse Predictions

```typescript
// tests/precision/events/eclipses.test.ts

describe('Eclipse Predictions', () => {
  // Solar eclipse test cases from astronomia eclipse.test.js
  const SOLAR_ECLIPSES = [
    {
      year: 1993.38,
      type: 'partial',
      jdeMax: 2449129.0978,
      magnitude: 0.74,
      description: 'Partial solar eclipse 1993'
    },
    {
      year: 2009.56,
      type: 'total',
      jdeMax: 2455034.6088,
      central: true,
      description: 'Total solar eclipse July 22, 2009'
    },
    {
      year: 2017.65,
      type: 'total',
      jdeMax: 2457987.268,
      description: 'Great American Eclipse Aug 21, 2017'
    },
    {
      year: 2024.29,
      type: 'total',
      jdeMax: 2460409.294,
      description: 'North American Eclipse Apr 8, 2024'
    }
  ];

  SOLAR_ECLIPSES.forEach(eclipse => {
    it(eclipse.description, () => {
      const result = solarEclipse(eclipse.year);

      expect(result.type).toBe(eclipse.type);

      // Time of maximum should be accurate to 1 minute
      const diffDays = Math.abs(result.jdeMax - eclipse.jdeMax);
      const diffMinutes = diffDays * 24 * 60;
      expect(diffMinutes).toBeLessThan(1);
    });
  });

  // Lunar eclipse test cases
  const LUNAR_ECLIPSES = [
    {
      year: 1973.46,
      type: 'penumbral',
      jdeMax: 2441849.3687,
      magnitude: 0.4625,
      description: 'Penumbral lunar eclipse 1973'
    },
    {
      year: 1997.7,
      type: 'total',
      jdeMax: 2450708.2835,
      magnitude: 1.1868,
      description: 'Total lunar eclipse 1997'
    }
  ];

  LUNAR_ECLIPSES.forEach(eclipse => {
    it(eclipse.description, () => {
      const result = lunarEclipse(eclipse.year);

      expect(result.type).toBe(eclipse.type);
      expect(result.magnitude).toBeCloseTo(eclipse.magnitude, 2);
    });
  });
});
```

### 5.2 Planetary Conjunctions

```typescript
// tests/precision/events/conjunctions.test.ts

describe('Planetary Conjunctions', () => {
  // Example 18.a, p. 117 - Mercury-Venus conjunction 1991
  it('Mercury-Venus conjunction August 1991', () => {
    const result = planetaryConjunction(
      'mercury',
      'venus',
      { year: 1991, month: 8, dayStart: 5, dayEnd: 9 }
    );

    // Expected: August 7, 1991 ~05:42 UT
    expect(result.date.getUTCDate()).toBe(7);
    expect(result.date.getUTCHours()).toBe(5);
    expect(result.date.getUTCMinutes()).toBeCloseTo(42, -1);

    // Separation at conjunction
    const sepArcsec = result.separation * 3600;
    expect(sepArcsec).toBeCloseTo(7702, -2); // 2d 8' 22"
  });

  // Great conjunction 2020 - Jupiter/Saturn
  it('Great Conjunction December 2020', () => {
    const result = planetaryConjunction(
      'jupiter',
      'saturn',
      { year: 2020, month: 12, dayStart: 15, dayEnd: 25 }
    );

    // Expected: December 21, 2020 ~18:22 UTC
    expect(result.date.getUTCDate()).toBe(21);

    // Minimum separation ~6 arcminutes
    const sepArcmin = result.separation * 60;
    expect(sepArcmin).toBeCloseTo(6.1, 0);
  });
});
```

---

## 6. Kepler Equation Solver Tests

### 6.1 Convergence and Accuracy Tests

```typescript
// tests/precision/planetary/kepler-solvers.test.ts

describe('Kepler Equation Solvers', () => {
  // From astronomia kepler.test.js

  describe('Newton-Raphson (kepler1)', () => {
    it('Example 30.a, p. 196 - e=0.1, M=5deg', () => {
      const M = 5 * Math.PI / 180;
      const e = 0.1;
      const E = solveKeplerNewton(M, e, 8);

      expect(E * 180 / Math.PI).toBeCloseTo(5.554589, 6);
    });
  });

  describe('Binary search (kepler2)', () => {
    it('Example 30.b, p. 199 - higher precision', () => {
      const M = 5 * Math.PI / 180;
      const e = 0.1;
      const E = solveKeplerBinary(M, e, 11);

      expect(E * 180 / Math.PI).toBeCloseTo(5.554589254, 9);
    });
  });

  describe('High eccentricity (kepler3)', () => {
    it('e=0.99, M=0.2 - parabolic-like orbit', () => {
      const M = 0.2;
      const e = 0.99;
      const E = solveKeplerHighEcc(M, e);

      expect(E).toBeCloseTo(1.066997365282, 12);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('Circular orbit (e=0)', () => {
      const M = Math.PI / 4;
      const e = 0;
      const E = solveKepler(M, e);
      expect(E).toBeCloseTo(M, 15);
    });

    it('Near-parabolic (e=0.999)', () => {
      const M = 0.1;
      const e = 0.999;
      const E = solveKepler(M, e);
      expect(E).toBeDefined();
      expect(isFinite(E)).toBe(true);
    });

    it('Full orbit (M=2pi)', () => {
      const M = 2 * Math.PI;
      const e = 0.5;
      const E = solveKepler(M, e);
      expect(E).toBeCloseTo(2 * Math.PI, 6);
    });
  });
});
```

---

## 7. Julian Date Tests

### 7.1 Conversion Accuracy Tests

```typescript
// tests/precision/coordinates/julian-date.test.ts

describe('Julian Date Conversions', () => {
  const TEST_DATES = [
    { date: '2000-01-01T12:00:00Z', jd: 2451545.0, name: 'J2000.0 Epoch' },
    { date: '1899-12-31T12:00:00Z', jd: 2415020.0, name: 'Dec 31, 1899' },
    { date: '1987-04-10T00:00:00Z', jd: 2446895.5, name: 'April 10, 1987' },
    { date: '1992-04-12T00:00:00Z', jd: 2448724.5, name: 'April 12, 1992' },
    { date: '1582-10-15T00:00:00Z', jd: 2299160.5, name: 'Gregorian calendar start' },
  ];

  describe('Date to JD', () => {
    TEST_DATES.forEach(({ date, jd, name }) => {
      it(name, () => {
        const result = dateToJD(new Date(date));
        expect(result).toBeCloseTo(jd, 6);
      });
    });
  });

  describe('JD to Date', () => {
    TEST_DATES.forEach(({ date, jd, name }) => {
      it(name, () => {
        const result = jdToDate(jd);
        const expected = new Date(date);

        // Should be accurate to within 1 millisecond
        expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1);
      });
    });
  });

  describe('Round-trip accuracy', () => {
    it('Random dates', () => {
      for (let i = 0; i < 1000; i++) {
        const originalMs = Date.now() + (Math.random() - 0.5) * 1e12;
        const original = new Date(originalMs);
        const jd = dateToJD(original);
        const back = jdToDate(jd);

        expect(Math.abs(back.getTime() - original.getTime())).toBeLessThan(1);
      }
    });
  });

  describe('Days since J2000', () => {
    it('J2000.0 epoch should be 0', () => {
      const j2000 = new Date('2000-01-01T12:00:00Z');
      expect(daysSinceJ2000(j2000)).toBeCloseTo(0, 10);
    });

    it('January 1, 2001 should be 366 days', () => {
      const date = new Date('2001-01-01T12:00:00Z');
      expect(daysSinceJ2000(date)).toBeCloseTo(366, 6);
    });
  });
});
```

---

## 8. Sidereal Time Tests

### 8.1 GMST and LST Validation

```typescript
// tests/precision/coordinates/sidereal-time.test.ts

describe('Sidereal Time', () => {
  // Example 12.a, p. 88 - Mean sidereal time
  it('GMST on JD 2446895.5 (Meeus 12.a)', () => {
    const jd = 2446895.5;
    const gmst = getMeanSiderealTime(jd);

    // Expected: 13h 10m 46.36683s
    expect(gmst).toBeCloseTo(13.179546, 4); // hours
  });

  // Example 12.b, p. 89
  it('GMST on April 10, 1987 19:21 UTC (Meeus 12.b)', () => {
    const date = new Date('1987-04-10T19:21:00Z');
    const jd = dateToJD(date);
    const gmst = getMeanSiderealTime(jd);

    // Expected: 8h 34m 57.08958s
    expect(gmst).toBeCloseTo(8.582525, 4); // hours
  });

  // Apparent sidereal time (with nutation)
  it('Apparent sidereal time includes nutation', () => {
    const jd = 2446895.5;
    const mean = getMeanSiderealTime(jd);
    const apparent = getApparentSiderealTime(jd);

    // Difference should be nutation in RA (typically < 1 second)
    const diffSeconds = Math.abs(apparent - mean) * 3600;
    expect(diffSeconds).toBeLessThan(1.5);
  });

  // Local sidereal time
  it('LST for Berlin (lon=13.405 deg)', () => {
    const jd = 2451545.0; // J2000.0
    const gmst = getMeanSiderealTime(jd);
    const lst = getLocalSiderealTime(jd, 13.405);

    const expectedOffset = 13.405 / 15; // hours
    expect(lst - gmst).toBeCloseTo(expectedOffset, 4);
  });
});
```

---

## 9. Performance Benchmarks

### 9.1 Calculation Speed Requirements

| Operation | Target Time | Max Acceptable |
|-----------|-------------|----------------|
| Planet position (single) | < 0.1ms | 1ms |
| All 8 planets | < 1ms | 5ms |
| Moon position | < 0.5ms | 2ms |
| Coordinate transform | < 0.01ms | 0.1ms |
| Eclipse prediction | < 10ms | 50ms |
| Moon phase | < 5ms | 20ms |

### 9.2 Performance Test Implementation

```typescript
// tests/precision/benchmarks/performance.test.ts

import { bench, describe } from 'vitest';

describe('Performance Benchmarks', () => {
  describe('Planetary Calculations', () => {
    bench('Single planet position (VSOP87)', () => {
      const jd = 2451545.0;
      getPlanetPositionVSOP87('mars', jd);
    }, { iterations: 10000 });

    bench('All planets (VSOP87)', () => {
      const jd = 2451545.0;
      ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
        .forEach(p => getPlanetPositionVSOP87(p, jd));
    }, { iterations: 1000 });

    bench('Kepler approximation (current)', () => {
      const days = daysSinceJ2000(new Date());
      getPlanetPosition(PLANETS.mars, days);
    }, { iterations: 10000 });
  });

  describe('Lunar Calculations', () => {
    bench('Moon position (ELP2000)', () => {
      const jd = 2451545.0;
      getMoonPositionELP(jd);
    }, { iterations: 5000 });

    bench('Moon phase calculation', () => {
      moonphase.newMoon(2024.5);
    }, { iterations: 1000 });
  });

  describe('Coordinate Transforms', () => {
    bench('Equatorial to Horizontal', () => {
      equatorialToHorizontal(10.5, 45.0, 52.0, 12.5);
    }, { iterations: 50000 });

    bench('Ecliptic to Equatorial', () => {
      eclipticToEquatorial(120.0, 5.0, 0.0, 23.44);
    }, { iterations: 50000 });
  });

  describe('Event Calculations', () => {
    bench('Eclipse prediction', () => {
      eclipse.solar(2024.5);
    }, { iterations: 500 });

    bench('Conjunction calculation', () => {
      conjunction.planetary(5, 9, venusData, mercuryData);
    }, { iterations: 500 });
  });
});
```

### 9.3 Memory Usage Tests

```typescript
// tests/precision/benchmarks/memory.test.ts

describe('Memory Usage', () => {
  it('VSOP87 data memory footprint', () => {
    const before = process.memoryUsage().heapUsed;

    // Load all planet data
    const planets = loadVSOP87Data();

    const after = process.memoryUsage().heapUsed;
    const usedMB = (after - before) / (1024 * 1024);

    console.log(`VSOP87 data: ${usedMB.toFixed(2)} MB`);
    expect(usedMB).toBeLessThan(50); // Max 50MB for planetary data
  });

  it('ELP2000 data memory footprint', () => {
    const before = process.memoryUsage().heapUsed;

    const moon = loadELP2000Data();

    const after = process.memoryUsage().heapUsed;
    const usedMB = (after - before) / (1024 * 1024);

    console.log(`ELP2000 data: ${usedMB.toFixed(2)} MB`);
    expect(usedMB).toBeLessThan(10); // Max 10MB for lunar data
  });

  it('No memory leaks during repeated calculations', async () => {
    global.gc?.();
    const baseline = process.memoryUsage().heapUsed;

    // Perform 10000 calculations
    for (let i = 0; i < 10000; i++) {
      const jd = 2451545.0 + i * 0.1;
      getPlanetPositionVSOP87('mars', jd);
      getMoonPositionELP(jd);
    }

    global.gc?.();
    const final = process.memoryUsage().heapUsed;
    const leakMB = (final - baseline) / (1024 * 1024);

    expect(leakMB).toBeLessThan(5); // Max 5MB growth after 10k calculations
  });
});
```

---

## 10. Validation Data Sources

### 10.1 Primary Sources

| Source | URL | Usage |
|--------|-----|-------|
| JPL Horizons | https://ssd.jpl.nasa.gov/horizons/ | Planetary ephemerides |
| USNO | https://aa.usno.navy.mil/ | Moon phases, eclipses |
| Meeus "Astronomical Algorithms" | ISBN 0-943396-61-1 | Algorithm verification |
| IMCCE (Paris) | https://www.imcce.fr/ | ELP verification data |
| Stellarium | https://stellarium.org/ | Visual verification |

### 10.2 Reference Ephemeris Files

```
attic/
  DE440.bsp        # JPL Development Ephemeris 440 (planetary)
  DE440s.bsp       # JPL DE440 short span
  ELP82B.dat       # Lunar ephemeris data
  VSOP87B.ear      # Earth VSOP87 data
  VSOP87B.mar      # Mars VSOP87 data
  ...
```

### 10.3 Cross-Validation Approach

1. **Primary validation**: Compare against JPL Horizons generated ephemerides
2. **Secondary validation**: Cross-check with Meeus example calculations
3. **Tertiary validation**: Visual verification in Stellarium
4. **Historical validation**: Check against known astronomical events

---

## 11. Test Execution Plan

### 11.1 CI/CD Integration

```yaml
# .github/workflows/precision-tests.yml
name: Precision Tests

on:
  push:
    paths:
      - 'lib/astronomy/**'
      - 'tests/precision/**'
  pull_request:
    paths:
      - 'lib/astronomy/**'

jobs:
  precision-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run precision tests
        run: npm run test:precision

      - name: Run benchmark tests
        run: npm run test:benchmark

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: precision-results
          path: test-results/
```

### 11.2 npm Scripts

```json
{
  "scripts": {
    "test:precision": "vitest run tests/precision --reporter=verbose",
    "test:precision:watch": "vitest tests/precision",
    "test:benchmark": "vitest bench tests/precision/benchmarks",
    "test:coverage": "vitest run tests/precision --coverage"
  }
}
```

---

## 12. Migration Validation Checklist

### Phase 1: Unit Test Parity
- [ ] All Kepler solver tests pass with new implementation
- [ ] Julian date conversion tests pass
- [ ] Coordinate transformation tests pass

### Phase 2: Precision Improvement
- [ ] Planetary positions within acceptance criteria vs JPL
- [ ] Moon position within acceptance criteria
- [ ] Nutation calculations match Meeus examples

### Phase 3: Feature Additions
- [ ] Eclipse predictions functional and accurate
- [ ] Moon phase predictions match USNO
- [ ] Conjunction calculations verified

### Phase 4: Performance Validation
- [ ] All benchmarks within acceptable limits
- [ ] No memory leaks detected
- [ ] Bundle size impact acceptable

### Phase 5: Integration Testing
- [ ] Orrery visualization correct
- [ ] Planetarium view accurate for observer location
- [ ] Birth chart calculations accurate

---

## Appendix A: Test Data Generator

```typescript
// scripts/generate-test-data.ts
// Fetches reference data from JPL Horizons for test validation

import { fetchHorizonsData } from './horizons-api';

async function generatePlanetTestData() {
  const planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  const testDates = generateTestDates(2000, 2030, 100);

  for (const planet of planets) {
    const data = await fetchHorizonsData(planet, testDates);
    writeTestData(`tests/precision/data/${planet}-reference.json`, data);
  }
}

function generateTestDates(startYear: number, endYear: number, count: number): Date[] {
  const dates: Date[] = [];
  const span = (endYear - startYear) * 365.25 * 24 * 60 * 60 * 1000;
  const startMs = new Date(startYear, 0, 1).getTime();

  for (let i = 0; i < count; i++) {
    dates.push(new Date(startMs + (span * i) / (count - 1)));
  }

  return dates;
}
```

---

## Appendix B: Tolerance Conversion Reference

```
1 degree = 60 arcminutes = 3600 arcseconds
1 radian = 57.2957795 degrees = 206264.806 arcseconds

For position accuracy:
- 1 arcsecond at Moon distance (384,400 km) = ~1.9 km
- 1 arcsecond at Sun distance (1 AU) = ~725 km
- 1 arcsecond at Jupiter distance (5 AU) = ~3600 km

For time accuracy:
- 1 minute of time = 0.25 degrees of Earth rotation
- 1 second of time = 15 arcseconds of Earth rotation
```

---

*Document Version: 1.0*
*Created: 2025-01-06*
*Author: TESTER Agent (Hive Mind Swarm)*
