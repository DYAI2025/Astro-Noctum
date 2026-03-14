import type { ContributionEvent } from '@/src/lib/lme/types';
import type { ProjectedSignal, DimensionVector } from './types';
import { zeroDimensions, clampVector, DIMENSION_KEYS } from './dimensions';

/**
 * Quiz Projection — ContributionEvents → 5D dimension space
 *
 * Heuristic mappings (documented per spec):
 *   marker.domain → 5D dimension weights
 *   Missing data: unknown domains contribute equally at 0.2 each
 */

const DOMAIN_DIMENSION_MAP: Record<string, DimensionVector> = {
  love:       { passion: 0.5, stability: 0.1, future: 0.1, connection: 0.8, autonomy: 0.1 },
  emotion:    { passion: 0.4, stability: 0.2, future: 0.1, connection: 0.7, autonomy: 0.1 },
  eq:         { passion: 0.2, stability: 0.3, future: 0.2, connection: 0.8, autonomy: 0.2 },
  social:     { passion: 0.3, stability: 0.2, future: 0.3, connection: 0.6, autonomy: 0.3 },
  leadership: { passion: 0.3, stability: 0.3, future: 0.5, connection: 0.3, autonomy: 0.7 },
  cognition:  { passion: 0.1, stability: 0.3, future: 0.6, connection: 0.2, autonomy: 0.5 },
  skills:     { passion: 0.2, stability: 0.4, future: 0.5, connection: 0.2, autonomy: 0.5 },
  instinct:   { passion: 0.7, stability: 0.2, future: 0.1, connection: 0.3, autonomy: 0.6 },
  energy:     { passion: 0.6, stability: 0.3, future: 0.3, connection: 0.3, autonomy: 0.4 },
  creative:   { passion: 0.7, stability: 0.1, future: 0.4, connection: 0.3, autonomy: 0.6 },
  spiritual:  { passion: 0.3, stability: 0.5, future: 0.3, connection: 0.6, autonomy: 0.2 },
  flower:     { passion: 0.3, stability: 0.5, future: 0.2, connection: 0.6, autonomy: 0.2 },
  stone:      { passion: 0.2, stability: 0.6, future: 0.3, connection: 0.5, autonomy: 0.2 },
  aura:       { passion: 0.4, stability: 0.3, future: 0.3, connection: 0.6, autonomy: 0.3 },
  values:     { passion: 0.3, stability: 0.6, future: 0.5, connection: 0.4, autonomy: 0.3 },
  lifestyle:  { passion: 0.3, stability: 0.5, future: 0.4, connection: 0.4, autonomy: 0.4 },
  freedom:    { passion: 0.5, stability: 0.1, future: 0.4, connection: 0.2, autonomy: 0.8 },
};

const FALLBACK_DIMENSION: DimensionVector = {
  passion: 0.2, stability: 0.2, future: 0.2, connection: 0.2, autonomy: 0.2,
};

function extractDomain(markerId: string): string {
  const parts = markerId.split('.');
  return parts.length >= 2 ? parts[1] : 'unknown';
}

export function projectQuiz(events: ContributionEvent[]): ProjectedSignal {
  if (events.length === 0) {
    return { signal_type: 'quiz', dimensions: zeroDimensions(), projection_mode: 'heuristic_v1', coverage: 0 };
  }

  const accumulated = zeroDimensions();
  let totalWeight = 0;

  for (const event of events) {
    for (const marker of event.payload.markers) {
      const domain = extractDomain(marker.id);
      const affinities = DOMAIN_DIMENSION_MAP[domain] ?? FALLBACK_DIMENSION;
      const w = marker.weight * (marker.evidence?.confidence ?? 0.7);
      for (const k of DIMENSION_KEYS) {
        accumulated[k] += affinities[k] * w;
      }
      totalWeight += w;
    }
  }

  if (totalWeight === 0) {
    return { signal_type: 'quiz', dimensions: zeroDimensions(), projection_mode: 'heuristic_v1', coverage: 0 };
  }

  for (const k of DIMENSION_KEYS) {
    accumulated[k] /= totalWeight;
  }

  const maxQuizzes = 22;
  const coverage = Math.min(1, events.length / maxQuizzes);

  return { signal_type: 'quiz', dimensions: clampVector(accumulated), projection_mode: 'heuristic_v1', coverage };
}
