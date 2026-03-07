# Hybrid Cosmic Engine Adapter Layer Architecture

**Version:** 1.0.0
**Date:** 2026-01-06
**Status:** Proposed
**Author:** System Architecture Designer

---

## 1. Executive Summary

This document defines the adapter layer architecture for bridging the `astronomia-master` JavaScript astronomical library with the existing 3D Solar System visualization. The architecture follows a three-layer design pattern that ensures:

- Type-safe TypeScript integration with pure JavaScript library
- Clean separation of concerns between calculation and rendering
- Extensibility for future astronomical features
- Minimal breaking changes to existing visualization code

---

## 2. Architecture Overview

### 2.1 Component Diagram (C4 Level 2)

```
+-----------------------------------------------------------------------------------+
|                                   3D Visualization Layer                           |
|  +-----------------------------------------------------------------------------+  |
|  |                          CelestialOrreryCore.tsx                            |  |
|  |   - THREE.js rendering                                                      |  |
|  |   - Camera controls                                                         |  |
|  |   - Animation loop                                                          |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|                               uses     v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                         React Hooks Layer (Layer 3)                         |  |
|  |  +---------------------------+  +---------------------------------------+   |  |
|  |  |   useCelestialOrrery.ts   |  |   useCosmicEngine.ts (NEW)            |   |  |
|  |  |   - View state            |  |   - Planet positions                  |   |  |
|  |  |   - Time controls         |  |   - Moon position/phase               |   |  |
|  |  |   - Camera state          |  |   - Coordinate transforms             |   |  |
|  |  +---------------------------+  +---------------------------------------+   |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|                               uses     v                                          |
+-----------------------------------------------------------------------------------+
|                                   Service Layer (Layer 2)                          |
|  +-----------------------------------------------------------------------------+  |
|  |                           CosmicEngineService                                |  |
|  |  +---------------------------+  +---------------------------------------+   |  |
|  |  |   Unified API             |  |   Caching Layer                       |   |  |
|  |  |   - getPlanetPosition()   |  |   - Position cache (LRU)              |   |  |
|  |  |   - getMoonPosition()     |  |   - Phase cache                       |   |  |
|  |  |   - getMoonPhase()        |  |   - Transform cache                   |   |  |
|  |  |   - getTransform()        |  |                                       |   |  |
|  |  +---------------------------+  +---------------------------------------+   |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|                               uses     v                                          |
+-----------------------------------------------------------------------------------+
|                                   Wrapper Layer (Layer 1)                          |
|  +-----------------------------------------------------------------------------+  |
|  |                         AstronomiaWrapper                                    |  |
|  |  +---------------------------+  +---------------------------------------+   |  |
|  |  |   Type Definitions        |  |   JS Interop                          |   |  |
|  |  |   - astronomia.d.ts       |  |   - Dynamic imports                   |   |  |
|  |  |   - VSOP87 data types     |  |   - Error handling                    |   |  |
|  |  |   - Coord types           |  |   - Unit conversions                  |   |  |
|  |  +---------------------------+  +---------------------------------------+   |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|                               wraps    v                                          |
+-----------------------------------------------------------------------------------+
|                               astronomia-master (JavaScript)                       |
|  +------------------+  +------------------+  +------------------+                  |
|  |  planetposition  |  |  moonposition   |  |     coord        |                  |
|  |  - VSOP87 theory |  |  - ELP theory   |  |  - Ecliptic      |                  |
|  |  - Position2000  |  |  - position()   |  |  - Equatorial    |                  |
|  +------------------+  +------------------+  +------------------+                  |
|  +------------------+  +------------------+  +------------------+                  |
|  |   moonphase      |  |     julian      |  |   nutation       |                  |
|  |  - newMoon       |  |  - Calendar     |  |  - obliquity     |                  |
|  |  - full          |  |  - DateToJD     |  |  - meanObliquity |                  |
|  +------------------+  +------------------+  +------------------+                  |
+-----------------------------------------------------------------------------------+
```

### 2.2 Data Flow Diagram

```
User Interaction          Time Update              Birth Chart Request
       |                        |                          |
       v                        v                          v
+----------------+      +----------------+         +----------------+
|  Date Input    |      |  Animation     |         |  Date + Time   |
|  Location      |      |  Loop Tick     |         |  + Location    |
+----------------+      +----------------+         +----------------+
       |                        |                          |
       +------------------------+--------------------------+
                                |
                                v
                    +------------------------+
                    |   useCosmicEngine()    |
                    |   React Hook           |
                    +------------------------+
                                |
                                v
                    +------------------------+
                    |  CosmicEngineService   |
                    |  - Check cache         |
                    |  - Call wrapper        |
                    +------------------------+
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
      +-------------+   +-------------+   +-------------+
      |  getPlanet  |   |  getMoon    |   | getTransform|
      |  Position   |   |  Position   |   |             |
      +-------------+   +-------------+   +-------------+
              |                 |                 |
              v                 v                 v
      +-------------+   +-------------+   +-------------+
      | Astronomia  |   | Astronomia  |   | Astronomia  |
      | planet      |   | moon        |   | coord       |
      | position.js |   | position.js |   |             |
      +-------------+   +-------------+   +-------------+
              |                 |                 |
              +-----------------+-----------------+
                                |
                                v
                    +------------------------+
                    |  Position3D Result     |
                    |  { x, y, z, distance,  |
                    |    ra, dec }           |
                    +------------------------+
                                |
                                v
                    +------------------------+
                    |  3D Mesh Update        |
                    |  - mesh.position.set() |
                    +------------------------+
```

---

## 3. Interface Definitions

### 3.1 Core Types (lib/cosmicEngine/types.ts)

```typescript
// ============================================================================
// COORDINATE SYSTEM TYPES
// ============================================================================

export type CoordinateSystem =
  | 'ecliptic'      // Referenced to Earth's orbital plane
  | 'equatorial'    // Referenced to Earth's rotational axis
  | 'horizontal'    // Referenced to local horizon (alt/az)
  | 'galactic';     // Referenced to Milky Way plane

export interface Position3D {
  x: number;        // AU or km depending on context
  y: number;
  z: number;
}

export interface SphericalPosition {
  lon: number;      // Longitude/RA in radians
  lat: number;      // Latitude/Dec in radians
  range: number;    // Distance in AU or km
}

export interface EclipticCoordinates extends SphericalPosition {
  type: 'ecliptic';
}

export interface EquatorialCoordinates {
  ra: number;       // Right Ascension in radians (0-2PI)
  dec: number;      // Declination in radians (-PI/2 to PI/2)
  range?: number;   // Distance (optional)
}

export interface HorizontalCoordinates {
  altitude: number; // Altitude in degrees (-90 to +90)
  azimuth: number;  // Azimuth in degrees (0-360, N=0, E=90)
}

// ============================================================================
// CELESTIAL BODY TYPES
// ============================================================================

export type PlanetName =
  | 'mercury' | 'venus' | 'earth' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export interface CelestialPosition {
  cartesian: Position3D;           // For 3D rendering
  spherical: SphericalPosition;    // For calculations
  equatorial: EquatorialCoordinates; // For sky position
  distance: number;                 // Heliocentric distance (AU)
  lightTime: number;                // Light travel time (days)
  jde: number;                      // Julian Ephemeris Day computed for
}

// ============================================================================
// MOON-SPECIFIC TYPES
// ============================================================================

export type MoonPhaseName =
  | 'new' | 'waxingCrescent' | 'firstQuarter' | 'waxingGibbous'
  | 'full' | 'waningGibbous' | 'lastQuarter' | 'waningCrescent';

export interface MoonPhaseInfo {
  phase: number;            // 0-1 (0=new, 0.5=full)
  phaseName: MoonPhaseName;
  illumination: number;     // 0-1 (fraction illuminated)
  age: number;              // Days since new moon
  nextNewMoon: Date;
  nextFullMoon: Date;
}

export interface MoonPosition extends CelestialPosition {
  parallax: number;         // Horizontal parallax in radians
  libration: {
    longitude: number;      // Optical libration in longitude
    latitude: number;       // Optical libration in latitude
  };
}

// ============================================================================
// TRANSFORM TYPES
// ============================================================================

export type TransformFn = (pos: SphericalPosition) => SphericalPosition;

export interface ObserverLocation {
  latitude: number;   // Degrees, positive north
  longitude: number;  // Degrees, positive east
  elevation?: number; // Meters above sea level
}

export interface TransformOptions {
  observer?: ObserverLocation;
  epoch?: 'J2000' | 'date' | number;  // Precession epoch
  aberration?: boolean;
  nutation?: boolean;
  refraction?: boolean;
}
```

### 3.2 Cosmic Engine Adapter Interface (lib/cosmicEngine/adapter.ts)

```typescript
import type {
  PlanetName,
  CelestialPosition,
  MoonPosition,
  MoonPhaseInfo,
  CoordinateSystem,
  TransformFn,
  TransformOptions,
  ObserverLocation
} from './types';

/**
 * Primary interface for the Cosmic Engine Adapter
 * Provides a unified API for astronomical calculations
 */
export interface CosmicEngineAdapter {
  // =========================================================================
  // PLANET CALCULATIONS
  // =========================================================================

  /**
   * Calculate the position of a planet at a given date
   * @param planet - Planet name (mercury, venus, etc.)
   * @param date - JavaScript Date object (UTC)
   * @returns Full position information including 3D coordinates
   */
  getPlanetPosition(planet: PlanetName, date: Date): CelestialPosition;

  /**
   * Get positions of all planets at once (optimized batch calculation)
   * @param date - JavaScript Date object (UTC)
   * @returns Map of planet names to positions
   */
  getAllPlanetPositions(date: Date): Map<PlanetName, CelestialPosition>;

  // =========================================================================
  // MOON CALCULATIONS
  // =========================================================================

  /**
   * Calculate the Moon's position at a given date
   * @param date - JavaScript Date object (UTC)
   * @returns Full Moon position including libration
   */
  getMoonPosition(date: Date): MoonPosition;

  /**
   * Calculate Moon phase information
   * @param date - JavaScript Date object (UTC)
   * @returns Phase name, illumination, and upcoming phase dates
   */
  getMoonPhase(date: Date): MoonPhaseInfo;

  // =========================================================================
  // COORDINATE TRANSFORMATIONS
  // =========================================================================

  /**
   * Get a transformation function between coordinate systems
   * @param from - Source coordinate system
   * @param to - Target coordinate system
   * @param options - Transform options (observer location, corrections)
   * @returns A function that transforms coordinates
   */
  getCoordinateTransform(
    from: CoordinateSystem,
    to: CoordinateSystem,
    options?: TransformOptions
  ): TransformFn;

  /**
   * Transform equatorial coordinates to horizontal (alt/az) for observer
   * @param ra - Right Ascension in hours
   * @param dec - Declination in degrees
   * @param date - Observation time
   * @param observer - Observer location
   * @returns Altitude and Azimuth in degrees
   */
  equatorialToHorizontal(
    ra: number,
    dec: number,
    date: Date,
    observer: ObserverLocation
  ): { altitude: number; azimuth: number };

  // =========================================================================
  // TIME UTILITIES
  // =========================================================================

  /**
   * Convert JavaScript Date to Julian Day
   */
  dateToJD(date: Date): number;

  /**
   * Convert Julian Day to JavaScript Date
   */
  jdToDate(jd: number): Date;

  /**
   * Get sidereal time for a location
   * @param date - Date/time
   * @param longitude - Observer longitude in degrees
   * @returns Local Sidereal Time in hours
   */
  getLocalSiderealTime(date: Date, longitude: number): number;

  // =========================================================================
  // 3D RENDERING HELPERS
  // =========================================================================

  /**
   * Convert celestial position to scaled 3D coordinates for visualization
   * @param position - Celestial position
   * @param scale - Logarithmic scale factor (default: 25)
   * @returns Position3D suitable for THREE.js
   */
  toVisualizationCoords(
    position: CelestialPosition,
    scale?: number
  ): { x: number; y: number; z: number };
}
```

### 3.3 Service Layer Interface (lib/cosmicEngine/service.ts)

```typescript
import type { CosmicEngineAdapter } from './adapter';
import type { PlanetName, CelestialPosition, MoonPosition } from './types';

export interface CacheOptions {
  maxSize: number;          // Maximum cache entries
  ttlMs: number;            // Time-to-live in milliseconds
  precisionSeconds: number; // Time rounding for cache keys
}

export interface CosmicEngineServiceOptions {
  cache?: Partial<CacheOptions>;
  fallbackToSimple?: boolean;  // Use simple Keplerian if VSOP87 fails
}

/**
 * Service layer that wraps the adapter with caching and error handling
 */
export interface CosmicEngineService extends CosmicEngineAdapter {
  /**
   * Precompute positions for a time range (for smooth animation)
   * @param startDate - Range start
   * @param endDate - Range end
   * @param stepMs - Step size in milliseconds
   */
  precomputeRange(
    startDate: Date,
    endDate: Date,
    stepMs: number
  ): Promise<void>;

  /**
   * Clear all cached data
   */
  clearCache(): void;

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };

  /**
   * Check if astronomia library is loaded and ready
   */
  isReady(): boolean;

  /**
   * Initialize the service (load astronomia dynamically)
   */
  initialize(): Promise<void>;
}
```

---

## 4. Layer 1: Astronomia Wrapper

### 4.1 Type Declarations (lib/cosmicEngine/astronomia.d.ts)

```typescript
/**
 * Type declarations for astronomia JavaScript library
 * Based on astronomia-master/src/* analysis
 */

declare module 'astronomia' {
  // base.js exports
  export namespace base {
    const J2000: number;
    const JulianCentury: number;
    const AU: number;

    function J2000Century(jde: number): number;
    function pmod(x: number, y: number): number;
    function horner(x: number, ...c: number[]): number;
    function sincos(angle: number): [number, number];
    function toRad(deg: number): number;
    function toDeg(rad: number): number;

    class Coord {
      constructor(ra: number, dec: number, range?: number);
      ra: number;
      dec: number;
      lon: number;
      lat: number;
      range?: number;
    }
  }

  // julian.js exports
  export namespace julian {
    class Calendar {
      constructor(year?: number | Date, month?: number, day?: number);
      year: number;
      month: number;
      day: number;
      toJD(): number;
      fromJD(jd: number): Calendar;
      toDate(): Date;
      fromDate(date: Date): Calendar;
    }

    class CalendarGregorian extends Calendar {}

    function DateToJD(date: Date): number;
    function JDToDate(jd: number): Date;
  }

  // coord.js exports
  export namespace coord {
    class Ecliptic {
      constructor(lon: number, lat: number);
      lon: number;
      lat: number;
      toEquatorial(obliquity: number): Equatorial;
    }

    class Equatorial {
      constructor(ra?: number, dec?: number);
      ra: number;
      dec: number;
      toEcliptic(obliquity: number): Ecliptic;
      toHorizontal(g: { lat: number; lon: number }, st: number): Horizontal;
    }

    class Horizontal {
      constructor(az?: number, alt?: number);
      az: number;
      alt: number;
      toEquatorial(g: { lat: number; lon: number }, st: number): Equatorial;
    }
  }

  // planetposition.js exports
  export namespace planetposition {
    class Planet {
      constructor(vsop87Data: object);
      name: string;
      position2000(jde: number): base.Coord;
      position(jde: number): base.Coord;
    }

    function toFK5(lon: number, lat: number, jde: number): base.Coord;
  }

  // moonposition.js exports
  export namespace moonposition {
    function position(jde: number): base.Coord;
    function parallax(distance: number): number;
    function node(jde: number): number;
    function perigee(jde: number): number;
    function trueNode(jde: number): number;
  }

  // moonphase.js exports
  export namespace moonphase {
    const meanLunarMonth: number;

    function newMoon(year: number): number;
    function first(year: number): number;
    function full(year: number): number;
    function last(year: number): number;
  }

  // nutation.js exports
  export namespace nutation {
    function nutation(jde: number): [number, number];
    function meanObliquity(jde: number): number;
    function trueObliquity(jde: number): number;
  }

  // sidereal.js exports
  export namespace sidereal {
    function mean(jd: number): number;
    function apparent(jd: number): number;
  }
}

// VSOP87 data modules
declare module 'astronomia/data/vsop87Bearth' {
  const data: object;
  export default data;
}

declare module 'astronomia/data/vsop87Bmars' {
  const data: object;
  export default data;
}

// ... similar declarations for other planets
```

### 4.2 Wrapper Implementation Structure (lib/cosmicEngine/wrapper.ts)

```typescript
/**
 * AstronomiaWrapper - Layer 1
 *
 * Handles JavaScript interop, dynamic loading, and type conversion
 * from astronomia library to our TypeScript types.
 */

import type {
  PlanetName,
  CelestialPosition,
  MoonPosition,
  SphericalPosition,
  EquatorialCoordinates
} from './types';

// Lazy-loaded astronomia modules
let astronomia: typeof import('astronomia') | null = null;
let vsopData: Record<PlanetName, object> | null = null;
let planets: Record<PlanetName, any> | null = null;

/**
 * Dynamically load astronomia library
 * This is necessary because astronomia is a pure JavaScript library
 */
export async function loadAstronomia(): Promise<void> {
  if (astronomia) return;

  // Dynamic import of the library
  astronomia = await import('astronomia');

  // Load VSOP87 data for each planet
  const [
    earthData,
    marsData,
    venusData,
    mercuryData,
    jupiterData,
    saturnData,
    uranusData,
    neptuneData
  ] = await Promise.all([
    import('astronomia/data/vsop87Bearth'),
    import('astronomia/data/vsop87Bmars'),
    import('astronomia/data/vsop87Bvenus'),
    import('astronomia/data/vsop87Bmercury'),
    import('astronomia/data/vsop87Bjupiter'),
    import('astronomia/data/vsop87Bsaturn'),
    import('astronomia/data/vsop87Buranus'),
    import('astronomia/data/vsop87Bneptune')
  ]);

  vsopData = {
    earth: earthData.default,
    mars: marsData.default,
    venus: venusData.default,
    mercury: mercuryData.default,
    jupiter: jupiterData.default,
    saturn: saturnData.default,
    uranus: uranusData.default,
    neptune: neptuneData.default
  };

  // Create Planet instances
  planets = {} as Record<PlanetName, any>;
  for (const [name, data] of Object.entries(vsopData)) {
    planets[name as PlanetName] = new astronomia.planetposition.Planet(data);
  }
}

/**
 * Check if wrapper is initialized
 */
export function isLoaded(): boolean {
  return astronomia !== null && planets !== null;
}

/**
 * Get raw planet position from astronomia
 */
export function getRawPlanetPosition(
  planet: PlanetName,
  jde: number
): SphericalPosition {
  if (!planets || !planets[planet]) {
    throw new Error(`Planet ${planet} not loaded`);
  }

  const coord = planets[planet].position2000(jde);

  return {
    lon: coord.lon,
    lat: coord.lat,
    range: coord.range
  };
}

/**
 * Convert spherical ecliptic to equatorial coordinates
 */
export function eclipticToEquatorial(
  ecliptic: SphericalPosition,
  jde: number
): EquatorialCoordinates {
  if (!astronomia) throw new Error('Astronomia not loaded');

  const obliquity = astronomia.nutation.meanObliquity(jde);
  const ecl = new astronomia.coord.Ecliptic(ecliptic.lon, ecliptic.lat);
  const equ = ecl.toEquatorial(obliquity);

  return {
    ra: equ.ra,
    dec: equ.dec,
    range: ecliptic.range
  };
}

/**
 * Get Moon position from astronomia
 */
export function getRawMoonPosition(jde: number): {
  spherical: SphericalPosition;
  parallax: number;
} {
  if (!astronomia) throw new Error('Astronomia not loaded');

  const coord = astronomia.moonposition.position(jde);
  const parallax = astronomia.moonposition.parallax(coord.range);

  return {
    spherical: {
      lon: coord.lon,
      lat: coord.lat,
      range: coord.range
    },
    parallax
  };
}

/**
 * Convert Date to Julian Ephemeris Day
 */
export function dateToJDE(date: Date): number {
  if (!astronomia) throw new Error('Astronomia not loaded');
  return astronomia.julian.DateToJD(date);
}

/**
 * Convert Julian Day to Date
 */
export function jdeToDate(jde: number): Date {
  if (!astronomia) throw new Error('Astronomia not loaded');
  return astronomia.julian.JDToDate(jde);
}
```

---

## 5. Layer 2: Cosmic Engine Service

### 5.1 Service Implementation Structure

```typescript
/**
 * CosmicEngineService - Layer 2
 *
 * Provides caching, error handling, and the unified API.
 * This is the primary entry point for astronomical calculations.
 */

import * as wrapper from './wrapper';
import type {
  CosmicEngineService as ICosmicEngineService,
  CosmicEngineServiceOptions,
  PlanetName,
  CelestialPosition,
  MoonPosition,
  MoonPhaseInfo,
  CoordinateSystem,
  TransformFn,
  TransformOptions,
  ObserverLocation
} from './types';

// LRU Cache implementation
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 1000, ttlMs = 60000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Create cache key from date with configurable precision
 */
function makeCacheKey(date: Date, precisionSeconds: number): string {
  const rounded = Math.floor(date.getTime() / (precisionSeconds * 1000));
  return rounded.toString();
}

export function createCosmicEngineService(
  options: CosmicEngineServiceOptions = {}
): ICosmicEngineService {
  const cacheOptions = {
    maxSize: options.cache?.maxSize ?? 1000,
    ttlMs: options.cache?.ttlMs ?? 60000,
    precisionSeconds: options.cache?.precisionSeconds ?? 60
  };

  const positionCache = new LRUCache<string, CelestialPosition>(
    cacheOptions.maxSize,
    cacheOptions.ttlMs
  );

  const moonCache = new LRUCache<string, MoonPosition>(
    cacheOptions.maxSize / 4,
    cacheOptions.ttlMs
  );

  let isInitialized = false;
  let hits = 0;
  let misses = 0;

  const service: ICosmicEngineService = {
    // Initialization
    async initialize(): Promise<void> {
      await wrapper.loadAstronomia();
      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized && wrapper.isLoaded();
    },

    // Planet calculations
    getPlanetPosition(planet: PlanetName, date: Date): CelestialPosition {
      const cacheKey = `${planet}:${makeCacheKey(date, cacheOptions.precisionSeconds)}`;

      const cached = positionCache.get(cacheKey);
      if (cached) {
        hits++;
        return cached;
      }
      misses++;

      const jde = wrapper.dateToJDE(date);
      const spherical = wrapper.getRawPlanetPosition(planet, jde);
      const equatorial = wrapper.eclipticToEquatorial(spherical, jde);

      // Convert to Cartesian for 3D rendering
      const cartesian = sphericalToCartesian(spherical);

      const position: CelestialPosition = {
        cartesian,
        spherical,
        equatorial,
        distance: spherical.range,
        lightTime: spherical.range * 0.0057755183, // AU to days
        jde
      };

      positionCache.set(cacheKey, position);
      return position;
    },

    getAllPlanetPositions(date: Date): Map<PlanetName, CelestialPosition> {
      const planets: PlanetName[] = [
        'mercury', 'venus', 'earth', 'mars',
        'jupiter', 'saturn', 'uranus', 'neptune'
      ];

      const result = new Map<PlanetName, CelestialPosition>();
      for (const planet of planets) {
        result.set(planet, this.getPlanetPosition(planet, date));
      }
      return result;
    },

    // Moon calculations
    getMoonPosition(date: Date): MoonPosition {
      const cacheKey = `moon:${makeCacheKey(date, cacheOptions.precisionSeconds)}`;

      const cached = moonCache.get(cacheKey);
      if (cached) {
        hits++;
        return cached;
      }
      misses++;

      const jde = wrapper.dateToJDE(date);
      const { spherical, parallax } = wrapper.getRawMoonPosition(jde);
      const equatorial = wrapper.eclipticToEquatorial(spherical, jde);
      const cartesian = sphericalToCartesian(spherical);

      const position: MoonPosition = {
        cartesian,
        spherical,
        equatorial,
        distance: spherical.range,
        lightTime: spherical.range / 299792.458 / 86400, // km to days
        jde,
        parallax,
        libration: { longitude: 0, latitude: 0 } // TODO: Implement libration
      };

      moonCache.set(cacheKey, position);
      return position;
    },

    getMoonPhase(date: Date): MoonPhaseInfo {
      // Implementation using moonphase module
      const jde = wrapper.dateToJDE(date);
      const year = date.getFullYear() +
        (date.getMonth() + date.getDate() / 31) / 12;

      // Calculate synodic age
      const synMonth = 29.530588861;
      const refNewMoon = 2451550.1; // Known new moon JDE
      const cycles = (jde - refNewMoon) / synMonth;
      const phase = cycles - Math.floor(cycles);
      const age = phase * synMonth;

      // Determine phase name
      let phaseName: MoonPhaseInfo['phaseName'];
      if (phase < 0.0625) phaseName = 'new';
      else if (phase < 0.1875) phaseName = 'waxingCrescent';
      else if (phase < 0.3125) phaseName = 'firstQuarter';
      else if (phase < 0.4375) phaseName = 'waxingGibbous';
      else if (phase < 0.5625) phaseName = 'full';
      else if (phase < 0.6875) phaseName = 'waningGibbous';
      else if (phase < 0.8125) phaseName = 'lastQuarter';
      else if (phase < 0.9375) phaseName = 'waningCrescent';
      else phaseName = 'new';

      // Calculate illumination
      const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

      return {
        phase,
        phaseName,
        illumination,
        age,
        nextNewMoon: wrapper.jdeToDate(refNewMoon + Math.ceil(cycles) * synMonth),
        nextFullMoon: wrapper.jdeToDate(refNewMoon + (Math.ceil(cycles - 0.5) + 0.5) * synMonth)
      };
    },

    // Coordinate transforms
    getCoordinateTransform(
      from: CoordinateSystem,
      to: CoordinateSystem,
      options?: TransformOptions
    ): TransformFn {
      // Returns a reusable transform function
      // Implementation depends on from/to combination
      return (pos) => pos; // Placeholder
    },

    equatorialToHorizontal(
      ra: number,
      dec: number,
      date: Date,
      observer: ObserverLocation
    ): { altitude: number; azimuth: number } {
      // Use existing calculation from lib/astronomy/calculations.ts
      // or astronomia's coord module
      return { altitude: 0, azimuth: 0 }; // Placeholder
    },

    // Time utilities
    dateToJD(date: Date): number {
      return wrapper.dateToJDE(date);
    },

    jdToDate(jd: number): Date {
      return wrapper.jdeToDate(jd);
    },

    getLocalSiderealTime(date: Date, longitude: number): number {
      // Implementation using sidereal module
      return 0; // Placeholder
    },

    // 3D helpers
    toVisualizationCoords(position: CelestialPosition, scale = 25) {
      const r = position.distance;
      const scaled = Math.log10(r + 1) * scale;
      const factor = scaled / r;

      return {
        x: position.cartesian.x * factor,
        y: position.cartesian.z * factor,
        z: -position.cartesian.y * factor
      };
    },

    // Cache management
    async precomputeRange(startDate, endDate, stepMs): Promise<void> {
      const current = new Date(startDate);
      while (current <= endDate) {
        this.getAllPlanetPositions(current);
        this.getMoonPosition(current);
        current.setTime(current.getTime() + stepMs);
      }
    },

    clearCache(): void {
      positionCache.clear();
      moonCache.clear();
      hits = 0;
      misses = 0;
    },

    getCacheStats() {
      const total = hits + misses;
      return {
        size: positionCache.size + moonCache.size,
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0
      };
    }
  };

  return service;
}

// Helper: Convert spherical to Cartesian
function sphericalToCartesian(spherical: { lon: number; lat: number; range: number }) {
  const { lon, lat, range } = spherical;
  return {
    x: range * Math.cos(lat) * Math.cos(lon),
    y: range * Math.cos(lat) * Math.sin(lon),
    z: range * Math.sin(lat)
  };
}
```

---

## 6. Layer 3: React Hooks

### 6.1 useCosmicEngine Hook

```typescript
/**
 * useCosmicEngine - React hook for astronomical calculations
 *
 * Provides reactive access to the CosmicEngineService with
 * automatic initialization and cleanup.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createCosmicEngineService } from './service';
import type {
  CosmicEngineService,
  PlanetName,
  CelestialPosition,
  MoonPosition,
  MoonPhaseInfo,
  ObserverLocation
} from './types';

export interface UseCosmicEngineOptions {
  autoInitialize?: boolean;
  cacheSize?: number;
  cacheTTL?: number;
}

export interface UseCosmicEngineReturn {
  // Status
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;

  // Initialize manually if autoInitialize is false
  initialize: () => Promise<void>;

  // Planet calculations
  getPlanetPosition: (planet: PlanetName, date: Date) => CelestialPosition | null;
  getAllPlanetPositions: (date: Date) => Map<PlanetName, CelestialPosition> | null;

  // Moon calculations
  getMoonPosition: (date: Date) => MoonPosition | null;
  getMoonPhase: (date: Date) => MoonPhaseInfo | null;

  // Coordinate transforms
  equatorialToHorizontal: (
    ra: number,
    dec: number,
    date: Date,
    observer: ObserverLocation
  ) => { altitude: number; azimuth: number } | null;

  // 3D rendering
  getVisualizationCoords: (
    planet: PlanetName,
    date: Date,
    scale?: number
  ) => { x: number; y: number; z: number } | null;

  // Cache management
  clearCache: () => void;
  getCacheStats: () => { size: number; hitRate: number };
  preloadRange: (start: Date, end: Date, stepMs: number) => Promise<void>;
}

export function useCosmicEngine(
  options: UseCosmicEngineOptions = {}
): UseCosmicEngineReturn {
  const {
    autoInitialize = true,
    cacheSize = 1000,
    cacheTTL = 60000
  } = options;

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create service instance (memoized)
  const service = useMemo(() =>
    createCosmicEngineService({
      cache: { maxSize: cacheSize, ttlMs: cacheTTL }
    }),
    [cacheSize, cacheTTL]
  );

  // Initialize on mount if autoInitialize
  useEffect(() => {
    if (autoInitialize && !isReady && !isLoading) {
      setIsLoading(true);
      service.initialize()
        .then(() => {
          setIsReady(true);
          setError(null);
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [autoInitialize, isReady, isLoading, service]);

  // Manual initialize
  const initialize = useCallback(async () => {
    if (isReady || isLoading) return;
    setIsLoading(true);
    try {
      await service.initialize();
      setIsReady(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading, service]);

  // Safe wrappers that return null if not ready
  const getPlanetPosition = useCallback((planet: PlanetName, date: Date) => {
    if (!isReady) return null;
    try {
      return service.getPlanetPosition(planet, date);
    } catch {
      return null;
    }
  }, [isReady, service]);

  const getAllPlanetPositions = useCallback((date: Date) => {
    if (!isReady) return null;
    try {
      return service.getAllPlanetPositions(date);
    } catch {
      return null;
    }
  }, [isReady, service]);

  const getMoonPosition = useCallback((date: Date) => {
    if (!isReady) return null;
    try {
      return service.getMoonPosition(date);
    } catch {
      return null;
    }
  }, [isReady, service]);

  const getMoonPhase = useCallback((date: Date) => {
    if (!isReady) return null;
    try {
      return service.getMoonPhase(date);
    } catch {
      return null;
    }
  }, [isReady, service]);

  const equatorialToHorizontal = useCallback((
    ra: number,
    dec: number,
    date: Date,
    observer: ObserverLocation
  ) => {
    if (!isReady) return null;
    try {
      return service.equatorialToHorizontal(ra, dec, date, observer);
    } catch {
      return null;
    }
  }, [isReady, service]);

  const getVisualizationCoords = useCallback((
    planet: PlanetName,
    date: Date,
    scale = 25
  ) => {
    if (!isReady) return null;
    try {
      const pos = service.getPlanetPosition(planet, date);
      return service.toVisualizationCoords(pos, scale);
    } catch {
      return null;
    }
  }, [isReady, service]);

  const clearCache = useCallback(() => {
    service.clearCache();
  }, [service]);

  const getCacheStats = useCallback(() => {
    const stats = service.getCacheStats();
    return { size: stats.size, hitRate: stats.hitRate };
  }, [service]);

  const preloadRange = useCallback(async (start: Date, end: Date, stepMs: number) => {
    if (!isReady) return;
    await service.precomputeRange(start, end, stepMs);
  }, [isReady, service]);

  return {
    isReady,
    isLoading,
    error,
    initialize,
    getPlanetPosition,
    getAllPlanetPositions,
    getMoonPosition,
    getMoonPhase,
    equatorialToHorizontal,
    getVisualizationCoords,
    clearCache,
    getCacheStats,
    preloadRange
  };
}
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1)

| Task | Priority | Effort |
|------|----------|--------|
| Create `lib/cosmicEngine/` directory structure | High | 0.5d |
| Implement `types.ts` with all interfaces | High | 1d |
| Create `astronomia.d.ts` type declarations | High | 1d |
| Implement basic `wrapper.ts` with dynamic loading | High | 1.5d |
| Unit tests for wrapper | Medium | 1d |

### Phase 2: Service Layer (Week 2)

| Task | Priority | Effort |
|------|----------|--------|
| Implement LRU cache utilities | High | 0.5d |
| Implement `service.ts` planet calculations | High | 1.5d |
| Implement Moon position and phase | High | 1d |
| Implement coordinate transforms | Medium | 1d |
| Unit tests for service | High | 1d |

### Phase 3: React Integration (Week 3)

| Task | Priority | Effort |
|------|----------|--------|
| Implement `useCosmicEngine.ts` hook | High | 1d |
| Integration with `useCelestialOrrery.ts` | High | 1d |
| Update `CelestialOrreryCore.tsx` to use new service | High | 2d |
| Performance testing and optimization | Medium | 1d |

### Phase 4: Migration & Cleanup (Week 4)

| Task | Priority | Effort |
|------|----------|--------|
| Migrate existing calculations to new adapter | High | 2d |
| Update tests for new architecture | High | 1d |
| Documentation updates | Medium | 0.5d |
| Remove deprecated code | Low | 0.5d |
| Final integration testing | High | 1d |

---

## 8. Architecture Decision Records

### ADR-001: Dynamic Import for astronomia

**Status:** Accepted

**Context:** The astronomia library is a pure JavaScript library with no TypeScript declarations. We need to integrate it into a TypeScript codebase while maintaining type safety.

**Decision:** Use dynamic imports (`import()`) to load astronomia modules at runtime, combined with hand-crafted TypeScript declaration files.

**Rationale:**
- Avoids bundling large VSOP87 data files until needed
- Enables tree-shaking for unused modules
- Allows graceful fallback if loading fails

**Consequences:**
- Need to maintain separate type declarations
- Initialization is async (requires loading phase)
- Slightly more complex initialization logic

---

### ADR-002: LRU Caching Strategy

**Status:** Accepted

**Context:** Planet position calculations are computationally expensive, especially with VSOP87 theory. Animation loops may request positions many times per second.

**Decision:** Implement an LRU cache with configurable TTL and size limits at the service layer.

**Rationale:**
- Reduces redundant calculations during animation
- Time-rounded cache keys allow reuse for nearby timestamps
- Memory-bounded to prevent excessive resource usage

**Consequences:**
- Slight memory overhead for caching
- Cache invalidation not needed (positions are time-based)
- May return slightly outdated values within TTL window

---

### ADR-003: Layered Architecture

**Status:** Accepted

**Context:** Need to support both existing simple Keplerian calculations and new high-precision VSOP87 calculations.

**Decision:** Three-layer architecture with clear separation:
1. Wrapper (JS interop)
2. Service (business logic + caching)
3. Hooks (React integration)

**Rationale:**
- Each layer has single responsibility
- Easy to swap implementations (e.g., mock for testing)
- Service layer can fallback to simple calculations if VSOP87 fails

**Consequences:**
- More files/modules to maintain
- Slight overhead from layer abstraction
- Clear upgrade path for future improvements

---

## 9. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| astronomia library incompatibility | Low | High | Fallback to existing Keplerian calculations |
| Performance regression | Medium | Medium | Caching layer, benchmark testing |
| Type declaration maintenance burden | Medium | Low | Automated testing of type coverage |
| VSOP87 data loading slowness | Medium | Medium | Lazy loading, precomputation option |
| Bundle size increase | High | Low | Code splitting, tree shaking |

---

## 10. File Structure Summary

```
lib/cosmicEngine/
  index.ts              # Public exports
  types.ts              # All type definitions
  adapter.ts            # Adapter interface
  wrapper.ts            # Layer 1: astronomia wrapper
  service.ts            # Layer 2: service with caching
  astronomia.d.ts       # Type declarations for astronomia

hooks/
  useCosmicEngine.ts    # Layer 3: React hook
  useCelestialOrrery.ts # (existing, to be updated)

tests/
  cosmicEngine/
    wrapper.test.ts
    service.test.ts
    integration.test.ts
```

---

**Document End**
