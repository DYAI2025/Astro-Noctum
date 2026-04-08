/**
 * useVibes — fetches on-demand Vibe insight from /api/vibes.
 *
 * Implements: REQ-USA-mobile-first-readability (Level 1 + 2 above fold on 375px)
 * Same API as web — POST /api/vibes, requireUserAuth.
 *
 * Returns:
 *   - fetch()  : trigger a new Vibe request
 *   - data     : latest VibesResult or null
 *   - loading  : true while request is in-flight
 *   - error    : error message string or null
 *   - cooldown : next_available_at string if on cooldown
 */

import { useState, useCallback } from 'react';
import { authedFetch } from '../lib/api';

export interface VibesLevel {
  text: string;
  label?: string;
}

export interface VibesResult {
  level1: VibesLevel;   // Kurzsignal — always visible
  level2: VibesLevel;   // Treiber — always visible
  level3?: VibesLevel;  // Erklärung — behind "Warum?" tap
  meta?: { cached?: boolean };
  cooldown?: { active: boolean; next_available_at: string; remaining_ms: number };
}

interface UseVibesState {
  data: VibesResult | null;
  loading: boolean;
  error: string | null;
  cooldown: string | null;
  fetch: () => Promise<void>;
}

export function useVibes(): UseVibesState {
  const [data, setData] = useState<VibesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<string | null>(null);

  const fetchVibes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authedFetch('/api/vibes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Vibes request failed (${res.status})`);
      }

      const json = await res.json() as VibesResult;

      if (json.cooldown?.active) {
        setCooldown(json.cooldown.next_available_at);
      } else {
        setCooldown(null);
      }

      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, cooldown, fetch: fetchVibes };
}
