/**
 * Horoscope Service — Tageshoroskop Orchestrator
 *
 * Pipeline:
 *   1. Fetch transit data (FuFirE /transit/state via server proxy)
 *   2. Personalize: Transit × User's master_vector → Sector resonance
 *   3. Generate: Template (Freemium) or LLM-enriched (Premium)
 *   4. Validate: Wording check, sanitize if needed
 *   5. Output: headline + body + advice + ring_effects
 *
 * Caching: 24h on-demand cache per user (via server.mjs endpoint)
 */

import type {
  TransitSnapshot,
  HoroscopeUserProfile,
  DailyHoroscope,
  SectorResonance,
  HoroscopeRingEffect,
} from './types';
import type { DimensionKey } from '@/src/lib/master-signal/types';
import { generateTemplateHoroscope, getSectorDomain, getSectorDimension } from './templates';
import { validateWording, sanitizeWording } from './wording-validator';

// ── Sector Resonance Computation ──────────────────────────────────────

/**
 * Compute how strongly each sector resonates with the user's profile.
 * resonance = user's sector_modulation × master_vector affinity
 * impact = resonance × transit_intensity
 */
function computeSectorResonance(
  transit: TransitSnapshot,
  profile: HoroscopeUserProfile,
): SectorResonance[] {
  return Array.from({ length: 12 }, (_, i) => {
    const transitIntensity = transit.sector_intensity[i] ?? 0;
    const userModulation = profile.sector_modulation[i] ?? 0.5;
    const dimension = getSectorDimension(i);
    const dimensionAffinity = profile.master_vector[dimension] ?? 0.2;

    // Resonance: how much the user's profile aligns with this sector
    const resonance = Math.min(1, userModulation * dimensionAffinity * 2);

    // Impact: resonance weighted by transit intensity
    const impact = Math.min(1, resonance * transitIntensity);

    return {
      sector: i,
      resonance: Math.round(resonance * 1000) / 1000,
      transit_intensity: transitIntensity,
      impact: Math.round(impact * 1000) / 1000,
      dimension,
      domain_de: getSectorDomain(i, 'de'),
      domain_en: getSectorDomain(i, 'en'),
    };
  });
}

// ── Ring Effects from Resonance ───────────────────────────────────────

function deriveRingEffects(resonances: SectorResonance[]): HoroscopeRingEffect[] {
  return resonances
    .filter(r => r.impact > 0.3)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map(r => ({
      sector: r.sector,
      intensity: r.impact,
      type: r.impact >= 0.6 ? 'pulse' as const : r.impact >= 0.4 ? 'glow' as const : 'highlight' as const,
    }));
}

// ── Cache Key ─────────────────────────────────────────────────────────

function buildCacheKey(userId: string, dateStr: string): string {
  return `horoscope:${userId}:${dateStr}`;
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Main Service ──────────────────────────────────────────────────────

/**
 * Generate a daily horoscope for a user.
 *
 * @param transit - Current transit snapshot from FuFirE
 * @param profile - User's master signal profile
 * @param userId - User ID for cache key
 * @returns DailyHoroscope ready for display
 */
export function generateDailyHoroscope(
  transit: TransitSnapshot,
  profile: HoroscopeUserProfile,
  userId: string,
): DailyHoroscope {
  const dateStr = todayDateStr();
  const lang = profile.lang;

  // 1. Compute personalized sector resonance
  const resonances = computeSectorResonance(transit, profile);

  // 2. Generate template horoscope
  const template = generateTemplateHoroscope(
    resonances,
    transit.events,
    lang,
    dateStr,
  );

  // 3. Validate and sanitize wording
  let { headline, body, advice } = template;

  const headlineCheck = validateWording(headline, lang);
  const bodyCheck = validateWording(body, lang);
  const adviceCheck = validateWording(advice, lang);

  if (!headlineCheck.valid) headline = sanitizeWording(headline, lang);
  if (!bodyCheck.valid) body = sanitizeWording(body, lang);
  if (!adviceCheck.valid) advice = sanitizeWording(advice, lang);

  // 4. Derive ring effects
  const ring_effects = deriveRingEffects(resonances);

  // 5. Find active sectors (impact > 0.2)
  const active_sectors = resonances
    .filter(r => r.impact > 0.2)
    .sort((a, b) => b.impact - a.impact)
    .map(r => r.sector);

  return {
    headline,
    body,
    advice,
    pushworthy: template.pushworthy,
    push_text: template.push_text,
    active_sectors,
    ring_effects,
    tier: 'freemium',
    generated_at: new Date().toISOString(),
    cache_key: buildCacheKey(userId, dateStr),
  };
}

// ── Transit Fetch Helper (Frontend) ───────────────────────────────────

/**
 * Fetch transit state from the server proxy.
 * The server calls FuFirE /transit/state internally.
 */
export async function fetchTransitSnapshot(userId: string): Promise<TransitSnapshot | null> {
  try {
    const res = await fetch(`/api/transit-state/${userId}`);
    if (!res.ok) return null;

    const data = await res.json();

    return {
      sector_intensity: data.transit_contribution?.sectors
        ?? data.ring?.sectors
        ?? Array(12).fill(0.35),
      transit_intensity: data.transit_contribution?.transit_intensity ?? 0.35,
      events: (data.events ?? []).map((e: Record<string, unknown>) => ({
        type: e.type ?? 'resonance_jump',
        sector: e.sector ?? 0,
        trigger_planet: e.trigger_planet ?? '',
        description_de: e.description_de ?? '',
        personal_context: e.personal_context,
        priority: e.priority ?? (e.delta ? Math.round(Number(e.delta) * 100) : 30),
      })),
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[horoscope] Failed to fetch transit:', err);
    return null;
  }
}

// ── Re-exports ────────────────────────────────────────────────────────

export type { DailyHoroscope, SectorResonance, HoroscopeUserProfile, TransitSnapshot } from './types';
