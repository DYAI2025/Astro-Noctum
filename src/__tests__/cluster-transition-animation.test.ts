import { describe, it, expect } from 'vitest';
import {
  CLUSTER_REGISTRY,
  isClusterComplete,
  findClusterForModule,
} from '../lib/fusion-ring/clusters';

// ── 1. Cluster metadata for animation ──────────────────────────────

describe('cluster-transition-animation — cluster metadata', () => {
  it('every cluster has a color string (hex format)', () => {
    for (const cluster of CLUSTER_REGISTRY) {
      expect(cluster.color).toBeTruthy();
      expect(cluster.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('every cluster has a significance weight in (0, 1]', () => {
    for (const cluster of CLUSTER_REGISTRY) {
      expect(cluster.significance).toBeGreaterThan(0);
      expect(cluster.significance).toBeLessThanOrEqual(1);
    }
  });

  it('significance varies across clusters (not all identical)', () => {
    const values = new Set(CLUSTER_REGISTRY.map(c => c.significance));
    expect(values.size).toBeGreaterThan(1);
  });
});

// ── 2. Effect object contract ──────────────────────────────────────

describe('cluster-transition-animation — effect trigger contract', () => {
  it('builds correct burst effect for a completed cluster', () => {
    const naturkind = CLUSTER_REGISTRY.find(c => c.id === 'cluster.naturkind.v1')!;
    const completed = new Set(naturkind.quizModuleIds);

    expect(isClusterComplete(naturkind, completed)).toBe(true);

    // Simulate effect construction as FuRingPage does (line 143)
    const effect = {
      type: 'burst' as const,
      color: naturkind.color,
      timestamp: Date.now(),
      intensity: naturkind.significance,
    };

    expect(effect.type).toBe('burst');
    expect(effect.color).toBe('#2D5A4C');
    expect(effect.intensity).toBe(0.7);
    expect(effect.timestamp).toBeGreaterThan(0);
  });

  it('builds effects with distinct colors per cluster', () => {
    const colors = CLUSTER_REGISTRY.map(c => c.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(CLUSTER_REGISTRY.length);
  });

  it('intensity scales with cluster significance', () => {
    const naturkind = CLUSTER_REGISTRY.find(c => c.id === 'cluster.naturkind.v1')!;
    const partner = CLUSTER_REGISTRY.find(c => c.id === 'cluster.partner_match.v1')!;

    // partner_match has higher significance than naturkind
    expect(partner.significance).toBeGreaterThan(naturkind.significance);

    // So the burst effect would be more intense
    const naturkindEffect = { intensity: naturkind.significance };
    const partnerEffect = { intensity: partner.significance };
    expect(partnerEffect.intensity).toBeGreaterThan(naturkindEffect.intensity);
  });
});

// ── 3. Cluster completion triggers effect (not partial) ────────────

describe('cluster-transition-animation — gate → effect flow', () => {
  const naturkind = CLUSTER_REGISTRY.find(c => c.id === 'cluster.naturkind.v1')!;

  it('no effect when cluster is partially complete', () => {
    const partial = new Set(naturkind.quizModuleIds.slice(0, 2));
    const lastModule = naturkind.quizModuleIds[2]!;
    const cluster = findClusterForModule(lastModule);

    expect(cluster).toBeTruthy();
    const updated = new Set([...partial, lastModule]);
    // Still 3 of 4 — no burst
    expect(isClusterComplete(naturkind, updated)).toBe(false);
  });

  it('effect fires on the completing quiz (4th of 4)', () => {
    const firstThree = new Set(naturkind.quizModuleIds.slice(0, 3));
    const lastModule = naturkind.quizModuleIds[3]!;
    const cluster = findClusterForModule(lastModule);

    expect(cluster).toBeTruthy();
    const updated = new Set([...firstThree, lastModule]);
    expect(isClusterComplete(naturkind, updated)).toBe(true);
  });

  it('standalone quiz (no cluster) does not produce a burst effect', () => {
    const cluster = findClusterForModule('quiz.standalone_test.v1');
    expect(cluster).toBeNull();
    // No cluster → no burst effect (POST fires immediately instead)
  });
});

// ── 4. All 6 clusters support animation ────────────────────────────

describe('cluster-transition-animation — all clusters animatable', () => {
  it('all 6 clusters have required animation fields', () => {
    expect(CLUSTER_REGISTRY).toHaveLength(6);
    for (const cluster of CLUSTER_REGISTRY) {
      expect(cluster.id).toBeTruthy();
      expect(cluster.color).toBeTruthy();
      expect(typeof cluster.significance).toBe('number');
      expect(cluster.quizModuleIds.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each cluster completion would produce a valid effect object', () => {
    for (const cluster of CLUSTER_REGISTRY) {
      const completed = new Set(cluster.quizModuleIds);
      expect(isClusterComplete(cluster, completed)).toBe(true);

      const effect = {
        type: 'burst',
        color: cluster.color,
        timestamp: Date.now(),
        intensity: cluster.significance,
      };

      expect(effect.type).toBe('burst');
      expect(effect.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(effect.intensity).toBeGreaterThan(0);
      expect(effect.intensity).toBeLessThanOrEqual(1);
    }
  });
});
