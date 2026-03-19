import { z } from 'zod';

export const NeoObjectSchema = z.object({
  designation: z.string(),
  name: z.string().nullable(),
  closeApproachDate: z.string(),
  distanceKm: z.number(),
  distanceEarthRadii: z.number(),
  velocityKmS: z.number(),
  estimatedDiameterM: z.number(),
  isPotentiallyHazardous: z.boolean(),
});

export const NeoResponseSchema = z.object({
  objects: z.array(NeoObjectSchema),
  fetchedAt: z.string(),
});

export type NeoObject = z.infer<typeof NeoObjectSchema>;
