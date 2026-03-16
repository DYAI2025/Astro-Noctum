import type { QuizDefinition } from '../schema';

export const personalityQuiz: QuizDefinition = {
  id: 'quiz.personality.v1',
  title: 'Self-Care or World-Changer?',
  titleDe: 'Selbstfursorge oder Weltverbesserer?',
  subtitle: 'Discover how you distribute your energy',
  subtitleDe: 'Entdecke, wie du deine Energie verteilst',
  emoji: '\u2714\uFE0F',
  accentColor: '#D4AF37',
  scoringModel: 'multi-dimension',
  dimensions: ['focus', 'resources', 'empathy'],

  questions: [
    {
      id: 'q1',
      text: 'Ein Freund ruft dich spatabends an \u2013 er braucht jemanden zum Reden. Du bist erschopft. Was machst du?',
      options: [
        { id: 'q1a', text: 'Ich hore zu, so lange er braucht. Meine Mudigkeit kann warten.', scores: { focus: 85, resources: 80, empathy: 90 } },
        { id: 'q1b', text: 'Ich hore kurz zu und schlage vor, morgen ausfuhrlicher zu sprechen.', scores: { focus: 50, resources: 50, empathy: 60 } },
        { id: 'q1c', text: 'Ich erklare ehrlich, dass ich heute nicht mehr kann, und biete morgen an.', scores: { focus: 25, resources: 25, empathy: 40 } },
        { id: 'q1d', text: 'Ich gehe nicht ran \u2013 mein Schlaf ist wichtiger fur meine Funktionsfahigkeit.', scores: { focus: 10, resources: 10, empathy: 20 } },
      ],
    },
    {
      id: 'q2',
      text: 'Du hast unerwartet 500\u20AC bekommen. Was ist dein erster Impuls?',
      options: [
        { id: 'q2a', text: 'Endlich kann ich [mir selbst] etwas gonnen, das ich lange aufgeschoben habe.', scores: { focus: 15, resources: 10, empathy: 30 } },
        { id: 'q2b', text: 'Ich lege es zur Seite \u2013 Sicherheit geht vor.', scores: { focus: 25, resources: 20, empathy: 35 } },
        { id: 'q2c', text: 'Ich teile es \u2013 ein Teil fur mich, ein Teil fur andere.', scores: { focus: 50, resources: 55, empathy: 55 } },
        { id: 'q2d', text: 'Ich uberlege sofort, wem ich damit helfen konnte.', scores: { focus: 80, resources: 85, empathy: 75 } },
      ],
    },
    {
      id: 'q3',
      text: 'Im Team ubernimmt niemand die ungeliebte Aufgabe. Deine Reaktion?',
      options: [
        { id: 'q3a', text: 'Ich melde mich \u2013 irgendjemand muss es ja machen.', scores: { focus: 90, resources: 85, empathy: 70 } },
        { id: 'q3b', text: 'Ich warte ab. Wenn niemand anderes will, uberlege ich es mir.', scores: { focus: 45, resources: 40, empathy: 50 } },
        { id: 'q3c', text: 'Ich schlage eine faire Rotation vor.', scores: { focus: 55, resources: 50, empathy: 60 } },
        { id: 'q3d', text: 'Ich konzentriere mich auf meine Kernaufgaben \u2013 Spezialisierung ist effizienter.', scores: { focus: 20, resources: 25, empathy: 35 } },
      ],
    },
    {
      id: 'q4',
      text: 'Du siehst jemanden weinen. Was ist deine instinktive Reaktion?',
      options: [
        { id: 'q4a', text: 'Ich spure den Schmerz fast korperlich mit.', scores: { focus: 70, empathy: 95, resources: 65 } },
        { id: 'q4b', text: 'Ich mochte helfen, aber halte emotionale Distanz.', scores: { focus: 55, empathy: 55, resources: 50 } },
        { id: 'q4c', text: 'Ich frage mich kurz, was passiert ist, aber es beruhrt mich nicht lange.', scores: { focus: 30, empathy: 30, resources: 35 } },
        { id: 'q4d', text: 'Ich respektiere den privaten Moment und schaue weg.', scores: { focus: 20, empathy: 25, resources: 25 } },
      ],
    },
    {
      id: 'q5',
      text: 'Ein Bekannter bittet dich um einen grossen Gefallen, der deinen Sonntag kostet. Was denkst du?',
      options: [
        { id: 'q5a', text: '\u201ENaturlich helfe ich \u2013 dafur sind Freunde da.\u201C', scores: { focus: 85, resources: 90, empathy: 75 } },
        { id: 'q5b', text: '\u201EIch wurde gern, aber ich brauche auch meine Erholungszeit.\u201C', scores: { focus: 35, resources: 30, empathy: 50 } },
        { id: 'q5c', text: '\u201EKommt drauf an \u2013 wie wichtig ist es wirklich?\u201C', scores: { focus: 50, resources: 45, empathy: 55 } },
        { id: 'q5d', text: '\u201EMein Sonntag ist mir heilig. Ich sage hoflich ab.\u201C', scores: { focus: 15, resources: 15, empathy: 35 } },
      ],
    },
    {
      id: 'q6',
      text: 'Nach einem langen Tag hast du noch etwas Energie ubrig. Was machst du damit?',
      options: [
        { id: 'q6a', text: 'Ich rufe jemanden an, der vielleicht Gesellschaft braucht.', scores: { focus: 80, resources: 75, empathy: 80 } },
        { id: 'q6b', text: 'Ich erledige noch etwas fur morgen, um anderen Arbeit abzunehmen.', scores: { focus: 70, resources: 65, empathy: 60 } },
        { id: 'q6c', text: 'Ich gonne mir bewusst Entspannung \u2013 nur fur mich.', scores: { focus: 20, resources: 20, empathy: 40 } },
        { id: 'q6d', text: 'Ich investiere in ein personliches Projekt oder Hobby.', scores: { focus: 30, resources: 30, empathy: 45 } },
      ],
    },
    {
      id: 'q7',
      text: 'Jemand kritisiert dich unfair vor anderen. Wie gehst du damit um?',
      options: [
        { id: 'q7a', text: 'Ich versuche zu verstehen, warum die Person das tut \u2013 vielleicht hat sie selbst Probleme.', scores: { focus: 65, empathy: 85, resources: 55 } },
        { id: 'q7b', text: 'Ich verteidige mich sachlich und setze Grenzen.', scores: { focus: 35, empathy: 45, resources: 40 } },
        { id: 'q7c', text: 'Ich reagiere kaum \u2013 die Meinung anderer definiert mich nicht.', scores: { focus: 25, empathy: 35, resources: 30 } },
        { id: 'q7d', text: 'Es trifft mich, aber ich zeige es nicht.', scores: { focus: 45, empathy: 55, resources: 45 } },
      ],
    },
    {
      id: 'q8',
      text: 'Du hast nur Zeit fur eines: Selbstpflege oder einem Freund helfen. Was wahlst du?',
      options: [
        { id: 'q8a', text: 'Dem Freund helfen \u2013 ich kann mich spater um mich kummern.', scores: { focus: 90, resources: 95, empathy: 80 } },
        { id: 'q8b', text: 'Es kommt auf die Dringlichkeit an \u2013 echte Notfalle gehen vor.', scores: { focus: 55, resources: 50, empathy: 60 } },
        { id: 'q8c', text: 'Selbstpflege \u2013 ich kann nur helfen, wenn ich selbst stabil bin.', scores: { focus: 15, resources: 15, empathy: 40 } },
        { id: 'q8d', text: 'Ich versuche beides irgendwie zu kombinieren.', scores: { focus: 60, resources: 55, empathy: 65 } },
      ],
    },
    {
      id: 'q9',
      text: 'Was gibt dir langfristig mehr Energie?',
      options: [
        { id: 'q9a', text: 'Zu wissen, dass ich anderen geholfen habe.', scores: { focus: 85, resources: 80, empathy: 85 } },
        { id: 'q9b', text: 'Eine Balance aus Geben und Selbstfursorge.', scores: { focus: 50, resources: 50, empathy: 55 } },
        { id: 'q9c', text: 'Zeit fur mich selbst \u2013 Aufladen ist essentiell.', scores: { focus: 20, resources: 20, empathy: 40 } },
        { id: 'q9d', text: 'Personliche Erfolge und Wachstum.', scores: { focus: 30, resources: 30, empathy: 45 } },
      ],
    },
    {
      id: 'q10',
      text: 'Zum Abschluss: Was treibt dich im Kern an?',
      options: [
        { id: 'q10a', text: 'Die Welt ein kleines Stuck besser zu machen \u2013 fur andere.', scores: { focus: 95, resources: 90, empathy: 85 } },
        { id: 'q10b', text: 'Mein eigenes Potenzial voll zu entfalten.', scores: { focus: 20, resources: 25, empathy: 40 } },
        { id: 'q10c', text: 'Echte Verbindungen zu Menschen aufzubauen.', scores: { focus: 65, resources: 60, empathy: 90 } },
        { id: 'q10d', text: 'Ein gutes, ausgeglichenes Leben zu fuhren.', scores: { focus: 45, resources: 45, empathy: 55 } },
      ],
    },
  ],

  profiles: [
    {
      id: 'weltverbesserer',
      title: 'Der Weltverbesserer',
      emoji: '\uD83C\uDF0D',
      color: '#6CA192',
      description: 'Du lebst mit einem tiefen Bewusstsein fur das Wohlergehen anderer. Empathie ist fur dich keine Anstrengung, sondern dein naturlicher Modus. Deine Fahigkeit, Bedurfnisse zu erkennen und zu handeln, macht dich zu einem naturlichen Katalysator fur positive Veranderung.',
      thresholds: { focus: 60, resources: 60, empathy: 55 },
      priority: 1,
    },
    {
      id: 'eigenstaendiger',
      title: 'Der Eigenstandige',
      emoji: '\uD83C\uDFD4\uFE0F',
      color: '#5B8A9A',
      description: 'Du hast verstanden, was viele erst spat lernen: Man kann nur geben, was man hat. Deine Fahigkeit zur Selbstfursorge ist keine Selbstsucht, sondern Weisheit. Du baust ein stabiles Fundament, von dem aus du nachhaltig wirken kannst.',
      thresholds: { focus: -40, resources: -40, empathy: -45 },
      priority: 1,
    },
    {
      id: 'ausgewogener',
      title: 'Der Ausgewogene',
      emoji: '\u2696\uFE0F',
      color: '#D4AF37',
      description: 'Du hast das geschafft, woran viele scheitern: ein echtes Gleichgewicht zwischen Selbstfursorge und Fursorge fur andere. Diese Balance ist nicht statisch, sondern ein dynamischer Tanz, den du intuitiv beherrschst.',
      thresholds: { focus: 40, resources: 40 },
      priority: 0,
    },
    {
      id: 'strategischer_geber',
      title: 'Der Strategische Geber',
      emoji: '\uD83C\uDFAF',
      color: '#E8C878',
      description: 'Du hilfst \u2013 aber mit Verstand. Deine Fursorge fur andere ist durchdacht: Du fragst dich, wo dein Beitrag den grossten Unterschied macht. Diese Kombination aus Empathie und Pragmatismus macht deine Hilfe besonders wertvoll.',
      thresholds: { focus: 45, resources: 40 },
      priority: 0,
    },
    {
      id: 'empathischer_schwamm',
      title: 'Der Empathische Schwamm',
      emoji: '\uD83D\uDCA7',
      color: '#7BA8B8',
      description: 'Deine empathische Antenne ist auf voller Empfangsstarke. Du nimmst die Emotionen anderer auf wie ein Schwamm \u2013 das macht dich zu einem Menschen, bei dem andere sich wirklich verstanden fuhlen.',
      thresholds: { empathy: 70 },
      priority: 2,
    },
  ],

  resultMapping: {
    markerId: 'quiz.personality.v1',
    profileToTraits: {},
  },
};
