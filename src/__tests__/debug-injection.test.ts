/**
 * DebugInjection Tests
 * 
 * Testet das Singleton-Pattern, Subscriber-Mechanismus und Override-Handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DebugInjection, isDebugMode } from '../debug/debug-injection';
import type { DebugOverrides } from '../debug/types';

// Singleton zurücksetzen vor jedem Test
function resetDebugInjection(): void {
  // Zugriff auf private static instance via Type-Cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (DebugInjection as any).instance = null;
}

describe('DebugInjection', () => {
  beforeEach(() => {
    resetDebugInjection();
  });

  describe('Singleton Pattern', () => {
    it('sollte immer dieselbe Instanz zurückgeben', () => {
      const instance1 = DebugInjection.getInstance();
      const instance2 = DebugInjection.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('sollte neue Instanz nach reset erstellen', () => {
      const instance1 = DebugInjection.getInstance();
      resetDebugInjection();
      const instance2 = DebugInjection.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('setOverrides / getOverrides', () => {
    it('sollte Overrides setzen und holen', () => {
      const debug = DebugInjection.getInstance();
      const testOverrides: DebugOverrides = {
        forceDissonance: true,
        persistenceOverride: 0.95,
      };

      debug.setOverrides(testOverrides);
      const retrieved = debug.getOverrides();

      expect(retrieved.forceDissonance).toBe(true);
      expect(retrieved.persistenceOverride).toBe(0.95);
    });

    it('sollte bestehende Overrides erhalten (merge)', () => {
      const debug = DebugInjection.getInstance();

      debug.setOverrides({ forceDissonance: true });
      debug.setOverrides({ persistenceOverride: 0.9 });

      const retrieved = debug.getOverrides();
      expect(retrieved.forceDissonance).toBe(true);
      expect(retrieved.persistenceOverride).toBe(0.9);
    });

    it('sollte Map-Werte korrekt behandeln', () => {
      const debug = DebugInjection.getInstance();
      const natalMap = new Map([['assertion', 0.8], ['empathy', 0.3]]);

      debug.setOverrides({ natalOverride: natalMap });
      const retrieved = debug.getOverrides();

      expect(retrieved.natalOverride?.get('assertion')).toBe(0.8);
      expect(retrieved.natalOverride?.get('empathy')).toBe(0.3);
    });

    it('sollte eine Kopie zurückgeben (nicht referenzgleich)', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ forceDissonance: true });

      const retrieved1 = debug.getOverrides();
      retrieved1.forceDissonance = false;

      const retrieved2 = debug.getOverrides();
      expect(retrieved2.forceDissonance).toBe(true);
    });
  });

  describe('Subscribe Pattern', () => {
    it('sollte Subscriber bei Änderungen benachrichtigen', () => {
      const debug = DebugInjection.getInstance();
      const listener = vi.fn();

      debug.subscribe(listener);
      debug.setOverrides({ forceDissonance: true });

      // Initial call + 1 update = 2 calls
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener.mock.calls[1]?.[0].overrides.forceDissonance).toBe(true);
    });

    it('sollte mehrere Subscriber benachrichtigen', () => {
      const debug = DebugInjection.getInstance();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      debug.subscribe(listener1);
      debug.subscribe(listener2);
      debug.setOverrides({ persistenceOverride: 0.9 });

      // Initial call + 1 update = 2 calls each
      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    it('sollte unsubscribe korrekt entfernen', () => {
      const debug = DebugInjection.getInstance();
      const listener = vi.fn();

      const unsubscribe = debug.subscribe(listener);
      unsubscribe();

      debug.setOverrides({ forceDissonance: true });
      // Nur initial call, kein update nach unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('sollte State bei subscribe initial senden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ forceDissonance: true });

      const listener = vi.fn();
      debug.subscribe(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]?.[0].overrides.forceDissonance).toBe(true);
    });
  });

  describe('updatePoleStates', () => {
    it('sollte Pole-States speichern und Subscriber benachrichtigen', () => {
      const debug = DebugInjection.getInstance();
      const listener = vi.fn();
      debug.subscribe(listener);

      const poleStates = [
        {
          dimensionId: 'assertion',
          pole: 'A' as const,
          x: 100,
          y: 50,
          radius: 0.8,
          speed: 0.02,
          dissonance: 0.5,
        },
      ];

      debug.updatePoleStates(poleStates);
      const state = debug.getState();

      expect(state.poleStates).toHaveLength(1);
      expect(state.poleStates?.[0]?.dimensionId).toBe('assertion');
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('updateDensityField', () => {
    it('sollte Density Field speichern und Subscriber benachrichtigen', () => {
      const debug = DebugInjection.getInstance();
      const listener = vi.fn();
      debug.subscribe(listener);

      const densityField = {
        width: 128,
        height: 128,
        grid: new Array(128 * 128).fill(0.5),
        maxDensity: 1.0,
      };

      debug.updateDensityField(densityField);
      const state = debug.getState();

      expect(state.densityField).toBeDefined();
      expect(state.densityField?.width).toBe(128);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('sollte alle Overrides zurücksetzen', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({
        forceDissonance: true,
        persistenceOverride: 0.9,
        natalOverride: new Map([['assertion', 0.8]]),
      });

      debug.reset();
      const retrieved = debug.getOverrides();

      expect(retrieved.forceDissonance).toBeUndefined();
      expect(retrieved.persistenceOverride).toBeUndefined();
      expect(retrieved.natalOverride).toBeUndefined();
    });

    it('sollte State zurücksetzen', () => {
      const debug = DebugInjection.getInstance();
      debug.updatePoleStates([{ dimensionId: 'test', pole: 'A', x: 0, y: 0, radius: 0.5, speed: 0.01, dissonance: 0 }]);

      debug.reset();
      const state = debug.getState();

      expect(state.poleStates).toBeUndefined();
      expect(state.densityField).toBeUndefined();
    });

    it('sollte Subscriber nach reset benachrichtigen', () => {
      const debug = DebugInjection.getInstance();
      const listener = vi.fn();
      debug.subscribe(listener);

      debug.reset();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('isDebugMode', () => {
    it('sollte true zurückgeben wenn NODE_ENV === development', () => {
      // Hinweis: In Tests ist NODE_ENV typischerweise 'test'
      // Dieser Test dokumentiert das erwartete Verhalten
      const originalEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = 'development';
      expect(isDebugMode()).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(isDebugMode()).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Complex Override Scenarios', () => {
    it('sollte alle Override-Typen gleichzeitig behandeln', () => {
      const debug = DebugInjection.getInstance();

      debug.setOverrides({
        // Schicht 0
        natalOverride: new Map([['assertion', 0.9], ['empathy', 0.1]]),
        quizOverride: new Map([['assertion', 0.1], ['empathy', 0.9]]),
        soulprintOverride: [0.8, 0.2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.2],

        // Schicht 1
        forceDissonance: true,
        dissonanceScale: 1.5,

        // Schicht 2
        persistenceOverride: 0.95,
        trailLengthOverride: 3000,

        // Schicht 3
        glowRadiusOverride: [15, 25],
        fadeAlphaOverride: 0.02,
        showDensityField: true,

        // Schicht 4
        timeFreeze: true,
        timeScrub: 5.5,
        timeSpeed: 0.5,

        // Cosmic Weather
        kpIndexOverride: 7,
        solarStormOverride: 0.8,
      });

      const overrides = debug.getOverrides();

      expect(overrides.natalOverride?.get('assertion')).toBe(0.9);
      expect(overrides.forceDissonance).toBe(true);
      expect(overrides.persistenceOverride).toBe(0.95);
      expect(overrides.glowRadiusOverride).toEqual([15, 25]);
      expect(overrides.timeFreeze).toBe(true);
      expect(overrides.kpIndexOverride).toBe(7);
    });
  });
});
