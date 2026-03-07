/**
 * QuizzMe API Types
 * Konsolidierte Typdefinitionen für alle Quiz-Module
 * Version: 1.0.0
 */

// ============================================
// CORE TYPES
// ============================================

export type SpecVersion = "sp.contribution.v1";

export type ModuleCategory = 
  | "relationships" 
  | "spiritual" 
  | "astrology" 
  | "professional" 
  | "social" 
  | "entertainment" 
  | "gaming" 
  | "lifestyle" 
  | "wellbeing" 
  | "psychology";

export type ThemeId = "modern_alchemy" | "botanical_garden";

export type Engine = 
  | "big5" 
  | "big5_adapted" 
  | "mbti" 
  | "enneagram" 
  | "holland_adapted" 
  | "jungian" 
  | "archetype" 
  | "matching" 
  | "zodiac_chinese" 
  | "custom";

export type Band = "low" | "midlow" | "mid" | "midhigh" | "high";

export type ScoringMethod = "likert" | "forced_choice" | "scenario" | "task" | "derived";

// ============================================
// DIMENSION & SCORING
// ============================================

export interface Dimension {
  id: string;
  name: string;
  pole_low: string;
  pole_high: string;
  description?: string;
  color_low?: string;
  color_high?: string;
}

export interface Scoring {
  [dimensionId: string]: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  scoring: Scoring;
  emoji?: string;
  image_url?: string;
}

export interface Question {
  id: string;
  text: string;
  scenario?: string;
  type: "likert" | "scenario" | "forced_choice" | "task";
  options: QuestionOption[];
  dimension_weights?: Record<string, number>;
}

// ============================================
// PROFILE (ERGEBNIS-TYP)
// ============================================

export interface ProfileStat {
  label: string;
  value: string;
  percent: number;
}

export interface ProfileCompatibility {
  allies: string[];
  allies_text: string;
  nemesis: string[];
  nemesis_text: string;
}

export interface ProfileCondition {
  [dimensionId: string]: {
    min?: number;
    max?: number;
  };
}

export interface Profile {
  id: string;
  title: string;
  emoji?: string;
  tagline: string;
  condition: ProfileCondition;
  description: string;
  stats: ProfileStat[];
  compatibility: ProfileCompatibility;
  share_text: string;
  conversation_starter?: string;
}

// ============================================
// MARKER & TRAIT (ContributionEvent)
// ============================================

export interface MarkerEvidence {
  itemsAnswered?: number;
  confidence?: number;
}

export interface Marker {
  id: string;
  weight: number;
  evidence?: MarkerEvidence;
}

export interface TraitScore {
  id: string;
  score: number;
  band?: Band;
  confidence?: number;
  method?: ScoringMethod;
}

export interface Tag {
  id: string;
  label: string;
  kind: "archetype" | "shadow" | "style" | "astro" | "interest" | "misc";
  weight?: number;
}

export interface Unlock {
  id: string;
  unlocked: boolean;
  unlockedAt?: string;
  level?: 1 | 2 | 3;
  sourceRef?: string;
}

// ============================================
// CONTRIBUTION EVENT
// ============================================

export interface ContributionEventSource {
  vertical: "character" | "quiz" | "horoscope" | "future";
  moduleId: string;
  domain?: string;
  locale?: string;
  build?: string;
}

export interface ContributionEventSummary {
  title?: string;
  bullets?: string[];
  resultId?: string;
}

export interface ContributionEventPayload {
  markers: Marker[];
  traits?: TraitScore[];
  tags?: Tag[];
  unlocks?: Unlock[];
  astro?: AstroPayload;
  summary?: ContributionEventSummary;
  debug?: {
    rawAnswersHash?: string;
    rawScores?: Record<string, number>;
  };
}

export interface ContributionEvent {
  specVersion: SpecVersion;
  eventId: string;
  occurredAt: string;
  userRef?: string;
  source: ContributionEventSource;
  payload: ContributionEventPayload;
}

// ============================================
// ASTRO PAYLOAD
// ============================================

export interface WesternAstro {
  sunSign?: string;
  moonSign?: string;
  ascendant?: string;
  elementsMix?: Record<"fire" | "earth" | "air" | "water", number>;
  modalitiesMix?: Record<"cardinal" | "fixed" | "mutable", number>;
  dominantPlanet?: string;
  houseEmphasis?: string[];
  archetypeKeywords?: string[];
  shadowTag?: string;
}

export interface ChineseAstro {
  animal?: string;
  element?: string;
  yinYang?: "yin" | "yang";
  luckyNumbers?: number[];
  luckyDirections?: string[];
  yearEnergy?: string;
}

export interface AstroAddons {
  numerology?: { lifePath?: number; keywords?: string[] };
  enneagram?: { type?: number; wing?: number };
  ayurveda?: { doshaMix?: Record<string, number> };
  humanDesign?: { type?: string; authority?: string; profile?: string };
}

export interface AstroPayload {
  western?: WesternAstro;
  chinese?: ChineseAstro;
  addons?: AstroAddons;
}

// ============================================
// MODULE CONFIGURATION
// ============================================

export interface MarkerMapping {
  dimension: string;
  marker_id: string;
  weight_formula?: string;
  threshold_min?: number;
  threshold_max?: number;
}

export interface ModuleFiles {
  html?: string;
  jsx?: string;
  json?: string;
}

export interface QuizModule {
  id: string;
  title: string;
  subtitle: string;
  category: ModuleCategory;
  theme: ThemeId;
  engine: Engine;
  status: "active" | "draft" | "deprecated";
  estimated_duration_seconds: number;
  questions_count: number;
  profile_count: number;
  dimensions: Dimension[];
  profiles: string[];
  marker_mappings: MarkerMapping[];
  files: ModuleFiles;
}

// ============================================
// CLUSTER QUIZZES
// ============================================

export interface ClusterReward {
  id: string;
  label: string;
}

export interface ClusterUnlocks {
  threshold: number;
  rewards: ClusterReward[];
}

export interface ClusterQuiz {
  id: string;
  title: string;
  description: string;
  required_modules: string[];
  optional_modules: string[];
  unlocks: ClusterUnlocks;
}

// ============================================
// DESIGN SYSTEM
// ============================================

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text_primary: string;
  text_secondary: string;
}

export interface ThemeFonts {
  headline: string;
  body: string;
}

export interface Theme {
  id: string;
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

export interface BandDefinition {
  range: [number, number];
  label: Band;
  emoji: string;
}

export interface ScoringConfig {
  normalization: {
    min: number;
    max: number;
    bands: BandDefinition[];
  };
  confidence_formula: string;
}

export interface ViralMechanics {
  share_platforms: string[];
  hashtags_global: string[];
  cta_templates: {
    share: string;
    tag_ally: string;
    tag_nemesis: string;
    compare: string;
  };
}

export interface DesignSystem {
  themes: Record<ThemeId, Theme>;
  card_format: string;
  card_style: string;
}

export interface GlobalConfig {
  design_system: DesignSystem;
  scoring: ScoringConfig;
  viral_mechanics: ViralMechanics;
  disclaimer: string;
}

// ============================================
// API TYPES
// ============================================

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  request_body?: object;
  response?: object;
}

export interface SubmitAnswersRequest {
  answers: Array<{
    questionId: string;
    optionId: string;
  }>;
}

export interface SubmitAnswersResponse {
  contributionEvent: ContributionEvent;
  profile: Profile;
  shareCard: ShareCard;
}

export interface ShareCard {
  format: string;
  style: string;
  primary_color: string;
  secondary_color: string;
  background: string;
  cta_primary: string;
  cta_secondary: string;
  hashtags: string[];
  viral_hooks: string[];
}

// ============================================
// FULL API CONFIG
// ============================================

export interface QuizzMeApiConfig {
  apiVersion: string;
  meta: {
    platform: string;
    description: string;
    specVersion: SpecVersion;
    created_at: string;
    total_modules: number;
    default_locale: string;
  };
  global_config: GlobalConfig;
  modules: Record<string, QuizModule>;
  cluster_quizzes: Record<string, ClusterQuiz>;
  api_endpoints: {
    base_url: string;
    endpoints: Record<string, ApiEndpoint>;
  };
  marker_registry: Record<string, string[]>;
  trait_registry: Record<string, string[]>;
}

// ============================================
// HELPER TYPES
// ============================================

export type ModuleId = keyof QuizzMeApiConfig["modules"];
export type ClusterId = keyof QuizzMeApiConfig["cluster_quizzes"];
export type MarkerId = string;
export type TraitId = string;

// ============================================
// FACTORY FUNCTIONS (für Runtime)
// ============================================

export function createContributionEvent(
  moduleId: string,
  markers: Marker[],
  options?: {
    traits?: TraitScore[];
    tags?: Tag[];
    unlocks?: Unlock[];
    summary?: ContributionEventSummary;
  }
): ContributionEvent {
  return {
    specVersion: "sp.contribution.v1",
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    source: {
      vertical: "quiz",
      moduleId,
      locale: "de-DE"
    },
    payload: {
      markers,
      ...(options?.traits && { traits: options.traits }),
      ...(options?.tags && { tags: options.tags }),
      ...(options?.unlocks && { unlocks: options.unlocks }),
      ...(options?.summary && { summary: options.summary })
    }
  };
}

export function calculateBand(score: number): Band {
  if (score <= 20) return "low";
  if (score <= 40) return "midlow";
  if (score <= 60) return "mid";
  if (score <= 80) return "midhigh";
  return "high";
}

export function normalizeScore(rawScore: number, min: number, max: number): number {
  return Math.round(((rawScore - min) / (max - min)) * 99 + 1);
}

export function calculateMarkerWeight(score: number, threshold: number = 50): number {
  return (score - threshold) / threshold;
}
