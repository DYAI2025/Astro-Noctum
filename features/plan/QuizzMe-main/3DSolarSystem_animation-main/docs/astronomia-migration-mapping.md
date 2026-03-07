# Astronomia Migration Mapping Document

## Code Quality Analysis Report

### Summary
- **Overall Quality Score**: 7/10 (current implementation)
- **Files Analyzed**: 1 (calculations.ts)
- **Functions to Migrate**: 8
- **Accuracy Improvement**: ~1000x (from ~1 degree to ~0.001 degree)
- **Technical Debt Estimate**: 4-6 hours migration

---

## Executive Summary

The current `calculations.ts` implements simplified Keplerian orbital mechanics with an accuracy of approximately +/-1 degree. The [astronomia](https://github.com/commenthol/astronomia) library provides VSOP87-based calculations accurate to ~0.001 degrees, along with proper nutation, precession, and aberration corrections.

### Key Benefits of Migration

| Aspect | Current Implementation | With Astronomia |
|--------|----------------------|-----------------|
| Planetary Position Accuracy | +/-1 degree | +/-0.001 degree |
| Coordinate Transforms | Basic rotation matrices | Full IAU standards |
| Nutation Correction | None | IAU 1980 (63-term) |
| Precession | None | Full support |
| Obliquity | Fixed constant | Time-dependent |
| Sidereal Time | IAU 1982 approximation | Full apparent ST |

---

## Function-by-Function Migration Mapping

### 1. `solveKepler(M, e, tol)` -> **DEPRECATED**

**Current Implementation:**
```typescript
export function solveKepler(M: number, e: number, tol: number = 1e-8): number {
  let E = M;
  for (let i = 0; i < 100; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}
```

**Migration Status:** **NOT NEEDED**

**Rationale:** VSOP87 theory used by astronomia does not use Kepler's equation. It directly computes positions using series expansions of over 2000 terms, making the Kepler solver obsolete.

**Alternative (if needed for educational purposes):**
```typescript
import { kepler } from 'astronomia';

// astronomia provides kepler.kepler1 and kepler.kepler2 for Kepler equation solving
const E = kepler.kepler1(e, M, 15); // 15 decimal places precision
```

---

### 2. `getPlanetPosition(planet, daysSinceJ2000, scale)` -> `planetposition.Planet.position2000(jde)`

**Current Implementation:**
```typescript
export function getPlanetPosition(
  planet: PlanetData,
  daysSinceJ2000: number,
  scale: number = 25
): Position3D & { distance: number; ra: number; dec: number } {
  // Uses simplified Keplerian elements
  // ~1 degree accuracy
}
```

**Astronomia Replacement:**
```typescript
import { planetposition, base, nutation, coord } from 'astronomia';
// Import planet data (lazy-loaded for bundle optimization)
import vsop87Bearth from 'astronomia/data/vsop87Bearth';
import vsop87Bmars from 'astronomia/data/vsop87Bmars';
// ... other planets

// Create planet instances (do once at initialization)
const planets = {
  earth: new planetposition.Planet(vsop87Bearth),
  mars: new planetposition.Planet(vsop87Bmars),
  // ... etc
};

export function getPlanetPositionVSOP87(
  planetKey: string,
  jde: number,
  scale: number = 25
): Position3D & { distance: number; ra: number; dec: number } {
  const planet = planets[planetKey];

  // Get heliocentric ecliptic coordinates (J2000 frame)
  const pos = planet.position2000(jde);
  // pos.lon - heliocentric longitude (radians)
  // pos.lat - heliocentric latitude (radians)
  // pos.range - distance from sun (AU)

  // Convert spherical to Cartesian (ecliptic coordinates)
  const r = pos.range;
  const lon = pos.lon;
  const lat = pos.lat;

  const x = r * Math.cos(lat) * Math.cos(lon);
  const y = r * Math.cos(lat) * Math.sin(lon);
  const z = r * Math.sin(lat);

  // Get obliquity for ecliptic-to-equatorial conversion
  const eps = nutation.meanObliquity(jde);

  // Convert to equatorial coordinates for RA/Dec
  const ecl = new coord.Ecliptic(lon, lat);
  const equ = ecl.toEquatorial(eps);

  // Apply logarithmic scaling for visualization
  const scaled = Math.log10(r + 1) * scale;
  const factor = scaled / r;

  // Note: coordinate system mapping for Three.js
  // Ecliptic X -> Three.js X
  // Ecliptic Z -> Three.js Y (up)
  // Ecliptic -Y -> Three.js Z
  return {
    x: x * factor,
    y: z * factor,      // Z up in Three.js
    z: -y * factor,     // Flip for right-handed system
    distance: r,
    ra: equ.ra * 180 / Math.PI / 15,  // Convert to hours
    dec: equ.dec * 180 / Math.PI       // Convert to degrees
  };
}
```

**Accuracy Improvement:** ~1000x (from ~1 degree to ~3.6 arcseconds)

---

### 3. `dateToJD(date)` -> `julian.DateToJD(date)`

**Current Implementation:**
```typescript
export function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;
  // ... manual calculation
}
```

**Astronomia Replacement:**
```typescript
import { julian } from 'astronomia';

export function dateToJD(date: Date): number {
  return julian.DateToJD(date);
}

// Alternative with explicit components:
export function dateToJDExplicit(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400 +
    date.getUTCMilliseconds() / 86400000;

  return julian.CalendarGregorianToJD(y, m, d);
}

// For dynamical time (TT) with delta-T correction:
export function dateToJDE(date: Date): number {
  return julian.DateToJDE(date);
}
```

**Note:** Use `DateToJDE` for planetary position calculations (applies delta-T correction).

---

### 4. `daysSinceJ2000(date)` -> `base.J2000Century(jde) * 36525`

**Current Implementation:**
```typescript
export function daysSinceJ2000(date: Date): number {
  return dateToJD(date) - 2451545.0;
}
```

**Astronomia Replacement:**
```typescript
import { base, julian } from 'astronomia';

export function daysSinceJ2000(date: Date): number {
  const jde = julian.DateToJDE(date);
  return jde - base.J2000; // base.J2000 = 2451545.0
}

// Or using centuries (common in astronomia):
export function centuriesSinceJ2000(date: Date): number {
  const jde = julian.DateToJDE(date);
  return base.J2000Century(jde); // Returns Julian centuries
}
```

**Constants Available:**
- `base.J2000` = 2451545.0 (Julian date of J2000.0 epoch)
- `base.JulianCentury` = 36525 (days per Julian century)

---

### 5. `getGMST(jd)` -> `sidereal.mean(jd)`

**Current Implementation:**
```typescript
export function getGMST(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    T * T * T / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15; // Convert to hours
}
```

**Astronomia Replacement:**
```typescript
import { sidereal } from 'astronomia';

export function getGMST(jd: number): number {
  // sidereal.mean returns seconds
  const gmstSeconds = sidereal.mean(jd);
  // Convert to hours
  return gmstSeconds / 3600;
}

// For apparent sidereal time (includes nutation):
export function getGAST(jd: number): number {
  const gastSeconds = sidereal.apparent(jd);
  return gastSeconds / 3600;
}
```

**Note:** Use `sidereal.apparent(jd)` for more accurate planetarium positioning as it includes nutation in right ascension.

---

### 6. `getLST(jd, longitude)` -> `sidereal.apparent(jd) + longitude`

**Current Implementation:**
```typescript
export function getLST(jd: number, longitude: number): number {
  const gmst = getGMST(jd);
  let lst = gmst + longitude / 15;
  return ((lst % 24) + 24) % 24;
}
```

**Astronomia Replacement:**
```typescript
import { sidereal, base } from 'astronomia';

export function getLST(jd: number, longitude: number): number {
  // Get apparent sidereal time in seconds
  const gastSeconds = sidereal.apparent(jd);
  // Convert to hours
  const gast = gastSeconds / 3600;
  // Add longitude (convert degrees to hours)
  let lst = gast + longitude / 15;
  // Normalize to [0, 24) range
  return base.pmod(lst, 24);
}

// Alternative using mean sidereal time (faster, less accurate):
export function getLSTMean(jd: number, longitude: number): number {
  const gmstSeconds = sidereal.mean(jd);
  const gmst = gmstSeconds / 3600;
  let lst = gmst + longitude / 15;
  return base.pmod(lst, 24);
}
```

---

### 7. `equatorialToHorizontal(ra, dec, lat, lst)` -> `coord.Equatorial.toHorizontal(globe, st)`

**Current Implementation:**
```typescript
export function equatorialToHorizontal(
  ra: number,      // hours
  dec: number,     // degrees
  lat: number,     // degrees
  lst: number      // hours
): HorizontalCoordinates {
  // Manual spherical trigonometry
}
```

**Astronomia Replacement:**
```typescript
import { coord, globe, sidereal, base } from 'astronomia';

// Create a Globe (ellipsoid) for the observer - do once at init
const earth = new globe.Ellipsoid(6378137, 1/298.257223563); // WGS84

export function equatorialToHorizontal(
  ra: number,       // hours
  dec: number,      // degrees
  lat: number,      // degrees
  lon: number,      // degrees
  jd: number        // Julian date
): HorizontalCoordinates {
  // Convert inputs to radians
  const raRad = ra * 15 * Math.PI / 180;   // hours -> degrees -> radians
  const decRad = dec * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  // Get sidereal time
  const stSeconds = sidereal.apparent(jd);
  const st = stSeconds / 3600 * 15 * Math.PI / 180; // seconds -> hours -> degrees -> radians

  // Add longitude for local sidereal time
  const lst = st + lon * Math.PI / 180;

  // Create observer's geographic coordinate
  const observerCoord = new coord.Coord(latRad, lon * Math.PI / 180);

  // Create equatorial coordinate
  const equ = new coord.Equatorial(raRad, decRad);

  // Convert to horizontal
  const horiz = equ.toHorizontal(observerCoord, lst);

  return {
    altitude: horiz.alt * 180 / Math.PI,
    azimuth: horiz.az * 180 / Math.PI
  };
}

// Simplified version using pre-computed LST:
export function equatorialToHorizontalSimple(
  ra: number,       // hours
  dec: number,      // degrees
  lat: number,      // degrees
  lstHours: number  // hours
): HorizontalCoordinates {
  const raRad = ra * 15 * Math.PI / 180;
  const decRad = dec * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const lstRad = lstHours * 15 * Math.PI / 180;

  const equ = new coord.Equatorial(raRad, decRad);
  const observerCoord = new coord.Coord(latRad, 0); // lon=0 since using LST
  const horiz = equ.toHorizontal(observerCoord, lstRad);

  return {
    altitude: horiz.alt * 180 / Math.PI,
    azimuth: horiz.az * 180 / Math.PI
  };
}
```

---

### 8. `horizontalTo3D(alt, az, radius)` -> **KEEP CURRENT**

**Current Implementation:**
```typescript
export function horizontalTo3D(alt: number, az: number, radius: number = 100): Position3D {
  const altRad = alt * Math.PI / 180;
  const azRad = az * Math.PI / 180;
  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const y = radius * Math.sin(altRad);
  const z = radius * Math.cos(altRad) * Math.cos(azRad);
  return { x, y, z };
}
```

**Migration Status:** **KEEP AS-IS**

**Rationale:** This is a pure geometry conversion for Three.js rendering. Astronomia doesn't provide this function as it's specific to 3D graphics engines.

---

### 9. `eclipticToEquatorial(x, y, z, obliquity)` -> `coord.Ecliptic.toEquatorial(eps)`

**Current Implementation:**
```typescript
export function eclipticToEquatorial(
  x: number,
  y: number,
  z: number,
  obliquity: number = 23.439
): EquatorialCoordinates {
  // Manual rotation matrix
}
```

**Astronomia Replacement:**
```typescript
import { coord, nutation, base } from 'astronomia';

// For angular coordinates (spherical):
export function eclipticToEquatorial(
  lon: number,      // ecliptic longitude (degrees)
  lat: number,      // ecliptic latitude (degrees)
  jde: number       // Julian ephemeris day (for time-dependent obliquity)
): EquatorialCoordinates {
  const lonRad = lon * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  // Get mean obliquity for the date (more accurate than fixed constant)
  const eps = nutation.meanObliquity(jde);
  // Or use Laskar's formula for higher precision:
  // const eps = nutation.meanObliquityLaskar(jde);

  const ecl = new coord.Ecliptic(lonRad, latRad);
  const equ = ecl.toEquatorial(eps);

  return {
    ra: equ.ra * 180 / Math.PI / 15,  // radians -> degrees -> hours
    dec: equ.dec * 180 / Math.PI       // radians -> degrees
  };
}

// For Cartesian coordinates (as in original):
export function eclipticToEquatorialCartesian(
  x: number,
  y: number,
  z: number,
  jde: number
): EquatorialCoordinates {
  // Convert Cartesian to spherical
  const r = Math.sqrt(x*x + y*y + z*z);
  const lon = Math.atan2(y, x);
  const lat = Math.asin(z / r);

  const eps = nutation.meanObliquity(jde);
  const ecl = new coord.Ecliptic(lon, lat);
  const equ = ecl.toEquatorial(eps);

  return {
    ra: equ.ra * 180 / Math.PI / 15,
    dec: equ.dec * 180 / Math.PI
  };
}
```

**Improvement:** Uses time-dependent obliquity instead of fixed 23.439 degrees.

---

## New Functions Enabled by Astronomia

### 1. Nutation Corrections

```typescript
import { nutation } from 'astronomia';

export function getNutation(jde: number): { dpsi: number; deps: number } {
  const { dpsi, deps } = nutation.nutation(jde);
  return {
    dpsi: dpsi * 180 / Math.PI * 3600,  // arcseconds
    deps: deps * 180 / Math.PI * 3600   // arcseconds
  };
}
```

### 2. Aberration Correction (for star positions)

```typescript
import { aberration, coord, sidereal } from 'astronomia';

export function correctForAberration(
  ra: number,   // hours
  dec: number,  // degrees
  jde: number
): EquatorialCoordinates {
  // Apply annual aberration correction
  const equ = new coord.Equatorial(
    ra * 15 * Math.PI / 180,
    dec * Math.PI / 180
  );

  // Get aberration corrections
  const [dra, ddec] = aberration.equatorial(equ.ra, equ.dec, jde);

  return {
    ra: (equ.ra + dra) * 180 / Math.PI / 15,
    dec: (equ.dec + ddec) * 180 / Math.PI
  };
}
```

### 3. Proper Precession

```typescript
import { precess, coord, base } from 'astronomia';

export function precessEquatorial(
  ra: number,        // hours
  dec: number,       // degrees
  fromJDE: number,   // source epoch JDE
  toJDE: number      // target epoch JDE
): EquatorialCoordinates {
  const equ = new coord.Equatorial(
    ra * 15 * Math.PI / 180,
    dec * Math.PI / 180
  );

  const precessed = precess.position(equ, fromJDE, toJDE);

  return {
    ra: precessed.ra * 180 / Math.PI / 15,
    dec: precessed.dec * 180 / Math.PI
  };
}
```

### 4. Light-Time Correction (for outer planets)

```typescript
import { planetposition, base } from 'astronomia';

export function getPlanetPositionWithLightTime(
  planet: planetposition.Planet,
  jde: number,
  earth: planetposition.Planet
): { lon: number; lat: number; range: number } {
  // Get initial position
  let pos = planet.position2000(jde);
  const earthPos = earth.position2000(jde);

  // Calculate distance and light-time
  // Light travels ~173.14 AU/day
  const dx = pos.range * Math.cos(pos.lat) * Math.cos(pos.lon) -
             earthPos.range * Math.cos(earthPos.lat) * Math.cos(earthPos.lon);
  const dy = pos.range * Math.cos(pos.lat) * Math.sin(pos.lon) -
             earthPos.range * Math.cos(earthPos.lat) * Math.sin(earthPos.lon);
  const dz = pos.range * Math.sin(pos.lat) - earthPos.range * Math.sin(earthPos.lat);
  const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
  const lightTime = distance / 173.14; // days

  // Recalculate position at earlier time
  pos = planet.position2000(jde - lightTime);

  return pos;
}
```

---

## Data Flow Diagram

```
                    CURRENT FLOW
                    ============
Date -> dateToJD() -> daysSinceJ2000() -> getPlanetPosition()
                                               |
                          Uses: solveKepler() + manual rotation matrices
                                               |
                                               v
                                      Position3D + distance


                    NEW FLOW (with astronomia)
                    ==========================

Date -> julian.DateToJDE() -> planetposition.Planet.position2000(jde)
                                               |
                          Uses: VSOP87 series (2000+ terms)
                                               |
                                               v
                               {lon, lat, range} (heliocentric ecliptic)
                                               |
                          nutation.meanObliquity(jde)
                                               |
                                               v
                          coord.Ecliptic.toEquatorial(eps)
                                               |
                                               v
                               {ra, dec} (equatorial)
                                               |
                          + logarithmic scaling for visualization
                                               |
                                               v
                               Position3D + distance + ra + dec
```

---

## Migration Plan

### Phase 1: Installation and Setup (30 min)

```bash
npm install astronomia
```

Create initialization module:
```typescript
// lib/astronomy/vsop87.ts
import vsop87Bmercury from 'astronomia/data/vsop87Bmercury';
import vsop87Bvenus from 'astronomia/data/vsop87Bvenus';
import vsop87Bearth from 'astronomia/data/vsop87Bearth';
import vsop87Bmars from 'astronomia/data/vsop87Bmars';
import vsop87Bjupiter from 'astronomia/data/vsop87Bjupiter';
import vsop87Bsaturn from 'astronomia/data/vsop87Bsaturn';
import vsop87Buranus from 'astronomia/data/vsop87Buranus';
import vsop87Bneptune from 'astronomia/data/vsop87Bneptune';
import { planetposition } from 'astronomia';

export const planets = {
  mercury: new planetposition.Planet(vsop87Bmercury),
  venus: new planetposition.Planet(vsop87Bvenus),
  earth: new planetposition.Planet(vsop87Bearth),
  mars: new planetposition.Planet(vsop87Bmars),
  jupiter: new planetposition.Planet(vsop87Bjupiter),
  saturn: new planetposition.Planet(vsop87Bsaturn),
  uranus: new planetposition.Planet(vsop87Buranus),
  neptune: new planetposition.Planet(vsop87Bneptune),
} as const;
```

### Phase 2: Replace Core Functions (2-3 hours)

| Priority | Function | Replacement | Est. Time |
|----------|----------|-------------|-----------|
| 1 | `dateToJD` | `julian.DateToJDE` | 15 min |
| 2 | `daysSinceJ2000` | Direct JDE calculation | 10 min |
| 3 | `getGMST` | `sidereal.apparent` | 15 min |
| 4 | `getLST` | `sidereal.apparent + lon` | 15 min |
| 5 | `getPlanetPosition` | `planetposition.Planet.position2000` | 60 min |
| 6 | `eclipticToEquatorial` | `coord.Ecliptic.toEquatorial` | 20 min |
| 7 | `equatorialToHorizontal` | `coord.Equatorial.toHorizontal` | 30 min |

### Phase 3: Testing and Validation (1-2 hours)

1. Compare output against JPL Horizons for validation
2. Test edge cases (polar observer, planets near horizon)
3. Performance benchmarking
4. Visual regression testing in planetarium view

### Phase 4: Remove Deprecated Code (30 min)

1. Remove `solveKepler` function (no longer needed)
2. Remove `PlanetData` orbital elements from `data.ts`
3. Update type definitions
4. Remove old comments

---

## Functions to Keep

| Function | Reason |
|----------|--------|
| `horizontalTo3D` | Three.js-specific geometry conversion |

## Functions to Replace

| Current | Astronomia Equivalent | Improvement |
|---------|----------------------|-------------|
| `solveKepler` | Not needed (VSOP87) | Obsolete |
| `getPlanetPosition` | `planetposition.Planet.position2000` | ~1000x accuracy |
| `dateToJD` | `julian.DateToJDE` | Delta-T correction |
| `daysSinceJ2000` | `jde - base.J2000` | Standardized |
| `getGMST` | `sidereal.mean` | IAU standard |
| `getLST` | `sidereal.apparent + lon` | Includes nutation |
| `equatorialToHorizontal` | `coord.Equatorial.toHorizontal` | Standardized |
| `eclipticToEquatorial` | `coord.Ecliptic.toEquatorial` | Time-dependent obliquity |

## New Functions to Add

| Function | Purpose |
|----------|---------|
| `getNutation` | Nutation corrections |
| `correctForAberration` | Star position correction |
| `precessEquatorial` | Epoch transformation |
| `getPlanetPositionWithLightTime` | Outer planet accuracy |

---

## Bundle Size Considerations

The VSOP87 data files are large (~50KB each for full precision). For web optimization:

1. **Lazy Loading**: Import planet data only when needed
2. **Tree Shaking**: Import specific modules, not entire library
3. **VSOP87B vs VSOP87D**: Use 'B' series (heliocentric) for orrery, 'D' (barycentric) for higher precision

```typescript
// Good - tree-shakable
import { julian } from 'astronomia';
import vsop87Bmars from 'astronomia/data/vsop87Bmars';

// Avoid - imports entire library
import * as astronomia from 'astronomia';
```

---

## References

- [astronomia GitHub Repository](https://github.com/commenthol/astronomia)
- [Astronomical Algorithms by Jean Meeus](https://www.willbell.com/math/mc1.htm)
- [VSOP87 Theory](https://en.wikipedia.org/wiki/VSOP87)
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) (for validation)

---

*Generated by Code Quality Analyzer - Hive Mind Swarm*
