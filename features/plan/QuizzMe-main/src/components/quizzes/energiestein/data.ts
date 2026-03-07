
import { QuizMeta, Question, ValidationProfile } from '../types';

export const quizMeta: QuizMeta = {
  id: "quiz.energiestein.v1",
  title: "Dein Energiestein",
  subtitle: "Entdecke den Stein, der deine verborgene Essenz widerspiegelt",
  description: "Welcher Kristall resoniert mit deiner Seele? Entdecke den Stein, der deine verborgene Essenz widerspiegelt.",
  questions_count: 10,
  estimated_duration_seconds: 180,
  disclaimer: "Dieser Test dient der spielerischen Selbstreflexion und stellt keine psychologische oder esoterische Diagnose dar."
};

export const dimensions = [
  { id: "clarity", label: "Klarheit", pole_low: "Intuitiv", pole_high: "Analytisch" },
  { id: "energy", label: "Energie", pole_low: "Sanft", pole_high: "Intensiv" },
  { id: "focus", label: "Fokus", pole_low: "Innen", pole_high: "Außen" }
];

export const questions: Question[] = [
  {
    id: "q1",
    text: "Du betrittst eine Kristallhöhle. Welches Licht zieht dich zuerst an?",
    options: [
      { id: "q1a", text: "Ein sanftes violettes Glimmen aus der Tiefe", scores: { clarity: 2, energy: 1, focus: 3 } },
      { id: "q1b", text: "Klare, weiße Lichtreflexionen an den Wänden", scores: { clarity: 5, energy: 2, focus: 2 } },
      { id: "q1c", text: "Warme, goldene Strahlen durch einen Spalt", scores: { clarity: 3, energy: 4, focus: 4 } },
      { id: "q1d", text: "Tiefes Schwarz mit einzelnen Funken", scores: { clarity: 1, energy: 5, focus: 1 } }
    ]
  },
  {
    id: "q2",
    text: "Wenn du einen Stein in der Hand hältst, was spürst du am liebsten?",
    options: [
      { id: "q2a", text: "Eine beruhigende Kühle, die mich erdet", scores: { clarity: 4, energy: 1, focus: 2 } },
      { id: "q2b", text: "Ein leichtes Kribbeln wie elektrische Spannung", scores: { clarity: 2, energy: 5, focus: 4 } },
      { id: "q2c", text: "Eine sanfte Wärme, die durch mich fließt", scores: { clarity: 3, energy: 3, focus: 3 } },
      { id: "q2d", text: "Das Gewicht und die Präsenz des Moments", scores: { clarity: 1, energy: 2, focus: 1 } }
    ]
  },
  {
    id: "q3",
    text: "In einem wichtigen Gespräch – was ist dir am wichtigsten?",
    options: [
      { id: "q3a", text: "Die Wahrheit klar und direkt auszusprechen", scores: { clarity: 5, energy: 4, focus: 4 } },
      { id: "q3b", text: "Die Gefühle des anderen zu verstehen und zu spiegeln", scores: { clarity: 2, energy: 2, focus: 2 } },
      { id: "q3c", text: "Eine Lösung zu finden, die alle weiterbringt", scores: { clarity: 4, energy: 3, focus: 5 } },
      { id: "q3d", text: "Raum für das Ungesagte zu lassen", scores: { clarity: 1, energy: 1, focus: 1 } }
    ]
  },
  {
    id: "q4",
    text: "Ein unerwartetes Problem taucht auf. Deine erste Reaktion?",
    options: [
      { id: "q4a", text: "Tief durchatmen und die Ruhe in mir finden", scores: { clarity: 2, energy: 1, focus: 1 } },
      { id: "q4b", text: "Sofort analysieren: Was sind die Optionen?", scores: { clarity: 5, energy: 4, focus: 5 } },
      { id: "q4c", text: "Vertrauen, dass sich der richtige Weg zeigt", scores: { clarity: 1, energy: 2, focus: 2 } },
      { id: "q4d", text: "Die Energie nutzen, um ins Handeln zu kommen", scores: { clarity: 3, energy: 5, focus: 4 } }
    ]
  },
  {
    id: "q5",
    text: "Was beschreibt deine Art zu träumen am besten?",
    options: [
      { id: "q5a", text: "Lebhafte, farbige Bilder voller Symbolik", scores: { clarity: 2, energy: 3, focus: 2 } },
      { id: "q5b", text: "Klare Szenarien, fast wie Filme", scores: { clarity: 4, energy: 2, focus: 4 } },
      { id: "q5c", text: "Tiefe Gefühle ohne klare Bilder", scores: { clarity: 1, energy: 2, focus: 1 } },
      { id: "q5d", text: "Intensive Erlebnisse, an die ich mich lebhaft erinnere", scores: { clarity: 3, energy: 5, focus: 3 } }
    ]
  },
  {
    id: "q6",
    text: "Du findest einen alten Schlüssel. Was denkst du zuerst?",
    options: [
      { id: "q6a", text: "Welche Tür er wohl öffnet?", scores: { clarity: 4, energy: 3, focus: 5 } },
      { id: "q6b", text: "Wer ihn wohl verloren hat?", scores: { clarity: 2, energy: 2, focus: 3 } },
      { id: "q6c", text: "Er fühlt sich bedeutsam an – ich behalte ihn", scores: { clarity: 1, energy: 1, focus: 1 } },
      { id: "q6d", text: "Ich werde herausfinden, was er öffnet", scores: { clarity: 3, energy: 5, focus: 4 } }
    ]
  },
  {
    id: "q7",
    text: "Welche Umgebung gibt dir am meisten Energie?",
    options: [
      { id: "q7a", text: "Ein stiller Berggipfel über den Wolken", scores: { clarity: 5, energy: 2, focus: 2 } },
      { id: "q7b", text: "Ein lebendiger Markt voller Menschen und Farben", scores: { clarity: 2, energy: 5, focus: 5 } },
      { id: "q7c", text: "Ein uralter Wald, in dem die Zeit stehen bleibt", scores: { clarity: 1, energy: 2, focus: 1 } },
      { id: "q7d", text: "Am Meer, wo Wellen kommen und gehen", scores: { clarity: 3, energy: 3, focus: 3 } }
    ]
  },
  {
    id: "q8",
    text: "Ein Freund ist in einer Krise. Wie hilfst du am besten?",
    options: [
      { id: "q8a", text: "Ich höre zu und bin einfach da", scores: { clarity: 2, energy: 1, focus: 2 } },
      { id: "q8b", text: "Ich helfe ihm, die Situation klar zu sehen", scores: { clarity: 5, energy: 3, focus: 4 } },
      { id: "q8c", text: "Ich ermutige ihn, seiner Intuition zu vertrauen", scores: { clarity: 1, energy: 2, focus: 1 } },
      { id: "q8d", text: "Ich schlage konkrete Schritte vor", scores: { clarity: 4, energy: 4, focus: 5 } }
    ]
  },
  {
    id: "q9",
    text: "Was zieht dich an einem Menschen am meisten an?",
    options: [
      { id: "q9a", text: "Eine ruhige, tiefe Präsenz", scores: { clarity: 2, energy: 1, focus: 1 } },
      { id: "q9b", text: "Scharfer Verstand und klare Kommunikation", scores: { clarity: 5, energy: 3, focus: 4 } },
      { id: "q9c", text: "Warme Herzlichkeit und Einfühlungsvermögen", scores: { clarity: 3, energy: 2, focus: 3 } },
      { id: "q9d", text: "Leidenschaft und Tatendrang", scores: { clarity: 2, energy: 5, focus: 5 } }
    ]
  },
  {
    id: "q10",
    text: "Du stehst an einer Kreuzung. Ein Weg ist klar, einer im Nebel. Du wählst...",
    options: [
      { id: "q10a", text: "Den klaren Weg – ich weiß gern, wohin ich gehe", scores: { clarity: 5, energy: 3, focus: 5 } },
      { id: "q10b", text: "Den Nebel – das Mysterium ruft mich", scores: { clarity: 1, energy: 3, focus: 1 } },
      { id: "q10c", text: "Ich warte einen Moment und spüre hinein", scores: { clarity: 2, energy: 1, focus: 2 } },
      { id: "q10d", text: "Ich gehe los, egal wohin – Bewegung zählt", scores: { clarity: 3, energy: 5, focus: 4 } }
    ]
  }
];

export const profiles: Record<string, ValidationProfile> = {
  amethyst: {
    id: "amethyst",
    title: "Amethyst",
    tagline: "Der Kristall der tiefen Intuition",
    description: "Dein Energiestein ist der Amethyst – der Hüter zwischen Welten. Wie das violette Schimmern in der Dämmerung trägst du eine natürliche Verbindung zum Unsichtbaren in dir. Andere spüren in deiner Nähe eine Tiefe, die sie beruhigt und gleichzeitig fasziniert. Du verarbeitest das Leben nicht an der Oberfläche, sondern lässt es durch die Filter deiner Seele sickern. Deine Träume sind lebhaft, deine Ahnungen oft treffend. Der Amethyst lädt dich ein, diesem inneren Kompass noch mehr zu vertrauen.",
    emoji: "🔮",
    stats: [
      { label: "Intuition", value: 92 },
      { label: "Ruhe", value: 95 },
      { label: "Klarheit", value: 80 },
      { label: "Transformation", value: 85 }
    ],
    compatibility: {
      allies: ["mondstein", "labradorit"],
      nemesis: ["tigerauge", "citrin"]
    },
    share_text: "Mein Energiestein ist AMETHYST 🔮 – Tiefe Intuition. Und deiner?",
    markers: [
      { id: "marker.stone.amethyst", weight: 1.0 },
      { id: "marker.stone.intuition", weight: 0.85 }
    ]
  },
  bergkristall: {
    id: "bergkristall",
    title: "Bergkristall",
    tagline: "Der Kristall der absoluten Klarheit",
    description: "Dein Energiestein ist der Bergkristall – rein, klar, ungefiltert. Wie ein Fenster, das Licht ohne Verzerrung durchlässt, hast du die Gabe, Dinge so zu sehen, wie sie wirklich sind. Diese Klarheit ist dein Geschenk und manchmal auch deine Last, denn nicht jeder möchte die Wahrheit unverhüllt sehen. Der Bergkristall verstärkt, was ist – er macht das Gute heller und das Ungeklärte sichtbarer. Nutze diese Kraft weise: Sie reinigt nicht nur deinen eigenen Geist, sondern hilft auch anderen, Licht in ihre Schatten zu bringen.",
    emoji: "💎",
    stats: [
      { label: "Klarheit", value: 100 },
      { label: "Verstärkung", value: 95 },
      { label: "Reinheit", value: 90 },
      { label: "Fokus", value: 95 }
    ],
    compatibility: {
      allies: ["citrin", "tigerauge"],
      nemesis: ["obsidian", "labradorit"]
    },
    share_text: "Mein Energiestein ist BERGKRISTALL 💎 – Absolute Klarheit. Und deiner?",
    markers: [
      { id: "marker.stone.bergkristall", weight: 1.0 },
      { id: "marker.stone.clarity", weight: 0.9 }
    ]
  },
  rosenquarz: {
    id: "rosenquarz",
    title: "Rosenquarz",
    tagline: "Der Kristall der bedingungslosen Liebe",
    description: "Dein Energiestein ist der Rosenquarz – sanft und doch so kraftvoll wie die Liebe selbst. Du trägst ein offenes Herz durch die Welt, und das ist mutiger, als die meisten ahnen. Wo andere Mauern bauen, baust du Brücken. Deine Wärme ist keine Schwäche – sie ist deine Superkraft. Der Rosenquarz erinnert dich daran, dass diese Liebe auch dir selbst gehört. In einer Welt, die oft hart erscheint, bist du der sanfte Beweis, dass Weichheit eine Stärke ist.",
    emoji: "💖",
    stats: [
      { label: "Mitgefühl", value: 100 },
      { label: "Wärme", value: 95 },
      { label: "Heilung", value: 88 },
      { label: "Selbstliebe", value: 90 }
    ],
    compatibility: {
      allies: ["mondstein", "amethyst"],
      nemesis: ["obsidian", "tigerauge"]
    },
    share_text: "Mein Energiestein ist ROSENQUARZ 💖 – Bedingungslose Liebe. Und deiner?",
    markers: [
      { id: "marker.stone.rosenquarz", weight: 1.0 },
      { id: "marker.stone.love", weight: 0.9 }
    ]
  },
  obsidian: {
    id: "obsidian",
    title: "Obsidian",
    tagline: "Der Kristall des Schattenwächters",
    description: "Dein Energiestein ist der Obsidian – geboren aus Feuer, geformt in Sekunden, stark wie die Wahrheit. Du hast keine Angst vor der Dunkelheit, denn du weißt: Dort liegt oft das Wertvollste verborgen. Obsidian zeigt dir, was andere lieber nicht sehen wollen – und du hast den Mut, hinzuschauen. Dieser Stein schneidet durch Illusionen wie durch Butter. Er schützt nicht durch Abschirmung, sondern durch radikale Ehrlichkeit. Mit ihm an deiner Seite findest du die Stärke in deinen Schatten.",
    emoji: "🖤",
    stats: [
      { label: "Schutz", value: 98 },
      { label: "Wahrheit", value: 95 },
      { label: "Tiefe", value: 90 },
      { label: "Transformation", value: 85 }
    ],
    compatibility: {
      allies: ["tigerauge", "labradorit"],
      nemesis: ["rosenquarz", "citrin"]
    },
    share_text: "Mein Energiestein ist OBSIDIAN 🖤 – Schattenwächter. Und deiner?",
    markers: [
      { id: "marker.stone.obsidian", weight: 1.0 },
      { id: "marker.stone.protection", weight: 0.85 }
    ]
  },
  tigerauge: {
    id: "tigerauge",
    title: "Tigerauge",
    tagline: "Der Kristall des fokussierten Willens",
    description: "Dein Energiestein ist das Tigerauge – schimmernd zwischen Gold und Erde, wachsam und entschlossen. Du bist jemand, der Dinge in Bewegung bringt. Nicht durch Lärm, sondern durch präzise Klarheit und den Mut, zu handeln, wenn andere noch zögern. Das Tigerauge vereint das Feuer des Willens mit der Erdung der Vernunft. Du siehst Chancen, wo andere Hindernisse sehen, und du hast die Ausdauer, drantzubleiben. Dieser Stein erinnert dich: Fokus ist keine Einschränkung – er ist Freiheit.",
    emoji: "🐅",
    stats: [
      { label: "Fokus", value: 95 },
      { label: "Willenskraft", value: 94 },
      { label: "Erdung", value: 90 },
      { label: "Erfolg", value: 85 }
    ],
    compatibility: {
      allies: ["bergkristall", "citrin"],
      nemesis: ["amethyst", "mondstein"]
    },
    share_text: "Mein Energiestein ist TIGERAUGE 🐅 – Fokussierter Wille. Und deiner?",
    markers: [
      { id: "marker.stone.tigerauge", weight: 1.0 },
      { id: "marker.stone.willpower", weight: 0.9 }
    ]
  },
  mondstein: {
    id: "mondstein",
    title: "Mondstein",
    tagline: "Der Kristall der sanften Zyklen",
    description: "Dein Energiestein ist der Mondstein – schimmernd wie der Nachthimmel, verbunden mit dem Rhythmus des Lebens selbst. Du verstehst intuitiv, dass alles Phasen hat: Wachstum und Ruhe, Fülle und Leere, Licht und Schatten. Diese Weisheit macht dich zu einem Anker in unruhigen Zeiten. Der Mondstein flüstert dir zu, dass du nicht gegen die Gezeiten kämpfen musst – du kannst mit ihnen fließen. Deine Empfänglichkeit ist keine Passivität, sondern eine tiefe Form der Stärke.",
    emoji: "🌙",
    stats: [
      { label: "Intuition", value: 95 },
      { label: "Empfänglichkeit", value: 90 },
      { label: "Rhythmus", value: 85 },
      { label: "Weisheit", value: 80 }
    ],
    compatibility: {
      allies: ["amethyst", "rosenquarz"],
      nemesis: ["tigerauge", "citrin"]
    },
    share_text: "Mein Energiestein ist MONDSTEIN 🌙 – Sanfte Zyklen. Und deiner?",
    markers: [
      { id: "marker.stone.mondstein", weight: 1.0 },
      { id: "marker.stone.cycles", weight: 0.85 }
    ]
  },
  labradorit: {
    id: "labradorit",
    title: "Labradorit",
    tagline: "Der Kristall der verborgenen Farben",
    description: "Dein Energiestein ist der Labradorit – unscheinbar auf den ersten Blick, dann plötzlich ein Feuerwerk aus Farben. Du bist komplexer, als andere vermuten, und das ist deine geheime Stärke. Wie der Labradorit zeigst du verschiedenen Menschen verschiedene Facetten, ohne je unwahr zu sein. Dieser Stein ist der Hüter der Magie im Alltäglichen. Er erinnert dich daran, dass Transformation nicht immer laut sein muss – manchmal geschieht sie im Stillen, bis plötzlich alles im neuen Licht erscheint.",
    emoji: "✨",
    stats: [
      { label: "Magie", value: 95 },
      { label: "Wandlung", value: 90 },
      { label: "Tiefe", value: 92 },
      { label: "Schutz", value: 85 }
    ],
    compatibility: {
      allies: ["amethyst", "obsidian"],
      nemesis: ["bergkristall", "citrin"]
    },
    share_text: "Mein Energiestein ist LABRADORIT ✨ – Verborgene Farben. Und deiner?",
    markers: [
      { id: "marker.stone.labradorit", weight: 1.0 },
      { id: "marker.stone.magic", weight: 0.85 }
    ]
  },
  citrin: {
    id: "citrin",
    title: "Citrin",
    tagline: "Der Kristall der strahlenden Fülle",
    description: "Dein Energiestein ist der Citrin – flüssiges Sonnenlicht, gefangen in Kristallform. Du trägst eine natürliche Leuchtkraft in dir, die andere anzieht wie Motten das Licht. Citrin ist der Stein der Manifestation: Er verwandelt Gedanken in Realität, Ideen in Taten. Deine Energie ist ansteckend, dein Optimismus keine Naivität, sondern bewusste Entscheidung. Dieser Stein erinnert dich daran, dass Fülle kein Nullsummenspiel ist – je mehr du strahlst, desto mehr Licht gibt es für alle.",
    emoji: "☀️",
    stats: [
      { label: "Energie", value: 98 },
      { label: "Optimismus", value: 96 },
      { label: "Manifestation", value: 90 },
      { label: "Ausstrahlung", value: 95 }
    ],
    compatibility: {
      allies: ["tigerauge", "bergkristall"],
      nemesis: ["rosenquarz", "mondstein"]
    },
    share_text: "Mein Energiestein ist CITRIN ☀️ – Strahlende Fülle. Und deiner?",
    markers: [
      { id: "marker.stone.citrin", weight: 1.0 },
      { id: "marker.stone.abundance", weight: 0.9 }
    ]
  }
};

export type DimensionScores = { clarity: number; energy: number; focus: number };

// Bands: low (0-0.39), mid (0.40-0.69), high (0.70-1.0)
// Max score per dim = 5 (max per Q) * 10 (Questions) = 50.
// But some questions give 5 per dim, some give less.
// Let's sum max potential.
// Actually, looking at options:
// Q1: clarity (1-5), energy (1-5), focus (1-4).
// Let's assume raw sum is passed and we normalize it.
// Max possible per dimension is approx 5 * 10 = 50.
// We map raw sum (0-50) to 0-1.

function getBand(score: number, max: number): 'low' | 'mid' | 'high' {
  const ratio = score / max;
  if (ratio <= 0.39) return 'low';
  if (ratio <= 0.69) return 'mid';
  return 'high';
}

export function calculateProfile(scores: DimensionScores): ValidationProfile {
  // Estimated max score per dimension (approx 40-50 based on distribution)
  // Let's use 45 as a safe upper bound for 1.0 ratio or just raw thresholds.
  // Actually, let's look at the mapping logic in JSON:
  // "profileMapping": { "low-low-low": "amethyst", ... }
  // We need to implement this map.
  
  const MAX_SCORE = 45; // Approx

  const bC = getBand(scores.clarity, MAX_SCORE);
  const bE = getBand(scores.energy, MAX_SCORE);
  const bF = getBand(scores.focus, MAX_SCORE);
  
  const key = `${bC}-${bE}-${bF}`;

  const map: Record<string, string> = {
      "low-low-low": "amethyst",
      "low-low-mid": "mondstein",
      "low-low-high": "rosenquarz",
      "low-mid-low": "labradorit",
      "low-mid-mid": "amethyst",
      "low-mid-high": "labradorit",
      "low-high-low": "obsidian",
      "low-high-mid": "obsidian",
      "low-high-high": "labradorit",
      "mid-low-low": "mondstein",
      "mid-low-mid": "rosenquarz",
      "mid-low-high": "rosenquarz",
      "mid-mid-low": "amethyst",
      "mid-mid-mid": "rosenquarz",
      "mid-mid-high": "tigerauge",
      "mid-high-low": "labradorit",
      "mid-high-mid": "citrin",
      "mid-high-high": "tigerauge",
      "high-low-low": "mondstein",
      "high-low-mid": "bergkristall",
      "high-low-high": "bergkristall",
      "high-mid-low": "bergkristall",
      "high-mid-mid": "bergkristall",
      "high-mid-high": "tigerauge",
      "high-high-low": "obsidian",
      "high-high-mid": "citrin",
      "high-high-high": "citrin"
  };

  const profileId = map[key] || "bergkristall"; // Fallback
  return profiles[profileId];
}
