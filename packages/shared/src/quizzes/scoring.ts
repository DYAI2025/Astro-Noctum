import type { QuizDefinition, QuizProfile } from './schema';

export interface QuizResult {
  quizId: string;
  profileId: string;
  profile: QuizProfile;
  dimensionScores: Record<string, number>;
  answers: Record<string, string>;
}

export function scoreQuiz(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): QuizResult {
  switch (quiz.scoringModel) {
    case 'profile-driven':
      return scoreProfileDriven(quiz, answers);
    case 'multi-dimension':
    case 'categorical':
      return scoreDimensional(quiz, answers);
    default: {
      const unknownModel: never = quiz.scoringModel;
      throw new Error(`Unsupported scoring model: ${unknownModel}`);
    }
  }
}

function scoreProfileDriven(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): QuizResult {
  if (quiz.profiles.length === 0) {
    throw new Error(`Quiz "${quiz.id}" has no profiles configured.`);
  }

  const votes: Record<string, number> = {};

  for (const q of quiz.questions) {
    const selectedId = answers[q.id];
    const option = q.options.find(o => o.id === selectedId);
    if (option?.profileId) {
      votes[option.profileId] = (votes[option.profileId] || 0) + 1;
    }
  }

  let maxVotes = 0;
  let winnerId = quiz.profiles[0]?.id ?? '';
  for (const [pid, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = pid;
    }
  }

  const profile = quiz.profiles.find(p => p.id === winnerId) ?? quiz.profiles[0];

  return {
    quizId: quiz.id,
    profileId: winnerId,
    profile,
    dimensionScores: votes,
    answers,
  };
}

function scoreDimensional(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): QuizResult {
  if (quiz.profiles.length === 0) {
    throw new Error(`Quiz "${quiz.id}" has no profiles configured.`);
  }

  const scores: Record<string, number> = {};

  for (const q of quiz.questions) {
    const selectedId = answers[q.id];
    const option = q.options.find(o => o.id === selectedId);
    if (option?.scores) {
      for (const [dim, val] of Object.entries(option.scores)) {
        scores[dim] = (scores[dim] || 0) + val;
      }
    }
  }

  // Match profiles by thresholds (priority order)
  const sorted = [...quiz.profiles].sort(
    (a, b) => (a.priority ?? 99) - (b.priority ?? 99),
  );

  for (const profile of sorted) {
    if (!profile.thresholds) continue;
    const matches = Object.entries(profile.thresholds).every(
      ([dim, min]) => (scores[dim] ?? 0) >= min,
    );
    if (matches) {
      return { quizId: quiz.id, profileId: profile.id, profile, dimensionScores: scores, answers };
    }
  }

  // Fallback: last profile in priority order
  const fallback = sorted[sorted.length - 1] ?? quiz.profiles[0];
  return { quizId: quiz.id, profileId: fallback.id, profile: fallback, dimensionScores: scores, answers };
}
