import { useEffect, useRef, useState } from 'react';
import { NeoResponseSchema, type NeoObject } from '@/src/lib/schemas/neo';

export function useNeoVisitors() {
  const [objects, setObjects] = useState<NeoObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetchNeo = async () => {
      try {
        const res = await fetch('/api/neo/upcoming');
        if (!res.ok) throw new Error(`NEO fetch failed: ${res.status}`);
        const parsed = NeoResponseSchema.parse(await res.json());
        if (mountedRef.current) { setObjects(parsed.objects); setError(null); setLoading(false); }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('NEO fetch error'));
          setLoading(false);
        }
      }
    };
    void fetchNeo();
    return () => { mountedRef.current = false; };
  }, []);

  return { objects, loading, error };
}
