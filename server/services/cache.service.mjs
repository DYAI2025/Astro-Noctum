/**
 * In-memory TTL cache.
 *
 * Lazy eviction (purges on read), no background timers — keeps the
 * server's process tree clean and avoids holding refs to stale data
 * across module reloads. Suitable for short-lived caches (transit
 * state, space weather) where memory bound is naturally limited by
 * key cardinality (≤ N users) and TTL (seconds).
 *
 * Not suitable as a long-term cache — no LRU, no max size. If you
 * need bounded memory, wrap with a size limit on the call site.
 */
export class MemoryCache {
  #store = new Map();
  #defaultTtlMs;

  constructor({ ttlMs = 10000 } = {}) {
    this.#defaultTtlMs = ttlMs;
  }

  set(key, value, ttlMs) {
    const ttl = typeof ttlMs === 'number' ? ttlMs : this.#defaultTtlMs;
    this.#store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  get(key) {
    const entry = this.#store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.#store.delete(key); // lazy eviction
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  del(key) {
    this.#store.delete(key);
  }

  size() {
    return this.#store.size;
  }

  clear() {
    this.#store.clear();
  }
}

// ── Shared singletons ────────────────────────────────────────────────
// Per-process caches so all routes share the same TTL bucket.
// TTLs read at module-load time; tests `vi.resetModules()` to re-read.

export const transitStateCache = new MemoryCache({
  ttlMs: parseInt(process.env.TRANSIT_STATE_CACHE_TTL_MS ?? '10000', 10),
});

export const publicDataCache = new MemoryCache({
  ttlMs: parseInt(process.env.PUBLIC_DATA_CACHE_TTL_MS ?? '300000', 10),
});
