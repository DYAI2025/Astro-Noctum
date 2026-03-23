import { describe, it, expect, vi } from 'vitest';
import { postWithRetry } from '../services/postWithRetry';

describe('postWithRetry', () => {
  it('retries on 500 error and succeeds on third attempt', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) return { ok: false, status: 500 };
      return { ok: true, status: 200 };
    });

    const result = await postWithRetry(
      '/api/contribute',
      { method: 'POST' },
      2,
      mockFetch as unknown as typeof fetch,
    );

    expect(callCount).toBe(3);
    expect(result?.ok).toBe(true);
  }, 15000);

  it('does not retry on 400 client error', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return { ok: false, status: 400 };
    });

    const result = await postWithRetry(
      '/api/contribute',
      { method: 'POST' },
      2,
      mockFetch as unknown as typeof fetch,
    );

    expect(callCount).toBe(1);
    expect(result?.status).toBe(400);
  });

  it('retries on network error and succeeds on third attempt', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) throw new Error('Network error');
      return { ok: true, status: 200 };
    });

    const result = await postWithRetry(
      '/api/contribute',
      { method: 'POST' },
      2,
      mockFetch as unknown as typeof fetch,
    );

    expect(callCount).toBe(3);
    expect(result?.ok).toBe(true);
  }, 15000);

  it('returns null after exhausting all retries on network error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await postWithRetry(
      '/api/contribute',
      { method: 'POST' },
      2,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result).toBeNull();
  }, 15000);

  it('returns the last 5xx response after exhausting retries', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 502 });

    const result = await postWithRetry(
      '/api/contribute',
      { method: 'POST' },
      2,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result).not.toBeNull();
    expect(result?.ok).toBe(false);
    expect(result?.status).toBe(502);
  }, 15000);
});
