import { z } from 'zod';

export const DayModeSchema = z.enum(['pulse', 'trace', 'spannung']);
export const CouncilKeySchema = z.enum(['sonne','mond','aszendent','day_master','jahrestier','wuxing_dom']);

export const CouncilFigureSchema = z.object({
  key: CouncilKeySchema,
  displayName: z.string(),
  signOrElement: z.string(),
});

export const CopyrightStatusSchema = z.enum(['PD', 'Zitatrecht', 'eigene-Übersetzung', 'lizenziert']);
export const AttributionStatusSchema = z.enum(['verified', 'disputed', 'apocryphal', 'folkloric']);

export const PulseAphorismSchema = z.object({
  id: z.string(),
  text_de: z.string(),
  text_en: z.string(),
  author: z.string(),
  work: z.string().nullable(),
  copyright: CopyrightStatusSchema,
  attribution_status: AttributionStatusSchema,
  mode_tags: z.array(DayModeSchema),
  tone_tags: z.array(z.string()),
  element_affinity: z.array(z.string()),
  figure_affinity: z.array(CouncilKeySchema),
  season_affinity: z.array(z.string()),
});

// ── Wire response shape from GET /api/daily-pulse (Phase D server) ─────────
//
// Phase D returns a *flat* aphorism with slot_1/slot_2/slot_3 strings rather
// than the full curation-side PulseAphorismSchema. slot_2 and slot_3 are
// nullable by design — the no-placeholders directive forbids substituting
// generic text when the LLM router fails. The client must render NOTHING for
// null slots, never a fallback.

export const PulseWireAphorismSchema = z.object({
  id: z.string().nullable(),
  author: z.string().nullable(),
  attribution_status: AttributionStatusSchema.nullable(),
  slot_1: z.string(),
  slot_2: z.string().nullable(),
  slot_3: z.string().nullable(),
});
export type PulseWireAphorism = z.infer<typeof PulseWireAphorismSchema>;

export const DailyPulseResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  date: z.string(),
  locale: z.enum(['de', 'en']),
  mode: DayModeSchema,
  intensity: z.number(),
  harmony_index: z.number(),
  aphorism: PulseWireAphorismSchema,
  council: z.array(CouncilFigureSchema).length(6),
  weather_stale: z.boolean(),
});
export type DailyPulseResponse = z.infer<typeof DailyPulseResponseSchema>;

// ── POST /api/daily-interpretation response ────────────────────────────────
//
// Server returns the persisted row's id + interpretation text. The text is
// always non-empty when status is 200 — server returns 503 with
// AI_UNAVAILABLE when the LLM round trips fail rather than empty text.

export const DailyInterpretationSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
});
export type DailyInterpretation = z.infer<typeof DailyInterpretationSchema>;

// ── Server error envelope (4xx / 5xx) ──────────────────────────────────────
export const DailyPulseErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    retry_after: z.number().optional(),
  }),
});
export type DailyPulseErrorEnvelope = z.infer<typeof DailyPulseErrorEnvelopeSchema>;
