import { lazy, Suspense, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { useSignaturSignal } from '@/src/hooks/useSignaturSignal';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { CymaticsFallback } from '@/src/components/signatur-cymatics/CymaticsFallback';
import { type PlanetName } from '@/src/lib/signatur-3d/planets';
import { NEUTRAL_BAZI_WEIGHTS } from '@/src/lib/signatur-3d/bazi-to-planets';
import type { DissonanceResult } from '../../lib/dissonance/dissonance';
import type { DayHarmonicState } from '../../lib/day-harmonic';
import type { ChladniParams } from '@/src/lib/cymatics/bazi-to-chladni';

// Cymatics is the only renderer now. V1/V2/V3 paths were removed on 2026-04-18
// because the legacy engines were shadowing the Cymatics signature — whenever
// chladniParams was undefined (still loading, or bazi data missing) the page
// fell through to V3 and the user never saw the new engine.
// If chladniParams is undefined or Canvas2D fails, we show CymaticsFallback
// (CSS/SVG static Chladni pattern) rather than a different renderer.
const SignaturCymaticsCanvas = lazy(() => import('@/src/components/signatur-cymatics/SignaturCymaticsCanvas').then(m => ({ default: m.SignaturCymaticsCanvas })));

// Phase H6 — R3F Chladni sphere (3D mode). Lazy-loaded so the Three.js
// bundle is only fetched when the user actually toggles 3D.
const SignatureSphere3D = lazy(() =>
  import('@/src/components/signatur-3d/SignatureSphere3D').then((m) => ({ default: m.SignatureSphere3D })),
);

export type SignaturRendererLabels = {
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

type SignaturRendererProps = {
  userId: string;
  isInteractive?: boolean;
  labels: SignaturRendererLabels;
  /** @deprecated legacy V2/V3 prop — ignored. Kept on the interface for call-site stability. */
  quizWeights?: Record<string, number>;
  /** @deprecated legacy V2 prop — ignored. */
  effectTrigger?: { type: string; color?: string; timestamp: number; intensity?: number } | null;
  /** @deprecated legacy V2/V3 prop — ignored. */
  solarModulation?: number;
  /** @deprecated legacy V2 prop — ignored. */
  dissonanceModulation?: import('../../lib/dissonance/dissonance-visual').VisualModulation | null;
  /** @deprecated legacy V3 prop — ignored. */
  externalDissonance?: DissonanceResult | null;
  /** @deprecated legacy V3 prop — ignored. */
  dayHarmonic?: DayHarmonicState | null;
  /** Planetarium (dark) or Solar System (bright) theme. Default: true (dark). */
  planetariumMode?: boolean;
  /** Chladni params derived from user's BaZi chart. When undefined, CymaticsFallback is shown. */
  chladniParams?: ChladniParams;
  /**
   * Per-planet Chladni weights for the 3D sphere. Caller computes these from
   * the same BaZi + Wu-Xing data that drives `chladniParams` (via
   * `baziToPlanetWeights` in `src/lib/signatur-3d/bazi-to-planets.ts`).
   *
   * When omitted, `NEUTRAL_BAZI_WEIGHTS` is used — the sphere still renders
   * coherently but stops being user-specific. Previously this path was driven
   * by `signalData.baseSignals` from the transit-state polling hook; that
   * proved unreliable (null on mount, null on API failure) so the 3D weight
   * source is now fully decoupled from the transit-state API. See
   * `bazi-to-planets.ts` for the mapping rationale.
   */
  planetWeights?: Record<PlanetName, number>;
};

export const SignaturRenderer = ({
  userId,
  labels,
  planetariumMode = true,
  chladniParams,
  planetWeights,
}: SignaturRendererProps) => {
  const prefersReducedMotion = useReducedMotion();
  // Hooks kept alive so the DEV panel keeps showing resolution/Kp and the
  // loading state. None of their output drives the renderer any more.
  const { signalData, resolution, loading, error } = useSignaturSignal(userId);
  const { kpIndex } = useSpaceWeather();

  const [cymaticsFailed, setCymaticsFailed] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const resolutionText = `${labels.resolution}: ${Math.round(resolution)}%`;

  const showCymatics = chladniParams && !cymaticsFailed;

  // 3D sphere weights: prefer the caller-supplied BaZi-derived weights
  // (user-specific, always available once apiData has resolved). Fall back
  // to the neutral profile only when nothing was passed — explicit "no data"
  // state rather than a silent NEUTRAL collapse to all-0.5.
  const effectivePlanetWeights = useMemo(
    () => planetWeights ?? NEUTRAL_BAZI_WEIGHTS,
    [planetWeights],
  );

  return (
    <section
      aria-label={labels.regionLabel}
      className={`relative overflow-hidden rounded-3xl border shadow-[0_0_60px_rgba(0,0,0,0.45)] ${
        planetariumMode
          ? 'border-white/10 bg-[#030308]'
          : 'border-slate-200 bg-[#f1f5f9]'
      }`}
    >
      {/* 2D ↔ 3D view toggle. Absolute-positioned so it floats above whichever
          canvas is visible without pushing the layout. aria-pressed reflects
          the active mode for assistive tech. */}
      <div
        role="group"
        aria-label="Ansichtsmodus"
        className="absolute right-3 top-3 z-20 flex items-center rounded-full border border-white/15 bg-black/50 p-1 text-[11px] font-semibold backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => setViewMode('2d')}
          aria-pressed={viewMode === '2d'}
          className={`rounded-full px-3 py-1 transition-colors ${
            viewMode === '2d' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
          }`}
        >
          2D
        </button>
        <button
          type="button"
          onClick={() => setViewMode('3d')}
          aria-pressed={viewMode === '3d'}
          className={`rounded-full px-3 py-1 transition-colors ${
            viewMode === '3d' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
          }`}
        >
          3D
        </button>
      </div>

      <div className="relative flex h-[55vh] min-h-[340px] w-full max-h-[700px] items-center justify-center sm:h-[62vh] sm:min-h-[420px] sm:max-h-[760px]">
        {loading && !signalData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-xs uppercase tracking-[0.2em] text-white/70">
            {labels.loading}
          </div>
        )}

        {/* 2D Cymatics — always mounted, hidden when 3D active. Tailwind's
            `hidden` is display:none which preserves React state (particle
            positions, Canvas2D context) across toggles. */}
        <div
          data-testid="view-2d-container"
          className={viewMode === '2d' ? 'absolute inset-0' : 'hidden'}
        >
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

        {/* 3D SignatureSphere — always mounted, hidden when 2D active. The
            Three.js scene preserves its camera + geometry across toggles. */}
        <div
          data-testid="view-3d-container"
          className={viewMode === '3d' ? 'absolute inset-0' : 'hidden'}
        >
          <Suspense fallback={
            <CymaticsFallback
              dominantElement={chladniParams?.dominantElement}
              planetariumMode={planetariumMode}
              className="h-full w-full"
            />
          }>
            <SignatureSphere3D
              weights={effectivePlanetWeights}
              planetariumMode={planetariumMode}
              kpIndex={kpIndex}
              className="h-full w-full"
            />
          </Suspense>
        </div>
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
