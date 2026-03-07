/**
 * Contribute Service Tests
 *
 * Phase 4 acceptance criteria:
 * 1. POST /api/contribute accepts valid ContributionEvent and returns { accepted, snapshot }
 * 2. GET /api/profile/snapshot returns same snapshot after persistence
 * 3. Snapshot scores stay 1..100 under repeated events
 * 4. Invalid IDs or schema cause rejected response (not crash)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { contribute, getSnapshot, Stores } from "../contribute-service";
import { MemoryProfileStateStore, MemoryEventStore } from "@/lib/storage";
import { ContributionEvent } from "@/lib/lme/types";

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
      markers: [{ id: "marker.eq.empathy", weight: 0.7 }],
      ...overrides.payload,
    },
    ...overrides,
  };
}

function createStores(): Stores & {
  profiles: MemoryProfileStateStore;
  events: MemoryEventStore;
} {
  return {
    profiles: new MemoryProfileStateStore(),
    events: new MemoryEventStore(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCEPTANCE CRITERIA TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Contribute Service", () => {
  let stores: ReturnType<typeof createStores>;

  beforeEach(() => {
    stores = createStores();
  });

  describe("contribute()", () => {
    it("accepts valid ContributionEvent and returns { accepted, snapshot }", async () => {
      const event = createValidEvent();

      const result = await contribute(stores, {
        userId: "test-user",
        event,
      });

      expect(result.accepted).toBe(true);
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot.meta).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("persists state and returns consistent snapshot on GET", async () => {
      const event = createValidEvent({
        payload: {
          markers: [{ id: "marker.eq.empathy", weight: 0.8 }],
          traits: [{ id: "trait.eq.empathy", score: 75, confidence: 0.8 }],
        },
      });

      // POST event
      const postResult = await contribute(stores, {
        userId: "test-user",
        event,
      });

      expect(postResult.accepted).toBe(true);

      // GET snapshot
      const getResult = await getSnapshot(stores.profiles, "test-user");

      // Snapshot should match
      expect(getResult.isNew).toBe(false);
      expect(getResult.snapshot.meta.lastUpdatedAt).toBe(
        postResult.snapshot.meta.lastUpdatedAt
      );
    });

    it("keeps snapshot scores 1-100 under repeated events", async () => {
      const userId = "stress-test-user";

      // Send many events with extreme values
      for (let i = 0; i < 20; i++) {
        const event = createValidEvent({
          payload: {
            markers: [
              { id: "marker.eq.empathy", weight: 1.0 },
              { id: "marker.social.extroversion", weight: 1.0 },
            ],
            traits: [
              { id: "trait.eq.empathy", score: 100, confidence: 1.0 },
            ],
          },
        });

        const result = await contribute(stores, { userId, event });
        expect(result.accepted).toBe(true);

        // Check all trait scores are bounded
        for (const [, trait] of Object.entries(result.snapshot.traits)) {
          expect(trait.score).toBeGreaterThanOrEqual(1);
          expect(trait.score).toBeLessThanOrEqual(100);
          expect(Number.isInteger(trait.score)).toBe(true);
        }
      }
    });

    it("rejects invalid event with accepted=false (not crash)", async () => {
      const invalidEvent = {
        specVersion: "sp.contribution.v1",
        eventId: "test",
        occurredAt: new Date().toISOString(),
        source: { vertical: "quiz", moduleId: "quiz.test.v1" },
        payload: {
          markers: [{ id: "marker.invalid.nonexistent", weight: 0.5 }],
        },
      };

      const result = await contribute(stores, {
        userId: "test-user",
        event: invalidEvent,
      });

      expect(result.accepted).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.validation?.valid).toBe(false);
    });

    it("rejects event with invalid schema (missing markers)", async () => {
      const invalidEvent = {
        specVersion: "sp.contribution.v1",
        eventId: "test",
        occurredAt: new Date().toISOString(),
        source: { vertical: "quiz", moduleId: "quiz.test.v1" },
        payload: {
          // markers missing!
        },
      };

      const result = await contribute(stores, {
        userId: "test-user",
        event: invalidEvent,
      });

      expect(result.accepted).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("appends to event audit log", async () => {
      const event = createValidEvent();

      await contribute(stores, { userId: "audit-test", event });

      // Wait a tick for async audit append
      await new Promise((r) => setTimeout(r, 10));

      const events = await stores.events.list("audit-test");
      expect(events.length).toBe(1);
      expect(events[0].event.eventId).toBe(event.eventId);
      expect(events[0].accepted).toBe(true);
    });
  });

  describe("getSnapshot()", () => {
    it("returns isNew=true for new user", async () => {
      const result = await getSnapshot(stores.profiles, "brand-new-user");

      expect(result.isNew).toBe(true);
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot.meta.completion.percent).toBe(0);
    });

    it("returns isNew=false for existing user", async () => {
      // First, create a profile via contribute
      await contribute(stores, {
        userId: "existing-user",
        event: createValidEvent(),
      });

      // Then get snapshot
      const result = await getSnapshot(stores.profiles, "existing-user");

      expect(result.isNew).toBe(false);
    });
  });

  describe("Multiple users isolation", () => {
    it("isolates data between users", async () => {
      const event1 = createValidEvent({
        payload: {
          markers: [{ id: "marker.eq.empathy", weight: 0.9 }],
          traits: [{ id: "trait.eq.empathy", score: 90 }],
        },
      });

      const event2 = createValidEvent({
        payload: {
          markers: [{ id: "marker.eq.empathy", weight: 0.1 }],
          traits: [{ id: "trait.eq.empathy", score: 10 }],
        },
      });

      await contribute(stores, { userId: "user-A", event: event1 });
      await contribute(stores, { userId: "user-B", event: event2 });

      const snapshotA = await getSnapshot(stores.profiles, "user-A");
      const snapshotB = await getSnapshot(stores.profiles, "user-B");

      // Users should have different trait scores
      const traitA = snapshotA.snapshot.traits["trait.eq.empathy"];
      const traitB = snapshotB.snapshot.traits["trait.eq.empathy"];

      expect(traitA).toBeDefined();
      expect(traitB).toBeDefined();
      // A should have higher score than B (based on observations)
      expect(traitA.score).toBeGreaterThan(traitB.score);
    });
  });
});
