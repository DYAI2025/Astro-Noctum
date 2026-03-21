import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { useDashboardTour } from '../hooks/useDashboardTour';

function setupMock(tourCompleted: boolean) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({ data: { tour_completed: tourCompleted }, error: null }),
      }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  });
}

describe('useDashboardTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock(false);
  });

  it('starts at step 0 for new users', async () => {
    const { result } = renderHook(() => useDashboardTour('user-123'));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe(0);
  });

  it('advances step on next()', async () => {
    const { result } = renderHook(() => useDashboardTour('user-123'));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    act(() => result.current.next());
    expect(result.current.tourStep).toBe(1);
  });

  it('advances through all steps to done', async () => {
    const { result } = renderHook(() => useDashboardTour('user-123'));
    await act(() => new Promise((r) => setTimeout(r, 50)));

    act(() => result.current.next()); // 0 → 1
    act(() => result.current.next()); // 1 → 2
    act(() => result.current.next()); // 2 → 3
    act(() => result.current.next()); // 3 → done

    expect(result.current.tourStep).toBe('done');
  });

  it('returns done for completed users', async () => {
    setupMock(true);

    const { result } = renderHook(() => useDashboardTour('user-123'));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe('done');
  });

  it('skip() jumps straight to done', async () => {
    const { result } = renderHook(() => useDashboardTour('user-123'));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe(0);

    act(() => result.current.skip());
    expect(result.current.tourStep).toBe('done');
  });

  it('returns done while loading to avoid flash', () => {
    const { result } = renderHook(() => useDashboardTour('user-123'));
    // Before async resolves, tourStep should be 'done' (not null)
    expect(result.current.tourStep).toBe('done');
    expect(result.current.isLoading).toBe(true);
  });

  it('returns done immediately when userId is undefined', () => {
    const { result } = renderHook(() => useDashboardTour(undefined));
    expect(result.current.tourStep).toBe('done');
    expect(result.current.isLoading).toBe(true);
  });
});
