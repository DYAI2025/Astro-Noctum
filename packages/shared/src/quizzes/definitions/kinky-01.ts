import type { QuizDefinition } from '../schema';

export const kinky01Quiz: QuizDefinition = {
  id: 'kinky-01',
  title: 'Visibility',
  titleDe: 'Sichtbarkeit',
  subtitle: 'How far do you dare to show your inner otherness — without shame or judgment?',
  subtitleDe: 'Wie weit traust du dir, dein inneres Anderssein zu zeigen — ohne Scham und Urteil?',
  emoji: '🔥',
  accentColor: '#C73535',
  scoringModel: 'categorical',
  dimensions: ['expression', 'instinct', 'freedom'],
  premium: true,
  seriesId: 'kinky',
  seriesOrder: 1,
  questions: [
    {
      id: 'q01',
      text: 'Du bist auf einer Party, auf der du niemanden kennst. Irgendwann merkt die Person neben dir, dass du gerade ein Buch über dein ungewöhnlichstes Hobby in der Tasche hast. Sie fragt dich, was das ist.',
      options: [
        { id: 'A', text: "Ich lache kurz und sage 'Ach, das — nichts Besonderes.' Thema gewechselt.", scores: { expression: -0.35, instinct: 0.05, freedom: -0.2 }, profileId: 'verborgen' },
        { id: 'B', text: 'Ich sage den Namen des Hobbys, ohne Erklärung. Wer nachfragt, bekommt mehr.', scores: { expression: 0.1, instinct: 0.2, freedom: 0.15 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ich erzähle begeistert — wenn sie komisch guckt, ist das ihr Problem.', scores: { expression: 0.4, instinct: 0.3, freedom: 0.35 }, profileId: 'sichtbar' },
        { id: 'D', text: "Ich drehe die Frage um: 'Und du? Was ist dein seltsamstes Ding?' Erst checken, dann öffnen.", scores: { expression: 0.05, instinct: 0.35, freedom: 0.1 }, profileId: 'selektiv' },
      ],
    },
    {
      id: 'q02',
      text: 'Dein Profilbild. Du hast ein Foto, das dich zeigt, wie du wirklich bist — ungewöhnlich, voll du. Setzt du es?',
      options: [
        { id: 'A', text: 'Nein. Mein Profilbild ist eine strategisch neutrale Version von mir.', scores: { expression: -0.3, instinct: -0.1, freedom: -0.25 }, profileId: 'verborgen' },
        { id: 'B', text: 'Kommt drauf an, für welches Netzwerk. LinkedIn nein, Instagram vielleicht.', scores: { expression: 0.05, instinct: 0.15, freedom: 0.0 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ja. Wer mich nicht mag, braucht mich nicht zu folgen.', scores: { expression: 0.38, instinct: 0.25, freedom: 0.4 }, profileId: 'sichtbar' },
        { id: 'D', text: 'Ich hätte gerne ein Profilbild, das mich zeigt — aber irgendwas zieht mich jedes Mal zurück.', scores: { expression: -0.1, instinct: 0.2, freedom: -0.05 }, profileId: 'selektiv' },
      ],
    },
    {
      id: 'q03',
      text: 'Du bist an einem Tisch mit Arbeitskollegen. Das Gespräch dreht sich um Wochenendpläne. Dein Wochenende war — sagen wir — interessant. Was sagst du?',
      options: [
        { id: 'A', text: "'War entspannt, zu Hause geblieben.' Ich erfinde lieber etwas Harmloses.", scores: { expression: -0.35, instinct: -0.15, freedom: -0.2 }, profileId: 'verborgen' },
        { id: 'B', text: "'War intensiv.' Mehr sage ich nicht. Wer fragt, denkt sich seinen Teil.", scores: { expression: 0.1, instinct: 0.3, freedom: 0.2 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ich erzähle es — verpackt als verrückte Story. Reaktionen lese ich gerne.', scores: { expression: 0.35, instinct: 0.25, freedom: 0.3 }, profileId: 'sichtbar' },
        { id: 'D', text: "Ich frage erst: 'Was war denn bei euch?' Kontext zuerst, dann entscheide ich.", scores: { expression: 0.0, instinct: 0.2, freedom: 0.05 }, profileId: 'selektiv' },
      ],
    },
    {
      id: 'q04',
      text: "Du findest einen alten Brief an dich selbst aus der Zeit, als du noch versuchtest, 'normal' zu sein. Was machst du damit?",
      options: [
        { id: 'A', text: 'Ich lese ihn allein, dann lege ich ihn weg. Das bleibt bei mir.', scores: { expression: -0.25, instinct: 0.1, freedom: -0.1 }, profileId: 'verborgen' },
        { id: 'B', text: 'Ich zeige ihn jemandem, dem ich wirklich vertraue. Nur einer Person.', scores: { expression: 0.1, instinct: 0.15, freedom: 0.1 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ich poste ein Foto davon. Ohne viel Text. Wer es versteht, versteht es.', scores: { expression: 0.4, instinct: 0.2, freedom: 0.35 }, profileId: 'sichtbar' },
        { id: 'D', text: 'Ich verbrenne ihn. Nicht aus Scham — sondern weil ich nicht mehr der bin.', scores: { expression: 0.15, instinct: 0.35, freedom: 0.2 }, profileId: 'sichtbar' },
      ],
    },
    {
      id: 'q05',
      text: 'Jemand macht einen Witz über Menschen wie dich — ohne zu wissen, dass du einer davon bist. Der Raum lacht. Du...',
      options: [
        { id: 'A', text: 'Ich lache mit. Es ist einfacher so. Innerlich zähle ich bis drei.', scores: { expression: -0.38, instinct: -0.1, freedom: -0.3 }, profileId: 'verborgen' },
        { id: 'B', text: 'Ich sage nichts, aber ich höre auf zu lachen. Das ist meine Antwort.', scores: { expression: 0.05, instinct: 0.25, freedom: 0.05 }, profileId: 'selektiv' },
        { id: 'C', text: "'Ich bin übrigens einer von denen.' Ruhig, klar, ein Lächeln dabei.", scores: { expression: 0.4, instinct: 0.3, freedom: 0.38 }, profileId: 'sichtbar' },
        { id: 'D', text: 'Ich lenke das Gespräch in eine andere Richtung. Kein Kampf, aber auch kein Mitmachen.', scores: { expression: 0.0, instinct: 0.2, freedom: 0.1 }, profileId: 'selektiv' },
      ],
    },
    {
      id: 'q06',
      text: 'Du bekommst die Möglichkeit, eine Woche lang komplett anonym zu leben — kein Name, kein Ruf, keine Geschichte. Wie nutzt du sie?',
      options: [
        { id: 'A', text: 'Ich würde trotzdem so leben wie immer. Anonymität macht mir wenig aus.', scores: { expression: -0.2, instinct: -0.1, freedom: -0.15 }, profileId: 'verborgen' },
        { id: 'B', text: 'Ich würde ein, zwei Dinge ausprobieren, die ich sonst nie zeigen würde.', scores: { expression: 0.15, instinct: 0.3, freedom: 0.2 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ich würde genau das sein, was ich sonst verberge. Komplett. Ohne Filter.', scores: { expression: 0.4, instinct: 0.35, freedom: 0.4 }, profileId: 'sichtbar' },
        { id: 'D', text: 'Ich würde beobachten, wie andere reagieren, wenn ich Kleinigkeiten von mir zeige.', scores: { expression: 0.1, instinct: 0.25, freedom: 0.1 }, profileId: 'selektiv' },
      ],
    },
    {
      id: 'q07',
      text: 'Du findest ein Forum, in dem Menschen über genau das reden, wofür du dich manchmal schämst. Du könntest dort anonym posten. Was hält dich zurück — oder treibt dich hin?',
      options: [
        { id: 'A', text: 'Ich scrolle, lese — aber poste nie. Das Lesen reicht mir.', scores: { expression: -0.3, instinct: 0.1, freedom: -0.1 }, profileId: 'verborgen' },
        { id: 'B', text: 'Ich erstelle einen Account, lese eine Weile — und irgendwann antworte ich vielleicht.', scores: { expression: 0.1, instinct: 0.2, freedom: 0.15 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ich poste sofort. Anonym oder nicht — endlich Menschen, die verstehen.', scores: { expression: 0.38, instinct: 0.3, freedom: 0.35 }, profileId: 'sichtbar' },
        { id: 'D', text: 'Ich würde das Forum mit einer Freundin oder einem Freund teilen, dem ich vertraue.', scores: { expression: 0.05, instinct: 0.15, freedom: 0.1 }, profileId: 'selektiv' },
      ],
    },
    {
      id: 'q08',
      text: 'Stell dir vor, du könntest einen Raum betreten, der deine geheimste Seite — dein Anderssein — perfekt versteht. Kein Urteil. Niemand, den du kennst. Wie lange bleibst du?',
      options: [
        { id: 'A', text: 'Ich schaue rein — und gehe schnell wieder. Zu viel Nähe auf einmal.', scores: { expression: -0.3, instinct: -0.05, freedom: -0.2 }, profileId: 'verborgen' },
        { id: 'B', text: 'Ich bleibe eine Weile, sage wenig — aber es tut gut, einfach da zu sein.', scores: { expression: 0.0, instinct: 0.2, freedom: 0.1 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ich bleibe so lange ich kann. Ich rede, teile, atme durch.', scores: { expression: 0.4, instinct: 0.3, freedom: 0.38 }, profileId: 'sichtbar' },
        { id: 'D', text: 'Ich bringe jemanden mit, dem ich vertraue. Alleine fühlt sich das zu groß an.', scores: { expression: 0.1, instinct: 0.15, freedom: 0.1 }, profileId: 'selektiv' },
      ],
    },
    {
      id: 'q09',
      text: 'Du hast ein Kunstprojekt fertig, das 100% du ist — provokant, seltsam, unvertretbar-schön. Zeigst du es der Welt?',
      options: [
        { id: 'A', text: 'Nein. Es ist für mich. Das braucht keine Bühne.', scores: { expression: -0.35, instinct: 0.05, freedom: -0.1 }, profileId: 'verborgen' },
        { id: 'B', text: 'Ich zeige es einem kleinen Kreis. Qualität der Blicke schlägt Quantität.', scores: { expression: 0.1, instinct: 0.2, freedom: 0.1 }, profileId: 'selektiv' },
        { id: 'C', text: 'Ja — ganz öffentlich. Reaktionen inklusive, Urteile inklusive.', scores: { expression: 0.4, instinct: 0.3, freedom: 0.4 }, profileId: 'sichtbar' },
        { id: 'D', text: 'Ich zeige es anonym — ohne meinen Namen. Das Werk soll sprechen, nicht ich.', scores: { expression: 0.2, instinct: 0.3, freedom: 0.25 }, profileId: 'sichtbar' },
      ],
    },
  ],
  profiles: [
    {
      id: 'verborgen',
      title: 'Die stille Tiefe',
      emoji: '🌊',
      color: '#1A3A4A',
      description: 'Du trägst Welten in dir — und weißt genau, wem du sie zeigst.',
      priority: 1,
    },
    {
      id: 'selektiv',
      title: 'Der Schlüsselmacher',
      emoji: '🔑',
      color: '#8B6914',
      description: 'Du zeigst dich — aber nur den Menschen, die verstehen, was sie sehen.',
      priority: 2,
    },
    {
      id: 'sichtbar',
      title: 'Die offene Flamme',
      emoji: '🔥',
      color: '#C73535',
      description: 'Du brennst sichtbar — und wärmst damit alle, die nah genug kommen.',
      priority: 3,
    },
  ],
  resultMapping: {
    markerId: 'quiz.kinky_01.v1',
    profileToTraits: {
      verborgen: { 'marker.instinct.primal_sense': 1.0, 'marker.creative.expression': 0.12, 'marker.freedom.independence': 0.09 },
      selektiv: { 'marker.creative.expression': 0.5, 'marker.instinct.primal_sense': 0.5, 'marker.freedom.independence': 0.5 },
      sichtbar: { 'marker.creative.expression': 1.0, 'marker.freedom.independence': 0.82, 'marker.instinct.primal_sense': 0.61 },
    },
  },
};
