/**
 * Cosmic Engine Service
 * Layer 2: Cached service providing high-level astronomical calculations
 * Combines wrapper with caching for animation performance
 */

import type {
  CartesianPosition,
  CosmicEngineConfig,
  EclipticCoordinates,
  EquatorialCoordinates,
  HorizontalCoordinates,
  JulianDay,
  MoonPhaseData,
  MoonPosition,
  ObserverLocation,
  PlanetId,
  PlanetPosition,
  SolarSystemState,
  SunPosition,
} from './types';
import { AngleUtils, PLANET_NAMES } from './types';
import { AstronomiaWrapper } from './wrapper';
import {
  LRUCache,
  DEFAULT_CACHE_CONFIG,
  createPlanetCacheKey,
  createMoonCacheKey,
  createSunCacheKey,
} from './cache';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/** All planets for batch calculations */
const ALL_PLANETS: PlanetId[] = [
  'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'
];

/** Inner planets only (faster calculations) */
const INNER_PLANETS: PlanetId[] = ['mercury', 'venus', 'earth', 'mars'];

/** AU to km conversion factor */
const AU_TO_KM = 149597870.7;

/** Earth's mean radius in km */
const EARTH_RADIUS_KM = 6371;

/** Moon's mean distance in Earth radii (for scaling) */
const MOON_DISTANCE_EARTH_RADII = 60.3;

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/** Internal config type with required cache but optional observer */
interface ResolvedConfig {
  cache: Required<import('./types').CacheConfig>;
  observer?: ObserverLocation;
  includeOuterPlanets: boolean;
  calculateGeocentric: boolean;
}

/**
 * CosmicEngineService provides cached astronomical calculations
 * Optimized for animation with LRU caching
 */
export class CosmicEngineService {
  private wrapper: AstronomiaWrapper;
  private planetCache: LRUCache<string, PlanetPosition>;
  private moonCache: LRUCache<string, MoonPosition>;
  private sunCache: LRUCache<string, SunPosition>;
  private config: ResolvedConfig;
  private initialized = false;

  constructor(config: CosmicEngineConfig = {}) {
    this.wrapper = new AstronomiaWrapper();

    // Merge config with defaults
    this.config = {
      cache: { ...DEFAULT_CACHE_CONFIG, ...config.cache },
      observer: config.observer,
      includeOuterPlanets: config.includeOuterPlanets ?? true,
      calculateGeocentric: config.calculateGeocentric ?? true,
    };

    // Initialize caches
    this.planetCache = new LRUCache(this.config.cache);
    this.moonCache = new LRUCache(this.config.cache);
    this.sunCache = new LRUCache(this.config.cache);
  }

  /**
   * Initialize the service
   * Preloads astronomia modules for better performance
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.wrapper.initialize();
    this.initialized = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JULIAN DATE CONVERSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Convert Date to Julian Day
   */
  async dateToJD(date: Date): Promise<JulianDay> {
    return this.wrapper.dateToJD(date);
  }

  /**
   * Convert Julian Day to Date
   */
  async jdToDate(jd: JulianDay): Promise<Date> {
    return this.wrapper.jdToDate(jd);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANET CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get position data for a single planet
   */
  async getPlanetPosition(
    planet: PlanetId,
    date: Date,
    observer?: ObserverLocation
  ): Promise<PlanetPosition> {
    const jde = await this.wrapper.dateToJDE(date);
    const cacheKey = createPlanetCacheKey(planet, jde);

    // Check cache
    const cached = this.planetCache.get(cacheKey);
    if (cached) {
      // If observer provided but not in cache, recalculate horizontal coords
      if (observer && !cached.horizontal) {
        return this.addHorizontalCoords(cached, jde, observer);
      }
      return cached;
    }

    // Calculate heliocentric position
    const heliocentric = await this.wrapper.getPlanetPosition(planet, jde);

    // Calculate geocentric if enabled
    let geocentric: EclipticCoordinates | undefined;
    let equatorial: EquatorialCoordinates | undefined;
    let horizontal: HorizontalCoordinates | undefined;

    if (this.config.calculateGeocentric && planet !== 'earth') {
      geocentric = await this.calculateGeocentric(planet, heliocentric, jde);
      equatorial = await this.wrapper.eclipticToEquatorial(geocentric, jde);

      if (observer) {
        horizontal = await this.wrapper.equatorialToHorizontal(equatorial, jde, observer);
      }
    }

    // Convert to 3D cartesian (heliocentric, AU)
    const cartesian = this.eclipticToCartesian(heliocentric);

    const result: PlanetPosition = {
      id: planet,
      name: PLANET_NAMES[planet],
      heliocentric,
      geocentric,
      equatorial,
      horizontal,
      cartesian,
      calculatedAt: date,
      jd: jde,
    };

    // Cache result
    this.planetCache.set(cacheKey, result);

    return result;
  }

  /**
   * Get positions for all planets
   */
  async getAllPlanetPositions(
    date: Date,
    observer?: ObserverLocation
  ): Promise<Map<PlanetId, PlanetPosition>> {
    const planets = this.config.includeOuterPlanets ? ALL_PLANETS : INNER_PLANETS;
    const results = new Map<PlanetId, PlanetPosition>();

    // Calculate all in parallel
    const positions = await Promise.all(
      planets.map(planet => this.getPlanetPosition(planet, date, observer))
    );

    for (const pos of positions) {
      results.set(pos.id, pos);
    }

    return results;
  }

  /**
   * Calculate geocentric coordinates from heliocentric
   * Requires Earth position to transform reference frame
   */
  private async calculateGeocentric(
    planet: PlanetId,
    heliocentric: EclipticCoordinates,
    jde: JulianDay
  ): Promise<EclipticCoordinates> {
    // Get Earth's heliocentric position
    const earthHelio = await this.wrapper.getPlanetPosition('earth', jde);

    // Convert both to Cartesian
    const planetCart = this.eclipticToCartesian(heliocentric);
    const earthCart = this.eclipticToCartesian(earthHelio);

    // Geocentric = Planet - Earth
    const geoCart: CartesianPosition = {
      x: planetCart.x - earthCart.x,
      y: planetCart.y - earthCart.y,
      z: planetCart.z - earthCart.z,
    };

    // Convert back to ecliptic
    return this.cartesianToEcliptic(geoCart);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUN CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get Sun position (geocentric)
   */
  async getSunPosition(
    date: Date,
    observer?: ObserverLocation
  ): Promise<SunPosition> {
    const jde = await this.wrapper.dateToJDE(date);
    const cacheKey = createSunCacheKey(jde);

    // Check cache
    const cached = this.sunCache.get(cacheKey);
    if (cached) {
      if (observer && !cached.horizontal) {
        return this.addSunHorizontalCoords(cached, jde, observer);
      }
      return cached;
    }

    // Get geocentric ecliptic position
    const geocentric = await this.wrapper.getSunPosition(jde);
    const equatorial = await this.wrapper.eclipticToEquatorial(geocentric, jde);

    let horizontal: HorizontalCoordinates | undefined;
    if (observer) {
      horizontal = await this.wrapper.equatorialToHorizontal(equatorial, jde, observer);
    }

    const result: SunPosition = {
      geocentric,
      equatorial,
      horizontal,
      calculatedAt: date,
      jd: jde,
    };

    this.sunCache.set(cacheKey, result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOON CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get Moon position and phase
   */
  async getMoonPosition(
    date: Date,
    observer?: ObserverLocation
  ): Promise<MoonPosition> {
    const jde = await this.wrapper.dateToJDE(date);
    const cacheKey = createMoonCacheKey(jde);

    // Check cache
    const cached = this.moonCache.get(cacheKey);
    if (cached) {
      if (observer && !cached.horizontal) {
        return this.addMoonHorizontalCoords(cached, jde, observer);
      }
      return cached;
    }

    // Get geocentric ecliptic position (km)
    const geocentric = await this.wrapper.getMoonPosition(jde);

    // Get phase data
    const phase = await this.wrapper.getMoonPhase(jde);

    // Get parallax
    const parallax = await this.wrapper.getMoonParallax(geocentric.range);

    // Convert to equatorial
    const equatorial = await this.wrapper.eclipticToEquatorial(geocentric, jde);

    let horizontal: HorizontalCoordinates | undefined;
    if (observer) {
      horizontal = await this.wrapper.equatorialToHorizontal(equatorial, jde, observer);
    }

    // Convert to 3D cartesian for rendering (scale to Earth radii for visualization)
    const distanceER = geocentric.range / EARTH_RADIUS_KM;
    const cartesian: CartesianPosition = {
      x: distanceER * Math.cos(geocentric.lat) * Math.cos(geocentric.lon),
      y: distanceER * Math.cos(geocentric.lat) * Math.sin(geocentric.lon),
      z: distanceER * Math.sin(geocentric.lat),
    };

    const result: MoonPosition = {
      geocentric,
      equatorial,
      horizontal,
      distance: geocentric.range,
      parallax,
      phase,
      cartesian,
      calculatedAt: date,
      jd: jde,
    };

    this.moonCache.set(cacheKey, result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOLAR SYSTEM STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get complete solar system state at a point in time
   * Calculates all positions in parallel for efficiency
   */
  async getSolarSystemState(
    date: Date,
    observer?: ObserverLocation
  ): Promise<SolarSystemState> {
    const jde = await this.wrapper.dateToJDE(date);

    // Calculate all in parallel
    const [sun, moon, planets] = await Promise.all([
      this.getSunPosition(date, observer),
      this.getMoonPosition(date, observer),
      this.getAllPlanetPositions(date, observer),
    ]);

    return {
      jd: jde,
      date,
      sun,
      moon,
      planets,
      observer,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COORDINATE TRANSFORMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Transform ecliptic to equatorial coordinates
   */
  async eclipticToEquatorial(
    ecliptic: EclipticCoordinates,
    jd: JulianDay
  ): Promise<EquatorialCoordinates> {
    return this.wrapper.eclipticToEquatorial(ecliptic, jd);
  }

  /**
   * Transform equatorial to horizontal coordinates
   */
  async equatorialToHorizontal(
    equatorial: EquatorialCoordinates,
    jd: JulianDay,
    observer: ObserverLocation
  ): Promise<HorizontalCoordinates> {
    return this.wrapper.equatorialToHorizontal(equatorial, jd, observer);
  }

  /**
   * Convert ecliptic coordinates to 3D Cartesian
   * Output in same units as input range (AU for planets, km for Moon)
   */
  eclipticToCartesian(ecliptic: EclipticCoordinates): CartesianPosition {
    const { lon, lat, range } = ecliptic;
    return {
      x: range * Math.cos(lat) * Math.cos(lon),
      y: range * Math.cos(lat) * Math.sin(lon),
      z: range * Math.sin(lat),
    };
  }

  /**
   * Convert 3D Cartesian to ecliptic coordinates
   */
  cartesianToEcliptic(cartesian: CartesianPosition): EclipticCoordinates {
    const { x, y, z } = cartesian;
    const range = Math.sqrt(x * x + y * y + z * z);
    const lon = AngleUtils.normalizeRad(Math.atan2(y, x));
    const lat = Math.asin(z / range);

    return { lon, lat, range };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add horizontal coordinates to existing planet position
   */
  private async addHorizontalCoords(
    position: PlanetPosition,
    jde: JulianDay,
    observer: ObserverLocation
  ): Promise<PlanetPosition> {
    if (!position.equatorial) {
      return position;
    }

    const horizontal = await this.wrapper.equatorialToHorizontal(
      position.equatorial,
      jde,
      observer
    );

    return { ...position, horizontal };
  }

  /**
   * Add horizontal coordinates to existing sun position
   */
  private async addSunHorizontalCoords(
    position: SunPosition,
    jde: JulianDay,
    observer: ObserverLocation
  ): Promise<SunPosition> {
    if (!position.equatorial) {
      return position;
    }

    const horizontal = await this.wrapper.equatorialToHorizontal(
      position.equatorial,
      jde,
      observer
    );

    return { ...position, horizontal };
  }

  /**
   * Add horizontal coordinates to existing moon position
   */
  private async addMoonHorizontalCoords(
    position: MoonPosition,
    jde: JulianDay,
    observer: ObserverLocation
  ): Promise<MoonPosition> {
    if (!position.equatorial) {
      return position;
    }

    const horizontal = await this.wrapper.equatorialToHorizontal(
      position.equatorial,
      jde,
      observer
    );

    return { ...position, horizontal };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CACHE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.planetCache.clear();
    this.moonCache.clear();
    this.sunCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    const planetStats = this.planetCache.getStats();
    const moonStats = this.moonCache.getStats();
    const sunStats = this.sunCache.getStats();

    return {
      hits: planetStats.hits + moonStats.hits + sunStats.hits,
      misses: planetStats.misses + moonStats.misses + sunStats.misses,
      size: planetStats.size + moonStats.size + sunStats.size,
    };
  }

  /**
   * Prune expired cache entries
   */
  pruneCache(): number {
    return (
      this.planetCache.prune() +
      this.moonCache.prune() +
      this.sunCache.prune()
    );
  }
}

/**
 * Create a new CosmicEngineService instance
 */
export function createCosmicEngineService(
  config?: CosmicEngineConfig
): CosmicEngineService {
  return new CosmicEngineService(config);
}
