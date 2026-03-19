import { useEffect, useRef, useState } from 'react';
import { AuroraDataSchema, type AuroraData } from '@/src/lib/schemas/aurora';

export function useAurora() {
  const [data, setData] = useState<AuroraData | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetchAurora = async () => {
      try {
        const res = await fetch('/api/aurora');
        if (!res.ok) throw new Error(`Aurora fetch failed: ${res.status}`);
        const raw = await res.json();
        const parsed = AuroraDataSchema.parse(raw);
        if (mountedRef.current) { setData(parsed); setLoading(false); }
      } catch { if (mountedRef.current) setLoading(false); }
    };
    void fetchAurora();
    const interval = setInterval(fetchAurora, 30 * 60 * 1000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  return { aurora: data, loading };
}
