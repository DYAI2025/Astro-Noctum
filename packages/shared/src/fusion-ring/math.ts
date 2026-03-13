import { SECTOR_COUNT } from "./constants";

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function applyPowerCurve(value: number, exponent = 1.5): number {
  return Math.sign(value) * Math.pow(Math.abs(value), exponent);
}

export function circularDistance(source: number, target: number): number {
  const diff = Math.abs(source - target);
  return Math.min(diff, SECTOR_COUNT - diff);
}

export function gaussBell(source: number, target: number, sigma = 1.2): number {
  const distance = circularDistance(source, target);
  return Math.exp(-(distance * distance) / (2 * sigma * sigma));
}

export function applyGaussSpread(sectors: number[], sigma = 1.2): number[] {
  const out = new Array(SECTOR_COUNT).fill(0);
  for (let target = 0; target < SECTOR_COUNT; target += 1) {
    let acc = 0;
    for (let source = 0; source < SECTOR_COUNT; source += 1) {
      acc += (sectors[source] ?? 0) * gaussBell(source, target, sigma);
    }
    out[target] = acc;
  }
  return out;
}
