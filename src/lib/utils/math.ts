/**
 * Generic math utilities.
 * Extracted from legacy bazodiac-engine.ts in phase F4a.
 */

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
