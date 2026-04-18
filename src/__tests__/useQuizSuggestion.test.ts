import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pickSuggestion } from '@/src/hooks/useQuizSuggestion';
import { CLUSTER_REGISTRY } from '@/src/lib/signatur/clusters';

describe('pickSuggestion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when all modules are completed', () => {
    const allModules = new Set(CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds));
    expect(pickSuggestion(allModules)).toBeNull();
  });

  it('returns null when already suggested today', () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('bazodiac_quiz_last_suggestion', today);
    expect(pickSuggestion(new Set())).toBeNull();
  });

  it('returns a moduleId from open modules when RNG hits and not yet suggested today', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const completed = new Set(['quiz.aura_colors.v1']);
    const result = pickSuggestion(completed);
    expect(result).toBeTruthy();
    expect(completed.has(result!)).toBe(false);
    const today = new Date().toISOString().slice(0, 10);
    expect(localStorage.getItem('bazodiac_quiz_last_suggestion')).toBe(today);
    vi.restoreAllMocks();
  });

  it('returns null when RNG misses (> 0.3)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = pickSuggestion(new Set());
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });
});
