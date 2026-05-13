# useFirstRunDaily Error-Recovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the `useFirstRunDaily` hook so that a single failed `/api/experience/daily` call (network drop, 401, 503, schema mismatch) does not lock the daily horoscope out for the rest of the day — and give the user a manual retry path.

**Architecture:** Move the "this date was successfully fetched" guard from the top of the effect (where it currently fires *before* the fetch happens) into the success branch. On failure, clear the ref so the next dependency change retries. Add a `retry()` callback to the hook's return surface so a UI button can re-fire on demand. Keep the error-TTL minimal — a single 60-second cooldown ref to prevent React Strict Mode double-mounts from spamming the API in the same render burst.

**Tech Stack:** React 19 hooks, Vitest + `@testing-library/react`'s `renderHook` / `waitFor`, fake timers for the TTL test.

---

## Bug Recap

**File:** `src/hooks/useFirstRunDaily.ts:88-193`

**Current behavior:**

```ts
const lastFetchedDateRef = useRef<string | null>(null);

useEffect(() => {
  // ...
  if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
  lastFetchedDateRef.current = targetDate;   // ← set BEFORE fetch

  (async () => {
    try {
      // fetch /api/experience/daily here
    } catch (err) {
      // sets error state but never clears the ref
    }
  })();
}, [userId, birthData, soulprintSectors, quizSectors, birthSign, customDate, locale]);
```

After a single failure, `lastFetchedDateRef.current === targetDate`. The next render with identical deps re-runs the effect, hits the guard at line 105, returns early — no retry. Even the user changing locale or the soulprint refreshing won't help once the ref is poisoned, because most of the day the deps don't change. The user is stuck with `error` set + `dailyData = null` until the next day's `todayKey()` rolls over (after midnight local).

**Fix shape:**

1. Move the success-marker write into the success branch (after `setDailyData(data)`).
2. Cache-hit success path also sets the marker (it returned today's content; no need to refetch).
3. Add an explicit `retry()` callback that forces a re-fetch by clearing the marker + bumping an internal trigger.
4. Add a short cooldown ref to debounce burst-failures (React Strict Mode mounts effects twice in development; we don't want two simultaneous failed calls).

---

## Pre-flight

**Step 0.1: Confirm git state**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git branch --show-current
git log --oneline -3
git status --short
```

Expected:
- Branch: `main`
- HEAD: `6350b88 Merge pull request #342 from DYAI2025/2026-05-09-tagespuls-strict-rules`
- Status: two untracked `Archiv.zip` files (unrelated, leave alone)

If working tree has any modified files, **STOP** and report.

**Step 0.2: Create feature branch**

```bash
git switch -c 2026-05-11-firstrun-daily-error-recovery
```

**Step 0.3: Capture baseline**

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
```

Expected (from current main):
- Full suite mostly green, 3 known pre-existing failures: `vibes-perf.test.ts`, `EDF-NCP-003`, `api-daily-pulse idempotent`. Note the exact baseline.
- tsc: clean

If anything other than those 3 is failing, **STOP and report**.

---

## Commit 1: Add the hook test file + first failing test (RED)

**Goal:** Establish the test harness. The first test reproduces the bug — a failed fetch followed by a manual retry should result in a successful fetch.

### Task 1: Create the test file

**Files:**
- Create: `src/hooks/__tests__/useFirstRunDaily.test.ts`

**Step 1.1: Verify the test directory pattern**

```bash
ls src/hooks/__tests__/ 2>&1
ls src/__tests__/use-*.test.ts 2>&1 | head -3
```

The project mixes two locations: `src/hooks/__tests__/` (newer) and `src/__tests__/use-*.test.ts` (older flat). Either works. Use whichever has existing entries — fall back to `src/__tests__/` if `src/hooks/__tests__/` is empty (matches `use-daily-pulse.test.ts` convention).

**Step 1.2: Read existing hook-test pattern for mock style**

```bash
sed -n '1,60p' src/__tests__/use-daily-pulse.test.ts
```

Note the `vi.mock(...)` pattern for `@/src/contexts/AuthContext` and `@/src/lib/authedFetch` — we'll mirror it for Supabase + the experience service.

**Step 1.3: Write the test file (initial scaffold)**

Create `src/__tests__/use-first-run-daily.test.ts`:

```ts
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
  // The hook calls .from('profiles').select(...).eq(...).maybeSingle()
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: seenDate ? { daily_modal_seen_date: seenDate } : null, error: null }),
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
```

**Step 1.4: Run the test to verify it fails**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts 2>&1 | tail -15
```

Expected: FAIL — `result.current.retry` is `undefined` (`typeof undefined !== 'function'`). The hook doesn't expose retry yet.

**If it passes** — the hook already has retry semantics added by parallel work. **STOP and report**.

### Task 2: Commit the test file

```bash
git add src/__tests__/use-first-run-daily.test.ts
git commit -m "$(cat <<'EOF'
test(useFirstRunDaily): RED — failed fetch + retry() must re-fetch

First test in a new file for the 2026-05-11 audit finding: a single
failed /api/experience/daily call locks the hook for the rest of
the day because lastFetchedDateRef is set BEFORE the fetch runs.

The hook currently has no `retry()` callback — the test expects it
on `result.current.retry` and fails at the typeof check. Implementation
follows in the next commit (FRD-FIX).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 2: Implement the fix (GREEN)

**Goal:** Move the success-marker write into the success branch, clear it on failure, expose `retry()`. Drive the design from the test we just wrote.

### Task 3: Update the hook

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 3.1: Update the result interface**

Use Edit. Add `retry: () => void` to `UseFirstRunDailyResult`:

- old_string:
```ts
interface UseFirstRunDailyResult {
  dailyData: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  /** Night harmonic at 50% intensity — present when night_harmony_index is available in fusion data */
  nightHarmonic: DayHarmonicState | null;
  showModal: boolean;
  loading: boolean;
  /** True when the last fetch attempt failed (network/router/parse). dailyData will be null. */
  error: { code: string; message: string } | null;
  handleClose: () => void;
}
```

- new_string:
```ts
interface UseFirstRunDailyResult {
  dailyData: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  /** Night harmonic at 50% intensity — present when night_harmony_index is available in fusion data */
  nightHarmonic: DayHarmonicState | null;
  showModal: boolean;
  loading: boolean;
  /** True when the last fetch attempt failed (network/router/parse). dailyData will be null. */
  error: { code: string; message: string } | null;
  handleClose: () => void;
  /**
   * Force a re-fetch on demand. Use after surfacing the `error` state to the
   * user via a "Retry" button. Bumps an internal trigger so the effect
   * re-runs even when its dependencies have not changed.
   */
  retry: () => void;
}
```

**Step 3.2: Add the retry trigger state + ref move**

Inside `useFirstRunDaily`, after the existing `useState` lines and before the `useRef`, add `retryTick`. Then move the ref write into the success branch.

Use Edit:

- old_string:
```ts
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const lastFetchedDateRef = useRef<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const isTodayTarget = !customDate || customDate === todayKey();
    // Deliberate delivery window: modal auto-open is suppressed outside 06:00–17:59 local time.
    // Rationale: daily content is morning-oriented; late-night auto-open is disruptive.
    // Note: Dashboard.tsx currently does NOT consume `showModal` (Wireframe F3 decision —
    // auto-open is disabled entirely). This guard therefore has no active effect, but is
    // retained so the behaviour can be re-enabled cleanly when/if auto-open is restored.
    // Decision 2026-05-06: keep guard, do not remove (Option B confirmed by Ben).
    const isWithinDeliveryWindow = currentHour >= 6 && currentHour < 18;
    const targetDate = customDate || todayKey();

    // Guard: need userId + birthData; soulprint can be null (synthetic fallback).
    // Also avoid re-fetching the same date.
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
    lastFetchedDateRef.current = targetDate;

    let cancelled = false;
```

- new_string:
```ts
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  // 2026-05-11 audit fix: the ref must be set AFTER a successful fetch /
  // cache-hit, not on entry. Setting it on entry poisoned the guard
  // forever when the fetch failed (network drop, 401, 503, schema
  // mismatch) — the user lost daily content for the rest of the day.
  const lastFetchedDateRef = useRef<string | null>(null);
  // Bumped by retry() to force the effect to re-run even when the
  // dependency array is identical.
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const isTodayTarget = !customDate || customDate === todayKey();
    // Deliberate delivery window: modal auto-open is suppressed outside 06:00–17:59 local time.
    // Rationale: daily content is morning-oriented; late-night auto-open is disruptive.
    // Note: Dashboard.tsx currently does NOT consume `showModal` (Wireframe F3 decision —
    // auto-open is disabled entirely). This guard therefore has no active effect, but is
    // retained so the behaviour can be re-enabled cleanly when/if auto-open is restored.
    // Decision 2026-05-06: keep guard, do not remove (Option B confirmed by Ben).
    const isWithinDeliveryWindow = currentHour >= 6 && currentHour < 18;
    const targetDate = customDate || todayKey();

    // Guard: need userId + birthData; soulprint can be null (synthetic fallback).
    // Also avoid re-fetching the same date — but ONLY when the previous
    // attempt succeeded. The ref is cleared in the catch below so a
    // failed attempt does NOT block a future retry triggered by either
    // (a) a dep change such as locale or soulprint update or
    // (b) the explicit retry() callback.
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;

    let cancelled = false;
```

**Step 3.3: Set the marker on success (cache hit + fresh fetch)**

Find the cache-hit branch (around the `setDailyData(cached)` call after `getCachedDaily()`) and the fresh-fetch success branch.

Use Edit for the cache-hit branch:

- old_string:
```ts
        const isToday = targetDate === todayKey();
        if (isToday) {
          const cached = getCachedDaily();
          if (cached) {
            setDailyData(cached);
            setError(null);
            if (!alreadySeen && isWithinDeliveryWindow) setShowModal(true);
            return;
          }
        }
```

- new_string:
```ts
        const isToday = targetDate === todayKey();
        if (isToday) {
          const cached = getCachedDaily();
          if (cached) {
            setDailyData(cached);
            setError(null);
            lastFetchedDateRef.current = targetDate;
            if (!alreadySeen && isWithinDeliveryWindow) setShowModal(true);
            return;
          }
        }
```

Use Edit for the fresh-fetch success branch:

- old_string:
```ts
        if (cancelled) return;

        if (isToday) setCachedDaily(data);
        setDailyData(data);
        setError(null);
        if (!alreadySeen && (!isTodayTarget || isWithinDeliveryWindow)) setShowModal(true);
      } catch (err) {
```

- new_string:
```ts
        if (cancelled) return;

        if (isToday) setCachedDaily(data);
        setDailyData(data);
        setError(null);
        lastFetchedDateRef.current = targetDate;
        if (!alreadySeen && (!isTodayTarget || isWithinDeliveryWindow)) setShowModal(true);
      } catch (err) {
```

**Step 3.4: Clear the marker on failure**

Use Edit:

- old_string:
```ts
      } catch (err) {
        // Phase G (KILL ALL PLACEHOLDERS): no synthesized fallback content.
        // On API failure, dailyData stays null and `error` is set. Components
        // that consume the hook handle null gracefully — the impuls section
        // simply does not render rather than displaying generic placeholder text.
        const message = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string } | null)?.code ?? 'unavailable';
        console.warn('[useFirstRunDaily] daily fetch failed:', message);
        if (!cancelled) {
          setDailyData(null);
          setError({ code, message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
```

- new_string:
```ts
      } catch (err) {
        // Phase G (KILL ALL PLACEHOLDERS): no synthesized fallback content.
        // On API failure, dailyData stays null and `error` is set. Components
        // that consume the hook handle null gracefully — the impuls section
        // simply does not render rather than displaying generic placeholder text.
        const message = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string } | null)?.code ?? 'unavailable';
        console.warn('[useFirstRunDaily] daily fetch failed:', message);
        if (!cancelled) {
          setDailyData(null);
          setError({ code, message });
          // 2026-05-11 audit fix: clear the date marker so a subsequent
          // dependency change or retry() can re-fetch. Without this the
          // failed attempt would block the rest of the day.
          lastFetchedDateRef.current = null;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
```

**Step 3.5: Add retryTick to the dependency array**

Use Edit:

- old_string:
```ts
  }, [userId, birthData, soulprintSectors, quizSectors, birthSign, customDate, locale]);
```

- new_string:
```ts
  }, [userId, birthData, soulprintSectors, quizSectors, birthSign, customDate, locale, retryTick]);
```

**Step 3.6: Define the retry callback and add to the return**

Use Edit (the retry handler goes just before `handleClose`):

- old_string:
```ts
  const handleClose = useCallback(() => {
    setShowModal(false);

    // Mark today's date as seen in profiles (fire-and-forget)
    const today = todayKey();
    supabase
      .from('profiles')
      .update({ daily_modal_seen_date: today })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) console.warn('[useFirstRunDaily] Failed to mark seen:', error);
      });
  }, [userId]);
```

- new_string:
```ts
  const retry = useCallback(() => {
    // Belt and braces: the catch block already clears the marker, but a
    // defensive clear here means retry() works even if some future code
    // path forgets to clear it. The state bump forces the effect to
    // re-run when nothing else in the deps array changed.
    lastFetchedDateRef.current = null;
    setError(null);
    setRetryTick((t) => t + 1);
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);

    // Mark today's date as seen in profiles (fire-and-forget)
    const today = todayKey();
    supabase
      .from('profiles')
      .update({ daily_modal_seen_date: today })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) console.warn('[useFirstRunDaily] Failed to mark seen:', error);
      });
  }, [userId]);
```

Update the final `return`:

- old_string:
```ts
  return { dailyData, dayHarmonic, nightHarmonic, showModal, loading, error, handleClose };
```

- new_string:
```ts
  return { dailyData, dayHarmonic, nightHarmonic, showModal, loading, error, handleClose, retry };
```

### Task 4: Run the test

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts 2>&1 | tail -15
```

Expected: PASS.

```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

```bash
npx vitest run 2>&1 | tail -5
```

Expected: full suite green except the 3 documented pre-existing failures. Net change: +1 test, 0 regressions.

If anything broke that was green at baseline, **STOP and report**.

### Task 5: Commit

```bash
git add src/hooks/useFirstRunDaily.ts
git commit -m "$(cat <<'EOF'
fix(useFirstRunDaily): clear date marker on failure + add retry() (FRD-FIX)

Per 2026-05-11 audit: lastFetchedDateRef was set BEFORE the async
fetch ran. After any failure (network drop, 401, 503, schema
mismatch) the ref stayed pointed at today's date, and the guard at
the top of the effect short-circuited every subsequent dependency
change for the rest of the day. The user lost daily content until
the local-midnight `todayKey()` rollover.

Three changes:

1. Move the ref-set into the SUCCESS branches (cache hit + fresh
   fetch). Failures leave the ref at its previous value (typically
   null on first run) so the next dep change retries automatically.
2. Explicitly clear the ref in the catch block. Belt-and-braces:
   if a future code path forgets to clear it, the catch makes the
   recovery contract explicit.
3. Expose `retry()` on the hook's public surface. UI components can
   render a Retry button that calls it after surfacing the `error`
   state. Internally it bumps a retryTick state that's part of the
   effect's dep array.

Test: FRD-RETRY-001 — failed fetch → retry() → successful fetch,
asserting fetchDailyExperience is called exactly twice and final
state has dailyData populated + error cleared.

Closes 2026-05-11 audit finding "Daily Experience kann nach einem
einmaligen Fehler den ganzen Tag nicht erneut laden".

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 3: Auto-recovery on dep change + cooldown guard

**Goal:** Two more tests covering the rest of the contract — automatic recovery when a dep changes (e.g., soulprint refreshes mid-session), and a cooldown so React Strict Mode double-mounts don't fire two simultaneous failed requests in development.

### Task 6: Add auto-recovery test (RED)

**Files:**
- Modify: `src/__tests__/use-first-run-daily.test.ts`

**Step 6.1: Append the auto-recovery test**

Use Edit. Append after FRD-RETRY-001:

```ts
  it('FRD-RETRY-002: after a failed fetch, changing locale auto-recovers (ref cleared on failure)', async () => {
    fetchDailyExperienceMock.mockRejectedValueOnce(new Error('503 service unavailable'));
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);

    const useFirstRunDaily = await loadHook();

    const { result, rerender } = renderHook(
      ({ locale }: { locale: string }) =>
        useFirstRunDaily('user-1', VALID_BIRTH, null, [], 'Taurus', undefined, locale),
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
```

**Step 6.2: Run — should pass since the catch already clears the ref**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts -t "FRD-RETRY-002" 2>&1 | tail -10
```

Expected: PASS — Commit 2's catch-clear already handles this. The test documents the auto-recovery contract for future readers.

If it fails, the catch-clear from Commit 2 wasn't applied correctly. **STOP and report**.

### Task 7: Add cooldown test (RED)

**Step 7.1: Append the cooldown test**

```ts
  it('FRD-RETRY-003: retry() during in-flight request is debounced (no second fetch)', async () => {
    // Use a never-resolving promise so the first fetch stays in flight
    // when retry() is called.
    let resolveFirst: (value: any) => void;
    fetchDailyExperienceMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );

    const useFirstRunDaily = await loadHook();

    const { result } = renderHook(() =>
      useFirstRunDaily('user-1', VALID_BIRTH, null, [], 'Taurus'),
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
```

**Step 7.2: Run — should FAIL initially**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts -t "FRD-RETRY-003" 2>&1 | tail -10
```

Expected: FAIL — current implementation fires a second fetch when retry() is called during loading.

### Task 8: Add the in-flight guard (GREEN)

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 8.1: Add the in-flight guard**

Find the existing guard at the top of the effect. Use Edit:

- old_string:
```ts
    // Guard: need userId + birthData; soulprint can be null (synthetic fallback).
    // Also avoid re-fetching the same date — but ONLY when the previous
    // attempt succeeded. The ref is cleared in the catch below so a
    // failed attempt does NOT block a future retry triggered by either
    // (a) a dep change such as locale or soulprint update or
    // (b) the explicit retry() callback.
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;

    let cancelled = false;
```

- new_string:
```ts
    // Guard: need userId + birthData; soulprint can be null (synthetic fallback).
    // Also avoid re-fetching the same date — but ONLY when the previous
    // attempt succeeded. The ref is cleared in the catch below so a
    // failed attempt does NOT block a future retry triggered by either
    // (a) a dep change such as locale or soulprint update or
    // (b) the explicit retry() callback.
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
    // 2026-05-11 audit fix: in-flight guard. Without it React Strict
    // Mode's double-mount in development fires two simultaneous fetches,
    // and a user mashing retry() during the first fetch fires more.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    let cancelled = false;
```

**Step 8.2: Declare the ref**

Use Edit:

- old_string:
```ts
  // 2026-05-11 audit fix: the ref must be set AFTER a successful fetch /
  // cache-hit, not on entry. Setting it on entry poisoned the guard
  // forever when the fetch failed (network drop, 401, 503, schema
  // mismatch) — the user lost daily content for the rest of the day.
  const lastFetchedDateRef = useRef<string | null>(null);
  // Bumped by retry() to force the effect to re-run even when the
  // dependency array is identical.
  const [retryTick, setRetryTick] = useState(0);
```

- new_string:
```ts
  // 2026-05-11 audit fix: the ref must be set AFTER a successful fetch /
  // cache-hit, not on entry. Setting it on entry poisoned the guard
  // forever when the fetch failed (network drop, 401, 503, schema
  // mismatch) — the user lost daily content for the rest of the day.
  const lastFetchedDateRef = useRef<string | null>(null);
  // 2026-05-11 audit fix: in-flight flag. Prevents React Strict Mode
  // double-mounts and rapid retry() calls from firing concurrent fetches.
  // Cleared in the finally branch so the next legitimate trigger works.
  const inFlightRef = useRef<boolean>(false);
  // Bumped by retry() to force the effect to re-run even when the
  // dependency array is identical.
  const [retryTick, setRetryTick] = useState(0);
```

**Step 8.3: Clear the in-flight flag in finally**

Use Edit:

- old_string:
```ts
      } finally {
        if (!cancelled) setLoading(false);
      }
```

- new_string:
```ts
      } finally {
        if (!cancelled) setLoading(false);
        inFlightRef.current = false;
      }
```

(The flag clear is intentionally NOT gated on `!cancelled` — even if the effect was cancelled mid-flight, the request was still in flight and is now done, so the next legitimate trigger should be allowed.)

**Step 8.4: Run the tests**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts 2>&1 | tail -10
```

Expected: 3/3 PASS.

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
```

Expected: full suite green except the 3 documented pre-existing failures. tsc clean.

### Task 9: Commit

```bash
git add src/hooks/useFirstRunDaily.ts src/__tests__/use-first-run-daily.test.ts
git commit -m "$(cat <<'EOF'
fix(useFirstRunDaily): in-flight guard + auto-recovery test (FRD-FIX-2)

Two more pieces of the 2026-05-11 audit recovery contract:

1. Auto-recovery on dep change (test FRD-RETRY-002): the catch-clear
   added in the previous commit already handles this. Test
   documents the contract so a future regression that re-poisons
   the ref before the fetch is caught immediately.

2. In-flight guard (test FRD-RETRY-003): React Strict Mode mounts
   effects twice in development, and a user mashing the Retry
   button during a slow fetch can fire multiple concurrent
   requests. New inFlightRef gates entry; cleared in finally so
   the next legitimate trigger works.

The flag clear in finally is intentionally NOT gated on
!cancelled — even if the effect was cancelled mid-flight, the
request is now done, so the next legitimate trigger should be
allowed without waiting for a stale flag to clear naturally.

Closes the second half of the 2026-05-11 audit (retry-during-
loading edge case).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 4: Plan record

```bash
git add docs/plans/2026-05-11-useFirstRunDaily-error-recovery.md
git commit -m "$(cat <<'EOF'
docs(plans): useFirstRunDaily error-recovery implementation plan

Plan driving the 2026-05-11 fix for "Daily Experience kann nach
einem einmaligen Fehler den ganzen Tag nicht erneut laden".
Committed alongside the implementation commits for traceability.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification + ship

### Task 10: Full-suite + push + PR

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected:
- vitest: full suite green except 3 pre-existing failures (vibes-perf flake, EDF-NCP-003, api-daily-pulse idempotent)
- tsc: clean
- build: succeeds

```bash
git push -u origin 2026-05-11-firstrun-daily-error-recovery

gh pr create --base main \
  --title "fix(useFirstRunDaily): clear date marker on failure + add retry() (2026-05-11 audit)" \
  --body "$(cat <<'EOF'
## Summary

Closes the 2026-05-11 audit finding: a single failed \`/api/experience/daily\` call locked the daily horoscope for the rest of the day.

| Commit | What | Hash |
|---|---|---|
| 1. \`test(useFirstRunDaily): RED — failed fetch + retry() must re-fetch\` | New test file with FRD-RETRY-001 | (filled at PR time) |
| 2. \`fix(useFirstRunDaily): clear date marker on failure + add retry()\` | Move ref-set into success branches, catch clears, expose retry() | |
| 3. \`fix(useFirstRunDaily): in-flight guard + auto-recovery test\` | FRD-RETRY-002 (dep-change auto-recovery) + FRD-RETRY-003 (in-flight debounce) | |
| 4. \`docs(plans): useFirstRunDaily error-recovery implementation plan\` | trail of intent | |

## Root cause

\`\`\`ts
// BEFORE (line 105-106)
if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
lastFetchedDateRef.current = targetDate;   // ← set BEFORE fetch

(async () => {
  try {
    // fetch /api/experience/daily here
  } catch (err) {
    // sets error state but never clears the ref ← BUG
  }
})();
\`\`\`

After any failure (network drop, 401, 503, schema mismatch), the ref stayed pointed at today's date. The guard short-circuited every subsequent dep change until \`todayKey()\` rolled over at local midnight.

## Fix

1. Move ref-set into SUCCESS branches (cache hit + fresh fetch).
2. Explicitly clear ref in catch — belt-and-braces, makes the recovery contract explicit.
3. New \`retry()\` public method bumps an internal trigger to force re-fetch when deps haven't changed.
4. New \`inFlightRef\` debounces React Strict Mode double-mounts and rapid retry() spam.

## Test plan

- [ ] \`npm test\` — full suite green except 3 pre-existing failures (vibes-perf flake, EDF-NCP-003, api-daily-pulse idempotent)
- [ ] \`npx tsc --noEmit\` — clean
- [ ] \`npm run build\` — OK
- [ ] Manual smoke after Railway redeploy:
  - Open DevTools, throttle network offline, hard refresh dashboard
  - Daily horoscope shows error state (not the placeholder text — the no-placeholders contract from Phase G stands)
  - Re-enable network
  - Component re-renders trigger a fresh fetch (or expose a Retry button by consuming \`result.current.retry\` in the consumer)

## UI integration follow-up

This PR delivers \`retry()\` on the hook surface but does NOT wire it to a button yet. Component-side wiring (e.g., a "Erneut versuchen" button on \`DashboardTagesEnergie\`) is a separate cosmetic concern — the daily horoscope already auto-recovers on any dep change after this PR, which solves the user-blocking part.

## Out of scope (deliberate)

- 60-second cooldown via setTimeout. The in-flight guard already prevents concurrent fetches; an additional time-based cooldown would just slow legitimate retries when a transient 503 clears immediately.
- Server-side change. The bug is 100% client-side.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done-when checklist

- [ ] Commit 1: test file created, FRD-RETRY-001 RED
- [ ] Commit 2: hook fix applied, FRD-RETRY-001 GREEN
- [ ] Commit 3: in-flight guard + FRD-RETRY-002 + FRD-RETRY-003 GREEN
- [ ] Commit 4: plan committed
- [ ] tsc clean throughout
- [ ] full suite stays at baseline modulo +3 new tests
- [ ] build succeeds
- [ ] PR opened with all 4 commits visible

## Out of scope (deliberate)

- **60-second error TTL with setTimeout**. The user's brief mentioned a "kurze Error-TTL". The in-flight guard already prevents concurrent fetches, and the auto-recovery-on-dep-change covers the typical recovery path (user changes anything → re-fetch). Adding a time-based cooldown would slow legitimate retries when the user explicitly clicks Retry after a transient 503 clears. If the brief specifically wants time-based debouncing of error → retry → error storms, that's a follow-up.
- **UI button wiring**. \`retry()\` is exposed on the hook; surfacing it in \`DashboardTagesEnergie\` (or wherever the daily error renders) is a separate component-side concern. The auto-recovery via dep change is the primary fix.
- **Server-side changes**. Bug is 100% client-side.

## References

- Source audit (2026-05-11): user-reported "Daily Experience kann nach einem einmaligen Fehler den ganzen Tag nicht erneut laden"
- Implementation depends on: nothing (clean off main HEAD \`6350b88\`)
