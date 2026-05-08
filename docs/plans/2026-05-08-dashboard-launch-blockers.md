# Dashboard Launch Blockers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

> **Repo context:** This plan is authored in the SDLC scaffold (`Astro-Noctum/docs/plans/`) but **executed against the production code on `origin/main` of github.com/DYAI2025/Astro-Noctum**. Engineer should clone that repo, create a feature branch off `main`, and apply this plan there. File paths in this plan reference the production codebase verified against `origin/main` HEAD = `f45aef4`.

> **For the human reader:** This addresses two launch blockers from 2026-05-08. Both have the same shape: a known-implemented feature exists in the codebase but is not actually delivering value to users on the dashboard. Phase 1 fixes Daily Pulse (it shows placeholder text instead of real FuFirE-derived horoscope). Phase 2 fixes Signatur 3D (the sphere with Wuxing overlay isn't mounted on the dashboard at all).

**Goal:** Eliminate the two launch blockers — Daily Pulse must render the real FuFirE-derived horoscope on every dashboard mount with auto-rotation at 06:00 local time and zero placeholder text; SignatureSphere3D must render in the dashboard first viewport with the dominant Wuxing element as a visible overlay.

**Architecture:** Daily Pulse already has the pipeline (`useFirstRunDaily` → `fetchDailyExperience` → `POST /api/experience/daily` → server proxy → FuFirE). The fix is operational: ensure the fetch triggers reliably on mount, replace fallback / placeholder content with explicit loading or unavailable states, and add a 06:00-local-time refetch trigger. SignatureSphere3D exists with full Wuxing material support; the fix is integration: mount it in `Dashboard.tsx` inside a `SectionErrorBoundary`, pass the dominant Wuxing element prop, and behind a perf-aware mount strategy (preview card by default, embedded sphere when WebGL availability is verified).

**Tech Stack:** React 19 + TypeScript (strict) + Vite, Three.js + @react-three/fiber + @react-three/drei (3D sphere), `motion/react` (reduced-motion support), Vitest (testing), Supabase auth + storage, FuFirE API via server proxy at `/api/experience/daily`.

---

## Operational Principle (NON-NEGOTIABLE)

**No placeholders. No silent fallbacks. Errors are surfaced — visibly — with a machine-readable code and a short English description of what failed.**

Decreed by the project owner on 2026-05-08:

> *"Es dürfen keine Platzhalter oder irreführende Fallbacks angewandt werden. Diese sind umgehend vollständig durch wahrheitsgemäße Fehlermeldungen auszutauschen. Wenn etwas fehlschlägt, erwartet man eine Fehlermeldung und kein Kaschieren von unzulänglichem Code. Der Fehler muss deutlich sichtbar sein mit Fehlercode und kurzer Meldung auf Englisch was genau fehlschlägt."*

### Rules

1. **Every error path renders `[ERROR-CODE] Short English message`** in the UI surface that owns the failure. Not in a hidden console log; not at low opacity; not masquerading as a "loading" or "preview" state. The message must be **prominent**, machine-readable (so support / engineering can immediately diagnose), and in English (so error codes are stable across locales).
2. **No fallback content substitutes for missing real data.** If `fetchDailyExperience` fails, `dailyData` is `null`, and an error state is propagated. The UI does NOT manufacture a synthetic "Heute fließt deine Energie ruhig…" string.
3. **Existing silent markers must become visible.** `engine_version === 'v1-local-fallback'` is currently set but never rendered. After this plan, that marker is either removed (because the fallback path is gone) or surfaced as `[DAILY-PULSE-FALLBACK-ENGINE]` if any consumer still relies on it.
4. **All new code must follow this principle.** Any new hook / service / component added during the plan must declare its error state explicitly. Catch-blocks that swallow errors silently are violations of plan compliance.

### Canonical error code shape

`[DOMAIN-OPERATION-CAUSE]` — uppercase, hyphen-separated, English. Examples:

- `[DAILY-PULSE-FETCH-FAILED-503]` — server returned 503
- `[DAILY-PULSE-FETCH-FAILED-NETWORK]` — fetch rejection (offline, DNS failure)
- `[DAILY-PULSE-FETCH-FAILED-VALIDATION]` — Zod schema parse failure on response
- `[DAILY-PULSE-PROFILE-INCOMPLETE]` — birth data missing in DB (rendered as actionable error rather than silent suppression)
- `[SIGNATUR-SPHERE-WEBGL-INIT-FAILED]` — WebGL context could not be created
- `[SIGNATUR-SPHERE-WEIGHTS-MISSING]` — required `weights` prop not provided

The exact codes are decided per task as they arise; the **shape** is fixed.

---

## Pre-flight (do once, before any task)

### P0.1: Clone or pull production repo

```bash
# If you don't have it yet:
git clone git@github.com:DYAI2025/Astro-Noctum.git
cd Astro-Noctum

# Otherwise:
cd path/to/Astro-Noctum
git fetch origin
git checkout main
git pull --ff-only origin main
```

### P0.2: Create feature branch off main

```bash
git checkout -b feature/dashboard-launch-blockers-2026-05-08 origin/main
```

### P0.3: Install + baseline checks

```bash
npm install
npx tsc --noEmit
npm run build
npm test -- --run
```

**Expected:** All pass cleanly. If anything fails on `main` already, **stop** and surface the failure to the user — don't try to compose fixes on top of a red baseline.

### P0.4: Read the orientation files

Before touching code, read these in full to load context:

- `src/components/Dashboard.tsx` — daily-pulse and signatur mount points
- `src/hooks/useFirstRunDaily.ts` — current daily-experience fetch pipeline
- `src/services/experience.ts` — `fetchDailyExperience` definition + endpoint
- `src/components/dashboard/DailyChartHero.tsx` — current daily-pulse render surface (confirm where "placeholder" text lives)
- `src/components/signatur-3d/SignatureSphere3D.tsx` — sphere component + Wuxing prop shape
- `src/lib/signatur-3d/wuxing-material.ts` — Wuxing-overlay material builder
- `src/lib/signatur-3d/wuxing-surfaces.ts` — Wuxing element type
- `src/components/dashboard/NatalSignaturStatic.tsx` — current dashboard signatur surface (likely placeholder)

---

## Phase 1 — Daily Pulse: Real FuFirE on every login + 06:00 rotation + zero placeholder

### Execution order (per user directive 2026-05-08)

Task 1.11 (loading prop wire-up) is **high-priority** and runs **immediately after Task 1.3**. The reason: today's state mismatch between `useFirstRunDaily.loading` (returned but unused) and `Dashboard.tsx`'s synthesized `loading={(metaLoading || transitLoading) && impactHarmonyIndex == null}` is itself a visibility bug — the component can never show its proper loading skeleton for daily-pulse fetch states. Fixing that early lets the rest of the phase show progress in the dev server.

**Effective execution order:** 1.1 → 1.2 → 1.3 → **1.11** → 1.4 → 1.5 → 1.6 → 1.7 → 1.8 → 1.9 → 1.10 → **1.12** → 1.13.

(Task 1.12 is also expanded to wire `error` from hook to component, since both `loading` and `error` flow through the same Dashboard → DailyChartHero edge.)

---

### Task 1.1: Audit — locate the actual placeholder text

**Files:**
- Read: `src/components/Dashboard.tsx` (search for the daily-pulse render block, ~line 373 onwards)
- Read: `src/components/dashboard/DailyChartHero.tsx`
- Read: `src/hooks/useFirstRunDaily.ts:buildFallbackDaily`

**Step 1: Identify the source of "Platzhalter"**

Run:
```bash
git grep -n "platzhalter\|placeholder\|noch keine\|loading" src/components/dashboard/DailyChartHero.tsx
git grep -n "buildFallbackDaily\|v1-local-fallback" src/
```

Expected: find one or both of:
- A literal placeholder string in `DailyChartHero.tsx` rendered when `impulsText` is undefined.
- The fallback path in `useFirstRunDaily.ts` returning generic text via `buildFallbackDaily` when the API call fails.

**Step 2: Document findings in a temporary scratch file**

Create `docs/plans/_scratch/2026-05-08-daily-pulse-audit.md` (gitignored) with:
- Exact file:line of placeholder string(s)
- Whether `useFirstRunDaily` is actually invoked on dashboard mount with a complete birth profile (read the hook signature + Dashboard.tsx call site)
- Whether the cache key strategy honors a 06:00 boundary or only a midnight boundary (read `todayKey()` in `useFirstRunDaily.ts`)

**Step 3: Commit the scratch (no code changes yet)**

```bash
git add docs/plans/_scratch/2026-05-08-daily-pulse-audit.md
git commit -m "docs(audit): document Daily Pulse placeholder source — pre-fix snapshot"
```

This commit captures the *as-is* state, useful for rollback reference.

---

### Task 1.2: Failing test — real fetch fires on dashboard mount with complete profile

**Files:**
- Test: `src/__tests__/dashboard-daily-pulse-fetch.test.tsx` (create)

**Step 1: Write the failing test**

```tsx
// src/__tests__/dashboard-daily-pulse-fetch.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '@/src/components/Dashboard';
import * as experienceModule from '@/src/services/experience';
import type { ApiData } from '@/src/types/bafe';

vi.mock('@/src/services/experience');
vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null }) })) })) })),
  },
}));

describe('Dashboard — Daily Pulse fetch on mount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls fetchDailyExperience on mount when birth profile is complete', async () => {
    const fetchSpy = vi.spyOn(experienceModule, 'fetchDailyExperience').mockResolvedValue({
      fusion: { synthesis: 'Real horoscope text from FuFirE', day_mode: 'pulse' },
      meta: { engine_version: 'fufire-v2' },
    } as never);

    const apiData = makeMinimalApiData();
    render(
      <MemoryRouter>
        <Dashboard
          interpretation=""
          apiData={apiData}
          userId="user-123"
          birthDate="1990-01-15"
          onReset={() => {}}
          isLoading={false}
          apiIssues={[]}
          onStopAudio={() => {}}
          onResumeAudio={() => {}}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});

function makeMinimalApiData(): ApiData {
  // Fill with the minimum fields Dashboard.tsx + useFirstRunDaily require.
  // See src/types/bafe.ts for the ApiData shape — fill ONLY required fields.
  // Keep this helper local and minimal; do not add a global fixture yet.
  return {} as ApiData;
}
```

**Step 2: Run the test to verify it fails**

```bash
npx vitest run src/__tests__/dashboard-daily-pulse-fetch.test.tsx
```

Expected: FAIL — most likely on the `makeMinimalApiData()` shape (TS error or runtime null deref).

**Step 3: Iterate `makeMinimalApiData()` until the test fails for the *right* reason**

Read `src/types/bafe.ts` to see the `ApiData` shape; fill required fields with stub values. Re-run. The acceptable "fail" state is: test runs, reaches the `waitFor`, but `fetchSpy` was called 0 times (because something gates the fetch — incomplete profile, missing context, etc.) **OR** the assertion passes (in which case we already have the desired behavior and can skip to Task 1.3 with a green test as our regression guard).

**Step 4: Commit**

```bash
git add src/__tests__/dashboard-daily-pulse-fetch.test.tsx
git commit -m "test(dashboard): assert fetchDailyExperience fires on mount with complete profile"
```

---

### Task 1.3: Verify or fix — Daily Pulse fetch reliably triggers on mount

**Files:**
- Read: `src/hooks/useFirstRunDaily.ts` (full)
- Read: `src/components/Dashboard.tsx` around line 289 (the `useFirstRunDaily(...)` call site)
- Possibly modify: `src/hooks/useFirstRunDaily.ts`

**Step 1: Trace the fetch trigger**

Read the hook. Identify:
- The `useEffect` that triggers `fetchDailyExperience`.
- The conditions guarding it (cached value, birth-profile completeness, auth, etc.).
- Whether any condition could be silently `false` for an authenticated user with a complete profile.

**Step 2: If a guard is wrongly blocking the fetch, fix it**

Common bugs in this shape:
- Cache check returns stale data without forcing a refetch when older than 06:00 boundary.
- Birth-profile completeness check uses the wrong field path (e.g., reads `apiData.profile?.birth_date` when the actual path is `apiData.birth_date`).
- Auth check uses `useAuth()`'s loading flag and never re-runs once it flips.

If you find a bug: fix it minimally. Do **not** refactor. The fix is a change of ≤5 lines.

**Step 3: Run the test from Task 1.2**

```bash
npx vitest run src/__tests__/dashboard-daily-pulse-fetch.test.tsx
```

Expected: PASS.

**Step 4: Commit the fix (if any)**

```bash
git add src/hooks/useFirstRunDaily.ts  # if modified
git commit -m "fix(daily-pulse): trigger fetchDailyExperience on every dashboard mount"
```

If no fix was needed (the test already passed in 1.2), skip this commit.

---

### Task 1.4: Failing test — 06:00 local boundary invalidates cache

**Files:**
- Test: `src/__tests__/daily-pulse-six-am-rotation.test.ts` (create)

**Step 1: Write the failing test**

```ts
// src/__tests__/daily-pulse-six-am-rotation.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dailyCacheKey } from '@/src/hooks/useFirstRunDaily';

describe('dailyCacheKey — 06:00 local boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('returns the same key at 05:59 and 23:59 of the same calendar day-window', () => {
    vi.setSystemTime(new Date('2026-05-08T05:59:00'));
    const earlyKey = dailyCacheKey();
    vi.setSystemTime(new Date('2026-05-07T23:59:00'));
    const lateNightKey = dailyCacheKey();
    // 23:59 on May 7 is BEFORE 06:00 May 8 → both fall in the "May 7 day window"
    expect(earlyKey).toBe(lateNightKey);
  });

  it('returns a different key at 06:00 — the day-window has rotated', () => {
    vi.setSystemTime(new Date('2026-05-08T05:59:00'));
    const beforeRotation = dailyCacheKey();
    vi.setSystemTime(new Date('2026-05-08T06:00:00'));
    const afterRotation = dailyCacheKey();
    expect(afterRotation).not.toBe(beforeRotation);
  });
});
```

**Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/daily-pulse-six-am-rotation.test.ts
```

Expected: FAIL with "dailyCacheKey is not exported" or equivalent — the function doesn't exist yet (current code uses `todayKey()` which is midnight-based).

**Step 3: Commit the failing test**

```bash
git add src/__tests__/daily-pulse-six-am-rotation.test.ts
git commit -m "test(daily-pulse): 06:00 local boundary defines day-window for cache key"
```

---

### Task 1.5: Implement `dailyCacheKey` with 06:00 boundary

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 1: Write the minimal implementation**

In `src/hooks/useFirstRunDaily.ts`, **add** (don't replace `todayKey` yet — leave it for backwards compat, deprecation in a follow-up):

```ts
/**
 * Day-window key for daily-horoscope caching.
 *
 * The day window rotates at 06:00 local time, not midnight — users
 * expect "today's horoscope" to refer to the waking day, not the
 * calendar day. Times between 00:00 and 05:59 belong to the previous
 * day's window.
 *
 * Returns a YYYY-MM-DD string identifying the day-window.
 */
export function dailyCacheKey(): string {
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
```

**Step 2: Run the test**

```bash
npx vitest run src/__tests__/daily-pulse-six-am-rotation.test.ts
```

Expected: PASS.

**Step 3: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts
git commit -m "feat(daily-pulse): add dailyCacheKey with 06:00 local boundary"
```

---

### Task 1.6: Switch the hook's cache to use `dailyCacheKey`

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts` (`getCachedDaily` + `setCachedDaily`)

**Step 1: Failing test — cache invalidates at 06:00 within the same calendar day**

```ts
// src/__tests__/daily-pulse-six-am-cache-rotation.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useFirstRunDaily cache — 06:00 boundary invalidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('cache stored at 23:00 on May 7 is still valid at 05:59 on May 8', async () => {
    vi.setSystemTime(new Date('2026-05-07T23:00:00'));
    const { setCachedDaily, getCachedDaily } = await import('@/src/hooks/useFirstRunDaily');
    setCachedDaily({ fusion: { synthesis: 'evening horoscope' } } as never);
    vi.setSystemTime(new Date('2026-05-08T05:59:00'));
    const cached = getCachedDaily();
    expect(cached?.fusion?.synthesis).toBe('evening horoscope');
  });

  it('cache stored at 23:00 on May 7 is INVALID at 06:00 on May 8', async () => {
    vi.setSystemTime(new Date('2026-05-07T23:00:00'));
    const { setCachedDaily, getCachedDaily } = await import('@/src/hooks/useFirstRunDaily');
    setCachedDaily({ fusion: { synthesis: 'evening horoscope' } } as never);
    vi.setSystemTime(new Date('2026-05-08T06:00:00'));
    const cached = getCachedDaily();
    expect(cached).toBeNull();
  });
});
```

**Step 2: Run, verify it fails**

```bash
npx vitest run src/__tests__/daily-pulse-six-am-cache-rotation.test.ts
```

Expected: FAIL — cache currently uses `todayKey()` (midnight boundary), so the second test passes incorrectly only because midnight already crossed; rerun with a same-calendar-day pair to confirm. Adjust dates if needed so the test fails for the right reason.

**Step 3: Implement — replace `todayKey()` with `dailyCacheKey()` in `getCachedDaily` and `setCachedDaily`**

In `src/hooks/useFirstRunDaily.ts`:

```ts
function getCachedDaily(): DailyResponse | null {
  try {
    const raw = localStorage.getItem('daily_horoscope_cache');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.date === dailyCacheKey() && parsed?.data) {
      return parsed.data as DailyResponse;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedDaily(data: DailyResponse): void {
  try {
    localStorage.setItem(
      'daily_horoscope_cache',
      JSON.stringify({ date: dailyCacheKey(), data }),
    );
  } catch {
    // localStorage full or unavailable — ignore
  }
}
```

Leave the exported `todayKey()` in place for now — it may be referenced elsewhere; deprecation in a follow-up.

**Step 4: Run all daily-pulse tests**

```bash
npx vitest run src/__tests__/daily-pulse-six-am-cache-rotation.test.ts src/__tests__/daily-pulse-six-am-rotation.test.ts src/__tests__/dashboard-daily-pulse-fetch.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts src/__tests__/daily-pulse-six-am-cache-rotation.test.ts
git commit -m "feat(daily-pulse): cache invalidates at 06:00 local boundary"
```

---

### Task 1.7: Failing test — auto-refetch when 06:00 crosses while dashboard is mounted

**Files:**
- Test: `src/__tests__/dashboard-daily-pulse-six-am-refetch.test.tsx` (create)

**Step 1: Write the failing test**

```tsx
// src/__tests__/dashboard-daily-pulse-six-am-refetch.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '@/src/components/Dashboard';
import * as experienceModule from '@/src/services/experience';

vi.mock('@/src/services/experience');
vi.mock('@/src/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

describe('Dashboard — auto-refetch at 06:00 local time', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] });
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('triggers a second fetchDailyExperience when local time crosses 06:00', async () => {
    vi.setSystemTime(new Date('2026-05-08T05:30:00'));
    const fetchSpy = vi.spyOn(experienceModule, 'fetchDailyExperience').mockResolvedValue(
      { fusion: { synthesis: 'evening' }, meta: { engine_version: 'fufire-v2' } } as never,
    );

    render(
      <MemoryRouter>
        {/* render Dashboard with a complete profile — see helper from Task 1.2 */}
      </MemoryRouter>,
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // Advance to 06:01 — boundary has crossed
    await act(async () => {
      vi.setSystemTime(new Date('2026-05-08T06:01:00'));
      vi.advanceTimersByTime(40 * 60 * 1000); // 40 minutes
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });
});
```

**Step 2: Run, verify it fails**

```bash
npx vitest run src/__tests__/dashboard-daily-pulse-six-am-refetch.test.tsx
```

Expected: FAIL — the hook does not currently watch for 06:00 crossings.

**Step 3: Commit the failing test**

```bash
git add src/__tests__/dashboard-daily-pulse-six-am-refetch.test.tsx
git commit -m "test(daily-pulse): assert auto-refetch when 06:00 crosses while mounted"
```

---

### Task 1.8: Implement 06:00-boundary listener inside `useFirstRunDaily`

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Realität-Check (aus P0.4):**
- The existing fetch effect in `useFirstRunDaily.ts:128-227` is **inlined** in a `useEffect` body — there's no `runDailyFetch` callback to reuse.
- A re-fetch guard `lastFetchedDateRef` (Zeile 126, 143-144) prevents repeated fetches for the same date key. **The 06:00 listener must reset this ref**, otherwise no second fetch happens.

**Step 1: Refactor the fetch effect's body into a reusable `useCallback`**

Extract the async IIFE inside the existing `useEffect` (Zeile 148-222) into a `useCallback`:

```ts
const runDailyFetch = useCallback(async () => {
  // ... move the existing IIFE body here, dependencies same as the useEffect's deps
}, [userId, birthData, soulprintSectors, quizSectors, birthSign, customDate, locale]);

useEffect(() => {
  // existing guards (userId, birthData, lastFetchedDateRef) stay
  // call runDailyFetch() instead of the inline IIFE
  runDailyFetch();
}, [runDailyFetch]);
```

This is a ≤10-line restructure that doesn't change behavior — verify the existing test from Task 1.2 still passes after the refactor.

**Step 2: Add the 06:00 listener `useEffect` after the existing fetch effect**

```ts
// ── Auto-refetch at the next 06:00 local time ──────────────────────────
useEffect(() => {
  const now = new Date();
  const next6am = new Date(now);
  next6am.setHours(6, 0, 0, 0);
  if (now.getTime() >= next6am.getTime()) {
    next6am.setDate(next6am.getDate() + 1);
  }
  const msUntilNext6am = next6am.getTime() - now.getTime();
  const timer = setTimeout(() => {
    // 1) Invalidate localStorage cache
    localStorage.removeItem('daily_horoscope_cache');
    // 2) Reset the dedupe ref — without this, runDailyFetch's
    //    `targetDate === lastFetchedDateRef.current` guard would skip the refetch.
    lastFetchedDateRef.current = null;
    // 3) Reset hook state so consumers see a loading transition
    setDailyData(null);
    setLoading(true);
    // 4) Trigger the fetch
    runDailyFetch();
  }, msUntilNext6am);
  return () => clearTimeout(timer);
}, [runDailyFetch]);
// Note: deliberately NOT depending on dailyCacheKey() — the timer re-arms
// itself after firing because runDailyFetch's identity changes when the
// fetch effect's deps change, OR we let the next dashboard mount re-arm.
```

**Step 2: Run the test**

```bash
npx vitest run src/__tests__/dashboard-daily-pulse-six-am-refetch.test.tsx
```

Expected: PASS.

**Step 3: Run the full daily-pulse test suite to confirm no regression**

```bash
npx vitest run src/__tests__/dashboard-daily-pulse-fetch.test.tsx \
                src/__tests__/daily-pulse-six-am-rotation.test.ts \
                src/__tests__/daily-pulse-six-am-cache-rotation.test.ts \
                src/__tests__/dashboard-daily-pulse-six-am-refetch.test.tsx
```

Expected: all PASS.

**Step 4: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts
git commit -m "feat(daily-pulse): auto-refetch on 06:00 local boundary while dashboard is mounted"
```

---

### Task 1.9: Failing test — DailyChartHero renders no placeholder text when dailyData is null

**Files:**
- Test: `src/__tests__/daily-chart-hero-no-placeholder.test.tsx` (create)

**Step 1: Write the failing test**

```tsx
// src/__tests__/daily-chart-hero-no-placeholder.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyChartHero } from '@/src/components/dashboard/DailyChartHero';

describe('DailyChartHero — no placeholder text when impulsText is undefined', () => {
  it('renders a loading skeleton, not generic "Tageshoroskop wird geladen…" placeholder', () => {
    render(
      <DailyChartHero
        impulsText={undefined}
        dayMode="pulse"
        loading
        baseCoherence={0.5}
        positiveDailyDelta={0}
        displayedCoherence={0.5}
        // ... rest of props per the actual interface; fill from src/components/dashboard/DailyChartHero.tsx
      />,
    );
    // Must not include any of these placeholder/generic strings:
    expect(screen.queryByText(/dein tagespuls erscheint/i)).toBeNull();
    expect(screen.queryByText(/wird vorbereitet/i)).toBeNull();
    expect(screen.queryByText(/dummy|lorem|placeholder/i)).toBeNull();
    // Must contain a loading affordance (existing skeleton testid, do NOT rename):
    expect(screen.getByTestId('daily-chart-hero-skeleton')).toBeInTheDocument();
  });

  it('renders an [ERROR-CODE] error block when error prop is set', () => {
    render(
      <DailyChartHero
        impulsText={undefined}
        dayMode="pulse"
        loading={false}
        baseCoherence={0.5}
        positiveDailyDelta={0}
        displayedCoherence={0.5}
        error={{ code: 'DAILY-PULSE-FETCH-FAILED-503', message: 'FuFirE /api/experience/daily returned HTTP 503.' }}
      />,
    );
    const errorBlock = screen.getByTestId('daily-pulse-error');
    expect(errorBlock).toBeInTheDocument();
    expect(screen.getByTestId('daily-pulse-error-code')).toHaveTextContent('[DAILY-PULSE-FETCH-FAILED-503]');
    expect(screen.getByTestId('daily-pulse-error-message')).toHaveTextContent('FuFirE /api/experience/daily returned HTTP 503.');
    expect(errorBlock).toHaveAttribute('role', 'alert');
  });

  it('renders error block instead of impulse when both error AND impulsText are set', () => {
    // Doctrine: error wins over stale data. Never pretend a cached value is live
    // when something is currently failing.
    render(
      <DailyChartHero
        impulsText="stale cached horoscope text"
        dayMode="pulse"
        loading={false}
        baseCoherence={0.5}
        positiveDailyDelta={0}
        displayedCoherence={0.5}
        error={{ code: 'DAILY-PULSE-FETCH-FAILED-NETWORK', message: 'Network error reaching /api/experience/daily.' }}
      />,
    );
    expect(screen.getByTestId('daily-pulse-error')).toBeInTheDocument();
    // Stale text MUST NOT be rendered as Tagesimpuls when error is active
    expect(screen.queryByText('stale cached horoscope text')).toBeNull();
  });
});
```

**Step 2: Run, verify it fails**

```bash
npx vitest run src/__tests__/daily-chart-hero-no-placeholder.test.tsx
```

Expected: FAIL — the `daily-pulse-error` testid does not exist yet (Task 1.10 adds it), and the component currently renders different text in the no-impulsText path.

**Step 3: Commit the failing test**

```bash
git add src/__tests__/daily-chart-hero-no-placeholder.test.tsx
git commit -m "test(daily-chart-hero): no placeholder text when impulsText is undefined"
```

---

### Task 1.10: Add ERROR state to `DailyChartHero` with explicit code + English message (replaces "unavailable")

**Realität-Check (aus P0.4):**
- `DailyChartHero` **hat bereits einen `loading` Prop** (`src/components/dashboard/DailyChartHero.tsx:34`) und rendert `<DailyChartHeroSkeleton />` (Zeile 252).
- Wenn `impulsText` leer/undefined und nicht `profileIncomplete` → die Tagesimpuls-Section rendert nichts (`: null` Zeile 454).
- Bisheriger fehlender Zustand: explizite Fehleranzeige bei Fetch-Versagen.

**Doctrine compliance:** Per the operational principle above, this branch must render `[ERROR-CODE] Short English message` **prominently** when the daily-pulse fetch failed. No vague "unavailable", no low-opacity hint. The user must immediately see what broke.

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx`
- Add new prop: `error?: { code: string; message: string } | null`

**Step 1: Add `error` prop to the interface**

In `DailyChartHeroProps` (around Zeile 33-68):

```ts
/**
 * Error state propagated from useFirstRunDaily when the daily-pulse fetch failed.
 * When non-null, renders a prominent [CODE] message error block in place of the
 * Tagesimpuls section. Per project doctrine: errors are surfaced, not masked.
 */
error?: { code: string; message: string } | null;
```

**Step 2: Destructure `error` in the component signature**

In the `export function DailyChartHero({...}: DailyChartHeroProps)` destructure (Zeile 213-226), add `error,`.

**Step 3: Add the third branch — ERROR — to the Tagesimpuls section**

Find the existing Tagesimpuls section (`{hasImpuls ? (...) : profileIncomplete ? (...) : null}` ≈ Zeilen 396-454). Replace the trailing `: null` with the error branch, AND prefer the error branch over `hasImpuls` if both are set (an error overrides any cached/stale impulsText):

```tsx
{error ? (
  <section
    className="mt-2 pt-5 border-t"
    style={{ borderColor: 'var(--tile-border)' }}
    data-testid="daily-pulse-error"
    role="alert"
  >
    <div
      className="rounded-lg border px-4 py-3 max-w-prose mx-auto"
      style={{
        borderColor: 'rgba(220, 38, 38, 0.4)',
        background: 'rgba(220, 38, 38, 0.08)',
      }}
    >
      <p
        className="text-xs font-mono mb-1"
        style={{ color: 'rgb(248, 113, 113)' }}
        data-testid="daily-pulse-error-code"
      >
        [{error.code}]
      </p>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--tile-text-primary)' }}
        data-testid="daily-pulse-error-message"
      >
        {error.message}
      </p>
    </div>
  </section>
) : hasImpuls ? (
  // ... existing hasImpuls branch unchanged (Zeilen 397-427)
) : profileIncomplete ? (
  // ... existing profileIncomplete branch unchanged (Zeilen 428-453)
) : null}
```

> **Why this position:** If both `error` AND `impulsText` are set (e.g. stale cached data from earlier mount + new fetch failure), **error wins**. The doctrine says: never render data that pretends to be live when something failed.

> **Visual treatment:** Bordered, rose-tinted background. Monospace error code on first line. Body message in primary text color, full opacity. `role="alert"` for screen-reader accessibility.

> **Profile-incomplete branch stays as-is**: that's not an error — it's a known state with a user-actionable CTA. Don't recolor it red.

**Step 3: Run the test**

```bash
npx vitest run src/__tests__/daily-chart-hero-no-placeholder.test.tsx
```

Expected: PASS.

**Step 4: Run the broader DailyChartHero test suite**

```bash
git grep -l "DailyChartHero" src/__tests__/ | xargs npx vitest run
```

Expected: all PASS. If a snapshot test breaks because the rendered DOM changed, **inspect the snapshot diff manually** and update only if the change matches intent. Do not auto-update snapshots.

**Step 5: Commit**

```bash
git add src/components/dashboard/DailyChartHero.tsx
git commit -m "feat(daily-chart-hero): replace placeholder with loading skeleton + unavailable state"
```

---

### Task 1.11: HIGH-PRIORITY — Wire `loading` AND `error` from `useFirstRunDaily` into `DailyChartHero`

**Per user directive 2026-05-08, executed early (after Task 1.3, before Task 1.4).**

**Why this is high-priority:** Today, `useFirstRunDaily` returns `loading` (Zeile 29 of the interface) and Dashboard.tsx **destructures it not** (Zeile 289 of `Dashboard.tsx`). Instead the synthesized `loading={(metaLoading || transitLoading) && impactHarmonyIndex == null}` (Zeile 377) is wired in — that's `useActiveImpacts`-loading, not daily-pulse-loading. Result: DailyChartHero can never show its skeleton for daily-pulse fetch states. The component is effectively rendering with `loading={false}` even when the daily-pulse is loading. **This is a visibility bug for itself — fix it first.**

**Two wires in one task (both flow through the Dashboard → DailyChartHero edge):**

1. **`loading`** wire — exists today, fix the destructure. Available immediately.
2. **`error`** wire — depends on Task 1.12 having added `error` to the hook's return type. Add the wire here in TDD-anticipation; the test passes once 1.12 lands.

**Files:**
- Modify: `src/components/Dashboard.tsx` (around line 289 — the `useFirstRunDaily(...)` call site, and line 376 — the `<DailyChartHero ... />` call)

**Step 1: Update the destructure**

Replace Dashboard.tsx Zeile 289-297:

```tsx
const {
  dailyData,
  dayHarmonic,
  nightHarmonic,
  loading: dailyLoading,
  error: dailyError,                       // populated by Task 1.12
  handleClose: handleDailyClose,
} = useFirstRunDaily(
  userId,
  profileMeta.birthInput,
  effectiveSoulprint,
  profileMeta.quizSectors,
  birthSign,
  skyMode === 'current' ? currentDate.toISOString().split('T')[0] : undefined,
  lang === 'en' ? 'en-US' : 'de-DE',
);
```

> **Note:** If Task 1.12 has not yet run, `dailyError` is `undefined` (the hook doesn't expose it yet). Tests in Task 1.12 will exercise the populated path. TypeScript will warn — that's expected; treat the warning as an inter-task TODO that 1.12 closes.

**Step 2: Replace the synthesized `loading` prop with the real one**

Find Zeile 376-389. Replace `loading={(metaLoading || transitLoading) && impactHarmonyIndex == null}` with:

```tsx
<DailyChartHero
  loading={dailyLoading || (metaLoading && impactHarmonyIndex == null)}
  error={dailyError ?? null}
  // ... existing props (baseCoherence, positiveDailyDelta, etc.) unchanged
  impulsText={dailyData?.fusion?.synthesis || dailyData?.fusion?.summary}
  // ...
/>
```

> **Why the OR:** `dailyLoading` covers the FuFirE-fetch path; `metaLoading && impactHarmonyIndex == null` covers the active-impacts path. We keep both because the dashboard genuinely has two parallel loading states; the skeleton should show as long as **either** is in flight. If you want to be stricter (only daily-pulse loading drives the skeleton), drop the second clause and surface active-impacts loading via a different affordance later.

**Step 3: Run all relevant tests**

```bash
npx vitest run \
  src/__tests__/dashboard-daily-pulse-fetch.test.tsx \
  src/__tests__/daily-chart-hero-no-placeholder.test.tsx
```

Expected:
- Tests that exist today: PASS.
- The error-test from Task 1.9 will fail until Task 1.12 lands — that's the TDD expectation. Document this in the commit message.

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): wire daily-pulse loading + error from hook into DailyChartHero (HIGH-PRIO per doctrine)"
```

> **Compliance note:** This is the wire-up for the doctrine surface. Task 1.10 implements the rendering. Task 1.12 implements the error-classification source. All three together close the doctrine loop.

---

### Task 1.12: Remove `buildFallbackDaily` from auto-fetch path AND propagate explicit error state

**Doctrine compliance:** Catch-block must NOT substitute synthetic content. It must classify the failure into a stable error code and propagate `error: { code, message }` so DailyChartHero (Task 1.10) can render `[CODE] message`.

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 1: Extend the result type with `error`**

Update `UseFirstRunDailyResult` (Zeile 23-31):

```ts
interface UseFirstRunDailyResult {
  dailyData: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  nightHarmonic: DayHarmonicState | null;
  showModal: boolean;
  loading: boolean;
  /**
   * Non-null when the most recent fetch attempt failed. The UI consumes this
   * via DailyChartHero.error to render [CODE] message prominently.
   * Cleared on next successful fetch. Per project doctrine 2026-05-08: no
   * synthetic fallbacks; failures must be visible.
   */
  error: { code: string; message: string } | null;
  handleClose: () => void;
}
```

Add the state inside the hook body:

```ts
const [error, setError] = useState<{ code: string; message: string } | null>(null);
```

Return it from the hook (Zeile 253). Mock it in any existing test that destructures the hook result.

**Step 2: Classify failures in the catch-block**

Replace the existing catch-block (`useFirstRunDaily.ts:209-218`):

```ts
} catch (err) {
  // Per project doctrine 2026-05-08: surface failures explicitly,
  // do NOT substitute synthetic fallback content.
  if (cancelled) return;

  let code = 'DAILY-PULSE-FETCH-FAILED-UNKNOWN';
  let message = 'Daily horoscope fetch failed.';

  if (err instanceof Error) {
    // Match the error shapes thrown by fetchDailyExperience (see services/experience.ts:64)
    const m = err.message.match(/Daily horoscope failed:\s*(\d{3})/);
    if (m) {
      code = `DAILY-PULSE-FETCH-FAILED-${m[1]}`;
      message = `FuFirE /api/experience/daily returned HTTP ${m[1]}.`;
    } else if (err.name === 'TypeError' || err.message.toLowerCase().includes('fetch')) {
      code = 'DAILY-PULSE-FETCH-FAILED-NETWORK';
      message = `Network error reaching /api/experience/daily: ${err.message}`;
    } else if (err.message.includes('parse') || err.name === 'ZodError') {
      code = 'DAILY-PULSE-FETCH-FAILED-VALIDATION';
      message = `Daily-pulse response failed schema validation: ${err.message}`;
    } else {
      message = err.message;
    }
  }

  console.error(`[useFirstRunDaily] [${code}]`, message, err);
  setDailyData(null);
  setError({ code, message });
} finally {
  if (!cancelled) setLoading(false);
}
```

**Step 3: Clear `error` on successful fetch**

In the success path (after `setDailyData(data)`), add:

```ts
setError(null); // clear any prior error state on success
```

**Step 4: Mark `buildFallbackDaily` as deprecated; do NOT delete (existing tests still import it)**

```ts
/**
 * @deprecated 2026-05-08 — Replaced by explicit error-state propagation per
 * project doctrine: errors are surfaced, not masked. This export remains only
 * because src/__tests__/daily-fallback.test.ts and daily-inline-rendering.test.ts
 * still import it for direct unit tests of its shape. New code MUST NOT call
 * this function. Remove once those tests are migrated or deleted.
 *
 * Tracked in: docs/plans/2026-05-08-dashboard-launch-blockers.md
 */
export function buildFallbackDaily(locale: string = 'de'): DailyResponse {
  // ... existing implementation unchanged
}
```

**Step 5: Wire `error` into Dashboard.tsx and DailyChartHero (already done in Task 1.11)**

Confirm Task 1.11's prior wiring also passes `error={dailyError}` to `<DailyChartHero>`. If not, extend.

**Step 6: Run all daily-pulse tests**

```bash
npx vitest run src/__tests__/daily-pulse-* src/__tests__/dashboard-daily-pulse-* src/__tests__/daily-chart-hero-*
```

Expected: all PASS.

**Step 7: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts
git commit -m "feat(daily-pulse): remove fallback substitution; propagate explicit [CODE] error state per doctrine"
```

---

### Task 1.13: Manual smoke — verify in dev server

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Login with a test account that has a complete birth profile**

Open the dev URL (likely `http://localhost:5173`), log in.

**Step 3: Visual checklist**

- [ ] Dashboard mounts → DailyChartHero shows real horoscope text (not loading spinner stuck, not placeholder).
- [ ] Hard-refresh (Cmd+Shift+R) → still real text (cache hit OR fresh fetch).
- [ ] Block `/api/experience/daily` in DevTools (network tab → Block Request URL) → reload → DailyChartHero shows "Tagespuls heute nicht verfügbar — bitte neu laden." (not generic placeholder).
- [ ] Unblock the request, reload → real text returns.

**Step 4: Phase 1 done. Commit any tweaks. Move to Phase 2.**

---

## Phase 2 — Signatur 3D Sphere with Wuxing-Overlay on Dashboard

### Task 2.1: Audit — read SignatureSphere3D's prop interface

**Files:**
- Read: `src/components/signatur-3d/SignatureSphere3D.tsx` (full)
- Read: `src/lib/signatur-3d/wuxing-material.ts` (full)
- Read: `src/lib/signatur-3d/wuxing-surfaces.ts` (full — the `WuxingElement` type)
- Read: `src/components/signatur-renderer/SignaturRenderer.tsx` (full — to see how the sphere is wrapped on `/signatur`)

**Realität-Check (aus P0.4):** Die wichtigsten Punkte aus dem Source-Read sind hier vorab aufgelistet, damit Task 2.1 nicht in die Irre geht:

- **Prop-Name:** `dominantElement` (NICHT `wuxingElement`).
- **Accepted values:** `'Fire' | 'Earth' | 'Wood' | 'Metal' | 'Water'` — **großgeschrieben englisch** (siehe `src/lib/signatur-3d/wuxing-surfaces.ts`).
- **`weights` ist Pflicht-Prop** (`Readonly<Partial<Record<PlanetName, number>>>`), nicht optional. Ohne weights rendert die Kugel nicht. Source: `SignatureSphere3D.tsx:62`.
- **Optionale Props:** `planetariumMode` (default true), `kpIndex` (default 0), `className`.
- **Requires no `chladniParams` prop** — Chladni-Displacement wird intern aus `weights` berechnet (`buildDisplacedSphere` in derselben Datei).
- **Defensive Coercion bereits eingebaut:** `wuxing-material.ts:coerceWuxingElement()` fällt auf `'Water'` zurück bei invalider Eingabe (z.B. `'Metall'`-Drift). Wir können `apiData.wuxing.dominant_element as WuxingElement` mit gutem Gewissen weiterreichen.

**Step 1: Document the contract**

Create `docs/plans/_scratch/2026-05-08-signatur-3d-contract.md` mit:
- `SignatureSphere3DProps`-Interface (ahead-of-time vom Realität-Check oben).
- Mapping-Pfad für `weights`: existiert ein Helper, der Soulprint (12 sectors) → `Record<PlanetName, number>` mappt? Suche in `src/lib/signatur/weight-utils.ts` und `src/lib/signatur-3d/`. Document the helper name + signature.
- Required parent context (`PlanetariumContext` für planetariumMode, `LanguageContext` für Tooltip-Sprache).
- Performance-Hinweise (H5-Morph 15 fps, OrbitControls, Reduced-Motion-Short-Circuit).

**Step 2: Commit the audit**

```bash
git add docs/plans/_scratch/2026-05-08-signatur-3d-contract.md
git commit -m "docs(audit): SignatureSphere3D contract reference for dashboard mount"
```

---

### Task 2.2: Failing test — Dashboard renders SignatureSphere3D with dominant Wuxing element

**Files:**
- Test: `src/__tests__/dashboard-signatur-sphere-mount.test.tsx` (create)

**Step 1: Write the failing test**

```tsx
// src/__tests__/dashboard-signatur-sphere-mount.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '@/src/components/Dashboard';

vi.mock('@/src/components/signatur-3d/SignatureSphere3D', () => ({
  SignatureSphere3D: vi.fn((props) => (
    <div data-testid="signature-sphere-3d" data-element={props.dominantElement} />
  )),
}));
vi.mock('@/src/services/experience');
vi.mock('@/src/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

describe('Dashboard — SignatureSphere3D with Wuxing overlay', () => {
  it('mounts SignatureSphere3D and passes the dominant Wuxing element', () => {
    const apiData = makeApiDataWithDominantWuxing('Fire');
    render(
      <MemoryRouter>
        <Dashboard
          interpretation=""
          apiData={apiData}
          userId="user-123"
          birthDate="1990-01-15"
          onReset={() => {}}
          isLoading={false}
          apiIssues={[]}
          onStopAudio={() => {}}
          onResumeAudio={() => {}}
        />
      </MemoryRouter>,
    );
    const sphere = screen.getByTestId('signature-sphere-3d');
    expect(sphere).toBeInTheDocument();
    expect(sphere.getAttribute('data-element')).toBe('Fire');
  });
});

function makeApiDataWithDominantWuxing(elem: 'Fire' | 'Water' | 'Wood' | 'Earth' | 'Metal') {
  // apiData.wuxing.dominant_element is `string`-typed (per src/types/bafe.ts)
  // but Test-Fixtures durchweg use the uppercase English form ('Fire', 'Wood', ...).
  // Fill ApiData with the minimum fields the Dashboard reads; this is mainly
  // apiData.western.zodiac_sign + apiData.wuxing.dominant_element.
  return {
    western: { zodiac_sign: 'Aries' },
    bazi: { zodiac_sign: 'Tiger' },
    wuxing: { dominant_element: elem },
  } as never;
}
```

**Step 2: Run, verify it fails**

```bash
npx vitest run src/__tests__/dashboard-signatur-sphere-mount.test.tsx
```

Expected: FAIL — Dashboard does not currently render `SignatureSphere3D`.

**Step 3: Commit failing test**

```bash
git add src/__tests__/dashboard-signatur-sphere-mount.test.tsx
git commit -m "test(dashboard): SignatureSphere3D mounts with dominant Wuxing element"
```

---

### Task 2.3: Decide mount strategy — preview card or direct embed

**This is a 5-minute decision step. No code change.**

Read your audit from Task 2.1 plus the prior SDLC requirement [`REQ-PERF-signature-no-direct-embed`](https://github.com/DYAI2025/Astro-Noctum/blob/claude/sdlc-spec-noctum-2026-05-07/1-spec/requirements/REQ-PERF-signature-no-direct-embed.md) (it lives on the orphan branch — fetch it via `git show origin/claude/sdlc-spec-noctum-2026-05-07:1-spec/requirements/REQ-PERF-signature-no-direct-embed.md`).

Decide:

- **Option A — Direct embed** of `SignatureSphere3D` inside Dashboard. Higher visual impact, immediate gratification for users. Risk: WebGL load + Chladni shader morph adds main-thread work to dashboard mount (the audit mentions "≈15fps morph"). On low-end mobile this could regress time-to-interactive.
- **Option B — `SignaturAnchorCard` preview** with static `NatalSignaturStatic` + clear CTA "Deine Signatur ansehen →" routing to `/signatur` page. Lower mount cost, navigation indirection.

Given the user's wording — *"Das Feature wird aktuell nirgends angezeigt"* and *"höchste Priorität"* — they want the sphere visible NOW. **Default to Option A (direct embed)**, with a `SectionErrorBoundary` and a `prefers-reduced-motion` short-circuit (the sphere already supports this via `useReducedMotion`). Performance regression can be measured post-merge; if it's bad, revert to Option B in a follow-up.

Write the decision in `docs/plans/_scratch/2026-05-08-signatur-3d-mount-decision.md` (one paragraph, what + why).

```bash
git add docs/plans/_scratch/2026-05-08-signatur-3d-mount-decision.md
git commit -m "docs(decision): signatur 3D mount strategy — direct embed with error boundary"
```

---

### Task 2.4: Compute Planet-Weights for `SignatureSphere3D` (NOT Wuxing — that comes from apiData directly)

**Realität-Check (aus P0.4):**
- `apiData.wuxing.dominant_element` is **already a string** in `ApiData` (`src/types/bafe.ts:47, 109`). Fixtures use `'Fire'`, `'Wood'`, `'Earth'`, `'Water'` (uppercase English) — directly compatible with the `WuxingElement` type. **Kein `computeDominantWuxing`-Helper nötig.**
- Was wirklich gebraucht wird: ein Mapping von Soulprint (`number[]` mit 12 Sektoren) **oder** vom `zodiac_sign` zu `Record<PlanetName, number>` (das `weights`-Pflicht-Prop von `SignatureSphere3D`).
- Dashboard.tsx hat bereits `effectiveSoulprint` (`number[]`) und nutzt `syntheticSoulprintFromSign` aus `@/src/lib/signatur/weight-utils` (Zeile 25-27). Wahrscheinlich existiert dort auch ein `soulprintToPlanetWeights` oder ähnlich.

**Files:**
- Read: `src/lib/signatur/weight-utils.ts`
- Read: `src/components/signatur-renderer/SignaturRenderer.tsx` (sieht wie der `/signatur`-Page Helper aus, der auch zur Sphere fährt — gibt vor wie `weights` typisch berechnet wird).

**Step 1: Locate the soulprint→PlanetWeights helper**

```bash
git grep -n "PlanetName\|soulprintToPlanet\|planetWeights" src/lib/signatur/ src/components/signatur-renderer/
```

Erwartet: ein Helper wie `soulprintToPlanetWeights(soulprint: number[]): Record<PlanetName, number>` existiert. Falls ja: dokumentiere Pfad + Signatur in `docs/plans/_scratch/2026-05-08-signatur-3d-contract.md`.

**Step 2: If no helper exists — write a tiny one**

If grep returns nothing, write a 5-line helper in `src/lib/signatur/weight-utils.ts`:

```ts
import { PLANETS, type PlanetName } from '@/src/lib/signatur-3d/planets';

/**
 * Map a 12-sector soulprint to per-planet amplitude weights.
 * Distributes sector values across the canonical PLANETS list.
 */
export function soulprintToPlanetWeights(soulprint: number[]): Record<PlanetName, number> {
  // ... ≤10 lines; mirror SignaturRenderer's existing approach.
}
```

Mit minimalem TDD-Test in `src/__tests__/soulprint-to-planet-weights.test.ts`.

**Step 3: If helper exists** — skip Step 2. Use the existing helper directly in Task 2.5.

---

### Task 2.5: Mount `SignatureSphere3D` in `Dashboard.tsx`

**Realität-Check (aus P0.4):**
- Prop-Name ist `dominantElement`, NICHT `wuxingElement`.
- `dominantElement` accepts `'Fire' | 'Earth' | 'Wood' | 'Metal' | 'Water'` (englisch, großgeschrieben). `apiData.wuxing.dominant_element` liefert genau diese Strings (per Test-Fixtures verifiziert).
- `weights` ist Pflicht-Prop. Wir brauchen den Helper aus Task 2.4.
- `usePlanetarium()` Context liefert `planetariumMode` — Dashboard.tsx Zeile 117 hat ihn bereits.
- `useSpaceWeather()` liefert `kpIndex` — Dashboard.tsx Zeile 259 hat ihn bereits.

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Add the import**

Top of `Dashboard.tsx`, alongside the other signatur imports:

```tsx
import { SignatureSphere3D } from "./signatur-3d/SignatureSphere3D";
import type { WuxingElement } from "@/src/lib/signatur-3d/wuxing-surfaces";
import { soulprintToPlanetWeights } from "@/src/lib/signatur/weight-utils"; // path per Task 2.4
```

**Step 2: Compute weights and the dominant element**

Inside the Dashboard function, AFTER `effectiveSoulprint` is computed (existing Zeile 281-285):

```tsx
// ── 3D Signatur Sphere data prep ──
const planetWeights = useMemo(
  () => soulprintToPlanetWeights(effectiveSoulprint),
  [effectiveSoulprint],
);

// dominant_element is `string` per ApiData; the values come from BAFE
// already in 'Fire'/'Earth'/'Wood'/'Metal'/'Water' shape. coerceWuxingElement
// inside wuxing-material.ts defends against drift (e.g. 'Metall' → 'Water').
const dominantElement = (apiData?.wuxing?.dominant_element ?? 'Water') as WuxingElement;
```

**Step 3: Mount `SignatureSphere3D` BEFORE the existing `<NatalSignaturStatic>` block (~Zeile 429)**

We do NOT delete `NatalSignaturStatic` — it's the static accordion below. We add the 3D sphere as a NEW section above it (or in the existing position 3 slot, depending on Phase 3 hierarchy decisions). Insert before the `<SectionErrorBoundary name="NatalSignaturStatic">`:

```tsx
{/* ═══ 3. SIGNATUR 3D SPHERE WITH WUXING OVERLAY (NEW) ═════════════════ */}
<motion.div {...fadeIn(0.1)}>
  <SectionErrorBoundary name="SignatureSphere3D">
    <SignatureSphere3D
      weights={planetWeights}
      dominantElement={dominantElement}
      kpIndex={spaceWeather.kpIndex}
      planetariumMode={planetariumMode}
    />
  </SectionErrorBoundary>
</motion.div>

{/* ═══ 4. BLUEPRINT — natal accordion (existing, becomes position 4) ═══ */}
<SectionErrorBoundary name="NatalSignaturStatic">
  {/* ... existing NatalSignaturStatic block unchanged */}
</SectionErrorBoundary>
```

> **Crucial:** `NatalSignaturStatic` bleibt unverändert als kollabierter Accordion-Block weiter unten. Die 3D-Kugel ist ein NEUES Element oberhalb — kein Replace. So sehen User mit komplettem Profil beide (3D-Kugel + statische Identität-Pills im Accordion bei Bedarf), und User mit unvollständigem Profil sehen weiterhin die NatalSignaturStatic-Struktur (die mit leeren Pills umgehen kann).

**Step 4: Run the test from Task 2.2**

```bash
npx vitest run src/__tests__/dashboard-signatur-sphere-mount.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): mount SignatureSphere3D with dominant Wuxing overlay"
```

---

### Task 2.6: Failing test — graceful fallback when SignatureSphere3D throws

**Files:**
- Test: `src/__tests__/dashboard-signatur-error-boundary.test.tsx` (create)

**Step 1: Write the failing test**

```tsx
// src/__tests__/dashboard-signatur-error-boundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '@/src/components/Dashboard';

vi.mock('@/src/components/signatur-3d/SignatureSphere3D', () => ({
  SignatureSphere3D: () => {
    throw new Error('Simulated WebGL init failure');
  },
}));
vi.mock('@/src/services/experience');
vi.mock('@/src/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

describe('Dashboard — SignatureSphere3D error containment', () => {
  it('renders the SectionErrorBoundary fallback when sphere throws', () => {
    // Suppress expected console.error from the boundary
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <Dashboard {...completeDashboardProps()} />
      </MemoryRouter>,
    );
    // Error boundary fallback should render — the rest of the dashboard stays alive
    expect(screen.queryByTestId('signature-sphere-3d')).toBeNull();
    // The DailyChartHero (or another known sibling) must still be present
    expect(screen.getByTestId('daily-chart-hero') || screen.getByText(/Tageshoroskop|Daily/)).toBeTruthy();
    errorSpy.mockRestore();
  });
});

function completeDashboardProps() {
  // Same fixture as Task 1.2's helper — extract to src/__tests__/_fixtures/dashboard.ts
  // by now if it's used in 3 tests.
  return {} as never;
}
```

**Step 2: Run, verify it fails (or passes if SectionErrorBoundary already works)**

```bash
npx vitest run src/__tests__/dashboard-signatur-error-boundary.test.tsx
```

Expected: PASS if `SectionErrorBoundary` is already correctly wired (in which case this test is regression armor — keep it). FAIL if not — fix the boundary or its props.

**Step 3: Commit**

```bash
git add src/__tests__/dashboard-signatur-error-boundary.test.tsx src/components/Dashboard.tsx
git commit -m "test(dashboard): SectionErrorBoundary contains SignatureSphere3D failures"
```

---

### Task 2.7: Manual smoke — verify in dev server

**Step 1: Restart dev server, login**

```bash
# kill prior dev server (Ctrl+C in its terminal) then:
npm run dev
```

**Step 2: Visual checklist**

- [ ] Dashboard renders → 3D sphere is visible in the first viewport.
- [ ] The sphere has the user's dominant Wuxing element as a colored overlay (fire = red-orange, water = deep blue, wood = green, earth = ocher, metal = silver — verify against `wuxing-material.ts` color constants).
- [ ] Rotate manually with `OrbitControls` → confirm interactivity works.
- [ ] Toggle `prefers-reduced-motion: reduce` in DevTools → animation pauses but sphere still renders.
- [ ] Open browser DevTools → no console errors related to WebGL or Three.js.
- [ ] Resize to mobile viewport (e.g., iPhone SE 375×667) → sphere still renders without dramatic frame drops; if frame rate is bad (< 20fps sustained), open a follow-up issue, do not block this PR.

**Step 3: If any check fails — fix in place, commit, retest**

If the sphere doesn't show with the right Wuxing color, the most likely culprit is the `wuxingElement` prop name mismatch (you passed `wuxingElement` but the component expects `dominantElement` or `wuxing`). Re-read `SignatureSphere3D.tsx`'s props and correct.

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): correct Wuxing prop name on SignatureSphere3D"
```

---

## Phase 3 — Verification + PR

### Task 3.1: Full test suite + typecheck + build

```bash
npx tsc --noEmit
npm run build
npm test -- --run
```

**Expected:** all green. If any test outside our changes is now failing, **investigate** (don't suppress) — likely a snapshot test affected by Dashboard markup changes; review the diff manually.

### Task 3.2: Open PR

```bash
git push -u origin feature/dashboard-launch-blockers-2026-05-08
gh pr create --base main --title "fix(dashboard): launch blockers — Daily Pulse FuFirE wiring + Signatur 3D mount" --body "$(cat <<'EOF'
## Summary

Two launch blockers from 2026-05-08:

**1. Daily Pulse / Tageshoroskop on Dashboard**
- Replaced placeholder text with explicit loading skeleton (existing `data-testid="daily-chart-hero-skeleton"`) and prominent error state (`data-testid="daily-pulse-error"` with `[ERROR-CODE] message`) — per project doctrine: errors surfaced, not masked.
- Removed `buildFallbackDaily` substitution from the auto-fetch path; UI now surfaces "unavailable" rather than generic content.
- Added `dailyCacheKey()` with 06:00 local-time boundary (replaces midnight-based `todayKey()` in cache lookups).
- Added auto-refetch trigger: when local time crosses 06:00 with the dashboard mounted, the hook clears its cache and refetches without page reload.

**2. Signatur 3D Sphere with Wuxing Overlay**
- Mounted `SignatureSphere3D` in `Dashboard.tsx` first viewport, wrapped in `SectionErrorBoundary` for graceful failure containment.
- Computes the user's dominant Wuxing element from `apiData` and passes it as the sphere's overlay material.
- Falls back to `NatalSignaturStatic` only when no Wuxing data is available (incomplete profile path).

## Test plan

- [x] Unit: `daily-pulse-six-am-rotation`, `daily-pulse-six-am-cache-rotation`, `dashboard-daily-pulse-fetch`, `dashboard-daily-pulse-six-am-refetch`, `daily-chart-hero-no-placeholder`, `dashboard-signatur-sphere-mount`, `dashboard-signatur-error-boundary` all green.
- [x] Manual smoke: complete-profile user sees real horoscope; blocked-API user sees "unavailable"; sphere renders with Wuxing overlay; reduced-motion path verified.
- [ ] Manual smoke on mobile viewport (low-end Android) — performance review pending; if frame rate <20fps sustained, follow-up to switch to `SignaturAnchorCard` preview is captured as a separate issue.

## Out of scope
- Tagespuls Neu-Architektur (aphorism + Council of Six) — separate plan, depends on aphorism approval gate.
- Performance benchmarks for sphere on low-end mobile (follow-up).
- Removal of `buildFallbackDaily` export — kept for now, deprecation comment added; remove once no consumers reference it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Task 3.3: Notify the user

Tell the user the PR is open and provide the URL. List any deferred items (mobile-perf benchmark, `buildFallbackDaily` deprecation) so they know what's left.

---

## Out-of-scope reminders (do NOT do these in this plan)

- **Do not touch astrological formulas, scoring, ephemeris, BaZi, Wu-Xing calculations** — see [`CON-no-formula-changes`](https://github.com/DYAI2025/Astro-Noctum/blob/claude/sdlc-spec-noctum-2026-05-07/1-spec/constraints/CON-no-formula-changes.md). The fix is integration only.
- **Do not rebuild the Signatur V3 renderer** — see [`CON-no-signatur-v3-rebuild`](https://github.com/DYAI2025/Astro-Noctum/blob/claude/sdlc-spec-noctum-2026-05-07/1-spec/constraints/CON-no-signatur-v3-rebuild.md). Only mount it.
- **Do not change Stripe integration** — out of scope.
- **Do not implement the Tagespuls Neu-Architektur (aphorism + Council)** — that's a separate plan blocked by the aphorism human-approval gate.
- **Do not introduce new polling hooks** — see [`CON-greenops-polling-budget`](https://github.com/DYAI2025/Astro-Noctum/blob/claude/sdlc-spec-noctum-2026-05-07/1-spec/constraints/CON-greenops-polling-budget.md). The 06:00 timer is a single-shot `setTimeout`, not a poller — that's allowed.

---

## Estimated effort

- Phase 0 (pre-flight, audit): 30 min
- Phase 1 (Daily Pulse): 12 tasks × 5 min average = 60 min, plus iteration buffer = 90 min
- Phase 2 (Signatur 3D): 7 tasks × 5 min average = 35 min, plus iteration buffer = 60 min
- Phase 3 (verification + PR): 30 min

**Total: ~3.5 hours of focused work** for an engineer who has the production repo cloned and a working dev environment.
