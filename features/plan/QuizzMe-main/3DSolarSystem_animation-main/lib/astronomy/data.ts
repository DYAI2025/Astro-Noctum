// ═══════════════════════════════════════════════════════════════════════════════
// ASTRONOMICAL DATA
// Stars, planets, cities, and constellation data
// ═══════════════════════════════════════════════════════════════════════════════

import { StarData, PlanetData, CityData, ConstellationLines, ConstellationNames } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// STAR CATALOG — 150 brightest stars with J2000.0 coordinates
// ─────────────────────────────────────────────────────────────────────────────

export const STARS: StarData[] = [
  // Orion
  { name: 'Betelgeuse', ra: 5.919, dec: 7.407, mag: 0.42, con: 'Orion' },
  { name: 'Rigel', ra: 5.242, dec: -8.202, mag: 0.13, con: 'Orion' },
  { name: 'Bellatrix', ra: 5.419, dec: 6.350, mag: 1.64, con: 'Orion' },
  { name: 'Mintaka', ra: 5.533, dec: -0.299, mag: 2.23, con: 'Orion' },
  { name: 'Alnilam', ra: 5.603, dec: -1.202, mag: 1.69, con: 'Orion' },
  { name: 'Alnitak', ra: 5.679, dec: -1.943, mag: 1.77, con: 'Orion' },
  { name: 'Saiph', ra: 5.796, dec: -9.670, mag: 2.06, con: 'Orion' },
  // Ursa Major
  { name: 'Dubhe', ra: 11.062, dec: 61.751, mag: 1.79, con: 'UrsaMajor' },
  { name: 'Merak', ra: 11.031, dec: 56.382, mag: 2.37, con: 'UrsaMajor' },
  { name: 'Phecda', ra: 11.897, dec: 53.695, mag: 2.44, con: 'UrsaMajor' },
  { name: 'Megrez', ra: 12.257, dec: 57.033, mag: 3.31, con: 'UrsaMajor' },
  { name: 'Alioth', ra: 12.900, dec: 55.960, mag: 1.77, con: 'UrsaMajor' },
  { name: 'Mizar', ra: 13.399, dec: 54.925, mag: 2.27, con: 'UrsaMajor' },
  { name: 'Alkaid', ra: 13.792, dec: 49.313, mag: 1.86, con: 'UrsaMajor' },
  // Ursa Minor
  { name: 'Polaris', ra: 2.530, dec: 89.264, mag: 2.02, con: 'UrsaMinor' },
  { name: 'Kochab', ra: 14.845, dec: 74.156, mag: 2.08, con: 'UrsaMinor' },
  { name: 'Pherkad', ra: 15.345, dec: 71.834, mag: 3.05, con: 'UrsaMinor' },
  // Cassiopeia
  { name: 'Schedar', ra: 0.675, dec: 56.537, mag: 2.23, con: 'Cassiopeia' },
  { name: 'Caph', ra: 0.153, dec: 59.150, mag: 2.27, con: 'Cassiopeia' },
  { name: 'Gamma Cas', ra: 0.945, dec: 60.717, mag: 2.47, con: 'Cassiopeia' },
  { name: 'Ruchbah', ra: 1.430, dec: 60.235, mag: 2.68, con: 'Cassiopeia' },
  { name: 'Segin', ra: 1.907, dec: 63.670, mag: 3.38, con: 'Cassiopeia' },
  // Scorpius
  { name: 'Antares', ra: 16.490, dec: -26.432, mag: 0.96, con: 'Scorpius' },
  { name: 'Shaula', ra: 17.560, dec: -37.104, mag: 1.63, con: 'Scorpius' },
  { name: 'Sargas', ra: 17.622, dec: -42.998, mag: 1.87, con: 'Scorpius' },
  { name: 'Dschubba', ra: 16.006, dec: -22.622, mag: 2.32, con: 'Scorpius' },
  { name: 'Graffias', ra: 16.091, dec: -19.806, mag: 2.64, con: 'Scorpius' },
  { name: 'Lesath', ra: 17.530, dec: -37.296, mag: 2.69, con: 'Scorpius' },
  // Leo
  { name: 'Regulus', ra: 10.140, dec: 11.967, mag: 1.35, con: 'Leo' },
  { name: 'Denebola', ra: 11.818, dec: 14.572, mag: 2.14, con: 'Leo' },
  { name: 'Algieba', ra: 10.333, dec: 19.842, mag: 2.28, con: 'Leo' },
  { name: 'Zosma', ra: 11.235, dec: 20.524, mag: 2.56, con: 'Leo' },
  { name: 'Ras Elased', ra: 9.764, dec: 23.774, mag: 2.98, con: 'Leo' },
  // Taurus
  { name: 'Aldebaran', ra: 4.599, dec: 16.509, mag: 0.85, con: 'Taurus' },
  { name: 'Elnath', ra: 5.438, dec: 28.608, mag: 1.65, con: 'Taurus' },
  { name: 'Alcyone', ra: 3.791, dec: 24.105, mag: 2.87, con: 'Taurus' },
  // Gemini
  { name: 'Pollux', ra: 7.755, dec: 28.026, mag: 1.14, con: 'Gemini' },
  { name: 'Castor', ra: 7.577, dec: 31.889, mag: 1.58, con: 'Gemini' },
  { name: 'Alhena', ra: 6.629, dec: 16.399, mag: 1.93, con: 'Gemini' },
  { name: 'Tejat', ra: 6.383, dec: 22.514, mag: 2.88, con: 'Gemini' },
  // Virgo
  { name: 'Spica', ra: 13.420, dec: -11.161, mag: 0.97, con: 'Virgo' },
  { name: 'Porrima', ra: 12.694, dec: -1.449, mag: 2.74, con: 'Virgo' },
  { name: 'Vindemiatrix', ra: 13.036, dec: 10.959, mag: 2.83, con: 'Virgo' },
  // Canis Major
  { name: 'Sirius', ra: 6.752, dec: -16.716, mag: -1.46, con: 'CanisMajor' },
  { name: 'Adhara', ra: 6.977, dec: -28.972, mag: 1.50, con: 'CanisMajor' },
  { name: 'Wezen', ra: 7.140, dec: -26.393, mag: 1.84, con: 'CanisMajor' },
  { name: 'Mirzam', ra: 6.378, dec: -17.956, mag: 1.98, con: 'CanisMajor' },
  // Canis Minor
  { name: 'Procyon', ra: 7.655, dec: 5.225, mag: 0.34, con: 'CanisMinor' },
  // Lyra
  { name: 'Vega', ra: 18.616, dec: 38.784, mag: 0.03, con: 'Lyra' },
  { name: 'Sheliak', ra: 18.835, dec: 33.363, mag: 3.52, con: 'Lyra' },
  { name: 'Sulafat', ra: 18.982, dec: 32.690, mag: 3.24, con: 'Lyra' },
  // Cygnus
  { name: 'Deneb', ra: 20.690, dec: 45.280, mag: 1.25, con: 'Cygnus' },
  { name: 'Sadr', ra: 20.370, dec: 40.257, mag: 2.20, con: 'Cygnus' },
  { name: 'Gienah', ra: 20.770, dec: 33.970, mag: 2.46, con: 'Cygnus' },
  { name: 'Albireo', ra: 19.512, dec: 27.960, mag: 3.18, con: 'Cygnus' },
  // Aquila
  { name: 'Altair', ra: 19.846, dec: 8.868, mag: 0.77, con: 'Aquila' },
  { name: 'Tarazed', ra: 19.771, dec: 10.614, mag: 2.72, con: 'Aquila' },
  // Sagittarius
  { name: 'Kaus Australis', ra: 18.403, dec: -34.385, mag: 1.85, con: 'Sagittarius' },
  { name: 'Nunki', ra: 18.921, dec: -26.297, mag: 2.02, con: 'Sagittarius' },
  { name: 'Ascella', ra: 19.043, dec: -29.880, mag: 2.59, con: 'Sagittarius' },
  { name: 'Kaus Media', ra: 18.350, dec: -29.828, mag: 2.70, con: 'Sagittarius' },
  { name: 'Kaus Borealis', ra: 18.466, dec: -25.422, mag: 2.81, con: 'Sagittarius' },
  // Capricornus
  { name: 'Deneb Algedi', ra: 21.784, dec: -16.127, mag: 2.87, con: 'Capricornus' },
  { name: 'Dabih', ra: 20.350, dec: -14.781, mag: 3.08, con: 'Capricornus' },
  // Aquarius
  { name: 'Sadalsuud', ra: 21.526, dec: -5.571, mag: 2.91, con: 'Aquarius' },
  { name: 'Sadalmelik', ra: 22.096, dec: -0.320, mag: 2.96, con: 'Aquarius' },
  // Pisces
  { name: 'Eta Piscium', ra: 1.525, dec: 15.346, mag: 3.62, con: 'Pisces' },
  // Aries
  { name: 'Hamal', ra: 2.120, dec: 23.463, mag: 2.00, con: 'Aries' },
  { name: 'Sheratan', ra: 1.911, dec: 20.808, mag: 2.64, con: 'Aries' },
  // Cancer
  { name: 'Acubens', ra: 8.975, dec: 11.858, mag: 4.25, con: 'Cancer' },
  { name: 'Asellus Australis', ra: 8.745, dec: 18.154, mag: 3.94, con: 'Cancer' },
  // Libra
  { name: 'Zubeneschamali', ra: 15.283, dec: -9.383, mag: 2.61, con: 'Libra' },
  { name: 'Zubenelgenubi', ra: 14.848, dec: -16.042, mag: 2.75, con: 'Libra' },
  // Crux
  { name: 'Acrux', ra: 12.443, dec: -63.099, mag: 0.76, con: 'Crux' },
  { name: 'Mimosa', ra: 12.795, dec: -59.689, mag: 1.30, con: 'Crux' },
  { name: 'Gacrux', ra: 12.519, dec: -57.113, mag: 1.64, con: 'Crux' },
  // Centaurus
  { name: 'Alpha Centauri', ra: 14.660, dec: -60.835, mag: -0.27, con: 'Centaurus' },
  { name: 'Hadar', ra: 14.064, dec: -60.373, mag: 0.61, con: 'Centaurus' },
  // Bootes
  { name: 'Arcturus', ra: 14.261, dec: 19.182, mag: -0.05, con: 'Bootes' },
  { name: 'Izar', ra: 14.750, dec: 27.074, mag: 2.70, con: 'Bootes' },
  // Pegasus
  { name: 'Enif', ra: 21.736, dec: 9.875, mag: 2.39, con: 'Pegasus' },
  { name: 'Scheat', ra: 23.063, dec: 28.083, mag: 2.42, con: 'Pegasus' },
  { name: 'Markab', ra: 23.079, dec: 15.205, mag: 2.49, con: 'Pegasus' },
  { name: 'Algenib', ra: 0.220, dec: 15.183, mag: 2.83, con: 'Pegasus' },
  // Andromeda
  { name: 'Alpheratz', ra: 0.140, dec: 29.091, mag: 2.06, con: 'Andromeda' },
  { name: 'Mirach', ra: 1.163, dec: 35.621, mag: 2.05, con: 'Andromeda' },
  { name: 'Almach', ra: 2.065, dec: 42.330, mag: 2.17, con: 'Andromeda' },
  // Perseus
  { name: 'Mirfak', ra: 3.405, dec: 49.861, mag: 1.79, con: 'Perseus' },
  { name: 'Algol', ra: 3.136, dec: 40.956, mag: 2.12, con: 'Perseus' },
  // Auriga
  { name: 'Capella', ra: 5.278, dec: 45.998, mag: 0.08, con: 'Auriga' },
  { name: 'Menkalinan', ra: 5.992, dec: 44.948, mag: 1.90, con: 'Auriga' },
  // Ophiuchus
  { name: 'Rasalhague', ra: 17.582, dec: 12.560, mag: 2.07, con: 'Ophiuchus' },
  { name: 'Sabik', ra: 17.173, dec: -15.725, mag: 2.43, con: 'Ophiuchus' },
  // Eridanus
  { name: 'Achernar', ra: 1.629, dec: -57.237, mag: 0.46, con: 'Eridanus' },
  // Carina
  { name: 'Canopus', ra: 6.399, dec: -52.696, mag: -0.74, con: 'Carina' },
  // Others
  { name: 'Fomalhaut', ra: 22.961, dec: -29.622, mag: 1.16, con: 'PiscisAustrinus' },
  { name: 'Alnair', ra: 22.137, dec: -46.961, mag: 1.74, con: 'Grus' },
  { name: 'Peacock', ra: 20.428, dec: -56.735, mag: 1.94, con: 'Pavo' },
  // Draco
  { name: 'Eltanin', ra: 17.943, dec: 51.489, mag: 2.23, con: 'Draco' },
  { name: 'Rastaban', ra: 17.507, dec: 52.301, mag: 2.79, con: 'Draco' },
  // Hercules
  { name: 'Kornephoros', ra: 16.504, dec: 21.490, mag: 2.77, con: 'Hercules' },
  { name: 'Rasalgethi', ra: 17.244, dec: 14.390, mag: 3.37, con: 'Hercules' },
  // Corona Borealis
  { name: 'Alphecca', ra: 15.578, dec: 26.715, mag: 2.23, con: 'CoronaBorealis' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTELLATION LINES
// ─────────────────────────────────────────────────────────────────────────────

export const CONSTELLATION_LINES: ConstellationLines = {
  Orion: [['Betelgeuse','Bellatrix'],['Bellatrix','Mintaka'],['Mintaka','Alnilam'],['Alnilam','Alnitak'],['Alnitak','Saiph'],['Saiph','Rigel'],['Rigel','Mintaka'],['Betelgeuse','Alnitak']],
  UrsaMajor: [['Dubhe','Merak'],['Merak','Phecda'],['Phecda','Megrez'],['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid'],['Megrez','Dubhe']],
  UrsaMinor: [['Polaris','Kochab'],['Kochab','Pherkad']],
  Cassiopeia: [['Caph','Schedar'],['Schedar','Gamma Cas'],['Gamma Cas','Ruchbah'],['Ruchbah','Segin']],
  Scorpius: [['Graffias','Dschubba'],['Dschubba','Antares'],['Antares','Sargas'],['Sargas','Shaula'],['Shaula','Lesath']],
  Leo: [['Regulus','Algieba'],['Algieba','Zosma'],['Zosma','Denebola'],['Algieba','Ras Elased']],
  Gemini: [['Castor','Pollux'],['Castor','Tejat'],['Pollux','Alhena']],
  Cygnus: [['Deneb','Sadr'],['Sadr','Gienah'],['Sadr','Albireo']],
  Lyra: [['Vega','Sheliak'],['Sheliak','Sulafat'],['Sulafat','Vega']],
  Aquila: [['Altair','Tarazed']],
  Taurus: [['Aldebaran','Elnath'],['Aldebaran','Alcyone']],
  CanisMajor: [['Sirius','Mirzam'],['Sirius','Adhara'],['Adhara','Wezen']],
  Crux: [['Acrux','Gacrux'],['Mimosa','Gacrux']],
  Sagittarius: [['Kaus Australis','Kaus Media'],['Kaus Media','Kaus Borealis'],['Kaus Borealis','Nunki'],['Nunki','Ascella']],
  Pegasus: [['Markab','Scheat'],['Scheat','Alpheratz'],['Alpheratz','Algenib'],['Algenib','Markab']],
  Andromeda: [['Alpheratz','Mirach'],['Mirach','Almach']],
  Bootes: [['Arcturus','Izar']],
  Virgo: [['Spica','Porrima'],['Porrima','Vindemiatrix']],
  Aries: [['Hamal','Sheratan']],
  Libra: [['Zubeneschamali','Zubenelgenubi']],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTELLATION NAMES (German)
// ─────────────────────────────────────────────────────────────────────────────

export const CONSTELLATION_NAMES: ConstellationNames = {
  Orion: 'Orion',
  UrsaMajor: 'Großer Bär',
  UrsaMinor: 'Kleiner Bär',
  Cassiopeia: 'Kassiopeia',
  Scorpius: 'Skorpion',
  Leo: 'Löwe',
  Taurus: 'Stier',
  Gemini: 'Zwillinge',
  Virgo: 'Jungfrau',
  CanisMajor: 'Großer Hund',
  CanisMinor: 'Kleiner Hund',
  Lyra: 'Leier',
  Cygnus: 'Schwan',
  Aquila: 'Adler',
  Sagittarius: 'Schütze',
  Capricornus: 'Steinbock',
  Aquarius: 'Wassermann',
  Pisces: 'Fische',
  Aries: 'Widder',
  Cancer: 'Krebs',
  Libra: 'Waage',
  Crux: 'Kreuz des Südens',
  Centaurus: 'Zentaur',
  Bootes: 'Bärenhüter',
  Pegasus: 'Pegasus',
  Andromeda: 'Andromeda',
  Perseus: 'Perseus',
  Auriga: 'Fuhrmann',
  Ophiuchus: 'Schlangenträger',
  Eridanus: 'Eridanus',
  Carina: 'Kiel des Schiffs',
  Draco: 'Drache',
  Hercules: 'Herkules',
  CoronaBorealis: 'Nördliche Krone',
  Grus: 'Kranich',
  Pavo: 'Pfau',
  PiscisAustrinus: 'Südlicher Fisch'
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANETARY DATA — J2000.0 Orbital Elements
// ─────────────────────────────────────────────────────────────────────────────

export const PLANETS: Record<string, PlanetData> = {
  mercury: { name: 'Merkur', a: 0.387, e: 0.206, i: 7.0, omega: 48.33, w: 29.12, M0: 174.79, period: 87.97, radius: 0.25, color: '#A89F91', symbol: '☿' },
  venus: { name: 'Venus', a: 0.723, e: 0.007, i: 3.4, omega: 76.68, w: 54.88, M0: 50.45, period: 224.7, radius: 0.4, color: '#E8D598', symbol: '♀' },
  earth: { name: 'Erde', a: 1.000, e: 0.017, i: 0.0, omega: -11.26, w: 114.21, M0: 357.53, period: 365.25, radius: 0.42, color: '#4A90D9', symbol: '⊕' },
  mars: { name: 'Mars', a: 1.524, e: 0.093, i: 1.9, omega: 49.56, w: 286.5, M0: 19.41, period: 686.98, radius: 0.3, color: '#CD5C5C', symbol: '♂' },
  jupiter: { name: 'Jupiter', a: 5.203, e: 0.048, i: 1.3, omega: 100.46, w: 273.87, M0: 20.02, period: 4332.59, radius: 1.1, color: '#D4A574', symbol: '♃' },
  saturn: { name: 'Saturn', a: 9.537, e: 0.054, i: 2.5, omega: 113.64, w: 339.39, M0: 317.02, period: 10759.22, radius: 0.95, color: '#F4D03F', symbol: '♄', rings: true },
  uranus: { name: 'Uranus', a: 19.19, e: 0.047, i: 0.8, omega: 74.0, w: 96.99, M0: 142.24, period: 30688.5, radius: 0.55, color: '#7EC8E3', symbol: '⛢' },
  neptune: { name: 'Neptun', a: 30.07, e: 0.009, i: 1.8, omega: 131.78, w: 273.19, M0: 256.23, period: 60182.0, radius: 0.52, color: '#4169E1', symbol: '♆' },
};

// ─────────────────────────────────────────────────────────────────────────────
// CITIES
// ─────────────────────────────────────────────────────────────────────────────

export const CITIES: CityData[] = [
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'New York', lat: 40.713, lon: -74.006 },
  { name: 'London', lat: 51.507, lon: -0.128 },
  { name: 'Paris', lat: 48.857, lon: 2.352 },
  { name: 'Tokyo', lat: 35.690, lon: 139.692 },
  { name: 'Sydney', lat: -33.869, lon: 151.209 },
  { name: 'Los Angeles', lat: 34.052, lon: -118.244 },
  { name: 'Mumbai', lat: 19.076, lon: 72.878 },
  { name: 'Dubai', lat: 25.205, lon: 55.271 },
  { name: 'São Paulo', lat: -23.551, lon: -46.634 },
  { name: 'Moscow', lat: 55.756, lon: 37.617 },
  { name: 'Rome', lat: 41.903, lon: 12.496 },
  { name: 'Amsterdam', lat: 52.370, lon: 4.895 },
  { name: 'Vienna', lat: 48.208, lon: 16.374 },
  { name: 'Stockholm', lat: 59.329, lon: 18.069 },
  { name: 'Athens', lat: 37.984, lon: 23.728 },
  { name: 'Munich', lat: 48.137, lon: 11.576 },
  { name: 'Hamburg', lat: 53.551, lon: 9.994 },
  { name: 'Dresden', lat: 51.051, lon: 13.738 },
  { name: 'Zurich', lat: 47.377, lon: 8.541 },
  { name: 'Cape Town', lat: -33.925, lon: 18.424 },
  { name: 'Buenos Aires', lat: -34.604, lon: -58.382 },
  { name: 'Mexico City', lat: 19.433, lon: -99.133 },
  { name: 'Bangkok', lat: 13.756, lon: 100.502 },
  { name: 'Seoul', lat: 37.567, lon: 126.978 },
  { name: 'Singapore', lat: 1.352, lon: 103.820 },
  { name: 'Hong Kong', lat: 22.320, lon: 114.169 },
];

export const SUN_RADIUS = 1.5;
export const ORBIT_SCALE = 25;
