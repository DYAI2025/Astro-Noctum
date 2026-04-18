/**
 * Phase H1 — Ten-planet Cousto table (foundation for 3D Cymatics sphere).
 *
 * Source of astrological/cosmic-octave values:
 * `/Cymantics/planetaryFrequencies.ts` (prototype, copied 1:1 for
 * baseFrequency, color, archetype_de, wuxing_element).
 *
 * Dimension & poleIndex are newly assigned for Phase H — they control
 * which Chladni frequency shell a planet inhabits (dimension 0..5) and
 * which pole on the 6-pole sphere the planet claims (poleIndex 0..5).
 *
 * This file is pure data — no side effects, no imports.
 */

export type PlanetName =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto';

export type WuxingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface Planet {
  name: PlanetName;
  name_de: string;
  symbol: string;
  /** Cousto "Cosmic Octave" frequency in Hz (orbital period octavated into audible range). */
  baseFrequency: number;
  /** Hex color for pole markers & particle tint. */
  color: string;
  archetype_de: string;
  wuxing_element: WuxingElement;
  /**
   * Chladni frequency-shell index 0..5.
   * Consumers map this to node counts (e.g. `n = 2 + dimension * 2` → 2,4,6,8,10,12).
   * Luminaries (Sun/Moon) occupy the innermost shell, outer planets the outermost.
   */
  dimension: 0 | 1 | 2 | 3 | 4 | 5;
  /**
   * Pole index 0..5 on the 6-pole sphere (three great-circle axes).
   * Two planets share each pole (one "positive", one "negative" end conceptually).
   */
  poleIndex: 0 | 1 | 2 | 3 | 4 | 5;
}

/**
 * Ten Cousto planets with Phase-H dimension/poleIndex assignments.
 *
 * baseFrequency / color / archetype_de / wuxing_element copied 1:1 from
 * /Cymantics/planetaryFrequencies.ts (prototype).
 *
 * dimension / poleIndex per Phase-H handoff pre-decided matrix:
 *   Sun→(0,1), Moon→(0,2), Mercury→(1,3), Venus→(1,4),
 *   Mars→(2,5), Jupiter→(2,0), Saturn→(3,1),
 *   Uranus→(4,2), Neptune→(5,3), Pluto→(5,4).
 */
export const PLANETS: readonly Planet[] = [
  {
    name: 'Sun',
    name_de: 'Sonne',
    symbol: '☉',
    baseFrequency: 126.22,
    color: '#FFD700',
    archetype_de: 'Identität & Lebenskraft',
    wuxing_element: 'Fire',
    dimension: 0,
    poleIndex: 1,
  },
  {
    name: 'Moon',
    name_de: 'Mond',
    symbol: '☽',
    baseFrequency: 210.42,
    color: '#C0C8E0',
    archetype_de: 'Emotion & Resonanz',
    wuxing_element: 'Water',
    dimension: 0,
    poleIndex: 2,
  },
  {
    name: 'Mercury',
    name_de: 'Merkur',
    symbol: '☿',
    baseFrequency: 141.27,
    color: '#8ED6CF',
    archetype_de: 'Kognition & Kommunikation',
    wuxing_element: 'Metal',
    dimension: 1,
    poleIndex: 3,
  },
  {
    name: 'Venus',
    name_de: 'Venus',
    symbol: '♀',
    baseFrequency: 221.23,
    color: '#FF9EBC',
    archetype_de: 'Liebe & Harmonie',
    wuxing_element: 'Earth',
    dimension: 1,
    poleIndex: 4,
  },
  {
    name: 'Mars',
    name_de: 'Mars',
    symbol: '♂',
    baseFrequency: 144.72,
    color: '#FF6B4A',
    archetype_de: 'Antrieb & Durchsetzung',
    wuxing_element: 'Fire',
    dimension: 2,
    poleIndex: 5,
  },
  {
    name: 'Jupiter',
    name_de: 'Jupiter',
    symbol: '♃',
    baseFrequency: 183.58,
    color: '#B8A0E8',
    archetype_de: 'Expansion & Weisheit',
    wuxing_element: 'Wood',
    dimension: 2,
    poleIndex: 0,
  },
  {
    name: 'Saturn',
    name_de: 'Saturn',
    symbol: '♄',
    baseFrequency: 147.85,
    color: '#A0B8D8',
    archetype_de: 'Struktur & Transformation',
    wuxing_element: 'Earth',
    dimension: 3,
    poleIndex: 1,
  },
  {
    name: 'Uranus',
    name_de: 'Uranus',
    symbol: '♅',
    baseFrequency: 207.36,
    color: '#7AF0E0',
    archetype_de: 'Erneuerung & Freiheit',
    wuxing_element: 'Metal',
    dimension: 4,
    poleIndex: 2,
  },
  {
    name: 'Neptune',
    name_de: 'Neptun',
    symbol: '♆',
    baseFrequency: 211.44,
    color: '#4F6EF7',
    archetype_de: 'Auflösung & Intuition',
    wuxing_element: 'Water',
    dimension: 5,
    poleIndex: 3,
  },
  {
    name: 'Pluto',
    name_de: 'Pluto',
    symbol: '♇',
    baseFrequency: 140.25,
    color: '#9B59B6',
    archetype_de: 'Tiefenwandel & Kraft',
    wuxing_element: 'Water',
    dimension: 5,
    poleIndex: 4,
  },
] as const;

/**
 * O(1) lookup by planet name. All 10 planets are always present.
 */
export const PLANET_MAP: Readonly<Record<PlanetName, Planet>> = Object.fromEntries(
  PLANETS.map((p) => [p.name, p]),
) as Readonly<Record<PlanetName, Planet>>;
