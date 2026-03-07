/**
 * QuizzMe Module Loader
 * Lädt Quizze einzeln oder als Gesamtpaket
 */

import type { 
  QuizzMeApiConfig, 
  QuizModule, 
  ContributionEvent,
  Marker,
  TraitScore,
  Profile,
  calculateBand,
  normalizeScore 
} from './quizzme-api-types';

// ============================================
// MODULE REGISTRY
// ============================================

const MODULE_IDS = [
  'quiz.love_languages.v1',
  'quiz.aura_colors.v1',
  'quiz.spirit_animal.v1',
  'quiz.chinese_zodiac.v1',
  'quiz.career_dna.v1',
  'quiz.social_role.v1',
  'quiz.celebrity_soulmate.v1',
  'quiz.rpg_identity.v1',
  'quiz.destiny_archetype.v1',
  'quiz.superhero.v1',
  'quiz.party_need.v1',
  'quiz.overwhelm.v1',
  'quiz.attention_need.v1',
  'quiz.flower_being.v1',
  'quiz.charm_profile.v1',
  'quiz.personality_core.v1'
] as const;

type ModuleId = typeof MODULE_IDS[number];

// ============================================
// LOADER CLASS
// ============================================

export class QuizzMeLoader {
  private config: QuizzMeApiConfig | null = null;
  private loadedModules: Map<string, QuizModule> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1/quizzme') {
    this.baseUrl = baseUrl;
  }

  /**
   * Lädt die komplette API-Konfiguration
   */
  async loadFullConfig(): Promise<QuizzMeApiConfig> {
    if (this.config) return this.config;
    
    const response = await fetch(`${this.baseUrl}/config`);
    this.config = await response.json();
    return this.config!;
  }

  /**
   * Lädt ein einzelnes Modul
   */
  async loadModule(moduleId: ModuleId): Promise<QuizModule> {
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId)!;
    }

    const response = await fetch(`${this.baseUrl}/modules/${moduleId}`);
    const module = await response.json();
    this.loadedModules.set(moduleId, module);
    return module;
  }

  /**
   * Lädt mehrere Module gleichzeitig
   */
  async loadModules(moduleIds: ModuleId[]): Promise<Map<string, QuizModule>> {
    const promises = moduleIds.map(id => this.loadModule(id));
    await Promise.all(promises);
    return this.loadedModules;
  }

  /**
   * Lädt alle Module einer Kategorie
   */
  async loadByCategory(category: string): Promise<QuizModule[]> {
    const config = await this.loadFullConfig();
    const modules = Object.values(config.modules)
      .filter(m => m.category === category);
    
    for (const module of modules) {
      this.loadedModules.set(module.id, module);
    }
    
    return modules;
  }

  /**
   * Gibt verfügbare Module-IDs zurück
   */
  getAvailableModules(): readonly string[] {
    return MODULE_IDS;
  }

  /**
   * Prüft ob ein Modul geladen ist
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }

  /**
   * Entlädt ein Modul (für Memory Management)
   */
  unloadModule(moduleId: string): void {
    this.loadedModules.delete(moduleId);
  }

  /**
   * Entlädt alle Module
   */
  unloadAll(): void {
    this.loadedModules.clear();
    this.config = null;
  }
}

// ============================================
// SCORING ENGINE
// ============================================

export class QuizScoringEngine {
  private module: QuizModule;

  constructor(module: QuizModule) {
    this.module = module;
  }

  /**
   * Berechnet Dimension-Scores aus Antworten
   */
  calculateDimensionScores(
    answers: Array<{ questionId: string; optionId: string; scoring: Record<string, number> }>
  ): Record<string, number> {
    const dimensionTotals: Record<string, number[]> = {};
    
    // Initialisiere alle Dimensionen
    for (const dim of this.module.dimensions) {
      dimensionTotals[dim.id] = [];
    }

    // Sammle Scores pro Dimension
    for (const answer of answers) {
      for (const [dimId, score] of Object.entries(answer.scoring)) {
        if (dimensionTotals[dimId]) {
          dimensionTotals[dimId].push(score);
        }
      }
    }

    // Berechne Durchschnitte und normiere auf 1-100
    const normalizedScores: Record<string, number> = {};
    for (const [dimId, scores] of Object.entries(dimensionTotals)) {
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        normalizedScores[dimId] = Math.round(avg);
      }
    }

    return normalizedScores;
  }

  /**
   * Bestimmt das passende Profil basierend auf Scores
   */
  determineProfile(scores: Record<string, number>): string | null {
    // Diese Methode benötigt Zugriff auf die Profile-Conditions
    // In einer vollständigen Implementierung würde hier die Matching-Logik stehen
    return null;
  }

  /**
   * Generiert Marker aus Dimension-Scores
   */
  generateMarkers(scores: Record<string, number>): Marker[] {
    const markers: Marker[] = [];

    for (const mapping of this.module.marker_mappings) {
      const score = scores[mapping.dimension];
      if (score !== undefined) {
        const weight = (score - 50) / 50; // -1 bis +1
        markers.push({
          id: mapping.marker_id,
          weight: Math.max(-1, Math.min(1, weight)),
          evidence: {
            confidence: 0.7 + (Math.abs(weight) * 0.3)
          }
        });
      }
    }

    return markers;
  }

  /**
   * Generiert TraitScores
   */
  generateTraits(scores: Record<string, number>): TraitScore[] {
    return Object.entries(scores).map(([dimId, score]) => ({
      id: `trait.${this.module.category}.${dimId}`,
      score,
      band: this.calculateBand(score),
      confidence: 0.75,
      method: 'scenario' as const
    }));
  }

  private calculateBand(score: number): 'low' | 'midlow' | 'mid' | 'midhigh' | 'high' {
    if (score <= 20) return 'low';
    if (score <= 40) return 'midlow';
    if (score <= 60) return 'mid';
    if (score <= 80) return 'midhigh';
    return 'high';
  }
}

// ============================================
// CONTRIBUTION EVENT BUILDER
// ============================================

export class ContributionEventBuilder {
  private moduleId: string;
  private markers: Marker[] = [];
  private traits: TraitScore[] = [];
  private tags: Array<{ id: string; label: string; kind: string; weight?: number }> = [];
  private unlocks: Array<{ id: string; unlocked: boolean; unlockedAt?: string; level?: number; sourceRef?: string }> = [];
  private summary?: { title?: string; bullets?: string[]; resultId?: string };

  constructor(moduleId: string) {
    this.moduleId = moduleId;
  }

  addMarker(marker: Marker): this {
    this.markers.push(marker);
    return this;
  }

  addMarkers(markers: Marker[]): this {
    this.markers.push(...markers);
    return this;
  }

  addTrait(trait: TraitScore): this {
    this.traits.push(trait);
    return this;
  }

  addTraits(traits: TraitScore[]): this {
    this.traits.push(...traits);
    return this;
  }

  addTag(tag: { id: string; label: string; kind: string; weight?: number }): this {
    this.tags.push(tag);
    return this;
  }

  addUnlock(unlock: { id: string; unlocked: boolean; level?: number }): this {
    this.unlocks.push({
      ...unlock,
      unlockedAt: new Date().toISOString(),
      sourceRef: this.moduleId
    });
    return this;
  }

  setSummary(summary: { title?: string; bullets?: string[]; resultId?: string }): this {
    this.summary = summary;
    return this;
  }

  build(): ContributionEvent {
    return {
      specVersion: 'sp.contribution.v1',
      eventId: this.generateUUID(),
      occurredAt: new Date().toISOString(),
      source: {
        vertical: 'quiz',
        moduleId: this.moduleId,
        locale: 'de-DE'
      },
      payload: {
        markers: this.markers,
        ...(this.traits.length > 0 && { traits: this.traits }),
        ...(this.tags.length > 0 && { tags: this.tags }),
        ...(this.unlocks.length > 0 && { unlocks: this.unlocks }),
        ...(this.summary && { summary: this.summary })
      }
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// ============================================
// CLUSTER PROGRESS TRACKER
// ============================================

export class ClusterProgressTracker {
  private completedModules: Set<string> = new Set();

  constructor(private clusterId: string, private requiredModules: string[], private optionalModules: string[]) {}

  markCompleted(moduleId: string): void {
    if (this.requiredModules.includes(moduleId) || this.optionalModules.includes(moduleId)) {
      this.completedModules.add(moduleId);
    }
  }

  getProgress(): {
    completed: number;
    total: number;
    requiredCompleted: number;
    requiredTotal: number;
    optionalCompleted: number;
    optionalTotal: number;
    percent: number;
    isUnlocked: boolean;
  } {
    const requiredCompleted = this.requiredModules.filter(m => this.completedModules.has(m)).length;
    const optionalCompleted = this.optionalModules.filter(m => this.completedModules.has(m)).length;
    const total = this.requiredModules.length + this.optionalModules.length;
    const completed = requiredCompleted + optionalCompleted;

    return {
      completed,
      total,
      requiredCompleted,
      requiredTotal: this.requiredModules.length,
      optionalCompleted,
      optionalTotal: this.optionalModules.length,
      percent: Math.round((completed / total) * 100),
      isUnlocked: requiredCompleted === this.requiredModules.length
    };
  }

  getCompletedModules(): string[] {
    return Array.from(this.completedModules);
  }

  getMissingRequired(): string[] {
    return this.requiredModules.filter(m => !this.completedModules.has(m));
  }
}

// ============================================
// EXPORT HELPERS
// ============================================

export const createLoader = (baseUrl?: string) => new QuizzMeLoader(baseUrl);
export const createScoringEngine = (module: QuizModule) => new QuizScoringEngine(module);
export const createEventBuilder = (moduleId: string) => new ContributionEventBuilder(moduleId);
export const createClusterTracker = (
  clusterId: string, 
  required: string[], 
  optional: string[]
) => new ClusterProgressTracker(clusterId, required, optional);

// ============================================
// STANDALONE MODULE EXPORTS
// Für Einzelnutzung ohne API
// ============================================

export const STANDALONE_MODULES = {
  LOVE_LANGUAGES: 'quiz.love_languages.v1',
  AURA_COLORS: 'quiz.aura_colors.v1',
  SPIRIT_ANIMAL: 'quiz.spirit_animal.v1',
  CHINESE_ZODIAC: 'quiz.chinese_zodiac.v1',
  CAREER_DNA: 'quiz.career_dna.v1',
  SOCIAL_ROLE: 'quiz.social_role.v1',
  CELEBRITY_SOULMATE: 'quiz.celebrity_soulmate.v1',
  RPG_IDENTITY: 'quiz.rpg_identity.v1',
  DESTINY_ARCHETYPE: 'quiz.destiny_archetype.v1',
  SUPERHERO: 'quiz.superhero.v1',
  PARTY_NEED: 'quiz.party_need.v1',
  OVERWHELM: 'quiz.overwhelm.v1',
  ATTENTION_NEED: 'quiz.attention_need.v1',
  FLOWER_BEING: 'quiz.flower_being.v1',
  CHARM_PROFILE: 'quiz.charm_profile.v1',
  PERSONALITY_CORE: 'quiz.personality_core.v1'
} as const;

export const CLUSTER_IDS = {
  SELF_DISCOVERY: 'cluster.self_discovery.v1',
  SPIRITUAL_PATH: 'cluster.spiritual_path.v1',
  SOCIAL_DYNAMICS: 'cluster.social_dynamics.v1'
} as const;
