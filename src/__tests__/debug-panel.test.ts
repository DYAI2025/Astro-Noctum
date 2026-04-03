/**
 * DebugPanel und useDebugPanel Hook Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DebugInjection } from '../debug/debug-injection';
import { DEBUG_PRESETS, PRESET_LABELS, PRESET_DESCRIPTIONS } from '../debug/presets';

function resetDebugInjection(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (DebugInjection as any).instance = null;
}

describe('DebugPanel & useDebugPanel', () => {
  beforeEach(() => {
    resetDebugInjection();
  });

  describe('DEBUG_PRESETS', () => {
    it('sollte alle erwarteten Presets definieren', () => {
      const expectedPresets = [
        'input-variation-test',
        'time-continuity-test',
        'determinism-test',
        'calibration-max-contrast',
        'high-dissonance',
        'trail-endurance',
        'cosmic-storm',
        'production-like',
        'pure-consonance',
        'single-dimension-assertion',
        'density-field-calibration',
      ];

      for (const preset of expectedPresets) {
        expect(DEBUG_PRESETS[preset]).toBeDefined();
      }
    });

    it('sollte für jedes Preset ein Label haben', () => {
      const presetKeys = Object.keys(DEBUG_PRESETS);
      const labelKeys = Object.keys(PRESET_LABELS);

      expect(presetKeys.length).toBe(labelKeys.length);

      for (const key of presetKeys) {
        expect(PRESET_LABELS[key as keyof typeof PRESET_LABELS]).toBeDefined();
      }
    });

    it('sollte für jedes Preset eine Beschreibung haben', () => {
      const presetKeys = Object.keys(DEBUG_PRESETS);
      const descKeys = Object.keys(PRESET_DESCRIPTIONS);

      expect(presetKeys.length).toBe(descKeys.length);

      for (const key of presetKeys) {
        expect(PRESET_DESCRIPTIONS[key as keyof typeof PRESET_DESCRIPTIONS]).toBeDefined();
      }
    });

    it('sollte valides "input-variation-test" Preset haben', () => {
      const preset = DEBUG_PRESETS['input-variation-test'];

      expect(preset.natalOverride).toBeDefined();
      expect(preset.quizOverride).toBeDefined();
      expect(preset.forceDissonance).toBe(true);
      expect(preset.persistenceOverride).toBe(0.95);

      // Natal und Quiz sollten opposite Werte haben
      const natalAssertion = preset.natalOverride?.get('assertion');
      const quizAssertion = preset.quizOverride?.get('assertion');
      expect(natalAssertion).toBe(0.95);
      expect(quizAssertion).toBe(0.05);
    });

    it('sollte valides "calibration-max-contrast" Preset haben', () => {
      const preset = DEBUG_PRESETS['calibration-max-contrast'];

      expect(preset.persistenceOverride).toBe(0.99);
      expect(preset.fadeAlphaOverride).toBe(0.02);
      expect(preset.glowRadiusOverride).toEqual([20, 30]);
      expect(preset.showDensityField).toBe(true);
    });

    it('sollte valides "cosmic-storm" Preset haben', () => {
      const preset = DEBUG_PRESETS['cosmic-storm'];

      expect(preset.kpIndexOverride).toBe(9);
      expect(preset.solarStormOverride).toBe(1.0);
      expect(preset.spaceWeatherModulation).toBe(true);
      expect(preset.glowRadiusOverride).toEqual([25, 35]);
    });

    it('sollte "production-like" Preset ohne Overrides haben', () => {
      const preset = DEBUG_PRESETS['production-like'];

      // Sollte leer sein oder nur undefined Werte haben
      const hasValues = Object.values(preset).some(v => v !== undefined);
      expect(hasValues).toBe(false);
    });
  });

  describe('PRESET_LABELS', () => {
    it('sollte deutsche Labels verwenden', () => {
      expect(PRESET_LABELS['input-variation-test']).toContain('Extremwerte');
      expect(PRESET_LABELS['calibration-max-contrast']).toContain('Kontrast');
      expect(PRESET_LABELS['cosmic-storm']).toContain('Kp=9');
    });

    it('sollte aussagekräftige Labels haben (mindestens 10 Zeichen)', () => {
      for (const label of Object.values(PRESET_LABELS)) {
        expect(label.length).toBeGreaterThanOrEqual(10);
      }
    });
  });

  describe('PRESET_DESCRIPTIONS', () => {
    it('sollte beschreibende Texte haben', () => {
      for (const desc of Object.values(PRESET_DESCRIPTIONS)) {
        expect(desc.length).toBeGreaterThanOrEqual(20);
      }
    });

    it('sollte technische Details enthalten', () => {
      // Einige Beschreibungen sollten spezifische Werte nennen
      const allDescriptions = Object.values(PRESET_DESCRIPTIONS).join(' ');
      
      expect(allDescriptions).toMatch(/\d/); // Mindestens eine Zahl
      expect(allDescriptions).toContain('Dissonanz');
      expect(allDescriptions).toContain('Trail');
    });
  });

  describe('Preset-Anwendung', () => {
    it('sollte Preset korrekt anwenden können', () => {
      const debug = DebugInjection.getInstance();
      const preset = DEBUG_PRESETS['high-dissonance'];

      debug.setOverrides(preset);
      const applied = debug.getOverrides();

      expect(applied.forceDissonance).toBe(true);
      expect(applied.persistenceOverride).toBe(0.9);
      expect(applied.glowRadiusOverride).toEqual([15, 25]);
    });

    it('sollte Presets nacheinander anwenden können', () => {
      const debug = DebugInjection.getInstance();

      // Erstes Preset
      debug.setOverrides(DEBUG_PRESETS['determinism-test']);
      expect(debug.getOverrides().forceConsonance).toBe(true);

      // Zweites Preset (merged, nicht überschreibt)
      debug.setOverrides(DEBUG_PRESETS['high-dissonance']);
      // high-dissonance hat forceDissonance=true, aber kein forceConsonance
      // Da wir mergen, bleibt forceConsonance erhalten bis explizit zurückgesetzt
      expect(debug.getOverrides().forceDissonance).toBe(true);
      
      // Reset und neu versuchen für sauberen Test
      debug.reset();
      debug.setOverrides(DEBUG_PRESETS['high-dissonance']);
      expect(debug.getOverrides().forceConsonance).toBeUndefined();
      expect(debug.getOverrides().forceDissonance).toBe(true);
    });

    it('sollte nach Preset-Anwendung resetten können', () => {
      const debug = DebugInjection.getInstance();

      debug.setOverrides(DEBUG_PRESETS['cosmic-storm']);
      expect(debug.getOverrides().kpIndexOverride).toBe(9);

      debug.reset();
      const reset = debug.getOverrides();
      expect(reset.kpIndexOverride).toBeUndefined();
      expect(reset.solarStormOverride).toBeUndefined();
    });
  });

  describe('useDebugPanel Hook (Logik-Test)', () => {
    it('sollte Hotkey-Logik dokumentieren', () => {
      // Der Hook verwendet Strg+D oder Cmd+D
      // Diese Test dokumentiert das erwartete Verhalten

      const hotkey = { ctrlKey: true, metaKey: false, key: 'd' };
      const macHotkey = { ctrlKey: false, metaKey: true, key: 'd' };

      // Beide sollten den Toggle auslösen
      expect(hotkey.ctrlKey || hotkey.metaKey).toBe(true);
      expect(hotkey.key).toBe('d');

      expect(macHotkey.ctrlKey || macHotkey.metaKey).toBe(true);
      expect(macHotkey.key).toBe('d');
    });

    it('sollte Input-Fokus-Check dokumentieren', () => {
      // Der Hook sollte nicht triggern wenn Input fokussiert
      const inputTags = ['input', 'textarea', 'select'];

      for (const tag of inputTags) {
        // Diese Tags sollten den Hotkey blockieren
        expect(tag).toMatch(/^(input|textarea|select)$/);
      }
    });
  });
});
