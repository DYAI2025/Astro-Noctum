import type { QuizDefinition } from '../schema';

export const auraColorsQuiz: QuizDefinition = {
  id: 'quiz.aura_colors.v1',
  title: 'Your Aura Colors',
  titleDe: 'Deine Aurafarben',
  subtitle: 'Discover the invisible light of your soul',
  subtitleDe: 'Entdecke das unsichtbare Licht deiner Seele',
  emoji: '\uD83D\uDD2E',
  accentColor: '#D4AF37',
  scoringModel: 'profile-driven',
  dimensions: ['energiefluss', 'rhythmus', 'wahrnehmung', 'resonanz'],

  questions: [
    {
      id: 'q1',
      context: 'Energiefluss',
      text: 'Es ist fr\u00fcher Morgen. Du wachst auf, noch bevor der Wecker klingelt.',
      options: [
        { id: 'q1a', text: 'Ich bleibe noch liegen, lasse die Gedanken kommen und gehen. Der Tag kann warten.', scores: { energiefluss: 1 } },
        { id: 'q1b', text: 'Ich checke kurz das Handy \u2014 nicht aus Stress, sondern aus Neugier auf die Welt.', scores: { energiefluss: 4 } },
        { id: 'q1c', text: 'Ich stehe auf und starte meinen Tag. Energie, die still liegt, f\u00fchlt sich verschwendet an.', scores: { energiefluss: 5 } },
        { id: 'q1d', text: 'Ich sp\u00fcre erst in mich hinein. Wie f\u00fchlt sich heute an? Dann entscheide ich, wie ich beginne.', scores: { energiefluss: 2 } },
      ],
    },
    {
      id: 'q2',
      context: 'Energiefluss',
      text: 'Du verbringst einen Tag allein. Niemand erwartet etwas von dir.',
      options: [
        { id: 'q2a', text: 'Ich genie\u00dfe die Stille. Zeit zum Lesen, Nachdenken, einfach Sein.', scores: { energiefluss: 1 } },
        { id: 'q2b', text: 'Ich plane irgendwann rauszugehen. Ein Caf\u00e9, ein Park \u2014 Menschen beobachten.', scores: { energiefluss: 3 } },
        { id: 'q2c', text: 'Ich rufe jemanden an oder schreibe Nachrichten. Alleinsein ist sch\u00f6n, aber geteilte Energie ist besser.', scores: { energiefluss: 5 } },
        { id: 'q2d', text: 'Ich mache ein Projekt, das ich vor mir hergeschoben habe. Endlich Raum daf\u00fcr.', scores: { energiefluss: 2 } },
      ],
    },
    {
      id: 'q3',
      context: 'Energiefluss',
      text: 'Nach einem langen, intensiven Tag f\u00fchlst du dich ersch\u00f6pft.',
      options: [
        { id: 'q3a', text: 'Ich brauche absolute Ruhe. Kopfh\u00f6rer rein, Welt aus.', scores: { energiefluss: 1 } },
        { id: 'q3b', text: 'Ein ruhiger Spaziergang hilft. Bewegung ohne Ziel.', scores: { energiefluss: 2 } },
        { id: 'q3c', text: 'Ich brauche einen Menschen, dem ich alles erz\u00e4hlen kann. Das Aussprechen hilft.', scores: { energiefluss: 4 } },
        { id: 'q3d', text: 'Ich gehe unter Leute \u2014 ein Abend mit Freunden l\u00e4dt mich auf, selbst wenn ich m\u00fcde bin.', scores: { energiefluss: 5 } },
      ],
    },
    {
      id: 'q4',
      context: 'Rhythmus',
      text: 'Ein Projekt, an dem du arbeitest, verl\u00e4uft anders als geplant.',
      options: [
        { id: 'q4a', text: 'Ich passe mich an. Pl\u00e4ne sind Richtungen, keine Gesetze.', scores: { rhythmus: 5 } },
        { id: 'q4b', text: 'Ich halte kurz inne und \u00fcberdenke die Strategie. Dann weiter.', scores: { rhythmus: 3 } },
        { id: 'q4c', text: 'Ich versuche, zum urspr\u00fcnglichen Plan zur\u00fcckzukehren. Struktur gibt mir Sicherheit.', scores: { rhythmus: 1 } },
        { id: 'q4d', text: 'Ich sehe es als Chance \u2014 manchmal f\u00fchren Umwege zu besseren Zielen.', scores: { rhythmus: 4 } },
      ],
    },
    {
      id: 'q5',
      context: 'Rhythmus',
      text: 'Du betrittst einen Raum voller Fremder bei einer Veranstaltung.',
      options: [
        { id: 'q5a', text: 'Ich beobachte erst. Wer ist hier? Wie ist die Dynamik? Dann w\u00e4hle ich.', scores: { rhythmus: 1 } },
        { id: 'q5b', text: 'Ich suche eine vertraute Ecke oder eine Aufgabe \u2014 das Buffet checken, zum Beispiel.', scores: { rhythmus: 2 } },
        { id: 'q5c', text: 'Ich gehe auf die erste Person zu, die offen wirkt. Smalltalk ist eine F\u00e4higkeit.', scores: { rhythmus: 4 } },
        { id: 'q5d', text: 'Ich lasse mich treiben. Gespr\u00e4che passieren oder nicht. Kein Druck.', scores: { rhythmus: 5 } },
      ],
    },
    {
      id: 'q6',
      context: 'Rhythmus',
      text: 'Wie w\u00fcrdest du deinen idealen Lebensweg beschreiben?',
      options: [
        { id: 'q6a', text: 'Ein tiefes Tal mit hohen Bergen drumherum. Gesch\u00fctzt, ruhig, mein Reich.', scores: { rhythmus: 1 } },
        { id: 'q6b', text: 'Ein Fluss, der sich durch verschiedene Landschaften windet. Stetig, aber wandelnd.', scores: { rhythmus: 3 } },
        { id: 'q6c', text: 'Ein Vogel, der von Ast zu Ast springt. Freiheit, Neugier, Leichtigkeit.', scores: { rhythmus: 5 } },
        { id: 'q6d', text: 'Ein Baum mit tiefen Wurzeln und \u00c4sten, die sich dem Wind beugen.', scores: { rhythmus: 2 } },
      ],
    },
    {
      id: 'q7',
      context: 'Wahrnehmungsmodus',
      text: 'Du musst eine wichtige Entscheidung treffen.',
      options: [
        { id: 'q7a', text: 'Ich sammle Fakten, mache vielleicht eine Pro-Contra-Liste. Daten beruhigen.', scores: { wahrnehmung: 1 } },
        { id: 'q7b', text: 'Ich sp\u00fcre in meinen Bauch. Die Antwort ist da, ich muss sie nur h\u00f6ren.', scores: { wahrnehmung: 5 } },
        { id: 'q7c', text: 'Ich spreche mit Menschen, die ich respektiere. Ihre Perspektiven helfen.', scores: { wahrnehmung: 3 } },
        { id: 'q7d', text: 'Ich schlafe eine Nacht dar\u00fcber. Die Antwort kommt, wenn ich loslasse.', scores: { wahrnehmung: 4 } },
      ],
    },
    {
      id: 'q8',
      context: 'Wahrnehmungsmodus',
      text: 'Du begegnest jemandem zum ersten Mal.',
      options: [
        { id: 'q8a', text: 'Ich achte auf K\u00f6rpersprache, Energie \u2014 das Ungesagte sagt mehr als Worte.', scores: { wahrnehmung: 5 } },
        { id: 'q8b', text: 'Ich h\u00f6re zu, was sie sagen und wie. Die Wortwahl verr\u00e4t viel.', scores: { wahrnehmung: 2 } },
        { id: 'q8c', text: 'Ich beobachte, wie sie mit anderen interagieren. Kontext ist alles.', scores: { wahrnehmung: 1 } },
        { id: 'q8d', text: 'Ich folge meinem Gef\u00fchl. Manchmal wei\u00df man einfach, ob es passt.', scores: { wahrnehmung: 4 } },
      ],
    },
    {
      id: 'q9',
      context: 'Wahrnehmungsmodus',
      text: 'Wenn du an deine erfolgreichsten Momente denkst:',
      options: [
        { id: 'q9a', text: 'Sie kamen aus sorgf\u00e4ltiger Vorbereitung. Ich hatte einen Plan.', scores: { wahrnehmung: 1 } },
        { id: 'q9b', text: 'Ich wusste einfach, was zu tun war. Keine Erkl\u00e4rung, nur Gewissheit.', scores: { wahrnehmung: 5 } },
        { id: 'q9c', text: 'Ich habe auf andere geh\u00f6rt und zur richtigen Zeit das Richtige getan.', scores: { wahrnehmung: 3 } },
        { id: 'q9d', text: 'Es war eine Mischung \u2014 Vorbereitung trifft auf Instinkt im entscheidenden Moment.', scores: { wahrnehmung: 4 } },
      ],
    },
    {
      id: 'q10',
      context: 'Soziale Resonanz',
      text: 'Du bist in einem Gespr\u00e4ch mit einem Freund, der gerade etwas Schwieriges durchmacht.',
      options: [
        { id: 'q10a', text: 'Ich h\u00f6re zu und halte den Raum. Manchmal ist Pr\u00e4senz wichtiger als Worte.', scores: { resonanz: 1 } },
        { id: 'q10b', text: 'Ich sp\u00fcre ihren Schmerz fast k\u00f6rperlich. Empathie ist kein Schalter.', scores: { resonanz: 2 } },
        { id: 'q10c', text: 'Ich versuche zu helfen \u2014 konkrete Vorschl\u00e4ge, L\u00f6sungen, Perspektiven.', scores: { resonanz: 4 } },
        { id: 'q10d', text: 'Ich teile eigene Erfahrungen. Manchmal hilft zu wissen, dass man nicht allein ist.', scores: { resonanz: 5 } },
      ],
    },
    {
      id: 'q11',
      context: 'Soziale Resonanz',
      text: 'Du betrittst einen Raum nach einem emotionalen Gespr\u00e4ch zwischen anderen.',
      options: [
        { id: 'q11a', text: 'Ich sp\u00fcre sofort, dass etwas war. Die Luft f\u00fchlt sich anders an.', scores: { resonanz: 1 } },
        { id: 'q11b', text: 'Ich bemerke es erst, wenn jemand etwas sagt oder sich seltsam verh\u00e4lt.', scores: { resonanz: 4 } },
        { id: 'q11c', text: 'Ich nehme es wahr, aber es beeinflusst mich nicht stark. Ich bin bei mir.', scores: { resonanz: 5 } },
        { id: 'q11d', text: 'Ich nehme die Schwere mit. Es dauert, bis ich sie wieder loswerde.', scores: { resonanz: 2 } },
      ],
    },
    {
      id: 'q12',
      context: 'Soziale Resonanz',
      text: 'Wenn du an deine Rolle in Gruppen denkst:',
      options: [
        { id: 'q12a', text: 'Ich bin oft der Ruhepol. Andere kommen zu mir, wenn sie Halt brauchen.', scores: { resonanz: 1 } },
        { id: 'q12b', text: 'Ich passe mich an. Jede Gruppe braucht etwas anderes, und ich f\u00fclle die L\u00fccke.', scores: { resonanz: 2 } },
        { id: 'q12c', text: 'Ich bringe Energie ein. Oft bin ich es, der Ideen oder Pl\u00e4ne vorantreibt.', scores: { resonanz: 5 } },
        { id: 'q12d', text: 'Ich verbinde Menschen. Ich sehe, wer zusammenpasst, und baue Br\u00fccken.', scores: { resonanz: 4 } },
      ],
    },
  ],

  profiles: [
    {
      id: 'rot',
      title: 'Leuchtendes Rot',
      emoji: '\uD83D\uDD34',
      color: '#C45D4A',
      description: 'Du bist die Kraft, die R\u00e4ume ver\u00e4ndert, noch bevor du ein Wort sagst \u2014 pure Lebensenergie in menschlicher Form.',
    },
    {
      id: 'orange',
      title: 'Warmes Orange',
      emoji: '\uD83D\uDFE0',
      color: '#E07B39',
      description: 'Du bist die Freude, die ansteckend ist \u2014 der Mensch, neben dem sich das Leben ein bisschen mehr nach Abenteuer anf\u00fchlt.',
    },
    {
      id: 'gelb',
      title: 'Goldgelb',
      emoji: '\uD83D\uDFE1',
      color: '#D4AF37',
      description: 'Du bist die Sonne im Raum \u2014 Klarheit, W\u00e4rme und die Kraft, andere zum Wachsen zu bringen.',
    },
    {
      id: 'gruen',
      title: 'Tiefes Gr\u00fcn',
      emoji: '\uD83D\uDFE2',
      color: '#4A8F6F',
      description: 'Du bist der Baum, an dem sich andere ausruhen \u2014 ohne zu wissen, wie tief deine Wurzeln reichen.',
    },
    {
      id: 'blau',
      title: 'Klares Blau',
      emoji: '\uD83D\uDD35',
      color: '#4A7EB5',
      description: 'Du bist der stille See, in dem andere ihr Spiegelbild finden \u2014 auch wenn sie nicht immer bereit sind, hinzusehen.',
    },
    {
      id: 'indigo',
      title: 'Mystisches Indigo',
      emoji: '\uD83D\uDFE3',
      color: '#5C4D9A',
      description: 'Du siehst, was hinter den Dingen liegt \u2014 und tr\u00e4gst das Gewicht des Wissens mit Anmut.',
    },
    {
      id: 'violett',
      title: 'Transzendentes Violett',
      emoji: '\uD83D\uDFEA',
      color: '#8B5A9F',
      description: 'Du lebst mit einem Fu\u00df in einer Welt, die andere nur ahnen k\u00f6nnen \u2014 und bist die Br\u00fccke zwischen dem Hier und dem Dahinter.',
    },
    {
      id: 'tuerkis',
      title: 'Schimmerndes T\u00fcrkis',
      emoji: '\uD83D\uDC8E',
      color: '#3AA19A',
      description: 'Du bist die Br\u00fccke zwischen Herz und Verstand \u2014 ein \u00dcbersetzer zwischen Welten, die nicht wissen, dass sie sich brauchen.',
    },
    {
      id: 'rosa',
      title: 'Sanftes Rosa',
      emoji: '\uD83C\uDF38',
      color: '#D4789A',
      description: 'Du bist die Erinnerung daran, dass Sanftheit eine St\u00e4rke ist \u2014 und dass wahre Liebe keine Bedingungen kennt.',
    },
  ],

  resultMapping: {
    markerId: 'quiz.aura_colors.v1',
    profileToTraits: {},
  },
};
