import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export type TourStep = 0 | 1 | 'done';

function safeStorage(op: () => void): void {
  try { op(); } catch (err) {
    console.warn('[Tour] localStorage unavailable:', err instanceof Error ? err.message : err);
  }
}

export function useDashboardTour(userId: string | undefined) {
  const [tourStep, setTourStep] = useState<TourStep | null>(null); // null = loading
  const [persistError, setPersistError] = useState<string | null>(null);

  // Fetch tour_completed from profiles
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    // Check localStorage fallback first
    let tourDone = false;
    safeStorage(() => {
      if (localStorage.getItem('bazodiac_tour_completed') === 'true') {
        tourDone = true;
      }
    });
    if (tourDone) {
      setTourStep('done');
      return;
    }

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
      if (prev === 1) {
        // Persist completion
        if (userId) {
          supabase.from('profiles').update({ tour_completed: true }).eq('id', userId)
            .then(({ error }) => {
              if (error) {
                console.error('[tour] persist failed:', error.message);
                setPersistError(error.message);
              }
            });
        }
        safeStorage(() => localStorage.setItem('bazodiac_tour_completed', 'true'));
        return 'done';
      }
      return (prev + 1) as TourStep;
    });
  }, [userId]);

  const skip = useCallback(() => {
    if (userId) {
      supabase.from('profiles').update({ tour_completed: true }).eq('id', userId)
        .then(({ error }) => {
          if (error) {
            console.warn('[tour] persist failed:', error.message);
            setPersistError(error.message);
          }
        });
    }
    safeStorage(() => localStorage.setItem('bazodiac_tour_completed', 'true'));
    setTourStep('done');
  }, [userId]);

  const restart = useCallback(() => {
    if (userId) {
      supabase.from('profiles').update({ tour_completed: false }).eq('id', userId)
        .then(({ error }) => { if (error) console.warn('[tour] restart persist failed:', error.message); });
    }
    safeStorage(() => localStorage.removeItem('bazodiac_tour_completed'));
    setTourStep(0);
  }, [userId]);

  return {
    tourStep: tourStep ?? 'done', // treat loading as done to avoid flash
    isLoading: tourStep === null,
    persistError,
    next,
    skip,
    restart,
  };
}

/**
 * Pure visibility predicate for the dashboard tour overlay.
 *
 * - Step 0 (planet section): always visible — anchor is near the top.
 * - Step 1 (levi/agents): visible only after the sentinel has scrolled
 *   into view. Without that gate the overlay would render off-screen.
 * - 'done' (tour completed): NEVER visible. Previously this branch
 *   returned true, which kept the overlay on screen forever after
 *   completion (DEVELOPMENT_BRIEF TASK-1.1).
 */
export function isTourStepVisible(
  tourStep: TourStep,
  scrollReached: ReadonlySet<number>,
): boolean {
  if (tourStep === 0) return true;
  if (tourStep === 1) return scrollReached.has(1);
  return false; // 'done' or any future terminal state
}
