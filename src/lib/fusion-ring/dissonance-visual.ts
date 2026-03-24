import { clamp, lerp } from '../../components/fusion-ring-website/bazodiac-engine';
import type { DissonanceResult } from './dissonance';

export interface VisualModulation {
  // ── Layer 1: Geometry (d_natal) ──
  /** 0–1: How much to skew spirograph symmetry. 0 = perfect symmetry. */
  geometrySkew: number;
  /** Additive offset to spirograph pen distance (d param) */
  penDistanceShift: number;

  // ── Layer 2: Complexity (d_accumulated) ──
  /** 0–1: Boost to fractal depth (added to weight-based fractalDepth) */
  fractalBoost: number;
  /** 0–1: Emergence bridge activation boost */
  emergenceBoost: number;
  /** Tier shift: 0 = no change, 1 = push more planets into higher tiers */
  tierPressure: number;

  // ── Layer 3: Texture (d_elemental) ──
  /** 0–1: Particle vibration amplitude */
  vibrationAmplitude: number;
  /** 'organic' = smooth sinusoidal, 'angular' = sharp sawtooth, 'neutral' = none */
  vibrationStyle: 'organic' | 'angular' | 'neutral';
  /** Color temperature shift: -1 = cool (ke), 0 = neutral, +1 = warm (sheng) */
  colorTempShift: number;
  /** 0–1: Particle flicker rate (ke = high, sheng = low) */
  flickerRate: number;
}

/** Neutral modulation — no visual effect */
export const NEUTRAL_MODULATION: VisualModulation = {
  geometrySkew: 0,
  penDistanceShift: 0,
  fractalBoost: 0,
  emergenceBoost: 0,
  tierPressure: 0,
  vibrationAmplitude: 0,
  vibrationStyle: 'neutral',
  colorTempShift: 0,
  flickerRate: 0,
};

export function computeVisualModulation(d: DissonanceResult): VisualModulation {
  // Layer 1: Geometry ← d_natal
  const geometrySkew = clamp(d.d_natal * 0.8, 0, 1);
  const penDistanceShift = lerp(0, 0.4, d.d_natal);

  // Layer 2: Complexity ← d_accumulated
  const fractalBoost = clamp(d.d_accumulated * 0.6, 0, 1);
  const emergenceBoost = clamp(d.d_accumulated * 0.5, 0, 1);
  const tierPressure = clamp(d.d_accumulated * 0.4, 0, 1);

  // Layer 3: Texture ← d_elemental
  const el = d.d_elemental;
  const vibrationAmplitude = clamp(el.magnitude * 0.7, 0, 1);

  let vibrationStyle: 'organic' | 'angular' | 'neutral';
  let colorTempShift: number;
  let flickerRate: number;

  switch (el.type) {
    case 'ke':
      vibrationStyle = 'angular';
      colorTempShift = -el.magnitude; // cool/crystalline
      flickerRate = lerp(0.3, 0.8, el.magnitude);
      break;
    case 'sheng':
      vibrationStyle = 'organic';
      colorTempShift = el.magnitude; // warm/flowing
      flickerRate = lerp(0, 0.2, el.magnitude);
      break;
    default:
      vibrationStyle = 'neutral';
      colorTempShift = 0;
      flickerRate = 0;
  }

  return {
    geometrySkew,
    penDistanceShift,
    fractalBoost,
    emergenceBoost,
    tierPressure,
    vibrationAmplitude,
    vibrationStyle,
    colorTempShift,
    flickerRate,
  };
}
