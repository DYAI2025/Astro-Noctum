# Dashboard Launch Blockers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

> **Repo context:** This plan is authored in the SDLC scaffold (`Astro-Noctum/docs/plans/`) but **executed against the production code on `origin/main` of github.com/DYAI2025/Astro-Noctum**. Engineer should clone that repo, create a feature branch off `main`, and apply this plan there. File paths in this plan reference the production codebase verified against `origin/main` HEAD = `f45aef4`.

> **For the human reader:** This addresses two launch blockers from 2026-05-08. Both have the same shape: a known-implemented feature exists in the codebase but is not actually delivering value to users on the dashboard. Phase 1 fixes Daily Pulse (it shows placeholder text instead of real FuFirE-derived horoscope). Phase 2 fixes Signatur 3D (the sphere with Wuxing overlay isn't mounted on the dashboard at all).

**Goal:** Eliminate the two launch blockers — Daily Pulse must render the real FuFirE-derived horoscope on every dashboard mount with auto-rotation at 06:00 local time and zero placeholder text; SignatureSphere3D must render in the dashboard first viewport with the dominant Wuxing element as a visible overlay.

**Architecture:** Daily Pulse already has the pipeline (`useFirstRunDaily` → `fetchDailyExperience` → `POST /api/experience/daily` → server proxy → FuFirE). The fix is operational: ensure the fetch triggers reliably on mount, replace fallback / placeholder content with explicit loading or unavailable states, and add a 06:00-local-time refetch trigger. SignatureSphere3D exists with full Wuxing material support; the fix is integration: mount it in `Dashboard.tsx` inside a `SectionErrorBoundary`, pass the dominant Wuxing element prop, and behind a perf-aware mount strategy (preview card by default, embedded sphere when WebGL availability is verified).

**Tech Stack:** React 19 + TypeScript (strict) + Vite, Three.js + @react-three/fiber + @react-three/drei (3D sphere), `motion/react` (reduced-motion support), Vitest (testing), Supabase auth + storage, FuFirE API via server proxy at `/api/experience/daily`.

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

**Step 1: Add a `useEffect` that schedules a refetch at the next 06:00 local time**

Inside the hook body (after the existing fetch effect), add:

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
    // Invalidate the cache and trigger refetch by clearing the local state
    // and depending on the existing fetch effect's dependency on `dailyCacheKey()`.
    localStorage.removeItem('daily_horoscope_cache');
    setDailyData(null);
    setLoading(true);
    // Re-run the fetch — call the same function the existing effect uses.
    runDailyFetch();
  }, msUntilNext6am);
  return () => clearTimeout(timer);
}, [dailyCacheKey()]); // re-arms after each rotation
```

> **Note for the engineer:** the exact integration depends on how the existing fetch effect is structured in `useFirstRunDaily`. If it uses an inner `runDailyFetch` callback, call that. If the fetch is inlined, extract it to a `useCallback` first (still ≤5 line refactor), then reuse. Read the hook before writing — don't blindly paste this snippet.

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
    // Must contain a loading affordance (skeleton or spinner with a testid):
    expect(screen.getByTestId('daily-pulse-loading')).toBeInTheDocument();
  });

  it('renders an "unavailable" indicator when not loading and no data', () => {
    render(
      <DailyChartHero
        impulsText={undefined}
        dayMode="pulse"
        loading={false}
        baseCoherence={0.5}
        positiveDailyDelta={0}
        displayedCoherence={0.5}
      />,
    );
    expect(screen.getByTestId('daily-pulse-unavailable')).toBeInTheDocument();
  });
});
```

**Step 2: Run, verify it fails**

```bash
npx vitest run src/__tests__/daily-chart-hero-no-placeholder.test.tsx
```

Expected: FAIL — `daily-pulse-loading` and/or `daily-pulse-unavailable` testids do not exist; the component currently renders different text.

**Step 3: Commit the failing test**

```bash
git add src/__tests__/daily-chart-hero-no-placeholder.test.tsx
git commit -m "test(daily-chart-hero): no placeholder text when impulsText is undefined"
```

---

### Task 1.10: Implement loading skeleton + unavailable state in `DailyChartHero`

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx`

**Step 1: Add `loading` to the props interface (if not already present)**

Read the file. If the interface lacks a `loading` boolean, add it (optional, default false).

**Step 2: Replace any literal placeholder string with conditional rendering**

In the section that currently renders the impulse text (likely inside a `<p>` or `<motion.div>`):

```tsx
{loading ? (
  <div data-testid="daily-pulse-loading" className="animate-pulse">
    <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
    <div className="h-4 w-1/2 bg-white/10 rounded" />
  </div>
) : impulsText ? (
  <p className="text-sm leading-relaxed">{impulsText}</p>
) : (
  <p
    data-testid="daily-pulse-unavailable"
    className="text-xs"
    style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
  >
    {/* No fallback text. State the truth. */}
    {isDe ? 'Tagespuls heute nicht verfügbar — bitte neu laden.' : 'Daily pulse unavailable today — please reload.'}
  </p>
)}
```

> **Important:** The "unavailable" message is **factual**, not generic. It does not pretend to be horoscope content. This matches the user's requirement: *"Es dürfen keine generischen oder Placeholder-Texte mehr verwendet werden."*

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

### Task 1.11: Wire `loading` from `useFirstRunDaily` into `DailyChartHero`

**Files:**
- Modify: `src/components/Dashboard.tsx` (around line 376 — the `<DailyChartHero ... />` call)

**Step 1: Pass `loading` prop**

Find the `<DailyChartHero` call site (~line 376 in `Dashboard.tsx`). Add `loading={dailyLoading}` (or whatever the loading state is named in `useFirstRunDaily`'s return object).

```tsx
const { dailyData, dayHarmonic, nightHarmonic, loading: dailyLoading, handleClose: handleDailyClose } = useFirstRunDaily(...);
// ...
<DailyChartHero
  // ... existing props
  loading={dailyLoading}
  impulsText={dailyData?.fusion?.synthesis || dailyData?.fusion?.summary}
  // ...
/>
```

**Step 2: Run the dashboard mount test from Task 1.2 + the no-placeholder test**

```bash
npx vitest run src/__tests__/dashboard-daily-pulse-fetch.test.tsx src/__tests__/daily-chart-hero-no-placeholder.test.tsx
```

Expected: both PASS.

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): wire daily-pulse loading state into DailyChartHero"
```

---

### Task 1.12: Remove `buildFallbackDaily` from the auto-fetch path

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 1: Audit `buildFallbackDaily` usage**

```bash
git grep -n "buildFallbackDaily" src/
```

Expected: invocations in `useFirstRunDaily.ts` (the catch-block of the fetch effect) and possibly in tests.

**Step 2: Replace the catch-block fallback with explicit "unavailable" state**

Find the `try/catch` around `fetchDailyExperience`. Currently it likely sets `dailyData` to `buildFallbackDaily(lang)` on error. Change it to leave `dailyData` as `null` and ensure `loading` becomes `false`:

```ts
try {
  const data = await fetchDailyExperience(...);
  setDailyData(data);
  setCachedDaily(data);
} catch (err) {
  // Do NOT substitute a fallback. Surface "unavailable" via null + loading=false.
  // The UI handles this via DailyChartHero's data-testid="daily-pulse-unavailable".
  console.warn('[useFirstRunDaily] fetchDailyExperience failed; surfacing unavailable state', err);
  setDailyData(null);
} finally {
  setLoading(false);
}
```

**Step 3: Keep the export of `buildFallbackDaily` in place** for now (other consumers may exist). Add a deprecation comment:

```ts
/**
 * @deprecated As of 2026-05-08, the daily-pulse pipeline does not auto-substitute
 * fallback content. UI now surfaces an explicit "unavailable" state when the
 * FuFirE fetch fails. Remove this function once no consumers remain.
 *
 * Tracked in: docs/plans/2026-05-08-dashboard-launch-blockers.md
 */
export function buildFallbackDaily(locale: string = 'de'): DailyResponse {
  // ... existing implementation unchanged
}
```

**Step 4: Run all daily-pulse tests**

```bash
npx vitest run src/__tests__/daily-pulse-* src/__tests__/dashboard-daily-pulse-* src/__tests__/daily-chart-hero-*
```

Expected: all PASS.

**Step 5: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts
git commit -m "feat(daily-pulse): remove fallback substitution; surface unavailable state instead"
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

**Step 1: Document the contract**

Create `docs/plans/_scratch/2026-05-08-signatur-3d-contract.md` with:
- The `SignatureSphere3DProps` interface (exact shape).
- The Wuxing prop name and accepted values (`WuxingElement` is `'wood' | 'fire' | 'earth' | 'metal' | 'water'`).
- Any required parent context (`PlanetariumContext`, `LanguageContext`, etc.).
- Whether the sphere requires `chladniParams` to render or has a self-contained default.
- The performance characteristics noted in the source (e.g., the H5 morph at 15fps).

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
    <div data-testid="signature-sphere-3d" data-wuxing={props.wuxingElement} />
  )),
}));
vi.mock('@/src/services/experience');
vi.mock('@/src/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

describe('Dashboard — SignatureSphere3D with Wuxing overlay', () => {
  it('mounts SignatureSphere3D and passes the dominant Wuxing element', () => {
    const apiData = makeApiDataWithDominantWuxing('fire');
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
    expect(sphere.getAttribute('data-wuxing')).toBe('fire');
  });
});

function makeApiDataWithDominantWuxing(elem: 'fire' | 'water' | 'wood' | 'earth' | 'metal') {
  // Read src/types/bafe.ts ApiData shape; populate the path that drives
  // the dashboard's "dominant Wuxing element" selection.
  // Likely path: apiData.wuxing.dominant_element OR apiData.bazi.dominant_wuxing
  return {} as never;
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

### Task 2.4: Compute the dominant Wuxing element from `apiData`

**Files:**
- Read: `src/lib/astro-data/wuxing.ts` (existing wuxing utilities)
- Read: `src/types/bafe.ts` (ApiData shape — find the wuxing distribution field)
- Possibly add: `src/lib/astro-data/dominant-wuxing.ts` (only if a helper doesn't exist)

**Step 1: Search for an existing helper**

```bash
git grep -n "dominant.*wuxing\|dominantWuxing\|dominant_element" src/lib/ src/hooks/ src/components/
```

Expected: a helper exists (most production codebases have one). If found, use it. If not, write a small one.

**Step 2: If no helper exists — failing test**

```ts
// src/__tests__/dominant-wuxing.test.ts (only if helper is missing)
import { describe, it, expect } from 'vitest';
import { computeDominantWuxing } from '@/src/lib/astro-data/dominant-wuxing';

describe('computeDominantWuxing', () => {
  it('returns the element with the highest count', () => {
    expect(computeDominantWuxing({ wood: 1, fire: 4, earth: 1, metal: 1, water: 1 })).toBe('fire');
  });
  it('returns null on empty distribution', () => {
    expect(computeDominantWuxing({})).toBeNull();
  });
});
```

**Step 3: Implement the helper** (only if missing). 5-line function. Run the test. Commit.

**Step 4: If a helper already exists** — skip Steps 2 and 3. Just note its location for use in Task 2.5.

---

### Task 2.5: Mount `SignatureSphere3D` in `Dashboard.tsx`

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Add the import**

Top of `Dashboard.tsx`, alongside the other signatur imports:

```tsx
import { SignatureSphere3D } from "./signatur-3d/SignatureSphere3D";
```

**Step 2: Compute the dominant Wuxing element**

Inside the Dashboard function, after `apiData` is available:

```tsx
// ── Dominant Wuxing element for signatur sphere overlay ──
const dominantWuxing = useMemo(
  () => computeDominantWuxing(apiData?.wuxing?.distribution ?? {}),
  [apiData?.wuxing?.distribution],
);
```

(Adjust the path `apiData.wuxing.distribution` to whatever the actual field is per your Task 2.4 audit.)

**Step 3: Replace the existing `<NatalSignaturStatic>` block at ~line 429 with the 3D sphere**

```tsx
{/* ═══ 2. SIGNATUR 3D SPHERE WITH WUXING OVERLAY ═══════════════════════ */}
<motion.div {...fadeIn(0.1)}>
  <SectionErrorBoundary name="SignatureSphere3D">
    <SignatureSphere3D
      // ... pass the props determined by your Task 2.1 audit
      wuxingElement={dominantWuxing ?? undefined}
      // chladniParams, planetWeights, userId, labels, etc.
    />
  </SectionErrorBoundary>
</motion.div>
```

> **Crucial:** Do not delete `<NatalSignaturStatic>` yet. Keep it as a fallback for now: render it only when `dominantWuxing === null` (no profile data) so users without complete profiles still see something. The error-boundary fallback is a separate path (renderer crash).

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
- Replaced placeholder text with explicit loading skeleton (`data-testid="daily-pulse-loading"`) and unavailable state (`data-testid="daily-pulse-unavailable"`).
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
