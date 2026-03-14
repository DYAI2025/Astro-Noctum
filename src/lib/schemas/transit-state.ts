import { z } from 'zod';

const TwelveNumbers = z.array(z.number()).length(12);

const TransitEventTypeSchema = z.union([
  z.literal('resonance_jump'),
  z.literal('cluster_complete'),
  z.literal('equilibrium_shift'),
  z.string().min(1),
]);

export const TransitEventSchema = z.object({
  id: z.string().min(1),
  type: TransitEventTypeSchema,
  sector: z.number().int().min(0).max(11),
  delta: z.number().min(-1).max(2),
  trigger_planet: z.string().optional().default(''),
  trigger_symbol: z.string().optional().default(''),
  sector_domain: z.string().optional().default(''),
  timestamp: z.number().optional(),
});

export const TransitStateSchema = z.object({
  ring: z.object({ sectors: TwelveNumbers }),
  soulprint: z.object({ sectors: TwelveNumbers }),
  transit_contribution: z.object({ transit_intensity: z.number() }),
  delta: z.object({
    vs_30day_avg: z.object({ avg_sectors: TwelveNumbers }),
  }),
  events: z.array(TransitEventSchema).default([]),
  resolution: z.number().min(0).max(100).optional(),
});

export const FusionSignalDataSchema = z.object({
  targetSignals: z.array(z.number().min(-1).max(2)).length(12),
  baseSignals: z.array(z.number().min(0).max(1)).length(12),
  thirtyDayAvg: z.array(z.number().min(0).max(1)).length(12),
  transitIntensity: z.number().min(0).max(1),
});

export type TransitState = z.infer<typeof TransitStateSchema>;
export type TransitEvent = z.infer<typeof TransitEventSchema>;
export type FusionSignalData = z.infer<typeof FusionSignalDataSchema>;
