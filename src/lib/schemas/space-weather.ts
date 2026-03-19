import { z } from 'zod';

export const KpForecastSchema = z.object({
  timestamp: z.string(),
  kp: z.number().min(0).max(9),
  noaaScale: z.string(),
});

export const SpaceWeatherContributionSchema = z.object({
  schema: z.literal('sp.contribution.v1'),
  event_id: z.string(),
  type: z.enum(['cme_arrival', 'flare', 'geomagnetic_storm', 'sep', 'hss', 'alert']),
  severity: z.string(),
  signature_weight: z.number().min(0).max(0.5),
  source_event_id: z.string().optional(),
  started_at: z.string(),
  expires_at: z.string(),
  description: z.string().optional(),
});

export const SpaceWeatherExtendedSchema = z.object({
  current: z.object({
    kp: z.number().min(0).max(9),
    kpForecast3h: z.array(KpForecastSchema).default([]),
    xrayFlux: z.number().default(0),
    xrayClass: z.string().default('A'),
    protonFlux: z.number().default(0),
  }),
  events: z.array(SpaceWeatherContributionSchema).default([]),
  alerts: z.array(z.string()).default([]),
  epoch: z.object({
    sunspotNumber: z.number().default(0),
    f107: z.number().default(0),
    solarCyclePhase: z.string().default('ascending'),
  }),
  meta: z.object({
    fetchedAt: z.string(),
    noaaVersion: z.enum(['v1', 'v2']),
    cacheTtlSeconds: z.number(),
  }),
});

export type SpaceWeatherExtended = z.infer<typeof SpaceWeatherExtendedSchema>;
