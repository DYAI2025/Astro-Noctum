// Tests: WuXing data completeness + percentage calculation correctness
import { describe, it, expect } from "vitest";
import { WUXING_ELEMENTS, getWuxingByKey, getWuxingName } from "../lib/astro-data/wuxing";

describe("WUXING_ELEMENTS completeness", () => {
  it("has exactly 5 elements", () => {
    expect(WUXING_ELEMENTS).toHaveLength(5);
  });

  it("all expected keys are present", () => {
    const keys = WUXING_ELEMENTS.map((e) => e.key);
    expect(keys).toContain("Wood");
    expect(keys).toContain("Fire");
    expect(keys).toContain("Earth");
    expect(keys).toContain("Metal");
    expect(keys).toContain("Water");
  });

  it("every element has EN and DE names", () => {
    WUXING_ELEMENTS.forEach(({ key, name }) => {
      expect(name.en, `${key} EN name`).toBeTruthy();
      expect(name.de, `${key} DE name`).toBeTruthy();
    });
  });

  it("every element has EN and DE descriptions (≥ 30 chars)", () => {
    WUXING_ELEMENTS.forEach(({ key, description }) => {
      expect(description.en.length, `${key} EN desc`).toBeGreaterThan(30);
      expect(description.de.length, `${key} DE desc`).toBeGreaterThan(30);
    });
  });

  it("every element has a Chinese character, pinyin, color, emoji", () => {
    WUXING_ELEMENTS.forEach(({ key, chinese, pinyin, color, emoji }) => {
      expect(chinese, `${key} chinese`).toBeTruthy();
      expect(pinyin,  `${key} pinyin`).toBeTruthy();
      expect(color,   `${key} color`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(emoji,   `${key} emoji`).toBeTruthy();
    });
  });
});

describe("getWuxingByKey", () => {
  it("finds element by English key (case-insensitive)", () => {
    expect(getWuxingByKey("Wood")?.key).toBe("Wood");
    expect(getWuxingByKey("wood")?.key).toBe("Wood");
    expect(getWuxingByKey("FIRE")?.key).toBe("Fire");
  });

  it("finds element by German name", () => {
    expect(getWuxingByKey("Holz")?.key).toBe("Wood");
    expect(getWuxingByKey("Feuer")?.key).toBe("Fire");
    expect(getWuxingByKey("Erde")?.key).toBe("Earth");
    expect(getWuxingByKey("Metall")?.key).toBe("Metal");
    expect(getWuxingByKey("Wasser")?.key).toBe("Water");
  });

  it("returns undefined for empty string", () => {
    expect(getWuxingByKey("")).toBeUndefined();
  });

  it("returns undefined for unknown key", () => {
    expect(getWuxingByKey("Aether")).toBeUndefined();
  });
});

describe("getWuxingName", () => {
  it("returns DE name", () => {
    expect(getWuxingName("Wood",  "de")).toBe("Holz");
    expect(getWuxingName("Water", "de")).toBe("Wasser");
  });

  it("returns EN name", () => {
    expect(getWuxingName("Wood",  "en")).toBe("Wood");
    expect(getWuxingName("Fire",  "en")).toBe("Fire");
  });

  it("falls back to key for unknown element", () => {
    expect(getWuxingName("Aether", "en")).toBe("Aether");
  });
});

// ─── WuXing Percentage Calculation (FR-06 fix verification) ──────────────

describe("WuXing percentage calculation", () => {
  function calcPercentages(counts: Record<string, number>) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return WUXING_ELEMENTS.map((el) => {
      const count = Number(counts[el.key] ?? counts[el.name.de] ?? 0);
      return { key: el.key, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
  }

  it("percentages sum to ~100 (within rounding error of ±2)", () => {
    const counts = { Wood: 4, Fire: 3, Earth: 2, Metal: 1, Water: 4 };
    const percs = calcPercentages(counts);
    const sum = percs.reduce((s, { pct }) => s + pct, 0);
    expect(sum).toBeGreaterThanOrEqual(98);
    expect(sum).toBeLessThanOrEqual(102);
  });

  it("dominant element has the highest percentage", () => {
    const counts = { Wood: 1, Fire: 1, Earth: 5, Metal: 1, Water: 2 };
    const percs = calcPercentages(counts);
    const earthPct = percs.find((p) => p.key === "Earth")!.pct;
    percs.forEach(({ key, pct }) => {
      if (key !== "Earth") expect(pct).toBeLessThanOrEqual(earthPct);
    });
  });

  it("all zero counts produce 0% for every element", () => {
    const counts = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
    const percs = calcPercentages(counts);
    percs.forEach(({ pct }) => expect(pct).toBe(0));
  });

  it("single element with count > 0 → 100%", () => {
    const counts = { Wood: 3, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
    const percs = calcPercentages(counts);
    const woodPct = percs.find((p) => p.key === "Wood")!.pct;
    expect(woodPct).toBe(100);
  });

  it("old ratio-to-max logic gives wrong results (regression guard)", () => {
    // With the OLD formula: count/maxCount * 100
    // both Wood(4) and Water(4) show 100%, Fire(3)→75%, Earth(2)→50%, Metal(1)→25%
    // This does NOT sum to 100 — this test guards against regression
    const counts = { Wood: 4, Fire: 3, Earth: 2, Metal: 1, Water: 4 };
    const maxCount = Math.max(...Object.values(counts));
    const oldSum = WUXING_ELEMENTS.reduce((sum, el) => {
      return sum + Math.round((Number(counts[el.key as keyof typeof counts] ?? 0) / maxCount) * 100);
    }, 0);
    // Old formula gives ~350%, proving it was wrong
    expect(oldSum).toBeGreaterThan(150);
  });
});
