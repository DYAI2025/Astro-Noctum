/**
 * useTransitState — Transit Polling Hook
 *
 * Polls /api/transit-state/:userId every 15 minutes.
 * Provides parsed transit data for the Ring and Horoscope.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TransitStateV1 } from '@/src/components/fusion-ring-website/fusion-ring-transit';
import { parseTransitState } from '@/src/components/fusion-ring-website/fusion-ring-transit';
import type { ParsedTransitData } from '@/src/components/fusion-ring-website/fusion-ring-transit';

const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export interface TransitStateResult {
  /** Parsed transit data (null if not yet loaded) */
  data: ParsedTransitData | null;
  /** Raw transit state from server */
  raw: TransitStateV1 | null;
  /** Loading state */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Last successful fetch timestamp */
  lastFetched: number | null;
  /** Force refresh */
  refresh: () => void;
}

export function useTransitState(userId: string | null): TransitStateResult {
  const [data, setData] = useState<ParsedTransitData | null>(null);
  const [raw, setRaw] = useState<TransitStateV1 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTransit = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/transit-state/${userId}`);
      if (!res.ok) throw new Error(`Transit API: ${res.status}`);

      const serverData = await res.json();

      // Map server response to TRANSIT_STATE_v1 schema
      const transitState: TransitStateV1 = {
        schema: 'TRANSIT_STATE_v1',
        generated_at: new Date().toISOString(),
        ring: {
          sectors: serverData.ring?.sectors ?? Array(12).fill(0),
        },
        transit_contribution: {
          sectors: serverData.soulprint?.sectors ?? serverData.ring?.sectors ?? Array(12).fill(0.35),
          transit_intensity: serverData.transit_contribution?.transit_intensity ?? 0.35,
        },
        delta: {
          sectors_30d_avg: serverData.delta?.vs_30day_avg?.avg_sectors,
          trend: 'stable',
        },
        events: (serverData.events ?? []).map((e: Record<string, unknown>) => ({
          type: (e.type as string) ?? 'resonance_jump',
          priority: typeof e.delta === 'number' ? Math.round(e.delta * 100) : 30,
          sector: (e.sector as number) ?? 0,
          trigger_planet: (e.trigger_planet as string) ?? '',
          description_de: (e.description_de as string) ?? '',
          personal_context: (e.personal_context as string) ?? '',
        })),
      };

      const parsed = parseTransitState(transitState);
      setRaw(transitState);
      setData(parsed);
      setLastFetched(Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      console.warn('[useTransitState] fetch failed:', msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch + polling
  useEffect(() => {
    if (!userId) return;

    fetchTransit();

    intervalRef.current = setInterval(fetchTransit, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchTransit]);

  return {
    data,
    raw,
    loading,
    error,
    lastFetched,
    refresh: fetchTransit,
  };
}
