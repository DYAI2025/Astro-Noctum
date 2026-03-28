/**
 * BAFE API Determinism Contract Test
 *
 * Verifies that identical birth data always produces identical responses
 * from the BAFE calculation endpoints. This is a critical property for
 * astrology calculations — the same input must yield the same output.
 *
 * BAFE may not be reachable in CI or local dev. The test skips gracefully
 * when the API is unavailable.
 */
import { describe, it, expect } from 'vitest';

const BAFE_BASE_URL =
  process.env.VITE_BAFE_BASE_URL ||
  process.env.BAFE_BASE_URL ||
  'https://bafe.vercel.app';

const BIRTH_DATA = {
  date: '1990-01-15T14:30:00',
  tz: 'Europe/Berlin',
  lat: 52.52,
  lon: 13.405,
  ambiguousTime: 'earlier',
  nonexistentTime: 'error',
};

const ENDPOINTS = ['bazi', 'western', 'fusion', 'wuxing', 'tst'] as const;

// Extra fields required by the bazi endpoint
const BAZI_EXTRA = { standard: 'CIVIL', boundary: 'midnight', strict: true };
// Extra fields required by the fusion endpoint
const FUSION_EXTRA = { bazi_pillars: null };

function buildPayload(endpoint: string) {
  const base = { ...BIRTH_DATA };
  if (endpoint === 'bazi') return { ...base, ...BAZI_EXTRA };
  if (endpoint === 'fusion') return { ...base, ...FUSION_EXTRA };
  return base;
}

async function fetchEndpoint(endpoint: string): Promise<string> {
  const resp = await fetch(`${BAFE_BASE_URL}/calculate/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPayload(endpoint)),
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) {
    throw new Error(`BAFE ${endpoint} returned ${resp.status}: ${await resp.text()}`);
  }

  return resp.text();
}

/** Probe BAFE reachability with a lightweight request */
async function isBafeReachable(): Promise<boolean> {
  try {
    const probe = await fetch(`${BAFE_BASE_URL}/calculate/bazi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload('bazi')),
      signal: AbortSignal.timeout(10_000),
    });
    return probe.ok;
  } catch {
    return false;
  }
}

// Resolve reachability once — shared across all tests via cached promise
const reachablePromise = isBafeReachable();

describe('BAFE API determinism', () => {
  for (const endpoint of ENDPOINTS) {
    it(`/calculate/${endpoint} returns identical JSON for identical input`, async () => {
      const reachable = await reachablePromise;
      if (!reachable) {
        console.log(`BAFE at ${BAFE_BASE_URL} is unreachable — skipping ${endpoint} determinism test`);
        return; // graceful skip
      }

      const [first, second] = await Promise.all([
        fetchEndpoint(endpoint),
        fetchEndpoint(endpoint),
      ]);

      // Byte-identical comparison — same input must produce same output
      expect(first).toBe(second);

      // Sanity: the response should be valid JSON
      const parsed = JSON.parse(first);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    }, 30_000); // generous timeout for network calls
  }
});
