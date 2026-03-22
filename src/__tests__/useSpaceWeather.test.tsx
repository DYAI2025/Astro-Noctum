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

  // ── #128: Solar Pressure Score → Ring Modulation ×1.5 ──────────────

  it('G5 extreme storm → ringModulation approaches 1.5 cap', async () => {
    // Kp 9, X-class flare (1e-4), high proton flux → max solar pressure
    const stormPayload = {
      current: { kp: 9, kpForecast3h: [], xrayFlux: 1e-4, xrayClass: 'X', protonFlux: 100 },
      events: [
        {
          schema: 'sp.contribution.v1',
          event_id: 'cme:extreme',
          type: 'cme_arrival',
          severity: 'G5',
          signature_weight: 0.5,
          started_at: new Date(Date.now() - 3600_000).toISOString(),
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
        },
      ],
      alerts: [],
      epoch: { sunspotNumber: 250, f107: 220, solarCyclePhase: 'maximum' },
      meta: { fetchedAt: new Date().toISOString(), noaaVersion: 'v2', cacheTtlSeconds: 300 },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => stormPayload,
    } as Response);

    const { result } = renderHook(() => useSpaceWeather());
    await waitFor(() => { expect(result.current.loading).toBe(false); });

    expect(result.current.kpIndex).toBe(9);
    expect(result.current.gScale).toBe('G5');
    expect(result.current.triggerEffect).toBe(true);
    expect(result.current.intensityBoost).toBe(0.50);
    // ringModulation must be well above 1.0 and at most 1.5
    // Formula: 1 + solarPressure*0.2 + eventWeight*0.3 → max ~1.35 at full input
    expect(result.current.ringModulation).toBeGreaterThan(1.2);
    expect(result.current.ringModulation).toBeLessThanOrEqual(1.5);
    expect(result.current.solarPressure).toBeGreaterThan(0.85);
  });

  it('calm conditions (all zeros) → ringModulation is 1.0, no effect trigger', async () => {
    const calmPayload = {
      current: { kp: 0, kpForecast3h: [], xrayFlux: 0, xrayClass: 'A', protonFlux: 0 },
      events: [],
      alerts: [],
      epoch: { sunspotNumber: 0, f107: 80, solarCyclePhase: 'minimum' },
      meta: { fetchedAt: new Date().toISOString(), noaaVersion: 'v1' as const, cacheTtlSeconds: 300 },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => calmPayload,
    } as Response);

    const { result } = renderHook(() => useSpaceWeather());
    await waitFor(() => { expect(result.current.loading).toBe(false); });

    expect(result.current.kpIndex).toBe(0);
    expect(result.current.ringModulation).toBe(1.0);
    expect(result.current.triggerEffect).toBe(false);
    expect(result.current.solarPressure).toBe(0);
  });

  it('ringModulation is always in [1.0, 1.5]', async () => {
    // Test several Kp values to ensure bounds hold
    for (const kp of [0, 3, 5, 7, 9]) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockExtendedResponse(kp),
      } as Response);

      const { result, unmount } = renderHook(() => useSpaceWeather());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      expect(result.current.ringModulation).toBeGreaterThanOrEqual(1.0);
      expect(result.current.ringModulation).toBeLessThanOrEqual(1.5);
      unmount();
      vi.restoreAllMocks();
    }
  });
});
