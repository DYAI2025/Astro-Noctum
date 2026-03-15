/**
 * Horoscope Types — Tageshoroskop Data Contracts
 *
 * Shared types for the daily horoscope pipeline:
 *   Transit data + User profile → Personalized horoscope
 */

import type { DimensionKey } from '@/src/lib/master-signal/types';

// ── Transit Input ─────────────────────────────────────────────────────

export interface TransitSnapshot {
  /** 12 sector intensity values (0–1) from FuFirE /transit/state */
  sector_intensity: number[];
  /** Overall transit intensity 0–1 */
  transit_intensity: number;
  /** Active transit events */
  events: TransitEventInput[];
  /** Generated timestamp ISO */
  generated_at: string;
}

export interface TransitEventInput {
  type: 'resonance_jump' | 'dominance_shift' | 'moon_event';
  sector: number;
  trigger_planet: string;
  description_de: string;
  personal_context?: string;
  priority: number;
}

// ── User Profile Input ────────────────────────────────────────────────

export interface HoroscopeUserProfile {
  /** User's master vector (5D, normalized) */
  master_vector: Record<DimensionKey, number>;
  /** User's dominant dimension */
  dominant_dimension: DimensionKey;
  /** 12 sector modulation values from ring projection */
  sector_modulation: number[];
  /** Active quiz cluster domains */
  active_domains: string[];
  /** Birth year for GCB context */
  birth_year: number;
  /** Preferred language */
  lang: 'de' | 'en';
}

// ── Horoscope Output ──────────────────────────────────────────────────

export type HoroscopeTier = 'freemium' | 'premium';

export interface DailyHoroscope {
  /** One-sentence headline */
  headline: string;
  /** 3–5 sentence body text */
  body: string;
  /** One-sentence actionable advice (non-imperative) */
  advice: string;
  /** Whether this horoscope has a strong enough signal for a push notification */
  pushworthy: boolean;
  /** Optional push notification text (if pushworthy) */
  push_text?: string;
  /** Which sectors are most active today */
  active_sectors: number[];
  /** Optional ring effects to trigger */
  ring_effects?: HoroscopeRingEffect[];
  /** Tier: freemium (template) or premium (LLM-enriched) */
  tier: HoroscopeTier;
  /** Generation timestamp ISO */
  generated_at: string;
  /** Cache key for 24h TTL */
  cache_key: string;
}

export interface HoroscopeRingEffect {
  sector: number;
  intensity: number;
  type: 'pulse' | 'glow' | 'highlight';
}

// ── Sector Resonance (personalization layer) ──────────────────────────

export interface SectorResonance {
  /** Sector index 0–11 */
  sector: number;
  /** How strongly this sector resonates with the user's profile (0–1) */
  resonance: number;
  /** Transit intensity at this sector */
  transit_intensity: number;
  /** Combined impact = resonance × transit_intensity */
  impact: number;
  /** Sector's primary dimension */
  dimension: DimensionKey;
  /** Domain label for narrative use */
  domain_de: string;
  domain_en: string;
}

// ── LLM Layer Types ───────────────────────────────────────────────────

export interface LLMEnrichmentInput {
  /** Template horoscope to enrich */
  template_horoscope: DailyHoroscope;
  /** User's active sectors with resonance data */
  resonance_data: SectorResonance[];
  /** Ring voice context (Zwischen-Räume, active clusters) */
  ring_context?: string;
  /** Language */
  lang: 'de' | 'en';
}

export interface LLMEnrichmentOutput {
  /** Enriched headline */
  headline: string;
  /** Enriched body (more personal, longer) */
  body: string;
  /** Enriched advice */
  advice: string;
  /** Levi-style personal note */
  levi_note?: string;
}
