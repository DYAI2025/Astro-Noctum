import { authedFetch } from '../lib/authedFetch';

// ── Types ────────────────────────────────────────────────────────────

export interface VibesResponse {
  timestamp: string;
  horizon: string;
  kurzsignal: string;
  treiber: string[];
  erklaerung: string;
  explain: {
    signatur_context: string;
    transit_context: string;
  };
  meta: { engine_version: string; cached: boolean };
}

// ── API Client ───────────────────────────────────────────────────────

export async function fetchVibes(userId: string): Promise<VibesResponse> {
  const res = await authedFetch('/api/vibes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('vibes_unavailable');
  return res.json();
}
