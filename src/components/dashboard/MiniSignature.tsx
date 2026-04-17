import { lazy, Suspense, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
import type { DissonanceResult } from '../../lib/fusion-ring/dissonance';
import type { SolarModulation } from '../signatur-v3/bipolar-engine';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ChladniParams } from '../../lib/cymatics/bazi-to-chladni';

const SignaturV3Canvas = lazy(() => import('../signatur-v3/SignaturV3Canvas'));

interface MiniSignatureProps {
  natalWeights?: Record<string, number>;
  quizWeights?: Record<string, number>;
  dayHarmonic?: DayHarmonicState | null;
  externalDissonance?: DissonanceResult | null;
  solarModulation?: SolarModulation;
  loading?: boolean;
  onExpand?: () => void;
  /** Chladni params for the Cymatics engine. Added in C2a; C2b routes the render body through this. */
  chladniParams?: ChladniParams;
  /** Planetarium (dark) vs. Solar System (bright) theme. Default true. Added in C2a; C2b wires to canvas. */
  planetariumMode?: boolean;
}

const EMPTY_WEIGHTS: Record<string, number> = {};

export default function MiniSignature({ natalWeights, quizWeights, dayHarmonic, externalDissonance, solarModulation, loading, onExpand, chladniParams, planetariumMode = true }: MiniSignatureProps) {
  const { t } = useLanguage();
  const hasData = natalWeights && Object.keys(natalWeights).length > 0;

  const [paused, setPaused] = useState(() =>
    localStorage.getItem('bazodiac_mini_signature_paused') === 'true'
  );
  const togglePause = () => {
    setPaused((prev) => {
      const next = !prev;
      localStorage.setItem('bazodiac_mini_signature_paused', String(next));
      return next;
    });
  };

  return (
    <div
      role={onExpand ? 'button' : undefined}
      tabIndex={onExpand ? 0 : undefined}
      aria-label={onExpand ? t('dashboard.miniSignature.expandLabel') : undefined}
      onClick={onExpand}
      onKeyDown={onExpand ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand(); } } : undefined}
      className="group cosmic-tile p-5 rounded-[2rem] flex flex-col gap-3 cursor-pointer active:scale-95 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:outline-none"
    >
      <div className="relative w-full aspect-square rounded-full overflow-hidden" style={{ background: 'var(--tile-border)' }}>
        {!hasData && loading ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-[10px] opacity-60 uppercase tracking-widest animate-pulse font-sans">
              {t('dashboard.miniSignature.calculating')}
            </p>
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-[10px] opacity-60 uppercase tracking-widest font-sans">
              {t('dashboard.miniSignature.unavailable')}
            </p>
          </div>
        ) : paused ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[10px] opacity-60 uppercase tracking-widest font-sans">
              {t('dashboard.miniSignature.paused')}
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 scale-125 group-hover:scale-150 transition-transform duration-1000">
            <Suspense fallback={<div className="w-full h-full opacity-20 rounded-full animate-pulse" />}>
              <SignaturV3Canvas
                natalWeights={natalWeights ?? EMPTY_WEIGHTS}
                quizWeights={quizWeights ?? EMPTY_WEIGHTS}
                dayHarmonic={dayHarmonic ?? undefined}
                externalDissonance={externalDissonance}
                solarModulation={solarModulation}
                className="w-full h-full"
              />
            </Suspense>
          </div>
        )}

        {/* Decorative Inner Ring Overlay */}
        <div className="absolute inset-2 rounded-full pointer-events-none" style={{ border: '1px solid var(--tile-border)' }} />

        {/* Subtle radial shadow to frame the ring */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] pointer-events-none" />
      </div>

      <div className="flex justify-between items-center relative z-10">
        <span className="text-[10px] font-bold opacity-60 uppercase tracking-[0.15em] font-sans">
          {t('dashboard.miniSignature.label')}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); togglePause(); }}
            className="w-6 h-6 rounded-full border border-current opacity-50 flex items-center justify-center hover:opacity-70 transition-opacity"
            aria-label={t('dashboard.miniSignature.togglePause')}
          >
            {paused
              ? <Play className="w-3 h-3" />
              : <Pause className="w-3 h-3" />
            }
          </button>
          {onExpand && (
            <button
              onClick={(e) => { e.stopPropagation(); onExpand(); }}
              aria-label={t('dashboard.miniSignature.expandLabel')}
              className="w-5 h-5 rounded-full border border-current opacity-40 flex items-center justify-center hover:opacity-80 group-hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:opacity-80"
            >
              <span className="text-[8px]">⤢</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
