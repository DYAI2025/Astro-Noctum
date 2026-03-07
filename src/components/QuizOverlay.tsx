import { useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { QuizErrorBoundary } from './QuizErrorBoundary';

// --- Lazy-loaded quiz components ---
const LoveLanguagesQuiz = lazy(() => import('./quizzes/LoveLanguagesQuiz'));
const KrafttierQuiz = lazy(() => import('./quizzes/KrafttierQuiz'));
const PersonalityQuiz = lazy(() => import('./quizzes/PersonalityQuiz'));

// --- Types ---
interface QuizOverlayProps {
  quizId: string | null; // null = closed
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

interface QuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

// --- Quiz registry ---
const QUIZ_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<QuizProps>>> = {
  love_languages: LoveLanguagesQuiz,
  krafttier: KrafttierQuiz,
  personality: PersonalityQuiz,
};

// --- Loading fallback ---
function QuizLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
    </div>
  );
}

// --- Component ---
export default function QuizOverlay({ quizId, onComplete, onClose }: QuizOverlayProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!quizId) return;
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while overlay is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [quizId, handleKeyDown]);

  const QuizComponent = quizId ? QUIZ_MAP[quizId] ?? null : null;

  return (
    <AnimatePresence>
      {quizId && QuizComponent && (
        <motion.div
          key="quiz-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          {/* Content area — stop click propagation so backdrop click works */}
          <motion.div
            className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/10 bg-obsidian p-6 shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gold/50 transition-colors hover:bg-gold/10 hover:text-gold"
              aria-label="Close quiz"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Quiz content */}
            <QuizErrorBoundary onClose={onClose}>
              <Suspense fallback={<QuizLoadingFallback />}>
                <QuizComponent onComplete={onComplete} onClose={onClose} />
              </Suspense>
            </QuizErrorBoundary>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
