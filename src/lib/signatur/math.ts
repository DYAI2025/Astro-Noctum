import { SECTOR_COUNT, SIGMA } from './constants';

/**
 * Zirkuläre Distanz zwischen zwei Sektoren.
 * d(s,p) = min(|s-p|, 12-|s-p|)
 */
export function circularDistance(s: number, p: number): number {
  const diff = Math.abs(s - p);
  return Math.min(diff, SECTOR_COUNT - diff);
}

/**
 * Gauss-Glocke: δ(s, p) = exp(-d(s,p)² / (2σ²))
 * σ = 1.2 → Nachbar-Sektoren bekommen ~0.71, übernächste ~0.25
 */
export function gaussBell(s: number, placement: number, sigma: number = SIGMA): number {
  const d = circularDistance(s, placement);
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * Power-Curve: sign(x) · |x|^1.5
 * Schwache Signale bleiben subtil, starke brechen dramatisch aus.
 */
export function powerCurve(signal: number, exponent: number = 1.5): number {
  return Math.sign(signal) * Math.pow(Math.abs(signal), exponent);
}
