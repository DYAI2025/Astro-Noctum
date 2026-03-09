// ═══════════════════════════════════════════════════════════════════════════════
// COSMIC ENGINE - TYPE DEFINITIONS
// TypeScript interfaces for the hybrid astronomical calculation engine
// Integrates astronomia library with 3D Solar System visualization
// ═══════════════════════════════════════════════════════════════════════════════

// =============================================================================
// COORDINATE TYPES
// =============================================================================

/**
 * Generic coordinate in longitude/latitude/range format
 * Used for both ecliptic and equatorial coordinates
 */
export interface Coord {
  /** Longitude in radians (ecliptic) or Right Ascension in radians (equatorial) */
  lon: number;
  /** Latitude in radians (ecliptic) or Declination in radians (equatorial) */
  lat: number;
  /** Distance from the center body (AU for planets, km for Moon) */
  range: number;
}

/**
 * Ecliptic coordinates (heliocentric or geocentric)
 */
export interface EclipticCoord {
  /** Longitude in radians */
  lon: number;
  /** Latitude in radians */
  lat: number;
  /** Distance in AU (astronomical units) - optional */
  range?: number;
}

/**
 * Equatorial coordinates (geocentric)
 */
export interface EquatorialCoord {
  /** Right Ascension in radians */
  ra: number;
  /** Declination in radians */
  dec: number;
  /** Optional distance in AU */
  range?: number;
}

/**
 * Horizontal (alt-az) coordinates for observer on Earth
 */
export interface HorizontalCoord {
  /** Altitude above horizon in radians */
  alt: number;
  /** Azimuth from north in radians */
  az: number;
}

/**
 * 3D Cartesian position for Three.js rendering
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// =============================================================================
// PLANET TYPES
// =============================================================================

/**
 * Supported planet names for VSOP87 calculations
 */
export type PlanetName =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

/**
 * Complete planet position with all coordinate systems (simplified for vsop87-provider)
 */
export interface PlanetPosition extends Position3D {
  /** Heliocentric or geocentric distance in AU */
  distance: number;
  /** Right Ascension in radians */
  ra: number;
  /** Declination in radians */
  dec: number;
  /** Ecliptic longitude in radians */
  lon: number;
  /** Ecliptic latitude in radians */
  lat: number;
}

/**
 * Geocentric planet position (as seen from Earth)
 */
export interface GeocentricPosition {
  /** Right Ascension in radians */
  ra: number;
  /** Declination in radians */
  dec: number;
  /** Distance from Earth in AU */
  distance: number;
  /** Elongation from Sun in radians */
  elongation?: number;
}

/**
 * Legacy planet position with all coordinate systems (for compatibility)
 */
export interface PlanetPositionFull {
  /** Planet identifier */
  planet: string;
  /** Julian Ephemeris Day of calculation */
  jde: number;
  /** Heliocentric ecliptic coordinates (VSOP87) */
  heliocentric: EclipticCoord & { range: number };
  /** Geocentric ecliptic coordinates */
  geocentric?: EclipticCoord & { range: number };
  /** Geocentric equatorial coordinates */
  equatorial?: EquatorialCoord;
  /** 3D position for visualization (scaled) */
  position3D: Position3D;
  /** Raw 3D position in AU (unscaled) */
  positionAU: Position3D;
  /** Distance from Sun in AU */
  distanceFromSun: number;
  /** Distance from Earth in AU (for outer planets) */
  distanceFromEarth?: number;
  /** Visual apparent magnitude (if calculable) */
  magnitude?: number;
  /** Phase angle in radians */
  phaseAngle?: number;
  /** Illuminated fraction (0-1) */
  illumination?: number;
}

// =============================================================================
// MOON TYPES
// =============================================================================

/**
 * Moon position with phase information (simplified for moon-engine)
 */
export interface MoonPosition extends Position3D {
  /** Distance from Earth in km */
  distance: number;
  /** Right Ascension in radians */
  ra: number;
  /** Declination in radians */
  dec: number;
  /** Ecliptic longitude in radians */
  lon: number;
  /** Ecliptic latitude in radians */
  lat: number;
  /** Phase angle in radians (0 = new moon, PI = full moon) */
  phase: number;
  /** Illuminated fraction (0 to 1) */
  illumination: number;
}

/**
 * Moon phase event
 */
export interface MoonPhaseEvent {
  /** Julian Ephemeris Day of the event */
  jde: number;
  /** JavaScript Date object */
  date: Date;
  /** Phase type */
  type: 'new' | 'first' | 'full' | 'last';
  /** Human-readable phase name */
  name: string;
}

/**
 * Current moon phase information
 */
export interface MoonPhaseInfo {
  /** Phase name (New Moon, Waxing Crescent, etc.) */
  phase: string;
  /** Illuminated fraction (0 to 1) */
  illumination: number;
  /** Phase angle in radians */
  phaseAngle: number;
  /** Days since last new moon */
  age: number;
}

/**
 * Moon phase names (legacy type for compatibility)
 */
export type MoonPhaseName =
  | 'new'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

/**
 * Legacy moon position with all details (for compatibility)
 */
export interface MoonPositionFull {
  /** Julian Ephemeris Day of calculation */
  jde: number;
  /** Geocentric ecliptic coordinates */
  geocentric: EclipticCoord & { range: number };
  /** Geocentric equatorial coordinates */
  equatorial: EquatorialCoord;
  /** Horizontal coordinates (if observer set) */
  horizontal?: HorizontalCoord;
  /** 3D position for visualization */
  position3D: Position3D;
  /** Distance from Earth in km */
  distance: number;
  /** Equatorial horizontal parallax in radians */
  parallax: number;
  /** Phase angle in radians */
  phaseAngle: number;
  /** Illuminated fraction (0-1) */
  illumination: number;
  /** Current phase name */
  phaseName: MoonPhaseName;
  /** Days until next new moon */
  daysToNewMoon: number;
  /** Days until next full moon */
  daysToFullMoon: number;
}

// =============================================================================
// TIME TYPES
// =============================================================================

/**
 * Julian date calculation result
 */
export interface JulianDate {
  /** Julian Day number */
  jd: number;
  /** Julian Ephemeris Day (includes deltaT correction) */
  jde: number;
  /** Julian centuries since J2000.0 */
  T: number;
}

// =============================================================================
// VSOP87 DATA TYPES
// =============================================================================

/**
 * VSOP87 series coefficients [A, B, C]
 * Result = A * cos(B + C*t)
 */
export type VSOP87Term = [number, number, number];

/**
 * VSOP87 series for a single variable (L, B, or R)
 */
export interface VSOP87Series {
  [power: string]: VSOP87Term[];
}

/**
 * Complete VSOP87 planet data
 */
export interface VSOP87Data {
  name: string;
  type: 'B' | 'D';
  L: VSOP87Series;
  B: VSOP87Series;
  R: VSOP87Series;
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

/**
 * Options for 3D position calculations
 */
export interface Position3DOptions {
  /** Scale factor for the visualization (default: 25) */
  scale?: number;
  /** Use logarithmic scaling for distances (default: true) */
  logarithmic?: boolean;
  /** Custom scaling function */
  scalingFn?: (distance: number, scale?: number) => number;
}

/**
 * Observer location on Earth
 */
export interface ObserverLocation {
  /** Latitude in degrees (-90 to 90) */
  latitude: number;
  /** Longitude in degrees (-180 to 180, positive east) */
  longitude: number;
  /** Altitude above sea level in meters */
  altitude?: number;
  /** Timezone offset from UTC in hours */
  timezone?: number;
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

/**
 * Birth chart calculation input
 */
export interface BirthChartInput {
  /** Birth date and time (UTC or local) */
  date: Date;
  /** Observer/birth location */
  location: ObserverLocation;
  /** House system to use */
  houseSystem?: 'placidus' | 'whole_sign' | 'equal';
}

/**
 * Celestial body type
 */
export type CelestialBody =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

/**
 * Planet names array (excluding Earth for heliocentric, including for complete list)
 */
export const PLANET_NAMES: CelestialBody[] = [
  'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'
];

/**
 * Configuration for the cosmic engine
 */
export interface CosmicEngineConfig {
  /** Use high-precision VSOP87 (slower but more accurate) */
  highPrecision?: boolean;
  /** Include nutation corrections */
  includeNutation?: boolean;
  /** Include aberration corrections */
  includeAberration?: boolean;
  /** Include light-time corrections */
  includeLightTime?: boolean;
  /** Default observer location */
  defaultObserver?: ObserverLocation;
  /** Scale factor for 3D visualization */
  visualScale?: number;
  /** Use logarithmic scaling for orbits */
  logarithmicScale?: boolean;
}

/**
 * Sidereal time result
 */
export interface SiderealTime {
  /** Greenwich Mean Sidereal Time in hours (0-24) */
  gmst: number;
  /** Greenwich Apparent Sidereal Time in hours (0-24) */
  gast: number;
  /** Local Mean Sidereal Time in hours (0-24) */
  lmst?: number;
  /** Local Apparent Sidereal Time in hours (0-24) */
  last?: number;
}

/**
 * Nutation values
 */
export interface Nutation {
  /** Nutation in longitude (Δψ) in radians */
  deltaLon: number;
  /** Nutation in obliquity (Δε) in radians */
  deltaObl: number;
  /** Mean obliquity of ecliptic in radians */
  meanObliquity: number;
  /** True obliquity of ecliptic in radians */
  trueObliquity: number;
}

/**
 * Star data for planetarium view
 */
export interface StarData {
  /** Star name */
  name: string;
  /** Right Ascension in hours */
  ra: number;
  /** Declination in degrees */
  dec: number;
  /** Apparent magnitude */
  magnitude: number;
  /** Constellation abbreviation */
  constellation: string;
  /** Horizontal coordinates (computed for observer) */
  horizontal?: HorizontalCoord;
  /** 3D position on sky dome */
  position3D?: Position3D;
}

/**
 * Result from coordinate transformation
 */
export interface CoordinateTransformResult {
  /** Input coordinates */
  input: EclipticCoord | EquatorialCoord | HorizontalCoord;
  /** Output coordinates */
  output: EclipticCoord | EquatorialCoord | HorizontalCoord;
  /** Transformation applied */
  transform: string;
  /** Julian date of transformation */
  jde: number;
  /** Obliquity used (if applicable) */
  obliquity?: number;
}

/**
 * Constants used in calculations
 */
export const COSMIC_CONSTANTS = {
  /** J2000.0 epoch Julian Date */
  J2000: 2451545.0,
  /** Julian century in days */
  JULIAN_CENTURY: 36525,
  /** Julian year in days */
  JULIAN_YEAR: 365.25,
  /** Astronomical Unit in km */
  AU_KM: 149597870.7,
  /** Earth radius in km */
  EARTH_RADIUS_KM: 6378.137,
  /** Mean obliquity at J2000.0 in degrees */
  OBLIQUITY_J2000: 23.4392911,
  /** Speed of light in AU/day */
  LIGHT_SPEED_AU_DAY: 173.1446,
  /** Gaussian gravitational constant */
  K_GAUSS: 0.01720209895,
} as const;

/**
 * Default visual scale for orbit rendering
 */
export const DEFAULT_VISUAL_SCALE = 25;

/**
 * Default engine configuration
 */
export const DEFAULT_ENGINE_CONFIG: CosmicEngineConfig = {
  highPrecision: true,
  includeNutation: true,
  includeAberration: false,
  includeLightTime: false,
  visualScale: DEFAULT_VISUAL_SCALE,
  logarithmicScale: true,
};
