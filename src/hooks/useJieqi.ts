import { useEffect, useRef, useState } from 'react';
import type { JieqiState } from '@/src/lib/jieqi/types';
import { JieqiStateSchema } from '@/src/lib/schemas/jieqi';

export function useJieqi() {
  const [state, setState] = useState<JieqiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchJieqi = async () => {
      try {
        const res = await fetch('/api/jieqi/current');
        if (!res.ok) throw new Error(`Jieqi fetch failed: ${res.status}`);
        const parsed = JieqiStateSchema.parse(await res.json());
        if (mountedRef.current) {
          setState(parsed);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Jieqi fetch error'));
          setLoading(false);
        }
      }
    };

    void fetchJieqi();
    const interval = setInterval(fetchJieqi, 30 * 60 * 1000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  return { jieqi: state, loading, error };
}
