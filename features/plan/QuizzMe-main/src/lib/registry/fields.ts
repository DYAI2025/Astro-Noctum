/**
 * Field Registry
 *
 * Fields are free-text content slots for user-generated or AI-generated content.
 * They are NOT stats or scores - just content slots for the Character Sheet.
 *
 * Naming convention: field.<block>.<name>
 *
 * Kinds:
 * - text: Single string value
 * - bullets: Array of bullet points (max 5)
 * - enum: Predefined choices (stored as string)
 */

export type FieldKind = "text" | "bullets" | "enum";

export type FieldDefinition = {
  id: string;
  kind: FieldKind;
  label_de: string;
  label_en: string;
  maxLength?: number;
  maxBullets?: number;
  enumOptions?: string[];
  placeholder_de?: string;
  placeholder_en?: string;
  block: string; // Which Character Sheet block this belongs to
};

export const FIELDS: readonly FieldDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // VALUES BLOCK (C)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.values.alive_when",
    kind: "text",
    label_de: "Ich fühle mich lebendig, wenn...",
    label_en: "I feel alive when...",
    maxLength: 200,
    placeholder_de: "z.B. ich kreativ sein kann und neue Ideen entwickle",
    placeholder_en: "e.g. I can be creative and develop new ideas",
    block: "values",
  },
  {
    id: "field.values.core_belief",
    kind: "text",
    label_de: "Mein Kernglaubenssatz",
    label_en: "My Core Belief",
    maxLength: 150,
    placeholder_de: "z.B. Jeder verdient eine zweite Chance",
    placeholder_en: "e.g. Everyone deserves a second chance",
    block: "values",
  },
  {
    id: "field.values.no_gos",
    kind: "bullets",
    label_de: "No-Gos / Anti-Werte",
    label_en: "No-Gos / Anti-Values",
    maxBullets: 5,
    placeholder_de: "Dinge, die für dich absolut nicht gehen",
    placeholder_en: "Things that are absolutely not okay for you",
    block: "values",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL/PERSONALITY BLOCK (D)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.social.recharge_method",
    kind: "text",
    label_de: "So lade ich auf",
    label_en: "How I Recharge",
    maxLength: 150,
    placeholder_de: "z.B. Zeit allein mit einem guten Buch",
    placeholder_en: "e.g. Alone time with a good book",
    block: "social",
  },
  {
    id: "field.social.first_impression",
    kind: "text",
    label_de: "Mein erster Eindruck auf andere",
    label_en: "My First Impression",
    maxLength: 150,
    block: "social",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOVE/RELATIONSHIP BLOCK (E)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.love.repair_ritual",
    kind: "text",
    label_de: "Mein Repair-Ritual nach Streit",
    label_en: "My Repair Ritual After Arguments",
    maxLength: 200,
    placeholder_de: "z.B. Erstmal durchatmen, dann reden",
    placeholder_en: "e.g. First breathe, then talk",
    block: "love",
  },
  {
    id: "field.love.boundaries",
    kind: "bullets",
    label_de: "Meine Grenzen in Beziehungen",
    label_en: "My Relationship Boundaries",
    maxBullets: 5,
    placeholder_de: "z.B. Ich brauche Zeit für mich",
    placeholder_en: "e.g. I need time for myself",
    block: "love",
  },
  {
    id: "field.love.attachment_style",
    kind: "enum",
    label_de: "Bindungsstil",
    label_en: "Attachment Style",
    enumOptions: ["secure", "anxious", "avoidant", "disorganized"],
    block: "love",
  },
  {
    id: "field.love.dealbreakers",
    kind: "bullets",
    label_de: "Dealbreaker",
    label_en: "Dealbreakers",
    maxBullets: 5,
    block: "love",
  },
  {
    id: "field.love.must_haves",
    kind: "bullets",
    label_de: "Must-Haves in einer Beziehung",
    label_en: "Relationship Must-Haves",
    maxBullets: 5,
    block: "love",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFESTYLE BLOCK (F)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.lifestyle.ideal_day",
    kind: "bullets",
    label_de: "Mein idealer Tag",
    label_en: "My Ideal Day",
    maxBullets: 5,
    placeholder_de: "Wie sieht dein perfekter Tag aus?",
    placeholder_en: "What does your perfect day look like?",
    block: "lifestyle",
  },
  {
    id: "field.lifestyle.morning_routine",
    kind: "text",
    label_de: "Morgenroutine",
    label_en: "Morning Routine",
    maxLength: 200,
    block: "lifestyle",
  },
  {
    id: "field.lifestyle.guilty_pleasure",
    kind: "text",
    label_de: "Guilty Pleasure",
    label_en: "Guilty Pleasure",
    maxLength: 100,
    block: "lifestyle",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERESTS BLOCK (G)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.interest.current_obsession",
    kind: "text",
    label_de: "Aktuelle Obsession",
    label_en: "Current Obsession",
    maxLength: 100,
    block: "interest",
  },
  {
    id: "field.interest.top_vibes",
    kind: "bullets",
    label_de: "Top 3 Vibes",
    label_en: "Top 3 Vibes",
    maxBullets: 3,
    block: "interest",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EQ/EMOTION BLOCK (I)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.eq.stress_response",
    kind: "enum",
    label_de: "Stressreaktion",
    label_en: "Stress Response",
    enumOptions: ["fight", "flight", "freeze", "fawn"],
    block: "eq",
  },
  {
    id: "field.eq.calming_strategy",
    kind: "text",
    label_de: "Was mich beruhigt",
    label_en: "What Calms Me",
    maxLength: 150,
    block: "eq",
  },
  {
    id: "field.eq.trust_evidence",
    kind: "bullets",
    label_de: "So zeige ich Vertrauen",
    label_en: "How I Show Trust",
    maxBullets: 3,
    block: "eq",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AURA/CHARM BLOCK (J)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.aura.signature_move",
    kind: "text",
    label_de: "Mein Signature Move",
    label_en: "My Signature Move",
    maxLength: 100,
    placeholder_de: "Was macht dich unverwechselbar?",
    placeholder_en: "What makes you unmistakable?",
    block: "aura",
  },
  {
    id: "field.aura.superpower",
    kind: "text",
    label_de: "Meine Superkraft",
    label_en: "My Superpower",
    maxLength: 100,
    block: "aura",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // META BLOCK (K)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.meta.green_flags",
    kind: "bullets",
    label_de: "Green Flags",
    label_en: "Green Flags",
    maxBullets: 5,
    placeholder_de: "Positive Signale, die für dich sprechen",
    placeholder_en: "Positive signals that speak for you",
    block: "meta",
  },
  {
    id: "field.meta.red_flags",
    kind: "bullets",
    label_de: "Red Flags",
    label_en: "Red Flags",
    maxBullets: 5,
    placeholder_de: "Warnzeichen, auf die andere achten sollten",
    placeholder_en: "Warning signs others should watch for",
    block: "meta",
  },
  {
    id: "field.meta.overwhelm_signs",
    kind: "bullets",
    label_de: "Zeichen meiner Überforderung",
    label_en: "Signs I'm Overwhelmed",
    maxBullets: 3,
    block: "meta",
  },
  {
    id: "field.meta.help_me_by",
    kind: "text",
    label_de: "Hilf mir, indem du...",
    label_en: "Help Me By...",
    maxLength: 150,
    block: "meta",
  },
  {
    id: "field.meta.vulnerability",
    kind: "text",
    label_de: "Meine Verletzlichkeit",
    label_en: "My Vulnerability",
    maxLength: 200,
    block: "meta",
  },
  {
    id: "field.meta.fun_facts",
    kind: "bullets",
    label_de: "Fun Facts über mich",
    label_en: "Fun Facts About Me",
    maxBullets: 5,
    block: "meta",
  },
  {
    id: "field.meta.life_motto",
    kind: "text",
    label_de: "Lebensmotto",
    label_en: "Life Motto",
    maxLength: 100,
    block: "meta",
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL ROLE QUIZ BLOCK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "field.social_role.result_title",
    kind: "text",
    label_de: "Social Role Ergebnis",
    label_en: "Social Role Result",
    maxLength: 100,
    block: "social_role",
  },
  {
    id: "field.social_role.tagline",
    kind: "text",
    label_de: "Social Role Tagline",
    label_en: "Social Role Tagline",
    maxLength: 200,
    block: "social_role",
  },
] as const;

// Lookup helpers
export const FIELD_BY_ID = Object.fromEntries(
  FIELDS.map((f) => [f.id, f])
) as Record<string, FieldDefinition>;

export const FIELD_IDS = FIELDS.map((f) => f.id);

export const FIELDS_BY_BLOCK = FIELDS.reduce(
  (acc, f) => {
    if (!acc[f.block]) acc[f.block] = [];
    acc[f.block].push(f);
    return acc;
  },
  {} as Record<string, FieldDefinition[]>
);

export const FIELDS_BY_KIND = FIELDS.reduce(
  (acc, f) => {
    if (!acc[f.kind]) acc[f.kind] = [];
    acc[f.kind].push(f);
    return acc;
  },
  {} as Record<FieldKind, FieldDefinition[]>
);
