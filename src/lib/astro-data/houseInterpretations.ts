// ── House Interpretation Fallback System ─────────────────────────────────────
// Generates substantive house interpretations when Gemini texts are unavailable.
// Combines house domain descriptions with sign archetype qualities.

type Lang = "de" | "en";

interface HouseTemplate {
  domain: { de: string; en: string };
  strength: { de: string; en: string };
  tension: { de: string; en: string };
}

const HOUSE_TEMPLATES: Record<number, HouseTemplate> = {
  1: {
    domain: {
      de: "das Feld deiner Identität, deines Auftretens und deiner Selbstwahrnehmung",
      en: "the field of your identity, appearance, and self-perception",
    },
    strength: {
      de: "Deine Stärke liegt in der Authentizität deines Auftretens",
      en: "Your strength lies in the authenticity of your presence",
    },
    tension: {
      de: "Die Lernaufgabe besteht darin, Selbstbild und Wirkung in Einklang zu bringen",
      en: "The growth area is aligning self-image with how others perceive you",
    },
  },
  2: {
    domain: {
      de: "das Feld deiner Werte, deines Besitzes und deiner materiellen Sicherheit",
      en: "the field of your values, possessions, and material security",
    },
    strength: {
      de: "Deine Stärke zeigt sich im Umgang mit Ressourcen und der Fähigkeit, Wert zu erkennen",
      en: "Your strength shows in how you manage resources and recognize value",
    },
    tension: {
      de: "Die Lernaufgabe liegt darin, inneren Wert unabhängig von äußerem Besitz zu erfahren",
      en: "The growth area is experiencing inner worth independent of external possessions",
    },
  },
  3: {
    domain: {
      de: "das Feld der Kommunikation, des Lernens und der nahen Beziehungen",
      en: "the field of communication, learning, and close relationships",
    },
    strength: {
      de: "Deine Stärke liegt in der Art, wie du Gedanken formulierst und Verbindungen herstellst",
      en: "Your strength lies in how you articulate thoughts and build connections",
    },
    tension: {
      de: "Die Lernaufgabe besteht darin, zuzuhören, bevor du antwortest",
      en: "The growth area is learning to listen before responding",
    },
  },
  4: {
    domain: {
      de: "das Feld deines Zuhauses, deiner Wurzeln und deiner emotionalen Basis",
      en: "the field of your home, roots, and emotional foundation",
    },
    strength: {
      de: "Deine Stärke zeigt sich in der Fähigkeit, Geborgenheit zu schaffen",
      en: "Your strength shows in your ability to create a sense of belonging",
    },
    tension: {
      de: "Die Lernaufgabe liegt darin, Vergangenes loszulassen und dein Fundament bewusst neu zu gestalten",
      en: "The growth area is releasing the past and consciously reshaping your foundation",
    },
  },
  5: {
    domain: {
      de: "das Feld der Kreativität, Romantik und Lebensfreude",
      en: "the field of creativity, romance, and joy of life",
    },
    strength: {
      de: "Deine Stärke liegt im schöpferischen Ausdruck und der Fähigkeit, Freude zu empfinden",
      en: "Your strength lies in creative expression and your capacity for joy",
    },
    tension: {
      de: "Die Lernaufgabe besteht darin, Risiko und Verantwortung in Balance zu halten",
      en: "The growth area is balancing risk-taking with responsibility",
    },
  },
  6: {
    domain: {
      de: "das Feld der Gesundheit, des Alltags und des Dienstes an anderen",
      en: "the field of health, daily routines, and service to others",
    },
    strength: {
      de: "Deine Stärke zeigt sich in Disziplin und der Fähigkeit, Strukturen zu schaffen, die dir dienen",
      en: "Your strength shows in discipline and creating structures that serve you",
    },
    tension: {
      de: "Die Lernaufgabe liegt darin, Perfektionismus loszulassen und Selbstfürsorge zu priorisieren",
      en: "The growth area is releasing perfectionism and prioritizing self-care",
    },
  },
  7: {
    domain: {
      de: "das Feld der Partnerschaften, Beziehungen und Verträge",
      en: "the field of partnerships, relationships, and agreements",
    },
    strength: {
      de: "Deine Stärke liegt in der Fähigkeit, tiefe Verbindungen einzugehen und Kompromisse zu finden",
      en: "Your strength lies in forming deep connections and finding compromises",
    },
    tension: {
      de: "Die Lernaufgabe besteht darin, in Beziehungen deine eigene Identität zu bewahren",
      en: "The growth area is maintaining your own identity within relationships",
    },
  },
  8: {
    domain: {
      de: "das Feld der Transformation, geteilter Ressourcen und der Tiefe des Lebens",
      en: "the field of transformation, shared resources, and life's depths",
    },
    strength: {
      de: "Deine Stärke zeigt sich in der Fähigkeit, Krisen als Wachstumschancen zu nutzen",
      en: "Your strength shows in your ability to use crises as opportunities for growth",
    },
    tension: {
      de: "Die Lernaufgabe liegt darin, Kontrolle abzugeben und dem Wandel zu vertrauen",
      en: "The growth area is surrendering control and trusting transformation",
    },
  },
  9: {
    domain: {
      de: "das Feld der Philosophie, Fernreisen und des höheren Lernens",
      en: "the field of philosophy, long-distance travel, and higher learning",
    },
    strength: {
      de: "Deine Stärke liegt in deinem Weitblick und der Fähigkeit, das große Ganze zu sehen",
      en: "Your strength lies in your vision and ability to see the bigger picture",
    },
    tension: {
      de: "Die Lernaufgabe besteht darin, Weisheit auch im Alltäglichen zu finden",
      en: "The growth area is finding wisdom in the everyday",
    },
  },
  10: {
    domain: {
      de: "das Feld deiner Berufung, öffentlichen Rolle und Ambitionen",
      en: "the field of your vocation, public role, and ambitions",
    },
    strength: {
      de: "Deine Stärke zeigt sich in natürlicher Autorität und dem Wunsch, etwas Bleibendes aufzubauen",
      en: "Your strength shows in natural authority and the desire to build something lasting",
    },
    tension: {
      de: "Die Lernaufgabe liegt darin, Erfolg nicht über Erfüllung zu stellen",
      en: "The growth area is not placing success above fulfillment",
    },
  },
  11: {
    domain: {
      de: "das Feld der Freundschaften, Gemeinschaften und Zukunftsvisionen",
      en: "the field of friendships, communities, and future visions",
    },
    strength: {
      de: "Deine Stärke liegt in der Fähigkeit, Menschen für gemeinsame Ziele zu begeistern",
      en: "Your strength lies in inspiring people toward shared goals",
    },
    tension: {
      de: "Die Lernaufgabe besteht darin, Zugehörigkeit und Individualität zu vereinen",
      en: "The growth area is uniting belonging with individuality",
    },
  },
  12: {
    domain: {
      de: "das Feld des Unbewussten, der Spiritualität und des Rückzugs",
      en: "the field of the unconscious, spirituality, and retreat",
    },
    strength: {
      de: "Deine Stärke zeigt sich in Intuition, Empathie und der Verbindung zum Unsichtbaren",
      en: "Your strength shows in intuition, empathy, and connection to the unseen",
    },
    tension: {
      de: "Die Lernaufgabe liegt darin, das Verborgene bewusst zu integrieren statt es zu verdrängen",
      en: "The growth area is consciously integrating the hidden rather than suppressing it",
    },
  },
};

interface SignArchetype {
  quality: { de: string; en: string };
  energy: { de: string; en: string };
}

const SIGN_ARCHETYPES: Record<string, SignArchetype> = {
  Aries: {
    quality: { de: "feurige Entschlossenheit und Pioniergeist", en: "fiery determination and pioneering spirit" },
    energy: { de: "bringt Initiative, Mut und den Drang, Neues zu beginnen", en: "brings initiative, courage, and the drive to start something new" },
  },
  Taurus: {
    quality: { de: "erdverbundene Beständigkeit und sinnliche Tiefe", en: "grounded steadiness and sensual depth" },
    energy: { de: "bringt Stabilität, Geduld und ein Auge für Qualität", en: "brings stability, patience, and an eye for quality" },
  },
  Gemini: {
    quality: { de: "geistige Beweglichkeit und kommunikative Vielseitigkeit", en: "mental agility and communicative versatility" },
    energy: { de: "bringt Neugier, Anpassungsfähigkeit und den Wunsch nach Austausch", en: "brings curiosity, adaptability, and a desire for exchange" },
  },
  Cancer: {
    quality: { de: "emotionale Tiefe und nährende Fürsorge", en: "emotional depth and nurturing care" },
    energy: { de: "bringt Einfühlungsvermögen, Intuition und den Wunsch nach Geborgenheit", en: "brings empathy, intuition, and a longing for security" },
  },
  Leo: {
    quality: { de: "strahlende Selbstsicherheit und großherzige Wärme", en: "radiant confidence and generous warmth" },
    energy: { de: "bringt Charisma, Großzügigkeit und den Wunsch, zu inspirieren", en: "brings charisma, generosity, and the desire to inspire" },
  },
  Virgo: {
    quality: { de: "analytische Klarheit und dienende Präzision", en: "analytical clarity and dedicated precision" },
    energy: { de: "bringt Ordnung, Sorgfalt und den Blick für das Wesentliche", en: "brings order, diligence, and a focus on what matters" },
  },
  Libra: {
    quality: { de: "harmoniesuchende Diplomatie und ästhetisches Gespür", en: "harmony-seeking diplomacy and aesthetic sensibility" },
    energy: { de: "bringt Balance, Schönheitssinn und den Wunsch nach Gerechtigkeit", en: "brings balance, aesthetic sense, and a desire for fairness" },
  },
  Scorpio: {
    quality: { de: "transformative Intensität und psychologische Tiefe", en: "transformative intensity and psychological depth" },
    energy: { de: "bringt Leidenschaft, Durchdringungskraft und die Fähigkeit zur Erneuerung", en: "brings passion, penetrating insight, and the capacity for renewal" },
  },
  Sagittarius: {
    quality: { de: "expansiver Optimismus und philosophische Weite", en: "expansive optimism and philosophical breadth" },
    energy: { de: "bringt Abenteuerlust, Weisheitssuche und den Drang nach Wachstum", en: "brings adventurousness, wisdom-seeking, and an urge for growth" },
  },
  Capricorn: {
    quality: { de: "strategische Ausdauer und verantwortungsvolle Reife", en: "strategic endurance and responsible maturity" },
    energy: { de: "bringt Disziplin, Langzeitdenken und den Willen, Großes aufzubauen", en: "brings discipline, long-term thinking, and the will to build something great" },
  },
  Aquarius: {
    quality: { de: "visionäre Originalität und humanitäres Bewusstsein", en: "visionary originality and humanitarian awareness" },
    energy: { de: "bringt Innovation, Unabhängigkeit und den Wunsch, die Welt zu verbessern", en: "brings innovation, independence, and the desire to improve the world" },
  },
  Pisces: {
    quality: { de: "intuitive Empfindsamkeit und spirituelle Durchlässigkeit", en: "intuitive sensitivity and spiritual permeability" },
    energy: { de: "bringt Mitgefühl, Kreativität und eine tiefe Verbindung zum Unsichtbaren", en: "brings compassion, creativity, and a deep connection to the unseen" },
  },
};

// ── Localized sign names for natural sentence construction ──────────
const SIGN_NAMES_DE: Record<string, string> = {
  Aries: "Widder", Taurus: "Stier", Gemini: "Zwillinge", Cancer: "Krebs",
  Leo: "Löwe", Virgo: "Jungfrau", Libra: "Waage", Scorpio: "Skorpion",
  Sagittarius: "Schütze", Capricorn: "Steinbock", Aquarius: "Wassermann", Pisces: "Fische",
};

/**
 * Generates a substantive house interpretation by combining house domain + sign archetype.
 * Typically returns four sentences covering: what the house governs, how the sign manifests,
 * the native's strength in this area, and their main growth or tension theme. In fallback cases
 * (when no template or archetype is found), returns a single concise sentence.
 */
export function getHouseInterpretation(houseNum: number, sign: string, lang: Lang): string {
  const house = HOUSE_TEMPLATES[houseNum];
  const archetype = SIGN_ARCHETYPES[sign];

  if (!house || !archetype) {
    return lang === "de"
      ? `Haus ${houseNum} birgt verborgene Potenziale, die es zu erkunden gilt.`
      : `House ${houseNum} holds hidden potentials waiting to be explored.`;
  }

  const signName = lang === "de" ? (SIGN_NAMES_DE[sign] || sign) : sign;

  if (lang === "de") {
    return `${signName} prägt ${house.domain.de} mit ${archetype.quality.de}. Diese Energie ${archetype.energy.de}. ${house.strength.de}. ${house.tension.de}.`;
  }
  return `${signName} shapes ${house.domain.en} with ${archetype.quality.en}. This energy ${archetype.energy.en}. ${house.strength.en}. ${house.tension.en}.`;
}
