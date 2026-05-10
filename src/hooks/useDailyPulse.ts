/**
 * useDailyPulse — Tagespuls hook (Phase E)
 *
 * Fetches `GET /api/daily-pulse` (Phase D server route) for the current
 * authenticated user, parses the response via Zod, and exposes a typed
 * error union for the four real-world failure modes:
 *
 *   - 422 → 'profile_required'   (no astro_profile / partial profile)
 *   - 503 → 'ai_unavailable'     (APHORISM_POOL_EMPTY or DB_UNAVAILABLE)
 *   - network failure → 'network'
 *   - anything else (4xx/5xx) → 'unknown'
 *
 * Phase 2 of the UI is the council-figure interpretation:
 * `selectCouncilFigure(key)` POSTs to `/api/daily-interpretation` and stores
 * the response keyed by archetype, so re-tapping the same figure does not
 * re-fetch (server is also idempotent at the row level).
 *
 * No client-side caching of the pulse itself: the server already L1+L2
 * caches by (user, date, locale), so a same-day reload returns the same
 * payload from cache. The hook deliberately does NOT synthesize fallback
 * pulse data — the no-placeholders directive forbids it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { authedFetch } from '@/src/lib/authedFetch';
import {
  DailyPulseResponseSchema,
  DailyInterpretationSchema,
  type DailyPulseResponse,
  type DailyInterpretation,
} from '@/src/lib/schemas/daily-pulse';

export type DailyPulseErrorCode =
  | 'profile_required'
  | 'ai_unavailable'
  | 'network'
  | 'unknown';

export interface DailyPulseError {
  code: DailyPulseErrorCode;
  retryAfter?: number;
}

export interface UseDailyPulseResult {
  pulse: DailyPulseResponse | null;
  loading: boolean;
  error: DailyPulseError | null;
  refresh: () => void;

  // Phase 2 — interpretation
  selectedFigure: string | null;
  interpretation: DailyInterpretation | null;
  loadingInterpretation: boolean;
  interpretationError: DailyPulseError | null;
  selectCouncilFigure: (key: string) => void;
}

function todayDateStr(): string {
  // YYYY-MM-DD in the user's local timezone — server validates the regex
  // and matches its own L2 row date column with no further normalization.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapStatusToError(status: number, retryAfter?: number): DailyPulseError {
  if (status === 422) return { code: 'profile_required' };
  if (status === 503) return { code: 'ai_unavailable', retryAfter };
  return { code: 'unknown' };
}

export function useDailyPulse(locale: 'de' | 'en' = 'de'): UseDailyPulseResult {
  const { user, loading: authLoading } = useAuth();

  const [pulse, setPulse] = useState<DailyPulseResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DailyPulseError | null>(null);

  const [selectedFigure, setSelectedFigure] = useState<string | null>(null);
  const [interpretationByKey, setInterpretationByKey] = useState<
    Record<string, DailyInterpretation>
  >({});
  const [loadingInterpretation, setLoadingInterpretation] = useState<boolean>(false);
  const [interpretationError, setInterpretationError] = useState<DailyPulseError | null>(null);

  const inFlightInterpRef = useRef<Set<string>>(new Set());
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  // ── Phase 1 fetch: pulse + aphorism + council ─────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Without an authenticated user the server returns 401, which we
      // surface as 'unknown'. The wrapping component decides whether to
      // route to /auth, so we don't redirect here.
      setPulse(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const date = todayDateStr();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await authedFetch(
          `/api/daily-pulse?date=${encodeURIComponent(date)}&locale=${encodeURIComponent(locale)}`,
          { method: 'GET' },
        );
        if (cancelled) return;

        if (!resp.ok) {
          const retryHeader = resp.headers.get('Retry-After');
          let retryAfter: number | undefined;
          // Some servers also embed retry_after in the body's error
          // envelope. Try the body first (Phase D writes 'AI_UNAVAILABLE'
          // with retry_after: 300), fall back to the header.
          try {
            const body = await resp.json();
            const fromBody = body?.error?.retry_after;
            if (typeof fromBody === 'number') retryAfter = fromBody;
          } catch {
            // body wasn't JSON or already consumed — ignore
          }
          if (retryAfter == null && retryHeader) {
            const n = Number(retryHeader);
            if (Number.isFinite(n)) retryAfter = n;
          }
          if (cancelled) return;
          setError(mapStatusToError(resp.status, retryAfter));
          setPulse(null);
          setLoading(false);
          return;
        }

        const json = await resp.json();
        if (cancelled) return;
        const parsed = DailyPulseResponseSchema.safeParse(json);
        if (!parsed.success) {
          setError({ code: 'unknown' });
          setPulse(null);
          setLoading(false);
          return;
        }
        setPulse(parsed.data);
        setError(null);
        // BUG-DAILY-003 + 004: hydrate Phase 2 state from server's
        // existing_decision so browser-back / refresh / direct URL
        // load all show the locked Phase 2 immediately — no Phase 1
        // flash with active selection buttons.
        if (parsed.data.existing_decision) {
          const { archetype_key, text } = parsed.data.existing_decision;
          setSelectedFigure(archetype_key);
          setInterpretationByKey((prev) => ({
            ...prev,
            [archetype_key]: { id: 'hydrated', text },
          }));
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        // Network failure (DNS, offline, CORS, abort) → typed 'network'
        setError({ code: 'network' });
        setPulse(null);
        setLoading(false);
        // err is intentionally swallowed; we only surface the typed code.
        void err;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, locale, refreshTick]);

  // ── Phase 2 action: select a council figure ───────────────────────────
  const selectCouncilFigure = useCallback(
    (key: string) => {
      setSelectedFigure(key);
      setInterpretationError(null);

      // Cache hit at hook level — server is also idempotent, but avoiding
      // the round trip means re-tapping is instant and never re-spends an
      // LLM call (server idempotency means no spend; this just hides the
      // hop).
      if (interpretationByKey[key]) {
        return;
      }

      // Guard against double-fire while a request is already in flight.
      if (inFlightInterpRef.current.has(key)) {
        return;
      }
      if (!pulse) {
        // Without a pulseId there's nothing to interpret. Surface a
        // typed error so the UI shows a retry, not silent dead state.
        setInterpretationError({ code: 'unknown' });
        return;
      }

      inFlightInterpRef.current.add(key);
      setLoadingInterpretation(true);

      (async () => {
        try {
          const resp = await authedFetch('/api/daily-interpretation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              daily_pulse_id: pulse.id,
              selected_archetype_key: key,
              locale,
            }),
          });

          if (!resp.ok) {
            let body: Record<string, unknown> | null = null;
            try {
              body = (await resp.json()) as Record<string, unknown>;
            } catch {
              // ignore
            }

            // 409 ALREADY_DECIDED — server reports an existing decision
            // for this pulse_id (different archetype or different locale).
            // Surface the locked decision as if it were the current
            // selection so the user sees their own previous choice
            // rendered in Phase 2 — no error UI. Per 2026-05-09 audit C-3.
            if (resp.status === 409) {
              const errEnv = (body?.error as Record<string, unknown> | undefined) ?? undefined;
              const lockedKey = errEnv?.locked_archetype_key;
              const lockedText = errEnv?.text;
              if (typeof lockedKey === 'string' && typeof lockedText === 'string') {
                setSelectedFigure(lockedKey);
                setInterpretationByKey((prev) => ({
                  ...prev,
                  [lockedKey]: { id: 'locked', text: lockedText },
                }));
                setLoadingInterpretation(false);
                return;
              }
            }

            const fromBody = (body?.error as Record<string, unknown> | undefined)?.retry_after;
            const retryAfter = typeof fromBody === 'number' ? fromBody : undefined;
            setInterpretationError(mapStatusToError(resp.status, retryAfter));
            setLoadingInterpretation(false);
            return;
          }

          const json = await resp.json();
          const parsed = DailyInterpretationSchema.safeParse(json);
          if (!parsed.success) {
            setInterpretationError({ code: 'unknown' });
            setLoadingInterpretation(false);
            return;
          }
          setInterpretationByKey((prev) => ({ ...prev, [key]: parsed.data }));
          setLoadingInterpretation(false);
        } catch (err) {
          setInterpretationError({ code: 'network' });
          setLoadingInterpretation(false);
          void err;
        } finally {
          inFlightInterpRef.current.delete(key);
        }
      })();
    },
    [pulse, locale, interpretationByKey],
  );

  const interpretation = selectedFigure ? interpretationByKey[selectedFigure] ?? null : null;

  return {
    pulse,
    loading,
    error,
    refresh,

    selectedFigure,
    interpretation,
    loadingInterpretation,
    interpretationError,
    selectCouncilFigure,
  };
}
