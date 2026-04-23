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
  // Phase H additions — populated from FuFirE events via mapFufireEvent
  description_de: z.string().optional().default(''),
  personal_context: z.string().optional().default(''),
  priority: z.number().optional().default(0),
});

/**
 * Source marker on transit-state + derived payloads.
 *
 * - `live`              — real FuFirE transit response, fully live data
 * - `fallback-profile`  — FuFirE unreachable, ring synthesized from stored
 *                         soulprint + small deterministic drift (not live
 *                         transit, user's natal signature only)
 * - `fallback-neutral`  — neither FuFirE nor Supabase profile available,
 *                         ring is pure neutral (worst case, no user data)
 *
 * The no-placeholder-fake directive requires the UI to distinguish these
 * states visibly rather than presenting fallback data as if it were live.
 */
export const TransitSourceSchema = z.union([
  z.literal('live'),
  z.literal('fallback-profile'),
  z.literal('fallback-neutral'),
]);

export type TransitSource = z.infer<typeof TransitSourceSchema>;

export const TransitMetaSchema = z.object({
  source: TransitSourceSchema,
  reason: z.string().optional(),
});

export type TransitMeta = z.infer<typeof TransitMetaSchema>;

export const TransitStateSchema = z.object({
  ring: z.object({ sectors: TwelveNumbers }),
  soulprint: z.object({ sectors: TwelveNumbers }),
  transit_contribution: z.object({ transit_intensity: z.number() }),
  delta: z.object({
    vs_30day_avg: z.object({ avg_sectors: TwelveNumbers }),
  }),
  events: z.array(TransitEventSchema).default([]),
  resolution: z.number().min(0).max(100).optional(),
  // Defaults to `live` for backward-compat on old cached responses, but
  // current server always sets this explicitly so the UI can trust it.
  // `as const` preserves the string-literal type through TS widening —
  // Zod's .default overload demands `'live' | 'fallback-profile' |
  // 'fallback-neutral'`, a bare `'live'` string widens to `string` on
  // the strict TS config used in CI and breaks the overload match.
  _meta: TransitMetaSchema.optional().default({ source: 'live' as const }),
});

export const FusionSignalDataSchema = z.object({
  targetSignals: z.array(z.number().min(-1).max(2)).length(12),
  baseSignals: z.array(z.number().min(0).max(1)).length(12),
  thirtyDayAvg: z.array(z.number().min(0).max(1)).length(12),
  transitIntensity: z.number().min(0).max(1),
  // Same widening guard as TransitStateSchema._meta — see comment there.
  source: TransitSourceSchema.default('live' as const),
  sourceReason: z.string().optional(),
});

export type TransitState = z.infer<typeof TransitStateSchema>;
export type TransitEvent = z.infer<typeof TransitEventSchema>;
export type FusionSignalData = z.infer<typeof FusionSignalDataSchema>;
