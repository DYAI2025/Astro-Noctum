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

// Returns the LOCAL calendar date as YYYY-MM-DD.
// toISOString() returns UTC — in any timezone ahead of UTC, that would
// still show yesterday's date after local midnight.
export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCachedDaily(): DailyResponse | null {
  try {
    const raw = localStorage.getItem('daily_horoscope_cache');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.date === todayKey() && parsed?.data) {
      return parsed.data as DailyResponse;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedDaily(data: DailyResponse): void {
  try {
    localStorage.setItem(
      'daily_horoscope_cache',
      JSON.stringify({ date: todayKey(), data }),
    );
  } catch {
    // localStorage full or unavailable — ignore
  }
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
  // 2026-05-11 audit fix: the ref must be set AFTER a successful fetch /
  // cache-hit, not on entry. Setting it on entry poisoned the guard
  // forever when the fetch failed (network drop, 401, 503, schema
  // mismatch) — the user lost daily content for the rest of the day.
  const lastFetchedDateRef = useRef<string | null>(null);
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
  // Bumped by retry() to force the effect to re-run even when the
  // dependency array is identical.
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const isTodayTarget = !customDate || customDate === todayKey();
    // Deliberate delivery window: modal auto-open is suppressed outside 06:00–17:59 local time.
    // Rationale: daily content is morning-oriented; late-night auto-open is disruptive.
    // Note: Dashboard.tsx currently does NOT consume `showModal` (Wireframe F3 decision —
    // auto-open is disabled entirely). This guard therefore has no active effect, but is
    // retained so the behaviour can be re-enabled cleanly when/if auto-open is restored.
    // Decision 2026-05-06: keep guard, do not remove (Option B confirmed by Ben).
    const isWithinDeliveryWindow = currentHour >= 6 && currentHour < 18;
    const targetDate = customDate || todayKey();

    // Guard: need userId + birthData; soulprint can be null (synthetic fallback).
    // Also avoid re-fetching the same date — but ONLY when the previous
    // attempt succeeded. The ref is cleared in the catch below so a
    // failed attempt does NOT block a future retry triggered by either
    // (a) a dep change such as locale or soulprint update or
    // (b) the explicit retry() callback.
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
    // 2026-05-11 audit fix: in-flight guard. Without it React Strict
    // Mode's double-mount in development fires two simultaneous fetches,
    // and a user mashing retry() during the first fetch fires more.
    // Also defeats unstable-deps races where consumer passes inline `[]`
    // arrays that re-trigger the effect on every render.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // 2026-05-11 audit fix: capture our generation. State updates and
    // the loading toggle only fire if our generation is still current,
    // i.e. no LATER effect run actually started a competing fetch. R2
    // effect runs that get short-circuited by the in-flight guard do
    // NOT bump the generation, so R1's state updates still fire.
    const myGen = ++fetchGenRef.current;
    const isCurrent = () => fetchGenRef.current === myGen;

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
        // Only cache for today's date.
        const isToday = targetDate === todayKey();
        if (isToday) {
          const cached = getCachedDaily();
          if (cached) {
            setDailyData(cached);
            setError(null);
            lastFetchedDateRef.current = targetDate;
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
          soulprintSectors ?? Array(12).fill(0.5),
          quizSectors,
          targetDate,
          locale,
          transitInfluences,
          birthSign ?? '',
        );

        if (!isCurrent()) return;

        if (isToday) setCachedDaily(data);
        setDailyData(data);
        setError(null);
        lastFetchedDateRef.current = targetDate;
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
          lastFetchedDateRef.current = null;
        }
      } finally {
        if (isCurrent()) setLoading(false);
        inFlightRef.current = false;
      }
    })();
    // Note: quizSectors and soulprintSectors are NOT in the dep array
    // directly — their content-hash keys are. See comment near the keys
    // for the rationale. The hook body still reads the live arrays, so
    // the latest values are used inside the effect when it runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    lastFetchedDateRef.current = null;
    setError(null);
    setRetryTick((t) => t + 1);
  }, [loading, error, dailyData]);

  const handleClose = useCallback(() => {
    setShowModal(false);

    // Mark today's date as seen in profiles (fire-and-forget)
    const today = todayKey();
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
