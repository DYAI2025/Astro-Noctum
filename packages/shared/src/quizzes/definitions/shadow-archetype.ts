import type { QuizDefinition } from '../schema';

export const shadowArchetypeQuiz: QuizDefinition = {
  id: 'shadow_archetype_01',
  title: 'What Lurks Beneath Your Smile?',
  titleDe: 'Was lauert hinter deinem Lächeln?',
  subtitle: 'A look at the side of you nobody gets to see.',
  subtitleDe: 'Ein Blick auf die Seite von dir, die niemand zu sehen bekommt.',
  emoji: '\uD83D\uDD25',
  accentColor: '#C41E3A',
  scoringModel: 'multi-dimension',
  dimensions: ['destroyer', 'orphan', 'tyrant', 'trickster'],

  questions: [
    // Q1: Public humiliation
    {
      id: 'q1',
      context: 'Du bist auf einer Dinnerparty. Jemand erzählt eine Geschichte, über die alle lachen — aber der Witz geht leise auf deine Kosten. Niemand scheint es zu bemerken.',
      text: 'Was passiert in dir?',
      options: [
        { id: 'q1a', text: 'Ein heißer Stich steigt in mir auf. Ich lächle, aber ich formuliere innerlich schon meine Antwort.', scores: { destroyer: 3, tyrant: 1, orphan: 0, trickster: 0 } },
        { id: 'q1b', text: 'Ich fühle mich unsichtbar. Als könnte ich den Tisch verlassen und niemand würde es merken.', scores: { orphan: 3, destroyer: 0, tyrant: 0, trickster: 0 } },
        { id: 'q1c', text: 'Ich notiere es innerlich. Diese Person hat sich gerade verraten. Das werde ich mir merken.', scores: { tyrant: 3, destroyer: 1, orphan: 0, trickster: 0 } },
        { id: 'q1d', text: 'Ich lache lauter als alle anderen und lenke den Witz auf jemand anderes um.', scores: { trickster: 3, orphan: 1, destroyer: 0, tyrant: 0 } },
      ],
    },
    // Q2: Betrayed trust
    {
      id: 'q2',
      context: 'Du erfährst, dass ein enger Freund hinter deinem Rücken über deine privaten Kämpfe gesprochen hat — nicht bösartig, aber sorglos.',
      text: 'Was ist dein erster Impuls?',
      options: [
        { id: 'q2a', text: 'Die Brücke abbrechen. Wenn Vertrauen gebrochen ist, ist es gebrochen.', scores: { destroyer: 3, orphan: 1, tyrant: 0, trickster: 0 } },
        { id: 'q2b', text: 'Nichts sagen. Mich langsam zurückziehen. Die werden es irgendwann merken.', scores: { orphan: 3, tyrant: 1, destroyer: 0, trickster: 0 } },
        { id: 'q2c', text: 'Direkt konfrontieren. Die sollen spüren, was sie getan haben.', scores: { tyrant: 3, destroyer: 1, orphan: 0, trickster: 0 } },
        { id: 'q2d', text: 'Öffentlich drüber lachen, aber ab jetzt weniger teilen. Schwerer lesbar werden.', scores: { trickster: 3, tyrant: 1, orphan: 0, destroyer: 0 } },
      ],
    },
    // Q3: Uninvited solitude
    {
      id: 'q3',
      context: 'Du bist allein an einem Samstagabend. Es ist nichts ausgefallen — du wurdest einfach nirgendwo eingeladen.',
      text: 'Wohin wandern deine Gedanken?',
      options: [
        { id: 'q3a', text: 'Ein tiefer Stich. Als wäre etwas grundlegend falsch an mir.', scores: { orphan: 3, destroyer: 0, tyrant: 0, trickster: 0 } },
        { id: 'q3b', text: 'Gut. Ich brauche niemanden. Ich bau was. Erschaffe was. Beweis was.', scores: { tyrant: 2, destroyer: 2, orphan: 0, trickster: 0 } },
        { id: 'q3c', text: 'Ich fange an Leuten zu schreiben. Ich zieh mein eigenes Ding auf. Ich weigere mich, damit zu sitzen.', scores: { trickster: 3, orphan: 1, destroyer: 0, tyrant: 0 } },
        { id: 'q3d', text: 'Ich spüre den Drang, Social Media zu löschen, meine Nummer zu ändern, zu verschwinden.', scores: { destroyer: 3, orphan: 2, tyrant: 0, trickster: 0 } },
      ],
    },
    // Q4: Intimate confrontation
    {
      id: 'q4',
      context: 'Dein Partner sagt: \u201EManchmal habe ich das Gefühl, ich kenne dich gar nicht wirklich.\u201C',
      text: 'Was fühlst du?',
      options: [
        { id: 'q4a', text: 'Sie haben recht. Und das macht mir mehr Angst als ihnen.', scores: { orphan: 3, trickster: 1, destroyer: 0, tyrant: 0 } },
        { id: 'q4b', text: 'Gut so. Nicht alles gehört ihnen.', scores: { tyrant: 3, trickster: 1, orphan: 0, destroyer: 0 } },
        { id: 'q4c', text: 'Irritation. Ich hab ihnen alles gezeigt. Was wollen sie noch?', scores: { destroyer: 2, tyrant: 2, orphan: 0, trickster: 0 } },
        { id: 'q4d', text: 'Ich werde sofort charmanter. Offener. Mehr... performt.', scores: { trickster: 3, orphan: 2, destroyer: 0, tyrant: 0 } },
      ],
    },
    // Q5: Hollow achievement
    {
      id: 'q5',
      context: 'Du erreichst etwas Bedeutendes — Beförderung, kreativer Durchbruch, öffentliche Anerkennung. Leute gratulieren dir.',
      text: 'Was ist das Gefühl unter dem Lächeln?',
      options: [
        { id: 'q5a', text: 'Es ist nicht genug. Es ist nie genug. Da ist immer das Nächste.', scores: { tyrant: 3, orphan: 1, destroyer: 0, trickster: 0 } },
        { id: 'q5b', text: 'Ich fühle mich wie ein Betrüger. Als würden sie jemanden feiern, der nicht wirklich existiert.', scores: { trickster: 2, orphan: 2, destroyer: 0, tyrant: 0 } },
        { id: 'q5c', text: 'Ein Blitz von \u201EDas hab ich allen gezeigt, die an mir gezweifelt haben\u201C — dann Schuld, weil ich so denke.', scores: { destroyer: 3, tyrant: 1, orphan: 0, trickster: 0 } },
        { id: 'q5d', text: 'Leere. Ich dachte, das würde etwas füllen. Hat es nicht.', scores: { orphan: 3, destroyer: 1, tyrant: 0, trickster: 0 } },
      ],
    },
    // Q6: Stranger's vulnerability
    {
      id: 'q6',
      context: 'Jemand, den du kaum kennst, öffnet sich dir über seinen tiefsten Schmerz. Er weint. Er ist verletzlich.',
      text: 'Was passiert wirklich in dir?',
      options: [
        { id: 'q6a', text: 'Ich fühle mich mächtig. Die haben mich ausgewählt. Ich halte jetzt etwas Wertvolles.', scores: { tyrant: 3, trickster: 1, orphan: 0, destroyer: 0 } },
        { id: 'q6b', text: 'Ich will wegrennen. Ihr Schmerz zieht etwas aus mir raus, das ich nicht fühlen will.', scores: { orphan: 2, destroyer: 2, tyrant: 0, trickster: 0 } },
        { id: 'q6c', text: 'Ich spiegle ihre Emotion perfekt. Ich weiß genau, was ich sagen muss. Es ist fast... automatisch.', scores: { trickster: 3, tyrant: 1, orphan: 0, destroyer: 0 } },
        { id: 'q6d', text: 'Ich bin wütend auf den, der ihnen das angetan hat. Ich will es richten. Die Quelle zerstören.', scores: { destroyer: 3, orphan: 1, tyrant: 0, trickster: 0 } },
      ],
    },
    // Q7: Unguarded reflection
    {
      id: 'q7',
      context: 'Du siehst dein Spiegelbild unerwartet — in einem Schaufenster, in jemandes Sonnenbrille. Für eine ungeschützte Sekunde siehst du dich.',
      text: 'Was siehst du?',
      options: [
        { id: 'q7a', text: 'Jemand Müdes. Jemand, der zu lange performt hat.', scores: { trickster: 3, orphan: 2, destroyer: 0, tyrant: 0 } },
        { id: 'q7b', text: 'Jemand Gefährliches. Fähiger als jeder ahnt.', scores: { destroyer: 2, tyrant: 2, orphan: 0, trickster: 0 } },
        { id: 'q7c', text: 'Einen Fremden. Ich erkenne die Person nicht ganz, die zurückschaut.', scores: { orphan: 3, trickster: 1, destroyer: 0, tyrant: 0 } },
        { id: 'q7d', text: 'Jemand, der die Kontrolle hat. Jemand, der es geschafft hat.', scores: { tyrant: 3, destroyer: 0, orphan: 0, trickster: 0 } },
      ],
    },
    // Q8: The forbidden thought
    {
      id: 'q8',
      context: 'Spät in der Nacht. Du kannst nicht schlafen. Dein Verstand driftet zu dem einen Gedanken, den du tagsüber nie zulässt.',
      text: 'Was ist es?',
      options: [
        { id: 'q8a', text: 'Dass ich vielleicht allein ende. Wirklich allein.', scores: { orphan: 3, destroyer: 1, tyrant: 0, trickster: 0 } },
        { id: 'q8b', text: 'Dass alles, was ich aufgebaut habe, bedeutungslos sein könnte.', scores: { destroyer: 3, tyrant: 1, orphan: 0, trickster: 0 } },
        { id: 'q8c', text: 'Dass wenn Menschen das echte Ich sehen würden, sie gehen würden.', scores: { trickster: 3, orphan: 2, destroyer: 0, tyrant: 0 } },
        { id: 'q8d', text: 'Dass ich nicht aufhören kann. Ich weiß nicht, wie ich einfach... sein kann.', scores: { tyrant: 3, orphan: 1, destroyer: 0, trickster: 0 } },
      ],
    },
  ],

  profiles: [
    {
      id: 'destroyer',
      title: 'Die Glut Darunter',
      emoji: '\uD83D\uDD25',
      color: '#C41E3A',
      description: 'Unter deiner Fassung lebt eine Kraft, die alles Falsche niederreißen will. Du spürst Unechtheit sofort und dein Instinkt ist, sie zu verbrennen. Das ist keine Grausamkeit — es ist ein tiefes Bedürfnis nach Wahrheit, das keinen sicheren Ort zum Landen hat.',
      thresholds: { destroyer: 12 },
      priority: 1,
    },
    {
      id: 'orphan',
      title: 'Der Hohle Mond',
      emoji: '\uD83C\uDF19',
      color: '#1B3A5C',
      description: 'Es gibt einen stillen Raum in dir, den keine Leistung, keine Beziehung, kein Maß an Liebe je ganz füllen konnte. Du hast früh gelernt, dass Anwesenheit nicht dasselbe ist wie gesehen werden.',
      thresholds: { orphan: 12 },
      priority: 1,
    },
    {
      id: 'tyrant',
      title: 'Die Eiserne Krone',
      emoji: '\uD83D\uDC51',
      color: '#8B7355',
      description: 'Kontrolle ist deine Muttersprache. Nicht weil du kalt bist — sondern weil Verletzlichkeit dich einmal etwas gekostet hat, das du dir nicht leisten konntest zu verlieren. Du hast Disziplin zu Rüstung und Ehrgeiz zu einer Mauer gemacht.',
      thresholds: { tyrant: 12 },
      priority: 1,
    },
    {
      id: 'trickster',
      title: 'Der Spiegel, der Lacht',
      emoji: '\uD83C\uDFAD',
      color: '#9CA3AF',
      description: 'Du beherrschst die Kunst, genau das zu sein, was der Moment verlangt. Charmant, witzig, entwaffnend — deine soziale Intelligenz ist außergewöhnlich. Aber unter der Performance ist eine Frage, der du ausweichst: Wer bist du, wenn niemand zuschaut?',
      thresholds: { trickster: 12 },
      priority: 1,
    },
  ],

  resultMapping: {
    markerId: 'marker.shadow.shadow_archetype',
    profileToTraits: {
      destroyer: { aggressive: 1.0, primal_force: 1.0 },
      orphan: { isolation: 1.0, vulnerability: 1.0 },
      tyrant: { dominance: 1.0, strategic_control: 1.0 },
      trickster: { deflection: 1.0, mimicry: 1.0 },
    },
  },
};
