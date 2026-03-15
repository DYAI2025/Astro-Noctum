/**
 * useDailyHoroscope — Daily Horoscope Hook
 *
 * Combines transit data + master signal to produce a personalized horoscope.
 * Caches result for 24h in localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DailyHoroscope, HoroscopeUserProfile, TransitSnapshot } from '@/src/lib/horoscope/types';
import { generateDailyHoroscope, fetchTransitSnapshot } from '@/src/lib/horoscope/horoscope-service';
import type { ApiData } from '@/src/types/bafe';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { buildMasterSignal, projectToRing } from '@/src/lib/master-signal';

const CACHE_KEY_PREFIX = 'bazodiac:horoscope:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedHoroscope {
  horoscope: DailyHoroscope;
  timestamp: number;
  dateStr: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface DailyHoroscopeResult {
  horoscope: DailyHoroscope | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDailyHoroscope(
  userId: string | null,
  apiData: ApiData | null,
  quizEvents: ContributionEvent[],
  birthYear: number | null,
  lang: 'de' | 'en',
): DailyHoroscopeResult {
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!userId || !apiData || !birthYear) return;

    // Check localStorage cache
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    const today = todayStr();

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed: CachedHoroscope = JSON.parse(cached);
        if (parsed.dateStr === today && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          setHoroscope(parsed.horoscope);
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    setLoading(true);
    setError(null);

    try {
      // 1. Build master signal
      const masterSignal = buildMasterSignal(apiData, quizEvents, birthYear, lang);

      // 2. Project to ring
      const ringProjection = projectToRing(masterSignal);

      // 3. Fetch transit data
      const transit = await fetchTransitSnapshot(userId);

      // 4. Build user profile for horoscope
      const profile: HoroscopeUserProfile = {
        master_vector: masterSignal.subsignals.natal.dimensions, // Use natal as primary signal
        dominant_dimension: 'passion', // Will be overridden by actual dominant
        sector_modulation: ringProjection.sector_modulation,
        active_domains: [], // From quiz events
        birth_year: birthYear,
        lang,
      };

      // Find actual dominant dimension
      const dims = masterSignal.subsignals.natal.dimensions;
      let maxDim: { key: string; val: number } = { key: 'passion', val: 0 };
      for (const [key, val] of Object.entries(dims)) {
        if (val > maxDim.val) maxDim = { key, val };
      }
      profile.dominant_dimension = maxDim.key as typeof profile.dominant_dimension;

      // Extract active domains from quiz events
      profile.active_domains = [...new Set(
        quizEvents.flatMap(e =>
          (e.payload?.markers ?? []).map((m: { id: string }) => {
            const parts = m.id.split('.');
            return parts.length >= 2 ? parts[1] : '';
          }).filter(Boolean)
        )
      )];

      // 5. Build fallback transit if fetch failed
      const transitData: TransitSnapshot = transit ?? {
        sector_intensity: Array(12).fill(0.35),
        transit_intensity: 0.35,
        events: [],
        generated_at: new Date().toISOString(),
      };

      // 6. Generate horoscope
      const result = generateDailyHoroscope(transitData, profile, userId);
      setHoroscope(result);

      // 7. Cache
      try {
        const cacheEntry: CachedHoroscope = {
          horoscope: result,
          timestamp: Date.now(),
          dateStr: today,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch { /* ignore storage errors */ }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Horoscope generation failed';
      setError(msg);
      console.error('[useDailyHoroscope]', err);
    } finally {
      setLoading(false);
    }
  }, [userId, apiData, quizEvents, birthYear, lang]);

  useEffect(() => {
    generate();
  }, [generate]);

  return {
    horoscope,
    loading,
    error,
    refresh: generate,
  };
}
