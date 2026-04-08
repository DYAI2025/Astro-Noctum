/**
 * useWeeklyInsights — fetches weekly insights from /api/weekly-insights.
 *
 * Implements: REQ-USA-mobile-first-readability (top-3 above fold on 375px)
 * Same API as web — POST /api/weekly-insights, requireUserAuth.
 * Cached per ISO week server-side (L1 memory + L2 Supabase).
 */

import { useState, useCallback } from 'react';
import { authedFetch } from '../lib/api';

export interface LifeAreaInsight {
  area: string;            // e.g. "Beziehungen"
  tendency: string;        // e.g. "aufwärts", "stabil", "herausfordernd"
  statement: string;       // 1 sentence from Gemini
  isTopThree: boolean;
  explanation?: string;    // "Warum?" text
}

export interface WeeklyInsightsResult {
  areas: LifeAreaInsight[];
  week_label: string;      // e.g. "KW 15, 2026"
  meta?: { cached?: boolean };
}

interface UseWeeklyInsightsState {
  data: WeeklyInsightsResult | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export function useWeeklyInsights(): UseWeeklyInsightsState {
  const [data, setData] = useState<WeeklyInsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeekly = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authedFetch('/api/weekly-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Weekly insights request failed (${res.status})`);
      }

      const json = await res.json() as WeeklyInsightsResult;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch: fetchWeekly };
}
