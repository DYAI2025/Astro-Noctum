import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { tour_completed: false }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({ then: (cb: (r: { error: null }) => void) => cb({ error: null }) }),
      }),
    }),
  },
}));

describe('First-Time Experience E2E', () => {
  it('tour starts at step 0 for new user', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe(0);
  });

  it('full tour progression: 0 → 1 → done', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));

    act(() => result.current.next()); // 0 → 1
    expect(result.current.tourStep).toBe(1);

    act(() => result.current.next()); // 1 → done
    expect(result.current.tourStep).toBe('done');
  });

  it('skip() jumps directly to done', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));

    act(() => result.current.skip());
    expect(result.current.tourStep).toBe('done');
  });
});
