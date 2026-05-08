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
  /**
   * Non-null when the most recent fetch attempt failed. UI consumes via
   * DailyChartHero.error to render `[CODE] message` prominently.
   * Cleared on next successful fetch. Per project doctrine 2026-05-08:
   * no synthetic fallbacks — failures must be visible.
   *
   * Currently always null in this commit (Task 1.11). Task 1.12 wires
   * the catch-block to classify failures and call setError.
   */
  error: { code: string; message: string } | null;
  handleClose: () => void;
}

// ── Cache key helper ──────────────────────────────────────────────────

// Returns the LOCAL calendar date as YYYY-MM-DD.
// toISOString() returns UTC — in any timezone ahead of UTC, that would
// still show yesterday's date after local midnight.
//
// @deprecated Prefer dailyCacheKey() — it honors the 06:00 local-time
// day-window boundary that matches user expectations ("today's horoscope"
// = waking day, not calendar day). todayKey is kept until Task 1.6 has
// migrated all consumers.
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

// ── Local fallback ────────────────────────────────────────────────────

/**
 * Local fallback daily data when FuFirE/Gemini is unreachable.
 * Provides a deterministic day-mode signal so DashboardTagesEnergie always renders.
 */
export function buildFallbackDaily(locale: string = 'de'): DailyResponse {
  const today = todayKey();
  const dateHash = today.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const harmony = 0.3 + (dateHash % 40) / 100;
  const mode: 'pulse' | 'trace' = harmony >= 0.50 ? 'trace' : 'pulse';

  const synthesisDe = mode === 'pulse'
    ? 'Heute fließt deine Energie ruhig und gleichmäßig. Ein guter Tag, um innezuhalten und zu beobachten.'
    : 'Die kosmischen Linien kreuzen sich heute \u2014 etwas bewegt sich. Sei aufmerksam für unerwartete Impulse.';
  const synthesisEn = mode === 'pulse'
    ? 'Your energy flows calmly today. A good day to pause and observe.'
    : 'Cosmic lines cross today \u2014 something is stirring. Stay alert for unexpected impulses.';

  const text = locale.startsWith('en') ? synthesisEn : synthesisDe;
  const action = locale.startsWith('en') ? 'Take a moment of stillness.' : 'Nimm dir einen Moment der Stille.';

  const emptySection = { summary: '', themes: [] as string[], caution: '', opportunity: '', evidence: {} };

  return {
    date: today,
    western: emptySection,
    eastern: emptySection,
    fusion: {
      summary: text,
      synthesis: text,
      action,
      pushworthy: false,
      push_text: '',
      harmony_index: harmony,
      day_mode: mode,
    },
    meta: { engine_version: 'v1-local-fallback' },
  } as DailyResponse;
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
  // Error state — populated by Task 1.12's catch-block classifier.
  // For now always null; the wire is in place so Dashboard.tsx can already
  // consume it (Task 1.11 wiring).
  const [error] = useState<{ code: string; message: string } | null>(null);
  const lastFetchedDateRef = useRef<string | null>(null);

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
    // Also avoid re-fetching the same date.
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
    lastFetchedDateRef.current = targetDate;

    let cancelled = false;

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

        if (cancelled) return;

        // 2. Check localStorage cache — serves BOTH inline display and modal.
        // Only cache for today's date.
        const isToday = targetDate === todayKey();
        if (isToday) {
          const cached = getCachedDaily();
          if (cached) {
            setDailyData(cached);
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

        if (cancelled) return;

        if (isToday) setCachedDaily(data);
        setDailyData(data);
        if (!alreadySeen && (!isTodayTarget || isWithinDeliveryWindow)) setShowModal(true);
      } catch (err) {
        // Graceful fallback: use local deterministic daily so DashboardTagesEnergie always renders
        console.warn('[useFirstRunDaily] Error occurred, using local fallback:', err);
        if (!cancelled) {
          const fallback = buildFallbackDaily();
          // Adjust fallback date to target
          fallback.date = targetDate;
          setDailyData(fallback);
          if (!alreadySeen && (!isTodayTarget || isWithinDeliveryWindow)) setShowModal(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, birthData, soulprintSectors, quizSectors, birthSign, customDate, locale]);

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

  return { dailyData, dayHarmonic, nightHarmonic, showModal, loading, error, handleClose };
}
