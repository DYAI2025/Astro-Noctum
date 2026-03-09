/**
 * Unit tests for LRU Cache
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  LRUCache,
  createPlanetCacheKey,
  createMoonCacheKey,
  createSunCacheKey,
  createCoordCacheKey,
} from '@/lib/cosmicEngine/cache';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new LRUCache({ enabled: true, maxEntries: 3, ttlMs: 1000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should check key existence', () => {
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('a', 1);
      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
    });

    it('should clear all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should update LRU order on get', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.get('a'); // Access 'a' to make it most recently used
      cache.set('d', 4); // Should evict 'b' (oldest now)

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
    });

    it('should update LRU order on set of existing key', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.set('a', 10); // Update 'a'
      cache.set('d', 4); // Should evict 'b'

      expect(cache.get('a')).toBe(10);
      expect(cache.get('b')).toBeUndefined();
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      cache.set('a', 1);

      vi.advanceTimersByTime(500);
      expect(cache.get('a')).toBe(1); // Not expired yet

      vi.advanceTimersByTime(600);
      expect(cache.get('a')).toBeUndefined(); // Expired
    });

    it('should remove expired entries on has()', () => {
      cache.set('a', 1);

      vi.advanceTimersByTime(1100);
      expect(cache.has('a')).toBe(false);
    });

    it('should prune expired entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      vi.advanceTimersByTime(1100);
      cache.set('c', 3); // Add fresh entry

      const pruned = cache.prune();
      expect(pruned).toBe(2);
      expect(cache.size).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('a', 1);

      cache.get('a'); // hit
      cache.get('a'); // hit
      cache.get('b'); // miss
      cache.get('c'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should reset stats on clear', () => {
      cache.set('a', 1);
      cache.get('a');
      cache.get('b');
      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('disabled cache', () => {
    it('should not store values when disabled', () => {
      const disabled = new LRUCache({ enabled: false, maxEntries: 10, ttlMs: 1000 });

      disabled.set('a', 1);
      expect(disabled.get('a')).toBeUndefined();
      expect(disabled.has('a')).toBe(false);
      expect(disabled.size).toBe(0);
    });

    it('should count all gets as misses when disabled', () => {
      const disabled = new LRUCache({ enabled: false, maxEntries: 10, ttlMs: 1000 });

      disabled.get('a');
      disabled.get('b');

      const stats = disabled.getStats();
      expect(stats.misses).toBe(2);
      expect(stats.hits).toBe(0);
    });
  });
});

describe('cache key generators', () => {
  describe('createPlanetCacheKey', () => {
    it('should create consistent keys for same input', () => {
      const key1 = createPlanetCacheKey('mars', 2459580.5);
      const key2 = createPlanetCacheKey('mars', 2459580.5);
      expect(key1).toBe(key2);
    });

    it('should create different keys for different planets', () => {
      const key1 = createPlanetCacheKey('mars', 2459580.5);
      const key2 = createPlanetCacheKey('venus', 2459580.5);
      expect(key1).not.toBe(key2);
    });

    it('should round JD to reduce cache fragmentation', () => {
      // With precision=6, values within 0.000001 should round to same key
      const key1 = createPlanetCacheKey('mars', 2459580.5000001);
      const key2 = createPlanetCacheKey('mars', 2459580.5000002);
      expect(key1).toBe(key2);
    });
  });

  describe('createMoonCacheKey', () => {
    it('should create consistent keys', () => {
      const key1 = createMoonCacheKey(2459580.5);
      const key2 = createMoonCacheKey(2459580.5);
      expect(key1).toBe(key2);
    });

    it('should include moon prefix', () => {
      const key = createMoonCacheKey(2459580.5);
      expect(key.startsWith('moon:')).toBe(true);
    });
  });

  describe('createSunCacheKey', () => {
    it('should create consistent keys', () => {
      const key1 = createSunCacheKey(2459580.5);
      const key2 = createSunCacheKey(2459580.5);
      expect(key1).toBe(key2);
    });

    it('should include sun prefix', () => {
      const key = createSunCacheKey(2459580.5);
      expect(key.startsWith('sun:')).toBe(true);
    });
  });

  describe('createCoordCacheKey', () => {
    it('should create different keys for different transform types', () => {
      const key1 = createCoordCacheKey('eclToEq', 1.5, 0.5, 2459580.5);
      const key2 = createCoordCacheKey('eqToHz', 1.5, 0.5, 2459580.5);
      expect(key1).not.toBe(key2);
    });

    it('should include observer coords for eqToHz', () => {
      const key = createCoordCacheKey('eqToHz', 1.5, 0.5, 2459580.5, 52.5, 13.4);
      expect(key).toContain('52.5');
      expect(key).toContain('13.4');
    });
  });
});
