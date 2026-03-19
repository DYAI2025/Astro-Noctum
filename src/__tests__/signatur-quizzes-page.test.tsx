// src/__tests__/signatur-quizzes-page.test.tsx
import { describe, it, expect, vi } from 'vitest';

// Mock all heavy dependencies
vi.mock('@/src/hooks/useCompletedModules', () => ({
  useCompletedModules: () => ({
    completedModuleIds: new Set<string>(),
    loading: false,
    addModule: vi.fn(),
  }),
}));
vi.mock('@/src/hooks/useQuizSuggestion', () => ({
  useQuizSuggestion: () => null,
}));
vi.mock('@/src/hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: false, loading: false }),
}));
vi.mock('@/src/hooks/useQuizContribution', () => ({
  useQuizContribution: () => vi.fn(),
}));
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de' as const }),
}));
vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));
vi.mock('@/src/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }) },
}));
vi.mock('@/src/components/QuizOverlay', () => ({
  default: () => null,
}));

describe('SignaturQuizzesPage', () => {
  it('exports a default component', async () => {
    const mod = await import('@/src/pages/SignaturQuizzesPage');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});
