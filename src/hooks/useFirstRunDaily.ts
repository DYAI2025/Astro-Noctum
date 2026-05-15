import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { fetchDailyExperience } from '../services/experience';
import type { TransitInfluenceInput } from '../services/experience';
import type { DailyResponse } from '../lib/schemas/experience';
import { computeTodayPlanetInfluences } from '../lib/astro-data/planetInfluences';
import {
  type DayHarmonicState,
  computeDayHarmonic,
  computeNightHarmonic,
} from '../lib/day-harmonic';

// ── Types ─────────────────────────────────────────────────────────────

interface BirthInput {
  date: string;
  time: string;
  tz: string;
  lat: number;
  lon: number;
}

interface UseFirstRunDailyResult {
  dailyData: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  /** Night harmonic at 50% intensity — present when night_harmony_index is available in fusion data */
  nightHarmonic: DayHarmonicState | null;
  showModal: boolean;
  loading: boolean;
  /** True when the last fetch attempt failed (network/router/parse). dailyData will be null. */
  error: { code: string; message: string } | null;
  handleClose: () => void;
  /**
   * Force a re-fetch on demand. Use after surfacing the `error` state to the
   * user via a "Retry" button. Bumps an internal trigger so the effect
   * re-runs even when its dependencies have not changed.
   */
  retry: () => void;
}

// ── Cache key helper ──────────────────────────────────────────────────

/**
 * Returns the LOCAL calendar date as YYYY-MM-DD.
 *
 * `toISOString()` returns UTC — in any timezone ahead of UTC, that
 * would still show yesterday's date after local midnight. This helper
 * uses local-date getters to avoid that pitfall.
 *
 * @deprecated 2026-05-08 — Use {@link dailyCacheKey} for cache lookups.
 * `dailyCacheKey()` honors the 06:00 local-time day-window boundary that
 * matches user expectations ("today's horoscope" = waking day, not the
 * calendar day). `todayKey` is retained only because two existing test
 * files (`daily-fallback.test.ts`, `daily-inline-rendering.test.ts`)
 * still import it. Remove once those tests are migrated or deleted —
 * tracked in `docs/plans/2026-05-08-dashboard-launch-blockers.md`
 * (Phase 3 cleanup).
 */
export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Day-window key for daily-horoscope caching.
 *
 * The day window rotates at 06:00 local time, not midnight — users
 * perceive "today's horoscope" as referring to the waking day, not the
 * calendar day. Times between 00:00 and 05:59 belong to the previous
 * day's window.
 *
 * Returns a YYYY-MM-DD string identifying the day-window.
 *
 * Example trace (Europe/Berlin, no DST switch):
 *   2026-05-07 23:59 → "2026-05-07"   (still in May 7's window)
 *   2026-05-08 04:00 → "2026-05-07"   (still in May 7's window — pre-rotation)
 *   2026-05-08 05:59 → "2026-05-07"   (last second of May 7's window)
 *   2026-05-08 06:00 → "2026-05-08"   (rotation: enter May 8's window)
 *   2026-05-08 23:59 → "2026-05-08"   (in May 8's window)
 *
 * Year, leap-year, and month boundaries are delegated to Date.setDate(0)
 * semantics (which roll back to the last day of the previous month,
 * accounting for variable month lengths and leap days). Verified by
 * src/__tests__/daily-pulse-six-am-rotation.test.ts.
 */
export function dailyCacheKey(): string {
  const now = new Date();
  const windowedDate = new Date(now);
  if (now.getHours() < 6) {
    windowedDate.setDate(now.getDate() - 1);
  }
  const y = windowedDate.getFullYear();
  const m = String(windowedDate.getMonth() + 1).padStart(2, '0');
  const d = String(windowedDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Read the cached daily-horoscope payload IF it belongs to the current
 * day-window (06:00 local boundary, see {@link dailyCacheKey}). Returns
 * null if no cache exists, the cache is stale, or parsing fails.
 *
 * @internal Exported as of Task 1.6 (2026-05-08) for direct contract
 * testing in `src/__tests__/daily-pulse-six-am-cache-rotation.test.ts`.
 * Production code should consume the cache via the `useFirstRunDaily`
 * hook — not via direct calls — to preserve the hook's invariants
 * (dedupe via `lastFetchedDateRef`, error-state propagation, etc.).
 */
export function getCachedDaily(): DailyResponse | null {
  try {
    const raw = localStorage.getItem('daily_horoscope_cache');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.date === dailyCacheKey() && parsed?.data) {
      return parsed.data as DailyResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist the daily-horoscope payload tagged with the current day-window
 * key. The next read will only return this payload while the local clock
 * is within the same 06:00→05:59 window.
 *
 * @internal Exported as of Task 1.6 (2026-05-08) for direct contract
 * testing in `src/__tests__/daily-pulse-six-am-cache-rotation.test.ts`.
 * Production code should consume the cache via the `useFirstRunDaily`
 * hook — not via direct calls.
 */
export function setCachedDaily(data: DailyResponse): void {
  try {
    localStorage.setItem(
      'daily_horoscope_cache',
      JSON.stringify({ date: dailyCacheKey(), data }),
    );
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function birthInputKey(birthData: BirthInput): string {
  return [
    birthData.date,
    birthData.time,
    birthData.tz,
    birthData.lat,
    birthData.lon,
  ].join('|');
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useFirstRunDaily(
  userId: string,
  birthData: BirthInput | null,
  soulprintSectors: number[] | null,
  quizSectors: number[],
  birthSign: string | null,
  customDate?: string, // YYYY-MM-DD
  locale: string = 'de-DE',
): UseFirstRunDailyResult {
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  // 2026-05-11 audit fix: stabilize quizSectors + soulprintSectors via
  // content-hash strings used in the dep array. Without this, callers
  // who pass inline `[]` / `[...]` literals cause a fresh array
  // reference on every render, which triggers the effect cleanup +
  // re-run cycle — and that race spuriously re-fetches even when the
  // logical content has not changed. Reading state to fire a retry is
  // bad enough; clobbering an in-flight error result is worse.
  const quizSectorsKey = quizSectors.join(',');
  const soulprintSectorsKey = soulprintSectors ? soulprintSectors.join(',') : 'null';
  const birthDataKey = birthData ? birthInputKey(birthData) : 'null';
  // 2026-05-11 audit fix: the success marker must be set AFTER a successful fetch /
  // cache-hit, not on entry. 2026-05-15 follow-up: key it by the full
  // logical request (date + locale + birth inputs + sectors + sign), not just
  // the date, so same-day dependency changes can fetch fresh content.
  const lastFetchedRequestKeyRef = useRef<string | null>(null);
  // 2026-05-11 audit fix: in-flight flag. Prevents React Strict Mode
  // double-mounts, unstable-deps re-renders (e.g. inline `[]` arrays
  // from callers), and rapid retry() calls from firing concurrent
  // fetches. Cleared in the finally branch so the next legitimate
  // trigger works.
  const inFlightRef = useRef<boolean>(false);
  // 2026-05-11 audit fix: per-fetch generation counter. Replaces the
  // local `cancelled` closure flag because that flag was getting set
  // spuriously by R2 effect re-runs (unstable deps + inline `[]`
  // arrays trigger cleanup which sets cancelled=true), even when the
  // in-flight guard then prevents R2 from initiating a real fetch.
  // The result: R1's async would suppress its own state updates even
  // though R1's fetch was still the canonical one. The generation
  // counter increments only when an effect actually starts a fetch,
  // so state updates only get suppressed when a NEW fetch took over.
  const fetchGenRef = useRef<number>(0);
  const activeRequestKeyRef = useRef<string | null>(null);
  const queuedRequestKeyRef = useRef<string | null>(null);
  const [queuedFetchTick, setQueuedFetchTick] = useState(0);
  // Bumped by retry() to force the effect to re-run even when the
  // dependency array is identical.
  const [retryTick, setRetryTick] = useState(0);

  // ── Fetch logic — extracted to a callback so the 06:00 listener below
  //    can reuse it without duplicating ~80 LOC.
  //
  //    Cancellation moved from `let cancelled` (closure flag) to AbortSignal
  //    so the same callback can be invoked from both the mount-effect and
  //    the listener, each with their own cancellation handle. The signal is
  //    forwarded into fetchDailyExperience → authedFetch → fetch() so an
  //    aborted controller actually cancels the in-flight network request
  //    (F3 of docs/plans/2026-05-09-sustainable-findings-cleanup.md).
  const runDailyFetch = useCallback(async (opts: { signal?: AbortSignal } = {}) => {
    const now = new Date();
    const currentHour = now.getHours();
    const activeWindowKey = dailyCacheKey();
    const isTodayTarget = !customDate || customDate === activeWindowKey;
    // Deliberate delivery window: modal auto-open is suppressed outside 06:00–17:59 local time.
    // Rationale: daily content is morning-oriented; late-night auto-open is disruptive.
    // Note: Dashboard.tsx currently does NOT consume `showModal` (Wireframe F3 decision —
    // auto-open is disabled entirely). This guard therefore has no active effect, but is
    // retained so the behaviour can be re-enabled cleanly when/if auto-open is restored.
    // Decision 2026-05-06: keep guard, do not remove (Option B confirmed by Ben).
    const isWithinDeliveryWindow = currentHour >= 6 && currentHour < 18;
    const targetDate = customDate || activeWindowKey;

    // Guard: need userId + birthData; soulprint can be null (synthetic fallback).
    if (!userId || !birthData) return;

    const requestKey = [
      userId,
      targetDate,
      birthDataKey,
      soulprintSectorsKey,
      quizSectorsKey,
      birthSign ?? '',
      locale,
    ].join('::');

    // Avoid re-fetching the same logical daily request — but only when the
    // previous attempt for these exact inputs succeeded. A same-day change to
    // locale, birth data, sectors, or sign must not be blocked by a date-only
    // marker.
    if (requestKey === lastFetchedRequestKeyRef.current) return;

    // 2026-05-15 review fix: if a meaningful dependency changes while a
    // request is in flight, invalidate the older generation and queue exactly
    // one follow-up fetch for the latest request key. Duplicate retry()/Strict
    // Mode reruns for the active key are still debounced.
    if (inFlightRef.current) {
      if (requestKey !== activeRequestKeyRef.current) {
        queuedRequestKeyRef.current = requestKey;
        fetchGenRef.current += 1;
      }
      return;
    }

    inFlightRef.current = true;
    activeRequestKeyRef.current = requestKey;
    queuedRequestKeyRef.current = null;

    // 2026-05-11 audit fix: capture our generation. State updates and
    // the loading toggle only fire if our generation is still current,
    // i.e. no LATER effect run actually started a competing fetch. R2
    // effect runs that get short-circuited by the in-flight guard do
    // NOT bump the generation, so R1's state updates still fire.
    const myGen = ++fetchGenRef.current;
    const isCurrent = () => fetchGenRef.current === myGen;

    // I-1 from the 2026-05-11 PR #343 review: snapshot the live arrays
    // at effect-entry so the async body uses the same content the
    // dep-hash was computed from. This makes the relationship between
    // `quizSectorsKey` / `soulprintSectorsKey` (in the dep array) and
    // `quizSectors` / `soulprintSectors` (read inside the IIFE)
    // explicit, and lets us drop the eslint-disable on the dep array.
    //
    // Contract: callers who pass a NEW array reference (different
    // content) get a re-fetch with the new content — BUT only on a
    // NEW target date (lastFetchedDateRef guard above short-circuits
    // same-day re-fetches regardless of quiz content). Callers who
    // mutate an array in place after render WITHOUT re-rendering get
    // undefined behavior — that's a React anti-pattern and we don't
    // support it.
    const quizSectorsSnapshot = quizSectors;
    const soulprintSectorsSnapshot = soulprintSectors;

    (async () => {
      // Controls ONLY the auto-open modal — dailyData is ALWAYS loaded
      // because the inline DashboardTagesEnergie section needs it regardless.
      let alreadySeen = false;

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('daily_modal_seen_date')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('[useFirstRunDaily] Profile query failed, showing modal:', profileError.message);
          alreadySeen = false;
        } else if (profile?.daily_modal_seen_date === targetDate) {
          alreadySeen = true;
        }

        if (!isCurrent()) return;

        // 2. Check localStorage cache — serves BOTH inline display and modal.
        // Only cache for the active 06:00 day-window.
        const isToday = targetDate === activeWindowKey;
        if (isToday) {
          const cached = getCachedDaily(requestKey);
          if (cached) {
            setDailyData(cached);
            setError(null);
            lastFetchedRequestKeyRef.current = requestKey;
            if (!alreadySeen && isWithinDeliveryWindow) setShowModal(true);
            return;
          }
        }

        // 3. Fetch fresh daily experience — needed for inline TagesEnergie
        // Compute today's transit influences (client-side ephemeris)
        const rawInfluences = birthSign ? computeTodayPlanetInfluences(birthSign) : null;
        const transitInfluences: TransitInfluenceInput[] = rawInfluences
          ? Object.entries(rawInfluences).map(([planet, inf]) => ({
              planet,
              aspectDeg: inf.aspectDeg,
              fieldStrength: inf.fieldStrength,
              isResonant: inf.isResonant,
            }))
          : [];

        setLoading(true);
        const data = await fetchDailyExperience(
          birthData,
          soulprintSectorsSnapshot ?? Array(12).fill(0.5),
          quizSectorsSnapshot,
          targetDate,
          locale,
          transitInfluences,
          birthSign ?? '',
        );

        if (!isCurrent()) return;

        if (isToday) setCachedDaily(data, requestKey);
        setDailyData(data);
        setError(null);
        lastFetchedRequestKeyRef.current = requestKey;
        if (!alreadySeen && (!isTodayTarget || isWithinDeliveryWindow)) setShowModal(true);
      } catch (err) {
        // Phase G (KILL ALL PLACEHOLDERS): no synthesized fallback content.
        // On API failure, dailyData stays null and `error` is set. Components
        // that consume the hook handle null gracefully — the impuls section
        // simply does not render rather than displaying generic placeholder text.
        const message = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string } | null)?.code ?? 'unavailable';
        console.warn('[useFirstRunDaily] daily fetch failed:', message);
        if (isCurrent()) {
          setDailyData(null);
          setError({ code, message });
          // 2026-05-11 audit fix: clear the date marker so a subsequent
          // dependency change or retry() can re-fetch. Without this the
          // failed attempt would block the rest of the day.
          lastFetchedRequestKeyRef.current = null;
        }
      } finally {
        const hasQueuedFollowUp = queuedRequestKeyRef.current !== null;
        if (isCurrent() && !hasQueuedFollowUp) setLoading(false);
        activeRequestKeyRef.current = null;
        inFlightRef.current = false;
        if (hasQueuedFollowUp) {
          setQueuedFetchTick((tick) => tick + 1);
        }
      }
    })();
    // Note: quizSectors and soulprintSectors are NOT in the dep array
    // directly — their content-hash keys are. The effect snapshots the
    // live arrays at entry (see quizSectorsSnapshot /
    // soulprintSectorsSnapshot above) so the body uses the same content
    // the hash was computed from. ESLint's exhaustive-deps no longer
    // fires because the body only reads the snapshots, not the live
    // refs, after effect entry.
  }, [userId, birthData, soulprintSectorsKey, quizSectorsKey, birthSign, customDate, locale, retryTick]);

  const retry = useCallback(() => {
    // I-2 from the 2026-05-11 PR #343 review: retry() is a no-op when
    // there's nothing to recover from. Prevents accidental clicks on
    // a future Retry button from spending an extra LLM call while the
    // user already has valid data on screen.
    //
    // Guard interpretation: "healthy" = has data AND no error AND not
    // currently loading. Any of those being off → recovery is plausibly
    // wanted and we let it through.
    if (loading) return;
    if (!error && dailyData !== null) return;
    // Belt and braces: the catch block already clears the marker, but a
    // defensive clear here means retry() works even if some future code
    // path forgets to clear it. The state bump forces the effect to
    // re-run when nothing else in the deps array changed.
    lastFetchedRequestKeyRef.current = null;
    setError(null);
    setRetryTick((t) => t + 1);
  }, [loading, error, dailyData]);

  // Mount-fetch: run when deps change. Reuses the callback above.
  useEffect(() => {
    const ac = new AbortController();
    runDailyFetch({ signal: ac.signal });
    return () => ac.abort();
  }, [runDailyFetch]);

  // ── 06:00 day-window listener ─────────────────────────────────────────
  // Per project doctrine 2026-05-08 + user requirement: "Morgens um 6 Uhr
  // muss es automatisch auf das neue Tageshoroskop wechseln." This effect
  // schedules a single setTimeout that fires at the next 06:00 LOCAL time,
  // resets the dedupe ref, clears the (now-stale) cache, and re-invokes
  // runDailyFetch so the dashboard rolls onto the new day-window without
  // a page reload. The setTimeout is short enough (≤24 h) for setTimeout's
  // 32-bit integer ms range to hold without rollover.
  useEffect(() => {
    const now = new Date();
    const next6am = new Date(now);
    next6am.setHours(6, 0, 0, 0);
    if (now.getTime() >= next6am.getTime()) {
      next6am.setDate(next6am.getDate() + 1);
    }
    const msUntilNext6am = next6am.getTime() - now.getTime();

    const timer = setTimeout(() => {
      // Clear the localStorage cache: at this point dailyCacheKey() has
      // rotated to the new day-window, so the existing entry would no
      // longer match anyway. Removing it explicitly keeps localStorage
      // tidy and avoids stale data lingering across user-tab visits.
      localStorage.removeItem('daily_horoscope_cache');
      // Reset the dedupe ref so runDailyFetch's `targetDate ===
      // lastFetchedDateRef.current` guard releases.
      lastFetchedDateRef.current = null;
      // Reset state so consumers see the loading transition cleanly.
      setDailyData(null);
      // Trigger the refetch. No AbortSignal here — if the component
      // unmounts mid-fetch, React 18 silently ignores the state updates.
      runDailyFetch();
    }, msUntilNext6am);

    return () => clearTimeout(timer);
  }, [runDailyFetch]);

  const handleClose = useCallback(() => {
    setShowModal(false);

    // Mark the active 06:00 day-window as seen in profiles (fire-and-forget).
    const today = dailyCacheKey();
    supabase
      .from('profiles')
      .update({ daily_modal_seen_date: today })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) console.warn('[useFirstRunDaily] Failed to mark seen:', error);
      });
  }, [userId]);

  const dayHarmonic = useMemo<DayHarmonicState | null>(() => {
    const h = dailyData?.fusion?.harmony_index;
    return h !== undefined ? computeDayHarmonic(h) : null;
  }, [dailyData]);

  const nightHarmonic = useMemo<DayHarmonicState | null>(() => {
    const nh = dailyData?.fusion?.night_harmony_index;
    return nh !== undefined ? computeNightHarmonic(nh) : null;
  }, [dailyData]);

  return { dailyData, dayHarmonic, nightHarmonic, showModal, loading, error, handleClose, retry };
}
