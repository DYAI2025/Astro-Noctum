import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock authedFetch to avoid importing supabase (requires VITE_SUPABASE_* env vars).
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
  events: [],
  resolution: 64,
};

/**
 * TASK-5.1 — Polling cadence targets per
 * docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md §Phase 5 / Task 5.1.
 *
 * Visible tab = 15s, hidden tab = 60s. These tests pin the constants so a
 * future contributor cannot silently regress to the old 800ms hammering.
 */
describe('useSignaturSignal — visibility-aware polling cadence (TASK-5.1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('USS-POLL-001: ACTIVE_POLL_INTERVAL_MS is exactly 15s (Plan §5.1)', () => {
    expect(ACTIVE_POLL_INTERVAL_MS).toBe(15_000);
  });

  it('USS-POLL-002: HIDDEN_POLL_INTERVAL_MS is exactly 60s (Plan §5.1)', () => {
    expect(HIDDEN_POLL_INTERVAL_MS).toBe(60_000);
  });

  it('USS-POLL-003: visible tab → polls roughly every 15s (initial + 3 ticks ≈ 4 in 45s)', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    renderHook(() => useSignaturSignal('user-poll-001'));

    // Flush initial mount fetch.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // 45s window → 3 additional ticks at the 15s cadence.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it('USS-POLL-004: hidden tab → polls every 60s, not 15s (3 minutes ≈ 4 calls)', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    renderHook(() => useSignaturSignal('user-poll-002'));

    // Flush initial mount fetch.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // 3 minute window → 3 additional ticks at the 60s cadence (not 12 at 15s).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(180_000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it('USS-POLL-005: visibility → visible triggers immediate refresh', async () => {
    let visibilityState: DocumentVisibilityState = 'hidden';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    renderHook(() => useSignaturSignal('user-poll-003'));

    // Initial mount fetch only — hidden cadence is 60s away.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Flip to visible: must fire an immediate refresh, not wait for the next tick.
    visibilityState = 'visible';
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
