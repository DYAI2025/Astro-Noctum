
export const quizMeta = {
  id: "quiz.social_role.v2",
  title: "Deine Soziale Rolle",
  subtitle: "Welche Funktion erfüllst du in Gruppen?",
  description: "10 Szenarien enthüllen deine natürliche Position in sozialen Gefügen.",
  questions_count: 10,
  disclaimer: "Dieser Test dient der spielerischen Selbstreflexion und stellt keine psychologische Diagnose dar."
};

export const questions = [
  {
    id: "q1",
    scenario: "Eine Gruppe muss entscheiden, wohin es geht...",
    text: "Wie verhältst du dich?",
    options: [
      { id: "q1_a", text: "Ich mache einen klaren Vorschlag", scores: { leadership: 5, expression: 3 } },
      { id: "q1_b", text: "Ich frage, was alle wollen", scores: { harmony: 5, support: 3 } },
      { id: "q1_c", text: "Ich mache einen Witz und lockere die Stimmung", scores: { expression: 5, harmony: 2 } },
      { id: "q1_d", text: "Ich beobachte erstmal, was die anderen denken", scores: { support: 2, harmony: 2 } }
    ]
  },
  {
    id: "q2",
    scenario: "Jemand in der Gruppe wirkt traurig...",
    text: "Deine natürliche Reaktion?",
    options: [
      { id: "q2_a", text: "Ich spreche die Person direkt und einfühlsam an", scores: { support: 5, harmony: 4 } },
      { id: "q2_b", text: "Ich versuche, sie aufzuheitern", scores: { expression: 4, support: 3 } },
      { id: "q2_c", text: "Ich schaffe Raum, falls sie reden möchte", scores: { harmony: 4, support: 4 } },
      { id: "q2_d", text: "Ich nehme es wahr, aber warte ab", scores: { leadership: 1, harmony: 2 } }
    ]
  },
  {
    id: "q3",
    scenario: "Die Stimmung kippt – es gibt Streit...",
    text: "Wie reagierst du?",
    options: [
      { id: "q3_a", text: "Ich greife ein und moderiere", scores: { leadership: 5, harmony: 4 } },
      { id: "q3_b", text: "Ich versuche, die Wogen zu glätten", scores: { harmony: 5, support: 3 } },
      { id: "q3_c", text: "Ich mische mich nicht ein – nicht mein Kampf", scores: { expression: 1, leadership: 0 } },
      { id: "q3_d", text: "Ich unterstütze, wen ich für im Recht halte", scores: { leadership: 3, expression: 2 } }
    ]
  },
  {
    id: "q4",
    scenario: "Auf einer Party bist du...",
    text: "Was beschreibt dich am besten?",
    options: [
      { id: "q4_a", text: "Der, der die Leute zusammenbringt", scores: { harmony: 5, leadership: 3 } },
      { id: "q4_b", text: "Der, der alle zum Lachen bringt", scores: { expression: 5, harmony: 2 } },
      { id: "q4_c", text: "Der, der tiefe Gespräche führt", scores: { support: 4, harmony: 3 } },
      { id: "q4_d", text: "Der, der organisiert, dass alles läuft", scores: { leadership: 5, support: 2 } }
    ]
  },
  {
    id: "q5",
    scenario: "In einem Team-Projekt...",
    text: "Welche Rolle übernimmst du automatisch?",
    options: [
      { id: "q5_a", text: "Der mit dem Plan – ich strukturiere", scores: { leadership: 5, support: 2 } },
      { id: "q5_b", text: "Der Motivator – ich halte die Stimmung hoch", scores: { expression: 4, harmony: 4 } },
      { id: "q5_c", text: "Der Zuhörer – ich sammle alle Meinungen", scores: { harmony: 5, support: 4 } },
      { id: "q5_d", text: "Der Macher – ich setze um", scores: { leadership: 3, expression: 2 } }
    ]
  },
  {
    id: "q6",
    scenario: "Du hast eine unpopuläre Meinung...",
    text: "Wie gehst du damit um?",
    options: [
      { id: "q6_a", text: "Ich sage sie trotzdem – Ehrlichkeit zählt", scores: { leadership: 4, expression: 4 } },
      { id: "q6_b", text: "Ich warte auf den richtigen Moment", scores: { harmony: 3, leadership: 2 } },
      { id: "q6_c", text: "Ich verpacke sie humorvoll", scores: { expression: 5, harmony: 3 } },
      { id: "q6_d", text: "Ich behalte sie für mich – Frieden ist wichtiger", scores: { harmony: 5, support: 2 } }
    ]
  },
  {
    id: "q7",
    scenario: "Ein Freund braucht einen Rat...",
    text: "Wie hilfst du?",
    options: [
      { id: "q7_a", text: "Ich höre zu und stelle Fragen", scores: { support: 5, harmony: 4 } },
      { id: "q7_b", text: "Ich sage klar, was ich denke", scores: { leadership: 4, expression: 3 } },
      { id: "q7_c", text: "Ich teile ähnliche Erfahrungen", scores: { harmony: 4, expression: 3 } },
      { id: "q7_d", text: "Ich lenke ab, um den Kopf freizubekommen", scores: { expression: 4, support: 2 } }
    ]
  },
  {
    id: "q8",
    scenario: "Du kommst in eine neue Gruppe...",
    text: "Wie findest du deinen Platz?",
    options: [
      { id: "q8_a", text: "Ich beobachte und passe mich an", scores: { harmony: 4, support: 3 } },
      { id: "q8_b", text: "Ich stelle mich vor und bringe mich ein", scores: { expression: 4, leadership: 4 } },
      { id: "q8_c", text: "Ich suche mir einen Gesprächspartner", scores: { support: 4, harmony: 4 } },
      { id: "q8_d", text: "Ich schaue, wo ich helfen kann", scores: { support: 5, harmony: 3 } }
    ]
  },
  {
    id: "q9",
    scenario: "Die Gruppe ist ratlos...",
    text: "Was ist dein Impuls?",
    options: [
      { id: "q9_a", text: "Ich übernehme und gebe Richtung vor", scores: { leadership: 5, expression: 3 } },
      { id: "q9_b", text: "Ich sammle Ideen von allen", scores: { harmony: 5, support: 4 } },
      { id: "q9_c", text: "Ich mache einen unkonventionellen Vorschlag", scores: { expression: 5, leadership: 2 } },
      { id: "q9_d", text: "Ich unterstütze, wer sich traut", scores: { support: 5, harmony: 3 } }
    ]
  },
  {
    id: "q10",
    scenario: "Was macht dich in Gruppen wertvoll?",
    text: "Wähle deine Superpower:",
    options: [
      { id: "q10_a", text: "Ich bringe Struktur und Klarheit", scores: { leadership: 5, harmony: 2 } },
      { id: "q10_b", text: "Ich verbinde Menschen miteinander", scores: { harmony: 5, support: 4 } },
      { id: "q10_c", text: "Ich bringe Energie und gute Laune", scores: { expression: 5, harmony: 3 } },
      { id: "q10_d", text: "Ich sorge dafür, dass sich alle wohlfühlen", scores: { support: 5, harmony: 4 } }
    ]
  }
];

export const profiles = [
  {
    id: "leader",
    title: "Der Anführer",
    icon: "👑",
    tagline: "Du gibst Richtung, wenn andere zögern.",
    description: "Du bist der natürliche Pol, um den sich Gruppen ordnen. Nicht weil du dich aufdrängst, sondern weil andere in dir die Klarheit finden, die sie suchen. Du triffst Entscheidungen, wenn alle anderen noch diskutieren.",
    stats: [
      { label: "Führungsinstinkt", value: 95 },
      { label: "Entscheidungsfreude", value: 92 },
      { label: "Präsenz", value: 89 },
      { label: "Geduld", value: 45 }
    ],
    compatibility: { allies: ["connector", "caretaker"], nemesis: "rebel" },
    share_text: "👑 Meine soziale Rolle: Der Anführer – ich gebe Richtung, wenn andere zögern."
  },
  {
    id: "connector",
    title: "Der Brückenbauer",
    icon: "🌉",
    tagline: "Du webst das unsichtbare Netz, das alle verbindet.",
    description: "Du bist der soziale Klebstoff. Du merkst, wer sich unwohl fühlt, wer ausgegrenzt wird, und du baust Brücken. Ohne dich würden Gruppen in Einzelteile zerfallen.",
    stats: [
      { label: "Empathie", value: 97 },
      { label: "Netzwerk-Instinkt", value: 94 },
      { label: "Konfliktlösung", value: 89 },
      { label: "Durchsetzung", value: 42 }
    ],
    compatibility: { allies: ["leader", "caretaker"], nemesis: "rebel" },
    share_text: "🌉 Meine soziale Rolle: Der Brückenbauer – ich verbinde Menschen."
  },
  {
    id: "entertainer",
    title: "Der Entertainer",
    icon: "🎭",
    tagline: "Du bringst Licht, wo andere Dunkelheit sehen.",
    description: "Du bist die Energie im Raum. Du spürst, wann die Stimmung kippt, und du weißt, wie du sie drehst. Dein Humor ist keine Flucht – er ist Medizin für die Seele der Gruppe.",
    stats: [
      { label: "Charisma", value: 96 },
      { label: "Timing", value: 93 },
      { label: "Spontanität", value: 95 },
      { label: "Tiefgang", value: 48 }
    ],
    compatibility: { allies: ["connector", "sage"], nemesis: "caretaker" },
    share_text: "🎭 Meine soziale Rolle: Der Entertainer – ich bringe Energie und Freude."
  },
  {
    id: "sage",
    title: "Der Weise",
    icon: "📚",
    tagline: "Du siehst, was anderen verborgen bleibt.",
    description: "Du bist der ruhende Pol. Während andere reagieren, beobachtest du. Und wenn du sprichst, hören alle zu – weil sie wissen, dass deine Worte Gewicht haben.",
    stats: [
      { label: "Beobachtungsgabe", value: 97 },
      { label: "Weisheit", value: 94 },
      { label: "Geduld", value: 96 },
      { label: "Smalltalk", value: 35 }
    ],
    compatibility: { allies: ["leader", "caretaker"], nemesis: "entertainer" },
    share_text: "📚 Meine soziale Rolle: Der Weise – ich sehe, was anderen verborgen bleibt."
  },
  {
    id: "caretaker",
    title: "Der Hüter",
    icon: "🛡️",
    tagline: "Du sorgst dafür, dass niemand zurückbleibt.",
    description: "Du bist das Herz der Gruppe. Du merkst, wer Hunger hat, wer müde ist, wer Unterstützung braucht. Deine Fürsorge ist keine Schwäche – sie ist die Grundlage, auf der alles andere gedeiht.",
    stats: [
      { label: "Fürsorge", value: 98 },
      { label: "Aufmerksamkeit", value: 95 },
      { label: "Verlässlichkeit", value: 94 },
      { label: "Selbstpriorisierung", value: 32 }
    ],
    compatibility: { allies: ["leader", "connector"], nemesis: "rebel" },
    share_text: "🛡️ Meine soziale Rolle: Der Hüter – ich sorge für alle."
  },
  {
    id: "rebel",
    title: "Der Rebell",
    icon: "🔥",
    tagline: "Du hinterfragst, was alle akzeptieren.",
    description: "Du bist der notwendige Störfaktor. Du sagst, was andere denken, aber nicht aussprechen. Gruppen brauchen dich – auch wenn sie es nicht immer zugeben.",
    stats: [
      { label: "Unabhängigkeit", value: 97 },
      { label: "Ehrlichkeit", value: 94 },
      { label: "Mut", value: 96 },
      { label: "Diplomatie", value: 28 }
    ],
    compatibility: { allies: ["sage", "entertainer"], nemesis: "caretaker" },
    share_text: "🔥 Meine soziale Rolle: Der Rebell – ich sage, was andere denken."
  }
];

export const profileNames = Object.fromEntries(profiles.map(p => [p.id, p.title]));
