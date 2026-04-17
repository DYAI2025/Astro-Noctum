/**
 * Cymatic / Chladni figure mathematics
 * Models superimposed standing waves on a spherical membrane
 * Each planet contributes a frequency component
 * The interference pattern creates the emergent signature geometry
 */

import * as THREE from "three";
import { PLANETS, type Planet } from "./planetaryFrequencies";

export interface SignatureParams {
  weights: number[];
  time: number;
  resolution: number;
  radius: number;
}

/**
 * Chladni-like displacement on a sphere surface
 * Uses spherical standing wave superposition
 * f(θ, φ) = Σ w_i · sin(n_i·θ) · cos(m_i·φ + phase_i·t)
 */
export function chladniDisplacement(
  theta: number,  // polar angle 0..π
  phi: number,    // azimuthal angle 0..2π
  params: SignatureParams
): number {
  let value = 0;
  const { weights, time } = params;

  for (let i = 0; i < PLANETS.length; i++) {
    const planet = PLANETS[i];
    const w = weights[i];
    // Frequency ratios — integer-like for Chladni resonance
    const n = 2 + (planet.dimension * 2);  // 2,4,6,8,10,12
    const m = 1 + planet.poleIndex % 6;    // 1..6
    const phase = (planet.baseFrequency / 100.0) * time * 0.001;
    const drift = Math.sin(time * 0.00023 * (i + 1)) * 0.3;

    value += w * Math.sin(n * theta + drift) * Math.cos(m * phi + phase);
  }

  return value / PLANETS.length;
}

/**
 * Generate the geometry for the cymatic signature sphere
 * Returns a BufferGeometry with displacement-mapped sphere
 */
export function buildSignatureGeometry(
  params: SignatureParams
): THREE.BufferGeometry {
  const { resolution, radius } = params;
  const geo = new THREE.SphereGeometry(radius, resolution, resolution);
  const pos = geo.attributes.position;
  const originalPos = pos.array.slice() as Float32Array;

  const amplitudeBase = radius * 0.18;

  for (let i = 0; i < pos.count; i++) {
    const x = originalPos[i * 3];
    const y = originalPos[i * 3 + 1];
    const z = originalPos[i * 3 + 2];

    const r = Math.sqrt(x * x + y * y + z * z);
    const theta = Math.acos(y / r);
    const phi = Math.atan2(z, x);

    const disp = chladniDisplacement(theta, phi, params);
    const scale = 1 + disp * (amplitudeBase / radius);

    (pos.array as Float32Array)[i * 3] = x * scale;
    (pos.array as Float32Array)[i * 3 + 1] = y * scale;
    (pos.array as Float32Array)[i * 3 + 2] = z * scale;
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generate pole positions — 12 poles at opposing pairs
 * Each pair lies on a great circle axis
 */
export function getPolePositions(radius: number): THREE.Vector3[] {
  const poles: THREE.Vector3[] = [];

  // 6 axes → 12 poles
  const axes = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 1, 0).normalize(),
    new THREE.Vector3(1, 0, 1).normalize(),
    new THREE.Vector3(0, 1, 1).normalize(),
  ];

  for (const axis of axes) {
    poles.push(axis.clone().multiplyScalar(radius * 1.15));
    poles.push(axis.clone().multiplyScalar(-radius * 1.15));
  }

  return poles;
}

/**
 * Generate trail paths — geodesic curves connecting adjacent poles
 * These form the emergent Chladni-line skeleton
 */
export function buildTrailGeometry(
  radius: number,
  weights: number[],
  time: number
): THREE.BufferGeometry[] {
  const poles = getPolePositions(radius);
  const geometries: THREE.BufferGeometry[] = [];

  // Connect each pole to its 3 nearest neighbors
  for (let i = 0; i < poles.length; i++) {
    const planet = PLANETS[i % PLANETS.length];
    const w = weights[i % weights.length];
    if (w < 0.35) continue; // only show significant connections

    const target = poles[(i + 6) % poles.length]; // opposing pole
    const points: THREE.Vector3[] = [];
    const steps = 48;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // Slerp along great circle
      const p = new THREE.Vector3().lerpVectors(poles[i], target, t).normalize();
      // Add cymatic ripple along the path
      const ripple = Math.sin(t * Math.PI * (2 + planet.poleIndex % 4) + time * 0.001 * (planet.baseFrequency / 100)) * 0.04 * w;
      p.multiplyScalar(radius * (1.02 + ripple));
      points.push(p);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, steps, 0.004 * radius, 4, false);
    geometries.push(tubeGeo);
  }

  return geometries;
}
