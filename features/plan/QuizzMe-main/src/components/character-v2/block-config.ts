/**
 * Character Sheet Block Configuration
 *
 * Maps blocks A-K to their trait categories and quiz routes.
 * Used by TraitBlock to determine what to render and where to link.
 */

import type { TraitCategory } from "@/lib/registry/traits";

export type BlockConfig = {
  id: string;
  label_de: string;
  label_en: string;
  categories: TraitCategory[];
  minTraitsRequired: number;
  quizRoute?: string;
  quizLabel?: string;
  icon?: string;
};

export const BLOCKS: readonly BlockConfig[] = [
  // Block A: Identity (handled by header - zodiac, archetype)
  // Block B: Astro (handled by header - astro data display)

  // Block C: Values & Motivation
  {
    id: "block.values",
    label_de: "Werte & Motivation",
    label_en: "Values & Motivation",
    categories: ["values", "motivation"],
    minTraitsRequired: 3,
    quizRoute: "/verticals/quiz/personality",
    quizLabel: "Persönlichkeitsquiz",
    icon: "compass",
  },

  // Block D: Social
  {
    id: "block.social",
    label_de: "Soziales Verhalten",
    label_en: "Social Behavior",
    categories: ["social"],
    minTraitsRequired: 2,
    quizRoute: "/verticals/quiz/social-role",
    quizLabel: "Soziale Rolle Quiz",
    icon: "users",
  },

  // Block E: Love & Relationship
  {
    id: "block.love",
    label_de: "Liebe & Beziehung",
    label_en: "Love & Relationship",
    categories: ["love"],
    minTraitsRequired: 2,
    quizRoute: "/verticals/quiz/love-languages",
    quizLabel: "Liebessprachen Quiz",
    icon: "heart",
  },

  // Block F: Lifestyle
  {
    id: "block.lifestyle",
    label_de: "Lebensstil",
    label_en: "Lifestyle",
    categories: ["lifestyle"],
    minTraitsRequired: 2,
    quizRoute: "/verticals/quiz/personality",
    quizLabel: "Lifestyle Quiz",
    icon: "sun",
  },

  // Block G: Interests
  {
    id: "block.interests",
    label_de: "Interessen",
    label_en: "Interests",
    categories: ["interest"],
    minTraitsRequired: 2,
    quizRoute: "/verticals/quiz/rpg-identity",
    quizLabel: "Interessen Quiz",
    icon: "star",
  },

  // Block H: Skills & Cognition
  {
    id: "block.skills",
    label_de: "Fähigkeiten & Denken",
    label_en: "Skills & Cognition",
    categories: ["skills", "cognition"],
    minTraitsRequired: 3,
    quizRoute: "/verticals/quiz/rpg-identity",
    quizLabel: "RPG Klassen Quiz",
    icon: "brain",
  },

  // Block I: Emotional Intelligence
  {
    id: "block.eq",
    label_de: "Emotionale Intelligenz",
    label_en: "Emotional Intelligence",
    categories: ["eq"],
    minTraitsRequired: 2,
    quizRoute: "/verticals/quiz/personality",
    quizLabel: "EQ Quiz",
    icon: "heart-handshake",
  },

  // Block J: Aura & Charm
  {
    id: "block.aura",
    label_de: "Aura & Ausstrahlung",
    label_en: "Aura & Charm",
    categories: ["aura"],
    minTraitsRequired: 2,
    quizRoute: "/verticals/quiz/celebrity-soulmate",
    quizLabel: "Aura Quiz",
    icon: "sparkles",
  },

  // Block K: Unlocks & Achievements (special block - not trait-based)
  {
    id: "block.unlocks",
    label_de: "Errungenschaften",
    label_en: "Achievements",
    categories: [],
    minTraitsRequired: 0,
    icon: "trophy",
  },
] as const;

export const BLOCK_BY_ID = Object.fromEntries(
  BLOCKS.map((b) => [b.id, b])
) as Record<string, BlockConfig>;
