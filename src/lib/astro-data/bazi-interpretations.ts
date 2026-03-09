// ── BaZi Personality Interpretations ──────────────────────────────────────
// 60 combinations: 12 animals × 5 elements
// Each entry keyed by "Animal-Element" (e.g. "Rat-Water")

type Lang = "en" | "de";
type I18n = Record<Lang, string>;

export interface BaZiInterpretation {
  animal: string;
  element: string;
  title: I18n;
  short: I18n;
  long: I18n;
  strengths: I18n[];
  shadows: I18n[];
}

const ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] as const;
const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;

const ANIMAL_DE: Record<string, string> = {
  Rat: "Ratte", Ox: "Büffel", Tiger: "Tiger", Rabbit: "Hase",
  Dragon: "Drache", Snake: "Schlange", Horse: "Pferd", Goat: "Ziege",
  Monkey: "Affe", Rooster: "Hahn", Dog: "Hund", Pig: "Schwein",
};

const ELEMENT_DE: Record<string, string> = {
  Wood: "Holz", Fire: "Feuer", Earth: "Erde", Metal: "Metall", Water: "Wasser",
};

// Generate base interpretations — these will be replaced with Ben's authored texts
function generateBaseInterpretation(animal: string, element: string): BaZiInterpretation {
  const animalDe = ANIMAL_DE[animal] ?? animal;
  const elementDe = ELEMENT_DE[element] ?? element;

  return {
    animal,
    element,
    title: {
      en: `The ${element} ${animal}`,
      de: `Der ${elementDe}-${animalDe}`,
    },
    short: {
      en: `The ${element} ${animal} combines ${element.toLowerCase()} energy with the innate qualities of the ${animal}.`,
      de: `Der ${elementDe}-${animalDe} vereint ${elementDe}-Energie mit den angeborenen Qualitäten des ${animalDe}.`,
    },
    long: {
      en: `As a ${element} ${animal}, your character is shaped by the interplay of ${element.toLowerCase()} qualities and the ${animal}'s natural instincts. This combination creates a unique personality signature that influences how you approach challenges, relationships, and personal growth. The ${element.toLowerCase()} aspect adds a distinctive layer to the ${animal}'s core traits, refining and redirecting its energy in ways that make your path truly individual.`,
      de: `Als ${elementDe}-${animalDe} wird dein Charakter durch das Zusammenspiel von ${elementDe}-Qualitäten und den natürlichen Instinkten des ${animalDe} geprägt. Diese Kombination erzeugt eine einzigartige Persönlichkeitssignatur, die beeinflusst, wie du Herausforderungen, Beziehungen und persönliches Wachstum angehst. Der ${elementDe}-Aspekt fügt den Kernmerkmalen des ${animalDe} eine markante Schicht hinzu und lenkt seine Energie auf Weise um, die deinen Weg wirklich individuell macht.`,
    },
    strengths: [
      { en: `${element}-enhanced perception`, de: `${elementDe}-verstärkte Wahrnehmung` },
      { en: `${animal}-rooted resilience`, de: `${animalDe}-verwurzelte Resilienz` },
    ],
    shadows: [
      { en: `${element} excess can amplify the ${animal}'s tendencies`, de: `${elementDe}-Überschuss kann die Tendenzen des ${animalDe} verstärken` },
    ],
  };
}

// Build the lookup map
const INTERPRETATIONS_MAP = new Map<string, BaZiInterpretation>();
for (const animal of ANIMALS) {
  for (const element of ELEMENTS) {
    const key = `${animal}-${element}`;
    INTERPRETATIONS_MAP.set(key, generateBaseInterpretation(animal, element));
  }
}

/**
 * Get the interpretation for an animal-element combination.
 * Falls back to base animal if exact combo not found.
 */
export function getBaZiInterpretation(animal: string, element: string): BaZiInterpretation | undefined {
  // Normalize
  const a = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();
  const e = element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
  return INTERPRETATIONS_MAP.get(`${a}-${e}`);
}

export { INTERPRETATIONS_MAP };
