/**
 * V3 Engine Performance Benchmark
 *
 * Measures the computational cost of the bipolar trail engine
 * (pole updates + trail recording + dissonance) without rendering.
 * Canvas rendering is browser-dependent, but the engine math
 * must be fast enough to sustain 60fps (< 16.6ms per frame).
 */

import { describe, it, expect } from 'vitest';
import {
  initializePoles,
  computeV3Dissonance,
  computeDissonance,
  updatePoles,
  modulateConfig,
  type SignaturV3Config,
  type SolarModulation,
} from '../components/signatur-v3/bipolar-engine';
import { computeDayHarmonic } from '../lib/fusion-ring/day-harmonic';
import { selectQualityTier, buildConfig } from '../components/signatur-v3/SignaturV3Canvas';

const CONFIG: SignaturV3Config = {
  maxR: 200,
  maxTrailLength: 2000,
  trailPersistence: 0.85,
  timeScale: 1.0,
};

function makeWeights(values: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(values));
}

const NATAL = makeWeights({
  assertion: 0.7, empathy: 0.3, creativity: 0.8,
  logic: 0.4, intuition: 0.6, discipline: 0.5,
});

const QUIZ = makeWeights({
  assertion: 0.4, empathy: 0.7, creativity: 0.5,
  logic: 0.6, intuition: 0.3, discipline: 0.8,
});

const DAY_HARMONIC = computeDayHarmonic(0.6);

const SOLAR: SolarModulation = {
  ringModulation: 1.3,
  triggerEffect: false,
  kpIndex: 5,
  dimensionMultipliers: {
    assertion: 1.2, empathy: 1.5, creativity: 1.1,
    logic: 1.0, intuition: 1.3, discipline: 0.8,
  },
};

describe('V3 Engine Performance', () => {
  it('single frame update completes in < 1ms (budget: 16.6ms for 60fps)', () => {
    const poles = initializePoles(CONFIG, NATAL, QUIZ);
    const dissonance = computeV3Dissonance(NATAL, QUIZ);
    const activeConfig = modulateConfig(CONFIG, DAY_HARMONIC);

    const start = performance.now();
    updatePoles(poles, dissonance, activeConfig, 1.0, DAY_HARMONIC, SOLAR);
    const elapsed = performance.now() - start;

    // Single frame engine update should be well under 1ms
    expect(elapsed).toBeLessThan(1);
  });

  it('1000 frames (16.6s equivalent) complete in < 500ms', () => {
    const poles = initializePoles(CONFIG, NATAL, QUIZ);
    const dissonance = computeV3Dissonance(NATAL, QUIZ);
    const activeConfig = modulateConfig(CONFIG, DAY_HARMONIC);

    const start = performance.now();
    for (let frame = 0; frame < 1000; frame++) {
      updatePoles(poles, dissonance, activeConfig, frame * 0.0166, DAY_HARMONIC, SOLAR);
    }
    const elapsed = performance.now() - start;

    // 1000 frames of engine math should complete in < 500ms
    // (giving >15ms per frame budget for actual canvas rendering)
    expect(elapsed).toBeLessThan(500);

    const avgMs = elapsed / 1000;
    console.log(`[V3 Perf] 1000 frames in ${elapsed.toFixed(1)}ms — avg ${avgMs.toFixed(3)}ms/frame`);
  });

  it('dissonance + visual modulation compute in < 0.5ms', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      computeV3Dissonance(NATAL, QUIZ);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    expect(avgMs).toBeLessThan(0.5);
    console.log(`[V3 Perf] Dissonance compute avg ${avgMs.toFixed(3)}ms`);
  });

  it('pole initialization completes in < 1ms', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      initializePoles(CONFIG, NATAL, QUIZ);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    expect(avgMs).toBeLessThan(1);
    console.log(`[V3 Perf] Init poles avg ${avgMs.toFixed(3)}ms`);
  });

  it('trail memory stays bounded at maxTrailLength', () => {
    const poles = initializePoles(CONFIG, NATAL, QUIZ);
    const dissonance = computeDissonance(NATAL, QUIZ);

    // Run 5000 frames (way past maxTrailLength of 2000)
    for (let frame = 0; frame < 5000; frame++) {
      updatePoles(poles, dissonance, CONFIG, frame * 0.016);
    }

    for (const pole of poles) {
      expect(pole.trailLength).toBeLessThanOrEqual(CONFIG.maxTrailLength);
      expect(pole.trailHead).toBeLessThan(CONFIG.maxTrailLength);
    }
  });

  it('full frame with all modulations (dissonance + day + solar) < 2ms', () => {
    const poles = initializePoles(CONFIG, NATAL, QUIZ);
    const external = {
      d_natal: 0.5, d_accumulated: 0.3,
      d_elemental: { magnitude: 0.6, type: 'ke' as const, pair: ['Fire', 'Water'] as [string, string] },
      intensity: 0.45,
    };
    const dissonance = computeV3Dissonance(NATAL, QUIZ, external);
    const activeConfig = modulateConfig(CONFIG, DAY_HARMONIC);

    // Warm up
    for (let i = 0; i < 10; i++) {
      updatePoles(poles, dissonance, activeConfig, i * 0.016, DAY_HARMONIC, SOLAR);
    }

    // Measure
    const start = performance.now();
    for (let frame = 0; frame < 100; frame++) {
      updatePoles(poles, dissonance, activeConfig, (frame + 10) * 0.016, DAY_HARMONIC, SOLAR);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    expect(avgMs).toBeLessThan(2);
    console.log(`[V3 Perf] Full modulated frame avg ${avgMs.toFixed(3)}ms (budget: 16.6ms)`);
  });
});

describe('V3 Adaptive Trail Tier Selection', () => {
  it('selectQualityTier returns high for ≥400px', () => {
    expect(selectQualityTier(500, 500)).toBe('high');
    expect(selectQualityTier(400, 600)).toBe('high');
  });

  it('selectQualityTier returns medium for 250–399px', () => {
    expect(selectQualityTier(300, 300)).toBe('medium');
    expect(selectQualityTier(250, 400)).toBe('medium');
  });

  it('selectQualityTier returns low for <250px', () => {
    expect(selectQualityTier(200, 200)).toBe('low');
    expect(selectQualityTier(240, 240)).toBe('low');
  });

  it('buildConfig produces correct trail lengths per tier', () => {
    expect(buildConfig(500, 500, 'high').maxTrailLength).toBe(2000);
    expect(buildConfig(300, 300, 'medium').maxTrailLength).toBe(800);
    expect(buildConfig(200, 200, 'low').maxTrailLength).toBe(300);
  });

  it('buildConfig auto selects based on canvas size', () => {
    expect(buildConfig(500, 500, 'auto').maxTrailLength).toBe(2000);
    expect(buildConfig(300, 300, 'auto').maxTrailLength).toBe(800);
    expect(buildConfig(200, 200, 'auto').maxTrailLength).toBe(300);
  });

  it('lower trail length reduces per-frame work proportionally', () => {
    const highConfig: SignaturV3Config = { maxR: 200, maxTrailLength: 2000, trailPersistence: 0.85, timeScale: 1.0 };
    const lowConfig: SignaturV3Config = { maxR: 80, maxTrailLength: 300, trailPersistence: 0.78, timeScale: 1.0 };

    const polesHigh = initializePoles(highConfig, NATAL, QUIZ);
    const polesLow = initializePoles(lowConfig, NATAL, QUIZ);
    const dissonance = computeV3Dissonance(NATAL, QUIZ);

    // Fill trails to max
    for (let i = 0; i < 2500; i++) {
      updatePoles(polesHigh, dissonance, highConfig, i * 0.016);
      updatePoles(polesLow, dissonance, lowConfig, i * 0.016);
    }

    expect(polesHigh[0]!.trailLength).toBe(2000);
    expect(polesLow[0]!.trailLength).toBe(300);

    // Canvas draw cost is proportional to trailLength — low is ~6.7x cheaper to render
    const ratio = polesHigh[0]!.trailLength / polesLow[0]!.trailLength;
    expect(ratio).toBeCloseTo(6.67, 1);
  });
});

/**
 * Mobile Web Benchmark — reduced trail config simulating mobile viewport (<768px).
 * Target: ≥30fps → budget 33.3ms per frame.
 * Mobile uses shorter trails and smaller canvas to reduce draw calls.
 */
const MOBILE_CONFIG: SignaturV3Config = {
  maxR: 120,            // smaller canvas (240x240 vs 500x500)
  maxTrailLength: 500,  // 75% fewer trail points than desktop
  trailPersistence: 0.80,
  timeScale: 1.0,
};

describe('V3 Engine Performance — Mobile Web (30fps target)', () => {
  it('single mobile frame < 1ms (budget: 33.3ms for 30fps)', () => {
    const poles = initializePoles(MOBILE_CONFIG, NATAL, QUIZ);
    const dissonance = computeV3Dissonance(NATAL, QUIZ);
    const activeConfig = modulateConfig(MOBILE_CONFIG, DAY_HARMONIC);

    const start = performance.now();
    updatePoles(poles, dissonance, activeConfig, 1.0, DAY_HARMONIC, SOLAR);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1);
  });

  it('1000 mobile frames complete in < 200ms', () => {
    const poles = initializePoles(MOBILE_CONFIG, NATAL, QUIZ);
    const dissonance = computeV3Dissonance(NATAL, QUIZ);
    const activeConfig = modulateConfig(MOBILE_CONFIG, DAY_HARMONIC);

    const start = performance.now();
    for (let frame = 0; frame < 1000; frame++) {
      updatePoles(poles, dissonance, activeConfig, frame * 0.033, DAY_HARMONIC, SOLAR);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);

    const avgMs = elapsed / 1000;
    console.log(`[V3 Mobile Perf] 1000 frames in ${elapsed.toFixed(1)}ms — avg ${avgMs.toFixed(3)}ms/frame`);
  });

  it('mobile trail memory bounded at 500', () => {
    const poles = initializePoles(MOBILE_CONFIG, NATAL, QUIZ);
    const dissonance = computeDissonance(NATAL, QUIZ);

    for (let frame = 0; frame < 2000; frame++) {
      updatePoles(poles, dissonance, MOBILE_CONFIG, frame * 0.033);
    }

    for (const pole of poles) {
      expect(pole.trailLength).toBeLessThanOrEqual(MOBILE_CONFIG.maxTrailLength);
    }
  });

  it('full mobile frame with all modulations < 1ms (budget: 33.3ms)', () => {
    const poles = initializePoles(MOBILE_CONFIG, NATAL, QUIZ);
    const external = {
      d_natal: 0.5, d_accumulated: 0.3,
      d_elemental: { magnitude: 0.6, type: 'ke' as const, pair: ['Fire', 'Water'] as [string, string] },
      intensity: 0.45,
    };
    const dissonance = computeV3Dissonance(NATAL, QUIZ, external);
    const activeConfig = modulateConfig(MOBILE_CONFIG, DAY_HARMONIC);

    // Warm up
    for (let i = 0; i < 10; i++) {
      updatePoles(poles, dissonance, activeConfig, i * 0.033, DAY_HARMONIC, SOLAR);
    }

    const start = performance.now();
    for (let frame = 0; frame < 100; frame++) {
      updatePoles(poles, dissonance, activeConfig, (frame + 10) * 0.033, DAY_HARMONIC, SOLAR);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    expect(avgMs).toBeLessThan(1);
    console.log(`[V3 Mobile Perf] Full modulated frame avg ${avgMs.toFixed(3)}ms (budget: 33.3ms)`);
  });
});

/**
 * First Frame Validation — REQ-PERF acceptance criterion:
 * "First visible frame appears within 2 seconds of data availability."
 *
 * Measures the time from data availability (natal + quiz weights ready)
 * to the first complete frame output (pole init + dissonance + first update).
 * This covers everything the engine does synchronously before the canvas
 * can render — the remaining time is browser rAF scheduling (~16ms)
 * and canvas draw calls (measured separately in desktop/mobile benchmarks).
 */
describe('V3 First Frame Readiness (< 2s budget)', () => {
  it('init → first frame data ready in < 50ms (budget: 2000ms)', () => {
    const start = performance.now();

    // Step 1: Initialize poles from natal + quiz weights (synchronous)
    const poles = initializePoles(CONFIG, NATAL, QUIZ);

    // Step 2: Compute dissonance (synchronous)
    const external = {
      d_natal: 0.5, d_accumulated: 0.3,
      d_elemental: { magnitude: 0.6, type: 'ke' as const, pair: ['Fire', 'Water'] as [string, string] },
      intensity: 0.45,
    };
    const dissonance = computeV3Dissonance(NATAL, QUIZ, external);

    // Step 3: Modulate config with day harmonic (synchronous)
    const activeConfig = modulateConfig(CONFIG, DAY_HARMONIC);

    // Step 4: First frame update (synchronous)
    updatePoles(poles, dissonance, activeConfig, 0.016, DAY_HARMONIC, SOLAR);

    const elapsed = performance.now() - start;

    // All synchronous engine work should complete in well under 50ms
    // (leaving >1950ms of the 2s budget for data fetch + canvas mount + rAF)
    expect(elapsed).toBeLessThan(50);
    console.log(`[V3 First Frame] Data-ready → frame-ready: ${elapsed.toFixed(2)}ms (budget: 2000ms)`);
  });

  it('100 cold starts average < 10ms each', () => {
    const times: number[] = [];
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      const poles = initializePoles(CONFIG, NATAL, QUIZ);
      const dissonance = computeV3Dissonance(NATAL, QUIZ);
      const activeConfig = modulateConfig(CONFIG, DAY_HARMONIC);
      updatePoles(poles, dissonance, activeConfig, 0.016, DAY_HARMONIC, SOLAR);
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]!;

    expect(avg).toBeLessThan(10);
    expect(p95).toBeLessThan(20);
    console.log(`[V3 First Frame] 100 cold starts — avg: ${avg.toFixed(2)}ms, p95: ${p95.toFixed(2)}ms, max: ${max.toFixed(2)}ms`);
  });
});
