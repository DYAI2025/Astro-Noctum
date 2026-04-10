/**
 * Synastry narrative templates — DEC-narrative-engine-hybrid
 *
 * Fixed German template strings for Free-tier synastry narratives.
 * Template fallback for Premium-tier (Gemini) when the API is unavailable.
 * Output is always German — no other language is generated here.
 */

import type { AspectDefinition } from './aspects';

export const PLANET_DE: Record<string, string> = {
  Sun:     'Sonne',
  Moon:    'Mond',
  Mercury: 'Merkur',
  Venus:   'Venus',
  Mars:    'Mars',
  Jupiter: 'Jupiter',
  Saturn:  'Saturn',
};

export const ASPECT_DE: Record<AspectDefinition['name'], string> = {
  conjunction: 'Konjunktion',
  opposition:  'Opposition',
  trine:       'Trigon',
  square:      'Quadrat',
  sextile:     'Sextil',
};

type AspectFn = (p1: string, p2: string, exact: boolean) => string;

const ASPECT_TEMPLATES: Record<AspectDefinition['name'], AspectFn> = {
  conjunction: (p1, p2, exact) =>
    exact
      ? `${p1} und ${p2} vereinen sich in exakter Konjunktion — eine intensive Verschmelzung, die gemeinsame Themen zwischen euch stark betont.`
      : `${p1} und ${p2} stehen in Konjunktion — ihre Energien fließen ineinander und verstärken gemeinsame Themen in dieser Verbindung.`,

  opposition: (p1, p2, exact) =>
    exact
      ? `${p1} und ${p2} stehen sich in exakter Opposition gegenüber — ein starkes Spannungsfeld, das zur bewussten Ergänzung einlädt.`
      : `${p1} und ${p2} befinden sich in Opposition — ein Gegenüber, das Wachstum durch gegenseitige Reflexion ermöglicht.`,

  trine: (p1, p2, exact) =>
    exact
      ? `${p1} und ${p2} bilden ein exaktes Trigon — ein harmonischer Fluss, der Resonanz und Leichtigkeit in diese Verbindung bringt.`
      : `${p1} und ${p2} stehen im Trigon — eine fließende Harmonie, die euch in diesen Bereichen natürlich unterstützt.`,

  square: (p1, p2, exact) =>
    exact
      ? `${p1} und ${p2} bilden ein exaktes Quadrat — produktive Spannung, die Wachstum durch bewusste Auseinandersetzung fordert.`
      : `${p1} und ${p2} stehen im Quadrat — eine reibende Spannung, die zur aktiven Klärung einlädt.`,

  sextile: (p1, p2, exact) =>
    exact
      ? `${p1} und ${p2} bilden ein exaktes Sextil — eine sanfte Chance zur Zusammenarbeit, die gegenseitige Neugier stärkt.`
      : `${p1} und ${p2} stehen im Sextil — ein weicher Kontakt, der Möglichkeiten zur gegenseitigen Bereicherung eröffnet.`,
};

export interface AspectInput {
  planet1: string;
  planet2: string;
  type: AspectDefinition['name'];
  exact: boolean;
  orb: number;
}

/** Returns a German narrative sentence for a single synastry aspect. */
export function aspectNarrative(aspect: AspectInput): string {
  const p1 = PLANET_DE[aspect.planet1] ?? aspect.planet1;
  const p2 = PLANET_DE[aspect.planet2] ?? aspect.planet2;
  return ASPECT_TEMPLATES[aspect.type](p1, p2, aspect.exact);
}

/**
 * Returns a German summary paragraph for the full set of synastry aspects.
 * Used as template narrative (Free tier) and as fallback for Gemini failures.
 */
export function synastryTemplateSummary(aspects: AspectInput[]): string {
  if (aspects.length === 0) {
    return 'Die astrologische Analyse ergibt keine signifikanten Hauptaspekte zwischen euren Geburtshoroskopen.';
  }

  const sorted = [...aspects].sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    return a.orb - b.orb;
  });

  const top = sorted.slice(0, 3).map(a => {
    const p1 = PLANET_DE[a.planet1] ?? a.planet1;
    const p2 = PLANET_DE[a.planet2] ?? a.planet2;
    const asp = ASPECT_DE[a.type] ?? a.type;
    return `${p1}–${p2} in ${asp}`;
  });

  const total    = aspects.length;
  const exact    = aspects.filter(a => a.exact).length;
  const harmonic = aspects.filter(a => a.type === 'trine' || a.type === 'sextile').length;
  const tense    = aspects.filter(a => a.type === 'square' || a.type === 'opposition').length;

  const intro = `Zwischen euren Horoskopen zeigen sich ${total} Hauptaspekte${exact > 0 ? `, davon ${exact} präzise` : ''}.`;

  let tone: string;
  if (harmonic > tense) {
    tone = ' Die Verbindung trägt eine überwiegend fließende Qualität — ein natürliches gegenseitiges Verständnis scheint angelegt.';
  } else if (tense > harmonic) {
    tone = ' Die Konstellation enthält produktive Spannung — Wachstum durch aktiven Austausch ist ein zentrales Thema.';
  } else {
    tone = ' Die Verbindung vereint harmonische und spannungsreiche Aspekte — eine vielschichtige Begegnung mit Tiefe.';
  }

  const highlight = ` Besonders prägend: ${top.join(', ')}.`;
  return intro + tone + highlight;
}
