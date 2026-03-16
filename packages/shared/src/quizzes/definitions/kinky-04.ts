import type { QuizDefinition } from '../schema';

export const kinky04Quiz: QuizDefinition = {
  id: 'kinky-04',
  title: 'Identity Unmasked',
  titleDe: 'Identität ohne Maske',
  subtitle: 'How far do you dare to show your inner otherness — without shame or judgment?',
  subtitleDe: 'Wie weit traust du dir, dein inneres Anderssein zu zeigen — ohne Scham und Urteil?',
  emoji: '🔥',
  accentColor: '#C73535',
  scoringModel: 'categorical',
  dimensions: ['creative', 'instinct', 'love'],
  premium: true,
  seriesId: 'kinky',
  seriesOrder: 4,
  questions: [
    { id: 'q01', text: 'Du wachst morgens auf und weißt: Heute musst du dich nicht verstellen. Kein Job, keine Verpflichtungen, keine Erwartungen. Dein erstes Gefühl ist...', options: [
      { id: 'A', text: 'Erleichterung. Endlich. Dann sofort: Schuldgefühl, weil ich so selten ich bin.', scores: { creative: -0.1, instinct: 0.2, love: -0.15 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Neugier. Was mache ich, wenn niemand schaut?', scores: { creative: 0.15, instinct: 0.25, love: 0.2 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Stille. Ich bin schon ich — der Tag beginnt genau richtig.', scores: { creative: 0.38, instinct: 0.3, love: 0.35 }, profileId: 'ursprung' },
      { id: 'D', text: 'Unsicherheit. Ohne Struktur weiß ich manchmal nicht, wer ich bin.', scores: { creative: -0.2, instinct: 0.1, love: -0.05 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q02', text: "Ein Mensch, den du liebst, fragt dich: 'Wer bist du wirklich — hinter allem?' Du antwortest...", options: [
      { id: 'A', text: 'Ich weiche aus. Diese Frage macht mir Angst — nicht weil ich keine Antwort habe, sondern weil ich zu viele habe.', scores: { creative: -0.25, instinct: 0.1, love: -0.1 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Ich erzähle eine Schicht — die sicherste. Nicht alles auf einmal.', scores: { creative: 0.05, instinct: 0.2, love: 0.15 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Ich erzähle alles, was in den Moment passt. Echte Intimität ist keine Kontrollfrage.', scores: { creative: 0.38, instinct: 0.3, love: 0.4 }, profileId: 'ursprung' },
      { id: 'D', text: "Ich stelle die Gegenfrage: 'Was siehst du gerade?' Ich bin neugierig auf ihr Bild von mir.", scores: { creative: 0.15, instinct: 0.25, love: 0.2 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q03', text: 'Du findest ein Tagebuch, das du vor fünf Jahren geschrieben hast. Der Mensch darin klingt völlig anders als du heute. Was empfindest du?', options: [
      { id: 'A', text: 'Unbehagen. Ich möchte nicht, dass jemand das liest. Ich bin nicht mehr der.', scores: { creative: -0.2, instinct: 0.1, love: -0.15 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Faszination. Ich lese es wie ein Buch über jemand anderen — der ich mal war.', scores: { creative: 0.1, instinct: 0.2, love: 0.2 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Wärme. Ich erkenne mich — verändert, aber derselbe Kern.', scores: { creative: 0.38, instinct: 0.3, love: 0.35 }, profileId: 'ursprung' },
      { id: 'D', text: 'Verwirrung. Beide Versionen fühlen sich echt an. Welche bin ich jetzt?', scores: { creative: -0.05, instinct: 0.15, love: 0.1 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q04', text: 'Du sollst dich in einem Satz beschreiben — ohne deine Rolle, deinen Beruf, deine Beziehungen. Was bleibt übrig?', options: [
      { id: 'A', text: 'Stille. Ohne diese Dinge weiß ich nicht, was ich bin.', scores: { creative: -0.3, instinct: 0.05, love: -0.1 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Ein Satz, der sich morgen wieder ändern würde — und das ist okay.', scores: { creative: 0.1, instinct: 0.2, love: 0.2 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Ein Satz, den ich schon lange kenne — der schon immer da war.', scores: { creative: 0.4, instinct: 0.3, love: 0.35 }, profileId: 'ursprung' },
      { id: 'D', text: 'Mehrere Sätze. Ich bin nicht eins — ich bin ein Gespräch zwischen Versionen.', scores: { creative: 0.15, instinct: 0.25, love: 0.2 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q05', text: 'Jemand, der dich seit zehn Jahren kennt, sagt: \'Du hast dich total verändert.\' Wie reagierst du?', options: [
      { id: 'A', text: 'Es trifft mich. Habe ich die Person verloren, die ich war?', scores: { creative: -0.25, instinct: 0.1, love: -0.1 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Natürlich habe ich mich verändert. Wer nicht, stagniert.', scores: { creative: 0.15, instinct: 0.25, love: 0.2 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Verändert, ja — aber nicht an den Stellen, die zählen. Mein Kern ist stärker als meine Oberfläche.', scores: { creative: 0.38, instinct: 0.3, love: 0.35 }, profileId: 'ursprung' },
      { id: 'D', text: 'Ich frage: \'Was genau hat sich geändert?\' Ich will verstehen, welche Schicht gemeint ist.', scores: { creative: 0.1, instinct: 0.2, love: 0.15 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q06', text: 'Du stehst vor dem Spiegel. Allein. Niemand sieht dich. Was siehst du?', options: [
      { id: 'A', text: 'Jemanden, der eine Rolle spielt — auch vor sich selbst.', scores: { creative: -0.3, instinct: 0.05, love: -0.1 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Einen Menschen im Werden — mehr Prozess als Produkt.', scores: { creative: 0.1, instinct: 0.2, love: 0.2 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Mich. Ungefiltert. Und ich sage mir innerlich Hallo.', scores: { creative: 0.4, instinct: 0.3, love: 0.4 }, profileId: 'ursprung' },
      { id: 'D', text: 'Verschiedene Gesichter. Je nach Stimmung sehe ich jemand anderes.', scores: { creative: 0.05, instinct: 0.2, love: 0.15 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q07', text: 'Du bekommst die Möglichkeit, für immer eine einzige Version von dir zu sein — konsistent, klar, erkennbar. Nimmst du an?', options: [
      { id: 'A', text: 'Ja. Endlich Ruhe. Ich würde gerne aufhören, Versionen zu verwalten.', scores: { creative: -0.25, instinct: 0.05, love: -0.1 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Nein. Ich bin bewusst mehrere Versionen — das aufzugeben wäre, mich selbst zu beschneiden.', scores: { creative: 0.15, instinct: 0.25, love: 0.25 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Ich bin bereits eine Version. Ich habe aufgehört, zwischen Masken zu wechseln.', scores: { creative: 0.4, instinct: 0.3, love: 0.38 }, profileId: 'ursprung' },
      { id: 'D', text: 'Ich würde es versuchen — aber ich glaube, nach zwei Wochen würde ich das Angebot zurückgeben.', scores: { creative: 0.1, instinct: 0.2, love: 0.2 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q08', text: 'Du könntest eine Nachricht an dein 15-jähriges Ich senden — eine einzige Zeile. Was schreibst du?', options: [
      { id: 'A', text: 'Du bist nicht falsch. Aber du wirst noch lange brauchen, um das zu glauben.', scores: { creative: -0.15, instinct: 0.1, love: 0.1 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Hör nicht auf, dich zu verändern. Keine deiner Versionen ist die falsche.', scores: { creative: 0.15, instinct: 0.2, love: 0.2 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Du bist genau richtig. Und irgendwann wirst du aufhören, das zu bezweifeln.', scores: { creative: 0.38, instinct: 0.3, love: 0.38 }, profileId: 'ursprung' },
      { id: 'D', text: 'Ich weiß noch nicht. Ich entdecke gerade, wer ich bin — auch jetzt noch.', scores: { creative: 0.1, instinct: 0.2, love: 0.2 }, profileId: 'gestaltwandler' },
    ]},
    { id: 'q09', text: 'Diese Quizserie ist zu Ende. Was bleibt?', options: [
      { id: 'A', text: 'Die Erkenntnis, dass mein Anderssein einen Namen hat — und das hilft.', scores: { creative: -0.05, instinct: 0.15, love: 0.15 }, profileId: 'maskentraeger' },
      { id: 'B', text: 'Fragen, die wichtiger sind als die Antworten.', scores: { creative: 0.15, instinct: 0.2, love: 0.2 }, profileId: 'gestaltwandler' },
      { id: 'C', text: 'Das Gefühl, mit mir selbst verabredet zu sein — und diesmal komme ich.', scores: { creative: 0.38, instinct: 0.35, love: 0.4 }, profileId: 'ursprung' },
      { id: 'D', text: 'Neugier. Über mich. Das ist neu.', scores: { creative: 0.1, instinct: 0.2, love: 0.25 }, profileId: 'gestaltwandler' },
    ]},
  ],
  profiles: [
    { id: 'maskentraeger', title: 'Der Virtuose der Masken', emoji: '🎭', color: '#4A4A6A', description: 'Du bist Meister darin, dich anzupassen — und weißt genau, was dahinter wartet.', priority: 1 },
    { id: 'gestaltwandler', title: 'Das Lebendige Spektrum', emoji: '🌈', color: '#7B5EA7', description: 'Du bist nicht eine Sache — du bist alle Farben auf einmal.', priority: 2 },
    { id: 'ursprung', title: 'Der Unverstellte Kern', emoji: '💎', color: '#C73535', description: 'Du hast aufgehört, dein Ich zu verhandeln — und angefangen, es zu bewohnen.', priority: 3 },
  ],
  resultMapping: {
    markerId: 'quiz.kinky_04.v1',
    profileToTraits: {
      maskentraeger: { 'marker.creative.expression': 0.15, 'marker.instinct.primal_sense': 0.2, 'marker.love.passionate': 0.1 },
      gestaltwandler: { 'marker.creative.expression': 0.5, 'marker.instinct.primal_sense': 0.5, 'marker.love.passionate': 0.5 },
      ursprung: { 'marker.creative.expression': 1.0, 'marker.instinct.primal_sense': 0.85, 'marker.love.passionate': 0.9 },
    },
  },
};
