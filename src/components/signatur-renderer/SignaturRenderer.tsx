import { useMemo } from 'react';
import { useReducedMotion } from 'motion/react';

import { useSignaturSignal } from '@/src/hooks/useSignaturSignal';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { CymaticsFallback } from '@/src/components/signatur-cymatics/CymaticsFallback';
import { SignatureSphere3D } from '@/src/components/signatur-3d/SignatureSphere3D';
import { type PlanetName } from '@/src/lib/signatur-3d/planets';
import { NEUTRAL_BAZI_WEIGHTS } from '@/src/lib/signatur-3d/bazi-to-planets';
import type { DissonanceResult } from '../../lib/dissonance/dissonance';
import type { DayHarmonicState } from '../../lib/day-harmonic';
import type { ChladniParams } from '@/src/lib/cymatics/bazi-to-chladni';

// Static import of SignatureSphere3D (was lazy with a CymaticsFallback Suspense
// boundary). The Suspense fallback shadowed the sphere whenever the chunk took
// noticeable time to load — users only ever saw the static SVG fallback. The
// sphere is the page's main visual; it pays for its bundle weight by being
// available at first paint. The 2D Cymatics path was also removed at the same
// time — viewMode was hardcoded to '3d' so the 2D container was dead code that
// still mounted SignaturCymaticsCanvas and ran its 16k-particle RAF loop.

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
   * coherently but stops being user-specific.
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

  const resolutionText = `${labels.resolution}: ${Math.round(resolution)}%`;

  // Prefer caller-supplied BaZi-derived weights; fall back to the neutral
  // profile only when nothing was passed — explicit "no data" state rather
  // than a silent NEUTRAL collapse to all-0.5.
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
      <div className="relative flex h-[55vh] min-h-[340px] w-full max-h-[700px] items-center justify-center sm:h-[62vh] sm:min-h-[420px] sm:max-h-[760px]">
        {loading && !signalData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-xs uppercase tracking-[0.2em] text-white/70">
            {labels.loading}
          </div>
        )}

        {/* The only renderer: 3D Cymatic Wuxing sphere. CymaticsFallback shows
            only while chladniParams is unavailable (BaZi data still loading or
            missing) — never as a Suspense fallback for the sphere chunk. */}
        <div data-testid="view-3d-container" className="absolute inset-0">
          {chladniParams ? (
            <SignatureSphere3D
              weights={effectivePlanetWeights}
              planetariumMode={planetariumMode}
              kpIndex={kpIndex}
              dominantElement={chladniParams.dominantElement}
              className="h-full w-full"
            />
          ) : (
            // chladniParams is undefined here — let CymaticsFallback default
            // (Water) drive the colour palette.
            <CymaticsFallback
              planetariumMode={planetariumMode}
              className="h-full w-full"
            />
          )}
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
