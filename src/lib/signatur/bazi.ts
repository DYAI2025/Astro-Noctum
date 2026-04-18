import { SECTOR_COUNT, ANIMAL_TO_SECTOR } from './constants';
import { gaussBell } from './math';

/**
 * B(s) = 0.40 · δ(s, day) + 0.25 · δ(s, year) + 0.20 · δ(s, month) + 0.15 · δ(s, hour)
 */
export function baziToSectors(pillars: {
  day?: string;
  year?: string;
  month?: string;
  hour?: string;
}): number[] {
  const B = new Array(SECTOR_COUNT).fill(0);

  const weights = [
    { animal: pillars.day,   w: 0.40 },
    { animal: pillars.year,  w: 0.25 },
    { animal: pillars.month, w: 0.20 },
    { animal: pillars.hour,  w: 0.15 },
  ];

  for (let s = 0; s < SECTOR_COUNT; s++) {
    let val = 0;
    for (const { animal, w } of weights) {
      if (!animal) continue;
      const sectorIdx = ANIMAL_TO_SECTOR[animal.toLowerCase()];
      if (sectorIdx !== undefined) {
        val += w * gaussBell(s, sectorIdx);
      }
    }
    B[s] = val;
  }

  return B;
}
