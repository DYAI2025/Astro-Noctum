/**
 * Phase 1 / Task 1.4 of docs/plans/2026-05-08-dashboard-launch-blockers.md
 *
 * Asserts that `dailyCacheKey()` honors a 06:00 local-time day-window
 * boundary, NOT a midnight boundary. Times between 00:00 and 05:59
 * belong to the previous day's window — users perceive "today's
 * horoscope" as referring to the waking day, not the calendar day.
 *
 * Currently fails because `dailyCacheKey` does not exist yet — the
 * hook still uses `todayKey()` (midnight). Task 1.5 introduces the
 * function; Task 1.6 switches the cache to use it.
 *
 * Per project doctrine 2026-05-08: behavior is described explicitly,
 * not abstractly. The 06:00 boundary is the user-stated requirement;
 * this test pins it.
 *
 * ── Timezone assumption ──────────────────────────────────────────────
 * All Date string literals in this file are interpreted in the test
 * process's LOCAL timezone (per ECMAScript 2020+ rule for ISO-strings
 * without offset). The 06:00 boundary is checked via Date.getHours() —
 * which also returns the LOCAL hour. Therefore this test is
 * TZ-agnostic: same logic regardless of CI machine TZ. The boundary
 * ALWAYS lies at 06:00 local time wherever the test runs.
 */
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

  it('returns the same key at 05:59 today and 23:59 yesterday — both belong to "yesterday\'s day-window"', () => {
    vi.setSystemTime(new Date('2026-05-08T05:59:00'));
    const earlyMorningKey = dailyCacheKey();
    vi.setSystemTime(new Date('2026-05-07T23:59:00'));
    const lateNightKey = dailyCacheKey();
    // 23:59 on May 7 and 05:59 on May 8 both fall in the day-window
    // that started at 06:00 on May 7 and ends at 05:59:59 on May 8.
    expect(earlyMorningKey).toBe(lateNightKey);
  });

  it('returns a different key at 06:00 — the day-window has rotated', () => {
    vi.setSystemTime(new Date('2026-05-08T05:59:00'));
    const beforeRotation = dailyCacheKey();
    vi.setSystemTime(new Date('2026-05-08T06:00:00'));
    const afterRotation = dailyCacheKey();
    expect(afterRotation).not.toBe(beforeRotation);
  });

  it('returns the windowed-date YYYY-MM-DD shape', () => {
    vi.setSystemTime(new Date('2026-05-08T12:34:00'));
    const key = dailyCacheKey();
    // After 06:00, the windowed date is the same as the calendar date.
    expect(key).toBe('2026-05-08');
  });

  it('at 04:00 returns the previous day in YYYY-MM-DD shape', () => {
    vi.setSystemTime(new Date('2026-05-08T04:00:00'));
    const key = dailyCacheKey();
    // Before 06:00, the windowed date rolls back to the previous calendar day.
    expect(key).toBe('2026-05-07');
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  it('rolls year boundary correctly: Jan 1 05:59 → Dec 31 of previous year', () => {
    // 23:59 on Dec 31 belongs to its own day window (no rotation needed)
    vi.setSystemTime(new Date('2026-12-31T23:59:00'));
    expect(dailyCacheKey()).toBe('2026-12-31');

    // 05:59 on Jan 1 still belongs to Dec 31's day window — must roll back
    // across both day AND year boundaries via Date.setDate(0) semantics.
    vi.setSystemTime(new Date('2027-01-01T05:59:00'));
    expect(dailyCacheKey()).toBe('2026-12-31');

    // 06:00 on Jan 1 is the new day window
    vi.setSystemTime(new Date('2027-01-01T06:00:00'));
    expect(dailyCacheKey()).toBe('2027-01-01');
  });

  it('rolls leap-year Feb 29 → Mar 1 boundary correctly', () => {
    // Feb 29, 2024 is a real leap day. 23:00 belongs to its own window.
    vi.setSystemTime(new Date('2024-02-29T23:00:00'));
    expect(dailyCacheKey()).toBe('2024-02-29');

    // 05:00 on Mar 1, 2024 must roll back to Feb 29 — Date.setDate(0) on
    // a date in March returns the last day of February (29 in 2024,
    // 28 in non-leap years). This validates the rollback logic against
    // month-length variability.
    vi.setSystemTime(new Date('2024-03-01T05:00:00'));
    expect(dailyCacheKey()).toBe('2024-02-29');

    // Sanity: same date in non-leap-year 2025 rolls back to Feb 28
    vi.setSystemTime(new Date('2025-03-01T05:00:00'));
    expect(dailyCacheKey()).toBe('2025-02-28');
  });

  // DST transitions are deliberately not asserted: the test process's
  // TZ is not pinned (varies between dev machines and CI), and DST
  // semantics depend on the TZ database. The implementation uses
  // standard Date APIs that delegate DST to the JS engine — correct
  // by construction. If a regression is reported during a DST
  // transition, add a TZ-pinned test then.
  it.todo('handles DST spring-forward transition correctly (TZ-dependent — pin TZ before asserting)');
  it.todo('handles DST fall-back transition correctly (TZ-dependent — pin TZ before asserting)');
});
