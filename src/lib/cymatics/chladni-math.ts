import type { ChladniParams } from './bazi-to-chladni';

/**
 * Chladni equation — amplitude at point (x, y) on unit square [0,1]×[0,1].
 *
 * f(x,y) = a·sin(π·n·x)·sin(π·m·y) + b·sin(π·m·x)·sin(π·n·y)
 *
 * Nodal lines are where f(x,y) ≈ 0 — particles settle at these locations,
 * forming the characteristic Chladni figure.
 */
export function chladni(
  x: number,
  y: number,
  a: number,
  b: number,
  m: number,
  n: number,
): number {
  return (
    a * Math.sin(Math.PI * n * x) * Math.sin(Math.PI * m * y) +
    b * Math.sin(Math.PI * m * x) * Math.sin(Math.PI * n * y)
  );
}

/**
 * Interpolate between two ChladniParams for smooth morphing.
 * - a, b, harmonyIndex: continuous lerp
 * - m, n, dominantElement: discrete — snap at t >= 0.5 to avoid fractional node counts
 */
export function lerpParams(from: ChladniParams, to: ChladniParams, t: number): ChladniParams {
  const tc = Math.max(0, Math.min(1, t));
  return {
    m: tc < 0.5 ? from.m : to.m,
    n: tc < 0.5 ? from.n : to.n,
    a: from.a + (to.a - from.a) * tc,
    b: from.b + (to.b - from.b) * tc,
    dominantElement: tc < 0.5 ? from.dominantElement : to.dominantElement,
    harmonyIndex: from.harmonyIndex + (to.harmonyIndex - from.harmonyIndex) * tc,
  };
}
