/**
 * LRU Cache for Cosmic Engine
 * Optimized for animation performance with configurable TTL
 */

import type { CacheConfig } from './types';

/** Cache entry with timestamp */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/** Default cache configuration */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  maxEntries: 1000,
  ttlMs: 60000, // 1 minute TTL for animation use
};

/**
 * Generic LRU Cache implementation
 * - O(1) get/set operations using Map's insertion order
 * - Automatic TTL expiration
 * - Size-limited with LRU eviction
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly enabled: boolean;

  // Statistics
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    const fullConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.enabled = fullConfig.enabled;
    this.maxEntries = fullConfig.maxEntries;
    this.ttlMs = fullConfig.ttlMs;
    this.cache = new Map();
  }

  /**
   * Get value from cache
   * Returns undefined if not found, expired, or cache disabled
   */
  get(key: K): V | undefined {
    if (!this.enabled) {
      this.misses++;
      return undefined;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL expiration
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Move to end (most recently used) by reinserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * Evicts oldest entries if over capacity
   */
  set(key: K, value: V): void {
    if (!this.enabled) {
      return;
    }

    // Delete existing to update insertion order
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    if (!this.enabled) {
      return false;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Get current size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Remove all expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        pruned++;
      }
    });

    return pruned;
  }
}

/**
 * Create a cache key for planet calculations
 * Rounds JD to reduce cache misses for similar times
 */
export function createPlanetCacheKey(
  planetId: string,
  jd: number,
  precision: number = 6
): string {
  // Round JD to reduce cache fragmentation
  // precision=6 gives ~0.1 second resolution
  const roundedJd = Math.round(jd * Math.pow(10, precision)) / Math.pow(10, precision);
  return `planet:${planetId}:${roundedJd}`;
}

/**
 * Create a cache key for moon calculations
 */
export function createMoonCacheKey(jd: number, precision: number = 6): string {
  const roundedJd = Math.round(jd * Math.pow(10, precision)) / Math.pow(10, precision);
  return `moon:${roundedJd}`;
}

/**
 * Create a cache key for sun calculations
 */
export function createSunCacheKey(jd: number, precision: number = 6): string {
  const roundedJd = Math.round(jd * Math.pow(10, precision)) / Math.pow(10, precision);
  return `sun:${roundedJd}`;
}

/**
 * Create a cache key for coordinate transformations
 */
export function createCoordCacheKey(
  type: 'eclToEq' | 'eqToHz',
  lon: number,
  lat: number,
  jd: number,
  observerLat?: number,
  observerLon?: number
): string {
  const roundedJd = Math.round(jd * 1e6) / 1e6;
  const roundedLon = Math.round(lon * 1e8) / 1e8;
  const roundedLat = Math.round(lat * 1e8) / 1e8;

  if (type === 'eclToEq') {
    return `eclToEq:${roundedLon}:${roundedLat}:${roundedJd}`;
  }

  const obsLat = observerLat !== undefined ? Math.round(observerLat * 1e6) / 1e6 : 'null';
  const obsLon = observerLon !== undefined ? Math.round(observerLon * 1e6) / 1e6 : 'null';
  return `eqToHz:${roundedLon}:${roundedLat}:${roundedJd}:${obsLat}:${obsLon}`;
}
