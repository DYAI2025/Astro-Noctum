import type { ProjectedSignal, RelationScores } from './types';
import { cosineSimilarity } from './dimensions';

/**
 * Cross-Reference Engine
 *
 * GCB remains context, not core identity.
 * overall_integration = 0.50·alignment(N,Q) + 0.25·alignment(N,G) + 0.25·alignment(Q,G)
 * Weights labeled experimental_v1.
 */

const W_NQ = 0.50;
const W_NG = 0.25;
const W_QG = 0.25;

export function computeRelations(
  natal: ProjectedSignal,
  quiz: ProjectedSignal,
  gcb: ProjectedSignal,
): RelationScores {
  const alignment_nq = cosineSimilarity(natal.dimensions, quiz.dimensions);
  const alignment_ng = cosineSimilarity(natal.dimensions, gcb.dimensions);
  const alignment_qg = cosineSimilarity(quiz.dimensions, gcb.dimensions);

  const internal_coherence = alignment_nq;
  const context_fit = (alignment_ng + alignment_qg) / 2;
  const overall_integration = W_NQ * alignment_nq + W_NG * alignment_ng + W_QG * alignment_qg;

  return {
    alignment_nq,
    alignment_ng,
    alignment_qg,
    internal_coherence,
    context_fit,
    overall_integration: Math.max(0, Math.min(1, overall_integration)),
  };
}
