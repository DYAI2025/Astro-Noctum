import type { ProjectedSignal, RelationScores, Narratives, DimensionKey } from './types';
import { DIMENSION_KEYS } from './dimensions';

type Lang = 'de' | 'en';

const DIMENSION_LABELS: Record<Lang, Record<DimensionKey, string>> = {
  de: {
    passion: 'Leidenschaft', stability: 'Stabilität', future: 'Zukunftsorientierung',
    connection: 'Verbundenheit', autonomy: 'Autonomie',
  },
  en: {
    passion: 'Passion', stability: 'Stability', future: 'Future Orientation',
    connection: 'Connection', autonomy: 'Autonomy',
  },
};

function topDimensions(signal: ProjectedSignal, n: number): DimensionKey[] {
  return DIMENSION_KEYS.slice().sort((a, b) => signal.dimensions[b] - signal.dimensions[a]).slice(0, n);
}

function formatAlignment(value: number): string {
  if (value >= 0.8) return 'high';
  if (value >= 0.5) return 'moderate';
  return 'low';
}

export function generateNarratives(
  natal: ProjectedSignal, quiz: ProjectedSignal, gcb: ProjectedSignal,
  relations: RelationScores, lang: Lang = 'de', evidenceMode: string = 'heuristic_v1',
): Narratives {
  const labels = DIMENSION_LABELS[lang];
  const natalTop = topDimensions(natal, 2);
  const quizTop = topDimensions(quiz, 2);
  const gcbTop = topDimensions(gcb, 2);
  const alignment = formatAlignment(relations.internal_coherence);
  const contextFit = formatAlignment(relations.context_fit);

  const core_summary = lang === 'de'
    ? `Dein aktuelles integratives Profil zeigt ein Kernmuster mit Schwerpunkt auf ${labels[natalTop[0]]} und ${labels[natalTop[1]]}. `
      + `Deine Selbsteinschätzung betont ${labels[quizTop[0]]} und ${labels[quizTop[1]]}. `
      + `Die Übereinstimmung zwischen Anlage und Selbstbericht ist ${alignment === 'high' ? 'hoch' : alignment === 'moderate' ? 'moderat' : 'gering'}.`
    : `Your current integrative profile shows a core pattern emphasizing ${labels[natalTop[0]]} and ${labels[natalTop[1]]}. `
      + `Your self-report emphasizes ${labels[quizTop[0]]} and ${labels[quizTop[1]]}. `
      + `The alignment between disposition and self-report is ${alignment}.`;

  const context_summary = lang === 'de'
    ? `Dieses Kontextmodell (evidence_mode: ${evidenceMode}) positioniert dich in einer Lebensphase, `
      + `die typischerweise ${labels[gcbTop[0]]} und ${labels[gcbTop[1]]} betont. `
      + `Dies ist eine Referenzschicht, keine individuelle Wahrheitsaussage. `
      + `Generationskontext dient als Orientierungsrahmen, nicht als Persönlichkeitsdiagnose.`
    : `This context model (evidence_mode: ${evidenceMode}) places you in a life stage `
      + `that typically emphasizes ${labels[gcbTop[0]]} and ${labels[gcbTop[1]]}. `
      + `This is a reference layer, not an individual truth claim. `
      + `Generational context serves as an orientation framework, not a personality diagnosis.`;

  const integration_summary = lang === 'de'
    ? `Die Passung zwischen deiner Anlage und deinem Selbstbericht ist ${alignment === 'high' ? 'deutlich' : alignment === 'moderate' ? 'teilweise' : 'gering'} ausgeprägt. `
      + `Dein Profil ${contextFit === 'high' ? 'stimmt gut' : contextFit === 'moderate' ? 'stimmt teilweise' : 'weicht ab'} vom Kohortenrahmen. `
      + `Keine der Quellen wird dabei absolut gesetzt.`
    : `The fit between your disposition and self-report is ${alignment}. `
      + `Your profile ${contextFit === 'high' ? 'aligns well with' : contextFit === 'moderate' ? 'partially aligns with' : 'diverges from'} the cohort framework. `
      + `No single source is treated as absolute.`;

  return { core_summary, context_summary, integration_summary };
}
