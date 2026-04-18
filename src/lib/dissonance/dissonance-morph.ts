import { lerp, clamp } from '../utils/math';
import type { VisualModulation } from './dissonance-visual';

export interface MorphState {
  /** Current interpolated modulation */
  current: VisualModulation;
  /** Is morph still in progress */
  active: boolean;
  /** 0–1 progress */
  progress: number;
}

export function lerpModulation(a: VisualModulation, b: VisualModulation, t: number): VisualModulation {
  return {
    geometrySkew: lerp(a.geometrySkew, b.geometrySkew, t),
    penDistanceShift: lerp(a.penDistanceShift, b.penDistanceShift, t),
    fractalBoost: lerp(a.fractalBoost, b.fractalBoost, t),
    emergenceBoost: lerp(a.emergenceBoost, b.emergenceBoost, t),
    tierPressure: lerp(a.tierPressure, b.tierPressure, t),
    vibrationAmplitude: lerp(a.vibrationAmplitude, b.vibrationAmplitude, t),
    vibrationStyle: t < 0.5 ? a.vibrationStyle : b.vibrationStyle,
    colorTempShift: lerp(a.colorTempShift, b.colorTempShift, t),
    flickerRate: lerp(a.flickerRate, b.flickerRate, t),
  };
}

/** Easing based on dissonance type */
export function dissonanceEase(t: number, style: 'organic' | 'angular' | 'neutral'): number {
  switch (style) {
    case 'angular':
      // Sharp attack, slow decay (crystalline ke tension)
      return t < 0.3 ? t / 0.3 : 1 - (1 - t) * (1 - t) * (1 - t);
    case 'organic':
      // Smooth S-curve (flowing sheng energy)
      return t * t * (3 - 2 * t);
    default:
      // Standard ease-out
      return 1 - (1 - t) * (1 - t);
  }
}

/** Duration in ms based on intensity: 800ms (calm) → 2500ms (extreme) */
export function morphDuration(intensity: number): number {
  return lerp(800, 2500, clamp(intensity, 0, 1));
}
