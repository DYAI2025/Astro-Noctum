export type DayMode = 'pulse' | 'trace' | 'spannung';

/**
 * Maps harmony index H ∈ [0,1] to a day mode and intensity.
 *
 * Thresholds from PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md §6:
 *   H < 0.45  → spannung
 *   H < 0.50  → pulse
 *   H ≥ 0.50  → trace
 *
 * Intensity = |H - 0.45| / 0.55, clamped to [0,1].
 */
export function dayModeFromHarmony(h: number): { mode: DayMode; intensity: number } {
  const clampedH = Math.max(0, Math.min(1, h));
  const mode: DayMode = clampedH < 0.45 ? 'spannung' : clampedH < 0.50 ? 'pulse' : 'trace';
  // Use raw h so extreme out-of-range values max out at 1 rather than a mid-range value
  const intensity = Math.max(0, Math.min(1, Math.abs(h - 0.45) / 0.55));
  return { mode, intensity };
}
