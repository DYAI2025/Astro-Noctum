/**
 * Trait Registry
 *
 * Traits are UI-facing sliders (1-100) that represent personality dimensions.
 * Each trait can optionally be "anchorable" (seeded by astro data).
 */

export type TraitCategory =
  | "values"
  | "motivation"
  | "social"
  | "love"
  | "lifestyle"
  | "interest"
  | "skills"
  | "cognition"
  | "eq"
  | "aura";

export type TraitDefinition = {
  id: string;
  category: TraitCategory;
  label_de: string;
  label_en: string;
  lowLabel?: string;
  highLabel?: string;
  anchorable: boolean;
  bipolarPeerId?: string;
};

export const TRAITS: readonly TraitDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // VALUES (Block C)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.values.security",
    category: "values",
    label_de: "Sicherheit",
    label_en: "Security",
    lowLabel: "Risikofreudig",
    highLabel: "Sicherheitsorientiert",
    anchorable: true,
  },
  {
    id: "trait.values.autonomy",
    category: "values",
    label_de: "Autonomie",
    label_en: "Autonomy",
    lowLabel: "Teamorientiert",
    highLabel: "Unabhängig",
    anchorable: true,
  },
  {
    id: "trait.values.achievement",
    category: "values",
    label_de: "Leistung",
    label_en: "Achievement",
    lowLabel: "Prozessorientiert",
    highLabel: "Ergebnisorientiert",
    anchorable: true,
  },
  {
    id: "trait.values.connection",
    category: "values",
    label_de: "Verbundenheit",
    label_en: "Connection",
    lowLabel: "Selbstgenügsam",
    highLabel: "Beziehungsorientiert",
    anchorable: true,
  },
  {
    id: "trait.values.growth",
    category: "values",
    label_de: "Wachstum",
    label_en: "Growth",
    lowLabel: "Stabilitätsorientiert",
    highLabel: "Entwicklungsorientiert",
    anchorable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MOTIVATION (Block C)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.motivation.achievement",
    category: "motivation",
    label_de: "Leistungsmotivation",
    label_en: "Achievement Motivation",
    lowLabel: "Entspannt",
    highLabel: "Ehrgeizig",
    anchorable: true,
  },
  {
    id: "trait.motivation.affiliation",
    category: "motivation",
    label_de: "Zugehörigkeitsmotivation",
    label_en: "Affiliation Motivation",
    lowLabel: "Einzelgänger",
    highLabel: "Gemeinschaftsorientiert",
    anchorable: true,
  },
  {
    id: "trait.motivation.power",
    category: "motivation",
    label_de: "Machtmotivation",
    label_en: "Power Motivation",
    lowLabel: "Unterstützend",
    highLabel: "Führungsorientiert",
    anchorable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL (Block D)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.social.introversion",
    category: "social",
    label_de: "Introversion",
    label_en: "Introversion",
    lowLabel: "Extrovertiert",
    highLabel: "Introvertiert",
    anchorable: true,
    bipolarPeerId: "trait.social.extroversion",
  },
  {
    id: "trait.social.battery",
    category: "social",
    label_de: "Soziale Batterie",
    label_en: "Social Battery",
    lowLabel: "Schnell erschöpft",
    highLabel: "Langanhaltend",
    anchorable: false,
  },
  {
    id: "trait.social.dominance",
    category: "social",
    label_de: "Dominanz",
    label_en: "Dominance",
    lowLabel: "Zurückhaltend",
    highLabel: "Bestimmend",
    anchorable: true,
  },
  {
    id: "trait.social.openness",
    category: "social",
    label_de: "Offenheit",
    label_en: "Openness",
    lowLabel: "Reserviert",
    highLabel: "Offen",
    anchorable: true,
  },
  {
    id: "trait.social.trust_speed",
    category: "social",
    label_de: "Vertrauensaufbau",
    label_en: "Trust Building Speed",
    lowLabel: "Langsam",
    highLabel: "Schnell",
    anchorable: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOVE & RELATIONSHIP (Block E)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.love.attention_need",
    category: "love",
    label_de: "Aufmerksamkeitsbedürfnis",
    label_en: "Attention Need",
    lowLabel: "Unabhängig",
    highLabel: "Aufmerksamkeitsbedürftig",
    anchorable: false,
  },
  {
    id: "trait.love.independence",
    category: "love",
    label_de: "Beziehungsunabhängigkeit",
    label_en: "Relationship Independence",
    lowLabel: "Verschmelzend",
    highLabel: "Eigenständig",
    anchorable: true,
  },
  {
    id: "trait.love.jealousy_tendency",
    category: "love",
    label_de: "Eifersuchtstendenz",
    label_en: "Jealousy Tendency",
    lowLabel: "Gelassen",
    highLabel: "Eifersüchtig",
    anchorable: false,
  },
  {
    id: "trait.love.physical_touch",
    category: "love",
    label_de: "Körperliche Nähe",
    label_en: "Physical Touch",
    lowLabel: "Distanziert",
    highLabel: "Berührungsorientiert",
    anchorable: false,
  },
  {
    id: "trait.love.words_of_affirmation",
    category: "love",
    label_de: "Worte der Bestätigung",
    label_en: "Words of Affirmation",
    lowLabel: "Tatenorientiert",
    highLabel: "Worteorientiert",
    anchorable: false,
  },
  {
    id: "trait.love.quality_time",
    category: "love",
    label_de: "Qualitätszeit",
    label_en: "Quality Time",
    lowLabel: "Flexibel",
    highLabel: "Zeitorientiert",
    anchorable: false,
  },
  {
    id: "trait.love.acts_of_service",
    category: "love",
    label_de: "Hilfsbereitschaft",
    label_en: "Acts of Service",
    lowLabel: "Verbal",
    highLabel: "Handlungsorientiert",
    anchorable: false,
  },
  {
    id: "trait.love.receiving_gifts",
    category: "love",
    label_de: "Geschenke",
    label_en: "Receiving Gifts",
    lowLabel: "Symbolunabhängig",
    highLabel: "Symbolorientiert",
    anchorable: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFESTYLE (Block F)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.lifestyle.morning_person",
    category: "lifestyle",
    label_de: "Morgenmensch",
    label_en: "Morning Person",
    lowLabel: "Nachteule",
    highLabel: "Frühaufsteher",
    anchorable: false,
  },
  {
    id: "trait.lifestyle.spontaneity",
    category: "lifestyle",
    label_de: "Spontanität",
    label_en: "Spontaneity",
    lowLabel: "Geplant",
    highLabel: "Spontan",
    anchorable: true,
  },
  {
    id: "trait.lifestyle.tidiness",
    category: "lifestyle",
    label_de: "Ordnung",
    label_en: "Tidiness",
    lowLabel: "Chaotisch",
    highLabel: "Ordentlich",
    anchorable: false,
  },
  {
    id: "trait.lifestyle.adventure",
    category: "lifestyle",
    label_de: "Abenteuerlust",
    label_en: "Adventure",
    lowLabel: "Häuslich",
    highLabel: "Abenteuerlustig",
    anchorable: true,
  },
  {
    id: "trait.lifestyle.routine",
    category: "lifestyle",
    label_de: "Routineorientierung",
    label_en: "Routine Orientation",
    lowLabel: "Flexibel",
    highLabel: "Routiniert",
    anchorable: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERESTS (Block G)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.interest.arts",
    category: "interest",
    label_de: "Kunst & Kultur",
    label_en: "Arts & Culture",
    anchorable: false,
  },
  {
    id: "trait.interest.sports",
    category: "interest",
    label_de: "Sport & Bewegung",
    label_en: "Sports & Fitness",
    anchorable: false,
  },
  {
    id: "trait.interest.technology",
    category: "interest",
    label_de: "Technologie",
    label_en: "Technology",
    anchorable: false,
  },
  {
    id: "trait.interest.nature",
    category: "interest",
    label_de: "Natur & Outdoor",
    label_en: "Nature & Outdoor",
    anchorable: false,
  },
  {
    id: "trait.interest.social_causes",
    category: "interest",
    label_de: "Soziales Engagement",
    label_en: "Social Causes",
    anchorable: false,
  },
  {
    id: "trait.interest.spirituality",
    category: "interest",
    label_de: "Spiritualität",
    label_en: "Spirituality",
    anchorable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILLS (Block H)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.skills.intellect",
    category: "skills",
    label_de: "Intellekt",
    label_en: "Intellect",
    anchorable: true,
  },
  {
    id: "trait.skills.language",
    category: "skills",
    label_de: "Sprachbegabung",
    label_en: "Language",
    anchorable: true,
  },
  {
    id: "trait.skills.math",
    category: "skills",
    label_de: "Mathematik",
    label_en: "Math",
    anchorable: true,
  },
  {
    id: "trait.skills.focus",
    category: "skills",
    label_de: "Fokus",
    label_en: "Focus",
    anchorable: false,
  },
  {
    id: "trait.skills.curiosity",
    category: "skills",
    label_de: "Neugier",
    label_en: "Curiosity",
    anchorable: true,
  },
  {
    id: "trait.skills.creativity",
    category: "skills",
    label_de: "Kreativität",
    label_en: "Creativity",
    anchorable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COGNITION (Block H)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.cognition.system_vs_story",
    category: "cognition",
    label_de: "System vs Geschichte",
    label_en: "System vs Story",
    lowLabel: "Narrativ",
    highLabel: "Systematisch",
    anchorable: true,
  },
  {
    id: "trait.cognition.abstract_concrete",
    category: "cognition",
    label_de: "Abstrakt vs Konkret",
    label_en: "Abstract vs Concrete",
    lowLabel: "Konkret",
    highLabel: "Abstrakt",
    anchorable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EMOTIONAL INTELLIGENCE (Block I)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.eq.self_awareness",
    category: "eq",
    label_de: "Selbstwahrnehmung",
    label_en: "Self Awareness",
    anchorable: false,
  },
  {
    id: "trait.eq.self_regulation",
    category: "eq",
    label_de: "Selbstregulation",
    label_en: "Self Regulation",
    anchorable: false,
  },
  {
    id: "trait.eq.empathy",
    category: "eq",
    label_de: "Empathie",
    label_en: "Empathy",
    anchorable: true,
  },
  {
    id: "trait.eq.motivation",
    category: "eq",
    label_de: "Intrinsische Motivation",
    label_en: "Intrinsic Motivation",
    anchorable: false,
  },
  {
    id: "trait.eq.social_skill",
    category: "eq",
    label_de: "Soziale Kompetenz",
    label_en: "Social Skill",
    anchorable: false,
  },
  {
    id: "trait.eq.stress_tolerance",
    category: "eq",
    label_de: "Stresstoleranz",
    label_en: "Stress Tolerance",
    lowLabel: "Sensibel",
    highLabel: "Belastbar",
    anchorable: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AURA & CHARM (Block J)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "trait.aura.warmth",
    category: "aura",
    label_de: "Wärme",
    label_en: "Warmth",
    lowLabel: "Kühl",
    highLabel: "Warm",
    anchorable: true,
  },
  {
    id: "trait.aura.authority",
    category: "aura",
    label_de: "Autorität",
    label_en: "Authority",
    lowLabel: "Sanft",
    highLabel: "Autoritär",
    anchorable: true,
  },
  {
    id: "trait.aura.mystery",
    category: "aura",
    label_de: "Mysterium",
    label_en: "Mystery",
    lowLabel: "Transparent",
    highLabel: "Geheimnisvoll",
    anchorable: true,
  },
  {
    id: "trait.aura.energy",
    category: "aura",
    label_de: "Energie",
    label_en: "Energy",
    lowLabel: "Ruhig",
    highLabel: "Energetisch",
    anchorable: true,
  },
] as const;

// Lookup helpers
export const TRAIT_BY_ID = Object.fromEntries(
  TRAITS.map((t) => [t.id, t])
) as Record<string, TraitDefinition>;

export const TRAIT_IDS = TRAITS.map((t) => t.id);

export const TRAITS_BY_CATEGORY = TRAITS.reduce(
  (acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  },
  {} as Record<TraitCategory, TraitDefinition[]>
);

export const ANCHORABLE_TRAITS = TRAITS.filter((t) => t.anchorable);
