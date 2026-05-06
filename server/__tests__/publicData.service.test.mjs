// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('publicData service — fetchWithStaleFallback', () => {
  let fetchWithStaleFallback;
  let originalFetch;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    originalFetch = global.fetch;
    // Fresh cache state per test by re-importing
    const mod = await import('../services/publicData.service.mjs');
    fetchWithStaleFallback = mod.fetchWithStaleFallback;
    // Clear the shared cache between tests
    mod.publicDataCache.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('PUBLIC-001: fresh fetch populates cache and returns { data, stale: false }', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ kp: 3 }),
    });

    const result = await fetchWithStaleFallback({
      cacheKey: 'k1',
      url: 'https://example.com/x',
      ttlMs: 60_000,
    });

    expect(result.data).toEqual({ kp: 3 });
    expect(result.stale).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('PUBLIC-002: second call within TTL is served from cache (no upstream fetch)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ kp: 3 }),
    });

    await fetchWithStaleFallback({ cacheKey: 'k1', url: 'https://example.com/x', ttlMs: 60_000 });
    await fetchWithStaleFallback({ cacheKey: 'k1', url: 'https://example.com/x', ttlMs: 60_000 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('PUBLIC-003: after TTL expires, refetches upstream', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return { ok: true, json: async () => ({ kp: callCount }) };
    });

    const r1 = await fetchWithStaleFallback({ cacheKey: 'k1', url: 'https://example.com/x', ttlMs: 5000 });
    expect(r1.data.kp).toBe(1);

    vi.advanceTimersByTime(6000);

    const r2 = await fetchWithStaleFallback({ cacheKey: 'k1', url: 'https://example.com/x', ttlMs: 5000 });
    expect(r2.data.kp).toBe(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('PUBLIC-004: stale-if-error — upstream failure returns last good with stale: true', async () => {
    let firstCall = true;
    global.fetch = vi.fn().mockImplementation(async () => {
      if (firstCall) {
        firstCall = false;
        return { ok: true, json: async () => ({ kp: 5 }) };
      }
      throw new Error('upstream down');
    });

    // First call seeds the last-good store
    const r1 = await fetchWithStaleFallback({ cacheKey: 'k1', url: 'https://example.com/x', ttlMs: 1000 });
    expect(r1.stale).toBe(false);
    expect(r1.data.kp).toBe(5);

    // Cache TTL expires; next fetch fails; we serve last-good with stale: true
    vi.advanceTimersByTime(2000);
    const r2 = await fetchWithStaleFallback({ cacheKey: 'k1', url: 'https://example.com/x', ttlMs: 1000 });
    expect(r2.stale).toBe(true);
    expect(r2.data.kp).toBe(5);
  });

  it('PUBLIC-005: throws UPSTREAM_UNAVAILABLE when no last-good exists and upstream fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('no internet'));

    await expect(
      fetchWithStaleFallback({ cacheKey: 'never-seen', url: 'https://example.com/x', ttlMs: 1000 })
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('PUBLIC-006: respects per-call timeout — slow upstream is treated as failure', async () => {
    global.fetch = vi.fn().mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts?.signal?.aborted) {
          reject(new Error('aborted'));
          return;
        }
        opts?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });

    const promise = fetchWithStaleFallback({
      cacheKey: 'slow', url: 'https://example.com/x', ttlMs: 1000, timeoutMs: 100,
    });
    // Attach the catch BEFORE advancing timers so the rejection has a
    // handler when AbortController fires — keeps Vitest's unhandled-
    // rejection guard quiet.
    const assertion = expect(promise).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });

    await vi.advanceTimersByTimeAsync(200);
    await assertion;
  });

  it('PUBLIC-007: !ok response (4xx/5xx) is treated as failure, not cached', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(
      fetchWithStaleFallback({ cacheKey: 'fail', url: 'https://example.com/x', ttlMs: 1000 })
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('PUBLIC-008: per-key isolation — different cacheKeys do not share state', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return { ok: true, json: async () => ({ id: callCount }) };
    });

    const a = await fetchWithStaleFallback({ cacheKey: 'a', url: 'https://example.com/x', ttlMs: 60_000 });
    const b = await fetchWithStaleFallback({ cacheKey: 'b', url: 'https://example.com/y', ttlMs: 60_000 });

    expect(a.data.id).toBe(1);
    expect(b.data.id).toBe(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
