import { useEffect, useState } from "react";
import { z } from "zod";
import { apiFetch } from "../lib/api";

const schema = z.object({
  kp_index: z.coerce.number().min(0).max(9),
  fetched_at: z.string().optional(),
  source: z.string().optional(),
});

export function useSpaceWeather() {
  const [kpIndex, setKpIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const response = await apiFetch("/api/space-weather", { method: "GET", cache: "no-store" });
        if (!response.ok) {
          throw new Error(`space weather failed (${response.status})`);
        }

        const payload = await response.json();
        const parsed = schema.parse(payload);
        if (!mounted) return;
        setKpIndex(parsed.kp_index);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setKpIndex(0);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchData();
    const id = setInterval(() => {
      void fetchData();
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { kpIndex, loading, error };
}
