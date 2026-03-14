import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSpaceWeather', () => {
  it('parses kp_index from endpoint', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ kp_index: 4.2, fetched_at: new Date().toISOString() }),
    } as Response);

    const { result } = renderHook(() => useSpaceWeather());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.kpIndex).toBe(4.2);
    expect(result.current.error).toBeNull();
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
