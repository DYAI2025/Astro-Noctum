/**
 * TASK-perf-first-frame: Validate <2s first visible frame from data availability.
 *
 * The V3 bipolar-trail engine depends on Three.js for canvas rendering, which
 * is not available in the Vitest environment. Instead we validate the data
 * pipeline speed: the full chain from raw soulprint sectors through the bridge
 * transforms (soulprintToNatalWeights, soulprintToDimensionWeights) into the
 * V3 engine (initializePoles, computeV3Dissonance, updatePoles) must complete
 * in <100ms — well under the 2000ms first-frame budget.
 *
 * This guarantees that when real rendering is added, the data preparation
 * phase is not the bottleneck.
 */

import { describe, it, expect } from 'vitest';
import {
  soulprintToNatalWeights,
  soulprintToDimensionWeights,
  deriveWeightsFromApiData,
  quizSectorsToQuizWeights,
} from '../components/fusion-ring-website/signatur-bridge';
import {
  initializePoles,
  computeV3Dissonance,
  updatePoles,
  modulateConfig,
  computeDensityField,
  type SignaturV3Config,
} from '../components/signatur-v3/bipolar-engine';
import { computeDayHarmonic } from '../lib/fusion-ring/day-harmonic';

// --- Test fixtures ---

/** Realistic 12-sector soulprint from bootstrap API */
const SOULPRINT_SECTORS = [
  0.72, 0.45, 0.61, 0.38, 0.85, 0.52,
  0.41, 0.67, 0.73, 0.55, 0.48, 0.63,
];

/** Realistic quiz contribution sectors */
const QUIZ_SECTORS = [
  0.40, 0.60, 0.55, 0.70, 0.50, 0.65,
  0.35, 0.45, 0.30, 0.80, 0.50, 0.42,
];

const V3_CONFIG: SignaturV3Config = {
  maxR: 200,
  maxTrailLength: 2000,
  trailPersistence: 0.85,
  timeScale: 1.0,
};

describe('TASK-perf-first-frame: First visible frame <2s', () => {
  it('full data pipeline (soulprint -> natal weights -> dimension weights) completes in <100ms', () => {
    const start = performance.now();

    // Step 1: Bridge transforms — soulprint sectors to natal + dimension weights
    const natalWeights = soulprintToNatalWeights(SOULPRINT_SECTORS);
    const dimensionWeights = soulprintToDimensionWeights(SOULPRINT_SECTORS);
    const quizWeights = quizSectorsToQuizWeights(QUIZ_SECTORS);

    // Step 2: Convert to Maps for V3 engine
    const natalMap = new Map(Object.entries(natalWeights));
    const quizMap = new Map(Object.entries(quizWeights));

    // Step 3: V3 engine initialization
    const poles = initializePoles(V3_CONFIG, natalMap, quizMap);

    // Step 4: Dissonance computation
    const dissonance = computeV3Dissonance(natalMap, quizMap);

    // Step 5: Day harmonic modulation
    const dayHarmonic = computeDayHarmonic(0.6);
    const activeConfig = modulateConfig(V3_CONFIG, dayHarmonic);

    // Step 6: First frame update (the "first visible frame")
    updatePoles(poles, dissonance, activeConfig, 0, dayHarmonic);

    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
    console.log(`[First Frame] Full data pipeline + first frame: ${elapsed.toFixed(2)}ms (budget: 100ms)`);
  });

  it('bridge transforms alone complete in <10ms', () => {
    const start = performance.now();

    // Run 100 iterations to get stable measurement
    for (let i = 0; i < 100; i++) {
      soulprintToNatalWeights(SOULPRINT_SECTORS);
      soulprintToDimensionWeights(SOULPRINT_SECTORS);
      quizSectorsToQuizWeights(QUIZ_SECTORS);
    }

    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    expect(avgMs).toBeLessThan(10);
    console.log(`[First Frame] Bridge transforms avg: ${avgMs.toFixed(3)}ms (budget: 10ms)`);
  });

  it('deriveWeightsFromApiData fallback path completes in <10ms', () => {
    const apiData = {
      western: { zodiac_sign: 'Leo', moon_sign: 'Cancer' },
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      deriveWeightsFromApiData(apiData);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    expect(avgMs).toBeLessThan(10);
    console.log(`[First Frame] API fallback weights avg: ${avgMs.toFixed(3)}ms (budget: 10ms)`);
  });

  it('end-to-end pipeline with density field computation completes in <2000ms', () => {
    const start = performance.now();

    // Full pipeline: bridge -> engine init -> 60 frames (1s at 60fps) -> density field
    const natalWeights = soulprintToNatalWeights(SOULPRINT_SECTORS);
    const quizWeights = quizSectorsToQuizWeights(QUIZ_SECTORS);
    const natalMap = new Map(Object.entries(natalWeights));
    const quizMap = new Map(Object.entries(quizWeights));

    const poles = initializePoles(V3_CONFIG, natalMap, quizMap);
    const dissonance = computeV3Dissonance(natalMap, quizMap);
    const dayHarmonic = computeDayHarmonic(0.6);
    const activeConfig = modulateConfig(V3_CONFIG, dayHarmonic);

    // Simulate 60 frames (1 second of animation) to build up trails
    for (let frame = 0; frame < 60; frame++) {
      updatePoles(poles, dissonance, activeConfig, frame * 0.0166, dayHarmonic);
    }

    // Compute density field (the "visible" output)
    const density = computeDensityField(poles, V3_CONFIG, 128);

    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(density.maxDensity).toBeGreaterThan(0);
    expect(density.width).toBe(128);
    expect(density.height).toBe(128);

    console.log(
      `[First Frame] Full pipeline + 60 frames + density field: ${elapsed.toFixed(2)}ms (budget: 2000ms)` +
      ` | maxDensity: ${density.maxDensity.toFixed(2)}`,
    );
  });

  it('pipeline handles empty/missing soulprint sectors gracefully', () => {
    const start = performance.now();

    // Empty sectors — should fall back to defaults (0.5)
    const natalWeights = soulprintToNatalWeights([]);
    const quizWeights = quizSectorsToQuizWeights([]);
    const natalMap = new Map(Object.entries(natalWeights));
    const quizMap = new Map(Object.entries(quizWeights));

    const poles = initializePoles(V3_CONFIG, natalMap, quizMap);
    const dissonance = computeV3Dissonance(natalMap, quizMap);

    updatePoles(poles, dissonance, V3_CONFIG, 0);

    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
    // All natal weights should be 0.5 (fallback)
    expect(natalWeights['Sun']).toBe(0.5);
    expect(natalWeights['Moon']).toBe(0.5);

    console.log(`[First Frame] Empty sectors fallback: ${elapsed.toFixed(2)}ms`);
  });
});
