import type { QuizDefinition } from '../schema';

export const kinky02Quiz: QuizDefinition = {
  id: 'kinky-02',
  title: 'Inner Drive',
  titleDe: 'Innerer Antrieb',
  subtitle: 'How far do you dare to show your inner otherness — without shame or judgment?',
  subtitleDe: 'Wie weit traust du dir, dein inneres Anderssein zu zeigen — ohne Scham und Urteil?',
  emoji: '🔥',
  accentColor: '#C73535',
  scoringModel: 'categorical',
  dimensions: ['instinct', 'freedom', 'love'],
  premium: true,
  seriesId: 'kinky',
  seriesOrder: 2,
  questions: [
    { id: 'q01', text: 'Du hörst Musik, die etwas in dir aufweckt — etwas, das du normalerweise unten hältst. Was passiert als nächstes?', options: [
      { id: 'A', text: 'Ich genieße es innerlich — aber nach außen bleibt alles ruhig.', scores: { instinct: -0.3, love: -0.1, freedom: -0.2 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ich bewege mich ein bisschen — nur wenn niemand schaut.', scores: { instinct: 0.05, freedom: 0.0, love: 0.15 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Das Ding übernimmt. Ich tanze, ich singe, egal wer zusieht.', scores: { instinct: 0.38, freedom: 0.4, love: 0.35 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Ich speichere das Lied und höre es später, wenn ich allein bin — dann lasse ich es raus.', scores: { instinct: 0.1, freedom: 0.1, love: 0.2 }, profileId: 'verwandelt' },
    ]},
    { id: 'q02', text: 'Stell dir vor, du bist in einem Laden und siehst etwas — ein Objekt, ein Kleidungsstück, ein Symbol — das sofort dein \'Anderssein\' widerspiegelt. Kaufst du es?', options: [
      { id: 'A', text: 'Ich schaue es lange an — und lasse es dann stehen.', scores: { instinct: -0.35, freedom: -0.25, love: -0.1 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ich kaufe es — aber nur für zu Hause. Niemand muss es sehen.', scores: { instinct: 0.1, freedom: 0.05, love: 0.2 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Ich kaufe es und trage es raus. Sofort.', scores: { instinct: 0.4, freedom: 0.38, love: 0.35 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Ich mache ein Foto davon und schicke es einer Person, der ich vertraue — vielleicht kaufen wir es zusammen.', scores: { instinct: 0.05, freedom: 0.1, love: 0.15 }, profileId: 'verwandelt' },
    ]},
    { id: 'q03', text: 'Du bist mitten in einem intensiven Gefühl — Wut, Begehren, Trauer, etwas Unbenennbares. Wie handelst du?', options: [
      { id: 'A', text: 'Ich warte es ab. Gefühle gehen vorbei, wenn man sie nicht füttert.', scores: { instinct: -0.3, freedom: -0.15, love: -0.2 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ich schreibe es auf — privat, nur für mich. Das ist der Ventil.', scores: { instinct: 0.1, freedom: 0.05, love: 0.2 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Ich tue etwas damit — bewege mich, spreche es aus, schaffe etwas. Es will durch.', scores: { instinct: 0.38, freedom: 0.35, love: 0.35 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Ich rufe jemanden an — aber nicht um zu erklären, nur um nicht allein zu sein.', scores: { instinct: 0.05, freedom: 0.1, love: 0.25 }, profileId: 'verwandelt' },
    ]},
    { id: 'q04', text: "Jemand, dem du vertraust, sagt dir: 'Du weißt schon, dass du manchmal ziemlich anders bist?' Mit einem Lächeln — aber trotzdem. Was macht das mit dir?", options: [
      { id: 'A', text: "Ein kleiner Stich. Ich lache, sage 'jaja' — und überprüfe innerlich alles.", scores: { instinct: -0.25, freedom: -0.2, love: -0.1 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ich nehme es als Kompliment — aber frage mich kurz, was sie meinen.', scores: { instinct: 0.1, freedom: 0.1, love: 0.15 }, profileId: 'impulsiv' },
      { id: 'C', text: "'Ich weiß.' Pause. 'Und?' Ich meine es ernst.", scores: { instinct: 0.38, freedom: 0.4, love: 0.3 }, profileId: 'verwandelt' },
      { id: 'D', text: "Ich frage zurück: 'Was meinst du genau?' Ich will verstehen, was sie sehen.", scores: { instinct: 0.05, freedom: 0.1, love: 0.2 }, profileId: 'verwandelt' },
    ]},
    { id: 'q05', text: 'Du betrittst einen verlassenen Vergnügungspark bei Nacht. Alle Lichter sind aus, aber eine Attraktion läuft noch. Welche ist es — und was tust du?', options: [
      { id: 'A', text: 'Ein stilles Riesenrad dreht sich langsam. Ich schaue es von außen an. Das reicht.', scores: { instinct: -0.25, freedom: -0.1, love: -0.05 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ein Spiegel-Labyrinth, halb zerbrochen. Ich gehe rein — langsam, vorsichtig.', scores: { instinct: 0.1, freedom: 0.15, love: 0.2 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Eine alte Achterbahn — Motor läuft. Ich steige ein. Risiko gehört dazu.', scores: { instinct: 0.38, freedom: 0.4, love: 0.35 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Eine Bühne mit einem einzelnen Scheinwerfer. Ich setze mich drauf und denke nach.', scores: { instinct: 0.15, freedom: 0.2, love: 0.25 }, profileId: 'verwandelt' },
    ]},
    { id: 'q06', text: 'Dein Körper will etwas tun, das du dir früher verboten hast. Nicht weil es falsch ist — sondern weil es zu viel von dir zeigt. Jetzt?', options: [
      { id: 'A', text: 'Ich halte es zurück. Die Zeit ist noch nicht reif — oder der Ort ist falsch.', scores: { instinct: -0.35, freedom: -0.25, love: -0.1 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ich tue es — aber heimlich, nur für mich.', scores: { instinct: 0.1, freedom: 0.1, love: 0.2 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Ich tue es. Hier. Jetzt. Das Verbieten war das eigentliche Problem.', scores: { instinct: 0.4, freedom: 0.4, love: 0.38 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Ich spreche erst darüber — mit jemandem, der mich kennt. Dann entscheide ich.', scores: { instinct: 0.05, freedom: 0.1, love: 0.2 }, profileId: 'verwandelt' },
    ]},
    { id: 'q07', text: 'Was wäre die ehrlichste Waffe in deiner Hand — wenn du ohne Konsequenzen kämpfen könntest?', options: [
      { id: 'A', text: 'Ein Spiegel. Ich halte anderen hin, was sie wirklich sind.', scores: { instinct: -0.1, freedom: 0.05, love: 0.1 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Worte. Präzise, langsam, unausweichlich.', scores: { instinct: 0.1, freedom: 0.1, love: 0.2 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Feuer. Nicht um zu zerstören — sondern um zu erhellen.', scores: { instinct: 0.38, freedom: 0.35, love: 0.4 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Eine offene Hand. Hinhalten, anbieten — das ist meine stärkste Geste.', scores: { instinct: 0.05, freedom: 0.15, love: 0.25 }, profileId: 'verwandelt' },
    ]},
    { id: 'q08', text: 'Wenn du an dein inneres Anderssein denkst — das Ding, das dich manchmal fremd bei dir selbst fühlen lässt — welches Bild kommt zuerst?', options: [
      { id: 'A', text: 'Ein Ding tief unten im Wasser — still, dunkel, ungeklärt.', scores: { instinct: -0.2, freedom: -0.1, love: 0.1 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ein Samen, der im Dunkeln keimt — noch nicht sichtbar, aber schon aktiv.', scores: { instinct: 0.1, freedom: 0.15, love: 0.2 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Ein Feuer, das niemand angezündet hat — es war einfach immer schon da.', scores: { instinct: 0.38, freedom: 0.35, love: 0.4 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Eine Gabelung im Nebel — ich kenne beide Wege, aber gehe gerade erst los.', scores: { instinct: 0.1, freedom: 0.2, love: 0.2 }, profileId: 'verwandelt' },
    ]},
    { id: 'q09', text: 'Du bekommst ein Angebot: Eine Nacht lang kannst du eine Version von dir selbst sein, die keine Grenzen kennt — sozial, kreativ, sinnlich. Nur du weißt davon. Nimmst du es an?', options: [
      { id: 'A', text: 'Nein. Ich bin lieber ganz ich, als eine Version, die dann wieder verschwindet.', scores: { instinct: -0.3, freedom: -0.2, love: -0.05 }, profileId: 'kontrolliert' },
      { id: 'B', text: 'Ja — aber ich würde es vorsichtig angehen. Ausprobieren, nicht explodieren.', scores: { instinct: 0.1, freedom: 0.15, love: 0.2 }, profileId: 'impulsiv' },
      { id: 'C', text: 'Ja — und zwar sofort. Das ist vielleicht die Nacht, auf die ich gewartet habe.', scores: { instinct: 0.4, freedom: 0.4, love: 0.38 }, profileId: 'verwandelt' },
      { id: 'D', text: 'Ja — aber ich würde danach lange darüber nachdenken, was ich dabei über mich gelernt habe.', scores: { instinct: 0.15, freedom: 0.2, love: 0.25 }, profileId: 'verwandelt' },
    ]},
  ],
  profiles: [
    { id: 'kontrolliert', title: 'Das ruhige Vulkanglas', emoji: '🪨', color: '#2A2A2A', description: 'Drinnen brodelt es schon lange — du hast nur gelernt, die Hitze zu formen.', priority: 1 },
    { id: 'impulsiv', title: 'Das lebendige Experiment', emoji: '🧪', color: '#7B5EA7', description: 'Du probierst dich aus — und entdeckst dabei, wer du wirklich bist.', priority: 2 },
    { id: 'verwandelt', title: 'Die vollständige Umkehrung', emoji: '🦋', color: '#C73535', description: 'Du hast aufgehört, dein Anderssein zu erklären — und angefangen, es zu bewohnen.', priority: 3 },
  ],
  resultMapping: {
    markerId: 'quiz.kinky_02.v1',
    profileToTraits: {
      kontrolliert: { 'marker.instinct.primal_sense': 0.2, 'marker.love.passionate': 0.15, 'marker.freedom.independence': 0.08 },
      impulsiv: { 'marker.instinct.primal_sense': 0.5, 'marker.love.passionate': 0.5, 'marker.freedom.independence': 0.5 },
      verwandelt: { 'marker.instinct.primal_sense': 1.0, 'marker.love.passionate': 0.88, 'marker.freedom.independence': 0.87 },
    },
  },
};
