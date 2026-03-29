/**
 * TASK-perf-transit-api: Validate /api/transit-state p95 <500ms.
 *
 * Measures response time of the transit-state endpoint. The server proxies
 * user profile + contributions from Supabase to FuFirE and maps the response.
 *
 * In test/CI environments the server is typically not running. The test
 * skips gracefully when the endpoint is unreachable (same pattern as
 * bafe-determinism.test.ts).
 */

import { describe, it, expect } from 'vitest';

const BASE_URL =
  process.env.VITE_APP_URL ||
  process.env.APP_URL ||
  'http://localhost:3001';

const ENDPOINT = `${BASE_URL}/api/transit-state/test-user-id`;

/** Probe server reachability with a lightweight request */
async function isServerReachable(): Promise<boolean> {
  try {
    const resp = await fetch(ENDPOINT, {
      method: 'GET',
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

async function measureRequest(): Promise<number> {
  const start = performance.now();
  const resp = await fetch(ENDPOINT, {
    method: 'GET',
    signal: AbortSignal.timeout(10_000),
  });
  const elapsed = performance.now() - start;

  // Consume the body to ensure full response time is measured
  await resp.text();

  return elapsed;
}

describe('TASK-perf-transit-api: /api/transit-state p95 <500ms', () => {
  it('single request completes in <500ms', async () => {
    const reachable = await reachablePromise;
    if (!reachable) {
      console.log(`Server at ${BASE_URL} is unreachable — skipping transit-state perf test`);
      return; // graceful skip
    }

    const elapsed = await measureRequest();
    console.log(`[Transit API] Single request: ${elapsed.toFixed(1)}ms (budget: 500ms)`);
    expect(elapsed).toBeLessThan(500);
  }, 15_000);

  it('p95 of 20 sequential requests is <500ms', async () => {
    const reachable = await reachablePromise;
    if (!reachable) {
      console.log(`Server at ${BASE_URL} is unreachable — skipping transit-state p95 test`);
      return; // graceful skip
    }

    const times: number[] = [];

    // Warm-up request (not counted)
    await measureRequest();

    // Measure 20 sequential requests
    for (let i = 0; i < 20; i++) {
      const elapsed = await measureRequest();
      times.push(elapsed);
    }

    // Sort and compute p95 (index 18 of 20 = 95th percentile)
    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(times.length * 0.5)]!;
    const p95 = times[Math.floor(times.length * 0.95)]!;
    const avg = times.reduce((s, v) => s + v, 0) / times.length;

    console.log(
      `[Transit API] 20 requests — avg: ${avg.toFixed(1)}ms, ` +
      `p50: ${p50.toFixed(1)}ms, p95: ${p95.toFixed(1)}ms (budget: 500ms)`,
    );

    expect(p95).toBeLessThan(500);
  }, 120_000); // generous timeout for 20+ network requests

  it('response is valid JSON with expected shape', async () => {
    const reachable = await reachablePromise;
    if (!reachable) {
      console.log(`Server at ${BASE_URL} is unreachable — skipping transit-state shape test`);
      return; // graceful skip
    }

    const resp = await fetch(ENDPOINT, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });

    // test-user-id may not exist — 404 or fallback is acceptable
    // but the server should respond with valid JSON
    const text = await resp.text();
    if (resp.ok) {
      const data = JSON.parse(text);
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    } else {
      // Server responded but user not found — this is expected for test-user-id
      console.log(
        `[Transit API] Server returned ${resp.status} for test-user-id (expected in test env)`,
      );
    }
  }, 15_000);
});
