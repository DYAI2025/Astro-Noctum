/**
 * Ingestion Pipeline Tests
 *
 * Verifies:
 * 1. Invalid IDs are rejected via registry validators
 * 2. Trait observations converge (shiftZ moves toward desired, not explode)
 * 3. Snapshot always returns scores 1-100 even with extreme observations
 */

import { describe, it, expect } from "vitest";
import {
  ingestContribution,
  validateEvent,
  applyObservationNudge,
} from "../index";
import { ContributionEvent, TraitScore } from "@/lib/lme/types";
import { ProfileState, createDefaultProfileState } from "@/lib/profile";
import { buildProfileSnapshot } from "@/lib/profile";
import { createTraitState, uiScore } from "@/lib/traits";
import { ANCHORABLE_TRAIT_IDS } from "@/lib/registry/astro-anchor-map.v1";

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function createValidEvent(overrides: Partial<ContributionEvent> = {}): ContributionEvent {
  return {
    specVersion: "sp.contribution.v1",
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    source: {
      vertical: "quiz",
      moduleId: "quiz.test.v1",
      ...overrides.source,
    },
    payload: {
      markers: [
        { id: "marker.eq.empathy", weight: 0.7 },
      ],
      ...overrides.payload,
    },
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Validation", () => {
  it("rejects event with invalid marker ID", () => {
    const event = createValidEvent({
      payload: {
        markers: [
          { id: "marker.invalid.nonexistent", weight: 0.5 },
        ],
      },
    });

    const result = validateEvent(event);

    expect(result.valid).toBe(false);
    expect(result.idErrors.length).toBeGreaterThan(0);
    expect(result.idErrors[0].id).toBe("marker.invalid.nonexistent");
  });

  it("rejects event with invalid trait ID", () => {
    const event = createValidEvent({
      payload: {
        markers: [{ id: "marker.eq.empathy", weight: 0.5 }],
        traits: [
          { id: "trait.invalid.nonexistent", score: 75 },
        ],
      },
    });

    const result = validateEvent(event);

    expect(result.valid).toBe(false);
    expect(result.idErrors.some((e) => e.id === "trait.invalid.nonexistent")).toBe(true);
  });

  it("rejects event with missing specVersion", () => {
    const event = {
      eventId: "test",
      occurredAt: new Date().toISOString(),
      source: { vertical: "quiz", moduleId: "quiz.test.v1" },
      payload: { markers: [{ id: "marker.eq.empathy", weight: 0.5 }] },
    };

    const result = validateEvent(event);

    expect(result.valid).toBe(false);
    expect(result.shapeErrors.some((e) => e.field === "specVersion")).toBe(true);
  });

  it("rejects event with empty markers array", () => {
    const event = createValidEvent({
      payload: { markers: [] },
    });

    const result = validateEvent(event);

    expect(result.valid).toBe(false);
    expect(result.shapeErrors.some((e) => e.field === "payload.markers")).toBe(true);
  });

  it("accepts valid event with registered IDs", () => {
    const event = createValidEvent({
      payload: {
        markers: [
          { id: "marker.eq.empathy", weight: 0.7 },
          { id: "marker.social.extroversion", weight: 0.5 },
        ],
        traits: [
          { id: "trait.eq.empathy", score: 75 },
        ],
        tags: [
          { id: "tag.archetype.trickster", label: "Catalyst", kind: "archetype" },
        ],
      },
    });

    const result = validateEvent(event);

    expect(result.valid).toBe(true);
    expect(result.shapeErrors).toHaveLength(0);
    expect(result.idErrors).toHaveLength(0);
  });

  it("ingestContribution returns accepted=false for invalid event", () => {
    const invalidEvent = createValidEvent({
      payload: {
        markers: [{ id: "marker.fake.invalid", weight: 0.5 }],
      },
    });

    const state = createDefaultProfileState();
    const result = ingestContribution(state, invalidEvent);

    expect(result.accepted).toBe(false);
    expect(result.validation?.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRAIT CONVERGENCE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Trait Convergence", () => {
  it("observation nudge moves shiftZ toward desired", () => {
    const traitId = "trait.test.convergence";
    const baseScore = 50;
    const observedScore = 80;

    const initialState = createTraitState(traitId, baseScore);
    expect(initialState.shiftZ).toBe(0);

    const observations: TraitScore[] = [
      { id: traitId, score: observedScore, confidence: 1.0 },
    ];

    const result = applyObservationNudge(
      { [traitId]: initialState },
      observations,
      new Date().toISOString()
    );

    // shiftZ should have moved positive (toward 80)
    expect(result[traitId].shiftZ).toBeGreaterThan(0);
  });

  it("repeated observations converge toward target (not explode)", () => {
    const traitId = "trait.test.convergence";
    const baseScore = 50;
    const observedScore = 85;

    let state = createTraitState(traitId, baseScore);
    const observations: TraitScore[] = [
      { id: traitId, score: observedScore, confidence: 1.0 },
    ];

    const shifts: number[] = [];

    // Apply same observation 10 times
    for (let i = 0; i < 10; i++) {
      const result = applyObservationNudge(
        { [traitId]: state },
        observations,
        new Date().toISOString()
      );
      state = result[traitId];
      shifts.push(state.shiftZ);
    }

    // Should converge: later shifts should change less than earlier
    const earlyDelta = Math.abs(shifts[1] - shifts[0]);
    const lateDelta = Math.abs(shifts[9] - shifts[8]);

    expect(lateDelta).toBeLessThan(earlyDelta);

    // Should not explode: shiftZ stays bounded
    expect(Math.abs(state.shiftZ)).toBeLessThan(10);
  });

  it("opposing observation respects anchor dominance caps", () => {
    const traitId = "trait.test.anchor";
    const baseScore = 90; // High anchor

    let state = createTraitState(traitId, baseScore);
    const observations: TraitScore[] = [
      { id: traitId, score: 10, confidence: 1.0 }, // Strong opposing observation
    ];

    // Apply many opposing observations
    for (let i = 0; i < 20; i++) {
      const result = applyObservationNudge(
        { [traitId]: state },
        observations,
        new Date().toISOString()
      );
      state = result[traitId];
    }

    // shiftZ should be negative but capped by MAX_OPPOSE_Z
    expect(state.shiftZ).toBeLessThan(0);
    expect(Math.abs(state.shiftZ)).toBeLessThanOrEqual(1.5); // MAX_OPPOSE_Z is 1.0, with some tolerance
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT BOUNDS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Snapshot Bounds", () => {
  it("snapshot always returns trait scores 1-100 even with extreme observations", () => {
    const state = createDefaultProfileState();

    // Add traits with extreme shiftZ values
    state.traitStates["trait.test.extreme_high"] = {
      traitId: "trait.test.extreme_high",
      baseScore: 50,
      shiftZ: 100, // Extreme positive
      shiftStrength: 10,
      updatedAt: new Date().toISOString(),
    };

    state.traitStates["trait.test.extreme_low"] = {
      traitId: "trait.test.extreme_low",
      baseScore: 50,
      shiftZ: -100, // Extreme negative
      shiftStrength: 10,
      updatedAt: new Date().toISOString(),
    };

    state.traitStates["trait.test.edge_high"] = {
      traitId: "trait.test.edge_high",
      baseScore: 100,
      shiftZ: 5,
      shiftStrength: 5,
      updatedAt: new Date().toISOString(),
    };

    state.traitStates["trait.test.edge_low"] = {
      traitId: "trait.test.edge_low",
      baseScore: 1,
      shiftZ: -5,
      shiftStrength: 5,
      updatedAt: new Date().toISOString(),
    };

    const snapshot = buildProfileSnapshot(state);

    // All trait scores must be 1-100
    for (const [traitId, trait] of Object.entries(snapshot.traits)) {
      expect(trait.score).toBeGreaterThanOrEqual(1);
      expect(trait.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(trait.score)).toBe(true);
      expect(Number.isNaN(trait.score)).toBe(false);
    }
  });

  it("snapshot trait scores are always integers", () => {
    const state = createDefaultProfileState();

    // Add traits with various values
    state.traitStates["trait.test.decimal"] = {
      traitId: "trait.test.decimal",
      baseScore: 55.7, // Decimal base score
      shiftZ: 0.123,
      shiftStrength: 0.5,
      updatedAt: new Date().toISOString(),
    };

    const snapshot = buildProfileSnapshot(state);

    expect(Number.isInteger(snapshot.traits["trait.test.decimal"].score)).toBe(true);
  });

  it("snapshot includes confidence based on accumulated evidence", () => {
    const state = createDefaultProfileState();

    state.traitStates["trait.test.high_confidence"] = {
      traitId: "trait.test.high_confidence",
      baseScore: 60,
      shiftZ: 0.5,
      shiftStrength: 5.0, // Lots of evidence
      updatedAt: new Date().toISOString(),
    };

    state.traitStates["trait.test.low_confidence"] = {
      traitId: "trait.test.low_confidence",
      baseScore: 60,
      shiftZ: 0.5,
      shiftStrength: 0.1, // Little evidence
      updatedAt: new Date().toISOString(),
    };

    const snapshot = buildProfileSnapshot(state);

    const highConf = snapshot.traits["trait.test.high_confidence"].confidence;
    const lowConf = snapshot.traits["trait.test.low_confidence"].confidence;

    expect(highConf).toBeGreaterThan(lowConf!);
    expect(highConf).toBeGreaterThanOrEqual(0);
    expect(highConf).toBeLessThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FULL INGESTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Full Ingestion", () => {
  it("successfully ingests valid event and updates state", () => {
    const state = createDefaultProfileState();
    const event = createValidEvent({
      payload: {
        markers: [
          { id: "marker.eq.empathy", weight: 0.8 },
        ],
        traits: [
          { id: "trait.eq.empathy", score: 75, confidence: 0.8 },
        ],
      },
    });

    const result = ingestContribution(state, event);

    expect(result.accepted).toBe(true);
    expect(result.state.meta.eventCount).toBe(1);
    expect(result.snapshot).toBeDefined();
  });

  it("initializes state from null", () => {
    const event = createValidEvent();

    const result = ingestContribution(null, event);

    expect(result.accepted).toBe(true);
    expect(result.state).toBeDefined();
    expect(result.state.meta.eventCount).toBe(1);
  });

  it("merges tags correctly", () => {
    const state = createDefaultProfileState();
    state.tags = [
      { id: "tag.archetype.sage", label: "Existing", kind: "archetype" },
    ];

    const event = createValidEvent({
      payload: {
        markers: [{ id: "marker.eq.empathy", weight: 0.5 }],
        tags: [
          { id: "tag.archetype.trickster", label: "New Tag", kind: "archetype" },
        ],
      },
    });

    const result = ingestContribution(state, event);

    expect(result.accepted).toBe(true);
    expect(result.state.tags).toHaveLength(2);
    expect(result.state.tags.some((t) => t.id === "tag.archetype.sage")).toBe(true);
    expect(result.state.tags.some((t) => t.id === "tag.archetype.trickster")).toBe(true);
  });

  it("updates psyche state from markers", () => {
    const state = createDefaultProfileState();
    const initialConnection = state.psycheState.connection.value;

    const event = createValidEvent({
      payload: {
        markers: [
          { id: "marker.eq.empathy", weight: 0.9 }, // EQ maps to connection
        ],
      },
    });

    const result = ingestContribution(state, event);

    // Connection should have changed
    expect(result.state.psycheState.connection.value).not.toBe(initialConnection);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ASTRO ONBOARDING TESTS (Phase 5)
// ═══════════════════════════════════════════════════════════════════════════

describe("Astro Onboarding", () => {
  function createAstroOnboardingEvent(): ContributionEvent {
    return {
      specVersion: "sp.contribution.v1",
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      source: {
        vertical: "character",
        moduleId: "onboarding.astro.v1",
      },
      payload: {
        markers: [
          { id: "marker.astro.element.fire", weight: 0.1 },
          { id: "marker.astro.modality.cardinal", weight: 0.1 },
        ],
        astro: {
          western: {
            sunSign: "aries",
            elementsMix: { fire: 1, earth: 0, air: 0, water: 0 },
            modalitiesMix: { cardinal: 1, fixed: 0, mutable: 0 },
          },
          chinese: {
            animal: "dragon",
            element: "wood",
            yinYang: "yang",
          },
        },
      },
    };
  }

  it("accepts astro onboarding event on new profile", () => {
    const event = createAstroOnboardingEvent();
    const result = ingestContribution(null, event);

    expect(result.accepted).toBe(true);
    expect(result.state.anchors.astro).toBeDefined();
    expect(result.state.anchors.astro?.western.sunSign).toBe("aries");
    expect(result.state.anchors.astro?.chinese.animal).toBe("dragon");
  });

  it("rejects second astro onboarding (runOnce enforcement)", () => {
    // First onboarding
    const event1 = createAstroOnboardingEvent();
    const result1 = ingestContribution(null, event1);
    expect(result1.accepted).toBe(true);

    // Second onboarding should be rejected
    const event2 = createAstroOnboardingEvent();
    const result2 = ingestContribution(result1.state, event2);

    expect(result2.accepted).toBe(false);
    expect(result2.validation?.moduleErrors?.some(
      (e) => e.rule === "runOnce"
    )).toBe(true);
  });

  it("initializes baseScores for anchorable traits", () => {
    const event = createAstroOnboardingEvent();
    const result = ingestContribution(null, event);

    expect(result.accepted).toBe(true);

    // Check that anchorable traits have been initialized
    // Aries should have high adventure score
    const adventureTrait = result.state.traitStates["trait.lifestyle.adventure"];
    expect(adventureTrait).toBeDefined();
    expect(adventureTrait.baseScore).toBeGreaterThan(50); // Aries boosts adventure

    // All anchorable trait scores should be in valid range
    for (const trait of Object.values(result.state.traitStates)) {
      expect(trait.baseScore).toBeGreaterThanOrEqual(1);
      expect(trait.baseScore).toBeLessThanOrEqual(100);
      // After initial seeding, shiftZ should be 0
      expect(trait.shiftZ).toBe(0);
    }
  });

  it("stores anchor version metadata", () => {
    const event = createAstroOnboardingEvent();
    const result = ingestContribution(null, event);

    expect(result.accepted).toBe(true);
    expect(result.state.anchors.astro?.anchorVersion).toBe("astro-anchor-map.v1");
    expect(result.state.anchors.astro?.createdAt).toBeDefined();
  });

  it("applies astro markers to psyche (FLAVOR tier)", () => {
    const event = createAstroOnboardingEvent();
    const result = ingestContribution(null, event);

    expect(result.accepted).toBe(true);
    // Astro should influence psyche dimensions (at low reliability)
    expect(result.state.psycheState).toBeDefined();
  });

  it("rejects astro onboarding without sunSign", () => {
    const event: ContributionEvent = {
      specVersion: "sp.contribution.v1",
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      source: {
        vertical: "character",
        moduleId: "onboarding.astro.v1",
      },
      payload: {
        markers: [
          { id: "marker.astro.element.fire", weight: 0.1 },
        ],
        astro: {
          // Missing western.sunSign
          chinese: {
            animal: "dragon",
            element: "wood",
            yinYang: "yang",
          },
        },
      },
    };

    const result = ingestContribution(null, event);

    expect(result.accepted).toBe(false);
    expect(result.validation?.shapeErrors?.some(
      (e) => e.field.includes("sunSign")
    )).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICATION CHECKLIST TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  it("VERIFY: runOnce leaves baseScores unchanged on second attempt", () => {
    // First onboarding
    const event1 = createAstroOnboardingEvent();
    const result1 = ingestContribution(null, event1);
    expect(result1.accepted).toBe(true);

    // Save the trait baseScores from first result
    const originalTraitStates = { ...result1.state.traitStates };

    // Second onboarding attempt
    const event2 = createAstroOnboardingEvent();
    const result2 = ingestContribution(result1.state, event2);

    expect(result2.accepted).toBe(false);

    // baseScores must be IDENTICAL (not recomputed)
    for (const [traitId, trait] of Object.entries(result2.state.traitStates)) {
      expect(trait.baseScore).toBe(originalTraitStates[traitId]?.baseScore);
      expect(trait.shiftZ).toBe(originalTraitStates[traitId]?.shiftZ);
    }

    // Anchor metadata must be unchanged
    expect(result2.state.anchors.astro?.createdAt).toBe(
      result1.state.anchors.astro?.createdAt
    );
  });

  it("VERIFY: only ANCHORABLE_TRAIT_IDS are seeded, non-anchorable stay default", () => {
    const event = createAstroOnboardingEvent();
    const result = ingestContribution(null, event);

    expect(result.accepted).toBe(true);

    // All initialized traits should be in ANCHORABLE_TRAIT_IDS
    for (const traitId of Object.keys(result.state.traitStates)) {
      expect(ANCHORABLE_TRAIT_IDS.includes(traitId)).toBe(true);
    }

    // Count should match
    expect(Object.keys(result.state.traitStates).length).toBe(ANCHORABLE_TRAIT_IDS.length);
  });

  it("VERIFY: snapshot trait scores remain in 1-100 after runOnce rejection", () => {
    // First onboarding
    const event1 = createAstroOnboardingEvent();
    const result1 = ingestContribution(null, event1);

    // Second attempt (rejected)
    const event2 = createAstroOnboardingEvent();
    const result2 = ingestContribution(result1.state, event2);

    expect(result2.accepted).toBe(false);

    // Snapshot scores must still be valid 1-100
    for (const trait of Object.values(result2.snapshot.traits)) {
      expect(trait.score).toBeGreaterThanOrEqual(1);
      expect(trait.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(trait.score)).toBe(true);
    }
  });
});
