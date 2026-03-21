import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export type TourStep = 0 | 1 | 2 | 3 | 'done';

export function useDashboardTour(userId: string | undefined) {
  const [tourStep, setTourStep] = useState<TourStep | null>(null); // null = loading

  // Fetch tour_completed from profiles
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tour_completed')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;
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
          supabase.from('profiles').update({ tour_completed: true }).eq('id', userId);
        }
        return 'done';
      }
      return (prev + 1) as TourStep;
    });
  }, [userId]);

  const skip = useCallback(() => {
    if (userId) {
      supabase.from('profiles').update({ tour_completed: true }).eq('id', userId);
    }
    setTourStep('done');
  }, [userId]);

  return {
    tourStep: tourStep ?? 'done', // treat loading as done to avoid flash
    isLoading: tourStep === null,
    next,
    skip,
  };
}
