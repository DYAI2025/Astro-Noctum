import type { QuizDefinition } from '../schema';

export const krafttierQuiz: QuizDefinition = {
  id: 'quiz.krafttier.v1',
  title: 'Spirit Animal',
  titleDe: 'Krafttier',
  subtitle: 'Discover the ancient guardian slumbering in your soul',
  subtitleDe: 'Entdecke das archetypische Krafttier, das seit jeher \u00fcber dich wacht',
  emoji: '\uD83D\uDC3A',
  accentColor: '#D4AF37',
  scoringModel: 'profile-driven',
  dimensions: [
    'mut', 'instinkt', 'sozial', 'weisheit', 'schatten',
    'klarheit', 'freiheit', 'neugier', 'anpassung',
    'erdung', 'flow', 'freude', 'vorsicht',
  ],

  questions: [
    {
      id: 'q1',
      context: 'Der Nebel lichtet sich...',
      text: 'Du stehst vor einem unbekannten Pfad im Wald. Wie reagierst du?',
      options: [
        { id: 'q1a', text: 'Ich gehe voran \u2013 Neuland ruft nach mir', scores: { mut: 5, instinkt: 3, freiheit: 4 } },
        { id: 'q1b', text: 'Ich beobachte erst, lese die Zeichen', scores: { weisheit: 5, klarheit: 4, vorsicht: 3 } },
        { id: 'q1c', text: 'Ich suche Begleitung f\u00fcr die Reise', scores: { sozial: 5, erdung: 3, anpassung: 2 } },
        { id: 'q1d', text: 'Ich finde meinen eigenen Weg abseits des Pfades', scores: { neugier: 4, freiheit: 5, instinkt: 3 } },
      ],
    },
    {
      id: 'q2',
      context: 'In einer stillen Nacht...',
      text: 'Welche Energie zieht dich am meisten an?',
      options: [
        { id: 'q2a', text: 'Die Kraft der Gemeinschaft \u2013 zusammen sind wir stark', scores: { sozial: 5, erdung: 4, mut: 2 } },
        { id: 'q2b', text: 'Die Stille der Betrachtung \u2013 Weisheit kommt von innen', scores: { weisheit: 5, schatten: 3, vorsicht: 4 } },
        { id: 'q2c', text: 'Das Feuer der Leidenschaft \u2013 leben ohne Grenzen', scores: { mut: 5, instinkt: 4, freiheit: 3 } },
        { id: 'q2d', text: 'Das Spielerische des Moments \u2013 Freude ist die Antwort', scores: { freude: 5, flow: 4, anpassung: 3 } },
      ],
    },
    {
      id: 'q3',
      context: 'Ein Konflikt entsteht...',
      text: 'Wie gehst du mit Herausforderungen um?',
      options: [
        { id: 'q3a', text: 'Ich stelle mich direkt \u2013 Konfrontation bringt Klarheit', scores: { mut: 5, instinkt: 4, klarheit: 3 } },
        { id: 'q3b', text: 'Ich suche den diplomatischen Weg', scores: { sozial: 4, anpassung: 5, weisheit: 3 } },
        { id: 'q3c', text: 'Ich beobachte aus der Distanz und warte ab', scores: { weisheit: 4, schatten: 4, vorsicht: 5 } },
        { id: 'q3d', text: 'Ich finde kreative Umwege', scores: { neugier: 5, anpassung: 4, flow: 3 } },
      ],
    },
    {
      id: 'q4',
      context: 'Der Vollmond scheint...',
      text: 'Wann f\u00fchlst du dich am lebendigsten?',
      options: [
        { id: 'q4a', text: 'Umgeben von Menschen, die ich liebe', scores: { sozial: 5, freude: 4, erdung: 3 } },
        { id: 'q4b', text: 'Allein in der Natur, eins mit allem', scores: { freiheit: 5, instinkt: 4, erdung: 3 } },
        { id: 'q4c', text: 'Wenn ich ein R\u00e4tsel gel\u00f6st habe', scores: { weisheit: 5, neugier: 4, klarheit: 3 } },
        { id: 'q4d', text: 'In Momenten purer Bewegung und Aktion', scores: { mut: 4, flow: 5, instinkt: 4 } },
      ],
    },
    {
      id: 'q5',
      context: 'Das Wasser ruft...',
      text: 'Was bedeutet St\u00e4rke f\u00fcr dich?',
      options: [
        { id: 'q5a', text: 'Furchtlos voranzugehen, egal was kommt', scores: { mut: 5, instinkt: 3, freiheit: 3 } },
        { id: 'q5b', text: 'Die Ruhe zu bewahren im Sturm', scores: { erdung: 5, weisheit: 4, klarheit: 3 } },
        { id: 'q5c', text: 'Andere zu sch\u00fctzen und zu f\u00fchren', scores: { sozial: 5, mut: 3, erdung: 3 } },
        { id: 'q5d', text: 'Sich anzupassen ohne sich selbst zu verlieren', scores: { anpassung: 5, flow: 4, neugier: 3 } },
      ],
    },
    {
      id: 'q6',
      context: 'Ein Geheimnis wartet...',
      text: 'Was treibt dich am meisten an?',
      options: [
        { id: 'q6a', text: 'Der Drang, das Unbekannte zu erforschen', scores: { neugier: 5, freiheit: 4, mut: 3 } },
        { id: 'q6b', text: 'Das Bed\u00fcrfnis nach tiefem Verst\u00e4ndnis', scores: { weisheit: 5, schatten: 4, klarheit: 3 } },
        { id: 'q6c', text: 'Die Sehnsucht nach Verbindung', scores: { sozial: 5, freude: 3, erdung: 3 } },
        { id: 'q6d', text: 'Der Wunsch, etwas Bleibendes zu schaffen', scores: { erdung: 5, mut: 3, klarheit: 4 } },
      ],
    },
    {
      id: 'q7',
      context: 'Die Schatten werden l\u00e4nger...',
      text: 'Wie verarbeitest du schwierige Zeiten?',
      options: [
        { id: 'q7a', text: 'Ich ziehe mich zur\u00fcck und reflektiere', scores: { weisheit: 4, schatten: 5, vorsicht: 4 } },
        { id: 'q7b', text: 'Ich suche Trost bei meinen Liebsten', scores: { sozial: 5, erdung: 4, freude: 2 } },
        { id: 'q7c', text: 'Ich handle \u2013 Bewegung heilt', scores: { mut: 4, instinkt: 5, flow: 3 } },
        { id: 'q7d', text: 'Ich finde Humor und Leichtigkeit', scores: { freude: 5, anpassung: 4, flow: 3 } },
      ],
    },
    {
      id: 'q8',
      context: 'Der Wind tr\u00e4gt Geschichten...',
      text: 'Welche Eigenschaft bewunderst du am meisten?',
      options: [
        { id: 'q8a', text: 'Unersch\u00fctterliche Loyalit\u00e4t', scores: { sozial: 5, erdung: 4, mut: 2 } },
        { id: 'q8b', text: 'Scharfsinnige Weisheit', scores: { weisheit: 5, klarheit: 4, schatten: 3 } },
        { id: 'q8c', text: 'Grenzenlose Freiheit', scores: { freiheit: 5, mut: 4, instinkt: 3 } },
        { id: 'q8d', text: 'Ansteckende Lebensfreude', scores: { freude: 5, flow: 4, sozial: 3 } },
      ],
    },
    {
      id: 'q9',
      context: 'Am Scheideweg...',
      text: 'Wie triffst du wichtige Entscheidungen?',
      options: [
        { id: 'q9a', text: 'Aus dem Bauch heraus \u2013 mein Instinkt t\u00e4uscht selten', scores: { instinkt: 5, mut: 4, flow: 3 } },
        { id: 'q9b', text: 'Nach gr\u00fcndlicher Analyse aller Optionen', scores: { weisheit: 5, vorsicht: 4, klarheit: 4 } },
        { id: 'q9c', text: 'Im Gespr\u00e4ch mit Menschen, denen ich vertraue', scores: { sozial: 5, erdung: 3, anpassung: 3 } },
        { id: 'q9d', text: 'Ich probiere einfach aus und lerne daraus', scores: { neugier: 5, anpassung: 4, freude: 3 } },
      ],
    },
    {
      id: 'q10',
      context: 'Das Echo deiner Seele...',
      text: 'Was ist deine gr\u00f6\u00dfte Gabe?',
      options: [
        { id: 'q10a', text: 'Mut \u2013 ich gehe, wohin andere nicht wagen', scores: { mut: 5, freiheit: 4, instinkt: 3 } },
        { id: 'q10b', text: 'Empathie \u2013 ich f\u00fchle, was andere verbergen', scores: { sozial: 5, weisheit: 3, schatten: 3 } },
        { id: 'q10c', text: 'Klarheit \u2013 ich sehe durch den Nebel', scores: { klarheit: 5, weisheit: 4, vorsicht: 3 } },
        { id: 'q10d', text: 'Anpassung \u2013 ich flie\u00dfe wie Wasser', scores: { anpassung: 5, flow: 4, freude: 3 } },
      ],
    },
    {
      id: 'q11',
      context: 'Das Feuer brennt...',
      text: 'Was gibt dir Kraft, wenn alles dunkel scheint?',
      options: [
        { id: 'q11a', text: 'Der Glaube an mich selbst', scores: { mut: 5, erdung: 4, instinkt: 3 } },
        { id: 'q11b', text: 'Die Verbindung zu meinem Rudel', scores: { sozial: 5, freude: 3, erdung: 4 } },
        { id: 'q11c', text: 'Das Wissen, dass alles seinen Sinn hat', scores: { weisheit: 5, schatten: 4, klarheit: 3 } },
        { id: 'q11d', text: 'Die Hoffnung auf neue Abenteuer', scores: { freiheit: 4, neugier: 5, flow: 4 } },
      ],
    },
    {
      id: 'q12',
      context: 'Die Vision wird klar...',
      text: 'Welches Element ruft am lautesten nach dir?',
      options: [
        { id: 'q12a', text: 'Erde \u2013 stark, best\u00e4ndig, verwurzelt', scores: { erdung: 5, mut: 4, sozial: 3 } },
        { id: 'q12b', text: 'Luft \u2013 frei, erhaben, klar', scores: { freiheit: 5, klarheit: 4, weisheit: 3 } },
        { id: 'q12c', text: 'Wasser \u2013 flie\u00dfend, spielerisch, tief', scores: { flow: 5, freude: 4, anpassung: 4 } },
        { id: 'q12d', text: 'Schatten \u2013 mysteri\u00f6s, weise, verborgen', scores: { schatten: 5, weisheit: 4, neugier: 3 } },
      ],
    },
  ],

  profiles: [
    {
      id: 'wolf',
      title: 'Der Wolf \u2013 H\u00fcter des Rudels',
      emoji: '\uD83D\uDC3A',
      color: '#6CA192',
      description: 'Der Wolf erwacht in dir \u2013 loyal, instinktiv und zutiefst verbunden mit deinem Rudel. Du f\u00fchrst nicht durch Dominanz, sondern durch das tiefe Verst\u00e4ndnis, dass wahre St\u00e4rke in der Gemeinschaft liegt.',
    },
    {
      id: 'owl',
      title: 'Die Eule \u2013 Seherin der Nacht',
      emoji: '\uD83E\uDD89',
      color: '#5C4D9A',
      description: 'Die Eule wacht in dir \u2013 weise, geduldig und mit der Gabe, durch den Schleier der Illusion zu blicken. Du siehst, was anderen verborgen bleibt, und findest Weisheit in der Stille der Nacht.',
    },
    {
      id: 'eagle',
      title: 'Der Adler \u2013 Herrscher der L\u00fcfte',
      emoji: '\uD83E\uDD85',
      color: '#D4AF37',
      description: 'Der Adler erwacht in dir \u2013 frei, weitblickend und mit dem Mut, \u00fcber alle Grenzen hinauszufliegen. Du siehst das gro\u00dfe Ganze und scheust nicht davor, deinen eigenen Weg in den Himmel zu bahnen.',
    },
    {
      id: 'bear',
      title: 'Der B\u00e4r \u2013 W\u00e4chter der Erde',
      emoji: '\uD83D\uDC3B',
      color: '#8B5A2B',
      description: 'Der B\u00e4r erwacht in dir \u2013 stark, geerdet und mit der Kraft der stillen Beharrlichkeit. Du wei\u00dft, wann es Zeit ist zu handeln und wann es Zeit ist zu ruhen.',
    },
    {
      id: 'fox',
      title: 'Der Fuchs \u2013 Meister der Anpassung',
      emoji: '\uD83E\uDD8A',
      color: '#E07B39',
      description: 'Der Fuchs erwacht in dir \u2013 clever, neugierig und mit der Gabe, in jeder Situation den richtigen Weg zu finden. Du tanzt zwischen den Welten und findest L\u00f6sungen, wo andere nur Probleme sehen.',
    },
    {
      id: 'dolphin',
      title: 'Der Delfin \u2013 Botschafter der Freude',
      emoji: '\uD83D\uDC2C',
      color: '#4A7EB5',
      description: 'Der Delfin lebt in dir \u2013 spielerisch, kommunikativ und mit einer ansteckenden Lebensfreude. Du gleitest durch die Wellen des Lebens mit Anmut und findest selbst in tiefen Gew\u00e4ssern Grund zur Freude.',
    },
  ],

  resultMapping: {
    markerId: 'quiz.krafttier.v1',
    profileToTraits: {},
  },
};
