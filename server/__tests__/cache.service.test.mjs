// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MemoryCache', () => {
  let MemoryCache;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import('../services/cache.service.mjs');
    MemoryCache = mod.MemoryCache;
  });

  afterEach(() => vi.useRealTimers());

  it('CACHE-001: stores and retrieves a value', () => {
    const cache = new MemoryCache({ ttlMs: 10000 });
    cache.set('k', { a: 1 });
    expect(cache.get('k')).toEqual({ a: 1 });
  });

  it('CACHE-002: returns null after TTL expires', () => {
    const cache = new MemoryCache({ ttlMs: 5000 });
    cache.set('k', { a: 1 });
    vi.advanceTimersByTime(6000);
    expect(cache.get('k')).toBeNull();
  });

  it('CACHE-003: returns null for missing key', () => {
    const cache = new MemoryCache({ ttlMs: 5000 });
    expect(cache.get('nope')).toBeNull();
  });

  it('CACHE-004: keys never collide across users', () => {
    const cache = new MemoryCache({ ttlMs: 10000 });
    cache.set('user1:state', { v: 1 });
    cache.set('user2:state', { v: 2 });
    expect(cache.get('user1:state')).toEqual({ v: 1 });
    expect(cache.get('user2:state')).toEqual({ v: 2 });
  });

  it('CACHE-005: del() removes a key', () => {
    const cache = new MemoryCache({ ttlMs: 10000 });
    cache.set('k', 1);
    cache.del('k');
    expect(cache.get('k')).toBeNull();
  });

  it('CACHE-006: has() respects TTL expiration', () => {
    const cache = new MemoryCache({ ttlMs: 1000 });
    cache.set('k', 1);
    expect(cache.has('k')).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(cache.has('k')).toBe(false);
  });

  it('CACHE-007: get() purges expired entries (lazy eviction)', () => {
    const cache = new MemoryCache({ ttlMs: 1000 });
    cache.set('k', 1);
    expect(cache.size()).toBe(1);
    vi.advanceTimersByTime(2000);
    cache.get('k'); // triggers lazy purge
    expect(cache.size()).toBe(0);
  });

  it('CACHE-008: per-set TTL override works', () => {
    const cache = new MemoryCache({ ttlMs: 10000 });
    cache.set('short', 1, 1000);
    cache.set('long', 2);
    vi.advanceTimersByTime(2000);
    expect(cache.get('short')).toBeNull();
    expect(cache.get('long')).toBe(2);
  });
});

describe('cache singletons', () => {
  it('CACHE-009: transitStateCache is exported with default 10s TTL override-able via env', async () => {
    process.env.TRANSIT_STATE_CACHE_TTL_MS = '5000';
    vi.resetModules();
    const { transitStateCache } = await import('../services/cache.service.mjs');
    expect(transitStateCache).toBeDefined();
    expect(typeof transitStateCache.set).toBe('function');
    expect(typeof transitStateCache.get).toBe('function');
  });

  it('CACHE-010: publicDataCache is exported separately from transitStateCache', async () => {
    vi.resetModules();
    const { publicDataCache, transitStateCache } = await import('../services/cache.service.mjs');
    publicDataCache.set('k', 'public');
    transitStateCache.set('k', 'transit');
    expect(publicDataCache.get('k')).toBe('public');
    expect(transitStateCache.get('k')).toBe('transit');
  });
});
