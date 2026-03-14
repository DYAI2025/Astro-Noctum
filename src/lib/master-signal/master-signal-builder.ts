import type { ApiData } from '@/src/types/bafe';
import type { ContributionEvent } from '@/src/lib/lme/types';
import type { MasterSignal } from './types';
import { projectNatal } from './natal-projection';
import { projectQuiz } from './quiz-projection';
import { buildGCB } from './gcb-builder';
import { computeRelations } from './cross-reference';
import { generateNarratives } from './narratives';

export function buildMasterSignal(
  apiData: ApiData, quizEvents: ContributionEvent[],
  birthYear: number, lang: 'de' | 'en' = 'de',
): MasterSignal {
  const natal = projectNatal(apiData);
  const quiz = projectQuiz(quizEvents);
  const gcbRaw = buildGCB(birthYear);

  const gcbSignal = {
    signal_type: 'generational_context' as const,
    dimensions: gcbRaw.baseline_vector,
    projection_mode: 'heuristic_v1' as const,
    coverage: 1,
  };

  const relations = computeRelations(natal, quiz, gcbSignal);
  const narratives = generateNarratives(natal, quiz, gcbSignal, relations, lang);

  return {
    subsignals: { natal, quiz, generational_context: gcbSignal },
    relations,
    narratives,
    metadata: {
      dimension_space: '5d_heuristic_v1',
      weights_mode: 'experimental_v1',
      evidence_mode: gcbRaw.evidence_mode,
      computed_at: new Date().toISOString(),
    },
  };
}
