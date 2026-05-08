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
});
