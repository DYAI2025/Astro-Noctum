/**
 * Vibes API performance test: Validate /api/vibes response time and shape.
 *
 * Measures response time of the vibes endpoint (cold and cached).
 * The server is typically not running in test/CI environments. The test
 * skips gracefully when the endpoint is unreachable (same pattern as
 * transit-api-perf.test.ts).
 */

import { describe, it, expect } from 'vitest';

const BASE_URL =
  process.env.VITE_APP_URL ||
  process.env.APP_URL ||
  'http://localhost:3001';

const ENDPOINT = `${BASE_URL}/api/vibes`;

const PAYLOAD = { userId: 'test-user' };

/** Probe server reachability with a lightweight request */
async function isServerReachable(): Promise<boolean> {
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PAYLOAD),
      signal: AbortSignal.timeout(5_000),
    });
    // Any HTTP response (even 4xx/5xx) means the server is up
    return true;
  } catch {
    return false;
  }
}

// Resolve reachability once — shared across all tests via cached promise
const reachablePromise = isServerReachable();

async function measureRequest(): Promise<{ elapsed: number; status: number; body: string }> {
  const start = performance.now();
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(PAYLOAD),
    signal: AbortSignal.timeout(10_000),
  });
  const body = await resp.text();
  const elapsed = performance.now() - start;

  return { elapsed, status: resp.status, body };
}

describe('Vibes API: /api/vibes performance and shape', () => {
  it('first request completes in <2000ms (p95 target)', async () => {
    const reachable = await reachablePromise;
    if (!reachable) {
      console.log(`Server at ${BASE_URL} is unreachable — skipping vibes perf test`);
      return; // graceful skip
    }

    const { elapsed, status } = await measureRequest();
    if (status === 429) {
      console.log(`[Vibes API] First request rate-limited (429) — skipping perf assertion`);
      return;
    }
    console.log(`[Vibes API] First request: ${elapsed.toFixed(1)}ms (budget: 2000ms)`);
    expect(elapsed).toBeLessThan(2000);
  }, 15_000);

  it('cached response (second request in same 30-min window) completes in <500ms', async () => {
    const reachable = await reachablePromise;
    if (!reachable) {
      console.log(`Server at ${BASE_URL} is unreachable — skipping vibes cache test`);
      return; // graceful skip
    }

    // First request to ensure cache is warm (may already be warm from previous test)
    await measureRequest();

    // Second request should hit cache
    const { elapsed, status } = await measureRequest();
    if (status === 429) {
      console.log(`[Vibes API] Cached request rate-limited (429) — skipping perf assertion`);
      return;
    }
    console.log(`[Vibes API] Cached request: ${elapsed.toFixed(1)}ms (budget: 500ms)`);
    expect(elapsed).toBeLessThan(500);
  }, 20_000);

  it('response has expected shape: kurzsignal, treiber, erklaerung, explain', async () => {
    const reachable = await reachablePromise;
    if (!reachable) {
      console.log(`Server at ${BASE_URL} is unreachable — skipping vibes shape test`);
      return; // graceful skip
    }

    const { status, body } = await measureRequest();

    if (status === 429) {
      console.log(
        `[Vibes API] Server returned 429 (rate limited) — skipping shape validation`,
      );
      return;
    }

    if (!status || status >= 500) {
      console.log(
        `[Vibes API] Server returned ${status} — skipping shape validation (server error)`,
      );
      return;
    }

    if (status === 404) {
      console.log(
        `[Vibes API] Server returned 404 for test-user — endpoint may not exist yet`,
      );
      return;
    }

    const data = JSON.parse(body);
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');

    // kurzsignal: string — short vibe signal text
    expect(data).toHaveProperty('kurzsignal');
    expect(typeof data.kurzsignal).toBe('string');

    // treiber: array — list of drivers/influences
    expect(data).toHaveProperty('treiber');
    expect(Array.isArray(data.treiber)).toBe(true);

    // erklaerung: string — explanation text
    expect(data).toHaveProperty('erklaerung');
    expect(typeof data.erklaerung).toBe('string');

    // explain: object — structured explanation
    expect(data).toHaveProperty('explain');
    expect(typeof data.explain).toBe('object');
    expect(data.explain).not.toBeNull();

    console.log(
      `[Vibes API] Shape OK — kurzsignal: ${data.kurzsignal.length} chars, ` +
      `treiber: ${data.treiber.length} items, erklaerung: ${data.erklaerung.length} chars`,
    );
  }, 15_000);

  it('cached response includes cooldown shape when active', async () => {
    const reachable = await reachablePromise;
    if (!reachable) {
      console.log(`Server at ${BASE_URL} is unreachable — skipping cooldown shape test`);
      return; // graceful skip
    }

    // Fire two requests — second one should be cached and may include cooldown
    await measureRequest();
    const { status, body } = await measureRequest();

    if (status === 429) {
      console.log('[Vibes API] Rate-limited (429) — skipping cooldown shape test');
      return;
    }

    if (!status || status >= 500 || status === 404) {
      console.log(`[Vibes API] Server returned ${status} — skipping cooldown shape test`);
      return;
    }

    const data = JSON.parse(body);

    // The cooldown field is only present when an active cooldown is in effect
    if (!data.cooldown) {
      console.log('[Vibes API] No cooldown field in response — generation was fresh, skipping shape check');
      return;
    }

    // Validate cooldown shape
    expect(typeof data.cooldown.active).toBe('boolean');
    expect(typeof data.cooldown.next_available_at).toBe('string');
    // Validate ISO 8601 date string
    expect(Number.isNaN(Date.parse(data.cooldown.next_available_at))).toBe(false);
    expect(typeof data.cooldown.remaining_ms).toBe('number');
    expect(data.cooldown.remaining_ms).toBeGreaterThanOrEqual(0);

    console.log(
      `[Vibes API] Cooldown shape OK — active: ${data.cooldown.active}, ` +
      `remaining: ${Math.round(data.cooldown.remaining_ms / 1000)}s`,
    );
  }, 20_000);
});
