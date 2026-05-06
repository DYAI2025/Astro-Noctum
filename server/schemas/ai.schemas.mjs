import { z } from 'zod';

const limitedString = (max = 5000) =>
  z.string()
    .max(max)
    .transform(s => s.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''));

const limitedObject = z.record(z.string(), z.unknown()).superRefine((obj, ctx) => {
  if (JSON.stringify(obj).length > 10000) {
    ctx.addIssue({
      code: 'custom',
      message: 'Object payload too large (max 10000 chars when serialized)',
    });
  }
});

// /api/interpret — current handler reads { data: object, lang: 'de' | 'en' }
// `data` is a chart payload (BaZi + Western + Wu-Xing merged). Keep shape stable.
export const InterpretSchema = z.object({
  userId: z.string().max(128).optional(),
  lang: z.enum(['de', 'en']).default('de'),
  data: limitedObject,
}).strip();

// /api/analyze/conversation — current handler reads { text: string, lang?: 'de' | 'en' }
export const AnalyzeConversationSchema = z.object({
  userId: z.string().max(128).optional(),
  text: limitedString(5000),
  lang: z.enum(['de', 'en']).default('de'),
}).strip();
