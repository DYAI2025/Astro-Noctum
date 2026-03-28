import { describe, it, expect } from 'vitest';
import {
  computeCosmicResonance,
  applyResonance,
} from '../lib/space-weather/cosmic-resonance';

// Water-dominant chart: Moon and Jupiter high
const WATER_NATAL: Record<string, number> = {
  Sun: 0.3, Moon: 0.9, Mercury: 0.4, Venus: 0.3, Mars: 0.2, Jupiter: 0.5, Saturn: 0.3,
};

// Fire-dominant chart: Sun, Mars, Jupiter high
const FIRE_NATAL: Record<string, number> = {
  Sun: 0.9, Moon: 0.3, Mercury: 0.4, Venus: 0.3, Mars: 0.8, Jupiter: 0.7, Saturn: 0.3,
};

// Earth-dominant chart: Venus, Saturn high
const EARTH_NATAL: Record<string, number> = {
  Sun: 0.3, Moon: 0.3, Mercury: 0.4, Venus: 0.8, Mars: 0.3, Jupiter: 0.3, Saturn: 0.9,
};

// Balanced chart
const BALANCED_NATAL: Record<string, number> = {
  Sun: 0.5, Moon: 0.5, Mercury: 0.5, Venus: 0.5, Mars: 0.5, Jupiter: 0.5, Saturn: 0.5,
};

describe('Cosmic Resonance Engine', () => {
  describe('computeCosmicResonance', () => {
    it('water-dominant chart has highest global sensitivity', () => {
      const water = computeCosmicResonance(WATER_NATAL, 'Cancer', 'Pisces');
      const fire = computeCosmicResonance(FIRE_NATAL, 'Aries', 'Leo');
      const earth = computeCosmicResonance(EARTH_NATAL, 'Taurus', 'Capricorn');

      expect(water.globalSensitivity).toBeGreaterThan(fire.globalSensitivity);
      expect(fire.globalSensitivity).toBeGreaterThan(earth.globalSensitivity);
    });

    it('identifies correct dominant element', () => {
      expect(computeCosmicResonance(WATER_NATAL, 'Cancer').dominantElement).toBe('water');
      expect(computeCosmicResonance(FIRE_NATAL, 'Aries').dominantElement).toBe('fire');
      expect(computeCosmicResonance(EARTH_NATAL, 'Taurus').dominantElement).toBe('earth');
    });

    it('assigns correct resonance type', () => {
      expect(computeCosmicResonance(WATER_NATAL, 'Cancer').resonanceType).toBe('absorptiv');
      expect(computeCosmicResonance(FIRE_NATAL, 'Aries').resonanceType).toBe('reaktiv');
      expect(computeCosmicResonance(EARTH_NATAL, 'Taurus').resonanceType).toBe('resistiv');
    });

    it('produces 6 dimension resonances', () => {
      const profile = computeCosmicResonance(BALANCED_NATAL);
      const dims = Object.keys(profile.dimensions);
      expect(dims).toHaveLength(6);
      expect(dims).toContain('assertion');
      expect(dims).toContain('empathy');
      expect(dims).toContain('creativity');
    });

    it('empathy dimension is most sensitive for water charts', () => {
      const profile = computeCosmicResonance(WATER_NATAL, 'Cancer', 'Pisces');
      // Moon rules empathy, Moon is water → highest sensitivity
      const empathy = profile.dimensions['empathy']!;
      const discipline = profile.dimensions['discipline']!; // Saturn = earth
      expect(empathy.sensitivity).toBeGreaterThan(discipline.sensitivity);
    });

    it('sun/moon signs boost element weighting', () => {
      const noSigns = computeCosmicResonance(BALANCED_NATAL);
      const waterSigns = computeCosmicResonance(BALANCED_NATAL, 'Cancer', 'Pisces');

      // Water signs should boost water element → higher sensitivity
      expect(waterSigns.globalSensitivity).toBeGreaterThan(noSigns.globalSensitivity);
    });
  });

  describe('applyResonance', () => {
    it('returns 1.0 for all dimensions when no storm (ringModulation = 1.0)', () => {
      const profile = computeCosmicResonance(WATER_NATAL);
      const result = applyResonance(profile, 1.0, 0);

      for (const val of Object.values(result)) {
        expect(val).toBe(1.0);
      }
    });

    it('water chart shows stronger modulation than earth chart during storm', () => {
      const waterProfile = computeCosmicResonance(WATER_NATAL, 'Cancer');
      const earthProfile = computeCosmicResonance(EARTH_NATAL, 'Taurus');

      const waterResult = applyResonance(waterProfile, 1.4, 7);
      const earthResult = applyResonance(earthProfile, 1.4, 7);

      // Average modulation across all dimensions should be higher for water
      const waterAvg = Object.values(waterResult).reduce((a, b) => a + b, 0) / 6;
      const earthAvg = Object.values(earthResult).reduce((a, b) => a + b, 0) / 6;

      expect(waterAvg).toBeGreaterThan(earthAvg);
    });

    it('modulation never exceeds 2.0 cap', () => {
      const profile = computeCosmicResonance(WATER_NATAL, 'Cancer', 'Pisces', 'Scorpio');
      const result = applyResonance(profile, 1.5, 9); // extreme storm

      for (const val of Object.values(result)) {
        expect(val).toBeLessThanOrEqual(2.0);
        expect(val).toBeGreaterThanOrEqual(1.0);
      }
    });

    it('produces 6 dimension multipliers', () => {
      const profile = computeCosmicResonance(BALANCED_NATAL);
      const result = applyResonance(profile, 1.3, 5);
      expect(Object.keys(result)).toHaveLength(6);
    });
  });
});
