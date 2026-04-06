/**
 * Day Harmonic State — derived from FuFirE harmony_index.
 * Lives in lib/ (not components/) so hooks can import it without coupling to canvas code.
 */

export interface DayHarmonicState {
  /** 0–1 — cosine similarity between Wu-Xing vectors (Western + BaZi) */
  harmonyIndex: number;
  /** pulse: H < 0.50 (calm, symmetric); trace: H >= 0.50 (crossing, something happens) */
  mode: 'pulse' | 'trace';
  /** |H - 0.45| / 0.55, normalized [0,1] — distance from random baseline */
  intensity: number;
}

const HARMONY_RANDOM_BASELINE = 0.45;
const HARMONY_RANGE = 0.55; // 1.0 - baseline

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Derive DayHarmonicState from the harmony_index returned by the Experience API.
 */
export function computeDayHarmonic(harmonyIndex: number): DayHarmonicState {
  const h = clamp(harmonyIndex, 0, 1);
  const mode: 'pulse' | 'trace' = h >= 0.50 ? 'trace' : 'pulse';
  const intensity = clamp(Math.abs(h - HARMONY_RANDOM_BASELINE) / HARMONY_RANGE, 0, 1);
  return { harmonyIndex: h, mode, intensity };
}

/**
 * Same formula as computeDayHarmonic but intensity capped at 50%.
 * REQ: Night-Pulse/Trace visual = same trail persistence ±% as day, 50% intensity ceiling.
 */
export function computeNightHarmonic(nightHarmonyIndex: number): DayHarmonicState {
  const base = computeDayHarmonic(nightHarmonyIndex);
  return { ...base, intensity: base.intensity * 0.5 };
}

/** Returns true when the local clock is in the night window (21:00–06:00). */
export function isNighttime(now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 21 || hour < 6;
}
