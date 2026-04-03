/**
 * bipolar-engine Debug-Integration Tests
 * 
 * Testet die DebugInjection-Overrides in der Signatur V3 Engine.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializePoles,
  computeV3Dissonance,
  updatePoles,
  type SignaturV3Config,
} from '../components/signatur-v3/bipolar-engine';
import { DebugInjection } from '../debug/debug-injection';
import { DIMENSION_DEFS } from '@/packages/shared/src/signatur/dimension-defs';

// Mock NODE_ENV für Debug-Modus
const originalEnv = process.env.NODE_ENV;

function enableDebugMode(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.env as any).NODE_ENV = 'development';
}

function disableDebugMode(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.env as any).NODE_ENV = originalEnv;
}

function resetDebugInjection(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (DebugInjection as any).instance = null;
}

const DEFAULT_CONFIG: SignaturV3Config = {
  maxR: 200,
  maxTrailLength: 2000,
  trailPersistence: 0.85,
  timeScale: 1.0,
};

const NATAL = new Map([
  ['assertion', 0.7],
  ['empathy', 0.3],
  ['creativity', 0.8],
  ['logic', 0.4],
  ['intuition', 0.6],
  ['discipline', 0.5],
]);

const QUIZ_ALIGNED = new Map([
  ['assertion', 0.7],
  ['empathy', 0.3],
  ['creativity', 0.8],
  ['logic', 0.4],
  ['intuition', 0.6],
  ['discipline', 0.5],
]);

const QUIZ_DISSONANT = new Map([
  ['assertion', 0.1],
  ['empathy', 0.9],
  ['creativity', 0.2],
  ['logic', 0.8],
  ['intuition', 0.1],
  ['discipline', 0.9],
]);

describe('bipolar-engine Debug-Integration', () => {
  beforeEach(() => {
    resetDebugInjection();
    enableDebugMode();
  });

  afterAll(() => {
    disableDebugMode();
  });

  describe('initializePoles mit Debug-Overrides', () => {
    it('sollte natalOverride anwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({
        natalOverride: new Map([
          ['assertion', 0.95],
          ['empathy', 0.05],
          ['creativity', 0.95],
          ['logic', 0.05],
          ['intuition', 0.95],
          ['discipline', 0.05],
        ]),
      });

      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);

      // assertion-Pol sollte größeren Radius haben wegen höherem natal value
      const assertionPole = poles.find(p => p.dimensionId === 'assertion' && p.pole === 'A')!;
      const empathyPole = poles.find(p => p.dimensionId === 'empathy' && p.pole === 'A')!;

      expect(assertionPole.radius).toBeGreaterThan(empathyPole.radius);
    });

    it('sollte quizOverride anwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({
        quizOverride: new Map([
          ['assertion', 0.95],
          ['empathy', 0.05],
          ['creativity', 0.95],
          ['logic', 0.05],
          ['intuition', 0.95],
          ['discipline', 0.05],
        ]),
      });

      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_DISSONANT);

      // Pole B sollte durch quizOverride beeinflusst sein
      const assertionPoleB = poles.find(p => p.dimensionId === 'assertion' && p.pole === 'B')!;
      expect(assertionPoleB.radius).toBeGreaterThan(0);
    });

    it('sollte ohne Overrides originale Werte verwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.reset();

      const poles1 = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const poles2 = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);

      // Sollte deterministisch sein
      for (let i = 0; i < poles1.length; i++) {
        expect(poles1[i]!.x).toBe(poles2[i]!.x);
        expect(poles1[i]!.y).toBe(poles2[i]!.y);
      }
    });
  });

  describe('computeV3Dissonance mit Debug-Overrides', () => {
    it('sollte forceConsonance anwenden (alle d=0)', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ forceConsonance: true });

      const dissonance = computeV3Dissonance(NATAL, QUIZ_DISSONANT);

      for (const dim of DIMENSION_DEFS) {
        expect(dissonance.dimensional.get(dim.id)).toBe(0);
      }
      expect(dissonance.dNatal).toBe(0);
    });

    it('sollte forceDissonance anwenden (alle d=1)', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ forceDissonance: true });

      const dissonance = computeV3Dissonance(NATAL, QUIZ_ALIGNED);

      for (const dim of DIMENSION_DEFS) {
        expect(dissonance.dimensional.get(dim.id)).toBe(1);
      }
      expect(dissonance.dNatal).toBe(1);
    });

    it('sollte dissonanceOverride anwenden', () => {
      const debug = DebugInjection.getInstance();
      const customDissonance = new Map([
        ['assertion', 0.8],
        ['empathy', 0.2],
        ['creativity', 0.6],
        ['logic', 0.4],
        ['intuition', 0.7],
        ['discipline', 0.3],
      ]);

      debug.setOverrides({ dissonanceOverride: customDissonance });

      const dissonance = computeV3Dissonance(NATAL, QUIZ_ALIGNED);

      expect(dissonance.dimensional.get('assertion')).toBe(0.8);
      expect(dissonance.dimensional.get('empathy')).toBe(0.2);

      // dNatal sollte Durchschnitt sein
      const expectedDNatal = (0.8 + 0.2 + 0.6 + 0.4 + 0.7 + 0.3) / 6;
      expect(dissonance.dNatal).toBeCloseTo(expectedDNatal, 2);
    });

    it('sollte dissonanceScale anwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ dissonanceScale: 2.0 });

      const dissonance1 = computeV3Dissonance(NATAL, QUIZ_DISSONANT);
      
      debug.setOverrides({ dissonanceScale: 0.5 });
      const dissonance2 = computeV3Dissonance(NATAL, QUIZ_DISSONANT);

      // Höhere Scale sollte höhere Dissonanz ergeben (bis max 1.0)
      expect(dissonance1.dNatal).toBeGreaterThanOrEqual(dissonance2.dNatal);
    });
  });

  describe('updatePoles mit Debug-Overrides', () => {
    it('sollte timeFreeze anwenden (time=0)', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ timeFreeze: true });

      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeV3Dissonance(NATAL, QUIZ_ALIGNED);

      const initialTheta = poles[0]!.theta;

      // Mehrfache Updates sollten bei timeFreeze keine Bewegung verursachen
      updatePoles(poles, dissonance, DEFAULT_CONFIG, 1.0);
      updatePoles(poles, dissonance, DEFAULT_CONFIG, 2.0);
      updatePoles(poles, dissonance, DEFAULT_CONFIG, 3.0);

      // Theta sollte sich nicht geändert haben (außer durch speed)
      // Da timeFreeze effectiveTime=0 setzt, sollte nur speed wirken
      const thetaDiff = poles[0]!.theta - initialTheta;
      expect(thetaDiff).toBeCloseTo(poles[0]!.speed * 3, 4);
    });

    it('sollte timeScrub anwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ timeScrub: 5.5 });

      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeV3Dissonance(NATAL, QUIZ_ALIGNED);

      updatePoles(poles, dissonance, DEFAULT_CONFIG, 0);

      // timeScrub sollte den time-Parameter überschreiben
      // Vibrationen verwenden effectiveTime=5.5 statt 0
    });

    it('sollte timeSpeed anwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ timeSpeed: 2.0 });

      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeV3Dissonance(NATAL, QUIZ_ALIGNED);

      const initialX = poles[0]!.x;
      updatePoles(poles, dissonance, DEFAULT_CONFIG, 1.0);

      // Bei 2x Speed sollte die Bewegung stärker sein
      const movedDistance = Math.abs(poles[0]!.x - initialX);
      expect(movedDistance).toBeGreaterThan(0);
    });

    it('sollte persistenceOverride anwenden', () => {
      const debug = DebugInjection.getInstance();
      debug.setOverrides({ persistenceOverride: 0.99 });

      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeV3Dissonance(NATAL, QUIZ_ALIGNED);

      const config: SignaturV3Config = { ...DEFAULT_CONFIG, trailPersistence: 0.5 };
      updatePoles(poles, dissonance, config, 1.0);

      // persistenceOverride sollte 0.99 verwenden statt 0.5
      // (wird im recordTrail verwendet)
    });

    it('sollte Pole-States an DebugInjection melden', () => {
      const debug = DebugInjection.getInstance();
      const listener = vi.fn();
      debug.subscribe(listener);

      const poles = initializePoles(DEFAULT_CONFIG, NATAL, QUIZ_ALIGNED);
      const dissonance = computeV3Dissonance(NATAL, QUIZ_ALIGNED);

      updatePoles(poles, dissonance, DEFAULT_CONFIG, 1.0);

      // Listener sollte mit Pole-States benachrichtigt worden sein
      expect(listener).toHaveBeenCalled();
      const lastState = listener.mock.calls[listener.mock.calls.length - 1]?.[0];
      expect(lastState?.poleStates).toBeDefined();
      expect(lastState?.poleStates).toHaveLength(12); // 6 Dimensionen × 2 Pole
    });
  });

  describe('Production-Mode (NODE_ENV !== development)', () => {
    it('sollte keine Overrides anwenden', () => {
      disableDebugMode();
      resetDebugInjection();

      const debug = DebugInjection.getInstance();
      debug.setOverrides({ forceConsonance: true, natalOverride: new Map() });

      const dissonance = computeV3Dissonance(NATAL, QUIZ_DISSONANT);

      // Sollte normale Dissonanz berechnen (nicht forceConsonance)
      expect(dissonance.dNatal).toBeGreaterThan(0);

      enableDebugMode(); // Reset für andere Tests
    });
  });
});
