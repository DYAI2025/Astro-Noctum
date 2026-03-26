import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff } from '../lib/retryWithBackoff';

describe('retryWithBackoff', () => {
  it('returns on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');
    const result = await retryWithBackoff(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after all retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('permanent'));
    await expect(retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10 }))
      .rejects.toThrow('permanent');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('calls onRetry callback', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');
    const onRetry = vi.fn();
    await retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10, onRetry });
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('does NOT retry when shouldRetry returns false', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('no-retry'))
      .mockResolvedValueOnce('ok');
    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        baseDelay: 10,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('no-retry');
    expect(fn).toHaveBeenCalledTimes(1); // no retries
  });

  it('retries only when shouldRetry returns true', async () => {
    class RetriableError extends Error { retriable = true; }
    const fn = vi.fn()
      .mockRejectedValueOnce(new RetriableError('transient'))
      .mockResolvedValueOnce('ok');
    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelay: 10,
      shouldRetry: (err) => err instanceof RetriableError,
    });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
