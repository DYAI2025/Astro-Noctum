import { publicDataCache } from './cache.service.mjs';

export { publicDataCache };

/**
 * Generic public-data fetcher with cache + stale-if-error.
 *
 * Wraps an upstream HTTP GET with three layers of resilience:
 *
 * 1. **Cache** (per `cacheKey` via the shared `publicDataCache` singleton).
 *    Within `ttlMs`, repeat calls return the cached payload — no fetch.
 *
 * 2. **Stale-if-error fallback.** Each successful fetch updates a
 *    last-good store (separate from the TTL cache). If the cache has
 *    expired AND a subsequent fetch fails (network error, non-2xx
 *    response, or timeout), we return the last-good payload with
 *    `stale: true` so the caller can degrade gracefully instead of
 *    erroring out.
 *
 * 3. **Per-call timeout.** Aborts the fetch via AbortController if
 *    the upstream is slow. Default 8s; override via `timeoutMs`.
 *
 * Throws an `Error` with `code: 'UPSTREAM_UNAVAILABLE'` only when
 * upstream fails AND no last-good exists. The first request to a
 * fresh `cacheKey` is the only one that can throw.
 *
 * @param {object} opts
 * @param {string} opts.cacheKey      stable identifier — same key reuses cache + last-good
 * @param {string} opts.url           upstream URL to GET
 * @param {number} opts.ttlMs         cache TTL in ms
 * @param {number} [opts.timeoutMs]   per-call timeout (default 8000)
 * @param {object} [opts.headers]     optional request headers
 * @returns {Promise<{ data: any, stale: boolean }>}
 */
const lastGoodStore = new Map();

export async function fetchWithStaleFallback({ cacheKey, url, ttlMs, timeoutMs = 8000, headers }) {
  const cached = publicDataCache.get(cacheKey);
  if (cached) {
    return { data: cached, stale: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = new Error(`Upstream ${res.status} for ${url}`);
      err.code = 'UPSTREAM_HTTP_ERROR';
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    // Override the singleton's default TTL with the per-call value so
    // different upstreams can have different cache lifetimes.
    publicDataCache.set(cacheKey, data, ttlMs);
    lastGoodStore.set(cacheKey, data);
    return { data, stale: false };
  } catch (err) {
    clearTimeout(timeoutId);
    const lastGood = lastGoodStore.get(cacheKey);
    if (lastGood) {
      return { data: lastGood, stale: true };
    }
    const wrapped = new Error(`Upstream unavailable for ${url}: ${err.message}`);
    wrapped.code = 'UPSTREAM_UNAVAILABLE';
    wrapped.cause = err;
    throw wrapped;
  }
}
