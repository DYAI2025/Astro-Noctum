import { useEffect, useRef, useState } from 'react';
import { FlareTimelineSchema, type FlareTimeline } from '@/src/lib/schemas/flare-timeline';

export function useFlareTimeline() {
  const [data, setData] = useState<FlareTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetchTimeline = async () => {
      try {
        const res = await fetch('/api/space-weather/timeline');
        if (!res.ok) throw new Error(`Timeline fetch failed: ${res.status}`);
        const raw = await res.json();
        const parsed = FlareTimelineSchema.parse(raw);
        if (mountedRef.current) { setData(parsed); setLoading(false); }
      } catch { if (mountedRef.current) setLoading(false); }
    };
    void fetchTimeline();
    const interval = setInterval(fetchTimeline, 10 * 60 * 1000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  return { timeline: data, loading };
}
