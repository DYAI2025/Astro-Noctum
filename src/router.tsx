import { lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FuRingPage = lazy(() => import('./pages/FuRingPage'));
const WuXingPage = lazy(() => import('./pages/WuXingPage'));
const WissenPage = lazy(() => import('./pages/WissenPage'));
const ArtikelPage = lazy(() => import('./pages/ArtikelPage'));

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

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/fu-ring" element={<FuRingPage />} />
        <Route path="/wu-xing" element={<WuXingPage />} />
        <Route path="/wissen" element={<WissenPage />} />
        <Route path="/wissen/:slug" element={<ArtikelPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
