import { useEffect, useRef, useState } from 'react';
import {
  SpaceWeatherExtendedSchema,
  type SpaceWeatherExtended,
} from '@/src/lib/schemas/space-weather';
import {
  computeSolarPressureScore,
  computeRingModulation,
  kpToVisualIntensity,
} from '@/src/lib/space-weather/solar-pressure';

export interface SpaceWeatherState {
  kpIndex: number;
  solarPressure: number;
  ringModulation: number;
  intensityBoost: number;
  triggerEffect: boolean;
  gScale: string;
  xrayFlux: number;
  xrayClass: string;
  protonFlux: number;
  f107: number;
  solarCyclePhase: string;
  events: SpaceWeatherExtended['events'];
  alerts: string[];
  lastUpdate: Date | null;
  loading: boolean;
  error: Error | null;
}

const INITIAL_STATE: SpaceWeatherState = {
  kpIndex: 0,
  solarPressure: 0,
  ringModulation: 1.0,
  intensityBoost: 0,
  triggerEffect: false,
  gScale: 'G0',
  xrayFlux: 0,
  xrayClass: 'A',
  protonFlux: 0,
  f107: 0,
  solarCyclePhase: 'ascending',
  events: [],
  alerts: [],
  lastUpdate: null,
  loading: true,
  error: null,
};

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export const useSpaceWeather = (): SpaceWeatherState => {
  const [state, setState] = useState<SpaceWeatherState>(INITIAL_STATE);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchExtended = async () => {
      try {
        const response = await fetch('/api/space-weather/extended', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(
            `Space weather fetch failed (${response.status})`,
          );
        }

        const raw = await response.json();
        const data = SpaceWeatherExtendedSchema.parse(raw);

        if (!mountedRef.current) return;

        const kp = Math.max(0, Math.min(9, data.current.kp));
        const xrayFlux = data.current.xrayFlux;
        const protonFlux = data.current.protonFlux;

        const solarPressure = computeSolarPressureScore(
          kp,
          xrayFlux,
          protonFlux,
        );

        const maxEventWeight = data.events.length > 0
          ? Math.max(...data.events.map((e) => e.signature_weight))
          : 0;

        const ringModulation = computeRingModulation(
          solarPressure,
          maxEventWeight,
        );

        const visual = kpToVisualIntensity(kp);

        setState({
          kpIndex: kp,
          solarPressure,
          ringModulation,
          intensityBoost: visual.intensityBoost,
          triggerEffect: visual.triggerEffect,
          gScale: visual.gScale,
          xrayFlux,
          xrayClass: data.current.xrayClass,
          protonFlux,
          f107: data.epoch.f107,
          solarCyclePhase: data.epoch.solarCyclePhase,
          events: data.events,
          alerts: data.alerts,
          lastUpdate: new Date(data.meta.fetchedAt),
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!mountedRef.current) return;
        const error =
          err instanceof Error
            ? err
            : new Error('Unknown space-weather error');
        setState((prev) => ({
          ...prev,
          loading: false,
          error,
        }));
      }
    };

    void fetchExtended();

    const interval = window.setInterval(() => {
      void fetchExtended();
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, []);

  return state;
};
