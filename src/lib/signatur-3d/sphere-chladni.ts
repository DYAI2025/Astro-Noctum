/**
 * Phase H2 — Chladni sphere math (pure functions).
 *
 * Pure-function sphere physics for the 3D Cymatics renderer. No
 * Three.js dependency — testable in jsdom without WebGL.
 *
 * H3 wires these into an R3F `SignatureSphere3D` component.
 *
 * Source-of-truth for planet frequencies/dimensions/poleIndex: `./planets.ts`
 * (Phase H1). This file is pure math and pulls all planet fields from there.
 */

import { PLANETS, type PlanetName } from './planets';

/** Simple 3D point for pole positions. Not Three.js — just (x, y, z) numbers. */
export interface PolePoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Chladni-like standing-wave superposition on a spherical surface.
 *
 *   f(θ, φ, t) = (1 / N) · Σᵢ wᵢ · sin(nᵢ·θ + driftᵢ) · cos(mᵢ·φ + phaseᵢ·t)
 *
 * Per planet i:
 *   nᵢ     = 2 + planet.dimension * 2                  → 2,4,6,8,10,12
 *   mᵢ     = 1 + (planet.poleIndex % 6)                → 1..6
 *   phaseᵢ = planet.baseFrequency / 100 · time · 1e-3
 *   driftᵢ = sin(time · 2.3e-4 · (i + 1)) · 0.3
 *
 * Planets not present in `weights` default to 0. Output is divided by
 * `PLANETS.length` so roughly bounded in ±1 for typical weights.
 *
 * @param theta    polar angle 0..π
 * @param phi      azimuthal angle 0..2π
 * @param weights  amplitude per planet; missing planets = 0
 * @param time     monotonic ms (0 is a valid snapshot)
 * @returns        displacement in arbitrary units (≈ ±1 for typical weights)
 */
export function chladniDisplacement(
  theta: number,
  phi: number,
  weights: Readonly<Partial<Record<PlanetName, number>>>,
  time: number,
): number {
  let value = 0;

  for (let i = 0; i < PLANETS.length; i++) {
    const planet = PLANETS[i];
    const w = weights[planet.name] ?? 0;
    if (w === 0) continue;

    const n = 2 + planet.dimension * 2;
    const m = 1 + (planet.poleIndex % 6);
    const phase = (planet.baseFrequency / 100) * time * 0.001;
    const drift = Math.sin(time * 0.00023 * (i + 1)) * 0.3;

    value += w * Math.sin(n * theta + drift) * Math.cos(m * phi + phase);
  }

  return value / PLANETS.length;
}

/**
 * Parse a #RRGGBB hex string into normalised 0–1 RGB components.
 * Invalid inputs fall back to mid-grey so callers never see NaN in the
 * render loop. In dev a warning is logged so configuration mistakes
 * (typo in `PLANETS[i].color`, etc.) surface rather than silently
 * turning the sphere grey.
 */
function hexToNormalisedRgb(hex: string): { r: number; g: number; b: number } {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) {
    if (typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[sphere-chladni] invalid hex color "${hex}" — falling back to mid-grey`);
    }
    return { r: 0.5, g: 0.5, b: 0.5 };
  }
  const n = Number.parseInt(match[1], 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}

/**
 * Weighted average of planet colours in 0–1 RGB space. If no planet has
 * any weight, returns a soft blue default so the sphere still has a tint.
 */
function blendedPlanetColor(
  weights: Readonly<Partial<Record<PlanetName, number>>>,
): { r: number; g: number; b: number } {
  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (const planet of PLANETS) {
    const w = weights[planet.name] ?? 0;
    if (w <= 0) continue;
    const c = hexToNormalisedRgb(planet.color);
    r += c.r * w;
    g += c.g * w;
    b += c.b * w;
    total += w;
  }
  if (total === 0) return { r: 0.31, g: 0.43, b: 0.97 }; // soft indigo default
  return { r: r / total, g: g / total, b: b / total };
}

/**
 * Compute a node-highlight intensity for one vertex from its Chladni value.
 *
 * Chladni-plate convention: sand collects where |amplitude| ≈ 0 — the
 * NODE lines. We mirror that here by lighting up curves where |v| is small
 * and fading toward zero where |v| is large. This paints the wave pattern
 * onto the sphere surface as glowing filaments, matching the visual grammar
 * of the 2D Cymatics view.
 *
 * @param chladniValue  from `chladniDisplacement`, roughly ±1
 * @returns             0..1, 1 at node, 0 at antinode
 */
export function chladniNodeIntensity(chladniValue: number): number {
  const m = Math.abs(chladniValue);
  // Falloff rate — 3.5 gives thin visible node curves for typical weights.
  return Math.max(0, 1 - m * 3.5);
}

/** Very dark navy base so the sphere reads as a deep-space body between
 *  the glowing node filaments. Not pitch black so the silhouette stays
 *  legible against the page background. */
const NODE_BASE_R = 0.02;
const NODE_BASE_G = 0.02;
const NODE_BASE_B = 0.06;

/**
 * Shared inner loop for both {@link computeChladniVertexColors} and
 * {@link writeChladniVertexColors}. Operates on a caller-supplied target
 * buffer so the two public wrappers only differ in whether they allocate
 * that buffer. Extracted to keep the Chladni → colour mapping in a single
 * place and avoid math drift between the two paths.
 */
function writeChladniColorsInto(
  target: Float32Array,
  positions: ArrayLike<number>,
  weights: Readonly<Partial<Record<PlanetName, number>>>,
  time: number,
): void {
  if (positions.length % 3 !== 0) {
    throw new RangeError(
      `chladni colour writer expected positions.length to be a multiple of 3, got ${positions.length}`,
    );
  }
  if (target.length !== positions.length) {
    throw new RangeError(
      `chladni colour writer target length ${target.length} does not match positions length ${positions.length}`,
    );
  }
  const count = positions.length / 3;
  const tint = blendedPlanetColor(weights);
  for (let i = 0; i < count; i++) {
    const xi = i * 3;
    const x = positions[xi];
    const y = positions[xi + 1];
    const z = positions[xi + 2];
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-6) {
      target[xi] = NODE_BASE_R;
      target[xi + 1] = NODE_BASE_G;
      target[xi + 2] = NODE_BASE_B;
      continue;
    }
    const theta = Math.acos(Math.max(-1, Math.min(1, y / r)));
    const phi = Math.atan2(z, x);
    const v = chladniDisplacement(theta, phi, weights, time);
    const intensity = chladniNodeIntensity(v);
    target[xi]     = NODE_BASE_R + (tint.r - NODE_BASE_R) * intensity;
    target[xi + 1] = NODE_BASE_G + (tint.g - NODE_BASE_G) * intensity;
    target[xi + 2] = NODE_BASE_B + (tint.b - NODE_BASE_B) * intensity;
  }
}

/**
 * Compute a fresh vertex-colour buffer such that Chladni nodes glow in
 * the weighted-planet blend colour and antinodes stay near the dark-navy
 * sphere base. Consumers pass this array to `BufferAttribute` with
 * `itemSize=3` and enable `vertexColors` on the material.
 *
 * Thin wrapper around {@link writeChladniColorsInto}.
 *
 * @param positions  position buffer (count × 3, origin-centred)
 * @param weights    per-planet amplitudes
 * @param time       monotonic ms — same argument as `chladniDisplacement`
 *                   so colours stay in phase with geometry displacement
 * @returns          colour buffer matching `positions` length
 */
export function computeChladniVertexColors(
  positions: ArrayLike<number>,
  weights: Readonly<Partial<Record<PlanetName, number>>>,
  time: number,
): Float32Array {
  const out = new Float32Array(positions.length);
  writeChladniColorsInto(out, positions, weights, time);
  return out;
}

/**
 * In-place variant of {@link computeChladniVertexColors}. Reuses a caller-
 * supplied colour buffer so the GPU upload can be throttled to the same
 * schedule as position updates.
 */
export function writeChladniVertexColors(
  target: Float32Array,
  positions: ArrayLike<number>,
  weights: Readonly<Partial<Record<PlanetName, number>>>,
  time: number,
): void {
  writeChladniColorsInto(target, positions, weights, time);
}

/**
 * Six axes used by `getPolePositions`. Each axis is unit-length.
 * Cardinal axes produce orthogonal poles; the three diagonals fill the
 * remaining octants symmetrically. Order matters: the output of
 * `getPolePositions` is `[+ax0, -ax0, +ax1, -ax1, …, +ax5, -ax5]`.
 */
const AXES: readonly PolePoint[] = (() => {
  const invSqrt2 = 1 / Math.sqrt(2);
  return [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: invSqrt2, y: invSqrt2, z: 0 },
    { x: invSqrt2, y: 0, z: invSqrt2 },
    { x: 0, y: invSqrt2, z: invSqrt2 },
  ] as const;
})();

/** Offset factor that pushes poles slightly outside the sphere surface. */
const POLE_RADIUS_FACTOR = 1.15;

/**
 * Twelve poles at six opposing-pair axes on a sphere of given radius.
 * Each axis yields two antipodal poles at `±radius · 1.15`.
 * Order: `[+ax0, -ax0, +ax1, -ax1, +ax2, -ax2, +ax3, -ax3, +ax4, -ax4, +ax5, -ax5]`.
 *
 * @param radius — sphere radius
 * @returns exactly 12 points, deterministic order
 */
export function getPolePositions(radius: number): readonly PolePoint[] {
  const offset = radius * POLE_RADIUS_FACTOR;
  const poles: PolePoint[] = [];
  for (const axis of AXES) {
    poles.push({ x: axis.x * offset, y: axis.y * offset, z: axis.z * offset });
    poles.push({ x: -axis.x * offset, y: -axis.y * offset, z: -axis.z * offset });
  }
  return poles;
}

/**
 * Pair each pole with its antipodal partner.
 * Derived from the `[+ax, -ax]` structure of `getPolePositions`, so each
 * pair is `[poles[2k], poles[2k+1]]` for k = 0..5.
 *
 * @param radius — sphere radius
 * @returns six `[poleA, poleB]` tuples covering all 12 poles exactly once
 */
export function getPolePairs(radius: number): readonly [PolePoint, PolePoint][] {
  const poles = getPolePositions(radius);
  const pairs: [PolePoint, PolePoint][] = [];
  for (let k = 0; k < poles.length; k += 2) {
    pairs.push([poles[k], poles[k + 1]]);
  }
  return pairs;
}

/**
 * Generate a series of points along a great-circle-like curve between two
 * poles, with a radial cymatic ripple superimposed. Used by H4 to build
 * tube-geometry trails on the sphere.
 *
 * The path linearly interpolates between `from` and `to`, re-projects each
 * sample onto the sphere surface (radius), then adds a radial ripple
 * `ripple · sin(t · π · frequency + time · 1e-3 · frequency/2)`.
 *
 * @param from      start pole
 * @param to        end pole
 * @param radius    sphere radius onto which samples are projected
 * @param ripple    amplitude of radial perturbation (e.g. `0.04 * weight`)
 * @param frequency number of ripple oscillations along the path
 * @param steps     number of segments; returns `steps + 1` points. Defaults to 48.
 * @param time      monotonic ms (for animated ripple phase)
 * @returns         `steps + 1` PolePoints
 */
export function buildTrailPath(
  from: PolePoint,
  to: PolePoint,
  radius: number,
  ripple: number,
  frequency: number,
  steps: number | undefined,
  time: number,
): readonly PolePoint[] {
  const n = steps ?? 48;
  const out: PolePoint[] = [];

  for (let s = 0; s <= n; s++) {
    const t = s / n;
    // lerp
    const lx = from.x + (to.x - from.x) * t;
    const ly = from.y + (to.y - from.y) * t;
    const lz = from.z + (to.z - from.z) * t;

    // normalize & scale to sphere surface (with tiny epsilon to stay stable
    // when endpoints happen to be antipodal and t is exactly 0.5 — the lerp
    // then hits the origin. We fall back to the `from` direction in that
    // degenerate case.)
    const len = Math.sqrt(lx * lx + ly * ly + lz * lz);
    let nx: number;
    let ny: number;
    let nz: number;
    if (len < 1e-9) {
      const fromLen = Math.sqrt(from.x * from.x + from.y * from.y + from.z * from.z) || 1;
      nx = from.x / fromLen;
      ny = from.y / fromLen;
      nz = from.z / fromLen;
    } else {
      nx = lx / len;
      ny = ly / len;
      nz = lz / len;
    }

    const rippleOffset =
      ripple * Math.sin(t * Math.PI * frequency + time * 0.001 * (frequency / 2));
    const effectiveRadius = radius + rippleOffset;

    out.push({
      x: nx * effectiveRadius,
      y: ny * effectiveRadius,
      z: nz * effectiveRadius,
    });
  }

  return out;
}
