import { useEffect, useRef, useState } from 'react';
import { NeoResponseSchema, type NeoObject } from '@/src/lib/schemas/neo';

export function useNeoVisitors() {
  const [objects, setObjects] = useState<NeoObject[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetchNeo = async () => {
      try {
        const res = await fetch('/api/neo/upcoming');
        if (!res.ok) throw new Error(`NEO fetch failed: ${res.status}`);
        const raw = await res.json();
        const parsed = NeoResponseSchema.parse(raw);
        if (mountedRef.current) { setObjects(parsed.objects); setLoading(false); }
      } catch { if (mountedRef.current) setLoading(false); }
    };
    void fetchNeo();
    return () => { mountedRef.current = false; };
  }, []);

  return { objects, loading };
}
