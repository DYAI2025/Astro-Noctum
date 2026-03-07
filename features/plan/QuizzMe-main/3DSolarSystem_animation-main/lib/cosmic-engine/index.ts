/**
 * Cosmic Engine - TypeScript Adapter for Astronomia Library
 *
 * This module provides a clean TypeScript interface to the astronomia JavaScript
 * library for high-precision astronomical calculations. It includes:
 *
 * - VSOP87 planet position calculations
 * - Lunar position and phase calculations
 * - Coordinate system transformations
 * - Julian date utilities
 *
 * @module cosmic-engine
 * @example
 * ```typescript
 * import {
 *   getPlanetPositionVSOP87,
 *   getMoonPosition,
 *   dateToJulian,
 * } from '@/lib/cosmic-engine';
 *
 * // Get current positions
 * const { jde } = dateToJulian(new Date());
 * const marsPosition = getPlanetPositionVSOP87('mars', jde);
 * const moonPosition = getMoonPosition(jde);
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Coordinate types
  Coord,
  EquatorialCoord,
  HorizontalCoord,
  EclipticCoord,
  Position3D,

  // Planet types
  PlanetName,
  PlanetPosition,
  GeocentricPosition,

  // Moon types
  MoonPosition,
  MoonPhaseEvent,
  MoonPhaseInfo,

  // Time types
  JulianDate,

  // VSOP87 types
  VSOP87Term,
  VSOP87Series,
  VSOP87Data,

  // Options types
  Position3DOptions,
  ObserverLocation,
  CosmicEngineConfig,
} from './types';

// =============================================================================
// ASTRONOMIA ADAPTER EXPORTS
// =============================================================================

export {
  // Julian date utilities
  dateToJulian,
  julianToDate,
  jdeToDate,
  getCurrentJDE,
  yearToJDE,
  jdeToYear,

  // Planet instance management
  getPlanetInstance,

  // Position calculations
  getHeliocentricPosition,
  getHeliocentricPositionOfDate,
  eclipticToCartesian,

  // Coordinate transformations
  eclipticToEquatorial,
  equatorialToEcliptic,
  equatorialToHorizontal,

  // Moon basic functions
  getMoonPosition as getMoonEclipticPosition,
  getMoonTrueNode,
  getMoonPhaseAngle,
  getMoonIllumination,
  getNextNewMoon,
  getNextFullMoon,
  getNextFirstQuarter,
  getNextLastQuarter,

  // Utility functions
  normalizeAngle,
  toDegrees,
  toRadians,
  raToHours,
  hoursToRa,
  getGMST,
  getLST,

  // Constants
  J2000,
  JULIAN_CENTURY,
  OBLIQUITY_J2000,
  DEG_TO_RAD,
  RAD_TO_DEG,
  HOURS_TO_RAD,
  AU_KM,
  LUNAR_MONTH,
} from './astronomia-adapter';

// =============================================================================
// VSOP87 PROVIDER EXPORTS
// =============================================================================

export {
  // Position functions
  getPlanetPositionVSOP87,
  getAllPlanetPositions,
  getPlanetPositionsForDate,
  getGeocentricPosition,
  getAllGeocentricPositions,

  // Orbit functions
  getOrbitPath,
  getOrbitalElements,

  // Utility functions
  getClosestPlanet,
  isPlanetVisible,

  // Scaling functions
  logarithmicScale,
  linearScale,
  sqrtScale,

  // Planet lists
  ALL_PLANETS,
  INNER_PLANETS,
  OUTER_PLANETS,
} from './vsop87-provider';

// =============================================================================
// MOON ENGINE EXPORTS
// =============================================================================

export {
  // Position functions
  getMoonPosition,
  getMoonPositionForDate,

  // Phase functions
  getMoonPhase,
  getMoonPhaseForDate,

  // Phase events
  getNextMoonPhases,
  getNextMoonPhasesFromDate,
  getNextPhaseOfType,

  // Utility functions
  getMoonAge,
  getMoonDistanceFraction,
  isNearPerigee,
  isNearApogee,
  isSupermoon,

  // Constants
  MOON_MEAN_DISTANCE,
  MOON_DISTANCE_AU,
  PHASE_NAMES,
} from './moon-engine';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

import astronomiaAdapter from './astronomia-adapter';
import vsop87Provider from './vsop87-provider';
import moonEngine from './moon-engine';

/**
 * Cosmic Engine unified API
 *
 * Combines all sub-modules into a single convenient interface.
 */
const cosmicEngine = {
  // Sub-modules
  astronomia: astronomiaAdapter,
  vsop87: vsop87Provider,
  moon: moonEngine,

  // Convenience re-exports from astronomia adapter
  dateToJulian: astronomiaAdapter.dateToJulian,
  getCurrentJDE: astronomiaAdapter.getCurrentJDE,

  // Convenience re-exports from vsop87 provider
  getPlanetPosition: vsop87Provider.getPlanetPositionVSOP87,
  getAllPlanetPositions: vsop87Provider.getAllPlanetPositions,

  // Convenience re-exports from moon engine
  getMoonPosition: moonEngine.getMoonPosition,
  getMoonPhase: moonEngine.getMoonPhase,
  getNextMoonPhases: moonEngine.getNextMoonPhases,
};

export default cosmicEngine;
