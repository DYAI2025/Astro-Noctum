import { lazy, Suspense, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { useFusionSignal } from '@/src/hooks/useFusionSignal';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { CymaticsFallback } from '@/src/components/signatur-cymatics/CymaticsFallback';
import type { DissonanceResult } from '../../lib/fusion-ring/dissonance';
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';
import type { ChladniParams } from '@/src/lib/cymatics/bazi-to-chladni';

// Cymatics is the only renderer now. V1/V2/V3 paths were removed on 2026-04-18
// because the legacy engines were shadowing the Cymatics signature — whenever
// chladniParams was undefined (still loading, or bazi data missing) the page
// fell through to V3 and the user never saw the new engine.
// If chladniParams is undefined or Canvas2D fails, we show CymaticsFallback
// (CSS/SVG static Chladni pattern) rather than a different renderer.
const SignaturCymaticsCanvas = lazy(() => import('@/src/components/signatur-cymatics/SignaturCymaticsCanvas').then(m => ({ default: m.SignaturCymaticsCanvas })));

export type FusionRing3DLabels = {
  regionLabel: string;
  loading: string;
  reducedMotionHint: string;
  resolution: string;
  audioOn: string;
  audioOff: string;
  latestEvents: string;
  renderError: string;
  reload: string;
  eventAnnouncePrefix: string;
};

type FusionRing3DProps = {
  userId: string;
  isInteractive?: boolean;
  labels: FusionRing3DLabels;
  /** @deprecated legacy V2/V3 prop — ignored. Kept on the interface for call-site stability. */
  quizWeights?: Record<string, number>;
  /** @deprecated legacy V2 prop — ignored. */
  effectTrigger?: { type: string; color?: string; timestamp: number; intensity?: number } | null;
  /** @deprecated legacy V2/V3 prop — ignored. */
  solarModulation?: number;
  /** @deprecated legacy V2 prop — ignored. */
  dissonanceModulation?: import('../../lib/fusion-ring/dissonance-visual').VisualModulation | null;
  /** @deprecated legacy V3 prop — ignored. */
  externalDissonance?: DissonanceResult | null;
  /** @deprecated legacy V3 prop — ignored. */
  dayHarmonic?: DayHarmonicState | null;
  /** Planetarium (dark) or Solar System (bright) theme. Default: true (dark). */
  planetariumMode?: boolean;
  /** Chladni params derived from user's BaZi chart. When undefined, CymaticsFallback is shown. */
  chladniParams?: ChladniParams;
};

export const FusionRing3D = ({
  userId,
  labels,
  planetariumMode = true,
  chladniParams,
}: FusionRing3DProps) => {
  const prefersReducedMotion = useReducedMotion();
  // Hooks kept alive so the DEV panel keeps showing resolution/Kp and the
  // loading state. None of their output drives the renderer any more.
  const { signalData, resolution, loading, error } = useFusionSignal(userId);
  const { kpIndex } = useSpaceWeather();

  const [cymaticsFailed, setCymaticsFailed] = useState(false);

  const resolutionText = `${labels.resolution}: ${Math.round(resolution)}%`;

  const showCymatics = chladniParams && !cymaticsFailed;

  return (
    <section
      aria-label={labels.regionLabel}
      className={`relative overflow-hidden rounded-3xl border shadow-[0_0_60px_rgba(0,0,0,0.45)] ${
        planetariumMode
          ? 'border-white/10 bg-[#030308]'
          : 'border-slate-200 bg-[#f1f5f9]'
      }`}
    >
      <div className="relative flex h-[55vh] min-h-[340px] w-full max-h-[700px] items-center justify-center sm:h-[62vh] sm:min-h-[420px] sm:max-h-[760px]">
        {loading && !signalData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-xs uppercase tracking-[0.2em] text-white/70">
            {labels.loading}
          </div>
        )}

        {showCymatics ? (
          <Suspense fallback={
            <CymaticsFallback
              dominantElement={chladniParams.dominantElement}
              planetariumMode={planetariumMode}
              className="h-full w-full"
            />
          }>
            <SignaturCymaticsCanvas
              params={chladniParams}
              planetariumMode={planetariumMode}
              onFailed={() => setCymaticsFailed(true)}
              className="h-full w-full"
            />
          </Suspense>
        ) : (
          // No chladniParams yet (bazi data still loading / unavailable) or
          // Canvas2D failed — show the static SVG fallback, *never* a legacy
          // engine. Dominant element defaults to Water inside the fallback.
          <CymaticsFallback
            dominantElement={chladniParams?.dominantElement}
            planetariumMode={planetariumMode}
            className="h-full w-full"
          />
        )}
      </div>

      {!!import.meta.env.DEV && (
        <div className="grid gap-2 border-t border-white/10 bg-black/30 px-4 py-3 text-xs text-white/75 md:grid-cols-2 md:px-5">
          <p>{resolutionText}</p>
          <p>{`Kp: ${kpIndex.toFixed(1)}`}</p>
        </div>
      )}

      {prefersReducedMotion && (
        <p className="border-t border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70">
          {labels.reducedMotionHint}
        </p>
      )}

      {/* Transit API errors are handled silently — Cymatics renderer does not depend on transit data */}
      {!!error && import.meta.env.DEV && (
        <p className="border-t border-yellow-400/20 bg-yellow-950/10 px-4 py-2 text-xs text-yellow-200/60">
          {labels.renderError}
        </p>
      )}
    </section>
  );
};
