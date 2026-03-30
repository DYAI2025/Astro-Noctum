import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { useFusionSignal } from '@/src/hooks/useFusionSignal';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import type { TransitEvent } from '@/src/lib/schemas/transit-state';
import {
  FusionRingWebsiteCanvas,
  type RingEffectType,
} from '@/src/components/fusion-ring-website/FusionRingWebsiteCanvas';
import FusionRingCanvasV2 from '@/src/components/fusion-ring-website/FusionRingCanvasV2';
import { soulprintToNatalWeights, soulprintToDimensionWeights } from '@/src/components/fusion-ring-website/signatur-bridge';
import { isFeatureEnabled } from '@/src/lib/feature-flags';
import type { DissonanceResult } from '../../lib/fusion-ring/dissonance';
import type { DayHarmonicState } from '../../lib/fusion-ring/day-harmonic';

const SignaturV3Canvas = lazy(() => import('@/src/components/signatur-v3/SignaturV3Canvas'));

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
  onSpikeClick?: (sector: number) => void;
  labels: FusionRing3DLabels;
  quizWeights?: Record<string, number>;
  effectTrigger?: { type: string; color?: string; timestamp: number; intensity?: number } | null;
  solarModulation?: number;
  dissonanceModulation?: import('../../lib/fusion-ring/dissonance-visual').VisualModulation | null;
  /** External dissonance result for V3 engine */
  externalDissonance?: DissonanceResult | null;
  /** Day harmonic state for V3 engine */
  dayHarmonic?: DayHarmonicState | null;
};

type QueuedEffect = { id: string; type: RingEffectType };

const mapTransitEventToEffect = (event: TransitEvent): RingEffectType => {
  const delta = event.delta ?? 0;

  switch (event.type) {
    case 'resonance_jump':
      if (delta >= 0.3) return 'divergenz_spike';
      return 'resonanzsprung';
    case 'cluster_complete':
      return delta >= 0.25 ? 'korona_eruption' : 'dominanzwechsel';
    case 'equilibrium_shift':
      return delta < 0 ? 'crunch' : 'spannungsachse';
    default:
      if (delta >= 0.35) return 'burst';
      if (delta <= -0.18) return 'crunch';
      return 'mond_event';
  }
};

const pickLatestEvent = (events: TransitEvent[]): TransitEvent | null => {
  if (!events.length) return null;
  return [...events]
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    .at(-1) ?? events[events.length - 1] ?? null;
};

export const FusionRing3D = ({
  userId,
  isInteractive = false,
  labels,
  quizWeights,
  effectTrigger,
  solarModulation,
  dissonanceModulation,
  externalDissonance,
  dayHarmonic,
}: FusionRing3DProps) => {
  const prefersReducedMotion = useReducedMotion();
  const { signalData, events, resolution, loading, error } = useFusionSignal(userId);
  const { kpIndex } = useSpaceWeather();

  const v2NatalWeights = useMemo(
    () => signalData?.baseSignals ? soulprintToNatalWeights(signalData.baseSignals) : undefined,
    [signalData?.baseSignals]
  );

  const v3DimensionWeights = useMemo(
    () => signalData?.baseSignals ? soulprintToDimensionWeights(signalData.baseSignals) : undefined,
    [signalData?.baseSignals]
  );

  const [queuedEffect, setQueuedEffect] = useState<QueuedEffect | null>(null);
  const lastEventRef = useRef<string>('');

  const latestEvent = useMemo(() => pickLatestEvent(events), [events]);

  useEffect(() => {
    if (!latestEvent) return;
    const eventKey = `${latestEvent.id}:${latestEvent.timestamp ?? 'no-ts'}`;
    if (eventKey === lastEventRef.current) return;
    lastEventRef.current = eventKey;
    setQueuedEffect({
      id: eventKey,
      type: mapTransitEventToEffect(latestEvent),
    });
  }, [latestEvent]);

  const resolutionText = `${labels.resolution}: ${Math.round(resolution)}%`;
  const eventDescription = latestEvent
    ? `${labels.eventAnnouncePrefix}: ${latestEvent.type} · S${latestEvent.sector + 1} · Δ ${latestEvent.delta.toFixed(2)}`
    : labels.latestEvents;

  return (
    <section
      aria-label={labels.regionLabel}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#030308] shadow-[0_0_60px_rgba(0,0,0,0.45)]"
    >
      <div className="relative h-[55vh] min-h-[340px] w-full max-h-[700px] sm:h-[62vh] sm:min-h-[420px] sm:max-h-[760px]">
        {loading && !signalData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-xs uppercase tracking-[0.2em] text-white/70">
            {labels.loading}
          </div>
        )}

        {isFeatureEnabled('signature_engine_v3') && v3DimensionWeights ? (
          <Suspense fallback={<div className="h-full w-full bg-black/20" />}>
            <SignaturV3Canvas
              natalWeights={v3DimensionWeights}
              quizWeights={quizWeights ?? {}}
              dayHarmonic={dayHarmonic ?? undefined}
              externalDissonance={externalDissonance}
              solarModulation={solarModulation != null ? { ringModulation: solarModulation, triggerEffect: false, kpIndex: 0 } : undefined}
              className="h-full w-full"
              quality="auto"
            />
          </Suspense>
        ) : isFeatureEnabled('signature_engine_v2') ? (
          <FusionRingCanvasV2
            natalWeights={v2NatalWeights}
            quizWeights={quizWeights}
            effectTrigger={effectTrigger}
            solarModulation={solarModulation}
            dissonanceModulation={dissonanceModulation}
            className="h-full w-full"
          />
        ) : (
          <FusionRingWebsiteCanvas
            queuedEffect={queuedEffect}
            className="h-full w-full"
            soulProfile={signalData?.baseSignals ?? null}
          />
        )}
      </div>

      {!!import.meta.env.DEV && (
        <div className="grid gap-2 border-t border-white/10 bg-black/30 px-4 py-3 text-xs text-white/75 md:grid-cols-3 md:px-5">
          <p>{resolutionText}</p>
          <p>{`Kp: ${kpIndex.toFixed(1)}`}</p>
          <p className="truncate">{eventDescription}</p>
        </div>
      )}

      {prefersReducedMotion && (
        <p className="border-t border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70">
          {labels.reducedMotionHint}
        </p>
      )}

      {error && (
        <p className="border-t border-red-400/30 bg-red-950/20 px-4 py-2 text-xs text-red-200">
          {labels.renderError}
        </p>
      )}
    </section>
  );
};
