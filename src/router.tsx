import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useLanguage } from './contexts/LanguageContext';
import { useNavigationDepth, type TransitionDirection } from './hooks/useNavigationDepth';
import type { OnboardingPageProps } from './pages/OnboardingPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SignaturPage = lazy(() => import('./pages/SignaturPage'));
const SignaturQuizzesPage = lazy(() => import('./pages/SignaturQuizzesPage'));
const WuXingPage = lazy(() => import('./pages/WuXingPage'));
const WissenPage = lazy(() => import('./pages/WissenPage'));
const ArtikelPage = lazy(() => import('./pages/ArtikelPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const SkyPage = lazy(() => import('./pages/SkyPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const WeeklyInsightsPage = lazy(() => import('./pages/WeeklyInsightsPage'));
const SynastryPage = lazy(() => import('./pages/SynastryPage'));

// ── Transition variants (per docs/wireframes/depth-navigation-v1.md) ─────────

const INWARD_VARIANTS = {
  initial: { scale: 1.04, opacity: 0 },
  animate: { scale: 1,    opacity: 1 },
  exit:    { scale: 0.97, opacity: 0 },
};

const OUTWARD_VARIANTS = {
  initial: { scale: 0.97, opacity: 0 },
  animate: { scale: 1,    opacity: 1 },
  exit:    { scale: 1.03, opacity: 0 },
};

// Opacity-only fade: used for lateral navigation and prefers-reduced-motion
const FADE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

function getVariants(direction: TransitionDirection) {
  if (direction === 'inward') return INWARD_VARIANTS;
  if (direction === 'outward') return OUTWARD_VARIANTS;
  return FADE_VARIANTS;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
    </div>
  );
}

function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-serif text-2xl text-[#1E2A3A]">{t('notFound.title')}</h1>
      <p className="text-sm text-[#1E2A3A]/50">
        {t('notFound.message')}
      </p>
      <Link to="/" className="text-sm text-[#8B6914] hover:underline">
        {t('notFound.backLink')} &rarr;
      </Link>
    </div>
  );
}

// ── AppRoutes ─────────────────────────────────────────────────────────────────

type AppRoutesProps = {
  hasCompleteProfile: boolean;
  onboardingProps: OnboardingPageProps;
};

export function AppRoutes({ hasCompleteProfile, onboardingProps }: AppRoutesProps) {
  const location = useLocation();
  const { direction } = useNavigationDepth();
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion ? FADE_VARIANTS : getVariants(direction);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.key}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        // w-full preserves flex layout without suppressing the scale transform box
        className="w-full"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route
              path="/"
              element={hasCompleteProfile ? <DashboardPage /> : <Navigate to="/onboarding" replace />}
            />
            <Route path="/signatur" element={<SignaturPage />} />
            {/* Legacy alias — safe to remove 30 days post-deploy */}
            <Route path="/fu-ring" element={<SignaturPage />} />
            <Route path="/signatur/quizzes" element={<SignaturQuizzesPage />} />
            <Route path="/wu-xing" element={<WuXingPage />} />
            <Route path="/wissen" element={<WissenPage />} />
            <Route path="/wissen/:slug" element={<ArtikelPage />} />
            <Route
              path="/onboarding"
              element={
                hasCompleteProfile && onboardingProps.onboardingPhase === 'form' && !onboardingProps.isLoading
                  ? <Navigate to="/" replace />
                  : <OnboardingPage {...onboardingProps} />
              }
            />
            <Route path="/weekly" element={<WeeklyInsightsPage />} />
            <Route path="/synastry" element={<SynastryPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/sky" element={<SkyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
