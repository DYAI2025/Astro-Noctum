import { useMemo } from 'react';
import { QUIZ_DEFINITIONS } from '@bazodiac/shared';
import type { QuizDefinition } from '@bazodiac/shared';

/**
 * Picks one quiz per day that the user hasn't completed yet.
 * The selection is stable for the entire day (based on day-of-year).
 * Returns null if all quizzes are completed.
 */
export function useQuizOfTheDay(completedIds: Record<string, boolean>): QuizDefinition | null {
  return useMemo(() => {
    // Only standalone quizzes (not series, not premium)
    const available = QUIZ_DEFINITIONS.filter(
      q => !q.seriesId && !q.premium && !completedIds[q.id]
    );

    if (available.length === 0) return null;

    // Stable daily selection based on day of year
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % available.length;

    return available[index];
  }, [completedIds]);
}
