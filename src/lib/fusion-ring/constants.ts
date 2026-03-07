/** 12 Sektoren, je 30°, astrologische Haus-Logik */
export const SECTOR_COUNT = 12;

export const SECTORS = [
  { idx: 0,  sign: 'aries',       label_de: 'Widder',      element: 'wood',  opp: 6  },
  { idx: 1,  sign: 'taurus',      label_de: 'Stier',       element: 'earth', opp: 7  },
  { idx: 2,  sign: 'gemini',      label_de: 'Zwillinge',   element: 'fire',  opp: 8  },
  { idx: 3,  sign: 'cancer',      label_de: 'Krebs',       element: 'fire',  opp: 9  },
  { idx: 4,  sign: 'leo',         label_de: 'Löwe',        element: 'fire',  opp: 10, element2: 'earth' },
  { idx: 5,  sign: 'virgo',       label_de: 'Jungfrau',    element: 'metal', opp: 11 },
  { idx: 6,  sign: 'libra',       label_de: 'Waage',       element: 'metal', opp: 0  },
  { idx: 7,  sign: 'scorpio',     label_de: 'Skorpion',    element: 'water', opp: 1  },
  { idx: 8,  sign: 'sagittarius', label_de: 'Schütze',     element: 'water', opp: 2  },
  { idx: 9,  sign: 'capricorn',   label_de: 'Steinbock',   element: 'water', opp: 3  },
  { idx: 10, sign: 'aquarius',    label_de: 'Wassermann',  element: 'earth', opp: 4  },
  { idx: 11, sign: 'pisces',      label_de: 'Fische',      element: 'wood',  opp: 5, element2: 'water' },
] as const;

export const SIGN_TO_SECTOR: Record<string, number> = Object.fromEntries(
  SECTORS.map(s => [s.sign, s.idx])
);

/** BaZi Earthly Branch (Tier) → Sektor-Index */
export const ANIMAL_TO_SECTOR: Record<string, number> = {
  tiger: 0,  hase: 0,  rabbit: 0,
  dragon: 1,
  snake: 2,
  horse: 3,
  goat: 4,   sheep: 4, ziege: 4,
  monkey: 5,
  rooster: 6, hahn: 6,
  dog: 7,    hund: 7,
  pig: 8,    schwein: 8,
  rat: 9,    ratte: 9,
  ox: 10,    büffel: 10, buffalo: 10,
};

/** Gauss-Glocke Sigma (Breite in Sektoren) */
export const SIGMA = 1.2;

/** Oppositions-Tension Faktor */
export const OPPOSITION_FACTOR = 0.15;

/** Neighbor-Coupling Stärke */
export const NEIGHBOR_PULL = 0.35;
