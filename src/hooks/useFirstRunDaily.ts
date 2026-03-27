import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { fetchDailyExperience } from '../services/experience';
import type { DailyResponse } from '../lib/schemas/experience';
import {
  type DayHarmonicState,
  computeDayHarmonic,
} from '../lib/fusion-ring/day-harmonic';

// ── Types ────────────────────────────────────────────────────────────

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

// ── Cache key helper ─────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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

// ── Hook ─────────────────────────────────────────────────────────────

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
      try {
        // 1. Check if user already dismissed the modal today
        const { data: profile } = await supabase
          .from('profiles')
          .select('daily_modal_seen_date')
          .eq('id', userId)
          .single();

        if (cancelled) return;
        // Daily recurrence: show modal once per calendar day.
        // daily_modal_seen_date stores the last date the user dismissed the modal.
        const todayDate = todayKey();
        if (profile?.daily_modal_seen_date === todayDate) return;

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
        console.error('[useFirstRunDaily] Failed:', err);
        // Silently fail — daily modal is non-critical
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
