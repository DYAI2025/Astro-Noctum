/**
 * useDailyTransit — fetches current planet positions in the sky (today's transits)
 *
 * Calls /api/calculate/western with today's date (noon UTC, lat=0, lon=0).
 * This gives geocentric planet positions — suitable for transit interpretation.
 *
 * The returned bodies include computed fields:
 * - degree_in_sign: ecliptic longitude % 30 (degrees within current sign)
 * - is_retrograde: speed < 0
 *
 * Caches in sessionStorage for 1 hour. Subsequent calls within the hour
 * return cached data synchronously.
 *
 * Implements: REQ-F-dashboard-bazi-fusion-bridge (data source for AktiveEinfluesseFusion)
 * Decision: DEC-dashboard-volatile-first
 */

import { useEffect, useState } from 'react';
import { authedFetch } from '@/src/lib/authedFetch';
import type { BafeWesternBody } from '@/src/types/bafe';

export interface TransitBody extends BafeWesternBody {
  /** Degree within the current zodiac sign (0–30), computed from longitude */
  degree_in_sign: number | null;
  /** Whether the planet is retrograde (speed < 0) */
  is_retrograde: boolean;
}

interface DailyTransitState {
  bodies: Record<string, TransitBody> | null;
  loading: boolean;
  error: Error | null;
}

/** Cache key scoped to the current UTC date — ensures stale-on-midnight and per-day isolation */
function dailyCacheKey(): string {
  const now = new Date();
  const d = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  return `bazodiac_daily_transit:${d}`;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (transit positions stable within hour)

interface CacheEntry {
  bodies: Record<string, TransitBody>;
  fetchedAt: number;
}

function readCache(): Record<string, TransitBody> | null {
  try {
    const raw = sessionStorage.getItem(dailyCacheKey());
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry.bodies;
  } catch {
    return null;
  }
}

function writeCache(bodies: Record<string, TransitBody>): void {
  try {
    const entry: CacheEntry = { bodies, fetchedAt: Date.now() };
    sessionStorage.setItem(dailyCacheKey(), JSON.stringify(entry));
  } catch {
    // sessionStorage may be unavailable (private browsing, quota exceeded)
  }
}

/** Format today's date as "YYYY-MM-DD 12:00:00" for BAFE */
function todayNoonUTC(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d} 12:00:00`;
}

function mapBody(raw: BafeWesternBody): TransitBody {
  const lon = raw.longitude;
  const spd = raw.speed;
  return {
    ...raw,
    degree_in_sign: lon != null ? Number((lon % 30).toFixed(2)) : null,
    is_retrograde: spd != null ? spd < 0 : false,
  };
}

export function useDailyTransit(): DailyTransitState {
  const cached = readCache();
  const [state, setState] = useState<DailyTransitState>({
    bodies: cached,
    loading: cached === null,
    error: null,
  });

  useEffect(() => {
    if (readCache() !== null) return; // still fresh — no fetch needed

    let cancelled = false;

    async function fetchTransitBodies() {
      try {
        // Source: /api/calculate/western → bodies (BAFE proxy, requires auth)
        const response = await authedFetch('/api/calculate/western', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: todayNoonUTC(),
            tz: 'UTC',
            lat: 0,
            lon: 0,
            ambiguousTime: 'earlier',
            nonexistentTime: 'error',
          }),
        });

        if (!response.ok) {
          throw new Error(`Transit fetch failed (${response.status})`);
        }

        const raw = await response.json();
        const rawBodies: Record<string, BafeWesternBody> = raw.bodies ?? {};
        const bodies: Record<string, TransitBody> = {};

        for (const [name, body] of Object.entries(rawBodies)) {
          bodies[name] = mapBody(body);
        }

        writeCache(bodies);

        if (!cancelled) {
          setState({ bodies, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err : new Error('Daily transit fetch failed'),
          }));
        }
      }
    }

    void fetchTransitBodies();
    return () => { cancelled = true; };
  }, []); // run once per session — TTL handled by cache

  return state;
}
