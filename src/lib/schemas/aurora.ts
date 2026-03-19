import { z } from 'zod';

export const AuroraDataSchema = z.object({
  kp: z.number(),
  auroraActive: z.boolean(),
  europeForecast: z.array(z.object({
    lat: z.number(),
    lon: z.number(),
    probability: z.number().min(0).max(100),
  })),
  gfzKp: z.number().nullable(),
  visibilityDE: z.string(),
  updatedAt: z.string(),
});

export type AuroraData = z.infer<typeof AuroraDataSchema>;
