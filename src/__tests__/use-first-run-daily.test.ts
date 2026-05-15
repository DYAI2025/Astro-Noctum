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

  it('FRD-RETRY-004: dependency changes while in flight invalidate stale response and fetch latest inputs', async () => {
    const staleDaily = { ...VALID_DAILY, meta: { engine_version: 'stale-de' } };
    const freshDaily = { ...VALID_DAILY, meta: { engine_version: 'fresh-en' } };

    let resolveStale!: (value: unknown) => void;
    let resolveFresh!: (value: unknown) => void;
    fetchDailyExperienceMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );
    fetchDailyExperienceMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFresh = resolve;
      }),
    );

    const useFirstRunDaily = await loadHook();
    const STABLE_QUIZ: number[] = [];

    const { result, rerender } = renderHook(
      ({ locale }: { locale: string }) =>
        useFirstRunDaily('user-1', VALID_BIRTH, null, STABLE_QUIZ, 'Taurus', undefined, locale),
      { initialProps: { locale: 'de-DE' } },
    );

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);

    rerender({ locale: 'en-US' });

    // The locale change is a meaningful dependency change, but it should be
    // queued rather than dispatched concurrently while the first request runs.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveStale(staleDaily);
    });

    await waitFor(() => expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(2));
    expect(fetchDailyExperienceMock.mock.calls[1][4]).toBe('en-US');
    expect(result.current.dailyData).toBeNull();

    act(() => {
      resolveFresh(freshDaily);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).toEqual(freshDaily);
    });

    expect(result.current.dailyData).not.toEqual(staleDaily);
    expect(result.current.error).toBeNull();
  });

  it('FRD-RETRY-005: switching back to an already-fetched key invalidates the active request', async () => {
    const loadedDaily = { ...VALID_DAILY, meta: { engine_version: 'loaded-de' } };
    const staleDaily = { ...VALID_DAILY, meta: { engine_version: 'stale-en' } };

    fetchDailyExperienceMock.mockResolvedValueOnce(loadedDaily);
    let resolveStale!: (value: unknown) => void;
    fetchDailyExperienceMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );

    const useFirstRunDaily = await loadHook();
    const STABLE_QUIZ: number[] = [];

    const { result, rerender } = renderHook(
      ({ locale }: { locale: string }) =>
        useFirstRunDaily('user-1', VALID_BIRTH, null, STABLE_QUIZ, 'Taurus', undefined, locale),
      { initialProps: { locale: 'de-DE' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).toEqual(loadedDaily);
    });
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);

    rerender({ locale: 'en-US' });
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(2);

    rerender({ locale: 'de-DE' });
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(2);

    act(() => {
      resolveStale(staleDaily);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dailyData).toEqual(loadedDaily);
    });

    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(2);
    expect(result.current.dailyData).not.toEqual(staleDaily);
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
});
