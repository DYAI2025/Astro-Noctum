/**
 * Unit tests for Cosmic Engine types and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  AngleUtils,
  PLANET_NAMES,
  PLANET_ORBITAL_RADII,
  type PlanetId,
  type EclipticCoordinates,
  type EquatorialCoordinates,
  type HorizontalCoordinates,
  type ObserverLocation,
  type MoonPhaseName,
} from '@/lib/cosmicEngine/types';

describe('AngleUtils', () => {
  describe('degToRad', () => {
    it('should convert 0° to 0 rad', () => {
      expect(AngleUtils.degToRad(0)).toBe(0);
    });

    it('should convert 90° to π/2 rad', () => {
      expect(AngleUtils.degToRad(90)).toBeCloseTo(Math.PI / 2);
    });

    it('should convert 180° to π rad', () => {
      expect(AngleUtils.degToRad(180)).toBeCloseTo(Math.PI);
    });

    it('should convert 360° to 2π rad', () => {
      expect(AngleUtils.degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    it('should handle negative angles', () => {
      expect(AngleUtils.degToRad(-90)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('radToDeg', () => {
    it('should convert 0 rad to 0°', () => {
      expect(AngleUtils.radToDeg(0)).toBe(0);
    });

    it('should convert π/2 rad to 90°', () => {
      expect(AngleUtils.radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    it('should convert π rad to 180°', () => {
      expect(AngleUtils.radToDeg(Math.PI)).toBeCloseTo(180);
    });

    it('should convert 2π rad to 360°', () => {
      expect(AngleUtils.radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });
  });

  describe('normalizeRad', () => {
    it('should keep angles in range unchanged', () => {
      expect(AngleUtils.normalizeRad(Math.PI)).toBeCloseTo(Math.PI);
    });

    it('should normalize 2π to 0', () => {
      expect(AngleUtils.normalizeRad(2 * Math.PI)).toBeCloseTo(0, 10);
    });

    it('should normalize 3π to π', () => {
      expect(AngleUtils.normalizeRad(3 * Math.PI)).toBeCloseTo(Math.PI);
    });

    it('should normalize negative angles', () => {
      expect(AngleUtils.normalizeRad(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2);
    });

    it('should handle large angles', () => {
      expect(AngleUtils.normalizeRad(10 * Math.PI)).toBeCloseTo(0, 10);
    });
  });

  describe('normalizeDeg', () => {
    it('should keep angles in range unchanged', () => {
      expect(AngleUtils.normalizeDeg(180)).toBe(180);
    });

    it('should normalize 360° to 0°', () => {
      expect(AngleUtils.normalizeDeg(360)).toBe(0);
    });

    it('should normalize 450° to 90°', () => {
      expect(AngleUtils.normalizeDeg(450)).toBe(90);
    });

    it('should normalize negative angles', () => {
      expect(AngleUtils.normalizeDeg(-90)).toBe(270);
    });
  });
});

describe('PLANET_NAMES', () => {
  it('should have names for all planets', () => {
    const planets: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    for (const planet of planets) {
      expect(PLANET_NAMES[planet]).toBeDefined();
      expect(typeof PLANET_NAMES[planet]).toBe('string');
    }
  });

  it('should have correct names', () => {
    expect(PLANET_NAMES.mercury).toBe('Mercury');
    expect(PLANET_NAMES.earth).toBe('Earth');
    expect(PLANET_NAMES.saturn).toBe('Saturn');
  });
});

describe('PLANET_ORBITAL_RADII', () => {
  it('should have radii for all planets', () => {
    const planets: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    for (const planet of planets) {
      expect(PLANET_ORBITAL_RADII[planet]).toBeDefined();
      expect(typeof PLANET_ORBITAL_RADII[planet]).toBe('number');
    }
  });

  it('should have Earth at ~1 AU', () => {
    expect(PLANET_ORBITAL_RADII.earth).toBeCloseTo(1, 1);
  });

  it('should have planets in increasing order from Sun', () => {
    const planets: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    for (let i = 1; i < planets.length; i++) {
      expect(PLANET_ORBITAL_RADII[planets[i]]).toBeGreaterThan(PLANET_ORBITAL_RADII[planets[i - 1]]);
    }
  });

  it('should have approximately correct values', () => {
    expect(PLANET_ORBITAL_RADII.mercury).toBeCloseTo(0.39, 1);
    expect(PLANET_ORBITAL_RADII.venus).toBeCloseTo(0.72, 1);
    expect(PLANET_ORBITAL_RADII.mars).toBeCloseTo(1.52, 1);
    expect(PLANET_ORBITAL_RADII.jupiter).toBeCloseTo(5.2, 0);
    expect(PLANET_ORBITAL_RADII.saturn).toBeCloseTo(9.5, 0);
  });
});

describe('Type inference', () => {
  // These tests verify that types are correctly exported and usable
  it('should accept valid EclipticCoordinates', () => {
    const coords: EclipticCoordinates = {
      lon: Math.PI,
      lat: 0.1,
      range: 1.5,
    };
    expect(coords.lon).toBe(Math.PI);
    expect(coords.lat).toBe(0.1);
    expect(coords.range).toBe(1.5);
  });

  it('should accept valid EquatorialCoordinates', () => {
    const coords: EquatorialCoordinates = {
      ra: 1.5,
      dec: 0.5,
    };
    expect(coords.ra).toBe(1.5);
    expect(coords.dec).toBe(0.5);
  });

  it('should accept EquatorialCoordinates with range', () => {
    const coords: EquatorialCoordinates = {
      ra: 1.5,
      dec: 0.5,
      range: 2.0,
    };
    expect(coords.range).toBe(2.0);
  });

  it('should accept valid HorizontalCoordinates', () => {
    const coords: HorizontalCoordinates = {
      altitude: 0.8,
      azimuth: 1.2,
    };
    expect(coords.altitude).toBe(0.8);
    expect(coords.azimuth).toBe(1.2);
  });

  it('should accept valid ObserverLocation', () => {
    const observer: ObserverLocation = {
      latitude: 52.52,
      longitude: 13.405,
    };
    expect(observer.latitude).toBe(52.52);
    expect(observer.longitude).toBe(13.405);
  });

  it('should accept ObserverLocation with elevation', () => {
    const observer: ObserverLocation = {
      latitude: 52.52,
      longitude: 13.405,
      elevation: 34,
    };
    expect(observer.elevation).toBe(34);
  });

  it('should accept valid MoonPhaseName', () => {
    const phases: MoonPhaseName[] = [
      'new',
      'waxing-crescent',
      'first-quarter',
      'waxing-gibbous',
      'full',
      'waning-gibbous',
      'last-quarter',
      'waning-crescent',
    ];

    expect(phases).toHaveLength(8);
    phases.forEach(phase => {
      expect(typeof phase).toBe('string');
    });
  });

  it('should accept valid PlanetId', () => {
    const planets: PlanetId[] = [
      'mercury', 'venus', 'earth', 'mars',
      'jupiter', 'saturn', 'uranus', 'neptune'
    ];

    expect(planets).toHaveLength(8);
  });
});
