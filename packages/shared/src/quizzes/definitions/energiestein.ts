import type { QuizDefinition } from '../schema';

export const energiesteinQuiz: QuizDefinition = {
  id: 'quiz.energiestein.v1',
  title: 'Your Energy Stone',
  titleDe: 'Dein Energiestein',
  subtitle: 'Discover the stone that reflects your hidden essence',
  subtitleDe: 'Entdecke den Stein, der deine verborgene Essenz widerspiegelt',
  emoji: '\ud83d\udc8e',
  accentColor: '#D4AF37',
  scoringModel: 'profile-driven',
  questions: [
    {
      id: 'q1',
      text: 'Du betrittst eine Kristallh\u00f6hle. Welches Licht zieht dich zuerst an?',
      options: [
        { id: 'q1a', text: 'Ein sanftes violettes Glimmen aus der Tiefe', profileId: 'amethyst' },
        { id: 'q1b', text: 'Klare, wei\u00dfe Lichtreflexionen an den W\u00e4nden', profileId: 'bergkristall' },
        { id: 'q1c', text: 'Warme, goldene Strahlen durch einen Spalt', profileId: 'citrin' },
        { id: 'q1d', text: 'Tiefes Schwarz mit einzelnen Funken', profileId: 'obsidian' },
      ],
    },
    {
      id: 'q2',
      text: 'Wenn du einen Stein in der Hand h\u00e4ltst, was sp\u00fcrst du am liebsten?',
      options: [
        { id: 'q2a', text: 'Eine beruhigende K\u00fchle, die mich erdet', profileId: 'bergkristall' },
        { id: 'q2b', text: 'Ein leichtes Kribbeln wie elektrische Spannung', profileId: 'citrin' },
        { id: 'q2c', text: 'Eine sanfte W\u00e4rme, die durch mich flie\u00dft', profileId: 'rosenquarz' },
        { id: 'q2d', text: 'Das Gewicht und die Pr\u00e4senz des Moments', profileId: 'obsidian' },
      ],
    },
    {
      id: 'q3',
      text: 'In einem wichtigen Gespr\u00e4ch \u2013 was ist dir am wichtigsten?',
      options: [
        { id: 'q3a', text: 'Die Wahrheit klar und direkt auszusprechen', profileId: 'bergkristall' },
        { id: 'q3b', text: 'Die Gef\u00fchle des anderen zu verstehen und zu spiegeln', profileId: 'rosenquarz' },
        { id: 'q3c', text: 'Eine L\u00f6sung zu finden, die alle weiterbringt', profileId: 'tigerauge' },
        { id: 'q3d', text: 'Raum f\u00fcr das Ungesagte zu lassen', profileId: 'amethyst' },
      ],
    },
    {
      id: 'q4',
      text: 'Ein unerwartetes Problem taucht auf. Deine erste Reaktion?',
      options: [
        { id: 'q4a', text: 'Tief durchatmen und die Ruhe in mir finden', profileId: 'amethyst' },
        { id: 'q4b', text: 'Sofort analysieren: Was sind die Optionen?', profileId: 'bergkristall' },
        { id: 'q4c', text: 'Vertrauen, dass sich der richtige Weg zeigt', profileId: 'mondstein' },
        { id: 'q4d', text: 'Die Energie nutzen, um ins Handeln zu kommen', profileId: 'tigerauge' },
      ],
    },
    {
      id: 'q5',
      text: 'Was beschreibt deine Art zu tr\u00e4umen am besten?',
      options: [
        { id: 'q5a', text: 'Lebhafte, farbige Bilder voller Symbolik', profileId: 'labradorit' },
        { id: 'q5b', text: 'Klare Szenarien, fast wie Filme', profileId: 'bergkristall' },
        { id: 'q5c', text: 'Tiefe Gef\u00fchle ohne klare Bilder', profileId: 'amethyst' },
        { id: 'q5d', text: 'Intensive Erlebnisse, an die ich mich lebhaft erinnere', profileId: 'citrin' },
      ],
    },
    {
      id: 'q6',
      text: 'Du findest einen alten Schl\u00fcssel. Was denkst du zuerst?',
      options: [
        { id: 'q6a', text: 'Welche T\u00fcr er wohl \u00f6ffnet?', profileId: 'tigerauge' },
        { id: 'q6b', text: 'Wer ihn wohl verloren hat?', profileId: 'rosenquarz' },
        { id: 'q6c', text: 'Er f\u00fchlt sich bedeutsam an \u2013 ich behalte ihn', profileId: 'amethyst' },
        { id: 'q6d', text: 'Ich werde herausfinden, was er \u00f6ffnet', profileId: 'citrin' },
      ],
    },
    {
      id: 'q7',
      text: 'Welche Umgebung gibt dir am meisten Energie?',
      options: [
        { id: 'q7a', text: 'Ein stiller Berggipfel \u00fcber den Wolken', profileId: 'bergkristall' },
        { id: 'q7b', text: 'Ein lebendiger Markt voller Menschen und Farben', profileId: 'citrin' },
        { id: 'q7c', text: 'Ein uralter Wald, in dem die Zeit stehen bleibt', profileId: 'amethyst' },
        { id: 'q7d', text: 'Am Meer, wo Wellen kommen und gehen', profileId: 'mondstein' },
      ],
    },
    {
      id: 'q8',
      text: 'Ein Freund ist in einer Krise. Wie hilfst du am besten?',
      options: [
        { id: 'q8a', text: 'Ich h\u00f6re zu und bin einfach da', profileId: 'rosenquarz' },
        { id: 'q8b', text: 'Ich helfe ihm, die Situation klar zu sehen', profileId: 'bergkristall' },
        { id: 'q8c', text: 'Ich ermutige ihn, seiner Intuition zu vertrauen', profileId: 'mondstein' },
        { id: 'q8d', text: 'Ich schlage konkrete Schritte vor', profileId: 'tigerauge' },
      ],
    },
    {
      id: 'q9',
      text: 'Was zieht dich an einem Menschen am meisten an?',
      options: [
        { id: 'q9a', text: 'Eine ruhige, tiefe Pr\u00e4senz', profileId: 'amethyst' },
        { id: 'q9b', text: 'Scharfer Verstand und klare Kommunikation', profileId: 'bergkristall' },
        { id: 'q9c', text: 'Warme Herzlichkeit und Einf\u00fchlungsverm\u00f6gen', profileId: 'rosenquarz' },
        { id: 'q9d', text: 'Leidenschaft und Tatendrang', profileId: 'tigerauge' },
      ],
    },
    {
      id: 'q10',
      text: 'Du stehst an einer Kreuzung. Ein Weg ist klar, einer im Nebel. Du w\u00e4hlst...',
      options: [
        { id: 'q10a', text: 'Den klaren Weg \u2013 ich wei\u00df gern, wohin ich gehe', profileId: 'bergkristall' },
        { id: 'q10b', text: 'Den Nebel \u2013 das Mysterium ruft mich', profileId: 'labradorit' },
        { id: 'q10c', text: 'Ich warte einen Moment und sp\u00fcre hinein', profileId: 'mondstein' },
        { id: 'q10d', text: 'Ich gehe los, egal wohin \u2013 Bewegung z\u00e4hlt', profileId: 'citrin' },
      ],
    },
  ],
  profiles: [
    {
      id: 'amethyst',
      title: 'Amethyst',
      emoji: '\ud83d\udd2e',
      color: '#7B2D8E',
      description: 'Dein Energiestein ist der Amethyst \u2013 der H\u00fcter zwischen Welten. Du tr\u00e4gst eine nat\u00fcrliche Verbindung zum Unsichtbaren in dir. Andere sp\u00fcren in deiner N\u00e4he eine Tiefe, die sie beruhigt und gleichzeitig fasziniert.',
    },
    {
      id: 'bergkristall',
      title: 'Bergkristall',
      emoji: '\ud83d\udc8e',
      color: '#CCDDEE',
      description: 'Dein Energiestein ist der Bergkristall \u2013 rein, klar, ungefiltert. Du hast die Gabe, Dinge so zu sehen, wie sie wirklich sind. Der Bergkristall verst\u00e4rkt, was ist \u2013 er macht das Gute heller und das Ungekl\u00e4rte sichtbarer.',
    },
    {
      id: 'rosenquarz',
      title: 'Rosenquarz',
      emoji: '\ud83d\udc96',
      color: '#E8A0B0',
      description: 'Dein Energiestein ist der Rosenquarz \u2013 sanft und doch so kraftvoll wie die Liebe selbst. Du tr\u00e4gst ein offenes Herz durch die Welt, und das ist mutiger, als die meisten ahnen.',
    },
    {
      id: 'obsidian',
      title: 'Obsidian',
      emoji: '\ud83d\udda4',
      color: '#1A1A2E',
      description: 'Dein Energiestein ist der Obsidian \u2013 geboren aus Feuer, geformt in Sekunden, stark wie die Wahrheit. Du hast keine Angst vor der Dunkelheit, denn du wei\u00dft: Dort liegt oft das Wertvollste verborgen.',
    },
    {
      id: 'tigerauge',
      title: 'Tigerauge',
      emoji: '\ud83d\udc05',
      color: '#B8860B',
      description: 'Dein Energiestein ist das Tigerauge \u2013 schimmernd zwischen Gold und Erde, wachsam und entschlossen. Du bist jemand, der Dinge in Bewegung bringt durch pr\u00e4zise Klarheit und den Mut, zu handeln.',
    },
    {
      id: 'mondstein',
      title: 'Mondstein',
      emoji: '\ud83c\udf19',
      color: '#B0C4DE',
      description: 'Dein Energiestein ist der Mondstein \u2013 schimmernd wie der Nachthimmel, verbunden mit dem Rhythmus des Lebens selbst. Du verstehst intuitiv, dass alles Phasen hat.',
    },
    {
      id: 'labradorit',
      title: 'Labradorit',
      emoji: '\u2728',
      color: '#2F4F4F',
      description: 'Dein Energiestein ist der Labradorit \u2013 unscheinbar auf den ersten Blick, dann pl\u00f6tzlich ein Feuerwerk aus Farben. Du bist komplexer, als andere vermuten.',
    },
    {
      id: 'citrin',
      title: 'Citrin',
      emoji: '\u2600\ufe0f',
      color: '#FFD700',
      description: 'Dein Energiestein ist der Citrin \u2013 fl\u00fcssiges Sonnenlicht, gefangen in Kristallform. Du tr\u00e4gst eine nat\u00fcrliche Leuchtkraft in dir, die andere anzieht.',
    },
  ],
  resultMapping: {
    markerId: 'quiz.energiestein.v1',
    profileToTraits: {},
  },
};
