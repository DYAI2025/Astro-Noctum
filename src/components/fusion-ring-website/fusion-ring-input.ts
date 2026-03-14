/**
 * Fusion Ring Input Controller
 *
 * Unified input system that manages all data channels flowing into the ring:
 *
 * Channel A: Transit State JSON → temporary effects (8 types) with time + intensity
 * Channel B: Quiz Cluster JSON  → permanent base deformation stamps
 * Channel C: Conversation Layer  → ambient coloring (factor C=0.10 in signal formula)
 *
 * Signal formula: S = 0.27·W + 0.27·B + 0.18·X + 0.18·T + 0.10·C
 *
 * The controller maintains an effect queue and processes it over time,
 * firing effects one by one with proper spacing.
 */

import {
  TransitStateV1,
  ParsedTransitData,
  parseTransitState,
  EffectTrigger,
  RingEffectType,
  createManualTrigger,
} from './fusion-ring-transit';
import {
  FusionRingProfile,
  DeformationStamp,
  DeformationType,
} from './fusion-ring-profile';

// ──────────────────────────────────────────
// QUIZ CLUSTER INPUT TYPES
// ──────────────────────────────────────────

/** QuissMe zone types */
export type QuissZone = 'flow' | 'spark' | 'talk';

/** A single facette result from a completed quiz */
export interface QuizFacetteResult {
  /** Facette label (e.g. "Humor", "Ritual", "Direktheit") */
  facet_label: string;
  /** Which zone this facette landed in */
  zone: QuissZone;
  /** Strength of the zone assignment (0–1) */
  zone_strength: number;
  /** Which ring sector this facette maps to (0–11) */
  sector_index: number;
}

/** A completed quiz cluster result */
export interface QuizClusterResult {
  /** Unique cluster identifier */
  cluster_id: string;
  /** Quiz world label (e.g. "Filme", "Werte", "Bindung") */
  quiz_world: string;
  /** Individual facette results */
  facettes: QuizFacetteResult[];
  /** Timestamp of completion */
  completed_at: string;
}

// ──────────────────────────────────────────
// CONVERSATION LAYER (Levi Sessions)
// ──────────────────────────────────────────

/** Ambient conversation profile from Levi transcript analysis */
export interface ConversationProfile {
  /** Per-sector ambient color shift (0–1) */
  sector_warmth: number[];
  /** Overall conversation engagement level (0–1) */
  engagement: number;
  /** Dominant emotional tone */
  tone: 'warm' | 'analytical' | 'playful' | 'intense' | 'neutral';
  /** Session count contributing to this profile */
  session_count: number;
  /** Total minutes of conversation */
  total_minutes: number;
}

/** Accumulation bucket for Levi sessions */
export interface AccumulationBucket {
  /** Current marker frequency deltas per sector */
  marker_deltas: number[];
  /** Sessions counted since last ContributionEvent */
  sessions_since_last: number;
  /** Minutes since last ContributionEvent */
  minutes_since_last: number;
  /** Threshold: sessions needed to trigger ContributionEvent */
  session_threshold: number;
  /** Threshold: minutes needed to trigger ContributionEvent */
  minute_threshold: number;
}

// ──────────────────────────────────────────
// SIGNAL FORMULA WEIGHTS
// ──────────────────────────────────────────

export const SIGNAL_WEIGHTS = {
  W: 0.27,  // Western Astro
  B: 0.27,  // BaZi
  X: 0.18,  // WuXing
  T: 0.18,  // Transit
  C: 0.10,  // Conversation
} as const;

// ──────────────────────────────────────────
// ZONE → DEFORMATION MAPPING
// ──────────────────────────────────────────

const ZONE_DEFORMATION_MAP: Record<QuissZone, { type: DeformationType; magnitudeScale: number }> = {
  flow:  { type: 'bulge',  magnitudeScale: 1.0 },   // Flow → outward expansion (strength)
  spark: { type: 'ridge',  magnitudeScale: 0.8 },   // Spark → sharp raised line (exciting contrast)
  talk:  { type: 'dent',   magnitudeScale: 0.6 },   // Talk → inward compression (needs work)
};

/** Zone color tints */
const ZONE_COLOR_TINTS: Record<QuissZone, [number, number, number]> = {
  flow:  [0.2, 0.9, 0.5],   // green-cyan
  spark: [1.0, 0.5, 0.2],   // amber-orange
  talk:  [0.5, 0.3, 0.9],   // purple
};

// ──────────────────────────────────────────
// INPUT CONTROLLER STATE
// ──────────────────────────────────────────

export interface InputControllerState {
  /** Current transit data (if any) */
  currentTransit: ParsedTransitData | null;
  /** Effect queue (ordered, with timing) */
  effectQueue: EffectTrigger[];
  /** Currently playing effect index in queue */
  queueIndex: number;
  /** Time when current queue started playing */
  queueStartTime: number;
  /** Current conversation profile */
  conversationProfile: ConversationProfile | null;
  /** Accumulation bucket for Levi sessions */
  accumulationBucket: AccumulationBucket;
  /** Transit sector energy overlay (12 values, 0–1) */
  transitSectorEnergy: number[];
  /** Transit sector deformation overlay (12 values) */
  transitSectorDeformation: number[];
}

// ──────────────────────────────────────────
// INPUT CONTROLLER
// ──────────────────────────────────────────

export class FusionRingInputController {
  private state: InputControllerState;
  private profile: FusionRingProfile;
  private onEffect: ((trigger: EffectTrigger) => void) | null = null;
  private onProfileUpdate: ((profile: FusionRingProfile) => void) | null = null;
  private queueTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(profile: FusionRingProfile) {
    this.profile = profile;
    this.state = {
      currentTransit: null,
      effectQueue: [],
      queueIndex: 0,
      queueStartTime: 0,
      conversationProfile: null,
      accumulationBucket: {
        marker_deltas: new Array(12).fill(0),
        sessions_since_last: 0,
        minutes_since_last: 0,
        session_threshold: 5,   // 5 sessions = 1 ContributionEvent
        minute_threshold: 30,   // or 30 minutes
      },
      transitSectorEnergy: new Array(12).fill(0),
      transitSectorDeformation: new Array(12).fill(0),
    };
  }

  // ── CALLBACKS ──

  /** Register callback for when an effect should fire */
  onEffectTrigger(cb: (trigger: EffectTrigger) => void) {
    this.onEffect = cb;
  }

  /** Register callback for when profile is updated (quiz/conversation contribution) */
  onProfileChanged(cb: (profile: FusionRingProfile) => void) {
    this.onProfileUpdate = cb;
  }

  // ── CHANNEL A: TRANSIT STATE ──

  /**
   * Ingest a TRANSIT_STATE_v1 JSON.
   * Parses events into effect triggers and starts the queue.
   * Also updates sector energy/deformation overlays.
   */
  ingestTransitState(state: TransitStateV1) {
    const parsed = parseTransitState(state);
    this.state.currentTransit = parsed;
    this.state.transitSectorEnergy = parsed.sectorEnergy;
    this.state.transitSectorDeformation = parsed.sectorDeformation;

    // Start effect queue
    this.state.effectQueue = parsed.effectQueue;
    this.state.queueIndex = 0;
    this.state.queueStartTime = Date.now();

    this.processQueue();
  }

  /**
   * Manually trigger a specific effect with custom parameters.
   */
  triggerManualEffect(
    type: RingEffectType,
    options?: { intensity?: number; duration?: number; sector?: number }
  ) {
    const trigger = createManualTrigger(type, options);
    if (this.onEffect) this.onEffect(trigger);
  }

  /** Process the effect queue — fires effects at their scheduled delays */
  private processQueue() {
    if (this.queueTimer) clearTimeout(this.queueTimer);
    const queue = this.state.effectQueue;
    const idx = this.state.queueIndex;

    if (idx >= queue.length) return; // queue exhausted

    const trigger = queue[idx];
    const elapsed = (Date.now() - this.state.queueStartTime) / 1000;
    const waitTime = Math.max(0, trigger.delay - elapsed);

    this.queueTimer = setTimeout(() => {
      if (this.onEffect) this.onEffect(trigger);
      this.state.queueIndex++;
      this.processQueue();
    }, waitTime * 1000);
  }

  // ── CHANNEL B: QUIZ CLUSTER ──

  /**
   * Ingest a completed quiz cluster result.
   * Maps facettes to deformation stamps and adds them to the profile.
   */
  ingestQuizCluster(result: QuizClusterResult) {
    const newStamps: DeformationStamp[] = result.facettes.map(facette => {
      const mapping = ZONE_DEFORMATION_MAP[facette.zone];
      return {
        sectorIndex: facette.sector_index,
        type: mapping.type,
        magnitude: facette.zone_strength * mapping.magnitudeScale * 0.3, // scale down for accumulation
        spread: 1.0,
        colorTint: ZONE_COLOR_TINTS[facette.zone],
        sourceQuiz: result.cluster_id,
        timestamp: Date.now(),
      };
    });

    // Accumulate stamps (never replace)
    this.profile.quizStamps = [...this.profile.quizStamps, ...newStamps];

    if (this.onProfileUpdate) this.onProfileUpdate(this.profile);
  }

  // ── CHANNEL C: CONVERSATION LAYER (Levi Sessions) ──

  /**
   * Update the ambient conversation profile.
   * This is the immediate, low-weight layer (C=0.10 in signal formula).
   * Subtle color shift without structural deformation.
   */
  updateConversationProfile(profile: ConversationProfile) {
    this.state.conversationProfile = profile;
  }

  /**
   * Record a Levi session into the accumulation bucket.
   * When the bucket tips (N sessions or X minutes), a ContributionEvent fires.
   *
   * @param markerDeltas - 12 sector marker frequency deltas from LeanDeep
   * @param sessionMinutes - Duration of this session in minutes
   * @returns true if a ContributionEvent was fired
   */
  recordLeviSession(markerDeltas: number[], sessionMinutes: number): boolean {
    const bucket = this.state.accumulationBucket;

    // Accumulate
    for (let i = 0; i < 12; i++) {
      bucket.marker_deltas[i] += (markerDeltas[i] ?? 0);
    }
    bucket.sessions_since_last++;
    bucket.minutes_since_last += sessionMinutes;

    // Check if bucket tips
    const tipped =
      bucket.sessions_since_last >= bucket.session_threshold ||
      bucket.minutes_since_last >= bucket.minute_threshold;

    if (tipped) {
      this.fireContributionEvent(bucket);
      // Reset bucket
      bucket.marker_deltas = new Array(12).fill(0);
      bucket.sessions_since_last = 0;
      bucket.minutes_since_last = 0;
      return true;
    }

    return false;
  }

  /** Fire a ContributionEvent from accumulated Levi sessions */
  private fireContributionEvent(bucket: AccumulationBucket) {
    // Convert accumulated marker deltas into deformation stamps
    // Positive deltas → bulge, negative → dent
    const stamps: DeformationStamp[] = [];

    for (let i = 0; i < 12; i++) {
      const delta = bucket.marker_deltas[i];
      if (Math.abs(delta) < 0.05) continue; // too small to matter

      stamps.push({
        sectorIndex: i,
        type: delta > 0 ? 'bulge' : 'dent',
        magnitude: Math.min(0.15, Math.abs(delta) * 0.1), // conservative scaling
        spread: 1.2,
        sourceQuiz: `levi-contribution-${Date.now()}`,
        timestamp: Date.now(),
      });
    }

    if (stamps.length > 0) {
      this.profile.quizStamps = [...this.profile.quizStamps, ...stamps];
      if (this.onProfileUpdate) this.onProfileUpdate(this.profile);
    }
  }

  // ── GETTERS ──

  getState(): InputControllerState { return this.state; }
  getProfile(): FusionRingProfile { return this.profile; }
  getTransitSectorEnergy(): number[] { return this.state.transitSectorEnergy; }
  getTransitSectorDeformation(): number[] { return this.state.transitSectorDeformation; }
  getConversationProfile(): ConversationProfile | null { return this.state.conversationProfile; }

  /** Get the ambient color contribution from conversation layer */
  getAmbientColorShift(): number[] {
    const cp = this.state.conversationProfile;
    if (!cp) return new Array(12).fill(0);

    // Scale by C weight (0.10) and engagement
    return cp.sector_warmth.map(w => w * SIGNAL_WEIGHTS.C * cp.engagement);
  }

  // ── CLEANUP ──

  destroy() {
    if (this.queueTimer) clearTimeout(this.queueTimer);
    this.onEffect = null;
    this.onProfileUpdate = null;
  }
}
