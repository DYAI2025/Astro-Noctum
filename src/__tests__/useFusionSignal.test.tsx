import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFusionSignal } from '@/src/hooks/useFusionSignal';

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

describe('useFusionSignal', () => {
  it('maps and exposes parsed transit state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => validTransitPayload,
    } as Response);

    const { result } = renderHook(() => useFusionSignal('user-1'));

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

    const { result } = renderHook(() => useFusionSignal('user-2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
