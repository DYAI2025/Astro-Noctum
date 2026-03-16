import type { QuizDefinition } from '../schema';

export const partnerMatch03Quiz: QuizDefinition = {
  id: 'partner-match-03',
  title: 'Preferences & Lifestyle',
  titleDe: 'Vorlieben & Lebensstil',
  subtitle: 'Not every fitting person looks fitting at first glance. This format looks for resonance, not boxes.',
  subtitleDe: 'Nicht jeder passende Mensch sieht auf den ersten Blick passend aus. Dieses Format sucht nach Resonanz, nicht nach Schubladen.',
  emoji: '💕',
  accentColor: '#9B3A6A',
  scoringModel: 'categorical',
  dimensions: ['passion', 'stability', 'future'],
  seriesId: 'partner-match',
  seriesOrder: 3,
  questions: [
    { id: 'q01', text: 'Euer Traumwochenende — was lässt dich wirklich aufleben?', options: [
      { id: 'A', text: 'Ein spontanes Abenteuer — neuer Ort, unbekannte Energie, offener Ausgang.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Etwas Neues ausprobieren, das wir beide noch nicht kennen — gemeinsam entdecken.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Etwas planen, auf das wir hinarbeiten — das Vorfreuen ist auch Teil des Erlebens.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Das Vertraute genießen — wir kennen unsere Lieblingsrestaurants und das reicht uns.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q02', text: 'Dein Partner hat eine Leidenschaft, die du noch nicht kennst. Wie reagierst du?', options: [
      { id: 'A', text: 'Sofort dabei — ich will alles wissen und am besten auch mitmachen.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Neugierig fragen — ich will verstehen, was daran so besonders ist.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Mir überlegen, wie das in unser gemeinsames Leben passt und passen könnte.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Freuen, dass er sein Ding hat — ich brauche nicht bei allem dabei zu sein.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q03', text: 'Was soll euer gemeinsames Leben in fünf Jahren bewegt haben?', options: [
      { id: 'A', text: 'Viele Erfahrungen, Orte und Geschichten, die uns verbinden.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Wir haben beide etwas Neues gelernt und uns dabei gegenseitig inspiriert.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Wir haben unser gemeinsames Bild vom Leben weiterentwickelt und sind ihm nähergekommen.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Wir haben uns ein stabiles, schönes Leben aufgebaut und sind damit glücklich.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q04', text: 'Wie wichtig ist dir persönliches Wachstum in einer Beziehung?', options: [
      { id: 'A', text: 'Sehr wichtig — Wachstum passiert für mich vor allem durch neue Erfahrungen zusammen.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Sehr wichtig — ich will neugierig bleiben und meinen Partner dabei mitreißen.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Sehr wichtig — ich will, dass wir beide größer werden und uns dabei nicht verlieren.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Wichtig, aber ich wachse lieber in meinem eigenen Tempo und Raum.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q05', text: 'Ihr plant eine gemeinsame Reise. Wie läuft das bei euch ab?', options: [
      { id: 'A', text: 'Möglichst offen planen — Überraschungen gehören dazu und sind der beste Teil.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Erst recherchieren, was es dort zu entdecken gibt — lokale Kultur, unbekannte Ecken.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Einen Rahmen planen, der uns Freiheit lässt, aber auch Sicherheit gibt.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'An einen Ort zurückkehren, den wir kennen und lieben — Vertrautheit als Luxus.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q06', text: 'Wie wichtig ist es dir, dass ihr gemeinsame Interessen habt?', options: [
      { id: 'A', text: 'Sehr wichtig — gemeinsame Erlebnisse sind der Kitt.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Mittel wichtig — mir ist wichtiger, dass wir uns füreinander interessieren, nicht dass wir gleich sind.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Wichtig — ich will, dass wir eine gemeinsame Richtung spüren, auch wenn die Wege verschieden sind.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Nicht so wichtig — eigene Welten sind gesund, solange wir uns in der Mitte treffen.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q07', text: 'Wie zeigt sich Neugier bei dir in einer Beziehung?', options: [
      { id: 'A', text: 'Ich schlage ständig neue Dinge vor — Erkundung ist mein Liebesausdruck.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Ich frage viel — ich will den anderen wirklich verstehen, nicht nur kennen.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Ich stelle mir vor, wo wir in fünf Jahren sein könnten — und spreche darüber.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Ich genieße das Vertraute — die Tiefe, die entsteht, wenn man sich wirklich kennt.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q08', text: 'In welchem Lebenstempo fühlt sich eine Beziehung für dich richtig an?', options: [
      { id: 'A', text: 'Schnell und impulsiv — ich will das Leben nicht auf später verschieben.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Varierend — manchmal schnell, manchmal langsam, je nachdem was gerade passt.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Bewusst und mit Richtung — ich will, dass wir wissen, wohin wir gehen.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Ruhig und gemächlich — ich will ankommen und nicht ständig unterwegs sein.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
    { id: 'q09', text: 'Welche Art von Zukunftsvisionen teilt ihr am liebsten miteinander?', options: [
      { id: 'A', text: 'Reisepläne, Abenteuer, Erfahrungen, die wir noch nicht hatten.', scores: { passion: 0.06, stability: -0.08, future: 0.34 }, profileId: 'adventure_companion' },
      { id: 'B', text: 'Dinge, die wir lernen oder aufbauen wollen — gemeinsame Projekte und Ideen.', scores: { passion: 0.0, stability: 0.14, future: 0.20 }, profileId: 'curious_builder' },
      { id: 'C', text: 'Wie wir leben wollen — Werte, Ziele, das Bild vom gemeinsamen Leben.', scores: { passion: 0.02, stability: 0.08, future: 0.30 }, profileId: 'vision_match' },
      { id: 'D', text: 'Das Hier und Jetzt verbessern — die Zukunft ist schön, aber der Alltag ist echter.', scores: { passion: 0.04, stability: 0.24, future: -0.18 }, profileId: 'curious_builder' },
    ]},
  ],
  profiles: [
    { id: 'adventure_companion', title: 'Abenteuer-Gefährte', emoji: '🧭', color: '#E85555', description: 'Du liebst jemanden, mit dem das Leben größer wird — nicht kleiner.', priority: 1 },
    { id: 'curious_builder', title: 'Neugieriger Gestalter', emoji: '🔨', color: '#9B3A6A', description: 'Du baust mit — mit Ideen, Fragen und der Überzeugung, dass zusammen mehr entsteht.', priority: 2 },
    { id: 'vision_match', title: 'Horizont-Partner', emoji: '🌅', color: '#4A6741', description: 'Du willst nicht nur jemanden neben dir — du willst jemanden, der in die gleiche Richtung schaut.', priority: 3 },
  ],
  resultMapping: {
    markerId: 'quiz.partner_match_03.v1',
    profileToTraits: {
      adventure_companion: { 'marker.freedom.growth': 1.0, 'marker.love.passionate': 0.7, 'marker.social.extroversion': 0.6 },
      curious_builder: { 'marker.cognition.curiosity': 1.0, 'marker.freedom.growth': 0.8, 'marker.eq.empathy': 0.7 },
      vision_match: { 'marker.cognition.vision': 1.0, 'marker.freedom.growth': 0.85, 'marker.values.achievement': 0.7 },
    },
  },
};
