/**
 * Fusion Ring Transit State System
 *
 * Handles external transit data (TRANSIT_STATE_v1 schema) and maps it
 * to ring effect triggers with configurable time and intensity.
 *
 * Two data channels:
 *   A) Transit State JSON → temporary effects (8 types) + sector color modulation
 *   B) Quiz Cluster JSON  → permanent base deformation (handled in fusion-ring-profile.ts)
 *
 * Signal formula: S = 0.27·W + 0.27·B + 0.18·X + 0.18·T + 0.10·C
 *   W = Western Astro, B = BaZi, X = WuXing, T = Transit, C = Conversation
 */

// ──────────────────────────────────────────
// TRANSIT_STATE_v1 SCHEMA TYPES
// ──────────────────────────────────────────

export interface TransitRingSectors {
  /** 12 sector deformation values (ring shape modulation from transit) */
  sectors: number[];
}

export interface TransitContribution {
  /** 12 sector energy/color contribution values */
  sectors: number[];
  /** Overall transit intensity 0–1 */
  transit_intensity: number;
}

export type TransitEventType = 'resonance_jump' | 'dominance_shift' | 'moon_event';

export interface TransitEvent {
  /** Event type matching TRANSIT_STATE_v1 */
  type: TransitEventType;
  /** Priority 1–99 (higher = more urgent) */
  priority: number;
  /** Affected sector index 0–11 */
  sector: number;
  /** Planet that triggered the event */
  trigger_planet: string;
  /** German description */
  description_de: string;
  /** Personal context sentence */
  personal_context: string;
}

export interface TransitDelta {
  /** 30-day average sector deltas */
  sectors_30d_avg?: number[];
  /** Overall trend direction */
  trend?: 'rising' | 'falling' | 'stable';
}

export interface TransitStateV1 {
  schema: string; // matches ^TRANSIT_STATE_v\d+$
  generated_at: string;
  ring: TransitRingSectors;
  transit_contribution: TransitContribution;
  delta: TransitDelta;
  events: TransitEvent[];
}

// ──────────────────────────────────────────
// EFFECT TRIGGER TYPES
// ──────────────────────────────────────────

export type RingEffectType =
  | 'resonanzsprung'
  | 'dominanzwechsel'
  | 'mond_event'
  | 'spannungsachse'
  | 'korona_eruption'
  | 'divergenz_spike'
  | 'burst'
  | 'crunch';

export interface EffectTrigger {
  type: RingEffectType;
  /** Duration in seconds (default varies by type) */
  duration: number;
  /** Intensity 0–1 (scales displacement amplitude, color injection, light) */
  intensity: number;
  /** Primary affected sector 0–11 (for sector-specific effects) */
  sector: number;
  /** Optional delay before triggering (seconds) */
  delay: number;
  /** Source description for UI/debug */
  source: string;
}

/** Default durations per effect type */
const DEFAULT_DURATIONS: Record<RingEffectType, number> = {
  resonanzsprung: 4,
  dominanzwechsel: 4,
  mond_event: 4,
  spannungsachse: 4,
  korona_eruption: 4,
  divergenz_spike: 5,
  burst: 3.5,
  crunch: 4.5,
};

// ──────────────────────────────────────────
// EVENT → EFFECT MAPPING
// ──────────────────────────────────────────

/** Maps TRANSIT_STATE_v1 event types to ring effect types */
const EVENT_TYPE_MAP: Record<TransitEventType, RingEffectType> = {
  resonance_jump: 'resonanzsprung',
  dominance_shift: 'dominanzwechsel',
  moon_event: 'mond_event',
};

/**
 * Derives additional computed effects from transit state data.
 * These are effects not directly mapped from events[] but inferred
 * from the overall transit contribution and delta patterns.
 */
function deriveComputedEffects(state: TransitStateV1): EffectTrigger[] {
  const derived: EffectTrigger[] = [];
  const sectors = state.transit_contribution.sectors;
  const intensity = state.transit_contribution.transit_intensity;

  // ── SPANNUNGSACHSE: Opposition tension (sector i vs sector i+6) ──
  for (let i = 0; i < 6; i++) {
    const opposition = Math.abs((sectors[i] ?? 0) - (sectors[i + 6] ?? 0));
    if (opposition > 0.4) {
      derived.push({
        type: 'spannungsachse',
        duration: DEFAULT_DURATIONS.spannungsachse,
        intensity: Math.min(1, opposition * 1.2),
        sector: i,
        delay: derived.length * 5, // stagger
        source: `Opposition S${i}↔S${i + 6}: ${opposition.toFixed(2)}`,
      });
      break; // only strongest opposition
    }
  }

  // ── KORONA_ERUPTION: High transit intensity + peak sector ──
  if (intensity > 0.7) {
    const peakSector = sectors.indexOf(Math.max(...sectors));
    derived.push({
      type: 'korona_eruption',
      duration: DEFAULT_DURATIONS.korona_eruption,
      intensity: Math.min(1, intensity * 1.1),
      sector: peakSector,
      delay: derived.length * 5,
      source: `High transit intensity: ${intensity.toFixed(2)}`,
    });
  }

  // ── DIVERGENZ_SPIKE: Large delta trend ──
  if (state.delta.trend === 'rising' && state.delta.sectors_30d_avg) {
    const maxDelta = Math.max(...state.delta.sectors_30d_avg.map(Math.abs));
    if (maxDelta > 0.3) {
      const spikeIdx = state.delta.sectors_30d_avg
        .map(Math.abs)
        .indexOf(maxDelta);
      derived.push({
        type: 'divergenz_spike',
        duration: DEFAULT_DURATIONS.divergenz_spike,
        intensity: Math.min(1, maxDelta * 2),
        sector: spikeIdx,
        delay: derived.length * 5,
        source: `Delta spike sector ${spikeIdx}: ${maxDelta.toFixed(2)}`,
      });
    }
  }

  // ── BURST: Sudden energy peak (multiple sectors high) ──
  const highSectors = sectors.filter(s => s > 0.6).length;
  if (highSectors >= 4 && intensity > 0.5) {
    derived.push({
      type: 'burst',
      duration: DEFAULT_DURATIONS.burst,
      intensity: Math.min(1, intensity * 0.9),
      sector: sectors.indexOf(Math.max(...sectors)),
      delay: derived.length * 5,
      source: `Energy burst: ${highSectors} sectors > 0.6`,
    });
  }

  // ── CRUNCH: Falling trend + low overall energy ──
  if (state.delta.trend === 'falling' && intensity < 0.3) {
    derived.push({
      type: 'crunch',
      duration: DEFAULT_DURATIONS.crunch,
      intensity: Math.min(1, (1 - intensity) * 0.8),
      sector: sectors.indexOf(Math.min(...sectors)),
      delay: derived.length * 5,
      source: `Energy crunch: falling trend, intensity ${intensity.toFixed(2)}`,
    });
  }

  return derived;
}

// ──────────────────────────────────────────
// MAIN API: parseTransitState
// ──────────────────────────────────────────

export interface ParsedTransitData {
  /** Ordered effect triggers with timing */
  effectQueue: EffectTrigger[];
  /** 12 sector color/energy modulation values (0–1) */
  sectorEnergy: number[];
  /** 12 sector ring deformation offsets */
  sectorDeformation: number[];
  /** Overall transit intensity */
  transitIntensity: number;
  /** Raw state for reference */
  raw: TransitStateV1;
}

/**
 * Parse a TRANSIT_STATE_v1 JSON into effect triggers and sector modulations.
 *
 * @param state - The transit state object
 * @returns Parsed data with effect queue, sector energies, and deformations
 */
export function parseTransitState(state: TransitStateV1): ParsedTransitData {
  // Validate schema
  if (!state.schema || !state.schema.match(/^TRANSIT_STATE_v\d+$/)) {
    console.warn('[FusionTransit] Invalid schema:', state.schema);
  }

  // 1. Map explicit events to effect triggers
  const eventEffects: EffectTrigger[] = state.events
    .sort((a, b) => b.priority - a.priority) // highest priority first
    .slice(0, 50)
    .map((evt, idx) => {
      const effectType = EVENT_TYPE_MAP[evt.type];
      if (!effectType) return null;
      return {
        type: effectType,
        duration: DEFAULT_DURATIONS[effectType],
        intensity: Math.min(1, evt.priority / 80), // normalize priority → intensity
        sector: evt.sector,
        delay: idx * 4, // stagger events 4s apart
        source: `${evt.trigger_planet}: ${evt.description_de.slice(0, 60)}`,
      };
    })
    .filter((x): x is EffectTrigger => x !== null);

  // 2. Derive computed effects from transit patterns
  const computedEffects = deriveComputedEffects(state);

  // 3. Merge and sort by delay
  const allEffects = [...eventEffects, ...computedEffects]
    .sort((a, b) => a.delay - b.delay);

  // Re-stagger delays to prevent overlap
  let nextAvailable = 0;
  for (const eff of allEffects) {
    if (eff.delay < nextAvailable) eff.delay = nextAvailable;
    nextAvailable = eff.delay + eff.duration + 1; // 1s gap between effects
  }

  return {
    effectQueue: allEffects,
    sectorEnergy: state.transit_contribution.sectors.slice(0, 12),
    sectorDeformation: state.ring.sectors.slice(0, 12),
    transitIntensity: state.transit_contribution.transit_intensity,
    raw: state,
  };
}

// ──────────────────────────────────────────
// MANUAL EFFECT TRIGGER (for direct API)
// ──────────────────────────────────────────

/**
 * Create a manual effect trigger with custom time and intensity.
 * Use this when the app wants to fire a specific effect directly.
 */
export function createManualTrigger(
  type: RingEffectType,
  options: {
    intensity?: number;
    duration?: number;
    sector?: number;
    delay?: number;
  } = {}
): EffectTrigger {
  return {
    type,
    intensity: Math.max(0, Math.min(1, options.intensity ?? 0.8)),
    duration: options.duration ?? DEFAULT_DURATIONS[type],
    sector: options.sector ?? 0,
    delay: options.delay ?? 0,
    source: 'manual',
  };
}

// ──────────────────────────────────────────
// DEMO TRANSIT STATE
// ──────────────────────────────────────────

export function createDemoTransitState(): TransitStateV1 {
  return {
    schema: 'TRANSIT_STATE_v1',
    generated_at: new Date().toISOString(),
    ring: {
      sectors: [0.1, 0.05, -0.1, 0.2, -0.05, 0.15, -0.2, 0.3, 0.1, -0.1, 0.05, -0.15],
    },
    transit_contribution: {
      sectors: [0.4, 0.3, 0.6, 0.2, 0.8, 0.5, 0.3, 0.9, 0.4, 0.6, 0.7, 0.2],
      transit_intensity: 0.75,
    },
    delta: {
      sectors_30d_avg: [0.05, -0.02, 0.1, -0.08, 0.15, 0.03, -0.1, 0.35, 0.02, 0.08, -0.05, 0.01],
      trend: 'rising',
    },
    events: [
      {
        type: 'resonance_jump',
        priority: 72,
        sector: 7,
        trigger_planet: 'Pluto',
        description_de: 'Pluto-Transit durch Sektor 7 (Skorpion) erzeugt Tiefenresonanz',
        personal_context: 'Dein Skorpion-Aszendent verstärkt diesen Transit dreifach',
      },
      {
        type: 'dominance_shift',
        priority: 55,
        sector: 4,
        trigger_planet: 'Jupiter',
        description_de: 'Jupiter wechselt Dominanz in Löwe-Sektor',
        personal_context: 'Dein Feuer-Element reagiert stark auf Jupiter-Energie',
      },
      {
        type: 'moon_event',
        priority: 40,
        sector: 11,
        trigger_planet: 'Mond',
        description_de: 'Vollmond in Fische aktiviert Intuitions-Sektor',
        personal_context: 'Wasser-Dominanz in deinem Chart harmoniert mit Fische-Mond',
      },
    ],
  };
}
