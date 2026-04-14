/**
 * useActiveImpacts — fetches structured impact data from POST /api/impact/active.
 *
 * Returns harmony_index (0–100), active_planets[] (orb ≤ 8°, natal-relative),
 * and resonance_badges[]. Operates independently of useDailyExperience() —
 * no shared request dependency.
 *
 * Caches in sessionStorage for 15 min keyed on UTC date + user id.
 *
 * Implements: REQ-F-active-planets-frontend
 */

import { useEffect, useState } from 'react';
import { authedFetch } from '@/src/lib/authedFetch';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  ActiveImpactsSchema,
  type ActiveImpacts,
  type ActivePlanet,
  type ResonanceBadge,
} from '@/src/lib/schemas/active-impacts';

export interface ActiveImpactsState {
  harmonyIndex: number | null;
  baseCoherence: number | null;
  positiveDailyDelta: number | null;
  displayedCoherence: number | null;
  activePlanets: ActivePlanet[];
  resonanceBadges: ResonanceBadge[];
  loading: boolean;
  error: Error | null;
}

const CACHE_TTL_MS = 15 * 60 * 1000;

function cacheKey(userId: string): string {
  const now = new Date();
  const d = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  return `bazodiac_active_impacts:${userId}:${d}`;
}

function readCache(userId: string): ActiveImpacts | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const entry = JSON.parse(raw) as { data: ActiveImpacts; fetchedAt: number };
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    const parsed = ActiveImpactsSchema.safeParse(entry.data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: ActiveImpacts): void {
  try {
    sessionStorage.setItem(cacheKey(userId), JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch {
    // sessionStorage unavailable or quota exceeded — skip silently
  }
}

export function useActiveImpacts(): ActiveImpactsState {
  const { user } = useAuth();
  const userCacheId = user?.id ?? 'anonymous';
  const cached = readCache(userCacheId);
  const [state, setState] = useState<ActiveImpactsState>({
    harmonyIndex: cached?.harmony_index ?? null,
    baseCoherence: cached?.base_coherence ?? null,
    positiveDailyDelta: cached?.positive_daily_delta ?? null,
    displayedCoherence: cached?.displayed_coherence ?? null,
    activePlanets: cached?.active_planets ?? [],
    resonanceBadges: cached?.resonance_badges ?? [],
    loading: cached === null,
    error: null,
  });

  useEffect(() => {
    const cachedForUser = readCache(userCacheId);
    if (cachedForUser !== null) {
      setState({
        harmonyIndex: cachedForUser.harmony_index,
        activePlanets: cachedForUser.active_planets,
        resonanceBadges: cachedForUser.resonance_badges,
        loading: false,
        error: null,
      });
      return;
    }

    setState({
      harmonyIndex: null,
      activePlanets: [],
      resonanceBadges: [],
      loading: true,
      error: null,
    });

    let cancelled = false;

    async function fetchImpacts() {
      try {
        const response = await authedFetch('/api/impact/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });

        if (!response.ok) {
          throw new Error(`Impact fetch failed (${response.status})`);
        }

        const raw = await response.json();
        const parsed = ActiveImpactsSchema.safeParse(raw);

        if (!parsed.success) {
          console.warn('[useActiveImpacts] Schema validation failed:', parsed.error.issues);
          throw new Error('Impact response schema mismatch');
        }

        writeCache(userCacheId, parsed.data);

        if (!cancelled) {
          setState({
            harmonyIndex: parsed.data.harmony_index,
            baseCoherence: parsed.data.base_coherence ?? null,
            positiveDailyDelta: parsed.data.positive_daily_delta ?? null,
            displayedCoherence: parsed.data.displayed_coherence ?? null,
            activePlanets: parsed.data.active_planets,
            resonanceBadges: parsed.data.resonance_badges,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err : new Error('Impact fetch failed'),
          }));
        }
      }
    }

    void fetchImpacts();
    return () => { cancelled = true; };
  }, [userCacheId]);

  return state;
}
