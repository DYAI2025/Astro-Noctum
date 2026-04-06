import { z } from 'zod';

// ── Shared ──────────────────────────────────────────────────────────
const VisualParamsSchema = z.object({
  symmetry: z.number().min(0).max(1),
  curvature: z.number().min(0).max(1),
  angularity: z.number().min(0).max(1),
  density: z.number().min(0).max(1),
  contrast: z.number().min(0).max(1),
  orbit_count: z.number().int().min(1).max(7),
});

const SignatureBlueprintSchema = z.object({
  seed: z.string(),
  visual: VisualParamsSchema.optional(),
  elements: z.record(z.string(), z.number()).optional(),
});

const ProfileSummarySchema = z.object({
  sun_sign: z.string(),
  moon_sign: z.string(),
  ascendant_sign: z.string(),
  day_master: z.string(),
  harmony_index: z.number().min(0).max(1),
});

const MetaInfoSchema = z.object({
  engine_version: z.string(),
  generated_at: z.string().optional(),
});

const Sectors12 = z.array(z.number()).length(12);

const NarrativesSchema = z.object({
  core_summary: z.string(),
  context_summary: z.string(),
  integration_summary: z.string(),
});

// ── Bootstrap ───────────────────────────────────────────────────────
export const BootstrapResponseSchema = z.object({
  profile: ProfileSummarySchema,
  soulprint_sectors: Sectors12,
  narratives: NarrativesSchema,
  signature_blueprint: SignatureBlueprintSchema,
  meta: MetaInfoSchema,
  soulprint_saved: z.boolean().optional(),
});
export type BootstrapResponse = z.infer<typeof BootstrapResponseSchema>;

// ── Signature Delta ─────────────────────────────────────────────────
export const SignatureDeltaResponseSchema = z.object({
  quiz_sectors: Sectors12,
  narratives: NarrativesSchema,
  signature_delta: z.object({
    curvature: z.number(),
    contrast: z.number(),
    density: z.number(),
  }),
  signature_blueprint: SignatureBlueprintSchema,
});
export type SignatureDeltaResponse = z.infer<typeof SignatureDeltaResponseSchema>;

// ── Daily ───────────────────────────────────────────────────────────
const DailyEvidenceSchema = z.object({
  transit_sectors: z.array(z.number().int()).optional(),
  natal_focus: z.array(z.string()).optional(),
  day_master: z.string().optional(),
  daily_pillar: z.object({ stem: z.string(), branch: z.string() }).optional(),
  relation_to_day_master: z.string().optional(),
});

const DailySectionSchema = z.object({
  summary: z.string(),
  themes: z.array(z.string()),
  caution: z.string(),
  opportunity: z.string(),
  evidence: DailyEvidenceSchema,
});

const DailyFusionSchema = z.object({
  summary: z.string(),
  synthesis: z.string(),
  action: z.string(),
  pushworthy: z.boolean(),
  push_text: z.string().optional().nullable(),
  harmony_index: z.number().min(0).max(1),
  day_mode: z.enum(['pulse', 'trace']),
  night_harmony_index: z.number().min(0).max(1).optional(),
  night_mode: z.enum(['pulse', 'trace']).optional(),
});

export const DailyResponseSchema = z.object({
  date: z.string(),
  western: DailySectionSchema,
  eastern: DailySectionSchema,
  fusion: DailyFusionSchema,
  meta: MetaInfoSchema,
});
export type DailyResponse = z.infer<typeof DailyResponseSchema>;