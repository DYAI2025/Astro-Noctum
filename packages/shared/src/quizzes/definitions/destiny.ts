import type { QuizDefinition } from '../schema';

export const destinyQuiz: QuizDefinition = {
  id: 'quiz.destiny.v1',
  title: 'Destined for Greatness?',
  titleDe: 'Bist du zu H\u00f6herem bestimmt?',
  subtitle: '10 questions. No right answers. Only truth.',
  subtitleDe: '10 Fragen. Keine richtigen Antworten. Nur die, die wahr sind.',
  emoji: '\uD83D\uDD2E',
  accentColor: '#D4AF37',
  scoringModel: 'categorical',
  dimensions: ['vision', 'resilience', 'magnetism', 'innerCall'],

  questions: [
    {
      id: 'q1',
      text: 'Wenn du nachts wach liegst, woran denkst du?',
      options: [
        { id: 'q1a', text: 'An Systeme, die ich ver\u00e4ndern will \u2013 Bildung, Wirtschaft, Gesellschaft', scores: { vision: 3, innerCall: 2 } },
        { id: 'q1b', text: 'An Menschen, die ich erreichen m\u00f6chte \u2013 konkrete Gesichter, konkrete Wirkung', scores: { magnetism: 3, vision: 1 } },
        { id: 'q1c', text: 'An den n\u00e4chsten konkreten Schritt, der alles ver\u00e4ndern k\u00f6nnte', scores: { resilience: 2, vision: 1 } },
        { id: 'q1d', text: 'An ein Gef\u00fchl, das ich nicht benennen kann \u2013 aber es zieht', scores: { innerCall: 3, vision: 1 } },
      ],
    },
    {
      id: 'q2',
      text: 'Du st\u00f6\u00dft auf massiven Widerstand gegen deine Idee. Was passiert in dir?',
      options: [
        { id: 'q2a', text: 'Brennstoff. Je mehr Widerstand, desto klarer wei\u00df ich, dass es richtig ist.', scores: { resilience: 3, innerCall: 2 } },
        { id: 'q2b', text: 'Ich analysiere: Ist der Widerstand ein Signal oder nur Rauschen?', scores: { vision: 2, resilience: 1 } },
        { id: 'q2c', text: 'Ich suche einen anderen Weg zum selben Ziel. Wasser findet immer einen Weg.', scores: { resilience: 2, magnetism: 1 } },
        { id: 'q2d', text: 'Ich ziehe mich zur\u00fcck, aber das Feuer bleibt. Es wartet.', scores: { innerCall: 2, resilience: 1 } },
      ],
    },
    {
      id: 'q3',
      text: 'Menschen in deinem Umfeld w\u00fcrden sagen, du bist...',
      options: [
        { id: 'q3a', text: '...jemand, dem man folgen will, ohne genau zu wissen warum', scores: { magnetism: 3, innerCall: 1 } },
        { id: 'q3b', text: '...jemand, der Dinge sieht, die anderen erst sp\u00e4ter klar werden', scores: { vision: 3, innerCall: 1 } },
        { id: 'q3c', text: '...unzerst\u00f6rbar \u2013 du machst einfach weiter, egal was kommt', scores: { resilience: 3 } },
        { id: 'q3d', text: '...anders \u2013 auf eine Art, die sie nicht ganz greifen k\u00f6nnen', scores: { innerCall: 2, magnetism: 1 } },
      ],
    },
    {
      id: 'q4',
      text: 'Was ist dein Verh\u00e4ltnis zu "Erfolg", wie ihn die Gesellschaft definiert?',
      options: [
        { id: 'q4a', text: 'Ein Mittel zum Zweck. Geld und Status sind Hebel, keine Ziele.', scores: { vision: 2, resilience: 2 } },
        { id: 'q4b', text: 'Irrelevant. Ich jage etwas, das sich nicht in Zahlen messen l\u00e4sst.', scores: { innerCall: 3, vision: 1 } },
        { id: 'q4c', text: 'Wichtig als Beweis \u2013 nicht f\u00fcr mich, sondern um geh\u00f6rt zu werden.', scores: { magnetism: 2, resilience: 1 } },
        { id: 'q4d', text: 'Ich habe ihn erreicht und gemerkt: Das war es noch nicht.', scores: { innerCall: 2, vision: 2 } },
      ],
    },
    {
      id: 'q5',
      text: 'Wann f\u00fchlst du dich am lebendigsten?',
      options: [
        { id: 'q5a', text: 'Wenn ich etwas erschaffe, das noch nie existiert hat', scores: { vision: 3, innerCall: 1 } },
        { id: 'q5b', text: 'Wenn ich einen Raum betrete und sp\u00fcre, wie sich die Energie ver\u00e4ndert', scores: { magnetism: 3 } },
        { id: 'q5c', text: 'Wenn ich durch etwas durchgebrochen bin, das unm\u00f6glich schien', scores: { resilience: 3 } },
        { id: 'q5d', text: 'In seltenen Momenten absoluter Klarheit, die ich nicht erzwingen kann', scores: { innerCall: 3 } },
      ],
    },
    {
      id: 'q6',
      text: 'Deine gr\u00f6\u00dfte Angst ist...',
      options: [
        { id: 'q6a', text: '...dass ich sterbe, ohne mein volles Potenzial ausgesch\u00f6pft zu haben', scores: { innerCall: 3, vision: 1 } },
        { id: 'q6b', text: '...dass die Welt so bleibt, wie sie ist, weil niemand sie \u00e4ndert', scores: { vision: 3, resilience: 1 } },
        { id: 'q6c', text: '...Bedeutungslosigkeit. Nicht erinnert zu werden.', scores: { magnetism: 2, innerCall: 1 } },
        { id: 'q6d', text: '...dass ich aufgebe, kurz bevor der Durchbruch kommt', scores: { resilience: 3 } },
      ],
    },
    {
      id: 'q7',
      text: 'Wie gehst du mit dem Gef\u00fchl um, "anders" zu sein?',
      options: [
        { id: 'q7a', text: 'Ich habe aufgeh\u00f6rt, es zu verstecken. Es ist mein Kompass.', scores: { innerCall: 3, magnetism: 1 } },
        { id: 'q7b', text: 'Ich nutze es strategisch \u2013 zur richtigen Zeit, am richtigen Ort', scores: { vision: 2, magnetism: 2 } },
        { id: 'q7c', text: 'Es war schmerzhaft. Jetzt ist es meine Superkraft.', scores: { resilience: 2, innerCall: 2 } },
        { id: 'q7d', text: 'Ich ziehe Menschen an, die auch anders sind. Wir erkennen uns.', scores: { magnetism: 3 } },
      ],
    },
    {
      id: 'q8',
      text: 'Was w\u00fcrdest du opfern, um deine tiefste Vision zu verwirklichen?',
      options: [
        { id: 'q8a', text: 'Bequemlichkeit, Status, Verst\u00e4ndnis anderer \u2013 alles au\u00dfer meiner Integrit\u00e4t', scores: { innerCall: 3, resilience: 2 } },
        { id: 'q8b', text: 'Zeit. Ich investiere Jahre in etwas, dessen Fr\u00fcchte ich vielleicht nie sehe.', scores: { vision: 3, resilience: 1 } },
        { id: 'q8c', text: 'Beziehungen, die mich zur\u00fcckhalten. Nicht aus K\u00e4lte, aus Notwendigkeit.', scores: { resilience: 2, magnetism: 1 } },
        { id: 'q8d', text: 'Nichts. Ich glaube, dass wahre Gr\u00f6\u00dfe ohne Opfer m\u00f6glich ist.', scores: { vision: 1, magnetism: 2 } },
      ],
    },
    {
      id: 'q9',
      text: 'Stell dir vor, du k\u00f6nntest in 100 Jahren sehen, was von dir bleibt. Was hoffst du zu finden?',
      options: [
        { id: 'q9a', text: 'Ein System, eine Institution, eine Bewegung, die weiterwirkt', scores: { vision: 3, resilience: 1 } },
        { id: 'q9b', text: "Menschen, die sagen: 'Sie hat mein Leben ver\u00e4ndert'", scores: { magnetism: 3, innerCall: 1 } },
        { id: 'q9c', text: 'Ideen, die so tief eingesickert sind, dass niemand mehr wei\u00df, woher sie kamen', scores: { vision: 2, innerCall: 2 } },
        { id: 'q9d', text: 'Beweise, dass ich den Ruf beantwortet habe \u2013 egal wie es aussah', scores: { innerCall: 3 } },
      ],
    },
    {
      id: 'q10',
      text: "Wenn ein Orakel dir sagen w\u00fcrde: 'Du bist zu H\u00f6herem bestimmt' \u2013 was w\u00e4re deine erste Reaktion?",
      options: [
        { id: 'q10a', text: 'Ich wei\u00df. Die Frage war nie ob, sondern wann und wie.', scores: { innerCall: 3, vision: 1 } },
        { id: 'q10b', text: 'Zeig mir den Weg. Ich bin bereit f\u00fcr Anweisungen.', scores: { resilience: 2, magnetism: 1 } },
        { id: 'q10c', text: 'Das erkl\u00e4rt einiges. Aber was genau ist meine Aufgabe?', scores: { vision: 2, innerCall: 1 } },
        { id: 'q10d', text: 'Ich w\u00fcrde es erst glauben, wenn ich Ergebnisse sehe.', scores: { resilience: 2, vision: 1 } },
      ],
    },
  ],

  profiles: [
    {
      id: 'auserwaehlte',
      title: 'Der Auserw\u00e4hlte',
      emoji: '\uD83C\uDF1F',
      color: '#D4AF37',
      description: 'In dir brennt etwas, das sich nicht erkl\u00e4ren l\u00e4sst \u2013 ein unbeirrbares Wissen, dass dein Leben f\u00fcr etwas Gr\u00f6\u00dferes bestimmt ist. Du siehst weiter als andere, h\u00e4ltst l\u00e4nger durch als andere, und Menschen sp\u00fcren in deiner Gegenwart, dass du anders bist.',
      minScore: 0,
    },
    {
      id: 'architekt',
      title: 'Der stille Architekt',
      emoji: '\uD83C\uDFDB\uFE0F',
      color: '#5B8A9A',
      description: 'Deine Gr\u00f6\u00dfe liegt nicht in Applaus, sondern in Wirkung. Du denkst in Jahrzehnten, w\u00e4hrend andere in Quartalen planen. Du legst Fundamente, pflanzt Samen, konstruierst Systeme \u2013 nicht f\u00fcr Ruhm, sondern weil du verstehst, dass wahre Ver\u00e4nderung Zeit braucht.',
      minScore: 0,
    },
    {
      id: 'katalysator',
      title: 'Der Katalysator',
      emoji: '\u26A1',
      color: '#C45D4A',
      description: 'Deine Superkraft ist nicht Vision oder Ausdauer \u2013 es ist Transformation durch Pr\u00e4senz. Menschen ver\u00e4ndern sich in deiner N\u00e4he. Gespr\u00e4che mit dir werden zu Wendepunkten. Du musst keine Bewegung gr\u00fcnden; du BIST eine Bewegung.',
      minScore: 0,
    },
    {
      id: 'seher',
      title: 'Der Seher',
      emoji: '\uD83D\uDC41\uFE0F',
      color: '#8B5A9F',
      description: 'Du lebst zeitversetzt. Was du heute siehst, verstehen andere in f\u00fcnf Jahren. Das macht dich manchmal einsam, oft missverstanden, aber immer wertvoll. Dein Blick durchdringt Oberfl\u00e4chen, erkennt Muster, die sich erst formen.',
      minScore: 0,
    },
    {
      id: 'diamant',
      title: 'Der ungeschliffene Diamant',
      emoji: '\uD83D\uDC8E',
      color: '#4A7EB5',
      description: 'Du sp\u00fcrst es, oder? Dieses Ziehen. Dieses Wissen, dass da mehr ist. Du bist nicht am Anfang \u2013 du bist im Werden. Der Diamant ist bereits da, unter der Oberfl\u00e4che. Was noch fehlt, ist nicht Potenzial, sondern Druck, Zeit und die richtigen Umst\u00e4nde.',
      minScore: 0,
    },
  ],

  resultMapping: {
    markerId: 'quiz.destiny.v1',
    profileToTraits: {},
  },
};
