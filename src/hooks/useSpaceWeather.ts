import { useEffect, useState } from 'react';
import { z } from 'zod';

const SpaceWeatherSchema = z.object({
  kp_index: z.coerce.number().min(0).max(9),
  fetched_at: z.string().optional(),
  source: z.string().optional(),
});

type SpaceWeatherState = {
  kpIndex: number;
  lastUpdate: Date | null;
  loading: boolean;
  error: Error | null;
};

export const useSpaceWeather = (): SpaceWeatherState => {
  const [kpIndex, setKpIndex] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchKpIndex = async () => {
      try {
        const response = await fetch('/api/space-weather', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Space weather fetch failed (${response.status})`);
        }

        const raw = await response.json();
        const data = SpaceWeatherSchema.parse(raw);
        const kp = data.kp_index;

        if (!mounted) return;

        setKpIndex(Math.max(0, Math.min(9, Number.isFinite(kp) ? kp : 0)));
        setLastUpdate(data.fetched_at ? new Date(data.fetched_at) : new Date());
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setKpIndex(0);
        setError(err instanceof Error ? err : new Error('Unknown space-weather error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchKpIndex();

    const interval = window.setInterval(() => {
      void fetchKpIndex();
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return { kpIndex, lastUpdate, loading, error };
};
