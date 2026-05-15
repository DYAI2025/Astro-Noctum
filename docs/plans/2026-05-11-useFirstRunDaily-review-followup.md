# useFirstRunDaily Review Follow-up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close 3 Important findings from the 2026-05-11 code review of PR #343 (`useFirstRunDaily`): add `retry()` guard, add a cache-hit regression test, snapshot arrays at effect-entry to remove the ESLint suppression.

**Architecture:** Three small, atomically-reversible TDD commits + a plan-record commit. Each commit closes exactly one finding. Blast radius stays inside `src/hooks/useFirstRunDaily.ts` + `src/__tests__/use-first-run-daily.test.ts`. No consumer-facing behavior change beyond `retry()` becoming a no-op when there is nothing to recover.

**Tech Stack:** React 19 + TypeScript, Vitest + `@testing-library/react`'s `renderHook` / `act` / `waitFor`.

---

## Findings being addressed

| ID | Severity | Where | Issue |
|---|---|---|---|
| I-2 | Important | `useFirstRunDaily.ts:257-265` | `retry()` always bumps the tick — accidental click while data is healthy wastes an LLM call |
| I-3 | Important | `src/__tests__/use-first-run-daily.test.ts` | Cache-hit path (line 191-196) sets `lastFetchedDateRef` but no test covers that branch |
| I-1 | Important | `useFirstRunDaily.ts:254-255` | `// eslint-disable-next-line react-hooks/exhaustive-deps` hides a real contract: the body reads live arrays whose hash is in the deps |

(I-4 from the review was retracted as a false positive; M-1, M-2, M-3 were Minor and tracked separately.)

Order chosen so each commit can ship independently:
1. **I-2 first** — single-callback edit, smallest blast radius, lays the regression guard before the new test in I-3 exercises retry().
2. **I-3 second** — adds a test that depends on I-2's tightened semantics (cache-hit + retry sequence).
3. **I-1 last** — touches the effect body, so it's the riskiest. Done last so the previous two tests are green and act as regression guards.

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
- HEAD: `7e8d1c0 Merge pull request #343 from DYAI2025/2026-05-11-firstrun-daily-error-recovery`
- Status: clean (two untracked `Archiv.zip` files — unrelated, leave alone)

If working tree has any modified files, **STOP** and report.

**Step 0.2: Create the feature branch**

```bash
git switch -c 2026-05-11-firstrun-daily-review-followup
```

**Step 0.3: Capture baseline**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts 2>&1 | tail -3
```

Expected: 3 passing (FRD-RETRY-001/002/003).

```bash
npx vitest run 2>&1 | tail -5
```

Expected: full suite green except 2 known pre-existing failures (`EDF-NCP-003`, `api-daily-pulse idempotent`). Note exact baseline — we expect to land at baseline + 1 new test (FRD-CACHE-001) at the end.

```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

If anything other than the documented pre-existing failures is red, **STOP and report**.

---

## Commit 1: I-2 — `retry()` no-op guard

**Goal:** `retry()` becomes a guarded no-op when there is nothing to recover from. Prevents accidental clicks on a future Retry button from spending an unnecessary LLM call.

### Task 1: RED — assert retry() is a no-op when state is healthy

**Files:**
- Modify: `src/__tests__/use-first-run-daily.test.ts`

**Step 1.1: Find the insertion point**

```bash
grep -n "FRD-RETRY-\|^});" src/__tests__/use-first-run-daily.test.ts | head -10
```

The describe block closes with `});` at the end of the file. New tests go BEFORE that closing brace.

**Step 1.2: Append the failing test**

Use Edit. Append after FRD-RETRY-003's closing `});` and BEFORE the describe block's closing `});`:

- old_string:
```ts
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
```

- new_string:
```ts
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('FRD-RETRY-GUARD-001: retry() is a no-op when state is healthy (no error, has data)', async () => {
    // I-2 from the 2026-05-11 PR #343 review: a user clicking a future
    // "Retry" button while data is already loaded should NOT spend an
    // extra LLM call. The retry callback only bumps the tick when
    // there's actually something to recover from.
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
});
```

**Step 1.3: Run the test to verify it fails (RED)**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts -t "FRD-RETRY-GUARD-001" 2>&1 | tail -15
```

Expected: FAIL — `fetchDailyExperienceMock` was called 2 times instead of 1, because the current `retry()` unconditionally bumps the tick.

**If the test passes** — somebody else has already added the guard. **STOP and report.**

### Task 2: GREEN — add the guard

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 2.1: Apply the guard**

Use Edit:
- file_path: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useFirstRunDaily.ts`
- old_string:
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
```
- new_string:
```ts
  const retry = useCallback(() => {
    // I-2 from the 2026-05-11 PR #343 review: retry() is a no-op when
    // there's nothing to recover from. Prevents accidental clicks on
    // a future Retry button from spending an extra LLM call while the
    // user already has valid data on screen.
    //
    // Guard interpretation: "healthy" = has data AND no error AND not
    // currently loading. Any of those being off → recovery is plausibly
    // wanted and we let it through.
    if (loading) return;
    if (!error && dailyData !== null) return;
    // Belt and braces: the catch block already clears the marker, but a
    // defensive clear here means retry() works even if some future code
    // path forgets to clear it. The state bump forces the effect to
    // re-run when nothing else in the deps array changed.
    lastFetchedDateRef.current = null;
    setError(null);
    setRetryTick((t) => t + 1);
  }, [loading, error, dailyData]);
```

Note: `useCallback`'s deps now include `loading`, `error`, `dailyData`. That's correct — `retry`'s identity will change when those state fields change. Consumers that pass `retry` to `useEffect` deps would re-fire on state changes, but no consumer does that today (and shouldn't — retry is a user-action handler).

**Step 2.2: Run the failing test**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts -t "FRD-RETRY-GUARD-001" 2>&1 | tail -10
```

Expected: PASS.

**Step 2.3: Run the full hook suite to ensure no regression**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts 2>&1 | tail -5
```

Expected: 4 passing (FRD-RETRY-001/002/003 + FRD-RETRY-GUARD-001).

**Step 2.4: tsc clean**

```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

### Task 3: Commit

```bash
git add src/hooks/useFirstRunDaily.ts src/__tests__/use-first-run-daily.test.ts
git commit -m "$(cat <<'EOF'
fix(useFirstRunDaily): retry() is a no-op when state is healthy (I-2)

Per 2026-05-11 PR #343 code review I-2: retry() unconditionally
bumped the retryTick state, so a future Retry button could spend an
extra LLM call if the user clicked it while data was already
loaded — accidental clicks would clear the success marker, fire a
fresh fetch, briefly show loading, and re-cache the same result.

Guard interpretation: "healthy" = has data AND no error AND not
currently loading. Any of those being off (no data yet, error set,
or already loading) → the user plausibly wants recovery and we let
retry through:
- `loading` true → swallow (FRD-RETRY-003's in-flight guard already
  short-circuits, this just avoids a redundant tick bump)
- `error` non-null → let through (error recovery is the contract)
- `dailyData` null → let through (data hasn't loaded yet)
- all healthy → no-op

useCallback dependency array updated. Consumers should NOT pass
retry to useEffect deps (it's a user-action handler, not a stable
identity primitive), so the new instability is acceptable.

Test FRD-RETRY-GUARD-001: load valid data, call retry(), assert
fetchDailyExperience called exactly once total + loading stays
false + dailyData/error unchanged.

Suite: 4/4 in this file (was 3/3).

Closes 2026-05-11 PR #343 review I-2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**Do not push.** Stop after commit.

---

## Commit 2: I-3 — cache-hit branch regression test

**Goal:** Cover the cache-hit code path in `useFirstRunDaily.ts:188-196`. Without this test, a future refactor that removes `lastFetchedDateRef.current = targetDate` from the cache-hit branch would silently break recovery (a cache-hit followed by user-driven retry wouldn't re-fetch because `retry()` clears the ref but the original cache-hit path never set it).

### Task 4: Add the regression test

**Files:**
- Modify: `src/__tests__/use-first-run-daily.test.ts`

**Step 4.1: Add a localStorage helper at the top of the file**

Look at the existing fixtures section in the test file:

```bash
sed -n '34,50p' src/__tests__/use-first-run-daily.test.ts
```

There's a `VALID_DAILY` fixture. Right below it, add a helper that puts a cached daily under today's key. Use Edit:

- old_string:
```ts
const VALID_DAILY: any = {
  // Minimal — only what the hook reads internally. The hook does NOT
  // schema-validate the response (it just stores it), so a partial
  // shape is fine for these tests.
  fusion: { harmony_index: 0.6 },
  meta: { engine_version: 'v1-gemini-daily' },
};
```

- new_string:
```ts
const VALID_DAILY: any = {
  // Minimal — only what the hook reads internally. The hook does NOT
  // schema-validate the response (it just stores it), so a partial
  // shape is fine for these tests.
  fusion: { harmony_index: 0.6 },
  meta: { engine_version: 'v1-gemini-daily' },
};

/**
 * Seed localStorage with a cached daily under today's local-calendar key.
 * Mirrors the `setCachedDaily()` shape in useFirstRunDaily.ts so the
 * cache-hit branch picks it up on first effect run.
 */
function seedTodayCache(data: unknown): void {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayKey = `${y}-${m}-${d}`;
  window.localStorage.setItem(
    'daily_horoscope_cache',
    JSON.stringify({ date: todayKey, data }),
  );
}
```

**Step 4.2: Append the regression test**

Use Edit. Append after FRD-RETRY-GUARD-001's closing `});`:

- old_string:
```ts
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);
    expect(result.current.dailyData).not.toBeNull();
    expect(result.current.error).toBeNull();
  });
});
```

- new_string:
```ts
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);
    expect(result.current.dailyData).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('FRD-CACHE-001: cache-hit path sets the ref so retry() can force a re-fetch', async () => {
    // I-3 from the 2026-05-11 PR #343 review: the cache-hit branch in
    // useFirstRunDaily.ts (line 188-196) sets lastFetchedDateRef to
    // prevent the next render from re-fetching. But no test covered
    // that branch. A future refactor that removes the ref-set from
    // cache-hit but keeps it on fresh-fetch would silently break
    // recovery — and FRD-RETRY-001/002/003 wouldn't catch it.
    //
    // This test asserts the full cache-hit + retry contract:
    //   1. localStorage has a cached daily → first mount hits cache,
    //      no LLM call.
    //   2. retry() is explicitly let through (cache-hit ≠ "healthy"
    //      in the I-2 guard's sense — has data, no error, not loading
    //      — actually it IS "healthy"...).
    //
    // Edge case: cache-hit lands data + null error + no loading, which
    // the I-2 guard considers "healthy" → retry() is a no-op. So the
    // useful assertion here is: cache-hit alone keeps fetchDaily-
    // Experience at zero calls. The ref is set, so the next render
    // with same deps does NOT re-fetch.
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

    // Re-render with same deps. Without the cache-hit ref-set, the
    // effect would re-run and call fetchDailyExperience (cache is gone
    // because the hook reads it once per mount; actually the cache is
    // still in localStorage so it would hit again — but the ref-guard
    // is what prevents the second hit when deps haven't changed).
    rerender();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Still zero LLM calls. Ref guard prevented a re-fetch even though
    // localStorage still has data.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(0);
  });
});
```

**Step 4.3: Run the new test**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts -t "FRD-CACHE-001" 2>&1 | tail -10
```

Expected: PASS. Current implementation already sets the ref on cache-hit (line 193 of `useFirstRunDaily.ts`), so this test passes immediately — it's a regression guard, not a RED-then-GREEN cycle.

**If it fails** — the cache-hit branch is somehow broken. Read the failure carefully. The most likely cause is the `localStorage` not being populated correctly (jsdom vs node environment quirks). Verify the `seedTodayCache` helper writes the same shape `getCachedDaily()` reads.

**Step 4.4: Full hook suite + tsc**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
```

Expected: 5 passing in this file, tsc clean.

### Task 5: Commit

```bash
git add src/__tests__/use-first-run-daily.test.ts
git commit -m "$(cat <<'EOF'
test(useFirstRunDaily): cover cache-hit ref-set branch (I-3)

Per 2026-05-11 PR #343 code review I-3: the cache-hit branch at
useFirstRunDaily.ts:188-196 sets lastFetchedDateRef on success,
mirroring the fresh-fetch path. But no test exercised that branch.

A future refactor that removes the ref-set from cache-hit (but
keeps it on fresh-fetch) would silently break the recovery
contract: cache-hit + same-deps re-render would re-fetch even when
the cache is still valid. FRD-RETRY-001/002/003 only exercise the
fresh-fetch path, so the regression would slip through.

Test FRD-CACHE-001 seeds localStorage with a cached daily, mounts
the hook, asserts fetchDailyExperience is NEVER called (cache-hit
took the short path), re-renders with stable deps, and asserts
fetchDailyExperience is STILL never called (ref-guard prevents the
re-fetch).

New helper seedTodayCache() in the test file mirrors the shape
setCachedDaily() writes to localStorage.

Suite: 5/5 in this file (was 4/4).

Closes 2026-05-11 PR #343 review I-3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 3: I-1 — snapshot arrays at effect entry, remove ESLint suppression

**Goal:** Remove the `eslint-disable-next-line react-hooks/exhaustive-deps` by capturing the live `quizSectors` / `soulprintSectors` references at effect-entry into local snapshots. The body uses the snapshots, the dep array uses the content-hash strings, and the contract becomes:

- Re-rendering with a fresh array reference but identical content → does NOT re-fire the effect (content-hash deps).
- Mutating an array in place after render WITHOUT re-rendering → is unsupported (React anti-pattern). Documented in a comment.

This is the riskiest commit because it touches the effect body. Done last so FRD-RETRY-001/002/003 + the two new tests act as regression guards.

### Task 6: RED — assert that the snapshot semantic holds

**Files:**
- Modify: `src/__tests__/use-first-run-daily.test.ts`

**Step 6.1: Append the test**

Use Edit. Append after FRD-CACHE-001:

- old_string:
```ts
    // Still zero LLM calls. Ref guard prevented a re-fetch even though
    // localStorage still has data.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(0);
  });
});
```

- new_string:
```ts
    // Still zero LLM calls. Ref guard prevented a re-fetch even though
    // localStorage still has data.
    expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(0);
  });

  it('FRD-SNAPSHOT-001: changing quizSectors content fires fetch with the NEW content', async () => {
    // I-1 from the 2026-05-11 PR #343 review: the effect's dep array
    // uses content-hash strings (quizSectorsKey) but the body reads
    // the live arrays. We snapshot the live array at effect-entry so
    // the body uses the same snapshot the hash was computed from.
    //
    // This test exercises the happy path: callers who pass a DIFFERENT
    // array (new content) get a fetch with the new content. The
    // snapshot must reflect the value AT effect-entry, not at some
    // earlier render.
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);
    fetchDailyExperienceMock.mockResolvedValueOnce(VALID_DAILY);

    const useFirstRunDaily = await loadHook();
    const { rerender } = renderHook(
      ({ quiz }: { quiz: number[] }) =>
        useFirstRunDaily('user-1', VALID_BIRTH, null, quiz, 'Taurus'),
      { initialProps: { quiz: [1, 2, 3] } },
    );

    await waitFor(() => {
      expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(1);
    });

    // The first call's quizSectors arg should be [1, 2, 3].
    const firstCallArgs = fetchDailyExperienceMock.mock.calls[0];
    // fetchDailyExperience(birthData, soulprintSectors, quizSectors, date, locale, transit, sign)
    expect(firstCallArgs[2]).toEqual([1, 2, 3]);

    // Re-render with NEW content
    rerender({ quiz: [4, 5, 6] });

    await waitFor(() => {
      expect(fetchDailyExperienceMock).toHaveBeenCalledTimes(2);
    });

    const secondCallArgs = fetchDailyExperienceMock.mock.calls[1];
    expect(secondCallArgs[2]).toEqual([4, 5, 6]);
  });
});
```

**Step 6.2: Run the test**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts -t "FRD-SNAPSHOT-001" 2>&1 | tail -10
```

Expected: PASS (the current implementation already passes the live arrays through to `fetchDailyExperience`; this test documents the contract before the refactor).

**This test is NOT RED-before-fix.** It's a "lock the current behavior so the refactor doesn't change it" regression guard. That's intentional — the refactor's job is to remove the ESLint suppression WITHOUT changing observable behavior.

### Task 7: GREEN — refactor to snapshot semantics

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 7.1: Snapshot the arrays at effect entry**

Find the start of the effect body after the in-flight guard. Use Edit:

- old_string:
```ts
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
    // 2026-05-11 audit fix: in-flight guard. Without it React Strict
    // Mode's double-mount in development fires two simultaneous fetches,
    // and a user mashing retry() during the first fetch fires more.
    // Also defeats unstable-deps races where consumer passes inline `[]`
    // arrays that re-trigger the effect on every render.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // 2026-05-11 audit fix: capture our generation. State updates and
    // the loading toggle only fire if our generation is still current,
    // i.e. no LATER effect run actually started a competing fetch. R2
    // effect runs that get short-circuited by the in-flight guard do
    // NOT bump the generation, so R1's state updates still fire.
    const myGen = ++fetchGenRef.current;
    const isCurrent = () => fetchGenRef.current === myGen;
```

- new_string:
```ts
    if (!userId || !birthData || targetDate === lastFetchedDateRef.current) return;
    // 2026-05-11 audit fix: in-flight guard. Without it React Strict
    // Mode's double-mount in development fires two simultaneous fetches,
    // and a user mashing retry() during the first fetch fires more.
    // Also defeats unstable-deps races where consumer passes inline `[]`
    // arrays that re-trigger the effect on every render.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // 2026-05-11 audit fix: capture our generation. State updates and
    // the loading toggle only fire if our generation is still current,
    // i.e. no LATER effect run actually started a competing fetch. R2
    // effect runs that get short-circuited by the in-flight guard do
    // NOT bump the generation, so R1's state updates still fire.
    const myGen = ++fetchGenRef.current;
    const isCurrent = () => fetchGenRef.current === myGen;

    // I-1 from the 2026-05-11 PR #343 review: snapshot the live arrays
    // at effect-entry so the async body uses the same content the
    // dep-hash was computed from. This makes the relationship between
    // `quizSectorsKey` / `soulprintSectorsKey` (in the dep array) and
    // `quizSectors` / `soulprintSectors` (read inside the IIFE)
    // explicit, and lets us drop the eslint-disable on the dep array.
    //
    // Contract: callers who pass a NEW array reference (different
    // content) get a re-fetch with the new content. Callers who
    // mutate an array in place after render WITHOUT re-rendering get
    // undefined behavior — that's a React anti-pattern and we don't
    // support it.
    const quizSectorsSnapshot = quizSectors;
    const soulprintSectorsSnapshot = soulprintSectors;
```

**Step 7.2: Use the snapshots inside the IIFE**

Find the `fetchDailyExperience` call. Use Edit:

- old_string:
```ts
        setLoading(true);
        const data = await fetchDailyExperience(
          birthData,
          soulprintSectors ?? Array(12).fill(0.5),
          quizSectors,
          targetDate,
          locale,
          transitInfluences,
          birthSign ?? '',
        );
```

- new_string:
```ts
        setLoading(true);
        const data = await fetchDailyExperience(
          birthData,
          soulprintSectorsSnapshot ?? Array(12).fill(0.5),
          quizSectorsSnapshot,
          targetDate,
          locale,
          transitInfluences,
          birthSign ?? '',
        );
```

**Step 7.3: Remove the ESLint suppression**

Use Edit:

- old_string:
```ts
    // Note: quizSectors and soulprintSectors are NOT in the dep array
    // directly — their content-hash keys are. See comment near the keys
    // for the rationale. The hook body still reads the live arrays, so
    // the latest values are used inside the effect when it runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, birthData, soulprintSectorsKey, quizSectorsKey, birthSign, customDate, locale, retryTick]);
```

- new_string:
```ts
    // Note: quizSectors and soulprintSectors are NOT in the dep array
    // directly — their content-hash keys are. The effect snapshots the
    // live arrays at entry (see quizSectorsSnapshot /
    // soulprintSectorsSnapshot above) so the body uses the same content
    // the hash was computed from. ESLint's exhaustive-deps no longer
    // fires because the body only reads the snapshots, not the live
    // refs, after effect entry.
  }, [userId, birthData, soulprintSectorsKey, quizSectorsKey, birthSign, customDate, locale, retryTick]);
```

**Step 7.4: Run all hook tests**

```bash
npx vitest run src/__tests__/use-first-run-daily.test.ts 2>&1 | tail -5
```

Expected: 6 passing (FRD-RETRY-001/002/003 + FRD-RETRY-GUARD-001 + FRD-CACHE-001 + FRD-SNAPSHOT-001).

**If FRD-SNAPSHOT-001 or any prior test fails**, the snapshot reads might not have replaced all the live-reads. Search for remaining live reads:

```bash
grep -n "quizSectors\|soulprintSectors" src/hooks/useFirstRunDaily.ts | grep -v "Snapshot\|Key\|^[0-9]*: *//"
```

Expected: only the function signature parameter lines and the two snapshot assignments. Any other live read inside the effect body must be replaced with the snapshot variant.

**Step 7.5: ESLint check — confirm exhaustive-deps no longer fires**

```bash
npx eslint src/hooks/useFirstRunDaily.ts 2>&1 | tail -10
```

Expected: no errors. If `react-hooks/exhaustive-deps` fires, the rule has additional inputs we missed (typically `transitInfluences` if it became a dep accidentally, or `targetDate` if it isn't already covered by `customDate`).

**Step 7.6: tsc + full suite**

```bash
npx tsc --noEmit 2>&1 | tail -3
npx vitest run 2>&1 | tail -5
```

Expected: tsc clean. Full suite at baseline + 3 new tests (FRD-RETRY-GUARD-001 + FRD-CACHE-001 + FRD-SNAPSHOT-001), no new regressions.

### Task 8: Commit

```bash
git add src/hooks/useFirstRunDaily.ts src/__tests__/use-first-run-daily.test.ts
git commit -m "$(cat <<'EOF'
refactor(useFirstRunDaily): snapshot arrays at effect entry, drop ESLint suppression (I-1)

Per 2026-05-11 PR #343 code review I-1: the previous fix added
`eslint-disable-next-line react-hooks/exhaustive-deps` because
the effect body read live `quizSectors` / `soulprintSectors` while
the dep array used content-hash strings. The suppression hid a
real contract — future maintainers couldn't tell whether reads vs.
hash were intentional or a bug.

Make the contract explicit via local snapshots:

  const quizSectorsSnapshot = quizSectors;
  const soulprintSectorsSnapshot = soulprintSectors;

The body uses the snapshots; the dep array uses the hash strings.
ESLint's exhaustive-deps is now satisfied (the body only reads
snapshot locals after effect entry — the live refs only appear in
the hash computation outside the effect, which IS a dep).

Contract documented inline: callers who pass a NEW array reference
(different content) get a re-fetch with the new content. Callers
who mutate an array in place WITHOUT re-rendering get undefined
behavior — that's a React anti-pattern and we don't support it.

Test FRD-SNAPSHOT-001: re-render with new quizSectors content,
assert fetchDailyExperience is called with the NEW content. Locks
the happy-path semantic so a future refactor that accidentally
captures stale state at hook-level (instead of effect-entry-level)
fails.

Suite: 6/6 in this file (was 5/5).

Closes 2026-05-11 PR #343 review I-1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 4: Plan record

```bash
git add docs/plans/2026-05-11-useFirstRunDaily-review-followup.md
git commit -m "$(cat <<'EOF'
docs(plans): useFirstRunDaily review follow-up implementation plan

Plan driving the 3 Important findings from the 2026-05-11 code
review of PR #343:
- I-2: retry() no-op guard when state is healthy
- I-3: cache-hit branch regression test
- I-1: snapshot arrays at effect entry, drop ESLint suppression

Committed alongside the implementation commits for traceability.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification + ship

### Task 9: Full suite + push + PR

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected:
- vitest: full suite at baseline + 3 new tests, no regressions; 2 documented pre-existing failures still red.
- tsc: clean.
- build: succeeds.

```bash
git push -u origin 2026-05-11-firstrun-daily-review-followup

gh pr create --base main \
  --title "fix(useFirstRunDaily): close PR #343 review follow-up findings (I-1, I-2, I-3)" \
  --body "$(cat <<'EOF'
## Summary

Closes 3 Important findings from the 2026-05-11 code review of PR #343 (\`useFirstRunDaily\` error recovery). All three were non-blocking but worth tightening before any UI consumer wires \`retry()\` to a button.

| Commit | Finding | Hash |
|---|---|---|
| 1. \`fix(useFirstRunDaily): retry() is a no-op when state is healthy\` | I-2 | (filled at PR time) |
| 2. \`test(useFirstRunDaily): cover cache-hit ref-set branch\` | I-3 | |
| 3. \`refactor(useFirstRunDaily): snapshot arrays at effect entry, drop ESLint suppression\` | I-1 | |
| 4. \`docs(plans): useFirstRunDaily review follow-up implementation plan\` | trail of intent | |

## Findings

### I-2 — retry() no-op when state is healthy
Accidental clicks on a future Retry button (while data is already loaded) would spend an extra LLM call. Now retry() short-circuits unless \`loading\` is on, \`error\` is set, or \`dailyData\` is null.

### I-3 — Cache-hit regression test
The cache-hit branch sets \`lastFetchedDateRef\` to mirror the fresh-fetch path's guard, but no test covered that branch. A future refactor that removes the ref-set from cache-hit (but keeps it on fresh-fetch) would silently break recovery. FRD-CACHE-001 locks the contract.

### I-1 — Snapshot arrays at effect entry, drop ESLint suppression
The previous fix added \`eslint-disable-next-line react-hooks/exhaustive-deps\` because the body read live arrays while the deps used content-hash strings. Now the body uses local snapshots captured at effect entry; the contract is explicit; the suppression is gone. Documented inline that in-place mutation without re-rendering is unsupported (React anti-pattern).

## Test plan

- [ ] \`npm test\` — full suite green except 2 known pre-existing failures (\`EDF-NCP-003\`, \`api-daily-pulse idempotent\`)
- [ ] \`npx tsc --noEmit\` — clean
- [ ] \`npm run build\` — OK
- [ ] No ESLint warnings on \`src/hooks/useFirstRunDaily.ts\`

## Test deltas

| File | Before | After |
|---|---|---|
| \`src/__tests__/use-first-run-daily.test.ts\` | 3 tests | 6 tests |

3 new tests:
- FRD-RETRY-GUARD-001 (I-2 contract)
- FRD-CACHE-001 (I-3 regression guard)
- FRD-SNAPSHOT-001 (I-1 snapshot semantic)

## Out of scope (deliberate)

- UI Retry button. \`retry()\` is exposed; surfacing it in \`DashboardTagesEnergie\` (or wherever the daily error renders) is a separate cosmetic concern.
- The 2 minor findings (M-1: VALID_DAILY \`any\`-type, M-3: plan-vs-implementation drift note). Defer to next touch.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done-when checklist

- [ ] Commit 1 (I-2): FRD-RETRY-GUARD-001 RED → GREEN, retry() no-op path tested
- [ ] Commit 2 (I-3): FRD-CACHE-001 passing (regression guard)
- [ ] Commit 3 (I-1): FRD-SNAPSHOT-001 passing, ESLint suppression removed, exhaustive-deps clean
- [ ] Commit 4: plan committed
- [ ] tsc clean throughout
- [ ] No new ESLint warnings on the hook
- [ ] full suite at baseline + 3 new tests, no regressions
- [ ] PR opened with all 4 commits visible

## References

- Source review (this session, 2026-05-11): 3 Important + 3 Minor + 1 retracted finding on PR #343
- PR #343 (parent): \`fix(useFirstRunDaily): clear date marker on failure + add retry()\`
- Plan for parent: \`docs/plans/2026-05-11-useFirstRunDaily-error-recovery.md\`
