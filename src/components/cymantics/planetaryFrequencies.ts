/**
 * Hans Cousto "Cosmic Octave" planetary frequencies
 * Orbital period → octavated into audible/visual range
 */

export interface Planet {
  name: string;
  name_de: string;
  symbol: string;
  baseFrequency: number;
  color: string;
  archetype_de: string;
  wuxing_element: string;
  dimension: number;
  poleIndex: number;
}

export const PLANETS: Planet[] = [
  { name: "Sun",     name_de: "Sonne",    symbol: "☉", baseFrequency: 126.22, color: "#FFD700", archetype_de: "Identität & Lebenskraft",    wuxing_element: "Fire",  dimension: 2, poleIndex: 0 },
  { name: "Moon",    name_de: "Mond",     symbol: "☽", baseFrequency: 210.42, color: "#C0C8E0", archetype_de: "Emotion & Resonanz",          wuxing_element: "Water", dimension: 1, poleIndex: 1 },
  { name: "Mercury", name_de: "Merkur",   symbol: "☿", baseFrequency: 141.27, color: "#8ED6CF", archetype_de: "Kognition & Kommunikation",   wuxing_element: "Metal", dimension: 3, poleIndex: 2 },
  { name: "Venus",   name_de: "Venus",    symbol: "♀", baseFrequency: 221.23, color: "#FF9EBC", archetype_de: "Liebe & Harmonie",            wuxing_element: "Earth", dimension: 3, poleIndex: 3 },
  { name: "Mars",    name_de: "Mars",     symbol: "♂", baseFrequency: 144.72, color: "#FF6B4A", archetype_de: "Antrieb & Durchsetzung",      wuxing_element: "Fire",  dimension: 0, poleIndex: 4 },
  { name: "Jupiter", name_de: "Jupiter",  symbol: "♃", baseFrequency: 183.58, color: "#B8A0E8", archetype_de: "Expansion & Weisheit",        wuxing_element: "Wood",  dimension: 4, poleIndex: 5 },
  { name: "Saturn",  name_de: "Saturn",   symbol: "♄", baseFrequency: 147.85, color: "#A0B8D8", archetype_de: "Struktur & Transformation",   wuxing_element: "Earth", dimension: 5, poleIndex: 6 },
  { name: "Uranus",  name_de: "Uranus",   symbol: "♅", baseFrequency: 207.36, color: "#7AF0E0", archetype_de: "Erneuerung & Freiheit",       wuxing_element: "Metal", dimension: 5, poleIndex: 7 },
  { name: "Neptune", name_de: "Neptun",   symbol: "♆", baseFrequency: 211.44, color: "#4F6EF7", archetype_de: "Auflösung & Intuition",       wuxing_element: "Water", dimension: 4, poleIndex: 8 },
  { name: "Pluto",   name_de: "Pluto",    symbol: "♇", baseFrequency: 140.25, color: "#9B59B6", archetype_de: "Tiefenwandel & Kraft",        wuxing_element: "Water", dimension: 1, poleIndex: 9 },
];

/**
 * Maps natal weights (7-planet) or soulprint (12-sector) to Cymantics weights (10-planet).
 */
export function computeSignatureWeights(
  natalWeights: Record<string, number> = {},
  quizWeights: Record<string, number> = {}
): number[] {
  return PLANETS.map(p => {
    // Base weight from natal (if available for this planet)
    const nw = natalWeights[p.name] ?? 0.5;
    // Modulation from quiz (based on wuxing element)
    const qw = quizWeights[p.wuxing_element.toLowerCase()] ?? 0.5;
    // Blend: 70% natal, 30% quiz (True North principle)
    const weight = nw * 0.7 + qw * 0.3;
    return Math.max(0.1, Math.min(1.0, weight));
  });
}
