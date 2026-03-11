import { useSyncExternalStore, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { useFusionRingContext } from '../contexts/FusionRingContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePremium } from '../hooks/usePremium';
import FusionRing from '../components/FusionRing';
import FusionRingTimeline from '../components/FusionRingTimeline';
import { ClusterEnergySystem } from '../components/ClusterEnergySystem';
import QuizOverlay from '../components/QuizOverlay';
import { DailyEnergyTeaser } from '../components/DailyEnergyTeaser';
import { motion } from 'motion/react';

const RING_THEME = {
  bg: '#020509',
  surface: '#0A1628',
  border: 'rgba(70,130,220,0.18)',
  text: 'rgba(215,230,255,0.85)',
  muted: 'rgba(215,230,255,0.40)',
  glow: 'rgba(212,175,55,0.08)',
};

// Responsive ring size — reacts to resize, SSR-safe
function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}
function getIsMobile() { return window.innerWidth < 640; }
function getIsMobileServer() { return false; }

function useIsMobile() {
  return useSyncExternalStore(subscribeResize, getIsMobile, getIsMobileServer);
}

export default function FuRingPage() {
  const { signal, addQuizResult, completedModules } = useFusionRingContext();
  const { lang, t } = useLanguage();
  const { isPremium } = usePremium();
  const mobile = useIsMobile();
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  if (!signal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: RING_THEME.bg, color: RING_THEME.muted }}>
        <p className="text-sm">{lang === 'de' ? 'Kein Signalprofil vorhanden.' : 'No signal profile available.'}</p>
      </div>
    );
  }

  const ringSize = mobile ? 300 : 520;
  const timelineSize = mobile ? 340 : 520;

  return (
    <div className="min-h-screen font-sans pb-24" style={{ background: RING_THEME.bg, color: RING_THEME.text }}>
      {/* Header — 56px, solid bg */}
      <header
        className="fixed top-0 w-full h-14 flex items-center justify-between px-4 md:px-8 z-50"
        style={{ background: RING_THEME.surface, borderBottom: `1px solid ${RING_THEME.border}` }}
      >
        <Link
          to="/"
          aria-label={lang === 'de' ? 'Zurück zum Dashboard' : 'Back to Dashboard'}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: RING_THEME.muted }}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: RING_THEME.muted }}>
          Fu-Ring Hub
        </span>
        <span className="text-xs" style={{ color: RING_THEME.muted }}>
          {lang.toUpperCase()}
        </span>
      </header>

      {/* Main content */}
      <main className="pt-20">
        {/* Page Title */}
        <div className="text-center mb-8 px-4">
          <h1 className="font-serif text-3xl md:text-4xl mb-3" style={{ color: '#D4AF37' }}>
            {lang === 'de' ? 'Fusion Ring — Dein Energie-System' : 'Fusion Ring — Your Energy System'}
          </h1>
          <p className="text-xs max-w-xl mx-auto opacity-60 leading-relaxed font-serif italic">
            {lang === 'de' 
              ? 'Der Fu-Ring vereint deine astrologischen Potenziale mit deiner aktuellen psychologischen Verfassung.'
              : 'The Fu-Ring combines your astrological potentials with your current psychological state.'}
          </p>
        </div>

        {/* 1. The Ring */}
        <section className="flex items-center justify-center mb-12" style={{ minHeight: '50vh' }}>
          <div className="relative">
            <div
              className="absolute inset-0 -m-16 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${RING_THEME.glow} 0%, transparent 70%)` }}
            />
            <FusionRing
              signal={signal}
              size={ringSize}
              showLabels
              showKorona
              showTension
              animated
              withBackground={false}
            />
          </div>
        </section>

        {/* 2. Daily Energy & Quizzes */}
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Daily Energy Teaser */}
          <div className="md:col-span-1">
            <h3 className="text-[10px] uppercase tracking-[0.3em] mb-4 opacity-50 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              {lang === 'de' ? 'Tages-Energie' : 'Daily Energy'}
            </h3>
            <DailyEnergyTeaser signal={signal} lang={lang} isPremium={isPremium} />
          </div>

          {/* Cluster Energy System (Quizzes) */}
          <div className="md:col-span-2">
            <h3 className="text-[10px] uppercase tracking-[0.3em] mb-4 opacity-50">
              {lang === 'de' ? 'Persönlichkeits-Dimensionen' : 'Personality Dimensions'}
            </h3>
            <div className="bg-white/05 backdrop-blur-sm rounded-2xl p-1 border border-white/10">
              <ClusterEnergySystem
                signal={signal}
                completedModules={completedModules}
                onStartQuiz={(quizId) => setActiveQuiz(quizId)}
                isPremium={isPremium}
                lang={lang}
              />
            </div>
          </div>
        </div>

        {/* 3. Timeline */}
        <section className="max-w-4xl mx-auto px-4 border-t border-white/10 pt-16">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl mb-2 opacity-90">
              {lang === 'de' ? 'Transit Verlauf' : 'Transit Timeline'}
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">
              {lang === 'de' ? 'Energetische Trends der nächsten 30 Tage' : 'Energetic trends for the next 30 days'}
            </p>
          </div>
          <div className="flex justify-center overflow-x-auto pb-8">
            <FusionRingTimeline signal={signal} size={timelineSize} />
          </div>
        </section>
      </main>

      {/* Quiz Overlay */}
      <QuizOverlay
        quizId={activeQuiz}
        onComplete={(event) => {
          addQuizResult(event);
        }}
        onClose={() => setActiveQuiz(null)}
      />
    </div>
  );
}
