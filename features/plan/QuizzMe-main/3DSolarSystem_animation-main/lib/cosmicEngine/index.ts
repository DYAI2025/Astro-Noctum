/**
 * Cosmic Engine - High-Precision Astronomical Calculations
 *
 * A hybrid calculation layer combining:
 * - astronomia (VSOP87/ELP2000) for sub-arcsecond planetary positions
 * - LRU caching for animation performance
 * - Three.js-ready coordinate output
 *
 * @example
 * ```typescript
 * import { createCosmicEngine } from '@/lib/cosmicEngine';
 *
 * const engine = createCosmicEngine();
 *
 * // Get all planet positions
 * const state = await engine.getSolarSystemState(new Date());
 * console.log(state.planets.get('mars')?.heliocentric);
 *
 * // Get moon phase
 * const moon = await engine.getMoonPosition(new Date());
 * console.log(moon.phase.phaseName); // 'waxing-crescent'
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Factory and singleton
export {
  createCosmicEngine,
  getDefaultCosmicEngine,
  resetDefaultCosmicEngine,
  DefaultCosmicEngineAdapter,
} from './adapter';

// Service (for advanced use cases)
export {
  CosmicEngineService,
  createCosmicEngineService,
} from './service';

// Wrapper (for direct astronomia access)
export {
  AstronomiaWrapper,
  astronomiaWrapper,
} from './wrapper';

// Cache utilities
export {
  LRUCache,
  DEFAULT_CACHE_CONFIG,
  createPlanetCacheKey,
  createMoonCacheKey,
  createSunCacheKey,
  createCoordCacheKey,
} from './cache';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Julian dates
  JulianDay,
  JulianEphemerisDay,

  // Coordinates
  EclipticCoordinates,
  EquatorialCoordinates,
  HorizontalCoordinates,
  CartesianPosition,

  // Planets
  PlanetId,
  PlanetPosition,
  SunPosition,

  // Moon
  MoonPhaseName,
  MoonPhaseData,
  MoonPosition,

  // Observer
  ObserverLocation,

  // Configuration
  CacheConfig,
  CosmicEngineConfig,

  // State
  SolarSystemState,

  // Interface
  CosmicEngineAdapter,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AngleUtils,
  PLANET_NAMES,
  PLANET_ORBITAL_RADII,
} from './types';
