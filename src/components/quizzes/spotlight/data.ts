
export const quizMeta = {
  id: "quiz.spotlight.v2",
  title: "Das Rampenlicht",
  subtitle: "Wie viel Aufmerksamkeit brauchst du wirklich?",
  description: "Finde heraus, ob du die Bühne suchst oder lieber aus dem Schatten wirkst.",
  questions_count: 8,
  disclaimer: "Selbstreflexion, keine Diagnose."
};

export const questions = [
  {
    id: "sq1",
    scenario: "Du betrittst einen vollen Raum...",
    text: "Dein erster Impuls?",
    options: [
      { text: "Ich suche bekannte Gesichter", scores: { selective_sharer: 5, situational_performer: 3 } },
      { text: "Ich stelle mich an den Rand und beobachte", scores: { silent_observer: 5, selective_sharer: 3 } },
      { text: "Ich mache mich bemerkbar", scores: { natural_star: 5, active_shaper: 3 } },
      { text: "Ich gehe direkt auf neue Leute zu", scores: { active_shaper: 5, situational_performer: 3 } }
    ]
  },
  {
    id: "sq2",
    scenario: "Ein Foto wird gemacht...",
    text: "Wo stehst du?",
    options: [
      { text: "In der Mitte, gerne vorne", scores: { natural_star: 5, active_shaper: 3 } },
      { text: "Irgendwo im Hintergrund", scores: { silent_observer: 5, selective_sharer: 3 } },
      { text: "Dort, wo Platz ist", scores: { situational_performer: 5, active_shaper: 2 } },
      { text: "Lieber hinter der Kamera", scores: { silent_observer: 5, selective_sharer: 4 } }
    ]
  },
  {
    id: "sq3",
    scenario: "Social Media...",
    text: "Wie oft postest du?",
    options: [
      { text: "Täglich, mein Leben ist Content", scores: { natural_star: 5, active_shaper: 3 } },
      { text: "Selten, nur besondere Momente", scores: { selective_sharer: 5, situational_performer: 3 } },
      { text: "Nie, ich schaue nur", scores: { silent_observer: 5, selective_sharer: 2 } },
      { text: "Wenn ich etwas Wichtiges zu sagen habe", scores: { active_shaper: 5, situational_performer: 3 } }
    ]
  },
  {
    id: "sq4",
    scenario: "Karaoke Abend...",
    text: "Singst du?",
    options: [
      { text: "Ja! Gebt mir das Mikrofon!", scores: { natural_star: 5, active_shaper: 4 } },
      { text: "Nur in der Gruppe", scores: { situational_performer: 5, selective_sharer: 3 } },
      { text: "Niemals, keine Chance", scores: { silent_observer: 5, selective_sharer: 3 } },
      { text: "Vielleicht später, wenn die Stimmung passt", scores: { selective_sharer: 5, situational_performer: 3 } }
    ]
  },
  {
    id: "sq5",
    scenario: "Kleidungsstil...",
    text: "Was trägst du?",
    options: [
      { text: "Auffällig, ich will gesehen werden", scores: { natural_star: 5, active_shaper: 3 } },
      { text: "Praktisch und bequem", scores: { silent_observer: 5, situational_performer: 2 } },
      { text: "Stilvoll, aber dezent", scores: { selective_sharer: 5, situational_performer: 3 } },
      { text: "Statement-Pieces", scores: { active_shaper: 5, natural_star: 3 } }
    ]
  },
  {
    id: "sq6",
    scenario: "Ein Fehler passiert öffentlich...",
    text: "Wie fühlst du dich?",
    options: [
      { text: "Ich lache darüber und mache weiter", scores: { natural_star: 5, active_shaper: 4 } },
      { text: "Ich stehe dazu und erkläre es", scores: { active_shaper: 5, situational_performer: 3 } },
      { text: "Mir ist es extrem unangenehm", scores: { silent_observer: 5, selective_sharer: 4 } },
      { text: "Ich hoffe, niemand hat es gemerkt", scores: { selective_sharer: 5, situational_performer: 2 } }
    ]
  },
  {
    id: "sq7",
    scenario: "Lob vor der Gruppe...",
    text: "Magst du das?",
    options: [
      { text: "Ja, Applaus tut gut!", scores: { natural_star: 5, active_shaper: 4 } },
      { text: "Ein kurzes Danke reicht", scores: { situational_performer: 5, selective_sharer: 3 } },
      { text: "Bitte nicht, lieber unter vier Augen", scores: { silent_observer: 5, selective_sharer: 4 } },
      { text: "Wenn es gerechtfertigt ist, okay", scores: { active_shaper: 5, situational_performer: 3 } }
    ]
  },
  {
    id: "sq8",
    scenario: "Du wirst unterbrochen...",
    text: "Was tust du?",
    options: [
      { text: "Ich werde lauter und rede weiter", scores: { natural_star: 5, active_shaper: 4 } },
      { text: "Ich lasse den anderen reden", scores: { silent_observer: 5, selective_sharer: 3 } },
      { text: "Ich weise höflich darauf hin", scores: { active_shaper: 5, situational_performer: 3 } },
      { text: "Ich warte eine Pause ab", scores: { selective_sharer: 5, situational_performer: 3 } }
    ]
  }
];

export const profiles = [
  {
    id: "natural_star",
    title: "Der Natural Star",
    icon: "🌟",
    tagline: "Die Bühne ist dein Zuhause.",
    description: "Du brauchst keine Scheinwerfer, du leuchtest von selbst. Aufmerksamkeit ist für dich Energie. Du hast keine Angst davor, gesehen zu werden – im Gegenteil, du blühst auf, wenn alle Augen auf dich gerichtet sind. Dein Charisma ist magnetisch.",
    stats: [
      { label: "Sichtbarkeit", value: 100 },
      { label: "Charisma", value: 98 },
      { label: "Extroversion", value: 95 },
      { label: "Schamgefühl", value: 10 }
    ],
    matching: { vibe: "Rampenlicht" },
    share_text: "🌟 Mein Spotlight: Natural Star – Ich gehöre auf die Bühne."
  },
  {
    id: "active_shaper",
    title: "Der Gestalter",
    icon: "🗣️",
    tagline: "Du nutzt Aufmerksamkeit als Werkzeug.",
    description: "Du suchst das Rampenlicht nicht um seiner selbst willen, sondern um etwas zu bewegen. Wenn du sprichst, dann weil du etwas zu sagen hast. Du kannst führen und präsentieren, brauchst aber auch Pausen vom Trubel.",
    stats: [
      { label: "Einfluss", value: 90 },
      { label: "Präsenz", value: 85 },
      { label: "Zielgerichtheit", value: 95 },
      { label: "Zurückhaltung", value: 30 }
    ],
    matching: { vibe: "Leadership" },
    share_text: "🗣️ Mein Spotlight: Der Gestalter – Ich nutze Aufmerksamkeit."
  },
  {
    id: "situational_performer",
    title: "Der Situative",
    icon: "🎭",
    tagline: "Du glänzt, wenn es darauf ankommt.",
    description: "Du drängst dich nicht auf, aber du versteckst dich auch nicht. Du passt dich der Situation an. Du kannst charmant und unterhaltsam sein, genießt aber auch die Ruhe. Du bist der perfekte 'Wingman' und Teamplayer.",
    stats: [
      { label: "Anpassung", value: 95 },
      { label: "Balance", value: 90 },
      { label: "Sozialkompetenz", value: 85 },
      { label: "Geltungsdrang", value: 45 }
    ],
    matching: { vibe: "Community" },
    share_text: "🎭 Mein Spotlight: Der Situative – Ich glänze bei Bedarf."
  },
  {
    id: "selective_sharer",
    title: "Der Selektive",
    icon: "🔐",
    tagline: "Qualität vor Quantität.",
    description: "Du bist wählerisch, wem du deine Energie schenkst. Du öffnest dich nicht jedem, aber wenn, dann tief. Oberflächlichkeit langweilt dich. Du wirst vielleicht oft unterschätzt, weil du nicht laut bist.",
    stats: [
      { label: "Tiefe", value: 95 },
      { label: "Beobachtung", value: 80 },
      { label: "Vertrauen", value: 90 },
      { label: "Lautstärke", value: 20 }
    ],
    matching: { vibe: "Deep Talk" },
    share_text: "🔐 Mein Spotlight: Der Selektive – Qualität vor Quantität."
  },
  {
    id: "silent_observer",
    title: "Der Beobachter",
    icon: "👀",
    tagline: "Du siehst alles, ohne gesehen zu werden.",
    description: "Du meidest das Rampenlicht wie der Teufel das Weihwasser. Deine Stärke liegt in der Analyse und Beobachtung. Du bist der Stratege im Hintergrund, der die Fäden zieht oder einfach nur seine Ruhe genießt.",
    stats: [
      { label: "Unsichtbarkeit", value: 95 },
      { label: "Analyse", value: 90 },
      { label: "Ruhe", value: 98 },
      { label: "Extroversion", value: 5 }
    ],
    matching: { vibe: "Backstage" },
    share_text: "👀 Mein Spotlight: Der Beobachter – Ich sehe alles."
  }
];

export const profileNames = Object.fromEntries(profiles.map(p => [p.id, p.title]));
