/**
 * Tests for the useFirstRunDaily date-cache boundary behaviour.
 *
 * The critical invariant: the cache key must reflect the LOCAL calendar date,
 * not the UTC date. A user in UTC+1 at 00:05 local time must see the new
 * day's content, even though the UTC date is still the previous day.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';

// Mock Supabase so the hook module can be imported without env vars
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), update: () => ({ eq: () => Promise.resolve({}) }) }),
  },
}));

// Mock experience service (not under test)
vi.mock('../services/experience', () => ({
  fetchDailyExperience: vi.fn(),
}));

import { todayKey } from '../hooks/useFirstRunDaily';

describe('todayKey — local-date cache key', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a YYYY-MM-DD string', () => {
    const key = todayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches getFullYear/getMonth/getDate (local), not toISOString (UTC)', () => {
    const anyTime = new Date('2026-12-31T23:45:00Z');
    vi.setSystemTime(anyTime);

    const key = todayKey();
    const now = new Date(anyTime);
    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    expect(key).toBe(localDate);
  });

  it('produces a different key on successive calendar days', () => {
    vi.setSystemTime(new Date('2026-03-15T12:00:00'));
    const keyDay1 = todayKey();

    vi.setSystemTime(new Date('2026-03-16T00:01:00'));
    const keyDay2 = todayKey();

    expect(keyDay1).not.toBe(keyDay2);
    expect(keyDay2 > keyDay1).toBe(true);
  });

  it('returns a stable key for two calls within the same local day', () => {
    vi.setSystemTime(new Date('2026-04-03T08:00:00'));
    const key1 = todayKey();

    vi.setSystemTime(new Date('2026-04-03T22:59:59'));
    const key2 = todayKey();

    expect(key1).toBe(key2);
  });
});
