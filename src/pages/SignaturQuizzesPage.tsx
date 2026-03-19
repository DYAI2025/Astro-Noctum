// src/pages/SignaturQuizzesPage.tsx
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useCompletedModules } from '@/src/hooks/useCompletedModules';
import { useQuizSuggestion } from '@/src/hooks/useQuizSuggestion';
import { usePremium } from '@/src/hooks/usePremium';
import { useQuizContribution } from '@/src/hooks/useQuizContribution';
import { ClusterSidebar } from '@/src/components/signatur/ClusterSidebar';
import QuizOverlay from '@/src/components/QuizOverlay';
import type { ContributionEvent } from '@/src/lib/lme/types';

export default function SignaturQuizzesPage() {
  const { t, lang } = useLanguage();
  const { isPremium } = usePremium();
  const { completedModuleIds, addModule } = useCompletedModules();
  const suggestedModule = useQuizSuggestion(completedModuleIds);
  const quizContribution = useQuizContribution(completedModuleIds);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  const handleQuizComplete = useCallback((event: ContributionEvent) => {
    quizContribution(event);
    const moduleId = event.source?.moduleId;
    if (moduleId) addModule(moduleId);
    setActiveQuiz(null);
  }, [quizContribution, addModule]);

  return (
    <div className="relative min-h-screen w-full bg-[#020509] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(212,175,55,0.2),transparent_42%)]" />

      <section className="relative mx-auto max-w-lg px-4 pb-24 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link
            to="/signatur"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {lang === 'de' ? 'Signatur' : 'Signature'}
          </Link>
        </header>

        <h1 className="mb-2 font-serif text-2xl text-[#D4AF37]">
          {lang === 'de' ? 'Quiz-Cluster' : 'Quiz Clusters'}
        </h1>
        <p className="mb-6 text-sm text-white/60">
          {lang === 'de'
            ? 'Beantworte Quizze, um deine Signatur zu formen.'
            : 'Answer quizzes to shape your signature.'}
        </p>

        <ClusterSidebar
          completedModuleIds={completedModuleIds}
          onStartQuiz={setActiveQuiz}
          isPremium={isPremium}
          lang={lang}
          suggestedModule={suggestedModule}
        />
      </section>

      <QuizOverlay
        quizId={activeQuiz}
        onComplete={handleQuizComplete}
        onClose={() => setActiveQuiz(null)}
      />
    </div>
  );
}
