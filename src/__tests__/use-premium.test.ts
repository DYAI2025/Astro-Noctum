import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockSubscribeCb = vi.fn();
const mockSubscribe = vi.fn();
const mockOn = vi.fn();
const mockRemoveChannel = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();
const mockChannel = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...a: unknown[]) => mockFrom(...a),
    channel: (...a: unknown[]) => mockChannel(...a),
    removeChannel: (...a: unknown[]) => mockRemoveChannel(...a),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

function setupMocks(tier: 'free' | 'premium' = 'free', subscribeStatus = 'SUBSCRIBED') {
  mockSingle.mockResolvedValue({ data: { tier }, error: null });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });

  mockSubscribe.mockImplementation((cb: (s: string) => void) => {
    mockSubscribeCb.mockImplementation(cb);
    cb(subscribeStatus);
    return {};
  });
  mockOn.mockReturnValue({ subscribe: mockSubscribe });
  mockChannel.mockReturnValue({ on: mockOn });
}

describe('usePremium', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches initial tier on mount', async () => {
    setupMocks('premium');
    const { usePremium } = await import('../hooks/usePremium');
    const { result } = renderHook(() => usePremium());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isPremium).toBe(true);
  });

  it('starts polling when Realtime fails with CHANNEL_ERROR', async () => {
    setupMocks('free', 'CHANNEL_ERROR');
    const { usePremium } = await import('../hooks/usePremium');
    renderHook(() => usePremium());
    await act(async () => { await Promise.resolve(); });

    const callsAfterMount = mockSingle.mock.calls.length;

    // Advance 30s — poll should fire once
    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    expect(mockSingle.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it('stops polling when Realtime reconnects (SUBSCRIBED)', async () => {
    setupMocks('free', 'CHANNEL_ERROR');
    const { usePremium } = await import('../hooks/usePremium');
    renderHook(() => usePremium());
    await act(async () => { await Promise.resolve(); });

    // Polling started — advance 30s to confirm
    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });
    const callsWithPolling = mockSingle.mock.calls.length;

    // Realtime reconnects
    act(() => { mockSubscribeCb('SUBSCRIBED'); });

    // Advance another 30s — no more polls should fire
    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });
    expect(mockSingle.mock.calls.length).toBe(callsWithPolling);
  });

  it('falls back to non-premium when fetch throws (e.g. Failed to fetch)', async () => {
    mockSingle.mockRejectedValue(new TypeError('Failed to fetch'));
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSubscribe.mockImplementation((cb: (s: string) => void) => {
      cb('SUBSCRIBED');
      return {};
    });
    mockOn.mockReturnValue({ subscribe: mockSubscribe });
    mockChannel.mockReturnValue({ on: mockOn });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { usePremium } = await import('../hooks/usePremium');
    const { result } = renderHook(() => usePremium());

    await act(async () => { await Promise.resolve(); });

    expect(result.current.isPremium).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
