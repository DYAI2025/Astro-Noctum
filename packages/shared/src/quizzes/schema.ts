/** Scoring models that cover all 22 Bazodiac quizzes */
export type ScoringModel = 'multi-dimension' | 'categorical' | 'profile-driven';

export interface QuizOption {
  id: string;
  text: string;
  /** For multi-dimension/categorical: maps dimension/category → score */
  scores?: Record<string, number>;
  /** For profile-driven: which profile this option votes for */
  profileId?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  /** Optional context/category label shown above the question */
  context?: string;
  options: QuizOption[];
}

export interface QuizProfile {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  /** For multi-dimension: threshold rules as "dimension >= value" pairs */
  thresholds?: Record<string, number>;
  /** For categorical: minimum score to match this profile */
  minScore?: number;
  /** Priority when multiple profiles match (lower = higher priority) */
  priority?: number;
}

export interface QuizResultMapping {
  /** LME marker ID emitted when this quiz is completed */
  markerId: string;
  /** Maps profile IDs to trait scores for the Fusion Ring signal */
  profileToTraits: Record<string, Record<string, number>>;
}

export interface QuizDefinition {
  id: string;
  title: string;
  titleDe: string;
  subtitle: string;
  subtitleDe: string;
  emoji: string;
  accentColor: string;
  scoringModel: ScoringModel;
  /** Dimension names for multi-dimension scoring */
  dimensions?: string[];
  questions: QuizQuestion[];
  profiles: QuizProfile[];
  resultMapping: QuizResultMapping;
  /** Premium-only quiz */
  premium?: boolean;
  /** Part of a series (kinky, partner-match) */
  seriesId?: string;
  seriesOrder?: number;
}
