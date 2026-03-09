/**
 * Marker Registry
 *
 * Markers are the REQUIRED interface to the LME (Longitudinal Marker Engine).
 * They represent evidence signals that update psyche dimensions.
 *
 * Key design:
 * - Weights are always POSITIVE magnitudes [0, 1]
 * - Direction is encoded in the `sign` field (+1 or -1)
 * - Bipolar concepts use two marker IDs mapping to same dimension with opposite signs
 * - Astro markers use low weight ranges (FLAVOR tier: 0.05-0.15)
 */

export type MarkerCategory =
  | "social"
  | "love"
  | "cognition"
  | "eq"
  | "lifestyle"
  | "values"
  | "skills"
  | "aura"
  | "astro";

export type MarkerDefinition = {
  id: string;
  category: MarkerCategory;
  dimensionId: string;
  sign: 1 | -1;
  label_de: string;
  weightRange: [number, number]; // Always positive [min, max]
};

export const MARKERS: readonly MarkerDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL MARKERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Extroversion/Introversion bipolar pair
  {
    id: "marker.social.extroversion",
    category: "social",
    dimensionId: "dim.social.extroversion",
    sign: +1,
    label_de: "Extroversion",
    weightRange: [0.05, 0.9],
  },
  {
    id: "marker.social.introversion",
    category: "social",
    dimensionId: "dim.social.extroversion",
    sign: -1,
    label_de: "Introversion",
    weightRange: [0.05, 0.9],
  },

  // Dominance/Submission bipolar pair
  {
    id: "marker.social.dominance",
    category: "social",
    dimensionId: "dim.social.dominance",
    sign: +1,
    label_de: "Dominanz",
    weightRange: [0.05, 0.8],
  },
  {
    id: "marker.social.submission",
    category: "social",
    dimensionId: "dim.social.dominance",
    sign: -1,
    label_de: "Unterwürfigkeit",
    weightRange: [0.05, 0.8],
  },

  // Openness bipolar pair
  {
    id: "marker.social.openness",
    category: "social",
    dimensionId: "dim.social.openness",
    sign: +1,
    label_de: "Offenheit",
    weightRange: [0.05, 0.8],
  },
  {
    id: "marker.social.reserve",
    category: "social",
    dimensionId: "dim.social.openness",
    sign: -1,
    label_de: "Zurückhaltung",
    weightRange: [0.05, 0.8],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EMOTIONAL INTELLIGENCE MARKERS (marker.eq.*)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "marker.eq.self_awareness",
    category: "eq",
    dimensionId: "dim.eq.self_awareness",
    sign: +1,
    label_de: "Selbstwahrnehmung",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.self_regulation",
    category: "eq",
    dimensionId: "dim.eq.self_regulation",
    sign: +1,
    label_de: "Selbstregulation",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.impulsivity",
    category: "eq",
    dimensionId: "dim.eq.self_regulation",
    sign: -1,
    label_de: "Impulsivität",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.empathy",
    category: "eq",
    dimensionId: "dim.eq.empathy",
    sign: +1,
    label_de: "Empathie",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.detachment",
    category: "eq",
    dimensionId: "dim.eq.empathy",
    sign: -1,
    label_de: "Distanziertheit",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.motivation",
    category: "eq",
    dimensionId: "dim.eq.motivation",
    sign: +1,
    label_de: "Intrinsische Motivation",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.social_skill",
    category: "eq",
    dimensionId: "dim.eq.social_skill",
    sign: +1,
    label_de: "Soziale Kompetenz",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.stress_tolerance",
    category: "eq",
    dimensionId: "dim.eq.stress_tolerance",
    sign: +1,
    label_de: "Stresstoleranz",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.eq.stress_sensitivity",
    category: "eq",
    dimensionId: "dim.eq.stress_tolerance",
    sign: -1,
    label_de: "Stresssensibilität",
    weightRange: [0.1, 0.8],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COGNITION MARKERS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "marker.cognition.system_thinking",
    category: "cognition",
    dimensionId: "dim.cognition.system_vs_story",
    sign: +1,
    label_de: "Systemdenken",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.cognition.narrative_thinking",
    category: "cognition",
    dimensionId: "dim.cognition.system_vs_story",
    sign: -1,
    label_de: "Narratives Denken",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.cognition.abstract",
    category: "cognition",
    dimensionId: "dim.cognition.abstract_concrete",
    sign: +1,
    label_de: "Abstraktes Denken",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.cognition.concrete",
    category: "cognition",
    dimensionId: "dim.cognition.abstract_concrete",
    sign: -1,
    label_de: "Konkretes Denken",
    weightRange: [0.1, 0.7],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALUES MARKERS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "marker.values.security",
    category: "values",
    dimensionId: "dim.values.security",
    sign: +1,
    label_de: "Sicherheitsorientierung",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.values.risk_taking",
    category: "values",
    dimensionId: "dim.values.security",
    sign: -1,
    label_de: "Risikobereitschaft",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.values.autonomy",
    category: "values",
    dimensionId: "dim.values.autonomy",
    sign: +1,
    label_de: "Autonomiestreben",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.values.conformity",
    category: "values",
    dimensionId: "dim.values.autonomy",
    sign: -1,
    label_de: "Konformität",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.values.achievement",
    category: "values",
    dimensionId: "dim.values.achievement",
    sign: +1,
    label_de: "Leistungsorientierung",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.values.connection",
    category: "values",
    dimensionId: "dim.values.connection",
    sign: +1,
    label_de: "Verbundenheitsorientierung",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.values.growth",
    category: "values",
    dimensionId: "dim.values.growth",
    sign: +1,
    label_de: "Wachstumsorientierung",
    weightRange: [0.1, 0.8],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOVE & RELATIONSHIP MARKERS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "marker.love.attachment_secure",
    category: "love",
    dimensionId: "dim.love.attachment",
    sign: +1,
    label_de: "Sichere Bindung",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.love.attachment_anxious",
    category: "love",
    dimensionId: "dim.love.attachment",
    sign: -1,
    label_de: "Ängstliche Bindung",
    weightRange: [0.1, 0.8],
  },
  {
    id: "marker.love.independence",
    category: "love",
    dimensionId: "dim.love.independence",
    sign: +1,
    label_de: "Beziehungsunabhängigkeit",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.love.merger",
    category: "love",
    dimensionId: "dim.love.independence",
    sign: -1,
    label_de: "Verschmelzungstendenz",
    weightRange: [0.1, 0.7],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFESTYLE MARKERS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "marker.lifestyle.spontaneity",
    category: "lifestyle",
    dimensionId: "dim.lifestyle.spontaneity",
    sign: +1,
    label_de: "Spontanität",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.lifestyle.planning",
    category: "lifestyle",
    dimensionId: "dim.lifestyle.spontaneity",
    sign: -1,
    label_de: "Planung",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.lifestyle.adventure",
    category: "lifestyle",
    dimensionId: "dim.lifestyle.adventure",
    sign: +1,
    label_de: "Abenteuerlust",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.lifestyle.comfort",
    category: "lifestyle",
    dimensionId: "dim.lifestyle.adventure",
    sign: -1,
    label_de: "Komfortorientierung",
    weightRange: [0.1, 0.7],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKILLS MARKERS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "marker.skills.intellect",
    category: "skills",
    dimensionId: "dim.skills.intellect",
    sign: +1,
    label_de: "Intellekt",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.skills.creativity",
    category: "skills",
    dimensionId: "dim.skills.creativity",
    sign: +1,
    label_de: "Kreativität",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.skills.curiosity",
    category: "skills",
    dimensionId: "dim.skills.curiosity",
    sign: +1,
    label_de: "Neugier",
    weightRange: [0.1, 0.7],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AURA MARKERS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "marker.aura.warmth",
    category: "aura",
    dimensionId: "dim.aura.warmth",
    sign: +1,
    label_de: "Wärme",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.aura.coolness",
    category: "aura",
    dimensionId: "dim.aura.warmth",
    sign: -1,
    label_de: "Kühle",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.aura.authority",
    category: "aura",
    dimensionId: "dim.aura.authority",
    sign: +1,
    label_de: "Autorität",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.aura.approachability",
    category: "aura",
    dimensionId: "dim.aura.authority",
    sign: -1,
    label_de: "Nahbarkeit",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.aura.mystery",
    category: "aura",
    dimensionId: "dim.aura.mystery",
    sign: +1,
    label_de: "Mysterium",
    weightRange: [0.1, 0.7],
  },
  {
    id: "marker.aura.transparency",
    category: "aura",
    dimensionId: "dim.aura.mystery",
    sign: -1,
    label_de: "Transparenz",
    weightRange: [0.1, 0.7],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASTRO MARKERS (FLAVOR tier: low weight 0.05-0.15)
  // ═══════════════════════════════════════════════════════════════════════════

  // Elements
  {
    id: "marker.astro.element.fire",
    category: "astro",
    dimensionId: "dim.astro.element.fire",
    sign: +1,
    label_de: "Feuer-Element",
    weightRange: [0.05, 0.15],
  },
  {
    id: "marker.astro.element.earth",
    category: "astro",
    dimensionId: "dim.astro.element.earth",
    sign: +1,
    label_de: "Erde-Element",
    weightRange: [0.05, 0.15],
  },
  {
    id: "marker.astro.element.air",
    category: "astro",
    dimensionId: "dim.astro.element.air",
    sign: +1,
    label_de: "Luft-Element",
    weightRange: [0.05, 0.15],
  },
  {
    id: "marker.astro.element.water",
    category: "astro",
    dimensionId: "dim.astro.element.water",
    sign: +1,
    label_de: "Wasser-Element",
    weightRange: [0.05, 0.15],
  },

  // Modalities
  {
    id: "marker.astro.modality.cardinal",
    category: "astro",
    dimensionId: "dim.astro.modality.cardinal",
    sign: +1,
    label_de: "Kardinal",
    weightRange: [0.05, 0.15],
  },
  {
    id: "marker.astro.modality.fixed",
    category: "astro",
    dimensionId: "dim.astro.modality.fixed",
    sign: +1,
    label_de: "Fix",
    weightRange: [0.05, 0.15],
  },
  {
    id: "marker.astro.modality.mutable",
    category: "astro",
    dimensionId: "dim.astro.modality.mutable",
    sign: +1,
    label_de: "Veränderlich",
    weightRange: [0.05, 0.15],
  },

  // Chinese elements
  {
    id: "marker.astro.chinese.wood",
    category: "astro",
    dimensionId: "dim.astro.chinese.wood",
    sign: +1,
    label_de: "Holz (Chinesisch)",
    weightRange: [0.05, 0.12],
  },
  {
    id: "marker.astro.chinese.fire",
    category: "astro",
    dimensionId: "dim.astro.chinese.fire",
    sign: +1,
    label_de: "Feuer (Chinesisch)",
    weightRange: [0.05, 0.12],
  },
  {
    id: "marker.astro.chinese.earth",
    category: "astro",
    dimensionId: "dim.astro.chinese.earth",
    sign: +1,
    label_de: "Erde (Chinesisch)",
    weightRange: [0.05, 0.12],
  },
  {
    id: "marker.astro.chinese.metal",
    category: "astro",
    dimensionId: "dim.astro.chinese.metal",
    sign: +1,
    label_de: "Metall (Chinesisch)",
    weightRange: [0.05, 0.12],
  },
  {
    id: "marker.astro.chinese.water",
    category: "astro",
    dimensionId: "dim.astro.chinese.water",
    sign: +1,
    label_de: "Wasser (Chinesisch)",
    weightRange: [0.05, 0.12],
  },

  // Yin/Yang
  {
    id: "marker.astro.chinese.yin",
    category: "astro",
    dimensionId: "dim.astro.chinese.yinyang",
    sign: -1,
    label_de: "Yin",
    weightRange: [0.05, 0.12],
  },
  {
    id: "marker.astro.chinese.yang",
    category: "astro",
    dimensionId: "dim.astro.chinese.yinyang",
    sign: +1,
    label_de: "Yang",
    weightRange: [0.05, 0.12],
  },
] as const;

// Lookup helpers
export const MARKER_BY_ID = Object.fromEntries(
  MARKERS.map((m) => [m.id, m])
) as Record<string, MarkerDefinition>;

export const MARKER_IDS = MARKERS.map((m) => m.id);

export const MARKERS_BY_CATEGORY = MARKERS.reduce(
  (acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  },
  {} as Record<MarkerCategory, MarkerDefinition[]>
);

export const MARKERS_BY_DIMENSION = MARKERS.reduce(
  (acc, m) => {
    if (!acc[m.dimensionId]) acc[m.dimensionId] = [];
    acc[m.dimensionId].push(m);
    return acc;
  },
  {} as Record<string, MarkerDefinition[]>
);

/**
 * Get the bipolar opposite of a marker (if exists)
 */
export function getBipolarOpposite(markerId: string): MarkerDefinition | null {
  const marker = MARKER_BY_ID[markerId];
  if (!marker) return null;

  const opposites = MARKERS_BY_DIMENSION[marker.dimensionId]?.filter(
    (m) => m.sign !== marker.sign
  );
  return opposites?.[0] ?? null;
}
