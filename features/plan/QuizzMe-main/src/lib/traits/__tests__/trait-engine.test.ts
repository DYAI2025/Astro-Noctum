/**
 * Trait Engine Tests
 *
 * Verifies the two-layer trait system behaves correctly:
 * - Bounds: UI score always 1-100
 * - Saturation: Movement slows near edges
 * - Anchor dominance: Opposing evidence is weakened/capped
 * - Idempotent init: No NaN, stable base scores
 */

import { describe, it, expect } from "vitest";
import {
  uiScore,
  applyEvidence,
  clamp,
  scoreToP,
  pToScore,
  logit,
  sigmoid,
  clampShift,
  initFromBaseScores,
  applyBulkEvidence,
  renderTraitScores,
} from "../trait-engine";
import {
  TraitState,
  TraitEngineConfig,
  DEFAULT_CONFIG,
  createTraitState,
  createDefaultTraitState,
} from "../trait-state";
import { TIER_Z_GAIN } from "../tier-gains";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function createTestState(baseScore: number, shiftZ: number = 0): TraitState {
  return {
    traitId: "trait.test.example",
    baseScore,
    shiftZ,
    shiftStrength: 0,
    updatedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BOUNDS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Bounds", () => {
  it("uiScore always returns integer 1-100 for any baseScore and shiftZ", () => {
    // Test many random combinations
    for (let i = 0; i < 100; i++) {
      const baseScore = Math.floor(Math.random() * 100) + 1; // 1-100
      const shiftZ = Math.random() * 20 - 10; // -10 to +10

      const state = createTestState(baseScore, shiftZ);
      const score = uiScore(state);

      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
      expect(Number.isNaN(score)).toBe(false);
    }
  });

  it("uiScore handles extreme shiftZ values", () => {
    // Very large positive shift
    const statePos = createTestState(50, 100);
    expect(uiScore(statePos)).toBeLessThanOrEqual(100);
    expect(uiScore(statePos)).toBeGreaterThanOrEqual(1);

    // Very large negative shift
    const stateNeg = createTestState(50, -100);
    expect(uiScore(stateNeg)).toBeLessThanOrEqual(100);
    expect(uiScore(stateNeg)).toBeGreaterThanOrEqual(1);
  });

  it("uiScore handles edge base scores", () => {
    const state1 = createTestState(1, 0);
    const state100 = createTestState(100, 0);

    expect(uiScore(state1)).toBeGreaterThanOrEqual(1);
    expect(uiScore(state100)).toBeLessThanOrEqual(100);
  });

  it("clamp works correctly", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SATURATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Saturation", () => {
  it("same deltaZ produces larger score change at baseScore 50 than at 95", () => {
    const deltaZ = 0.5;

    // State at middle (baseScore 50)
    const stateMid = createTestState(50, 0);
    const scoreMidBefore = uiScore(stateMid);
    const stateMidAfter = applyEvidence(stateMid, deltaZ);
    const scoreMidAfter = uiScore(stateMidAfter);
    const changeMid = Math.abs(scoreMidAfter - scoreMidBefore);

    // State at edge (baseScore 95)
    const stateHigh = createTestState(95, 0);
    const scoreHighBefore = uiScore(stateHigh);
    const stateHighAfter = applyEvidence(stateHigh, deltaZ);
    const scoreHighAfter = uiScore(stateHighAfter);
    const changeHigh = Math.abs(scoreHighAfter - scoreHighBefore);

    // Middle should change more than edge
    expect(changeMid).toBeGreaterThan(changeHigh);
  });

  it("movement slows near lower edge too", () => {
    const deltaZ = -0.5;

    // State at middle (baseScore 50)
    const stateMid = createTestState(50, 0);
    const scoreMidBefore = uiScore(stateMid);
    const stateMidAfter = applyEvidence(stateMid, deltaZ);
    const scoreMidAfter = uiScore(stateMidAfter);
    const changeMid = Math.abs(scoreMidAfter - scoreMidBefore);

    // State at low edge (baseScore 5)
    const stateLow = createTestState(5, 0);
    const scoreLowBefore = uiScore(stateLow);
    const stateLowAfter = applyEvidence(stateLow, deltaZ);
    const scoreLowAfter = uiScore(stateLowAfter);
    const changeLow = Math.abs(scoreLowAfter - scoreLowBefore);

    // Middle should change more than edge
    expect(changeMid).toBeGreaterThan(changeLow);
  });

  it("logit/sigmoid are inverses", () => {
    const config = DEFAULT_CONFIG;
    for (const p of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const z = logit(p);
      const recovered = sigmoid(z);
      expect(Math.abs(recovered - p)).toBeLessThan(0.0001);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ANCHOR DOMINANCE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Anchor Dominance", () => {
  it("opposing evidence is reduced by OPPOSITION_FACTOR", () => {
    const config = DEFAULT_CONFIG;

    // High base score (positive in logit space)
    const baseScore = 80;
    const state = createTestState(baseScore, 0);

    // Negative evidence (opposing the base direction)
    const deltaZ0 = -1.0;

    const newState = applyEvidence(state, deltaZ0, config);

    // The actual shift should be reduced
    const expectedShift = deltaZ0 * config.OPPOSITION_FACTOR;
    expect(Math.abs(newState.shiftZ)).toBeCloseTo(
      Math.abs(expectedShift),
      0.001
    );
  });

  it("aligning evidence is NOT reduced", () => {
    const config = DEFAULT_CONFIG;

    // High base score (positive in logit space)
    const baseScore = 80;
    const state = createTestState(baseScore, 0);

    // Positive evidence (aligning with base direction)
    const deltaZ0 = 1.0;

    const newState = applyEvidence(state, deltaZ0, config);

    // The shift should NOT be reduced
    expect(newState.shiftZ).toBeCloseTo(deltaZ0, 0.001);
  });

  it("opposing shift is capped at MAX_OPPOSE_Z", () => {
    const config = DEFAULT_CONFIG;

    // High base score
    const state = createTestState(80, 0);

    // Apply large opposing evidence multiple times
    let currentState = state;
    for (let i = 0; i < 20; i++) {
      currentState = applyEvidence(currentState, -1.0, config);
    }

    // Shift should be capped at MAX_OPPOSE_Z (absolute value)
    expect(Math.abs(currentState.shiftZ)).toBeLessThanOrEqual(
      config.MAX_OPPOSE_Z + 0.001
    );
  });

  it("aligning shift can reach MAX_ALIGN_Z", () => {
    const config = DEFAULT_CONFIG;

    // High base score
    const state = createTestState(80, 0);

    // Apply large aligning evidence multiple times
    let currentState = state;
    for (let i = 0; i < 20; i++) {
      currentState = applyEvidence(currentState, 1.0, config);
    }

    // Shift should be capped at MAX_ALIGN_Z
    expect(currentState.shiftZ).toBeLessThanOrEqual(config.MAX_ALIGN_Z + 0.001);
    // But it should be able to reach close to MAX_ALIGN_Z
    expect(currentState.shiftZ).toBeGreaterThan(config.MAX_OPPOSE_Z);
  });

  it("clampShift respects direction-based limits", () => {
    const config = DEFAULT_CONFIG;
    const baseZ = 1.0; // Positive base

    // Same direction: can go up to MAX_ALIGN_Z
    expect(clampShift(baseZ, 3.0, config)).toBe(config.MAX_ALIGN_Z);
    expect(clampShift(baseZ, 1.0, config)).toBe(1.0);

    // Opposite direction: capped at MAX_OPPOSE_Z
    expect(clampShift(baseZ, -2.0, config)).toBe(-config.MAX_OPPOSE_Z);
    expect(clampShift(baseZ, -0.5, config)).toBe(-0.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENT INIT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Idempotent Init", () => {
  it("createTraitState produces valid state", () => {
    const state = createTraitState("trait.test.foo", 75);

    expect(state.traitId).toBe("trait.test.foo");
    expect(state.baseScore).toBe(75);
    expect(state.shiftZ).toBe(0);
    expect(state.shiftStrength).toBe(0);
    expect(Number.isNaN(state.baseScore)).toBe(false);
  });

  it("createTraitState clamps invalid base scores", () => {
    const stateLow = createTraitState("trait.test.foo", -10);
    expect(stateLow.baseScore).toBe(1);

    const stateHigh = createTraitState("trait.test.foo", 150);
    expect(stateHigh.baseScore).toBe(100);
  });

  it("createDefaultTraitState produces neutral state", () => {
    const state = createDefaultTraitState("trait.test.bar");

    expect(state.baseScore).toBe(50);
    expect(state.shiftZ).toBe(0);
    expect(Number.isNaN(uiScore(state))).toBe(false);
  });

  it("initializing twice keeps base score stable", () => {
    const baseScores = { "trait.values.security": 70 };
    const now = new Date().toISOString();

    const states1 = initFromBaseScores(baseScores, now);
    const states2 = initFromBaseScores(baseScores, now);

    // Both should have the same base score
    expect(states1["trait.values.security"]?.baseScore).toBe(70);
    expect(states2["trait.values.security"]?.baseScore).toBe(70);
  });

  it("uiScore of initialized state equals base score when shiftZ is 0", () => {
    const state = createTraitState("trait.test.foo", 75);
    const score = uiScore(state);

    // Should be very close to base score (maybe slight rounding)
    expect(Math.abs(score - 75)).toBeLessThanOrEqual(1);
  });

  it("no NaN values after multiple operations", () => {
    let state = createTraitState("trait.test.foo", 50);

    // Apply many random evidence values
    for (let i = 0; i < 100; i++) {
      const deltaZ = Math.random() * 2 - 1; // -1 to +1
      state = applyEvidence(state, deltaZ);

      expect(Number.isNaN(state.shiftZ)).toBe(false);
      expect(Number.isNaN(state.shiftStrength)).toBe(false);
      expect(Number.isNaN(uiScore(state))).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BULK OPERATIONS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Bulk Operations", () => {
  it("applyBulkEvidence updates multiple traits", () => {
    const states = {
      "trait.test.a": createTraitState("trait.test.a", 50),
      "trait.test.b": createTraitState("trait.test.b", 50),
    };

    const evidence = {
      "trait.test.a": 0.5,
      "trait.test.b": -0.5,
    };

    const newStates = applyBulkEvidence(
      states,
      evidence,
      TIER_Z_GAIN.CORE,
      1.0
    );

    // Trait A should have positive shift
    expect(newStates["trait.test.a"].shiftZ).toBeGreaterThan(0);
    // Trait B should have negative shift
    expect(newStates["trait.test.b"].shiftZ).toBeLessThan(0);
  });

  it("renderTraitScores produces valid scores", () => {
    const states = {
      "trait.test.a": createTraitState("trait.test.a", 30),
      "trait.test.b": createTraitState("trait.test.b", 70),
    };

    const scores = renderTraitScores(states);

    expect(scores["trait.test.a"]).toBeGreaterThanOrEqual(1);
    expect(scores["trait.test.a"]).toBeLessThanOrEqual(100);
    expect(scores["trait.test.b"]).toBeGreaterThanOrEqual(1);
    expect(scores["trait.test.b"]).toBeLessThanOrEqual(100);
  });

  it("creates default states for unknown traits in bulk evidence", () => {
    const states = {};
    const evidence = {
      "trait.test.new": 0.5,
    };

    const newStates = applyBulkEvidence(
      states,
      evidence,
      TIER_Z_GAIN.GROWTH,
      1.0
    );

    // Should have created the state
    expect(newStates["trait.test.new"]).toBeDefined();
    expect(newStates["trait.test.new"].baseScore).toBe(50);
    expect(newStates["trait.test.new"].shiftZ).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TIER GAIN TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Tier Gains", () => {
  it("CORE tier produces larger shifts than GROWTH", () => {
    const stateCore = createTraitState("trait.test.foo", 50);
    const stateGrowth = createTraitState("trait.test.foo", 50);

    const evidence = 1.0;
    const confidence = 1.0;

    const coreResult = applyEvidence(
      stateCore,
      TIER_Z_GAIN.CORE * evidence * confidence
    );
    const growthResult = applyEvidence(
      stateGrowth,
      TIER_Z_GAIN.GROWTH * evidence * confidence
    );

    expect(Math.abs(coreResult.shiftZ)).toBeGreaterThan(
      Math.abs(growthResult.shiftZ)
    );
  });

  it("FLAVOR tier produces smallest shifts", () => {
    const state = createTraitState("trait.test.foo", 50);
    const evidence = 1.0;
    const confidence = 1.0;

    const flavorResult = applyEvidence(
      state,
      TIER_Z_GAIN.FLAVOR * evidence * confidence
    );

    // FLAVOR shift should be small
    expect(Math.abs(flavorResult.shiftZ)).toBeLessThan(0.15);
  });
});
