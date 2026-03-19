// src/lib/space-weather/solar-pressure.ts
// Computes a 0-1 "solar pressure score" from live NOAA/DONKI data.

/**
 * Solar Pressure Score -- combines Kp, X-ray, and Proton flux into a 0-1 value.
 * Weights: 0.5*Kp + 0.25*Xray + 0.15*Proton + 0.1*baseline
 */
export function computeSolarPressureScore(
  kp: number,
  xrayFlux: number,
  protonFlux: number,
): number {
  // Normalize Kp to 0-1 (Kp 0 = 0, Kp 9 = 1)
  const kpNorm = Math.max(0, Math.min(1, kp / 9));

  // Normalize X-ray flux (logarithmic scale)
  // A-class (1e-8) -> 0, X-class (1e-4) -> 1
  const xrayNorm = xrayFlux > 0
    ? Math.max(0, Math.min(1, (Math.log10(xrayFlux) + 8) / 4))
    : 0;

  // Normalize proton flux (logarithmic)
  // 0.1 pfu -> 0, 1000 pfu -> 1
  const protonNorm = protonFlux > 0
    ? Math.max(0, Math.min(1, (Math.log10(protonFlux) + 1) / 4))
    : 0;

  // Weighted blend
  const score = 0.5 * kpNorm + 0.25 * xrayNorm + 0.15 * protonNorm + 0.1 * (kpNorm > 0.5 ? 1 : 0);

  return Math.max(0, Math.min(1, score));
}

/**
 * Ring modulation factor from solar pressure and event weights.
 * Result: 1.0 (calm) to 1.5 (extreme storm)
 * Formula: 1 + solarPressure * 0.2 + eventWeight * 0.3, capped at 1.5
 */
export function computeRingModulation(
  solarPressure: number,
  maxEventWeight: number,
): number {
  const raw = 1 + solarPressure * 0.2 + maxEventWeight * 0.3;
  return Math.min(1.5, Math.max(1.0, raw));
}

/**
 * Maps Kp to visual trigger thresholds for the ring.
 * G1 (Kp 5) -> +10%, G3 (Kp 7) -> +25%, G5 (Kp 9) -> +50% + visual effect
 */
export function kpToVisualIntensity(kp: number): {
  intensityBoost: number;
  triggerEffect: boolean;
  gScale: string;
} {
  if (kp >= 9) return { intensityBoost: 0.50, triggerEffect: true, gScale: 'G5' };
  if (kp >= 8) return { intensityBoost: 0.40, triggerEffect: true, gScale: 'G4' };
  if (kp >= 7) return { intensityBoost: 0.25, triggerEffect: true, gScale: 'G3' };
  if (kp >= 6) return { intensityBoost: 0.15, triggerEffect: false, gScale: 'G2' };
  if (kp >= 5) return { intensityBoost: 0.10, triggerEffect: false, gScale: 'G1' };
  return { intensityBoost: 0, triggerEffect: false, gScale: 'G0' };
}
