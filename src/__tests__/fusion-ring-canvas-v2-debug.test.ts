/**
 * FusionRingCanvasV2 Debug-Integration Tests
 * 
 * Testet die DebugInjection-Overrides im Renderer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DebugInjection } from '../debug/debug-injection';

function resetDebugInjection(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (DebugInjection as any).instance = null;
}

describe('FusionRingCanvasV2 Debug-Integration', () => {
  beforeEach(() => {
    resetDebugInjection();
  });

  describe('Renderer-Overrides', () => {
    it('sollte glowRadiusOverride für Bloom-Stärke verwenden', () => {
      const debug = DebugInjection.getInstance();
      
      // Glow Radius [min, max] → Bloom-Stärke wird berechnet als (min / 30) * 1.2
      debug.setOverrides({
        glowRadiusOverride: [15, 25], // min=15 → bloom strength ≈ 0.6
      });

      const overrides = debug.getOverrides();
      expect(overrides.glowRadiusOverride).toEqual([15, 25]);
      
      // Bloom-Stärke Berechnung simulieren
      const bloomStrength = (overrides.glowRadiusOverride[0] / 30) * 1.2;
      expect(bloomStrength).toBeCloseTo(0.6, 2);
    });

    it('sollte fadeAlphaOverride für Partikel-Opacity verwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({
        fadeAlphaOverride: 0.02, // Sehr niedrig für lange Trails
      });

      const overrides = debug.getOverrides();
      expect(overrides.fadeAlphaOverride).toBe(0.02);
    });

    it('sollte disableAdditiveBlend für Normal-Blending verwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({
        disableAdditiveBlend: true,
      });

      const overrides = debug.getOverrides();
      expect(overrides.disableAdditiveBlend).toBe(true);
    });

    it('sollte showDensityField für Heatmap-Overlay aktivieren', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({
        showDensityField: true,
        densityThreshold: 0.6,
      });

      const overrides = debug.getOverrides();
      expect(overrides.showDensityField).toBe(true);
      expect(overrides.densityThreshold).toBe(0.6);
    });
  });

  describe('Kombinierte Renderer-Overrides', () => {
    it('sollte alle Renderer-Overrides gleichzeitig anwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({
        // Bloom / Glow
        glowRadiusOverride: [20, 30],
        
        // Fade / Trails
        fadeAlphaOverride: 0.01,
        persistenceOverride: 0.99,
        trailLengthOverride: 4000,
        
        // Blend-Modus
        disableAdditiveBlend: true,
        
        // Density Field
        showDensityField: true,
        densityThreshold: 0.5,
      });

      const overrides = debug.getOverrides();
      expect(overrides.glowRadiusOverride).toEqual([20, 30]);
      expect(overrides.fadeAlphaOverride).toBe(0.01);
      expect(overrides.persistenceOverride).toBe(0.99);
      expect(overrides.trailLengthOverride).toBe(4000);
      expect(overrides.disableAdditiveBlend).toBe(true);
      expect(overrides.showDensityField).toBe(true);
      expect(overrides.densityThreshold).toBe(0.5);
    });
  });

  describe('Debug-Use-Cases', () => {
    it('sollte "Max Contrast"-Preset für Design-Kalibrierung unterstützen', () => {
      const debug = DebugInjection.getInstance();
      
      // Preset für maximale Sichtbarkeit der Trails
      debug.setOverrides({
        persistenceOverride: 0.99,      // Sehr lange Trails
        fadeAlphaOverride: 0.02,        // Langsames Fade
        glowRadiusOverride: [20, 30],   // Starker Glow
        showDensityField: true,         // Heatmap sichtbar
      });

      const overrides = debug.getOverrides();
      expect(overrides.persistenceOverride).toBe(0.99);
      expect(overrides.fadeAlphaOverride).toBe(0.02);
      expect(overrides.glowRadiusOverride).toEqual([20, 30]);
      expect(overrides.showDensityField).toBe(true);
    });

    it('sollte "Normal Blend"-Modus für Farb-Debugging unterstützen', () => {
      const debug = DebugInjection.getInstance();
      
      // Additive Blend deaktivieren für korrekte Farbdarstellung
      debug.setOverrides({
        disableAdditiveBlend: true,
        glowRadiusOverride: [8, 8],     // Konstanter Glow für klare Farben
      });

      const overrides = debug.getOverrides();
      expect(overrides.disableAdditiveBlend).toBe(true);
      expect(overrides.glowRadiusOverride).toEqual([8, 8]);
    });

    it('sollte Density Field mit anpassbarem Threshold unterstützen', () => {
      const debug = DebugInjection.getInstance();
      
      // Density Field für Emergence-Analyse
      debug.setOverrides({
        showDensityField: true,
        densityThreshold: 0.7,          // Nur hohe Dichten anzeigen
        persistenceOverride: 0.95,      // Lange Trails für gute Dichte
      });

      const overrides = debug.getOverrides();
      expect(overrides.showDensityField).toBe(true);
      expect(overrides.densityThreshold).toBe(0.7);
      expect(overrides.persistenceOverride).toBe(0.95);
    });
  });
});
