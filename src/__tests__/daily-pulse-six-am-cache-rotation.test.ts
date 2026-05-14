/**
 * Phase 1 / Task 1.6 of docs/plans/2026-05-08-dashboard-launch-blockers.md
 *
 * Asserts that `getCachedDaily()` / `setCachedDaily()` honor the 06:00
 * day-window boundary — a cache entry stored before 06:00 is invalidated
 * when the local clock crosses 06:00 of the same calendar day.
 *
 * Pre-this-commit, the cache used `todayKey()` (midnight boundary), so:
 *   - cache stored at 23:00 on May 7 was already invalidated at 00:00 on May 8
 *   - cache stored at 04:00 on May 8 stayed valid at 06:00 on May 8 (wrong)
 * Post-this-commit, the cache uses `dailyCacheKey()` (06:00 boundary):
 *   - cache stored at 23:00 on May 7 stays valid through 05:59 on May 8
 *   - cache stored at 23:00 on May 7 is invalidated at 06:00 on May 8
 *
 * Initial state: imports of `setCachedDaily` / `getCachedDaily` resolve
 * to `undefined` because they are not yet exported from the hook module.
 * Test fails with `TypeError: setCachedDaily is not a function`. Task 1.6
 * adds the `export` keyword AND switches them to `dailyCacheKey()`.
 *
 * Per project doctrine 2026-05-08: behavior is described explicitly,
 * not abstractly. This test pins the cache-rotation contract.
 *
 * ── Why dynamic `await import(...)` instead of static? ───────────────
 * The cache helpers are imported dynamically inside each test body so
 * that during the failing-test snapshot phase (Task 1.6 step 1) the
 * test would fail with a clear runtime `TypeError: setCachedDaily is
 * not a function` rather than a TypeScript compile-error masking the
 * real failure. Vitest's tsconfig already excludes test files from
 * `tsc --noEmit`, but dynamic import keeps the test legible during
 * red→green TDD migrations and is consistent with the plan-snippet.
 *
 * ── Module-cache note ────────────────────────────────────────────────
 * Vitest caches dynamically-imported modules within a worker. The
 * second `await import(...)` returns the already-loaded module — the
 * cache helpers are pure (no module-level closures over `Date`), so
 * fake-timers work correctly across calls. If a future refactor
 * introduces module-level Date capture, this test will need
 * `vi.resetModules()` between assertions.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useFirstRunDaily cache — 06:00 boundary invalidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('cache stored at 23:00 on May 7 is still valid at 05:59 on May 8', async () => {
    vi.setSystemTime(new Date('2026-05-07T23:00:00'));
    const { setCachedDaily, getCachedDaily } = await import('@/src/hooks/useFirstRunDaily');
    setCachedDaily({ fusion: { synthesis: 'evening horoscope' } } as never);

    vi.setSystemTime(new Date('2026-05-08T05:59:00'));
    const cached = getCachedDaily();
    expect(cached?.fusion?.synthesis).toBe('evening horoscope');
  });

  it('cache stored at 23:00 on May 7 is INVALID at 06:00 on May 8 (06:00 boundary crossed)', async () => {
    vi.setSystemTime(new Date('2026-05-07T23:00:00'));
    const { setCachedDaily, getCachedDaily } = await import('@/src/hooks/useFirstRunDaily');
    setCachedDaily({ fusion: { synthesis: 'evening horoscope' } } as never);

    vi.setSystemTime(new Date('2026-05-08T06:00:00'));
    const cached = getCachedDaily();
    expect(cached).toBeNull();
  });

  it('cache stored at 04:00 on May 8 (still in May 7 window) is valid at 05:59 same day', async () => {
    vi.setSystemTime(new Date('2026-05-08T04:00:00'));
    const { setCachedDaily, getCachedDaily } = await import('@/src/hooks/useFirstRunDaily');
    setCachedDaily({ fusion: { synthesis: 'pre-dawn horoscope' } } as never);

    vi.setSystemTime(new Date('2026-05-08T05:59:00'));
    const cached = getCachedDaily();
    expect(cached?.fusion?.synthesis).toBe('pre-dawn horoscope');
  });

  it('cache stored at 04:00 on May 8 is invalid at 06:00 same day (window rotated)', async () => {
    vi.setSystemTime(new Date('2026-05-08T04:00:00'));
    const { setCachedDaily, getCachedDaily } = await import('@/src/hooks/useFirstRunDaily');
    setCachedDaily({ fusion: { synthesis: 'pre-dawn horoscope' } } as never);

    vi.setSystemTime(new Date('2026-05-08T06:00:00'));
    const cached = getCachedDaily();
    expect(cached).toBeNull();
  });
});
