import { z } from 'zod';

// ── ACTIVE_IMPACTS_v1 schema ────────────────────────────────────────────────
// Mirrors the server-side response from POST /api/impact/active.
// Used by useActiveImpacts() hook for runtime validation.

export const ActivePlanetSchema = z.object({
  planet: z.string(),
  strength: z.number().min(0).max(1),
  aspect_type: z.string(),
  orb: z.number().min(0),
  natal_planet: z.string(),
  bazi_resonance: z.string().nullable(),
  wu_xing_element: z.string().nullable(),
});

export const ResonanceBadgeSchema = z.object({
  type: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  intensity: z.string(),
  color: z.string().optional(),
});

export const ActiveImpactsSchema = z.object({
  schema: z.literal('ACTIVE_IMPACTS_v1'),
  date: z.string(),
  harmony_index: z.number().min(0).max(100),
  // Coherence split fields (REQ-F-coherence-hero-impact-datasource)
  base_coherence: z.number().min(0).max(100).optional(),
  positive_daily_delta: z.number().min(0).max(100).optional(),
  displayed_coherence: z.number().min(0).max(100).optional(),
  active_planets: z.array(ActivePlanetSchema),
  resonance_badges: z.array(ResonanceBadgeSchema),
  meta: z.object({
    engine: z.string(),
    solar_pressure_source: z.string().optional(),
    cached: z.boolean().optional(),
  }),
});

export type ActivePlanet = z.infer<typeof ActivePlanetSchema>;
export type ResonanceBadge = z.infer<typeof ResonanceBadgeSchema>;
export type ActiveImpacts = z.infer<typeof ActiveImpactsSchema>;
