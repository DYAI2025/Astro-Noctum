/**
 * Quiz Generator Pipeline Types — derived from quiz-generator-schema-v1.md
 *
 * These types define the contract for the deterministic quiz generator that
 * transforms a QuizGeneratorInput into a complete GeneratedQuiz with all
 * integration artifacts (QuizDefinition, AFFINITY_MAP entries, event converter,
 * result profiles).
 *
 * Flow: QuizGeneratorInput → generator → GeneratedQuiz
 *       GeneratedQuiz.definition feeds scoreQuiz()
 *       GeneratedQuiz.affinityMapEntries merge into AFFINITY_MAP
 *       GeneratedQuiz.eventConverter registers in quiz-to-event.ts
 */

// Re-export the existing QuizDefinition — single source of truth
export type { QuizDefinition } from '../quizzes/schema';

// ─────────────────────────────────────────────────────────────
// Literal union types
// ─────────────────────────────────────────────────────────────

export type MarkerDomain =
  | 'love'
  | 'social'
  | 'instinct'
  | 'cognition'
  | 'leadership'
  | 'freedom'
  | 'spiritual'
  | 'eq'
  | 'values'
  | 'shadow'
  | 'intimacy'
  | 'routine';

export type ZodiacSectorIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type SignaturDimension =
  | 'assertion'   // 0°  Mars    — Durchsetzung ↔ Hingabe
  | 'empathy'     // 60° Moon    — Einfühlung   ↔ Abgrenzung
  | 'creativity'  // 120° Sun    — Schöpfung    ↔ Struktur
  | 'logic'       // 180° Mercury — Analyse      ↔ Synthese
  | 'intuition'   // 240° Jupiter — Ahnung       ↔ Evidenz
  | 'discipline'; // 300° Saturn  — Ordnung      ↔ Freiheit

export type MasterSignalDimension =
  | 'passion'     // Expressivity, desire, initiative, energy
  | 'stability'   // Continuity, grounding, reliability, structure
  | 'future'      // Growth orientation, vision, possibility
  | 'connection'  // Relational depth, intimacy, belonging
  | 'autonomy';   // Self-direction, independence, individuation

// ─────────────────────────────────────────────────────────────
// Localized text helper
// ─────────────────────────────────────────────────────────────

export interface LocalizedText {
  'de-DE': string;
  'en-US': string;
}

// ─────────────────────────────────────────────────────────────
// Section 1: Generator Input
// ─────────────────────────────────────────────────────────────

export interface QuizGeneratorInput {
  /** Internal topic identifier, e.g. "shadow_archetype" */
  topic: string;

  /**
   * The psychological pattern to uncover — never shown to user.
   * e.g. "Primary shadow archetype — the disowned self"
   */
  targetPattern: string;

  /** Pattern category for clustering and aggregation */
  patternCategory:
    | 'shadow'
    | 'love'
    | 'relationship'
    | 'routine'
    | 'spiritual'
    | 'personality';

  /** Narrative tone for scenarios and results */
  tone: 'playful' | 'mysterious' | 'intimate' | 'provocative' | 'reflective';

  /**
   * Hidden scoring dimensions (2-6).
   * Each dimension maps to marker domains, zodiac sectors, Wu Xing elements,
   * and the 6 bipolar Signatur dimensions.
   */
  dimensions: DimensionSpec[];

  /** Number of scenario questions (default: 8) */
  questionCount?: number;

  /**
   * Cluster assignment — which of the 6 clusters this quiz belongs to.
   * Determines the cluster completion gate behavior.
   */
  cluster: ClusterAssignment;

  /** Scoring model to use */
  scoringModel: 'multi-dimension' | 'profile-driven';

  /** Locale for result texts */
  locale: 'de-DE' | 'en-US';
}

export interface DimensionSpec {
  /** Internal key, e.g. "destroyer" */
  key: string;

  /** Internal label shown in admin/debug, e.g. "The Destroyer" */
  label: string;

  /** What this dimension reveals psychologically */
  description: string;

  /**
   * Marker domain for ContributionEvent output.
   * Must be one of the recognized domains in quiz-to-event converters.
   */
  markerDomain: MarkerDomain;

  /**
   * Marker keywords that this dimension produces.
   * These MUST have corresponding AFFINITY_MAP entries.
   */
  markerKeywords: string[];

  /** Mapping to the Bazodiac fusion system */
  fusionMapping: {
    /** Wu Xing element affinity */
    wuxingElement: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

    /** Primary zodiac sector affinity (0-11) */
    primarySector: ZodiacSectorIndex;

    /** Secondary zodiac sector affinity (0-11) */
    secondarySector?: ZodiacSectorIndex;

    /**
     * Which of the 6 bipolar Signatur V3 dimensions this primarily affects.
     * Maps to pole radius modulation.
     */
    signaturDimension: SignaturDimension;

    /**
     * Which of the 5D Master Signal dimensions this primarily affects.
     * Maps to master_vector projection.
     */
    masterSignalDimension: MasterSignalDimension;
  };
}

export interface ClusterAssignment {
  /** Cluster ID from clusters.ts */
  clusterId: string;
  /** Whether this quiz is premium-gated */
  isPremium: boolean;
  /** Position within the cluster (for ordering) */
  orderIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Section 2: Generated Output
// ─────────────────────────────────────────────────────────────

import type { QuizDefinition } from '../quizzes/schema';

/**
 * Complete generator output — all artifacts needed to wire a new quiz
 * into the Bazodiac fusion system.
 */
export interface GeneratedQuiz {
  /** The full QuizDefinition for scoreQuiz() */
  definition: QuizDefinition;

  /** Result profiles with narrative texts (QuissMe-aligned) */
  resultProfiles: ResultProfile[];

  /**
   * AFFINITY_MAP entries for all new marker keywords.
   * Must be merged into src/lib/fusion-ring/affinity-map.ts
   */
  affinityMapEntries: AffinityMapEntry[];

  /**
   * Quiz-to-event converter specification.
   * Must be registered in src/lib/fusion-ring/quiz-to-event.ts
   */
  eventConverter: EventConverterSpec;

  /** Aggregation rules for long-term profile building */
  aggregation: AggregationRules;
}

// ─────────────────────────────────────────────────────────────
// Section 3: Result Profiles
// ─────────────────────────────────────────────────────────────

/**
 * Result profiles follow QuissMe AI Mapping Lexicon rules:
 * - NEVER diagnostic ("you are X", "disorder", "toxic")
 * - ALWAYS possibility-oriented ("can", "sometimes", "might")
 * - Poetic, reflective, warm — a mirror, not a verdict
 */
export interface ResultProfile {
  id: string;

  /** Poetic archetype name — NOT the clinical dimension label */
  name: LocalizedText;

  subtitle: LocalizedText;

  /** 2-3 sentences. Reflective, not clinical. QuissMe guardrails apply. */
  description: LocalizedText;

  /**
   * Deeper insight. V1: shown immediately.
   * V2+: revealed gradually over time (longitudinal discovery).
   */
  shadowInsight: LocalizedText;

  fusionMapping: {
    element: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
    zodiacAffinity: string[];
    ringPosition: ZodiacSectorIndex;
    signaturDimension: SignaturDimension;
    masterSignalDimension: MasterSignalDimension;
  };

  visual: {
    color: string;
    symbol: string;
    coustoHz?: number;
  };

  /**
   * QuissMe zone logic: how result maps against natal signal.
   * flow = confirms natal, spark = complementary tension, talk = divergence
   */
  zoneLogic: {
    flowCondition: string;
    sparkCondition: string;
    talkCondition: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Section 4: Affinity Map Entries
// ─────────────────────────────────────────────────────────────

/**
 * Each new marker keyword needs an entry in AFFINITY_MAP.
 * 12-element tuple: [Ari, Tau, Gem, Can, Leo, Vir, Lib, Sco, Sag, Cap, Aqu, Pis]
 */
export interface AffinityMapEntry {
  keyword: string;
  sectorWeights: [
    number, number, number, number, number, number,
    number, number, number, number, number, number,
  ];
  domain: MarkerDomain;
  rationale: string;
}

// ─────────────────────────────────────────────────────────────
// Section 5: Event Converter Spec
// ─────────────────────────────────────────────────────────────

/**
 * Specifies how quiz results convert to ContributionEvents.
 * Must be registered in src/lib/fusion-ring/quiz-to-event.ts
 */
export interface EventConverterSpec {
  functionName: string;
  moduleId: string;

  dimensionToMarkers: {
    dimensionKey: string;
    markers: {
      id: string;
      weightFormula: string;
    }[];
  }[];

  archetypeTags?: {
    profileId: string;
    tagId: string;
    weight: number;
  }[];
}

// ─────────────────────────────────────────────────────────────
// Section 6: Aggregation Rules
// ─────────────────────────────────────────────────────────────

export interface AggregationRules {
  contributesTo: string[];

  /**
   * Share of the 0.30 quiz allocation in Master Signal.
   * e.g. weight 0.15 = 0.15 x 0.30 = 0.045 Master Signal contribution
   */
  weight: number;

  decay: 'none' | 'slow' | 'fast';
  recurrence: 'once' | 'monthly' | 'seasonal';

  /** True-North: Quiz modulation max 50% from natal weight */
  maxNatalDeviation: 0.5;
}

// ─────────────────────────────────────────────────────────────
// Section 7: Constants & Reference Tables
// ─────────────────────────────────────────────────────────────

export const ZODIAC_SECTORS = [
  { index: 0 as const,  sign: 'Aries',       element: 'Wood',  opposition: 6 as const  },
  { index: 1 as const,  sign: 'Taurus',      element: 'Earth', opposition: 7 as const  },
  { index: 2 as const,  sign: 'Gemini',      element: 'Fire',  opposition: 8 as const  },
  { index: 3 as const,  sign: 'Cancer',      element: 'Fire',  opposition: 9 as const  },
  { index: 4 as const,  sign: 'Leo',         element: 'Fire',  opposition: 10 as const },
  { index: 5 as const,  sign: 'Virgo',       element: 'Metal', opposition: 11 as const },
  { index: 6 as const,  sign: 'Libra',       element: 'Metal', opposition: 0 as const  },
  { index: 7 as const,  sign: 'Scorpio',     element: 'Water', opposition: 1 as const  },
  { index: 8 as const,  sign: 'Sagittarius', element: 'Water', opposition: 2 as const  },
  { index: 9 as const,  sign: 'Capricorn',   element: 'Water', opposition: 3 as const  },
  { index: 10 as const, sign: 'Aquarius',    element: 'Earth', opposition: 4 as const  },
  { index: 11 as const, sign: 'Pisces',      element: 'Wood',  opposition: 5 as const  },
] as const;

export const SIGNATUR_DIMENSIONS = {
  assertion:  { angle: 0,   planet: 'Mars',    hz: 144.72, polA: 'Durchsetzung', polB: 'Hingabe'    },
  empathy:    { angle: 60,  planet: 'Moon',    hz: 210.42, polA: 'Einfühlung',   polB: 'Abgrenzung' },
  creativity: { angle: 120, planet: 'Sun',     hz: 126.22, polA: 'Schöpfung',    polB: 'Struktur'   },
  logic:      { angle: 180, planet: 'Mercury', hz: 141.27, polA: 'Analyse',      polB: 'Synthese'   },
  intuition:  { angle: 240, planet: 'Jupiter', hz: 183.58, polA: 'Ahnung',       polB: 'Evidenz'    },
  discipline: { angle: 300, planet: 'Saturn',  hz: 147.85, polA: 'Ordnung',      polB: 'Freiheit'   },
} as const;

export const MASTER_SIGNAL_DIMENSIONS = {
  passion:    'Expressivity, desire, initiative, energy',
  stability:  'Continuity, grounding, reliability, structure',
  future:     'Growth orientation, vision, possibility',
  connection: 'Relational depth, intimacy, belonging',
  autonomy:   'Self-direction, independence, individuation',
} as const;

export const FUSION_WEIGHTS = {
  natal:          0.35,
  quiz:           0.30,
  gcb:            0.20,
  alignmentBoost: 0.15,
} as const;
