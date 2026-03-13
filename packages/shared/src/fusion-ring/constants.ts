export const SECTOR_COUNT = 12;

export const SECTORS = [
  { idx: 0, sign: "aries", opp: 6 },
  { idx: 1, sign: "taurus", opp: 7 },
  { idx: 2, sign: "gemini", opp: 8 },
  { idx: 3, sign: "cancer", opp: 9 },
  { idx: 4, sign: "leo", opp: 10 },
  { idx: 5, sign: "virgo", opp: 11 },
  { idx: 6, sign: "libra", opp: 0 },
  { idx: 7, sign: "scorpio", opp: 1 },
  { idx: 8, sign: "sagittarius", opp: 2 },
  { idx: 9, sign: "capricorn", opp: 3 },
  { idx: 10, sign: "aquarius", opp: 4 },
  { idx: 11, sign: "pisces", opp: 5 }
] as const;

export const OPPOSITION_FACTOR = 0.15;
export const NEIGHBOR_PULL = 0.35;
