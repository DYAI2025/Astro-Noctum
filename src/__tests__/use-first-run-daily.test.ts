/**
 * Tests for useFirstRunDaily — error-recovery contract.
 *
 * Covers the 2026-05-11 audit finding: a single failed
 * /api/experience/daily call must NOT lock the hook for the rest of
 * the day. Auto-recovery on dep change, manual recovery via retry().
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────

const fetchDailyExperienceMock = vi.fn();
vi.mock('../services/experience', () => ({
  fetchDailyExperience: (...args: unknown[]) => fetchDailyExperienceMock(...args),
}));

const supabaseFromMock = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => supabaseFromMock(...args),
  },
}));

// computeTodayPlanetInfluences is a pure function, but we stub it so
// the hook doesn't try to evaluate ephemeris in tests.
vi.mock('../lib/astro-data/planetInfluences', () => ({
  computeTodayPlanetInfluences: vi.fn(() => null),
}));

// computeDayHarmonic / computeNightHarmonic are pure — leave them alone.

// ── Fixtures ─────────────────────────────────────────────────────────────

const VALID_DAILY: any = {
  // Minimal — only what the hook reads internally. The hook does NOT
  // schema-validate the response (it just stores it), so a partial
  // shape is fine for these tests.
  fusion: { harmony_index: 0.6 },
  meta: { engine_version: 'v1-gemini-daily' },
};

const VALID_BIRTH = {
  date: '1990-05-15',
  time: '12:30',
  tz: 'Europe/Berlin',
  lat: 52.52,
  lon: 13.405,
};

function profileQueryReturning(seenDate: string | null) {
  // Mimics: supabase.from('profiles').select('daily_modal_seen_date').eq('id', userId).maybeSingle()
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: seenDate ? { daily_modal_seen_date: seenDate } : null,
            error: null,
          }),
      }),
    }),
    // Used by handleClose (irrelevant for these tests but must not crash if hit)
    update: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  };
}

beforeEach(() => {
  fetchDailyExperienceMock.mockReset();
  supabaseFromMock.mockReset();
  supabaseFromMock.mockImplementation(() => profileQueryReturning(null));

  // Clear localStorage so getCachedDaily / setCachedDaily start fresh.
  try {
    window.localStorage.clear();
  } catch {
    // jsdom may not have it set up; ignore
  }
});

afterEach(() => {
  vi.clearAllMocks();
});

async function loadHook() {
  // Dynamic import so module-level state (none currently, but defensive)
  // doesn't leak across tests.
  const mod = await import('../hooks/useFirstRunDaily');
  return mod.useFirstRunDaily;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('useFirstRunDaily — error recovery', () => {
  it('FRD-RETRY-001: after a failed fetch, retry() forces a re-fetch', async () => {
    // First call: simulate network failure
    fetchDailyExperienceMock.mockRejectedValueOnce(new Error('Network error'));
    // Second call (after retry): returns valid data
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);

    const useFirstRunDaily = await loadHook();

    const { result } = renderHook(() =>
      useFirstRunDaily('user-1', VALID_BIRTH, null, [], 'Taurus'),
    );

    // Wait for initial fetch to settle
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.dailyData).toBeNull();
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);

    // Manually retry — this is the new public surface we will add
    expect(typeof result.current.retry).toBe('function');
    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).not.toBeNull();
    });

    expect(result.current.error).toBeNull();
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(2);
  });
});
