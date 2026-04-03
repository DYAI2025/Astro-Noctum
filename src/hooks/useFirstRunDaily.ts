import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { fetchDailyExperience } from '../services/experience';
import type { DailyResponse } from '../lib/schemas/experience';
import {
  type DayHarmonicState,
  computeDayHarmonic,
} from '../lib/fusion-ring/day-harmonic';

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
  showModal: boolean;
  loading: boolean;
  handleClose: () => void;
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
): UseFirstRunDailyResult {
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Guard: need all inputs
    if (!userId || !birthData || !soulprintSectors || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;

    (async () => {
      const todayDate = todayKey();

      try {
        // 1. Check if user already dismissed the modal today
        // Graceful fallback: if query fails (e.g. column doesn't exist),
        // assume modal was NOT seen and show it
        let alreadySeen = false;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('daily_modal_seen_date')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('[useFirstRunDaily] Profile query failed, showing modal:', profileError.message);
          alreadySeen = false;
        } else if (profile?.daily_modal_seen_date === todayDate) {
          alreadySeen = true;
        }

        if (cancelled) return;
        if (alreadySeen) return;

        // 2. Check localStorage cache
        const cached = getCachedDaily();
        if (cached) {
          setDailyData(cached);
          setShowModal(true);
          return;
        }

        // 3. Fetch fresh daily experience
        setLoading(true);
        const data = await fetchDailyExperience(
          birthData,
          soulprintSectors,
          quizSectors,
          todayDate,
        );

        if (cancelled) return;

        setCachedDaily(data);
        setDailyData(data);
        setShowModal(true);
      } catch (err) {
        // Graceful fallback: on any error, show the modal anyway
        // This ensures the modal appears even if the DB column is missing
        console.warn('[useFirstRunDaily] Error occurred, showing modal:', err);
        if (!cancelled) {
          setShowModal(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, birthData, soulprintSectors, quizSectors]);

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

  return { dailyData, dayHarmonic, showModal, loading, handleClose };
}
