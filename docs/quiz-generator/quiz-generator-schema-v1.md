*
 * BAZODIAC QUIZ GENERATOR SCHEMA v1.0
 * 
 * Reusable template for generating psychological pattern quizzes
 * that surface hidden behavioral patterns through scenario-based questions.
 * 
 * Output: QuizDefinition compatible with scoreQuiz() pipeline
 * Flow:  QuizDefinition → scoreQuiz() → ContributionEvent → AFFINITY_MAP → 12 sectors → Signatur
 * 
 * Architecture alignment:
 *   - 12-sector zodiac mapping via AFFINITY_MAP (→ Signatur V3)
 *   - 5D Master Signal projection via quiz-projection.ts (→ Master Signal Engine)
 *   - 6 bipolar dimensions via quizSectorsToQuizWeights() (→ V3 pole radii)
 *   - QuissMe AI Mapping Lexicon for result narratives (Flow/Spark/Talk)
 */

// ─────────────────────────────────────────────────────────────
// SECTION 1: GENERATOR INPUT — What you provide to create a quiz
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
  patternCategory: 'shadow' | 'love' | 'relationship' | 'routine' | 'spiritual' | 'personality';

  /** Narrative tone for scenarios and results */
  tone: 'playful' | 'mysterious' | 'intimate' | 'provocative' | 'reflective';

  /** 
   * Hidden scoring dimensions (2–6). 
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

export type MarkerDomain = 
  | 'love' | 'social' | 'instinct' | 'cognition' 
  | 'leadership' | 'freedom' | 'spiritual' | 'eq' 
  | 'values' | 'shadow' | 'intimacy' | 'routine';

export type ZodiacSectorIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
// 0=Aries, 1=Taurus, 2=Gemini, 3=Cancer, 4=Leo, 5=Virgo
// 6=Libra, 7=Scorpio, 8=Sagittarius, 9=Capricorn, 10=Aquarius, 11=Pisces

export type SignaturDimension = 
  | 'assertion'   // 0° Mars — Durchsetzung ↔ Hingabe
  | 'empathy'     // 60° Mond — Einfühlung ↔ Abgrenzung
  | 'creativity'  // 120° Sonne — Schöpfung ↔ Struktur
  | 'logic'       // 180° Merkur — Analyse ↔ Synthese
  | 'intuition'   // 240° Jupiter — Ahnung ↔ Evidenz
  | 'discipline'; // 300° Saturn — Ordnung ↔ Freiheit

export type MasterSignalDimension = 
  | 'passion'     // Expressivity, desire, initiative, energy
  | 'stability'   // Continuity, grounding, reliability, structure
  | 'future'      // Growth orientation, vision, possibility
  | 'connection'  // Relational depth, intimacy, belonging
  | 'autonomy';   // Self-direction, independence, individuation

export interface ClusterAssignment {
  /** Cluster ID from clusters.ts */
  clusterId: string;
  /** Whether this quiz is premium-gated */
  isPremium: boolean;
  /** Position within the cluster (for ordering) */
  orderIndex: number;
}

// ─────────────────────────────────────────────────────────────
// SECTION 2: GENERATED OUTPUT — What the generator produces
// ─────────────────────────────────────────────────────────────

/**
 * Complete quiz definition compatible with the existing QuizDefinition schema
 * in packages/shared/src/quizzes/schema.ts
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
   * Quiz-to-event converter function.
   * Must be registered in src/lib/fusion-ring/quiz-to-event.ts
   */
  eventConverter: EventConverterSpec;

  /** Aggregation rules for long-term profile building */
  aggregation: AggregationRules;
}

/** 
 * Matches the existing QuizDefinition schema.
 * Questions use scenarios — never direct self-assessment.
 */
export interface QuizDefinition {
  id: string;
  version: string;
  title: LocalizedText;
  description: LocalizedText;
  scoringModel: 'multi-dimension' | 'profile-driven';
  
  /** Hidden dimensions — user never sees these */
  dimensions?: DimensionDef[];
  
  /** Scenario-based questions */
  questions: Question[];
  
  /** Profile definitions for profile-driven scoring */
  profiles?: ProfileDef[];
  
  /** Threshold rules for multi-dimension scoring */
  thresholds?: ThresholdRule[];

  /** Metadata for UI display */
  meta: {
    icon: string;
    estimatedMinutes: number;
    patternCategory: string;
    tone: string;
    premium: boolean;
  };
}

export interface DimensionDef {
  key: string;
  label: string;
  description: string;
}

export interface Question {
  id: string;
  
  /** 
   * A vivid, emotionally charged situation.
   * RULE: Always a scenario, never "rate yourself on X".
   * Should evoke an emotional response before the user consciously evaluates.
   */
  scenario: LocalizedText;
  
  /** The actual question prompt */
  prompt: LocalizedText;
  
  /** 4 answers, each mapping to hidden dimension scores */
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  text: LocalizedText;
  
  /** 
   * Hidden scoring — maps to dimension keys.
   * Values 0-3: 0=irrelevant, 1=minor signal, 2=moderate, 3=primary signal
   */
  scores: Record<string, number>;
  
  /** 
   * Internal emotional tag for fine-grained pattern aggregation.
   * Format: lowercase_with_underscores
   */
  emotionalTag: string;
}

export interface ProfileDef {
  id: string;
  label: string;
}

export interface ThresholdRule {
  dimensionKey: string;
  min: number;
  profileId: string;
}

export interface LocalizedText {
  'de-DE': string;
  'en-US': string;
}

// ─────────────────────────────────────────────────────────────
// SECTION 3: RESULT PROFILES — User-facing narrative output
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
// SECTION 4: AFFINITY MAP ENTRIES
// ─────────────────────────────────────────────────────────────

/**
 * Each new marker keyword needs an entry in AFFINITY_MAP.
 * 12-element vector: [Ari, Tau, Gem, Can, Leo, Vir, Lib, Sco, Sag, Cap, Aqu, Pis]
 */
export interface AffinityMapEntry {
  keyword: string;
  sectorWeights: [number, number, number, number, number, number, 
                  number, number, number, number, number, number];
  domain: MarkerDomain;
  rationale: string;
}

// ─────────────────────────────────────────────────────────────
// SECTION 5: EVENT CONVERTER SPEC
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
// SECTION 6: AGGREGATION RULES
// ─────────────────────────────────────────────────────────────

export interface AggregationRules {
  contributesTo: string[];

  /** 
   * Share of the 0.30 quiz allocation in Master Signal.
   * e.g. weight 0.15 = 0.15 × 0.30 = 0.045 Master Signal contribution
   */
  weight: number;

  decay: 'none' | 'slow' | 'fast';
  recurrence: 'once' | 'monthly' | 'seasonal';

  /** True-North: Quiz modulation max 50% from natal weight */
  maxNatalDeviation: 0.5;
}

// ─────────────────────────────────────────────────────────────
// SECTION 7: CONSTANTS & REFERENCE TABLES
// ─────────────────────────────────────────────────────────────

export const ZODIAC_SECTORS = [
  { index: 0,  sign: 'Aries',       element: 'Wood',  opposition: 6  },
  { index: 1,  sign: 'Taurus',      element: 'Earth', opposition: 7  },
  { index: 2,  sign: 'Gemini',      element: 'Fire',  opposition: 8  },
  { index: 3,  sign: 'Cancer',      element: 'Fire',  opposition: 9  },
  { index: 4,  sign: 'Leo',         element: 'Fire',  opposition: 10 },
  { index: 5,  sign: 'Virgo',       element: 'Metal', opposition: 11 },
  { index: 6,  sign: 'Libra',       element: 'Metal', opposition: 0  },
  { index: 7,  sign: 'Scorpio',     element: 'Water', opposition: 1  },
  { index: 8,  sign: 'Sagittarius', element: 'Water', opposition: 2  },
  { index: 9,  sign: 'Capricorn',   element: 'Water', opposition: 3  },
  { index: 10, sign: 'Aquarius',    element: 'Earth', opposition: 4  },
  { index: 11, sign: 'Pisces',      element: 'Wood',  opposition: 5  },
] as const;

export const SIGNATUR_DIMENSIONS = {
  assertion:   { angle: 0,   planet: 'Mars',    hz: 144.72, polA: 'Durchsetzung', polB: 'Hingabe'   },
  empathy:     { angle: 60,  planet: 'Moon',    hz: 210.42, polA: 'Einfühlung',   polB: 'Abgrenzung'},
  creativity:  { angle: 120, planet: 'Sun',     hz: 126.22, polA: 'Schöpfung',    polB: 'Struktur'  },
  logic:       { angle: 180, planet: 'Mercury', hz: 141.27, polA: 'Analyse',      polB: 'Synthese'  },
  intuition:   { angle: 240, planet: 'Jupiter', hz: 183.58, polA: 'Ahnung',       polB: 'Evidenz'   },
  discipline:  { angle: 300, planet: 'Saturn',  hz: 147.85, polA: 'Ordnung',      polB: 'Freiheit'  },
} as const;

export const MASTER_SIGNAL_DIMENSIONS = {
  passion:    'Expressivity, desire, initiative, energy',
  stability:  'Continuity, grounding, reliability, structure',
  future:     'Growth orientation, vision, possibility',
  connection: 'Relational depth, intimacy, belonging',
  autonomy:   'Self-direction, independence, individuation',
} as const;

export const FUSION_WEIGHTS = {
  natal: 0.35,
  quiz: 0.30,
  gcb: 0.20,
  alignmentBoost: 0.15,
} as const;
