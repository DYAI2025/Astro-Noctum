/**
 * wuxingToSoulprint — derive 12 soulprint sectors from Wu-Xing element scores.
 *
 * Maps 5 elements (Wood/Fire/Earth/Metal/Water) → 12 zodiac sectors using
 * traditional element-sign affinity. Sector values are normalised, jitter-smoothed,
 * and floored at 0.05 to avoid invisible sectors on the Signatur ring.
 *
 * sectorMap index → element index:
 *   [1,2,2,4, 1,2,3,4, 1,2,3,4]
 *   0=Wood, 1=Fire, 2=Earth, 3=Metal, 4=Water
 */
export function wuxingToSoulprint(elements: {
  Wood?: number; Fire?: number; Earth?: number; Metal?: number; Water?: number;
}): number[] {
  const e = [
    Number(elements.Wood  || 0),   // 0 Wood
    Number(elements.Fire  || 0),   // 1 Fire
    Number(elements.Earth || 0),   // 2 Earth
    Number(elements.Metal || 0),   // 3 Metal
    Number(elements.Water || 0),   // 4 Water
  ];
  const total = e.reduce((s, v) => s + v, 0) || 1;
  const sectorMap = [1, 2, 2, 4, 1, 2, 3, 4, 1, 2, 3, 4];
  return sectorMap.map((elIdx, i) => {
    const base = e[elIdx] / total;
    const jitter = 0.05 * Math.sin(i * 2.7);
    return Math.max(0.05, base + jitter);
  });
}
