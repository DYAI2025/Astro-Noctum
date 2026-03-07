
import { QuizMeta, Question, ValidationProfile } from '../types';

export const quizMeta: QuizMeta = {
  id: "quiz.blumenwesen.v1",
  title: "Dein inneres Blumenwesen",
  subtitle: "Jede Seele trägt einen Samen in sich",
  description: "Welches Blumenwesen schlummert in dir? Entdecke deine energetische Signatur.",
  questions_count: 10,
  estimated_duration_seconds: 180,
  disclaimer: "Dieser Test dient der spielerischen Selbstreflexion und stellt keine psychologische Diagnose dar."
};

export const dimensions = [
  { id: "licht", label: "Lichtbedürfnis" },
  { id: "wurzeln", label: "Wurzeltiefe" },
  { id: "rhythmus", label: "Blührhythmus" },
  { id: "wasser", label: "Wasserbedarf" }
];

export const questions: Question[] = [
  {
    id: "q1",
    text: "Stell dir vor, deine Seele ist ein Garten. Wo steht deine innere Pflanze am liebsten?",
    context: "Der innere Garten",
    options: [
      { id: "q1_a", text: "Mitten im Sonnenlicht, wo jeder sie sehen kann", scores: { licht: 5, wurzeln: 3, rhythmus: 4, wasser: 3 } },
      { id: "q1_b", text: "Am Rand, halb im Schatten, mit Blick aufs Ganze", scores: { licht: 2, wurzeln: 4, rhythmus: 2, wasser: 3 } },
      { id: "q1_c", text: "Unter einem großen Baum, geschützt und geborgen", scores: { licht: 1, wurzeln: 5, rhythmus: 2, wasser: 4 } },
      { id: "q1_d", text: "Überall und nirgends – ich wandere mit dem Wind", scores: { licht: 3, wurzeln: 1, rhythmus: 5, wasser: 2 } }
    ]
  },
  {
    id: "q2",
    text: "Wenn du an einen glücklichen Moment deiner Kindheit denkst – was brauchtest du dafür am meisten?",
    context: "Kindheitserinnerung",
    options: [
      { id: "q2_a", text: "Die volle Aufmerksamkeit eines Menschen, der mich sah", scores: { licht: 5, wurzeln: 3, rhythmus: 3, wasser: 5 } },
      { id: "q2_b", text: "Einen sicheren Ort, der immer gleich blieb", scores: { licht: 2, wurzeln: 5, rhythmus: 1, wasser: 3 } },
      { id: "q2_c", text: "Die Freiheit, einfach zu sein, ohne Erwartungen", scores: { licht: 2, wurzeln: 2, rhythmus: 5, wasser: 2 } },
      { id: "q2_d", text: "Zeit für mich allein, um zu träumen und zu fühlen", scores: { licht: 1, wurzeln: 3, rhythmus: 2, wasser: 4 } }
    ]
  },
  {
    id: "q3",
    text: "Was passiert mit dir, wenn du zu lange keine emotionale Verbindung hattest?",
    context: "Emotionale Nahrung",
    options: [
      { id: "q3_a", text: "Ich welke – ich brauche regelmäßig tiefe Gespräche", scores: { licht: 4, wurzeln: 3, rhythmus: 2, wasser: 5 } },
      { id: "q3_b", text: "Ich ziehe mich zurück und regeneriere mich selbst", scores: { licht: 1, wurzeln: 4, rhythmus: 2, wasser: 2 } },
      { id: "q3_c", text: "Ich suche mir neue Verbindungen, spontan und ungeplant", scores: { licht: 4, wurzeln: 1, rhythmus: 5, wasser: 3 } },
      { id: "q3_d", text: "Ich warte geduldig – die richtigen Menschen kommen zu mir", scores: { licht: 2, wurzeln: 5, rhythmus: 1, wasser: 3 } }
    ]
  },
  {
    id: "q4",
    text: "Wie reagierst du, wenn das Leben plötzlich kalt und hart wird?",
    context: "Der erste Frost",
    options: [
      { id: "q4_a", text: "Ich ziehe meine Blätter ein und warte auf bessere Zeiten", scores: { licht: 2, wurzeln: 5, rhythmus: 1, wasser: 3 } },
      { id: "q4_b", text: "Ich blühe gerade dann auf – Krisen bringen meine Stärke hervor", scores: { licht: 4, wurzeln: 3, rhythmus: 4, wasser: 4 } },
      { id: "q4_c", text: "Ich transformiere mich – jeder Winter macht mich weiser", scores: { licht: 2, wurzeln: 4, rhythmus: 2, wasser: 5 } },
      { id: "q4_d", text: "Ich biege mich mit dem Sturm, breche aber nicht", scores: { licht: 3, wurzeln: 2, rhythmus: 4, wasser: 3 } }
    ]
  },
  {
    id: "q5",
    text: "Was hätte dein inneres Kind am liebsten öfter gehört?",
    context: "Das inneres Kind spricht",
    options: [
      { id: "q5_a", text: "„Du strahlst! Wie wunderbar, dass du da bist.“", scores: { licht: 5, wurzeln: 3, rhythmus: 4, wasser: 4 } },
      { id: "q5_b", text: "„Du bist sicher. Ich bin immer für dich da.“", scores: { licht: 2, wurzeln: 5, rhythmus: 2, wasser: 4 } },
      { id: "q5_c", text: "„Du darfst wild sein. Sei frei, erkunde die Welt.“", scores: { licht: 3, wurzeln: 1, rhythmus: 5, wasser: 2 } },
      { id: "q5_d", text: "„Du bist genug. Auch leise. Auch langsam.“", scores: { licht: 1, wurzeln: 4, rhythmus: 1, wasser: 3 } }
    ]
  },
  {
    id: "q6",
    text: "Wie entfaltest du dich am besten?",
    context: "Wachstumsmuster",
    options: [
      { id: "q6_a", text: "Schnell und sichtbar – wenn ich blühe, soll es jeder sehen", scores: { licht: 5, wurzeln: 2, rhythmus: 5, wasser: 3 } },
      { id: "q6_b", text: "Langsam und stetig – echtes Wachstum braucht Zeit", scores: { licht: 2, wurzeln: 5, rhythmus: 1, wasser: 3 } },
      { id: "q6_c", text: "In Zyklen – manchmal intensiv, manchmal ruhend", scores: { licht: 3, wurzeln: 3, rhythmus: 3, wasser: 5 } },
      { id: "q6_d", text: "Überraschend – ich blühe, wenn niemand damit rechnet", scores: { licht: 3, wurzeln: 2, rhythmus: 5, wasser: 2 } }
    ]
  },
  {
    id: "q7",
    text: "Wonach sehnt sich dein Herz am meisten?",
    context: "Tiefste Sehnsucht",
    options: [
      { id: "q7_a", text: "Gesehen und gefeiert zu werden für das, was ich bin", scores: { licht: 5, wurzeln: 2, rhythmus: 4, wasser: 4 } },
      { id: "q7_b", text: "Einem Ort, der sich wie Zuhause anfühlt – für immer", scores: { licht: 2, wurzeln: 5, rhythmus: 1, wasser: 3 } },
      { id: "q7_c", text: "Tiefe Verschmelzung mit einem anderen Herzen", scores: { licht: 2, wurzeln: 4, rhythmus: 2, wasser: 5 } },
      { id: "q7_d", text: "Ungebundene Freiheit und immer neue Abenteuer", scores: { licht: 4, wurzeln: 1, rhythmus: 5, wasser: 2 } }
    ]
  },
  {
    id: "q8",
    text: "Was heilt dich, wenn du innerlich verletzt bist?",
    context: "Heilungskraft",
    options: [
      { id: "q8_a", text: "Warmherzige Gesellschaft und liebevolle Zuwendung", scores: { licht: 4, wurzeln: 3, rhythmus: 3, wasser: 5 } },
      { id: "q8_b", text: "Stille und Rückzug in meine eigene Welt", scores: { licht: 1, wurzeln: 4, rhythmus: 1, wasser: 3 } },
      { id: "q8_c", text: "Bewegung und Veränderung – irgendwo Neues sein", scores: { licht: 3, wurzeln: 1, rhythmus: 5, wasser: 2 } },
      { id: "q8_d", text: "Rituale und vertraute Routinen, die mich erden", scores: { licht: 2, wurzeln: 5, rhythmus: 2, wasser: 3 } }
    ]
  },
  {
    id: "q9",
    text: "In Beziehungen – was gibst du am meisten?",
    context: "Beziehungsmuster",
    options: [
      { id: "q9_a", text: "Wärme und Freude – ich bringe Licht in dunkle Momente", scores: { licht: 5, wurzeln: 3, rhythmus: 4, wasser: 3 } },
      { id: "q9_b", text: "Stabilität und Treue – auf mich kann man sich verlassen", scores: { licht: 2, wurzeln: 5, rhythmus: 2, wasser: 3 } },
      { id: "q9_c", text: "Tiefe und Intensität – ich liebe ganz oder gar nicht", scores: { licht: 3, wurzeln: 4, rhythmus: 3, wasser: 5 } },
      { id: "q9_d", text: "Inspiration und Freiheit – ich lasse Menschen wachsen", scores: { licht: 3, wurzeln: 1, rhythmus: 5, wasser: 2 } }
    ]
  },
  {
    id: "q10",
    text: "Wenn dein Leben ein Garten wäre – was wäre dein wichtigstes Geschenk an die Welt?",
    context: "Deine Essenz",
    options: [
      { id: "q10_a", text: "Mein Strahlen – ich erinnere andere daran, dass Freude möglich ist", scores: { licht: 5, wurzeln: 2, rhythmus: 4, wasser: 3 } },
      { id: "q10_b", text: "Meine Tiefe – ich zeige, dass aus Dunkelheit Schönheit wachsen kann", scores: { licht: 1, wurzeln: 5, rhythmus: 2, wasser: 5 } },
      { id: "q10_c", text: "Meine Heilkraft – ich bringe Ruhe in aufgewühlte Seelen", scores: { licht: 3, wurzeln: 4, rhythmus: 1, wasser: 3 } },
      { id: "q10_d", text: "Meine Wildheit – ich erinnere andere an ihre eigene Freiheit", scores: { licht: 4, wurzeln: 1, rhythmus: 5, wasser: 2 } }
    ]
  }
];

export const profiles: Record<string, ValidationProfile> = {
  sunflower: {
    id: "sunflower",
    title: "Die Sonnenblume",
    emoji: "🌻",
    tagline: "Du strahlst – und machst die Welt heller.",
    description: "Dein innerer Samen wurde in Licht gepflanzt – und sehnt sich noch immer danach. Als Kind brauchtest du Aufmerksamkeit nicht aus Eitelkeit, sondern weil du in den Augen anderer gespiegelt sehen wolltest, dass du existierst und wertvoll bist.\n\nHeute strahlst du natürlich – nicht um zu blenden, sondern weil Freude deine Muttersprache ist. Du hast die seltene Gabe, andere mit deiner Präsenz aufzuwärmen.",
    stats: [
      { label: "Sonnenstunden", value: "127%" },
      { label: "Blühfreude", value: "∞" },
      { label: "Wärmeabgabe", value: "High" }
    ],
    compatibility: {
      allies: ["wildflower", "lavender"],
      nemesis: "lotus"
    },
    share_text: "Ich bin eine Sonnenblume 🌻 Mein inneres Blumenwesen strahlt, um andere zu wärmen. Und du?",
    markers: [{ id: "marker.flower.sunflower", weight: 1.0 }, { id: "marker.flower.light", weight: 0.9 }]
  },
  lotus: {
    id: "lotus",
    title: "Die Lotusblume",
    emoji: "🪷",
    tagline: "Aus der Tiefe wächst die reinste Schönheit.",
    description: "Dein Samen wurde im Schlamm gepflanzt – und genau dort hast du gelernt, dass Dunkelheit nicht das Ende ist, sondern der Anfang von allem. Als Kind hast du vermutlich früh verstanden, dass das Leben kompliziert ist. Heute bist du die, zu der andere kommen, wenn sie sich verloren fühlen. Deine Tiefe ist ein Brunnen, aus dem andere trinken können.",
    stats: [
      { label: "Transformation", value: "∞" },
      { label: "Tiefe", value: "Max" },
      { label: "Reinheit", value: "100%" }
    ],
    compatibility: {
      allies: ["orchid", "lavender"],
      nemesis: "sunflower"
    },
    share_text: "Ich bin eine Lotusblume 🪷 Aus Tiefe wächst Schönheit. Und du?",
    markers: [{ id: "marker.flower.lotus", weight: 1.0 }, { id: "marker.flower.depth", weight: 0.9 }]
  },
  wildflower: {
    id: "wildflower",
    title: "Die Wildblume",
    emoji: "🌸",
    tagline: "Du wächst, wo du gepflanzt wurdest – und überall sonst.",
    description: "Dein Samen wurde vom Wind getragen – und landete genau dort, wo du sein solltest. Als Kind warst du vermutlich die, die nicht in Schubladen passte. Zu wild für die einen, zu sanft für die anderen. Heute bist du überall zuhause und nirgends festgewurzelt. Deine Wildheit inspiriert andere, auch ihre eigenen Regeln zu schreiben.",
    stats: [
      { label: "Anpassung", value: "Legendär" },
      { label: "Regelbrüche", value: "Viele" },
      { label: "Freiheit", value: "∞" }
    ],
    compatibility: {
      allies: ["sunflower", "poppy"],
      nemesis: "orchid"
    },
    share_text: "Ich bin eine Wildblume 🌸 Ich wachse überall – und folge nur meinen Regeln. Und du?",
    markers: [{ id: "marker.flower.wildflower", weight: 1.0 }, { id: "marker.flower.freedom", weight: 0.9 }]
  },
  orchid: {
    id: "orchid",
    title: "Die Orchidee",
    emoji: "🪻",
    tagline: "Selten, sensibel und von atemberaubender Tiefe.",
    description: "Dein Samen brauchte besondere Bedingungen – und das ist keine Schwäche, sondern ein Hinweis auf deine Einzigartigkeit. Als Kind hast du vielleicht gemerkt, dass du anders fühlst als andere. Intensiver. Feiner. Heute verstehst du: Deine Sensibilität ist ein Instrument. Du brauchst mehr Pflege als andere Blumen – aber du gibst auch mehr zurück.",
    stats: [
      { label: "Feinfühligkeit", value: "Ultra" },
      { label: "Seltenheit", value: "Unique" },
      { label: "Pflegebedarf", value: "Hoch" }
    ],
    compatibility: {
      allies: ["lotus", "lavender"],
      nemesis: "wildflower"
    },
    share_text: "Ich bin eine Orchidee 🪻 Selten, sensibel und tiefgründig. Und du?",
    markers: [{ id: "marker.flower.orchid", weight: 1.0 }, { id: "marker.flower.sensitivity", weight: 0.9 }]
  },
  lavender: {
    id: "lavender",
    title: "Der Lavendel",
    emoji: "💜",
    tagline: "Deine Ruhe heilt – auch wenn du nichts tust.",
    description: "Dein Samen wurde in kargen Boden gepflanzt – und gerade deshalb hast du gelernt, mit wenig zu gedeihen und viel zu geben. Als Kind warst du vielleicht die Ruhige im Hintergrund. Heute bist du der Anker für aufgewühlte Seelen. Deine bloße Präsenz beruhigt. Du brauchst nicht viel zu sagen – dein Sein reicht.",
    stats: [
      { label: "Heilkraft", value: "Still" },
      { label: "Beständigkeit", value: "100%" },
      { label: "Bescheidenheit", value: "Hoch" }
    ],
    compatibility: {
      allies: ["lotus", "sunflower", "orchid"],
      nemesis: "poppy"
    },
    share_text: "Ich bin Lavendel 💜 Meine Ruhe heilt. Und du?",
    markers: [{ id: "marker.flower.lavender", weight: 1.0 }, { id: "marker.flower.calm", weight: 0.9 }]
  },
  poppy: {
    id: "poppy",
    title: "Die Mohnblume",
    emoji: "🌺",
    tagline: "Du brennst hell – und hinterlässt Spuren.",
    description: "Dein Samen wurde in feurige Erde gepflanzt – und du hast nie gelernt, weniger zu fühlen. Als Kind warst du vielleicht intensiv. Laut in deiner Freude, unüberhörbar in deinem Schmerz. Heute weißt du: Deine Intensität ist ein Geschenk. Du lebst, während andere nur existieren.",
    stats: [
      { label: "Intensität", value: "Fire" },
      { label: "Lebensfreude", value: "Explosiv" },
      { label: "Drama", value: "Ja" }
    ],
    compatibility: {
      allies: ["wildflower", "sunflower"],
      nemesis: "lavender"
    },
    share_text: "Ich bin eine Mohnblume 🌺 Ich brenne hell. Und du?",
    markers: [{ id: "marker.flower.poppy", weight: 1.0 }, { id: "marker.flower.passion", weight: 0.9 }]
  }
};

export type DimensionScores = { licht: number; wurzeln: number; rhythmus: number; wasser: number };

// Profile patterns for scoring (normalized vectors - approx based on JSON logic)
const patterns: Record<string, DimensionScores> = {
  sunflower: { licht: 5, wurzeln: 3, rhythmus: 4, wasser: 3 },
  lotus: { licht: 1, wurzeln: 4, rhythmus: 2, wasser: 5 },
  wildflower: { licht: 4, wurzeln: 1, rhythmus: 5, wasser: 2 },
  orchid: { licht: 2, wurzeln: 3, rhythmus: 2, wasser: 4 }, // Adjusted to distinguish
  lavender: { licht: 2, wurzeln: 5, rhythmus: 1, wasser: 2 },
  poppy: { licht: 5, wurzeln: 2, rhythmus: 5, wasser: 4 }
};

export function calculateProfile(scores: DimensionScores): ValidationProfile {
    // Dot Product similarity
    // We find the profile vector that aligns best with user vector.
    
    let bestMatch = "sunflower";
    let maxSimilarity = -Infinity;
   
   for (const [id, pattern] of Object.entries(patterns)) {
      const dotProduct = 
        scores.licht * pattern.licht +
        scores.wurzeln * pattern.wurzeln +
        scores.rhythmus * pattern.rhythmus +
        scores.wasser * pattern.wasser;
        
      if (dotProduct > maxSimilarity) {
        maxSimilarity = dotProduct;
        bestMatch = id;
      }
   }
   
   return profiles[bestMatch];
}
