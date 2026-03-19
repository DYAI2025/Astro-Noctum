import { useEffect, useRef, useState } from 'react';
import type { JieqiState } from '@/src/lib/jieqi/types';

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
        const data = await res.json() as JieqiState;
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
