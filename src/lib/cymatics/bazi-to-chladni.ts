import type { MappedPillar } from '../../types/bafe';

export type WuxingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface ChladniParams {
  m: number;            // integer 2..6 — nodal line count (x-axis)
  n: number;            // integer 2..6 — nodal line count (y-axis)
  a: number;            // float 0.3..1.0 — amplitude coefficient
  b: number;            // float 0.1..0.7 — amplitude coefficient
  dominantElement: WuxingElement;
  harmonyIndex: number; // float 0..1
}

export interface PlanetFrequency {
  name: string;
  name_de: string;
  symbol: string;
  hz: number;
  wuxing_element: WuxingElement;
  color: string;
  archetype_de: string;
}

/** Hans Cousto "Cosmic Octave" — planetary orbital periods octaved into audible/visual range (1978) */
export const PLANET_FREQUENCIES: PlanetFrequency[] = [
  { name: 'Sun',     name_de: 'Sonne',   symbol: '☉', hz: 126.22, wuxing_element: 'Fire',  color: '#FFD700', archetype_de: 'Identität & Lebenskraft' },
  { name: 'Moon',    name_de: 'Mond',    symbol: '☽', hz: 210.42, wuxing_element: 'Water', color: '#C0C8E0', archetype_de: 'Emotion & Resonanz' },
  { name: 'Mercury', name_de: 'Merkur',  symbol: '☿', hz: 141.27, wuxing_element: 'Metal', color: '#8ED6CF', archetype_de: 'Kognition & Kommunikation' },
  { name: 'Venus',   name_de: 'Venus',   symbol: '♀', hz: 221.23, wuxing_element: 'Earth', color: '#FF9EBC', archetype_de: 'Liebe & Harmonie' },
  { name: 'Mars',    name_de: 'Mars',    symbol: '♂', hz: 144.72, wuxing_element: 'Fire',  color: '#FF6B4A', archetype_de: 'Antrieb & Durchsetzung' },
  { name: 'Jupiter', name_de: 'Jupiter', symbol: '♃', hz: 183.58, wuxing_element: 'Wood',  color: '#B8A0E8', archetype_de: 'Expansion & Weisheit' },
  { name: 'Saturn',  name_de: 'Saturn',  symbol: '♄', hz: 147.85, wuxing_element: 'Earth', color: '#A0B8D8', archetype_de: 'Struktur & Transformation' },
  { name: 'Uranus',  name_de: 'Uranus',  symbol: '♅', hz: 207.36, wuxing_element: 'Metal', color: '#7AF0E0', archetype_de: 'Erneuerung & Freiheit' },
  { name: 'Neptune', name_de: 'Neptun',  symbol: '♆', hz: 211.44, wuxing_element: 'Water', color: '#4F6EF7', archetype_de: 'Auflösung & Intuition' },
  { name: 'Pluto',   name_de: 'Pluto',   symbol: '♇', hz: 140.25, wuxing_element: 'Water', color: '#9B59B6', archetype_de: 'Tiefenwandel & Kraft' },
];

/** Wu-Xing element particle colors */
export const ELEMENT_COLORS: Record<WuxingElement, string> = {
  Wood:  '#66BB6A',
  Fire:  '#FF9800',
  Earth: '#FFD54F',
  Metal: '#CFD8DC',
  Water: '#42A5F5',
};

/**
 * Heavenly Stem Chinese name → index 0..9.
 * This is the PRIMARY lookup because MappedPillar.stem is a string (Chinese character),
 * not a numeric index — BAFE does not return stem_index in the mapped response.
 */
export const STEM_NAME_TO_INDEX: Record<string, number> = {
  '甲': 0, '乙': 1, '丙': 2, '丁': 3, '戊': 4,
  '己': 5, '庚': 6, '辛': 7, '壬': 8, '癸': 9,
};

type BaziPillars = {
  year: MappedPillar;
  month: MappedPillar;
  day: MappedPillar;
  hour: MappedPillar;
};

/**
 * Derive Chladni simulation parameters deterministically from BaZi four-pillar data.
 *
 * @param baziPillars   - Four BaZi pillars from apiData.bazi.pillars
 * @param wuxingWeights - Element weights from apiData.wuxing.elements (e.g. { Wood: 0.3, ... })
 * @param harmonyIndex  - Balance score 0..1 (default 0.5 — MappedWuxing does not expose this field)
 */
export function baziToChladniParams(
  baziPillars: BaziPillars,
  wuxingWeights: Record<string, number>,
  harmonyIndex = 0.5,
): ChladniParams {
  const yi = STEM_NAME_TO_INDEX[baziPillars.year.stem]  ?? 0;
  const mi = STEM_NAME_TO_INDEX[baziPillars.month.stem] ?? 0;
  const di = STEM_NAME_TO_INDEX[baziPillars.day.stem]   ?? 0;
  const hi = STEM_NAME_TO_INDEX[baziPillars.hour.stem]  ?? 0;

  // Single integer in 0..359 that encodes the four-pillar combination
  const numericSig = (yi * 1000 + mi * 100 + di * 10 + hi) % 360;

  // m and n are deliberately derived with different modular offsets (7/5 factor)
  // to minimise correlation — maximises visual diversity across the 10^4 stem space
  const m = 2 + (numericSig % 5);                          // 2..6
  const n = 2 + (Math.floor(numericSig * 7 / 5) % 5);     // 2..6
  const a = 0.3 + harmonyIndex * 0.7;                      // 0.30..1.00
  const b = 1.0 - a * 0.6;                                 // ~0.40..0.82

  const dominantElement = (
    Object.entries(wuxingWeights).sort(([, v1], [, v2]) => v2 - v1)[0]?.[0] ?? 'Water'
  ) as WuxingElement;

  return { m, n, a, b, dominantElement, harmonyIndex };
}
