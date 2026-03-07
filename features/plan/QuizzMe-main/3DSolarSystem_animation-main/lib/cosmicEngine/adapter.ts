/**
 * Cosmic Engine Adapter
 * Public interface implementing CosmicEngineAdapter
 * Provides the main entry point for high-precision astronomical calculations
 */

import type {
  CosmicEngineAdapter,
  CosmicEngineConfig,
  EclipticCoordinates,
  EquatorialCoordinates,
  HorizontalCoordinates,
  JulianDay,
  MoonPosition,
  ObserverLocation,
  PlanetId,
  PlanetPosition,
  SolarSystemState,
  SunPosition,
} from './types';
import { CosmicEngineService, createCosmicEngineService } from './service';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT ADAPTER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DefaultCosmicEngineAdapter implements the full CosmicEngineAdapter interface
 * Wraps CosmicEngineService with a clean public API
 */
export class DefaultCosmicEngineAdapter implements CosmicEngineAdapter {
  private service: CosmicEngineService;
  private initPromise: Promise<void> | null = null;

  constructor(config?: CosmicEngineConfig) {
    this.service = createCosmicEngineService(config);
  }

  /**
   * Ensure service is initialized before any operation
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.service.initialize();
    }
    await this.initPromise;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANET METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async getPlanetPosition(
    planet: PlanetId,
    date: Date,
    observer?: ObserverLocation
  ): Promise<PlanetPosition> {
    await this.ensureInitialized();
    return this.service.getPlanetPosition(planet, date, observer);
  }

  async getAllPlanetPositions(
    date: Date,
    observer?: ObserverLocation
  ): Promise<Map<PlanetId, PlanetPosition>> {
    await this.ensureInitialized();
    return this.service.getAllPlanetPositions(date, observer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUN METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async getSunPosition(
    date: Date,
    observer?: ObserverLocation
  ): Promise<SunPosition> {
    await this.ensureInitialized();
    return this.service.getSunPosition(date, observer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOON METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async getMoonPosition(
    date: Date,
    observer?: ObserverLocation
  ): Promise<MoonPosition> {
    await this.ensureInitialized();
    return this.service.getMoonPosition(date, observer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOLAR SYSTEM STATE
  // ═══════════════════════════════════════════════════════════════════════════

  async getSolarSystemState(
    date: Date,
    observer?: ObserverLocation
  ): Promise<SolarSystemState> {
    await this.ensureInitialized();
    return this.service.getSolarSystemState(date, observer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JULIAN DATE CONVERSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async dateToJD(date: Date): Promise<JulianDay> {
    await this.ensureInitialized();
    return this.service.dateToJD(date);
  }

  async jdToDate(jd: JulianDay): Promise<Date> {
    await this.ensureInitialized();
    return this.service.jdToDate(jd);
  }

  // Synchronous versions for when JD is needed immediately
  // These use a simplified calculation without astronomia
  dateToJDSync(date: Date): JulianDay {
    // Simplified Julian Day calculation
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate() +
      date.getUTCHours() / 24 +
      date.getUTCMinutes() / 1440 +
      date.getUTCSeconds() / 86400 +
      date.getUTCMilliseconds() / 86400000;

    let year = y;
    let month = m;

    if (m <= 2) {
      year -= 1;
      month += 12;
    }

    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);

    return Math.floor(365.25 * (year + 4716)) +
      Math.floor(30.6001 * (month + 1)) +
      d + b - 1524.5;
  }

  jdToDateSync(jd: JulianDay): Date {
    const z = Math.floor(jd + 0.5);
    const f = jd + 0.5 - z;

    let a: number;
    if (z < 2299161) {
      a = z;
    } else {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }

    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);

    const day = b - d - Math.floor(30.6001 * e) + f;
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;

    const dayInt = Math.floor(day);
    const dayFrac = day - dayInt;

    const hours = dayFrac * 24;
    const hoursInt = Math.floor(hours);
    const minutes = (hours - hoursInt) * 60;
    const minutesInt = Math.floor(minutes);
    const seconds = (minutes - minutesInt) * 60;
    const secondsInt = Math.floor(seconds);
    const ms = Math.round((seconds - secondsInt) * 1000);

    return new Date(Date.UTC(year, month - 1, dayInt, hoursInt, minutesInt, secondsInt, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COORDINATE TRANSFORMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async eclipticToEquatorial(
    ecliptic: EclipticCoordinates,
    jd: JulianDay
  ): Promise<EquatorialCoordinates> {
    await this.ensureInitialized();
    return this.service.eclipticToEquatorial(ecliptic, jd);
  }

  async equatorialToHorizontal(
    equatorial: EquatorialCoordinates,
    jd: JulianDay,
    observer: ObserverLocation
  ): Promise<HorizontalCoordinates> {
    await this.ensureInitialized();
    return this.service.equatorialToHorizontal(equatorial, jd, observer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CACHE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  clearCache(): void {
    this.service.clearCache();
  }

  getCacheStats(): { hits: number; misses: number; size: number } {
    return this.service.getCacheStats();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new CosmicEngineAdapter instance
 * This is the main entry point for using the Cosmic Engine
 *
 * @example
 * ```typescript
 * const engine = createCosmicEngine({
 *   cache: { maxEntries: 2000, ttlMs: 30000 },
 *   includeOuterPlanets: true,
 *   calculateGeocentric: true,
 * });
 *
 * const positions = await engine.getAllPlanetPositions(new Date());
 * console.log(positions.get('mars')?.heliocentric);
 * ```
 */
export function createCosmicEngine(
  config?: CosmicEngineConfig
): CosmicEngineAdapter {
  return new DefaultCosmicEngineAdapter(config);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

/** Default engine instance with standard configuration */
let defaultEngine: CosmicEngineAdapter | null = null;

/**
 * Get the default Cosmic Engine instance
 * Creates one if it doesn't exist
 */
export function getDefaultCosmicEngine(): CosmicEngineAdapter {
  if (!defaultEngine) {
    defaultEngine = createCosmicEngine();
  }
  return defaultEngine;
}

/**
 * Reset the default engine (useful for testing)
 */
export function resetDefaultCosmicEngine(): void {
  if (defaultEngine) {
    defaultEngine.clearCache();
  }
  defaultEngine = null;
}
