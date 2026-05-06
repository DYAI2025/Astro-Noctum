import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock authedFetch to avoid importing supabase (requires VITE_SUPABASE_* env vars)
vi.mock('@/src/lib/authedFetch', () => ({
  authedFetch: vi.fn((...args: Parameters<typeof fetch>) => fetch(...args)),
}));

import {
  ACTIVE_POLL_INTERVAL_MS,
  HIDDEN_POLL_INTERVAL_MS,
  useSignaturSignal,
} from '@/src/hooks/useSignaturSignal';

const validTransitPayload = {
  ring: { sectors: Array(12).fill(0.6) },
  soulprint: { sectors: Array(12).fill(0.4) },
  transit_contribution: { transit_intensity: 0.75 },
  delta: { vs_30day_avg: { avg_sectors: Array(12).fill(0.35) } },
  events: [
    {
      id: 'evt-1',
      type: 'resonance_jump',
      sector: 2,
      delta: 0.21,
      trigger_planet: 'Moon',
      trigger_symbol: '☽',
      sector_domain: 'Emotion',
    },
  ],
  resolution: 64,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSignaturSignal', () => {
  it('maps and exposes parsed transit state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    const { result } = renderHook(() => useSignaturSignal('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.signalData?.targetSignals).toHaveLength(12);
    expect(result.current.events).toHaveLength(1);
    expect(result.current.resolution).toBe(64);
  });

  it('returns error state on invalid response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ bad: 'payload' }),
    } as Response);

    const { result } = renderHook(() => useSignaturSignal('user-2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('POLL-001: ACTIVE_POLL_INTERVAL_MS is at least 5 seconds (no 800ms hammering)', () => {
    expect(ACTIVE_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(5_000);
  });

  it('POLL-002: HIDDEN_POLL_INTERVAL_MS is at least 30 seconds', () => {
    expect(HIDDEN_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(30_000);
  });

  it('POLL-003: schedules ACTIVE_POLL_INTERVAL_MS between successful polls when visible', async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true, get: () => 'visible',
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    renderHook(() => useSignaturSignal('user-3'));

    // Flush the initial mount fetch
    // Flush mount-time microtasks (initial fetch resolves) WITHOUT advancing timers
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance just shy of the poll interval — must NOT have triggered a 2nd call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ACTIVE_POLL_INTERVAL_MS - 200);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Cross the boundary → next poll fires
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('POLL-004: uses HIDDEN_POLL_INTERVAL_MS when document is hidden', async () => {
    vi.useFakeTimers();
    let visibilityState: DocumentVisibilityState = 'hidden';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true, get: () => visibilityState,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    renderHook(() => useSignaturSignal('user-4'));

    // Flush mount-time microtasks (initial fetch resolves) WITHOUT advancing timers
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Active interval has passed but tab is hidden → must NOT have re-polled
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ACTIVE_POLL_INTERVAL_MS + 1_000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Hidden interval crossed → re-poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(HIDDEN_POLL_INTERVAL_MS);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    visibilityState = 'visible';
    vi.useRealTimers();
  });

  it('POLL-005: triggers immediate refresh when tab becomes visible', async () => {
    vi.useFakeTimers();
    let visibilityState: DocumentVisibilityState = 'hidden';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true, get: () => visibilityState,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    renderHook(() => useSignaturSignal('user-5'));
    // Flush mount-time microtasks (initial fetch resolves) WITHOUT advancing timers
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Become visible — should trigger an immediate fetch
    visibilityState = 'visible';
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
