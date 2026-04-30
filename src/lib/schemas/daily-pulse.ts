import { z } from 'zod';

export const DayModeSchema = z.enum(['pulse', 'trace', 'spannung']);
export const CouncilKeySchema = z.enum(['sonne','mond','aszendent','day_master','jahrestier','wuxing_dom']);

export const CouncilFigureSchema = z.object({
  key: CouncilKeySchema,
  displayName: z.string(),
  signOrElement: z.string(),
});

export const PulseAphorismSchema = z.object({
  id: z.string(),
  text_de: z.string(),
  text_en: z.string(),
  author: z.string(),
  work: z.string().nullable(),
  copyright: z.string(),
  attribution_status: z.string(),
  mode_tags: z.array(DayModeSchema),
  tone_tags: z.array(z.string()),
  element_affinity: z.array(z.string()),
  figure_affinity: z.array(CouncilKeySchema),
  season_affinity: z.array(z.string()),
});

export const DailyPulseResponseSchema = z.object({
  date: z.string(),
  locale: z.enum(['de','en']),
  userId: z.string(),
  pulseId: z.string(),
  harmonyIndex: z.number().min(0).max(1),
  intensity: z.number().min(0).max(1),
  mode: DayModeSchema,
  cosmicWeatherSummary: z.string(),
  aphorism: PulseAphorismSchema,
  slot2: z.string(),
  slot3: z.string(),
  council: z.array(CouncilFigureSchema).length(6),
  selectedArchetype: z.null(),
  phase: z.literal('pulse'),
});
export type DailyPulseResponse = z.infer<typeof DailyPulseResponseSchema>;

export const DailyInterpretationResponseSchema = z.object({
  pulseId: z.string(),
  selectedArchetype: CouncilFigureSchema,
  dailyInterpretation: z.string(),
  usedMode: DayModeSchema,
  usedAphorismId: z.string(),
  phase: z.literal('interpretation'),
});
export type DailyInterpretationResponse = z.infer<typeof DailyInterpretationResponseSchema>;
