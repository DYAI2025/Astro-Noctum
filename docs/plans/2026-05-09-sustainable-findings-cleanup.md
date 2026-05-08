# Sustainable Findings Cleanup Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

> **Repo context:** Plan authored in the SDLC scaffold (`Astro-Noctum/docs/plans/`). Executed against the production code in the sibling `Astro-Noctum-prod` clone on branch `feature/dashboard-launch-blockers-2026-05-08`. The launch-blockers parent plan (`2026-05-08-dashboard-launch-blockers.md`) is paused in mid-Phase-1 (Tasks 1.1–1.11 done; 1.12–1.13 pending) until this cleanup plan completes.

> **For the human reader:** During the launch-blockers plan execution, several code-review passes surfaced minor findings that were either (a) deferred with `TODO` comments, (b) acknowledged but not fixed, or (c) flagged as "out-of-scope follow-up". This plan eliminates **every** outstanding finding from those reviews, then establishes a workflow rule: after every future code-change commit, run tests → run code-review → if any new finding surfaces, append a task to this plan or a successor and repeat. The branch is "clean" only when a code-review pass produces zero CRITICAL/HIGH/MEDIUM findings.

**Goal:** Eliminate every outstanding finding from the prior code-review passes (1.5+1.6, 1.7+1.8+1.9, 1.10) before resuming the launch-blockers plan. After each fix, regression-armor grows; after each review, any new finding becomes a task. The branch reaches "clean" when a review finds zero non-INFO findings.

**Architecture:** Iterative TDD-backed remediation. Each finding is a task with the same 4-phase shape:
  1. **Failing test** (or characterization test for non-functional fixes)
  2. **Fix** — minimal change, ≤10 LOC where possible
  3. **Test must turn green** + full-suite check for regressions
  4. **Code-review pass** — manual or via the `/code-reviewer` / `/code-review-checklist` skill

If step 4 surfaces a new finding, that finding gets appended to this plan as a new task and the loop continues.

**Tech Stack:** Same as Astro-Noctum (React 19 + TypeScript strict + Vite + Vitest). No new dependencies.

---

## Operational Doctrine

**Every fix → test → review → loop until clean.** This applies to:

1. **Findings from the inventory below** (Tasks F1–F5 in this plan)
2. **Forward-looking principles** that future commits must honor (e.g., error-message sanitization, theme-token preference)
3. **Any new finding** from any future code-review pass — it MUST become a tracked task in this plan or a successor before being acted on

A commit is "doctrine-clean" only when:
- Tests are green (full suite, not just affected files)
- No `TODO` / `FIXME` left in code without an explicit follow-up task referenced
- Inline styles use semantic CSS variables when available
- A code-review pass produces zero findings of severity > MEDIUM

---

## Inventory of Outstanding Findings

| ID | Source | Severity | Status | Description |
|----|--------|----------|--------|-------------|
| F1 | 1.10 review (M1) | LOW | open | Hardcoded rose RGBA in DailyChartHero error block — bypasses theme tokens |
| F2 | 1.10 review (coverage gap) | LOW | open | No negative-path test: `error: null` + impulsText set → impulse renders, error block absent |
| F3 | 1.7/1.8 review (M1 perf) | MINOR | open with TODO | `opts.signal` in `runDailyFetch` is advisory-only — does not propagate to `fetch()` via `services/experience.ts` + `lib/authedFetch.ts` |
| F4 | 1.10 review (test infrastructure) | MINOR | open | Vitest fake-timer + parallelism races: 4–5 random failures in full suite ~30% of runs. Tests pass in isolation. |
| F5 | 1.10 review (forward-looking, A04 OWASP) | PRINCIPLE | not yet relevant | Task 1.12's error classifier MUST sanitize messages: no stack traces, file paths, user IDs, tokens |

---

## Pre-flight (run once before F1)

### P0.1: Pull the latest feature branch state

```bash
cd /path/to/Astro-Noctum-prod
git fetch origin
git checkout feature/dashboard-launch-blockers-2026-05-08
git pull --ff-only
git status   # working tree must be clean
```

### P0.2: Baseline check — confirm where the suite stands today

```bash
npx tsc --noEmit
npm test -- --run
```

Expected:
- Typecheck: clean ✓
- Tests: **245/245 or 246/246 passing** (file count fluctuates by ±1 across days as tests are added). Up to 5 failures are TOLERATED if and only if they reproduce as the F4-flake pattern (random, non-reproducing in isolation, on dashboard-daily-pulse-* / daily-pulse-six-am-cache-rotation files). Other failures are real regressions and must be investigated before continuing.

### P0.3: Confirm the inventory is current

Run the inventory probes:

```bash
# F1: hardcoded rose RGBA?
grep -n "rgb(248\|rgba(220, 38" src/components/dashboard/DailyChartHero.tsx

# F3: TODO(perf) in the hook?
grep -n "TODO(perf)" src/hooks/useFirstRunDaily.ts

# F2: number of tests in the no-placeholder file
grep -cE "^\s+it\(" src/__tests__/daily-chart-hero-no-placeholder.test.tsx
```

If any probe returns unexpected output (e.g., the TODO is gone, or the rose RGBA has been replaced), **STOP** and surface to the user — the inventory is stale.

---

## Task F1 — Theme tokens for error block

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx` (3 inline `style` literals — lines ~419-426)

**Step 1: Decide the fallback strategy**

The codebase uses CSS variables semantically (`var(--tile-text-primary)` etc.) but no error-specific tokens exist yet. Two options:
- **A. Inline `var(name, fallback)` form** — the rose RGBA stays as fallback, future tokens auto-pick-up. Zero coordination cost.
- **B. Add new tokens to global CSS** — needs touching the theme file. More coordination.

**Choose A.** It's reversible, requires no global changes, and is consistent with the codebase's existing patterns (other places use `var(--tile-text-secondary)` as is, without fallback — but adding fallback is strictly safer).

**Step 2: Failing characterization test**

```ts
// src/__tests__/daily-chart-hero-error-theme-tokens.test.tsx (NEW)
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';
import type { TransitEvent } from '@/src/lib/schemas/transit-state';

vi.mock('@/src/contexts/LanguageContext', () => ({ useLanguage: () => ({ lang: 'de' as const }) }));
vi.mock('@/src/components/shared/ActiveImpactsList', () => ({ ActiveImpactsList: () => null }));

import { DailyChartHero, type DailyChartHeroProps } from '@/src/components/dashboard/DailyChartHero';

const baseProps: DailyChartHeroProps = {
  loading: false, baseCoherence: 50, positiveDailyDelta: 0, displayedCoherence: 50,
  spaceWeather: { kpIndex: 2, solarPressure: 0.3, events: [], alerts: [], loading: false, error: null } as unknown as SpaceWeatherState,
  transitEvents: [] as TransitEvent[], dayMode: 'pulse', birthSign: 'Aries',
  impulsText: undefined, profileIncomplete: false, error: null,
};

describe('DailyChartHero error block — theme-token compatibility', () => {
  it('error block inline styles use var() form so future theme tokens can override', () => {
    const { container } = render(
      <DailyChartHero
        {...baseProps}
        error={{ code: 'TEST-CODE', message: 'test message' }}
      />,
    );
    const errorSection = container.querySelector('[data-testid="daily-pulse-error"]');
    expect(errorSection).not.toBeNull();
    // The bordered/tinted block lives inside the section
    const innerBlock = errorSection!.querySelector('div');
    expect(innerBlock).not.toBeNull();
    const inlineStyle = innerBlock!.getAttribute('style') ?? '';
    // Both color values MUST be wrapped in var(...) for theme-override capability
    expect(inlineStyle).toMatch(/border[a-z-]*:\s*var\(/i);
    expect(inlineStyle).toMatch(/background[a-z-]*:\s*var\(/i);
    // The error code line must use var() too
    const codeEl = container.querySelector('[data-testid="daily-pulse-error-code"]');
    expect(codeEl?.getAttribute('style') ?? '').toMatch(/color:\s*var\(/i);
  });
});
```

Run: `npx vitest run src/__tests__/daily-chart-hero-error-theme-tokens.test.tsx`

Expected: **FAIL** — current styles are raw `rgba(...)` / `rgb(...)`, no `var()` wrapper.

**Step 3: Commit failing test**

```bash
git add src/__tests__/daily-chart-hero-error-theme-tokens.test.tsx
git commit -m "test(daily-chart-hero): pin theme-token wrappers for error block colors"
```

**Step 4: Implement the fix**

In `src/components/dashboard/DailyChartHero.tsx` ~lines 417-428:

```tsx
<div
  className="rounded-lg border px-4 py-3 max-w-prose mx-auto"
  style={{
    borderColor: 'var(--color-error-border, rgba(220, 38, 38, 0.4))',
    background: 'var(--color-error-bg, rgba(220, 38, 38, 0.08))',
  }}
>
  <p
    className="text-xs font-mono mb-1"
    style={{ color: 'var(--color-error-code, rgb(248, 113, 113))' }}
    data-testid="daily-pulse-error-code"
  >
```

**Step 5: Run the test → must pass**

```bash
npx vitest run src/__tests__/daily-chart-hero-error-theme-tokens.test.tsx
```

Expected: **PASS**.

**Step 6: Run all DailyChartHero tests for regression**

```bash
npx vitest run src/__tests__/daily-chart-hero-*.test.tsx
```

Expected: all green.

**Step 7: Commit the fix**

```bash
git add src/components/dashboard/DailyChartHero.tsx
git commit -m "fix(daily-chart-hero): wrap error block colors in var() for theme-override capability"
```

**Step 8: Code-review pass**

Invoke `/code-reviewer` (or `/code-review-checklist`) on the diff `HEAD~2..HEAD`. If new findings surface, append them to this plan as new tasks and continue. Otherwise mark F1 ✅.

---

## Task F2 — Negative-path test for error=null

**Files:**
- Modify: `src/__tests__/daily-chart-hero-no-placeholder.test.tsx` (add 4th `it` block)

**Step 1: Write the test**

Append to the existing describe block:

```ts
it('does NOT render error block when error is null and impulsText is set', () => {
  render(
    <DailyChartHero
      {...baseProps}
      impulsText="real horoscope text from a successful fetch"
      error={null}
    />,
  );
  // Error block must be absent
  expect(screen.queryByTestId('daily-pulse-error')).toBeNull();
  expect(screen.queryByTestId('daily-pulse-error-code')).toBeNull();
  expect(screen.queryByTestId('daily-pulse-error-message')).toBeNull();
  // Impulse section must be present
  expect(screen.getByTestId('day-impulse-section')).toBeInTheDocument();
  expect(screen.getByText('real horoscope text from a successful fetch')).toBeInTheDocument();
});
```

**Step 2: Run — should PASS immediately**

The component already correctly hides the error block when `error: null`. This test is regression-armor for the negative path. If it FAILS, the implementation is wrong — investigate before proceeding.

```bash
npx vitest run src/__tests__/daily-chart-hero-no-placeholder.test.tsx
```

Expected: 4/4 green.

**Step 3: Commit**

```bash
git add src/__tests__/daily-chart-hero-no-placeholder.test.tsx
git commit -m "test(daily-chart-hero): negative-path armor — error=null shows impulse, not error block"
```

**Step 4: Code-review pass.**

---

## Task F3 — AbortSignal threading through fetch pipeline

This is the largest finding. Threading `AbortSignal` from `useFirstRunDaily.runDailyFetch` through `services/experience.ts:fetchDailyExperience` → `lib/authedFetch.ts` → `fetch()` so unmount during a slow network call actually cancels the request.

**Files:**
- Modify: `src/lib/authedFetch.ts`
- Modify: `src/services/experience.ts`
- Modify: `src/hooks/useFirstRunDaily.ts` (pass signal through)
- Modify: `src/__tests__/dashboard-daily-pulse-fetch.test.tsx` (verify signal threads — optional)

**Step 1: Failing test — fetch is invoked with the signal**

```ts
// src/__tests__/abort-signal-threading.test.ts (NEW)
import { describe, it, expect, vi } from 'vitest';
import { authedFetch } from '@/src/lib/authedFetch';

const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

describe('authedFetch — AbortSignal threading', () => {
  it('passes AbortSignal through to global fetch', async () => {
    const ac = new AbortController();
    await authedFetch('/api/test', { method: 'GET', signal: ac.signal });
    const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
    const init = lastCall[1] as RequestInit;
    expect(init.signal).toBe(ac.signal);
  });
});
```

Run: `npx vitest run src/__tests__/abort-signal-threading.test.ts`

Expected: **FAIL** — `authedFetch` may not currently accept `signal` in its `init` argument, OR may not pass it through.

**Step 2: Read `authedFetch` and decide the modification scope**

```bash
cat src/lib/authedFetch.ts | head -50
```

If `authedFetch` already passes `init.signal` through (transparently because it spreads `init`), the test should pass. If it strips/ignores `signal`, fix it.

**Step 3: Implement the fix in `authedFetch.ts`**

Most likely: `authedFetch` already calls `fetch(url, init)` and signal flows naturally. But if it builds a custom init object, ensure `signal: init.signal` is preserved.

```ts
// Before (potential):
export async function authedFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  // ... auth header injection
  return fetch(url, { ...init, headers });  // signal is preserved via spread
}
// If the spread isn't there:
return fetch(url, { method: init.method, headers, body: init.body, signal: init.signal });
```

**Step 4: Update `services/experience.ts` to accept + forward signal**

```ts
export async function fetchDailyExperience(
  birth: { ... },
  soulprintSectors: number[],
  quizSectors: number[],
  targetDate: string,
  locale = 'de-DE',
  transitInfluences: TransitInfluenceInput[] = [],
  birthSign = '',
  options: { signal?: AbortSignal } = {},
): Promise<DailyResponse> {
  const resp = await authedFetch('/api/experience/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* ... */ }),
    signal: options.signal,
  });
  // ...
}
```

**Step 5: Update `useFirstRunDaily.runDailyFetch` to forward**

```ts
const data = await fetchDailyExperience(
  birthData,
  soulprintSectors ?? Array(12).fill(0.5),
  quizSectors,
  targetDate,
  locale,
  transitInfluences,
  birthSign ?? '',
  { signal: opts.signal },
);
```

**Step 6: Remove the `TODO(perf)` comment in the hook**

The TODO above `runDailyFetch` (added in `e3ca893` polish) becomes obsolete once the signal threads. Replace with a one-liner:

```ts
// AbortSignal is threaded through services/experience.ts → authedFetch →
// global fetch(). Unmount during in-flight fetch will abort the network call.
```

**Step 7: Run all daily-pulse tests + the new threading test**

```bash
npx vitest run \
  src/__tests__/abort-signal-threading.test.ts \
  src/__tests__/dashboard-daily-pulse-fetch.test.tsx \
  src/__tests__/dashboard-daily-pulse-six-am-refetch.test.tsx
```

Expected: all green. The `useFirstRunDaily` mocks for `fetchDailyExperience` accept any signature, so adding a parameter doesn't break them.

**Step 8: Run typecheck + full suite**

```bash
npx tsc --noEmit
npm test -- --run
```

Expected: typecheck green; full suite within F4-flake-tolerance.

**Step 9: Commit**

```bash
git add src/lib/authedFetch.ts src/services/experience.ts src/hooks/useFirstRunDaily.ts src/__tests__/abort-signal-threading.test.ts
git commit -m "fix(perf): thread AbortSignal through fetchDailyExperience → authedFetch → fetch (closes TODO)"
```

**Step 10: Code-review pass.**

---

## Task F4 — Vitest fake-timer + parallelism flake stabilization

The full suite intermittently fails 4–5 tests when run via `npm test -- --run`. Tests pass in isolation. Pattern: tests using `vi.useFakeTimers()` race with each other across vitest workers.

**Files:**
- Modify: `vitest.config.ts` (or equivalent) — pin pool/threads behavior
- Possibly modify: individual test files using fake timers — OR move them into a separate vitest project

**Step 1: Diagnose — read current vitest config**

```bash
cat vitest.config.ts 2>/dev/null || cat vite.config.ts | head -40
```

Look for `pool`, `poolOptions`, `fakeTimers` config. If missing, defaults are used.

**Step 2: Hypothesis check**

Run the suite multiple times and capture failure patterns:

```bash
for i in 1 2 3 4 5; do
  echo "=== Run $i ==="
  npm test -- --run 2>&1 | tail -3
done
```

Expected: random subset of 4–5 failures across runs; pattern often involves `daily-pulse-six-am-cache-rotation.test.ts` test 1.

**Step 3: Apply the targeted fix**

Add to `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Existing config preserved
    pool: 'threads',
    poolOptions: {
      threads: {
        // Fake-timer + dynamic-import races require single-thread isolation
        // for tests that use vi.useFakeTimers + dynamic imports of state-mutating modules.
        // Sequential execution costs ~10-20s on full suite but eliminates flake.
        singleThread: true,
        // Alternatively: keep parallel for non-fake-timer tests, isolate fake-timer ones via
        // suite-level workspace or test.only-on-pattern. Single-thread is simpler.
      },
    },
  },
});
```

Conservative alternative if `singleThread: true` is too costly: only force single-thread for the fake-timer suites via vitest workspace projects.

**Step 4: Run the suite 5× to verify stability**

```bash
for i in 1 2 3 4 5; do
  echo "=== Run $i ==="
  npm test -- --run 2>&1 | tail -3
done
```

Expected: all 5 runs report exact same passing count (e.g., consistent 246/246).

**Step 5: Verify CI doesn't get materially slower**

Note: CI doesn't run tests today (`ci.yml` only runs typecheck + build). So CI impact is zero. Local dev impact: ~10-20s slower full-suite runs, acceptable trade-off for deterministic test results.

**Step 6: Commit**

```bash
git add vitest.config.ts
git commit -m "test(infra): pin vitest pool to singleThread to eliminate fake-timer parallelism flake"
```

**Step 7: Code-review pass.**

---

## Task F5 — Forward-looking: error-message sanitization principles for Task 1.12

This is a **principle** for Task 1.12 (catch-block error classifier), not a fix. Records the rule in the launch-blockers plan so when 1.12 lands, it follows the principle.

**Files:**
- Modify: `docs/plans/2026-05-08-dashboard-launch-blockers.md` (in the SDLC scaffold, on the orphan branch — separate workspace)

**Step 1: Add a "Sanitization rules" section to Task 1.12 in the launch-blockers plan**

Open the launch-blockers plan and prepend to Task 1.12's body:

```markdown
**Sanitization rules (per OWASP A04 — Insecure Design + project doctrine 2026-05-08):**

The classifier MUST produce error messages that are safe to render in the UI. Specifically:
- NEVER include stack traces (`err.stack`) — even truncated.
- NEVER include file paths or import specifiers from the error.
- NEVER include user identifiers, auth tokens, session IDs, or birth-data values.
- NEVER include the full URL with query parameters (only the path is safe).
- NEVER pass `err.message` through verbatim — always wrap in a controlled English template.

The mapping from raw error → user-safe `[CODE] message` is:

  - HTTP 4xx/5xx → "FuFirE /api/experience/daily returned HTTP {status}."
  - Network/fetch rejection → "Network error reaching /api/experience/daily."
  - Zod validation → "Daily-pulse response failed schema validation."
  - All other → "Daily horoscope fetch failed: {generic-category}."

`console.error` may log the FULL error (stack trace, etc.) for engineering — that's a server-side / dev-tools-only surface and is fine. The UI render path uses ONLY the sanitized message.
```

**Step 2: Commit + push to orphan branch**

```bash
# In the SDLC-scaffold repo (not the prod-clone)
git add docs/plans/2026-05-08-dashboard-launch-blockers.md
git commit -m "docs(plan): add error-message sanitization principles to Task 1.12 (OWASP A04)"
git push origin main:refs/heads/claude/sdlc-spec-noctum-2026-05-07
```

**Step 3: Code-review pass on the plan amendment.**

---

## Task F6 — Resume launch-blockers Phase 1

After F1–F5 are all ✅ and a final review pass produces zero non-INFO findings:

1. Resume the launch-blockers plan at Task 1.12. The classifier implementation MUST honor F5's sanitization rules — every error message is constructed from a controlled template, never from raw `err.message` / `err.stack`.
2. Continue with Task 1.13 (manual smoke).
3. Phase 2 (Signatur 3D) follows.

The doctrine "fix → test → review → loop" applies for all subsequent tasks.

---

## Estimated effort

- F1: 5 min (test) + 5 min (impl) + review = ~15 min
- F2: 5 min (test, already-green) + review = ~10 min
- F3: 20 min (test + 3 file edits) + 10 min full-suite verification + review = ~35 min
- F4: 15 min (config + verification × 5 runs) + review = ~20 min
- F5: 10 min (plan edit + push) + review = ~15 min
- F6: continues launch-blockers plan, no fixed cost

**Total: ~95 min focused work** before resuming Phase 1.

---

## Loop-completion definition

This plan is complete when:

1. All tasks F1–F5 have green checkmarks.
2. A final code-review pass on the cumulative diff (since Phase-1 review-after-Task-1.10) produces zero CRITICAL/HIGH/MEDIUM findings.
3. Full test suite runs 3 times consecutively with identical pass counts (no flake).
4. `git log` shows clean commit history with each fix tied to a finding ID.

If the final review surfaces a NEW finding, append it as Task F7 (or higher) and continue the loop. The plan is "done" only when a review-pass-without-new-findings happens.
