/**
 * Cosmic Engine Types
 * Core type definitions for high-precision astronomical calculations
 */

// ═══════════════════════════════════════════════════════════════════════════════
// JULIAN DATE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Julian Day number (days since Jan 1, 4713 BC noon) */
export type JulianDay = number;

/** Julian Ephemeris Day (includes delta-T correction for dynamical time) */
export type JulianEphemerisDay = number;

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Ecliptic coordinates (heliocentric or geocentric) */
export interface EclipticCoordinates {
  /** Longitude in radians */
  lon: number;
  /** Latitude in radians */
  lat: number;
  /** Distance in AU (or km for Moon) */
  range: number;
}

/** Equatorial coordinates */
export interface EquatorialCoordinates {
  /** Right Ascension in radians */
  ra: number;
  /** Declination in radians */
  dec: number;
  /** Distance in AU (optional) */
  range?: number;
}

/** Horizontal (alt-az) coordinates */
export interface HorizontalCoordinates {
  /** Altitude above horizon in radians */
  altitude: number;
  /** Azimuth from north in radians */
  azimuth: number;
}

/** 3D Cartesian position */
export interface CartesianPosition {
  x: number;
  y: number;
  z: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLANET TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Planet identifiers matching VSOP87 data */
export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

/** Planet position with metadata */
export interface PlanetPosition {
  /** Planet identifier */
  id: PlanetId;
  /** Display name */
  name: string;
  /** Heliocentric ecliptic coordinates (VSOP87) */
  heliocentric: EclipticCoordinates;
  /** Geocentric ecliptic coordinates (calculated from Earth) */
  geocentric?: EclipticCoordinates;
  /** Equatorial coordinates (if observer location provided) */
  equatorial?: EquatorialCoordinates;
  /** Horizontal coordinates (if observer location provided) */
  horizontal?: HorizontalCoordinates;
  /** 3D position for rendering (AU, ecliptic plane) */
  cartesian: CartesianPosition;
  /** Calculation timestamp */
  calculatedAt: Date;
  /** Julian Day used for calculation */
  jd: JulianDay;
}

/** Sun position (special case - always at origin heliocentrically) */
export interface SunPosition {
  /** Geocentric ecliptic coordinates */
  geocentric: EclipticCoordinates;
  /** Equatorial coordinates */
  equatorial?: EquatorialCoordinates;
  /** Horizontal coordinates (if observer location provided) */
  horizontal?: HorizontalCoordinates;
  /** Calculation timestamp */
  calculatedAt: Date;
  /** Julian Day used for calculation */
  jd: JulianDay;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOON TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Lunar phase names */
export type MoonPhaseName =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

/** Moon phase data */
export interface MoonPhaseData {
  /** Phase angle 0-1 (0 = new, 0.5 = full) */
  phase: number;
  /** Phase name */
  phaseName: MoonPhaseName;
  /** Illumination fraction 0-1 */
  illumination: number;
  /** Days since last new moon */
  age: number;
  /** Julian Day of next new moon */
  nextNewMoon?: JulianDay;
  /** Julian Day of next full moon */
  nextFullMoon?: JulianDay;
}

/** Moon position with phase data */
export interface MoonPosition {
  /** Geocentric ecliptic coordinates (ELP2000) */
  geocentric: EclipticCoordinates;
  /** Equatorial coordinates */
  equatorial?: EquatorialCoordinates;
  /** Horizontal coordinates (if observer location provided) */
  horizontal?: HorizontalCoordinates;
  /** Distance from Earth center in km */
  distance: number;
  /** Equatorial horizontal parallax in radians */
  parallax: number;
  /** Phase information */
  phase: MoonPhaseData;
  /** 3D position for rendering */
  cartesian: CartesianPosition;
  /** Calculation timestamp */
  calculatedAt: Date;
  /** Julian Day used for calculation */
  jd: JulianDay;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBSERVER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Geographic observer location */
export interface ObserverLocation {
  /** Latitude in degrees (-90 to 90) */
  latitude: number;
  /** Longitude in degrees (-180 to 180) */
  longitude: number;
  /** Elevation above sea level in meters (optional) */
  elevation?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Cache configuration */
export interface CacheConfig {
  /** Enable caching (default: true) */
  enabled: boolean;
  /** Maximum cache entries (default: 1000) */
  maxEntries: number;
  /** Cache TTL in milliseconds (default: 60000) */
  ttlMs: number;
}

/** Engine configuration */
export interface CosmicEngineConfig {
  /** Cache settings */
  cache?: Partial<CacheConfig>;
  /** Default observer location */
  observer?: ObserverLocation;
  /** Include outer planets (Uranus, Neptune) in calculations */
  includeOuterPlanets?: boolean;
  /** Calculate geocentric coordinates (requires Earth position) */
  calculateGeocentric?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

/** Complete solar system state at a point in time */
export interface SolarSystemState {
  /** Julian Day of calculation */
  jd: JulianDay;
  /** Timestamp */
  date: Date;
  /** Sun position (geocentric) */
  sun: SunPosition;
  /** Moon position and phase */
  moon: MoonPosition;
  /** Planet positions */
  planets: Map<PlanetId, PlanetPosition>;
  /** Observer location used (if any) */
  observer?: ObserverLocation;
}

/** Cosmic Engine adapter interface */
export interface CosmicEngineAdapter {
  /** Calculate single planet position */
  getPlanetPosition(planet: PlanetId, date: Date, observer?: ObserverLocation): Promise<PlanetPosition>;

  /** Calculate all planet positions */
  getAllPlanetPositions(date: Date, observer?: ObserverLocation): Promise<Map<PlanetId, PlanetPosition>>;

  /** Calculate sun position */
  getSunPosition(date: Date, observer?: ObserverLocation): Promise<SunPosition>;

  /** Calculate moon position and phase */
  getMoonPosition(date: Date, observer?: ObserverLocation): Promise<MoonPosition>;

  /** Get complete solar system state */
  getSolarSystemState(date: Date, observer?: ObserverLocation): Promise<SolarSystemState>;

  /** Convert Date to Julian Day */
  dateToJD(date: Date): Promise<JulianDay>;

  /** Convert Julian Day to Date */
  jdToDate(jd: JulianDay): Promise<Date>;

  /** Transform ecliptic to equatorial coordinates */
  eclipticToEquatorial(ecliptic: EclipticCoordinates, jd: JulianDay): Promise<EquatorialCoordinates>;

  /** Transform equatorial to horizontal coordinates */
  equatorialToHorizontal(
    equatorial: EquatorialCoordinates,
    jd: JulianDay,
    observer: ObserverLocation
  ): Promise<HorizontalCoordinates>;

  /** Clear calculation cache */
  clearCache(): void;

  /** Get cache statistics */
  getCacheStats(): { hits: number; misses: number; size: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Angle conversion utilities */
export const AngleUtils = {
  /** Degrees to radians */
  degToRad: (deg: number): number => deg * Math.PI / 180,
  /** Radians to degrees */
  radToDeg: (rad: number): number => rad * 180 / Math.PI,
  /** Normalize angle to 0-2π */
  normalizeRad: (rad: number): number => {
    const twoPi = 2 * Math.PI;
    return ((rad % twoPi) + twoPi) % twoPi;
  },
  /** Normalize angle to 0-360° */
  normalizeDeg: (deg: number): number => ((deg % 360) + 360) % 360,
} as const;

/** Planet display names */
export const PLANET_NAMES: Record<PlanetId, string> = {
  mercury: 'Mercury',
  venus: 'Venus',
  earth: 'Earth',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
} as const;

/** Planet orbital semi-major axes in AU (for scale reference) */
export const PLANET_ORBITAL_RADII: Record<PlanetId, number> = {
  mercury: 0.387,
  venus: 0.723,
  earth: 1.000,
  mars: 1.524,
  jupiter: 5.203,
  saturn: 9.537,
  uranus: 19.191,
  neptune: 30.069,
} as const;
