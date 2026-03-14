import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FusionSignalDataSchema,
  TransitEvent,
  TransitStateSchema,
  type FusionSignalData,
} from '@/src/lib/schemas/transit-state';
import {
  applyGaussSpread,
  applyPowerCurve,
  calculateFusionSignal,
  clamp01,
} from '@/src/utils/math';

type FusionSignalState = {
  signalData: FusionSignalData | null;
  events: TransitEvent[];
  resolution: number;
  loading: boolean;
  error: Error | null;
  updateResolution: (nextResolution: number) => void;
};

const clampTarget = (value: number): number => Math.max(-1, Math.min(2, value));
const POLL_INTERVAL_MS = 800;
const OFFLINE_POLL_INTERVAL_MS = 15_000;
const ERROR_BASE_RETRY_MS = 3_000;
const ERROR_MAX_RETRY_MS = 30_000;

export const useFusionSignal = (userId: string): FusionSignalState => {
  const [signalData, setSignalData] = useState<FusionSignalData | null>(null);
  const [events, setEvents] = useState<TransitEvent[]>([]);
  const [resolution, setResolution] = useState<number>(33);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);

  const fetchTransitState = useCallback(async (): Promise<boolean> => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      const response = await fetch(`/api/transit-state/${encodeURIComponent(userId)}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Transit state fetch failed (${response.status})`);
      }

      const payload = await response.json();
      const parsed = TransitStateSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error(parsed.error.message);
      }

      const transitState = parsed.data;

      const baseSignals = transitState.soulprint.sectors.map(clamp01);
      const thirtyDayAvg = transitState.delta.vs_30day_avg.avg_sectors.map(clamp01);
      const transitIntensity = clamp01(transitState.transit_contribution.transit_intensity);

      const rawTargets = transitState.ring.sectors.map((ringSector, index) =>
        calculateFusionSignal(
          clamp01(ringSector),
          baseSignals[index] ?? 0,
          thirtyDayAvg[index] ?? 0,
          transitIntensity,
        ),
      );

      const spreadTargets = applyGaussSpread(rawTargets);
      const targetSignals = spreadTargets.map((value) =>
        clampTarget(applyPowerCurve(value)),
      );

      const nextSignalData = FusionSignalDataSchema.parse({
        targetSignals,
        baseSignals,
        thirtyDayAvg,
        transitIntensity,
      });

      setSignalData(nextSignalData);
      setEvents(transitState.events);
      setResolution(
        transitState.resolution != null
          ? Math.max(0, Math.min(100, transitState.resolution))
          : 33,
      );
      hasLoadedRef.current = true;
      retryCountRef.current = 0;
      setError(null);
      return true;
    } catch (err) {
      retryCountRef.current += 1;
      // Keep already loaded data visible on transient outages.
      if (!hasLoadedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown transit-state error'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;

    const clearTimer = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = (delayMs: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        void poll();
      }, delayMs);
    };

    const poll = async () => {
      if (!mountedRef.current) return;

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (!hasLoadedRef.current) {
          setError(new Error('Offline'));
          setLoading(false);
        }
        scheduleNext(OFFLINE_POLL_INTERVAL_MS);
        return;
      }

      const ok = await fetchTransitState();
      if (!mountedRef.current) return;

      if (ok) {
        scheduleNext(POLL_INTERVAL_MS);
        return;
      }

      const retryDelay = Math.min(
        ERROR_MAX_RETRY_MS,
        ERROR_BASE_RETRY_MS * (2 ** Math.min(6, retryCountRef.current - 1)),
      );
      scheduleNext(retryDelay);
    };

    const onOnline = () => {
      retryCountRef.current = 0;
      void poll();
    };

    const onOffline = () => {
      if (!hasLoadedRef.current) {
        setError(new Error('Offline'));
        setLoading(false);
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    void poll();

    return () => {
      mountedRef.current = false;
      clearTimer();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [fetchTransitState]);

  const updateResolution = useCallback((nextResolution: number) => {
    setResolution(Math.max(33, Math.min(100, nextResolution)));
  }, []);

  return {
    signalData,
    events,
    resolution,
    loading,
    error,
    updateResolution,
  };
};
