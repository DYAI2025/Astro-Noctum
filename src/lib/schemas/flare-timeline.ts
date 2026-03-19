import { z } from 'zod';

export const TimelineEventSchema = z.object({
  id: z.string(),
  type: z.enum(['flare', 'cme', 'cme_arrival', 'kp_peak', 'sep']),
  timestamp: z.string(),
  label: z.string(),
  intensity: z.number().min(0).max(1),
  details: z.string().optional(),
});

export const XrayCurvePointSchema = z.object({
  timestamp: z.string(),
  flux: z.number(),
});

export const KpBarSchema = z.object({
  timestamp: z.string(),
  kp: z.number(),
  noaaScale: z.string(),
});

export const FlareTimelineSchema = z.object({
  xrayCurve: z.array(XrayCurvePointSchema),
  kpBars: z.array(KpBarSchema),
  events: z.array(TimelineEventSchema),
  enlilWindow: z.object({
    startAt: z.string().nullable(),
    endAt: z.string().nullable(),
  }).nullable(),
});

export type FlareTimeline = z.infer<typeof FlareTimelineSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
