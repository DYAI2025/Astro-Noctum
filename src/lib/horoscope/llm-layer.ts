/**
 * LLM Layer — Premium Horoscope Enrichment (Stub)
 *
 * Interface for LLM-enriched horoscopes via Gemini 2.0 Flash.
 * Sprint 6 will implement the actual LLM call.
 * For now: returns the template horoscope unchanged (graceful fallback).
 */

import type { LLMEnrichmentInput, LLMEnrichmentOutput, DailyHoroscope } from './types';

/**
 * Enriches a template horoscope with LLM-generated personal context.
 * STUB: Returns template text unchanged until Sprint 6.
 */
export async function enrichWithLLM(
  input: LLMEnrichmentInput,
): Promise<LLMEnrichmentOutput> {
  // Sprint 6: Replace with actual Gemini 2.0 Flash call
  // The call will:
  // 1. Take the template horoscope + ring context + resonance data
  // 2. Generate a more personal, Levi-style enriched version
  // 3. Include Zwischen-Raum references
  // 4. Respect wording guidelines (no imperatives, no diagnostics)

  return {
    headline: input.template_horoscope.headline,
    body: input.template_horoscope.body,
    advice: input.template_horoscope.advice,
    levi_note: undefined,
  };
}

/**
 * Build a premium horoscope by enriching a template version.
 * Falls back to template if LLM is unavailable.
 */
export async function buildPremiumHoroscope(
  templateHoroscope: DailyHoroscope,
  input: Omit<LLMEnrichmentInput, 'template_horoscope'>,
): Promise<DailyHoroscope> {
  try {
    const enriched = await enrichWithLLM({
      ...input,
      template_horoscope: templateHoroscope,
    });

    return {
      ...templateHoroscope,
      headline: enriched.headline,
      body: enriched.body,
      advice: enriched.advice,
      tier: 'premium',
    };
  } catch (err) {
    console.warn('[horoscope] LLM enrichment failed, falling back to template:', err);
    return templateHoroscope;
  }
}
