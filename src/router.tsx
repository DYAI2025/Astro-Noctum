import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FuRingPage = lazy(() => import('./pages/FuRingPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/fu-ring" element={<FuRingPage />} />
      </Routes>
    </Suspense>
  );
}
