import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export type TourStep = 0 | 1 | 2 | 3 | 'done';

export function useDashboardTour(userId: string | undefined) {
  const [tourStep, setTourStep] = useState<TourStep | null>(null); // null = loading

  // Fetch tour_completed from profiles
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    // Check localStorage fallback first
    try {
      if (localStorage.getItem('bazodiac_tour_completed') === 'true') {
        setTourStep('done');
        return;
      }
    } catch {}

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('tour_completed')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        // On network/schema error, skip the tour to avoid blocking the UI
        console.warn('[tour] fetch failed, skipping tour:', error.message);
        setTourStep('done');
        return;
      }
      setTourStep(data?.tour_completed ? 'done' : 0);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const next = useCallback(() => {
    setTourStep((prev) => {
      if (prev === null || prev === 'done') return prev;
      if (prev === 3) {
        // Persist completion
        if (userId) {
          supabase.from('profiles').update({ tour_completed: true }).eq('id', userId)
            .then(({ error }) => { if (error) console.warn('[tour] persist failed:', error.message); });
        }
        try { localStorage.setItem('bazodiac_tour_completed', 'true'); } catch {}
        return 'done';
      }
      return (prev + 1) as TourStep;
    });
  }, [userId]);

  const skip = useCallback(() => {
    if (userId) {
      supabase.from('profiles').update({ tour_completed: true }).eq('id', userId)
        .then(({ error }) => { if (error) console.warn('[tour] persist failed:', error.message); });
    }
    try { localStorage.setItem('bazodiac_tour_completed', 'true'); } catch {}
    setTourStep('done');
  }, [userId]);

  const restart = useCallback(() => {
    if (userId) {
      supabase.from('profiles').update({ tour_completed: false }).eq('id', userId)
        .then(({ error }) => { if (error) console.warn('[tour] restart persist failed:', error.message); });
    }
    try { localStorage.removeItem('bazodiac_tour_completed'); } catch {}
    setTourStep(0);
  }, [userId]);

  return {
    tourStep: tourStep ?? 'done', // treat loading as done to avoid flash
    isLoading: tourStep === null,
    next,
    skip,
    restart,
  };
}
