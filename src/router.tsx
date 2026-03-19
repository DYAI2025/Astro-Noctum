import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import type { OnboardingPageProps } from './pages/OnboardingPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FuRingPage = lazy(() => import('./pages/FuRingPage'));
const SignaturQuizzesPage = lazy(() => import('./pages/SignaturQuizzesPage'));
const WuXingPage = lazy(() => import('./pages/WuXingPage'));
const WissenPage = lazy(() => import('./pages/WissenPage'));
const ArtikelPage = lazy(() => import('./pages/ArtikelPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const SkyPage = lazy(() => import('./pages/SkyPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-serif text-2xl text-[#1E2A3A]">404</h1>
      <p className="text-sm text-[#1E2A3A]/50">Diese Seite existiert nicht.</p>
      <Link to="/" className="text-sm text-[#8B6914] hover:underline">
        Zum Dashboard &rarr;
      </Link>
    </div>
  );
}

type AppRoutesProps = {
  hasCompleteProfile: boolean;
  onboardingProps: OnboardingPageProps;
};

export function AppRoutes({ hasCompleteProfile, onboardingProps }: AppRoutesProps) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={hasCompleteProfile ? <DashboardPage /> : <Navigate to="/onboarding" replace />}
        />
        <Route path="/signatur" element={<FuRingPage />} />
        <Route path="/fu-ring" element={<FuRingPage />} />
        <Route path="/signatur/quizzes" element={<SignaturQuizzesPage />} />
        <Route path="/wu-xing" element={<WuXingPage />} />
        <Route path="/wissen" element={<WissenPage />} />
        <Route path="/wissen/:slug" element={<ArtikelPage />} />
        <Route
          path="/onboarding"
          element={hasCompleteProfile ? <Navigate to="/" replace /> : <OnboardingPage {...onboardingProps} />}
        />
        <Route path="/sky" element={<SkyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
