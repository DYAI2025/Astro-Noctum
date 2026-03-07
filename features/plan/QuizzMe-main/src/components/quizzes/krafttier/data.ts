
export const quizMeta = {
  id: "quiz.krafttier.v2",
  title: "Welches Krafttier führt dich?",
  subtitle: "Eine Reise zu deinem spirituellen Begleiter",
  description: "12 mystische Szenarien enthüllen, welches Tier deine Seele am tiefsten widerspiegelt.",
  questions_count: 12,
  disclaimer: "Dieser Test dient der spielerischen Selbstreflexion und stellt keine psychologische Diagnose dar."
};

// V2 Dimensions
export const dimensions = [
    { id: "mut", name: "Mut" },
    { id: "instinkt", name: "Instinkt" },
    { id: "sozial", name: "Sozial" },
    { id: "weisheit", name: "Weisheit" },
    { id: "schatten", name: "Schatten" },
    { id: "klarheit", name: "Klarheit" },
    { id: "freiheit", name: "Freiheit" },
    { id: "neugier", name: "Neugier" },
    { id: "anpassung", name: "Anpassung" },
    { id: "erdung", name: "Erdung" },
    { id: "flow", name: "Flow" },
    { id: "freude", name: "Freude" },
    { id: "vorsicht", name: "Vorsicht" }
] as const;

export type DimensionId = typeof dimensions[number]['id'];

// Animal Weights (Matrix for scoring)
const animalWeights: Record<string, Partial<Record<DimensionId, number>>> = {
    wolf: { sozial: 2, instinkt: 1.5, mut: 1, erdung: 0.8 },
    owl: { weisheit: 2, schatten: 1.5, klarheit: 1, vorsicht: 0.8 },
    eagle: { freiheit: 2, klarheit: 1.5, mut: 1, weisheit: 0.5 },
    bear: { erdung: 2, mut: 1.5, weisheit: 1, sozial: 0.5 },
    fox: { neugier: 2, anpassung: 1.5, weisheit: 1, flow: 0.8 },
    dolphin: { freude: 2, flow: 1.5, anpassung: 1, sozial: 0.5 }
};

export const questions = [
  {
    id: "q1",
    scenario: "Die Morgendämmerung bricht an...",
    text: "Was weckt dich wirklich auf?",
    options: [
      { id: "q1_a", text: "Der Ruf des Abenteuers – etwas Neues wartet", scores: { neugier: 5, freiheit: 4, mut: 3 } },
      { id: "q1_b", text: "Die Stille vor dem ersten Licht", scores: { weisheit: 4, schatten: 5, vorsicht: 3 } },
      { id: "q1_c", text: "Das Wissen, dass meine Liebsten sicher sind", scores: { sozial: 5, erdung: 4, mut: 2 } },
      { id: "q1_d", text: "Die Vorfreude auf spielerische Momente", scores: { freude: 5, flow: 4, anpassung: 3 } }
    ]
  },
  {
    id: "q2",
    scenario: "Der Wald ruft...",
    text: "Wie bewegst du dich durch unbekanntes Terrain?",
    options: [
      { id: "q2_a", text: "Mit wachsamen Sinnen – ich spüre jede Veränderung", scores: { instinkt: 5, vorsicht: 4, klarheit: 3 } },
      { id: "q2_b", text: "Von oben betrachtet – ich verschaffe mir zuerst Überblick", scores: { klarheit: 5, freiheit: 4, weisheit: 3 } },
      { id: "q2_c", text: "Mit spielerischer Neugier – jeder Pfad ist eine Entdeckung", scores: { neugier: 5, flow: 4, anpassung: 4 } },
      { id: "q2_d", text: "Bedächtig und verwurzelt – Schritt für Schritt", scores: { erdung: 5, mut: 4, weisheit: 3 } }
    ]
  },
  {
    id: "q3",
    scenario: "Ein Fremder taucht auf...",
    text: "Wie reagierst du auf unerwartete Begegnungen?",
    options: [
      { id: "q3_a", text: "Prüfend, aber offen – mein Instinkt wird mir zeigen, ob ich vertrauen kann", scores: { instinkt: 4, sozial: 5, mut: 3 } },
      { id: "q3_b", text: "Aus sicherer Distanz beobachtend", scores: { vorsicht: 5, weisheit: 4, schatten: 3 } },
      { id: "q3_c", text: "Neugierig – jede Begegnung trägt eine Geschichte", scores: { neugier: 5, anpassung: 4, freude: 3 } },
      { id: "q3_d", text: "Direkt und selbstbewusst – ich zeige, wer ich bin", scores: { mut: 5, freiheit: 4, erdung: 3 } }
    ]
  },
  {
    id: "q4",
    scenario: "Die Nacht bricht herein...",
    text: "Wo findest du Frieden?",
    options: [
      { id: "q4_a", text: "Im Kreise derer, die mir am Herzen liegen", scores: { sozial: 5, erdung: 4, freude: 3 } },
      { id: "q4_b", text: "In der Stille meiner eigenen Gedanken", scores: { weisheit: 5, schatten: 4, klarheit: 3 } },
      { id: "q4_c", text: "Im Gefühl absoluter Freiheit", scores: { freiheit: 5, mut: 4, flow: 3 } },
      { id: "q4_d", text: "Im spielerischen Moment des Hier und Jetzt", scores: { freude: 5, flow: 5, anpassung: 3 } }
    ]
  },
  {
    id: "q5",
    scenario: "Gefahr nähert sich...",
    text: "Wie reagierst du auf Bedrohungen?",
    options: [
      { id: "q5_a", text: "Ich stelle mich schützend vor die Meinen", scores: { mut: 5, sozial: 5, instinkt: 3 } },
      { id: "q5_b", text: "Ich analysiere die Lage mit klarem Verstand", scores: { weisheit: 5, klarheit: 4, vorsicht: 4 } },
      { id: "q5_c", text: "Ich vertraue meinen Instinkten und handle blitzschnell", scores: { instinkt: 5, mut: 4, freiheit: 3 } },
      { id: "q5_d", text: "Ich finde einen kreativen Ausweg", scores: { anpassung: 5, neugier: 4, flow: 4 } }
    ]
  },
  {
    id: "q6",
    scenario: "Ein Traum ruft...",
    text: "Was treibt dich wirklich an?",
    options: [
      { id: "q6_a", text: "Die Sehnsucht nach wahrer Verbundenheit", scores: { sozial: 5, erdung: 4, freude: 3 } },
      { id: "q6_b", text: "Die Suche nach tieferer Wahrheit", scores: { weisheit: 5, schatten: 4, klarheit: 4 } },
      { id: "q6_c", text: "Die Freiheit, meinen eigenen Weg zu gehen", scores: { freiheit: 5, mut: 4, neugier: 3 } },
      { id: "q6_d", text: "Der Wunsch, etwas Bleibendes zu schaffen", scores: { erdung: 5, mut: 3, klarheit: 4 } }
    ]
  },
  {
    id: "q7",
    scenario: "Die Schatten werden länger...",
    text: "Wie verarbeitest du schwierige Zeiten?",
    options: [
      { id: "q7_a", text: "Ich ziehe mich zurück und reflektiere", scores: { weisheit: 4, schatten: 5, vorsicht: 4 } },
      { id: "q7_b", text: "Ich suche Trost bei meinen Liebsten", scores: { sozial: 5, erdung: 4, freude: 2 } },
      { id: "q7_c", text: "Ich handle – Bewegung heilt", scores: { mut: 4, instinkt: 5, flow: 3 } },
      { id: "q7_d", text: "Ich finde Humor und Leichtigkeit", scores: { freude: 5, anpassung: 4, flow: 3 } }
    ]
  },
  {
    id: "q8",
    scenario: "Der Wind trägt Geschichten...",
    text: "Welche Eigenschaft bewunderst du am meisten?",
    options: [
      { id: "q8_a", text: "Unerschütterliche Loyalität", scores: { sozial: 5, erdung: 4, mut: 2 } },
      { id: "q8_b", text: "Scharfsinnige Weisheit", scores: { weisheit: 5, klarheit: 4, schatten: 3 } },
      { id: "q8_c", text: "Grenzenlose Freiheit", scores: { freiheit: 5, mut: 4, instinkt: 3 } },
      { id: "q8_d", text: "Ansteckende Lebensfreude", scores: { freude: 5, flow: 4, sozial: 3 } }
    ]
  },
  {
    id: "q9",
    scenario: "Am Scheideweg...",
    text: "Wie triffst du wichtige Entscheidungen?",
    options: [
      { id: "q9_a", text: "Aus dem Bauch heraus – mein Instinkt täuscht selten", scores: { instinkt: 5, mut: 4, flow: 3 } },
      { id: "q9_b", text: "Nach gründlicher Analyse aller Optionen", scores: { weisheit: 5, vorsicht: 4, klarheit: 4 } },
      { id: "q9_c", text: "Im Gespräch mit Menschen, denen ich vertraue", scores: { sozial: 5, erdung: 3, anpassung: 3 } },
      { id: "q9_d", text: "Ich probiere einfach aus und lerne daraus", scores: { neugier: 5, anpassung: 4, freude: 3 } }
    ]
  },
  {
    id: "q10",
    scenario: "Das Echo deiner Seele...",
    text: "Was ist deine größte Gabe?",
    options: [
      { id: "q10_a", text: "Mut – ich gehe, wohin andere nicht wagen", scores: { mut: 5, freiheit: 4, instinkt: 3 } },
      { id: "q10_b", text: "Empathie – ich fühle, was andere verbergen", scores: { sozial: 5, weisheit: 3, schatten: 3 } },
      { id: "q10_c", text: "Klarheit – ich sehe durch den Nebel", scores: { klarheit: 5, weisheit: 4, vorsicht: 3 } },
      { id: "q10_d", text: "Anpassung – ich fließe wie Wasser", scores: { anpassung: 5, flow: 4, freude: 3 } }
    ]
  },
  {
    id: "q11",
    scenario: "Das Feuer brennt...",
    text: "Was gibt dir Kraft, wenn alles dunkel scheint?",
    options: [
      { id: "q11_a", text: "Der Glaube an mich selbst", scores: { mut: 5, erdung: 4, instinkt: 3 } },
      { id: "q11_b", text: "Die Verbindung zu meinem Rudel", scores: { sozial: 5, freude: 3, erdung: 4 } },
      { id: "q11_c", text: "Das Wissen, dass alles seinen Sinn hat", scores: { weisheit: 5, schatten: 4, klarheit: 3 } },
      { id: "q11_d", text: "Die Hoffnung auf neue Abenteuer", scores: { freiheit: 4, neugier: 5, flow: 4 } }
    ]
  },
  {
    id: "q12",
    scenario: "Die Vision wird klar...",
    text: "Welches Element ruft am lautesten nach dir?",
    options: [
      { id: "q12_a", text: "Erde – stark, beständig, verwurzelt", scores: { erdung: 5, mut: 4, sozial: 3 } },
      { id: "q12_b", text: "Luft – frei, erhaben, klar", scores: { freiheit: 5, klarheit: 4, weisheit: 3 } },
      { id: "q12_c", text: "Wasser – fließend, spielerisch, tief", scores: { flow: 5, freude: 4, anpassung: 4 } },
      { id: "q12_d", text: "Schatten – mysteriös, weise, verborgen", scores: { schatten: 5, weisheit: 4, neugier: 3 } }
    ]
  }
];

export const profiles = [
    {
      id: "wolf",
      title: "Der Wolf",
      icon: "🐺",
      subtitle: "Hüter des Rudels",
      tagline: "Loyal, instinktiv und zutiefst verbunden",
      description: "Der Wolf erwacht in dir – loyal, instinktiv und zutiefst verbunden mit deinem Rudel. Du führst nicht durch Dominanz, sondern durch das tiefe Verständnis, dass wahre Stärke in der Gemeinschaft liegt.",
      stats: [
        { label: "Loyalität", value: 98 },
        { label: "Instinkt", value: 94 },
        { label: "Führung", value: 91 },
        { label: "Intuition", "value": 87 }
      ],
      compatibility: "Adler, Bär",
      share_text: "Mein Krafttier ist der Wolf – loyal, instinktiv und Hüter des Rudels. 🐺",
      markers: ["marker.social.pack_loyalty", "marker.instinct.primal_sense", "marker.leadership.servant_leader"]
    },
    {
      id: "owl",
      title: "Die Eule",
      icon: "🦉",
      subtitle: "Wächterin der Nacht",
      tagline: "Weise, geduldig und scharfsinnig",
      description: "Die Eule hat dich erwählt – still, geduldig und mit Augen, die durch jeden Schleier blicken. Du verstehst, dass wahre Weisheit im Zuhören liegt, nicht im Sprechen.",
      stats: [
        { label: "Weisheit", value: 97 },
        { label: "Geduld", value: 95 },
        { label: "Durchblick", "value": 93 },
        { label: "Intuition", "value": 89 }
      ],
      compatibility: "Wolf, Fuchs",
      share_text: "Mein Krafttier ist die Eule – weise, geduldig und Wächterin der Nacht. 🦉",
      markers: ["marker.wisdom.deep_insight", "marker.perception.night_vision", "marker.patience.eternal_watcher"]
    },
    {
      id: "eagle",
      title: "Der Adler",
      icon: "🦅",
      subtitle: "Herrscher der Lüfte",
      tagline: "Frei, mutig und mit klarem Blick",
      description: "Der Adler erhebt sich in dir – majestätisch, frei und mit einem Blick, der Horizonte überwindet. Du lebst für die Freiheit und scheust keine Höhen.",
      stats: [
        { label: "Freiheit", value: 98 },
        { label: "Weitblick", value: 96 },
        { label: "Mut", value: 94 },
        { label: "Präzision", value: 91 }
      ],
      compatibility: "Wolf, Bär",
      share_text: "Mein Krafttier ist der Adler – frei, mutig und Herrscher der Lüfte. 🦅",
      markers: ["marker.freedom.sky_bound", "marker.vision.far_sight", "marker.courage.heights_seeker"]
    },
    {
      id: "bear",
      title: "Der Bär",
      icon: "🐻",
      subtitle: "Wächter der Erde",
      tagline: "Stark, verwurzelt und besonnen",
      description: "Der Bär erwacht in dir – geerdet, besonnen und mit einer Stärke, die aus tiefer innerer Ruhe kommt. Du brauchst keinen Lärm, um deine Präsenz zu zeigen.",
      stats: [
        { label: "Stärke", value: 97 },
        { label: "Erdung", value: 96 },
        { label: "Besonnenheit", value: 93 },
        { label: "Schutzinstinkt", value: 91 }
      ],
      compatibility: "Adler, Wolf",
      share_text: "Mein Krafttier ist der Bär – stark, verwurzelt und Wächter der Erde. 🐻",
      markers: ["marker.strength.earth_power", "marker.stability.grounded", "marker.protection.den_keeper"]
    },
    {
      id: "fox",
      title: "Der Fuchs",
      icon: "🦊",
      subtitle: "Meister der Anpassung",
      tagline: "Neugierig, clever und charmant",
      description: "Der Fuchs tanzt durch deine Seele – neugierig, anpassungsfähig und mit einem Lächeln, das Türen öffnet. Du findest Wege, wo andere nur Mauern sehen.",
      stats: [
        { label: "Cleverness", value: 97 },
        { label: "Anpassung", value: 95 },
        { label: "Neugier", value: 94 },
        { label: "Charme", value: 92 }
      ],
      compatibility: "Eule, Delfin",
      share_text: "Mein Krafttier ist der Fuchs – clever, neugierig und Meister der Anpassung. 🦊",
      markers: ["marker.adaptability.shape_shifter", "marker.curiosity.path_finder", "marker.charm.trickster"]
    },
    {
      id: "dolphin",
      title: "Der Delfin",
      icon: "🐬",
      subtitle: "Botschafter der Freude",
      tagline: "Spielerisch, verbunden und voller Leben",
      description: "Der Delphin spielt in deiner Seele – lebendig, spielerisch und in ständigem Flow mit dem Ozean des Lebens. Du erinnerst andere daran, dass Freude keine Schwäche ist.",
      stats: [
        { label: "Lebensfreude", value: 98 },
        { label: "Spielfreude", value: 96 },
        { label: "Verbundenheit", value: 93 },
        { label: "Anpassung", value: 91 }
      ],
      compatibility: "Fuchs, Wolf",
      share_text: "Mein Krafttier ist der Delphin – spielerisch, verbunden und Botschafter der Freude. 🐬",
      markers: ["marker.joy.wave_rider", "marker.playfulness.eternal_youth", "marker.connection.pod_dancer"]
    }
];

export const profileNames = Object.fromEntries(profiles.map(p => [p.id, p.title]));

export type DimensionScores = Record<string, number>;
export type ProfileScores = Record<string, number>;

// MATRIX MULTIPLICATION: Dimension Scores x Animal Weights
export function calculateProfileScores(userDimensions: DimensionScores): ProfileScores {
    const profileScores: ProfileScores = {};

    profiles.forEach(profile => {
        const weights = animalWeights[profile.id];
        if (!weights) return;

        let totalScore = 0;
        Object.entries(weights).forEach(([dimId, weight]) => {
            const userScore = userDimensions[dimId] || 0;
            totalScore += userScore * (weight as number);
        });
        profileScores[profile.id] = totalScore;
    });

    return profileScores;
}
