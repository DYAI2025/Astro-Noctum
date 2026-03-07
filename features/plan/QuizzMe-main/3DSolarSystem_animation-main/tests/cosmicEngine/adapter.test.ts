/**
 * Integration tests for Cosmic Engine Adapter
 * Tests the adapter interface with mock data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCosmicEngine,
  getDefaultCosmicEngine,
  resetDefaultCosmicEngine,
  DefaultCosmicEngineAdapter,
} from '@/lib/cosmicEngine/adapter';
import type { CosmicEngineAdapter, PlanetId } from '@/lib/cosmicEngine/types';

describe('DefaultCosmicEngineAdapter', () => {
  let adapter: CosmicEngineAdapter;

  beforeEach(() => {
    resetDefaultCosmicEngine();
    adapter = createCosmicEngine({
      cache: { enabled: false }, // Disable cache for predictable tests
    });
  });

  describe('Julian Day conversions', () => {
    describe('dateToJDSync', () => {
      it('should convert J2000.0 epoch correctly', () => {
        const j2000Date = new Date('2000-01-01T12:00:00.000Z');
        const jd = (adapter as DefaultCosmicEngineAdapter).dateToJDSync(j2000Date);
        expect(jd).toBeCloseTo(2451545.0, 4);
      });

      it('should handle current date', () => {
        const now = new Date();
        const jd = (adapter as DefaultCosmicEngineAdapter).dateToJDSync(now);
        expect(jd).toBeGreaterThan(2451545); // After J2000
        expect(jd).toBeLessThan(2500000); // Reasonable future bound
      });

      it('should handle historical dates', () => {
        // 1900-01-01
        const historical = new Date('1900-01-01T12:00:00.000Z');
        const jd = (adapter as DefaultCosmicEngineAdapter).dateToJDSync(historical);
        expect(jd).toBeCloseTo(2415021.0, 0);
      });
    });

    describe('jdToDateSync', () => {
      it('should convert J2000.0 correctly', () => {
        const date = (adapter as DefaultCosmicEngineAdapter).jdToDateSync(2451545.0);
        expect(date.getUTCFullYear()).toBe(2000);
        expect(date.getUTCMonth()).toBe(0); // January
        expect(date.getUTCDate()).toBe(1);
        expect(date.getUTCHours()).toBe(12);
      });

      it('should be inverse of dateToJDSync', () => {
        const original = new Date('2023-06-15T08:30:00.000Z');
        const jd = (adapter as DefaultCosmicEngineAdapter).dateToJDSync(original);
        const recovered = (adapter as DefaultCosmicEngineAdapter).jdToDateSync(jd);

        expect(recovered.getTime()).toBeCloseTo(original.getTime(), -3); // Within 1 second
      });
    });
  });

  describe('cache management', () => {
    it('should return cache stats', () => {
      const stats = adapter.getCacheStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
    });

    it('should clear cache without error', () => {
      expect(() => adapter.clearCache()).not.toThrow();
    });
  });
});

describe('createCosmicEngine factory', () => {
  it('should create new adapter instance', () => {
    const adapter = createCosmicEngine();
    expect(adapter).toBeInstanceOf(DefaultCosmicEngineAdapter);
  });

  it('should accept configuration options', () => {
    const adapter = createCosmicEngine({
      cache: {
        enabled: true,
        maxEntries: 500,
        ttlMs: 30000,
      },
      includeOuterPlanets: false,
      calculateGeocentric: true,
    });

    expect(adapter).toBeInstanceOf(DefaultCosmicEngineAdapter);
  });
});

describe('getDefaultCosmicEngine singleton', () => {
  beforeEach(() => {
    resetDefaultCosmicEngine();
  });

  it('should return same instance on multiple calls', () => {
    const first = getDefaultCosmicEngine();
    const second = getDefaultCosmicEngine();
    expect(first).toBe(second);
  });

  it('should return new instance after reset', () => {
    const first = getDefaultCosmicEngine();
    resetDefaultCosmicEngine();
    const second = getDefaultCosmicEngine();
    expect(first).not.toBe(second);
  });
});

describe('CosmicEngineAdapter interface compliance', () => {
  let adapter: CosmicEngineAdapter;

  beforeEach(() => {
    adapter = createCosmicEngine();
  });

  it('should have all required methods', () => {
    // Planet methods
    expect(typeof adapter.getPlanetPosition).toBe('function');
    expect(typeof adapter.getAllPlanetPositions).toBe('function');

    // Sun methods
    expect(typeof adapter.getSunPosition).toBe('function');

    // Moon methods
    expect(typeof adapter.getMoonPosition).toBe('function');

    // Solar system
    expect(typeof adapter.getSolarSystemState).toBe('function');

    // Julian dates
    expect(typeof adapter.dateToJD).toBe('function');
    expect(typeof adapter.jdToDate).toBe('function');

    // Coordinate transforms
    expect(typeof adapter.eclipticToEquatorial).toBe('function');
    expect(typeof adapter.equatorialToHorizontal).toBe('function');

    // Cache
    expect(typeof adapter.clearCache).toBe('function');
    expect(typeof adapter.getCacheStats).toBe('function');
  });

  it('should return promises from async methods', () => {
    const date = new Date();

    expect(adapter.dateToJD(date)).toBeInstanceOf(Promise);
    expect(adapter.getPlanetPosition('mars', date)).toBeInstanceOf(Promise);
    expect(adapter.getAllPlanetPositions(date)).toBeInstanceOf(Promise);
    expect(adapter.getSunPosition(date)).toBeInstanceOf(Promise);
    expect(adapter.getMoonPosition(date)).toBeInstanceOf(Promise);
    expect(adapter.getSolarSystemState(date)).toBeInstanceOf(Promise);
  });
});

describe('PlanetId type coverage', () => {
  const ALL_PLANET_IDS: PlanetId[] = [
    'mercury', 'venus', 'earth', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune'
  ];

  it('should accept all valid planet IDs', () => {
    const adapter = createCosmicEngine();
    const date = new Date();

    for (const planetId of ALL_PLANET_IDS) {
      // This should not throw a type error
      const promise = adapter.getPlanetPosition(planetId, date);
      expect(promise).toBeInstanceOf(Promise);
    }
  });
});
