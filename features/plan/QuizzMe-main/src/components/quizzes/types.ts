// Shared types for quiz components

export interface QuizMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  slug?: string;
  questions_count?: number;
  estimated_duration_seconds?: number;
  disclaimer?: string;
}

export interface Marker {
  id: string;
  weight: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  scores?: Record<string, number>;
  markers?: Marker[];
}

export interface Question {
  id: string;
  text: string;
  scenario?: string;
  context?: string;
  options: QuestionOption[];
}

export interface ProfileStat {
  label: string;
  value: string | number;
  width?: string;
}

export interface ValidationProfile {
  id: string;
  title: string;
  tagline: string;
  description: string;
  stats: ProfileStat[];
  markers?: Marker[];
  share_text?: string;
  emoji?: string;
  color?: string;
  matchCondition?: unknown;
  compatibility?: {
    allies?: string[];
    nemesis?: string | string[];
  };
}
