import { useEffect, useRef, useState } from 'react';
import type { JieqiState } from '@/src/lib/jieqi/types';
import { z } from 'zod';

const JieqiStateSchema: z.ZodType<JieqiState> = z.object({}).passthrough();

export function useJieqi() {
  const [state, setState] = useState<JieqiState | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchJieqi = async () => {
      try {
        const res = await fetch('/api/jieqi/current');
        if (!res.ok) throw new Error(`Jieqi fetch failed: ${res.status}`);
        const json = await res.json();
        const data = JieqiStateSchema.parse(json);
        if (mountedRef.current) {
          setState(data);
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    };

    void fetchJieqi();
    const interval = setInterval(fetchJieqi, 30 * 60 * 1000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  return { jieqi: state, loading };
}
