import { SECTOR_COUNT, SIGN_TO_SECTOR } from './constants';
import { gaussBell } from './math';

/**
 * W(s) = 0.50 · δ(s, sun) + 0.30 · δ(s, moon) + 0.20 · δ(s, asc)
 */
export function westernToSectors(
  sunSign?: string,
  moonSign?: string,
  ascSign?: string,
): number[] {
  const W = new Array(SECTOR_COUNT).fill(0);

  const sunIdx = sunSign ? SIGN_TO_SECTOR[sunSign.toLowerCase()] : undefined;
  const moonIdx = moonSign ? SIGN_TO_SECTOR[moonSign.toLowerCase()] : undefined;
  const ascIdx = ascSign ? SIGN_TO_SECTOR[ascSign.toLowerCase()] : undefined;

  for (let s = 0; s < SECTOR_COUNT; s++) {
    let val = 0;
    if (sunIdx !== undefined)  val += 0.50 * gaussBell(s, sunIdx);
    if (moonIdx !== undefined) val += 0.30 * gaussBell(s, moonIdx);
    if (ascIdx !== undefined)  val += 0.20 * gaussBell(s, ascIdx);
    W[s] = val;
  }

  return W;
}
