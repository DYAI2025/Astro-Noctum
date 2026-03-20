import { z } from 'zod';

export const JieqiTermSchema = z.object({
  index: z.number(),
  name: z.string(),
  nameDE: z.string(),
  longitude: z.number(),
  approxDate: z.string(),
});

export const JieqiStateSchema = z.object({
  current: JieqiTermSchema,
  next: JieqiTermSchema,
  nextTransitionAt: z.string(),
  secondsToNext: z.number(),
  isTransitionWindow: z.boolean(),
});
