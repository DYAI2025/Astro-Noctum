import { describe, it, expect } from 'vitest';

import type { PlanetName } from '../planets';
import {
  chladniDisplacement,
  getPolePositions,
  getPolePairs,
  buildTrailPath,
  type PolePoint,
} from '../sphere-chladni';

const ALL_HALF: Readonly<Partial<Record<PlanetName, number>>> = {
  Sun: 0.5,
  Moon: 0.5,
  Mercury: 0.5,
  Venus: 0.5,
  Mars: 0.5,
  Jupiter: 0.5,
  Saturn: 0.5,
  Uranus: 0.5,
  Neptune: 0.5,
  Pluto: 0.5,
};

const pointKey = (p: PolePoint, precision = 6): string =>
  `${p.x.toFixed(precision)},${p.y.toFixed(precision)},${p.z.toFixed(precision)}`;

describe('sphere-chladni', () => {
  describe('chladniDisplacement', () => {
    it('returns 0 for all-zero / empty weights, regardless of theta/phi/time', () => {
      for (const time of [0, 500, 9999]) {
        for (const theta of [0, Math.PI / 4, Math.PI / 2, Math.PI]) {
          for (const phi of [0, Math.PI, 2 * Math.PI]) {
            expect(chladniDisplacement(theta, phi, {}, time)).toBe(0);
            expect(
              chladniDisplacement(theta, phi, { Sun: 0, Moon: 0, Mars: 0 }, time),
            ).toBe(0);
          }
        }
      }
    });

    it('is deterministic — same input → same output across repeated calls', () => {
      const a = chladniDisplacement(1.2, 3.4, ALL_HALF, 1234);
      const b = chladniDisplacement(1.2, 3.4, ALL_HALF, 1234);
      expect(a).toBe(b);
    });

    it('stays well-bounded across a theta/phi/time grid for typical weights', () => {
      let maxAbs = 0;
      for (const time of [0, 1000, 5000, 30000]) {
        for (let ti = 0; ti <= 8; ti++) {
          const theta = (ti / 8) * Math.PI;
          for (let pi = 0; pi <= 12; pi++) {
            const phi = (pi / 12) * 2 * Math.PI;
            const v = chladniDisplacement(theta, phi, ALL_HALF, time);
            maxAbs = Math.max(maxAbs, Math.abs(v));
          }
        }
      }
      // Theoretical upper bound is Σ|w| / N = 0.5 — the division-by-N normalizer
      // keeps the sum well under 1.0. We assert comfortably below 2 (catches
      // order-of-magnitude regressions, e.g. forgetting to normalize).
      expect(maxAbs).toBeLessThan(2);
      // For developer visibility, expose the measured bound so future failures
      // show the actual magnitude in the diff.
      (globalThis as { __chladniMaxAbs?: number }).__chladniMaxAbs = maxAbs;
    });

    it('respects each planet weight independently (single-planet weight scales output linearly)', () => {
      const weightsA = { Sun: 0.4 } as const;
      const weightsB = { Sun: 0.8 } as const;
      const vA = chladniDisplacement(1.3, 2.1, weightsA, 4200);
      const vB = chladniDisplacement(1.3, 2.1, weightsB, 4200);
      // Doubling the weight must double the contribution (within float eps).
      expect(vB).toBeCloseTo(vA * 2, 12);
    });
  });

  describe('getPolePositions', () => {
    it('returns exactly 12 points', () => {
      expect(getPolePositions(1).length).toBe(12);
      expect(getPolePositions(2.5).length).toBe(12);
    });

    it('places every pole on the sphere of radius · 1.15', () => {
      const radius = 3;
      const target = (radius * 1.15) ** 2;
      const poles = getPolePositions(radius);
      for (const p of poles) {
        const lenSq = p.x * p.x + p.y * p.y + p.z * p.z;
        expect(Math.abs(lenSq - target)).toBeLessThan(1e-9);
      }
    });

    it('produces 12 distinct points (no duplicate / collinear axis mapping)', () => {
      const poles = getPolePositions(1);
      const seen = new Set(poles.map((p) => pointKey(p)));
      expect(seen.size).toBe(12);
    });

    it('is deterministic — two calls return identical coordinates in the same order', () => {
      const a = getPolePositions(1.7);
      const b = getPolePositions(1.7);
      expect(a.length).toBe(b.length);
      for (let i = 0; i < a.length; i++) {
        expect(a[i]).toEqual(b[i]);
      }
    });
  });

  describe('getPolePairs', () => {
    it('returns exactly 6 pairs and covers all 12 unique poles once', () => {
      const pairs = getPolePairs(1);
      expect(pairs.length).toBe(6);
      const seen = new Set<string>();
      for (const [a, b] of pairs) {
        seen.add(pointKey(a));
        seen.add(pointKey(b));
      }
      expect(seen.size).toBe(12);
    });

    it('pairs are antipodal — pair members sum to the origin', () => {
      const pairs = getPolePairs(2);
      for (const [a, b] of pairs) {
        expect(Math.abs(a.x + b.x)).toBeLessThan(1e-9);
        expect(Math.abs(a.y + b.y)).toBeLessThan(1e-9);
        expect(Math.abs(a.z + b.z)).toBeLessThan(1e-9);
      }
    });
  });

  describe('buildTrailPath', () => {
    it('returns steps+1 points (default steps=48 → 49)', () => {
      const poles = getPolePositions(1);
      const path = buildTrailPath(poles[0], poles[2], 1, 0.04, 3, undefined, 0);
      expect(path.length).toBe(49);

      const custom = buildTrailPath(poles[0], poles[2], 1, 0.04, 3, 12, 0);
      expect(custom.length).toBe(13);
    });

    it('places every sample near the sphere surface (within ripple amplitude)', () => {
      const radius = 1;
      const ripple = 0.04;
      const poles = getPolePositions(radius);
      const path = buildTrailPath(poles[0], poles[2], radius, ripple, 3, 32, 1234);
      for (const p of path) {
        const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        expect(Math.abs(len - radius)).toBeLessThanOrEqual(ripple + 1e-9);
      }
    });

    it('is deterministic — same inputs → identical path', () => {
      const poles = getPolePositions(1);
      const a = buildTrailPath(poles[0], poles[4], 1, 0.04, 3, 24, 7777);
      const b = buildTrailPath(poles[0], poles[4], 1, 0.04, 3, 24, 7777);
      expect(a).toEqual(b);
    });

    it('ripple=0 yields samples exactly on the sphere', () => {
      const radius = 2;
      const poles = getPolePositions(radius);
      const path = buildTrailPath(poles[0], poles[4], radius, 0, 3, 16, 500);
      for (const p of path) {
        const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        expect(Math.abs(len - radius)).toBeLessThan(1e-9);
      }
    });

    it('keeps antipodal pole-pair trails on a real great-circle arc instead of collapsing into one axis', () => {
      const [from, to] = getPolePairs(1)[0];
      const path = buildTrailPath(from, to, 1, 0, 3, 48, 0);

      // Old behavior normalized a lerp between exact opposites, producing only
      // +/- endpoint directions (and one origin fallback). A real branch must
      // leave that axis by the midpoint and produce many distinct directions.
      const midpoint = path[24];
      expect(Math.abs(midpoint.x)).toBeLessThan(1e-9);
      expect(Math.hypot(midpoint.y, midpoint.z)).toBeCloseTo(1, 12);

      const distinctDirections = new Set(path.map((p) => pointKey(p)));
      expect(distinctDirections.size).toBeGreaterThan(24);
    });
  });
});
