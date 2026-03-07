/**
 * Tag Registry
 *
 * Tags are keyword labels that categorize personality aspects.
 * Used for UI display, filtering, and archetype identification.
 *
 * Naming convention: tag.<kind>.<subcategory?>.<name>
 * Examples:
 *   - tag.archetype.trickster
 *   - tag.shadow.overthinking
 *   - tag.style.humor.dry
 *   - tag.vibe.cozy
 *   - tag.astro.zodiac.aries
 */

export type TagKind =
  | "archetype"
  | "shadow"
  | "style"
  | "vibe"
  | "astro"
  | "interest"
  | "misc";

export type TagDefinition = {
  id: string;
  kind: TagKind;
  label_de: string;
  label_en: string;
  emoji?: string;
};

export const TAGS: readonly TagDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHETYPE TAGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.archetype.trickster",
    kind: "archetype",
    label_de: "Der Trickster",
    label_en: "The Trickster",
    emoji: "🃏",
  },
  {
    id: "tag.archetype.sage",
    kind: "archetype",
    label_de: "Der Weise",
    label_en: "The Sage",
    emoji: "🦉",
  },
  {
    id: "tag.archetype.hero",
    kind: "archetype",
    label_de: "Der Held",
    label_en: "The Hero",
    emoji: "⚔️",
  },
  {
    id: "tag.archetype.caregiver",
    kind: "archetype",
    label_de: "Der Fürsorger",
    label_en: "The Caregiver",
    emoji: "💝",
  },
  {
    id: "tag.archetype.explorer",
    kind: "archetype",
    label_de: "Der Entdecker",
    label_en: "The Explorer",
    emoji: "🧭",
  },
  {
    id: "tag.archetype.rebel",
    kind: "archetype",
    label_de: "Der Rebell",
    label_en: "The Rebel",
    emoji: "🔥",
  },
  {
    id: "tag.archetype.creator",
    kind: "archetype",
    label_de: "Der Schöpfer",
    label_en: "The Creator",
    emoji: "🎨",
  },
  {
    id: "tag.archetype.ruler",
    kind: "archetype",
    label_de: "Der Herrscher",
    label_en: "The Ruler",
    emoji: "👑",
  },
  {
    id: "tag.archetype.magician",
    kind: "archetype",
    label_de: "Der Magier",
    label_en: "The Magician",
    emoji: "✨",
  },
  {
    id: "tag.archetype.innocent",
    kind: "archetype",
    label_de: "Der Unschuldige",
    label_en: "The Innocent",
    emoji: "🌸",
  },
  {
    id: "tag.archetype.lover",
    kind: "archetype",
    label_de: "Der Liebende",
    label_en: "The Lover",
    emoji: "❤️",
  },
  {
    id: "tag.archetype.jester",
    kind: "archetype",
    label_de: "Der Narr",
    label_en: "The Jester",
    emoji: "🎭",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHADOW TAGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.shadow.overthinking",
    kind: "shadow",
    label_de: "Überdenken",
    label_en: "Overthinking",
    emoji: "🌀",
  },
  {
    id: "tag.shadow.jealousy",
    kind: "shadow",
    label_de: "Eifersucht",
    label_en: "Jealousy",
    emoji: "💚",
  },
  {
    id: "tag.shadow.impatience",
    kind: "shadow",
    label_de: "Ungeduld",
    label_en: "Impatience",
    emoji: "⏰",
  },
  {
    id: "tag.shadow.perfectionism",
    kind: "shadow",
    label_de: "Perfektionismus",
    label_en: "Perfectionism",
    emoji: "🎯",
  },
  {
    id: "tag.shadow.avoidance",
    kind: "shadow",
    label_de: "Vermeidung",
    label_en: "Avoidance",
    emoji: "🏃",
  },
  {
    id: "tag.shadow.people_pleasing",
    kind: "shadow",
    label_de: "Harmoniebedürfnis",
    label_en: "People Pleasing",
    emoji: "😊",
  },
  {
    id: "tag.shadow.control",
    kind: "shadow",
    label_de: "Kontrollbedürfnis",
    label_en: "Control",
    emoji: "🎮",
  },
  {
    id: "tag.shadow.stubbornness",
    kind: "shadow",
    label_de: "Sturheit",
    label_en: "Stubbornness",
    emoji: "🦬",
  },
  {
    id: "tag.shadow.detachment",
    kind: "shadow",
    label_de: "Distanziertheit",
    label_en: "Detachment",
    emoji: "🧊",
  },
  {
    id: "tag.shadow.indecision",
    kind: "shadow",
    label_de: "Unentschlossenheit",
    label_en: "Indecision",
    emoji: "⚖️",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLE TAGS (including humor subcategory)
  // ═══════════════════════════════════════════════════════════════════════════

  // Humor styles
  {
    id: "tag.style.humor.dry",
    kind: "style",
    label_de: "Trockener Humor",
    label_en: "Dry Humor",
    emoji: "🏜️",
  },
  {
    id: "tag.style.humor.observational",
    kind: "style",
    label_de: "Beobachtender Humor",
    label_en: "Observational Humor",
    emoji: "🔍",
  },
  {
    id: "tag.style.humor.slapstick",
    kind: "style",
    label_de: "Slapstick",
    label_en: "Slapstick",
    emoji: "🤡",
  },
  {
    id: "tag.style.humor.dark",
    kind: "style",
    label_de: "Schwarzer Humor",
    label_en: "Dark Humor",
    emoji: "🖤",
  },
  {
    id: "tag.style.humor.witty",
    kind: "style",
    label_de: "Schlagfertigkeit",
    label_en: "Witty",
    emoji: "💡",
  },
  {
    id: "tag.style.humor.absurd",
    kind: "style",
    label_de: "Absurder Humor",
    label_en: "Absurd Humor",
    emoji: "🦆",
  },

  // Communication styles
  {
    id: "tag.style.deep_talk",
    kind: "style",
    label_de: "Tiefgründige Gespräche",
    label_en: "Deep Talk",
    emoji: "🌊",
  },
  {
    id: "tag.style.small_talk",
    kind: "style",
    label_de: "Smalltalk",
    label_en: "Small Talk",
    emoji: "☕",
  },
  {
    id: "tag.style.storyteller",
    kind: "style",
    label_de: "Geschichtenerzähler",
    label_en: "Storyteller",
    emoji: "📖",
  },
  {
    id: "tag.style.listener",
    kind: "style",
    label_de: "Zuhörer",
    label_en: "Listener",
    emoji: "👂",
  },
  {
    id: "tag.style.debater",
    kind: "style",
    label_de: "Debattierer",
    label_en: "Debater",
    emoji: "🎤",
  },

  // Conflict styles
  {
    id: "tag.style.conflict.avoidant",
    kind: "style",
    label_de: "Konfliktvermeidend",
    label_en: "Conflict Avoidant",
    emoji: "🕊️",
  },
  {
    id: "tag.style.conflict.confrontational",
    kind: "style",
    label_de: "Konfrontativ",
    label_en: "Confrontational",
    emoji: "💥",
  },
  {
    id: "tag.style.conflict.mediator",
    kind: "style",
    label_de: "Vermittler",
    label_en: "Mediator",
    emoji: "🤝",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIBE TAGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.vibe.cozy",
    kind: "vibe",
    label_de: "Gemütlich",
    label_en: "Cozy",
    emoji: "🛋️",
  },
  {
    id: "tag.vibe.adventurous",
    kind: "vibe",
    label_de: "Abenteuerlich",
    label_en: "Adventurous",
    emoji: "🏔️",
  },
  {
    id: "tag.vibe.mysterious",
    kind: "vibe",
    label_de: "Mysteriös",
    label_en: "Mysterious",
    emoji: "🌙",
  },
  {
    id: "tag.vibe.energetic",
    kind: "vibe",
    label_de: "Energetisch",
    label_en: "Energetic",
    emoji: "⚡",
  },
  {
    id: "tag.vibe.calm",
    kind: "vibe",
    label_de: "Ruhig",
    label_en: "Calm",
    emoji: "🧘",
  },
  {
    id: "tag.vibe.playful",
    kind: "vibe",
    label_de: "Verspielt",
    label_en: "Playful",
    emoji: "🎈",
  },
  {
    id: "tag.vibe.intense",
    kind: "vibe",
    label_de: "Intensiv",
    label_en: "Intense",
    emoji: "🔥",
  },
  {
    id: "tag.vibe.dreamy",
    kind: "vibe",
    label_de: "Verträumt",
    label_en: "Dreamy",
    emoji: "☁️",
  },
  {
    id: "tag.vibe.grounded",
    kind: "vibe",
    label_de: "Geerdet",
    label_en: "Grounded",
    emoji: "🌳",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASTRO TAGS - Western Zodiac
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.astro.zodiac.aries",
    kind: "astro",
    label_de: "Widder",
    label_en: "Aries",
    emoji: "♈",
  },
  {
    id: "tag.astro.zodiac.taurus",
    kind: "astro",
    label_de: "Stier",
    label_en: "Taurus",
    emoji: "♉",
  },
  {
    id: "tag.astro.zodiac.gemini",
    kind: "astro",
    label_de: "Zwillinge",
    label_en: "Gemini",
    emoji: "♊",
  },
  {
    id: "tag.astro.zodiac.cancer",
    kind: "astro",
    label_de: "Krebs",
    label_en: "Cancer",
    emoji: "♋",
  },
  {
    id: "tag.astro.zodiac.leo",
    kind: "astro",
    label_de: "Löwe",
    label_en: "Leo",
    emoji: "♌",
  },
  {
    id: "tag.astro.zodiac.virgo",
    kind: "astro",
    label_de: "Jungfrau",
    label_en: "Virgo",
    emoji: "♍",
  },
  {
    id: "tag.astro.zodiac.libra",
    kind: "astro",
    label_de: "Waage",
    label_en: "Libra",
    emoji: "♎",
  },
  {
    id: "tag.astro.zodiac.scorpio",
    kind: "astro",
    label_de: "Skorpion",
    label_en: "Scorpio",
    emoji: "♏",
  },
  {
    id: "tag.astro.zodiac.sagittarius",
    kind: "astro",
    label_de: "Schütze",
    label_en: "Sagittarius",
    emoji: "♐",
  },
  {
    id: "tag.astro.zodiac.capricorn",
    kind: "astro",
    label_de: "Steinbock",
    label_en: "Capricorn",
    emoji: "♑",
  },
  {
    id: "tag.astro.zodiac.aquarius",
    kind: "astro",
    label_de: "Wassermann",
    label_en: "Aquarius",
    emoji: "♒",
  },
  {
    id: "tag.astro.zodiac.pisces",
    kind: "astro",
    label_de: "Fische",
    label_en: "Pisces",
    emoji: "♓",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASTRO TAGS - Chinese Zodiac
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.astro.chinese.rat",
    kind: "astro",
    label_de: "Ratte",
    label_en: "Rat",
    emoji: "🐀",
  },
  {
    id: "tag.astro.chinese.ox",
    kind: "astro",
    label_de: "Büffel",
    label_en: "Ox",
    emoji: "🐂",
  },
  {
    id: "tag.astro.chinese.tiger",
    kind: "astro",
    label_de: "Tiger",
    label_en: "Tiger",
    emoji: "🐅",
  },
  {
    id: "tag.astro.chinese.rabbit",
    kind: "astro",
    label_de: "Hase",
    label_en: "Rabbit",
    emoji: "🐇",
  },
  {
    id: "tag.astro.chinese.dragon",
    kind: "astro",
    label_de: "Drache",
    label_en: "Dragon",
    emoji: "🐉",
  },
  {
    id: "tag.astro.chinese.snake",
    kind: "astro",
    label_de: "Schlange",
    label_en: "Snake",
    emoji: "🐍",
  },
  {
    id: "tag.astro.chinese.horse",
    kind: "astro",
    label_de: "Pferd",
    label_en: "Horse",
    emoji: "🐎",
  },
  {
    id: "tag.astro.chinese.goat",
    kind: "astro",
    label_de: "Ziege",
    label_en: "Goat",
    emoji: "🐐",
  },
  {
    id: "tag.astro.chinese.monkey",
    kind: "astro",
    label_de: "Affe",
    label_en: "Monkey",
    emoji: "🐒",
  },
  {
    id: "tag.astro.chinese.rooster",
    kind: "astro",
    label_de: "Hahn",
    label_en: "Rooster",
    emoji: "🐓",
  },
  {
    id: "tag.astro.chinese.dog",
    kind: "astro",
    label_de: "Hund",
    label_en: "Dog",
    emoji: "🐕",
  },
  {
    id: "tag.astro.chinese.pig",
    kind: "astro",
    label_de: "Schwein",
    label_en: "Pig",
    emoji: "🐖",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASTRO TAGS - Elements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.astro.element.fire",
    kind: "astro",
    label_de: "Feuer",
    label_en: "Fire",
    emoji: "🔥",
  },
  {
    id: "tag.astro.element.earth",
    kind: "astro",
    label_de: "Erde",
    label_en: "Earth",
    emoji: "🌍",
  },
  {
    id: "tag.astro.element.air",
    kind: "astro",
    label_de: "Luft",
    label_en: "Air",
    emoji: "💨",
  },
  {
    id: "tag.astro.element.water",
    kind: "astro",
    label_de: "Wasser",
    label_en: "Water",
    emoji: "💧",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEREST TAGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.interest.music",
    kind: "interest",
    label_de: "Musik",
    label_en: "Music",
    emoji: "🎵",
  },
  {
    id: "tag.interest.gaming",
    kind: "interest",
    label_de: "Gaming",
    label_en: "Gaming",
    emoji: "🎮",
  },
  {
    id: "tag.interest.reading",
    kind: "interest",
    label_de: "Lesen",
    label_en: "Reading",
    emoji: "📚",
  },
  {
    id: "tag.interest.cooking",
    kind: "interest",
    label_de: "Kochen",
    label_en: "Cooking",
    emoji: "👨‍🍳",
  },
  {
    id: "tag.interest.travel",
    kind: "interest",
    label_de: "Reisen",
    label_en: "Travel",
    emoji: "✈️",
  },
  {
    id: "tag.interest.fitness",
    kind: "interest",
    label_de: "Fitness",
    label_en: "Fitness",
    emoji: "💪",
  },
  {
    id: "tag.interest.art",
    kind: "interest",
    label_de: "Kunst",
    label_en: "Art",
    emoji: "🎨",
  },
  {
    id: "tag.interest.science",
    kind: "interest",
    label_de: "Wissenschaft",
    label_en: "Science",
    emoji: "🔬",
  },
  {
    id: "tag.interest.nature",
    kind: "interest",
    label_de: "Natur",
    label_en: "Nature",
    emoji: "🌿",
  },
  {
    id: "tag.interest.movies",
    kind: "interest",
    label_de: "Filme",
    label_en: "Movies",
    emoji: "🎬",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MISC TAGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tag.misc.night_owl",
    kind: "misc",
    label_de: "Nachteule",
    label_en: "Night Owl",
    emoji: "🦉",
  },
  {
    id: "tag.misc.early_bird",
    kind: "misc",
    label_de: "Frühaufsteher",
    label_en: "Early Bird",
    emoji: "🐦",
  },
  {
    id: "tag.misc.coffee_lover",
    kind: "misc",
    label_de: "Kaffeeliebhaber",
    label_en: "Coffee Lover",
    emoji: "☕",
  },
  {
    id: "tag.misc.tea_person",
    kind: "misc",
    label_de: "Teetrinker",
    label_en: "Tea Person",
    emoji: "🍵",
  },
  {
    id: "tag.misc.pet_parent",
    kind: "misc",
    label_de: "Tierliebhaber",
    label_en: "Pet Parent",
    emoji: "🐾",
  },
] as const;

// Lookup helpers
export const TAG_BY_ID = Object.fromEntries(
  TAGS.map((t) => [t.id, t])
) as Record<string, TagDefinition>;

export const TAG_IDS = TAGS.map((t) => t.id);

export const TAGS_BY_KIND = TAGS.reduce(
  (acc, t) => {
    if (!acc[t.kind]) acc[t.kind] = [];
    acc[t.kind].push(t);
    return acc;
  },
  {} as Record<TagKind, TagDefinition[]>
);
