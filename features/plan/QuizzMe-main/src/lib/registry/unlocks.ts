/**
 * Unlock Registry
 *
 * Unlocks are collectible achievements/badges/crests that users earn.
 * They are monotonic: once unlocked, they stay unlocked.
 *
 * Naming convention: unlock.<category>.<name>
 *
 * Categories:
 * - sigils: Zodiac and element symbols
 * - badges: Chinese zodiac animals
 * - crests: Quiz achievement crests
 * - sheets: Special character sheet variants
 */

export type UnlockCategory = "sigils" | "badges" | "crests" | "sheets";

export type UnlockRarity = 1 | 2 | 3; // 1=common, 2=rare, 3=legendary

export type UnlockDefinition = {
  id: string;
  category: UnlockCategory;
  label_de: string;
  label_en: string;
  rarity: UnlockRarity;
  iconPath?: string;
  description_de?: string;
  description_en?: string;
};

export const UNLOCKS: readonly UnlockDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SIGILS - Western Zodiac
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "unlock.sigils.zodiac_aries",
    category: "sigils",
    label_de: "Widder-Siegel",
    label_en: "Aries Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/aries.svg",
  },
  {
    id: "unlock.sigils.zodiac_taurus",
    category: "sigils",
    label_de: "Stier-Siegel",
    label_en: "Taurus Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/taurus.svg",
  },
  {
    id: "unlock.sigils.zodiac_gemini",
    category: "sigils",
    label_de: "Zwillinge-Siegel",
    label_en: "Gemini Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/gemini.svg",
  },
  {
    id: "unlock.sigils.zodiac_cancer",
    category: "sigils",
    label_de: "Krebs-Siegel",
    label_en: "Cancer Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/cancer.svg",
  },
  {
    id: "unlock.sigils.zodiac_leo",
    category: "sigils",
    label_de: "Löwe-Siegel",
    label_en: "Leo Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/leo.svg",
  },
  {
    id: "unlock.sigils.zodiac_virgo",
    category: "sigils",
    label_de: "Jungfrau-Siegel",
    label_en: "Virgo Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/virgo.svg",
  },
  {
    id: "unlock.sigils.zodiac_libra",
    category: "sigils",
    label_de: "Waage-Siegel",
    label_en: "Libra Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/libra.svg",
  },
  {
    id: "unlock.sigils.zodiac_scorpio",
    category: "sigils",
    label_de: "Skorpion-Siegel",
    label_en: "Scorpio Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/scorpio.svg",
  },
  {
    id: "unlock.sigils.zodiac_sagittarius",
    category: "sigils",
    label_de: "Schütze-Siegel",
    label_en: "Sagittarius Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/sagittarius.svg",
  },
  {
    id: "unlock.sigils.zodiac_capricorn",
    category: "sigils",
    label_de: "Steinbock-Siegel",
    label_en: "Capricorn Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/capricorn.svg",
  },
  {
    id: "unlock.sigils.zodiac_aquarius",
    category: "sigils",
    label_de: "Wassermann-Siegel",
    label_en: "Aquarius Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/aquarius.svg",
  },
  {
    id: "unlock.sigils.zodiac_pisces",
    category: "sigils",
    label_de: "Fische-Siegel",
    label_en: "Pisces Sigil",
    rarity: 1,
    iconPath: "/assets/sigils/zodiac/pisces.svg",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGILS - Elements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "unlock.sigils.element_fire",
    category: "sigils",
    label_de: "Feuer-Element-Siegel",
    label_en: "Fire Element Sigil",
    rarity: 2,
    iconPath: "/assets/sigils/elements/fire.svg",
  },
  {
    id: "unlock.sigils.element_earth",
    category: "sigils",
    label_de: "Erde-Element-Siegel",
    label_en: "Earth Element Sigil",
    rarity: 2,
    iconPath: "/assets/sigils/elements/earth.svg",
  },
  {
    id: "unlock.sigils.element_air",
    category: "sigils",
    label_de: "Luft-Element-Siegel",
    label_en: "Air Element Sigil",
    rarity: 2,
    iconPath: "/assets/sigils/elements/air.svg",
  },
  {
    id: "unlock.sigils.element_water",
    category: "sigils",
    label_de: "Wasser-Element-Siegel",
    label_en: "Water Element Sigil",
    rarity: 2,
    iconPath: "/assets/sigils/elements/water.svg",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BADGES - Chinese Zodiac
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "unlock.badges.chinese_rat",
    category: "badges",
    label_de: "Ratten-Abzeichen",
    label_en: "Rat Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/rat.svg",
  },
  {
    id: "unlock.badges.chinese_ox",
    category: "badges",
    label_de: "Büffel-Abzeichen",
    label_en: "Ox Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/ox.svg",
  },
  {
    id: "unlock.badges.chinese_tiger",
    category: "badges",
    label_de: "Tiger-Abzeichen",
    label_en: "Tiger Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/tiger.svg",
  },
  {
    id: "unlock.badges.chinese_rabbit",
    category: "badges",
    label_de: "Hasen-Abzeichen",
    label_en: "Rabbit Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/rabbit.svg",
  },
  {
    id: "unlock.badges.chinese_dragon",
    category: "badges",
    label_de: "Drachen-Abzeichen",
    label_en: "Dragon Badge",
    rarity: 2,
    iconPath: "/assets/badges/chinese/dragon.svg",
  },
  {
    id: "unlock.badges.chinese_snake",
    category: "badges",
    label_de: "Schlangen-Abzeichen",
    label_en: "Snake Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/snake.svg",
  },
  {
    id: "unlock.badges.chinese_horse",
    category: "badges",
    label_de: "Pferde-Abzeichen",
    label_en: "Horse Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/horse.svg",
  },
  {
    id: "unlock.badges.chinese_goat",
    category: "badges",
    label_de: "Ziegen-Abzeichen",
    label_en: "Goat Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/goat.svg",
  },
  {
    id: "unlock.badges.chinese_monkey",
    category: "badges",
    label_de: "Affen-Abzeichen",
    label_en: "Monkey Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/monkey.svg",
  },
  {
    id: "unlock.badges.chinese_rooster",
    category: "badges",
    label_de: "Hahn-Abzeichen",
    label_en: "Rooster Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/rooster.svg",
  },
  {
    id: "unlock.badges.chinese_dog",
    category: "badges",
    label_de: "Hunde-Abzeichen",
    label_en: "Dog Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/dog.svg",
  },
  {
    id: "unlock.badges.chinese_pig",
    category: "badges",
    label_de: "Schweine-Abzeichen",
    label_en: "Pig Badge",
    rarity: 1,
    iconPath: "/assets/badges/chinese/pig.svg",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRESTS - Quiz Achievements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "unlock.crests.personality",
    category: "crests",
    label_de: "Persönlichkeits-Wappen",
    label_en: "Personality Crest",
    rarity: 2,
    iconPath: "/assets/crests/personality.svg",
    description_de: "Verliehen für das Abschließen des Persönlichkeitstests",
    description_en: "Awarded for completing the Personality Quiz",
  },
  {
    id: "unlock.crests.love_languages",
    category: "crests",
    label_de: "Liebessprachen-Wappen",
    label_en: "Love Languages Crest",
    rarity: 2,
    iconPath: "/assets/crests/love_languages.svg",
    description_de: "Verliehen für das Abschließen des Liebessprachen-Tests",
    description_en: "Awarded for completing the Love Languages Quiz",
  },
  {
    id: "unlock.crests.social_role",
    category: "crests",
    label_de: "Soziale-Rolle-Wappen",
    label_en: "Social Role Crest",
    rarity: 2,
    iconPath: "/assets/crests/social_role.svg",
    description_de: "Verliehen für das Abschließen des Soziale-Rolle-Tests",
    description_en: "Awarded for completing the Social Role Quiz",
  },
  {
    id: "unlock.crests.rpg_identity",
    category: "crests",
    label_de: "RPG-Identität-Wappen",
    label_en: "RPG Identity Crest",
    rarity: 2,
    iconPath: "/assets/crests/rpg_identity.svg",
    description_de: "Verliehen für das Abschließen des RPG-Identität-Tests",
    description_en: "Awarded for completing the RPG Identity Quiz",
  },
  {
    id: "unlock.crests.celebrity_soulmate",
    category: "crests",
    label_de: "Promi-Seelenverwandter-Wappen",
    label_en: "Celebrity Soulmate Crest",
    rarity: 2,
    iconPath: "/assets/crests/celebrity_soulmate.svg",
    description_de: "Verliehen für das Abschließen des Promi-Tests",
    description_en: "Awarded for completing the Celebrity Soulmate Quiz",
  },
  {
    id: "unlock.crests.destiny",
    category: "crests",
    label_de: "Schicksal-Wappen",
    label_en: "Destiny Crest",
    rarity: 2,
    iconPath: "/assets/crests/destiny.svg",
    description_de: "Verliehen für das Abschließen des Schicksals-Quiz",
    description_en: "Awarded for completing the Destiny Quiz",
  },
  {
    id: "unlock.crests.astro_onboarding",
    category: "crests",
    label_de: "Astro-Onboarding-Wappen",
    label_en: "Astro Onboarding Crest",
    rarity: 1,
    iconPath: "/assets/crests/astro_onboarding.svg",
    description_de: "Verliehen für das Abschließen des Astro-Onboardings",
    description_en: "Awarded for completing Astro Onboarding",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRESTS - Special Achievements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "unlock.crests.completionist",
    category: "crests",
    label_de: "Komplettist-Wappen",
    label_en: "Completionist Crest",
    rarity: 3,
    iconPath: "/assets/crests/completionist.svg",
    description_de: "Verliehen für das Abschließen aller Quizze",
    description_en: "Awarded for completing all quizzes",
  },
  {
    id: "unlock.crests.early_adopter",
    category: "crests",
    label_de: "Early-Adopter-Wappen",
    label_en: "Early Adopter Crest",
    rarity: 3,
    iconPath: "/assets/crests/early_adopter.svg",
    description_de: "Verliehen an frühe Nutzer der Plattform",
    description_en: "Awarded to early platform users",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEETS - Special Character Sheet Variants
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "unlock.sheets.dark_mode",
    category: "sheets",
    label_de: "Dunkelmodus-Sheet",
    label_en: "Dark Mode Sheet",
    rarity: 1,
    description_de: "Dunkles Farbschema für das Character Sheet",
    description_en: "Dark color scheme for the Character Sheet",
  },
  {
    id: "unlock.sheets.cosmic",
    category: "sheets",
    label_de: "Kosmisches Sheet",
    label_en: "Cosmic Sheet",
    rarity: 2,
    description_de: "Kosmisches Design mit Sternen und Galaxien",
    description_en: "Cosmic design with stars and galaxies",
  },
  {
    id: "unlock.sheets.elemental",
    category: "sheets",
    label_de: "Elementares Sheet",
    label_en: "Elemental Sheet",
    rarity: 2,
    description_de: "Design basierend auf deinem dominanten Element",
    description_en: "Design based on your dominant element",
  },
] as const;

// Lookup helpers
export const UNLOCK_BY_ID = Object.fromEntries(
  UNLOCKS.map((u) => [u.id, u])
) as Record<string, UnlockDefinition>;

export const UNLOCK_IDS = UNLOCKS.map((u) => u.id);

export const UNLOCKS_BY_CATEGORY = UNLOCKS.reduce(
  (acc, u) => {
    if (!acc[u.category]) acc[u.category] = [];
    acc[u.category].push(u);
    return acc;
  },
  {} as Record<UnlockCategory, UnlockDefinition[]>
);

// ═══════════════════════════════════════════════════════════════════════════
// PREFIX ALLOWLISTS for dynamic IDs
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Allowed prefixes for dynamically generated unlock IDs.
 * These support template literal patterns like `unlock.sigils.zodiac_${sign}`.
 */
export const UNLOCK_PREFIX_ALLOWLIST: readonly string[] = [
  "unlock.sigils.zodiac_",
  "unlock.sigils.element_",
  "unlock.badges.chinese_",
  "unlock.crests.",
  "unlock.sheets.",
] as const;

/**
 * Valid suffixes for zodiac-related unlocks
 */
export const ZODIAC_SUFFIXES = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export const CHINESE_ZODIAC_SUFFIXES = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
] as const;

export const ELEMENT_SUFFIXES = ["fire", "earth", "air", "water"] as const;

/**
 * Check if an unlock ID is valid (either exact match or valid prefix pattern)
 */
export function isValidUnlockId(id: string): boolean {
  // Exact match in registry
  if (UNLOCK_BY_ID[id]) return true;

  // Check prefix patterns with valid suffixes
  if (id.startsWith("unlock.sigils.zodiac_")) {
    const suffix = id.replace("unlock.sigils.zodiac_", "");
    return ZODIAC_SUFFIXES.includes(suffix as (typeof ZODIAC_SUFFIXES)[number]);
  }

  if (id.startsWith("unlock.sigils.element_")) {
    const suffix = id.replace("unlock.sigils.element_", "");
    return ELEMENT_SUFFIXES.includes(
      suffix as (typeof ELEMENT_SUFFIXES)[number]
    );
  }

  if (id.startsWith("unlock.badges.chinese_")) {
    const suffix = id.replace("unlock.badges.chinese_", "");
    return CHINESE_ZODIAC_SUFFIXES.includes(
      suffix as (typeof CHINESE_ZODIAC_SUFFIXES)[number]
    );
  }

  return false;
}
