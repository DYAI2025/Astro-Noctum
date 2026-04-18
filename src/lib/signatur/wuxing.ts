import { SECTOR_COUNT, SECTORS } from './constants';

/**
 * X(s) = wuxing_vector[element(s)] / max(wuxing_vector)
 */
export function wuxingToSectors(
  wuxingVector: Record<string, number>,
): number[] {
  const X = new Array(SECTOR_COUNT).fill(0);

  const maxVal = Math.max(...Object.values(wuxingVector), 0.01);

  for (let s = 0; s < SECTOR_COUNT; s++) {
    const sector = SECTORS[s];
    const primary = wuxingVector[sector.element] ?? 0;

    if ('element2' in sector && sector.element2) {
      const secondary = wuxingVector[sector.element2] ?? 0;
      X[s] = ((primary + secondary) / 2) / maxVal;
    } else {
      X[s] = primary / maxVal;
    }
  }

  return X;
}
