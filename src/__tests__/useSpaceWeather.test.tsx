import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockExtendedResponse(kp = 4.2) {
  return {
    current: { kp, kpForecast3h: [], xrayFlux: 1e-6, xrayClass: 'C', protonFlux: 0.5 },
    events: [],
    alerts: [],
    epoch: { sunspotNumber: 120, f107: 145, solarCyclePhase: 'ascending' },
    meta: { fetchedAt: new Date().toISOString(), noaaVersion: 'v1', cacheTtlSeconds: 300 },
  };
}

describe('useSpaceWeather', () => {
  it('parses kp_index from endpoint', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockExtendedResponse(4.2),
    } as Response);

    const { result } = renderHook(() => useSpaceWeather());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.kpIndex).toBe(4.2);
    expect(result.current.error).toBeNull();
    expect(result.current.solarPressure).toBeGreaterThan(0);
    expect(result.current.ringModulation).toBeGreaterThanOrEqual(1.0);
  });

  it('falls back to kp=0 on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useSpaceWeather());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.kpIndex).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
