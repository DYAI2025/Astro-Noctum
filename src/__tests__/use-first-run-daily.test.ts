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

/**
 * Seed localStorage with a cached daily under the active 06:00 day-window key.
 * Mirrors the `setCachedDaily()` shape in useFirstRunDaily.ts so the
 * cache-hit branch picks it up on first effect run.
 */
function activeDailyWindowKey(): string {
  const now = new Date();
  const windowedDate = new Date(now);
  if (now.getHours() < 6) {
    windowedDate.setDate(now.getDate() - 1);
  }
  const y = windowedDate.getFullYear();
  const m = String(windowedDate.getMonth() + 1).padStart(2, '0');
  const d = String(windowedDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function seedTodayCache(data: unknown): void {
  window.localStorage.setItem(
    'daily_horoscope_cache',
    JSON.stringify({ date: activeDailyWindowKey(), data }),
  );
}

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
  vi.useRealTimers();
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

  it('FRD-RETRY-002: after a failed fetch, changing locale auto-recovers (ref cleared on failure)', async () => {
    fetchDailyExperienceMock.mockRejectedValueOnce(new Error('503 service unavailable'));
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);

    const useFirstRunDaily = await loadHook();

    // Stable soulprint + quiz refs across renders so we isolate the
    // locale change as the only dep that triggers the retry.
    const STABLE_QUIZ: number[] = [];

    const { result, rerender } = renderHook(
      ({ locale }: { locale: string }) =>
        useFirstRunDaily('user-1', VALID_BIRTH, null, STABLE_QUIZ, 'Taurus', undefined, locale),
      { initialProps: { locale: 'de-DE' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    // Change locale — should re-trigger the effect because the ref was
    // cleared in the catch block.
    rerender({ locale: 'en-US' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).not.toBeNull();
    });

    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('FRD-RETRY-003: retry() during in-flight request is debounced (no second fetch)', async () => {
    // Use a never-resolving promise so the first fetch stays in flight
    // when retry() is called.
    let resolveFirst: (value: unknown) => void;
    fetchDailyExperienceMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );

    const useFirstRunDaily = await loadHook();

    const STABLE_QUIZ: number[] = [];
    const { result } = renderHook(() =>
      useFirstRunDaily('user-1', VALID_BIRTH, null, STABLE_QUIZ, 'Taurus'),
    );

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);

    // Call retry() while the first fetch is still in flight.
    act(() => {
      result.current.retry();
    });

    // The hook MUST NOT have dispatched a second concurrent fetch.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);

    // Resolve the original promise so we can clean up.
    act(() => {
      resolveFirst!(VALID_DAILY);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('FRD-RETRY-GUARD-001: retry() is a no-op when state is healthy (no error, has data)', async () => {
    // I-2 from the 2026-05-11 PR #343 review: a user clicking a future
    // "Retry" button while data is already loaded should NOT spend an
    // extra LLM call. The retry callback only bumps the tick when
    // there's actually something to recover from.
    //
    // Without the guard, retry() would: clear lastFetchedDateRef →
    // bump retryTick → effect re-runs → cache hit short-circuits the
    // network call BUT the dailyData state still gets re-assigned and
    // the date marker re-set. Worse, if some future caller bypasses
    // the cache (or the cache TTLs out / is cleared), retry() would
    // spend a real LLM call.
    //
    // We simulate that "cache bypass" path by clearing localStorage
    // between the initial load and the retry — that way `retry()`
    // without the guard WOULD reach `fetchDailyExperience` again, and
    // the test would catch it.
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);

    const useFirstRunDaily = await loadHook();
    const STABLE_QUIZ: number[] = [];
    const { result } = renderHook(() =>
      useFirstRunDaily('user-1', VALID_BIRTH, null, STABLE_QUIZ, 'Taurus'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).not.toBeNull();
    });
    expect(result.current.error).toBeNull();
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);

    // Force the network path so retry() without the guard would call
    // the mock a second time. (See block comment above for rationale.)
    window.localStorage.clear();

    // Click retry while healthy — must be a no-op.
    act(() => {
      result.current.retry();
    });

    // Give the effect a chance to re-fire if the guard is missing.
    await waitFor(() => {
      // Loading must NOT have flipped on — retry() was a no-op.
      expect(result.current.loading).toBe(false);
    });

    // No second fetch. Data unchanged. Error stays null.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);
    expect(result.current.dailyData).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('FRD-WINDOW-001: cold-start before 06:00 fetches the active day-window date', async () => {
    // Regression for PR #347 review: when there is no valid cache and the
    // user opens the dashboard between 00:00 and 05:59, the network request
    // must use the same 06:00 day-window key that getCachedDaily()/setCachedDaily()
    // use. Otherwise cold-start users see the next calendar day's horoscope at
    // midnight while cached users keep the previous window until 06:00.
    vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 20 });
    vi.setSystemTime(new Date('2026-05-08T05:30:00'));
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);

    const useFirstRunDaily = await loadHook();
    const STABLE_QUIZ: number[] = [];
    const { result } = renderHook(() =>
      useFirstRunDaily('user-1', VALID_BIRTH, null, STABLE_QUIZ, 'Taurus'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).not.toBeNull();
    });

    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);
    // fetchDailyExperience(birthData, soulprintSectors, quizSectors, targetDate, ...)
    expect(fetchDailyExperienceMock.mock.calls[0][3]).toBe('2026-05-07');

    const cached = JSON.parse(window.localStorage.getItem('daily_horoscope_cache') ?? '{}');
    expect(cached.date).toBe('2026-05-07');
  });

  it('FRD-CACHE-001: cache-hit path sets the ref so same-deps re-renders do not re-fetch', async () => {
    // I-3 from the 2026-05-11 PR #343 review: the cache-hit branch in
    // useFirstRunDaily.ts (line 188-196) sets lastFetchedDateRef to
    // prevent the next render from re-fetching. But no test covered
    // that branch. A future refactor that removes the ref-set from
    // cache-hit but keeps it on fresh-fetch would silently break
    // recovery — and FRD-RETRY-001/002/003 wouldn't catch it.
    //
    // This test asserts the cache-hit contract:
    //   1. localStorage has a cached daily → first mount hits cache,
    //      no LLM call.
    //   2. Re-render with same deps → ref-guard prevents a second
    //      fetch even though deps look identical to React.
    seedTodayCache(VALID_DAILY);

    const useFirstRunDaily = await loadHook();
    const STABLE_QUIZ: number[] = [];
    const { result, rerender } = renderHook(() =>
      useFirstRunDaily('user-1', VALID_BIRTH, null, STABLE_QUIZ, 'Taurus'),
    );

    // Wait for the cache-hit branch to complete.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).not.toBeNull();
    });

    // Cache served the data — fetchDailyExperience was never called.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(0);
    expect(result.current.error).toBeNull();

    // Re-render with same deps. The ref-guard is what prevents the
    // second hit when deps haven't changed.
    rerender();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Still zero LLM calls. Ref guard prevented a re-fetch.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(0);
  });

  it('FRD-SNAPSHOT-001: first fetch receives the quizSectors content passed at effect entry', async () => {
    // I-1 from the 2026-05-11 PR #343 review: the effect's dep array
    // uses content-hash strings (quizSectorsKey) but the body reads
    // the live arrays. We snapshot the live array at effect-entry so
    // the body uses the same snapshot the hash was computed from.
    //
    // The hook's actual contract is "one fetch per (user, today_date)
    // — quiz/soulprint changes after a successful fetch do NOT re-fetch
    // on the same day" (lastFetchedDateRef guard at the top of the
    // effect). So this test can't assert "different quiz → different
    // fetches"; that doesn't happen under the current contract.
    //
    // What it CAN lock: the FIRST fetch's quizSectors arg must match
    // the value the caller passed at the render that triggered that
    // fetch. A future refactor that, for example, memoizes the
    // snapshot at hook-level (instead of effect-entry-level) would
    // freeze stale state and fail this test on a re-mounted hook.
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);

    const useFirstRunDaily = await loadHook();
    const { result } = renderHook(() =>
      useFirstRunDaily('user-1', VALID_BIRTH, null, [1, 2, 3], 'Taurus'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).not.toBeNull();
    });

    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);
    // fetchDailyExperience(birthData, soulprintSectors, quizSectors, date, locale, transit, sign)
    const args = fetchDailyExperienceMock.mock.calls[0];
    expect(args[2]).toEqual([1, 2, 3]);
  });
});
