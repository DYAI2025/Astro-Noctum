import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { useFusionSignal } from '@/src/hooks/useFusionSignal';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import type { TransitEvent } from '@/src/lib/schemas/transit-state';
import {
  FusionRingWebsiteCanvas,
  type RingEffectType,
} from '@/src/components/fusion-ring-website/FusionRingWebsiteCanvas';

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
  isInteractive = true,
  labels,
}: FusionRing3DProps) => {
  const prefersReducedMotion = useReducedMotion();
  const { signalData, events, resolution, loading, error } = useFusionSignal(userId);
  const { kpIndex } = useSpaceWeather();

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

        <FusionRingWebsiteCanvas
          queuedEffect={queuedEffect}
          showEffectControls={isInteractive && !!import.meta.env.DEV}
          className="h-full w-full"
          soulProfile={signalData?.baseSignals ?? null}
        />
      </div>

      <div className="grid gap-2 border-t border-white/10 bg-black/30 px-4 py-3 text-xs text-white/75 md:grid-cols-3 md:px-5">
        <p>{resolutionText}</p>
        <p>{`Kp: ${kpIndex.toFixed(1)}`}</p>
        <p className="truncate">{eventDescription}</p>
      </div>

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

