/**
 * Tests for East-West Fusion Calculator
 */

import { describe, it, expect } from "vitest";
import { calculateFusion } from "../fusion";
import { type BaZiChart, type Planets, FusionResultSchema } from "../schemas";

// Test fixture: Golden Case 1980-06-24 Ba Zi chart
const goldenBaZiChart: BaZiChart = {
  year: {
    stem: "Geng",
    stemCN: "庚",
    branch: "Shen",
    branchCN: "申",
    element: "Metal",
    polarity: "Yang",
    animal: "Monkey",
    animalDE: "Affe",
    stemIndex: 6,
    branchIndex: 8,
  },
  month: {
    stem: "Ren",
    stemCN: "壬",
    branch: "Wu",
    branchCN: "午",
    element: "Water",
    polarity: "Yang",
    animal: "Horse",
    animalDE: "Pferd",
    stemIndex: 8,
    branchIndex: 6,
  },
  day: {
    stem: "Jia",
    stemCN: "甲",
    branch: "Chen",
    branchCN: "辰",
    element: "Wood",
    polarity: "Yang",
    animal: "Dragon",
    animalDE: "Drache",
    stemIndex: 0,
    branchIndex: 4,
  },
  hour: {
    stem: "Xin",
    stemCN: "辛",
    branch: "Wei",
    branchCN: "未",
    element: "Metal",
    polarity: "Yin",
    animal: "Goat",
    animalDE: "Ziege",
    stemIndex: 7,
    branchIndex: 7,
  },
  dayMaster: {
    stem: "Jia",
    stemCN: "甲",
    element: "Wood",
    polarity: "Yang",
  },
  fullNotation: "庚申 壬午 甲辰 辛未",
};

// Test fixture: Minimal planets (Sun and Moon only)
const minimalPlanets: Planets = {
  Sun: { longitude: 92.5 }, // Cancer
  Moon: { longitude: 215.3 }, // Scorpio
};

// Test fixture: Full planets with signs
const fullPlanets: Planets = {
  Sun: { longitude: 92.5, sign: "cancer" },
  Moon: { longitude: 215.3, sign: "scorpio" },
  Mercury: { longitude: 78.2, sign: "gemini" },
  Venus: { longitude: 105.4, sign: "cancer" },
  Mars: { longitude: 142.8, sign: "leo" },
  Jupiter: { longitude: 175.6, sign: "virgo" },
  Saturn: { longitude: 155.2, sign: "virgo" },
};

describe("Fusion Calculator", () => {
  describe("calculateFusion", () => {
    it("should calculate fusion with minimal planets", () => {
      const result = calculateFusion(goldenBaZiChart, minimalPlanets);

      // Check structure
      expect(result.elementVector).toBeDefined();
      expect(result.elementVector.combined).toHaveLength(5);
      expect(result.elementVector.eastern).toHaveLength(5);
      expect(result.elementVector.western).toHaveLength(5);
      expect(result.harmonyIndex).toBeGreaterThanOrEqual(0);
      expect(result.harmonyIndex).toBeLessThanOrEqual(1);
      expect(result.resonances).toBeInstanceOf(Array);
    });

    it("should normalize element vectors to sum to 1", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      const sumCombined = result.elementVector.combined.reduce((a, b) => a + b, 0);
      const sumEastern = result.elementVector.eastern.reduce((a, b) => a + b, 0);
      const sumWestern = result.elementVector.western.reduce((a, b) => a + b, 0);

      expect(sumCombined).toBeCloseTo(1.0, 5);
      expect(sumEastern).toBeCloseTo(1.0, 5);
      expect(sumWestern).toBeCloseTo(1.0, 5);
    });

    it("should identify dominant and deficient elements", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      expect(result.elementVector.dominantElement).toBeDefined();
      expect(result.elementVector.deficientElement).toBeDefined();
      expect(["Wood", "Fire", "Earth", "Metal", "Water"]).toContain(
        result.elementVector.dominantElement
      );
      expect(["Wood", "Fire", "Earth", "Metal", "Water"]).toContain(
        result.elementVector.deficientElement
      );
    });

    it("should provide German element names", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      expect(result.elementVector.dominantElementDE).toBeDefined();
      expect(result.elementVector.deficientElementDE).toBeDefined();
      expect(["Holz", "Feuer", "Erde", "Metall", "Wasser"]).toContain(
        result.elementVector.dominantElementDE
      );
    });

    it("should validate against Zod schema", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);
      const validation = FusionResultSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });
  });

  describe("Harmony Index", () => {
    it("should return harmony index between 0 and 1", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      expect(result.harmonyIndex).toBeGreaterThanOrEqual(0);
      expect(result.harmonyIndex).toBeLessThanOrEqual(1);
    });

    it("should provide harmony interpretation in German", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      const validInterpretations = [
        "Sehr hohe Kohärenz",
        "Gute Kohärenz",
        "Moderate Kohärenz",
        "Dynamische Spannung",
      ];

      expect(validInterpretations).toContain(result.harmonyInterpretation);
    });
  });

  describe("Resonances", () => {
    it("should calculate Sun-DayMaster resonance when Sun sign available", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      const sunResonance = result.resonances.find((r) => r.type === "Sun-DayMaster");
      expect(sunResonance).toBeDefined();
      expect(sunResonance?.eastern).toBe("Wood"); // Day Master is Jia (Wood)
      expect(sunResonance?.western).toContain("cancer");
      expect(sunResonance?.strength).toBeGreaterThan(0);
      expect(["harmony", "tension", "neutral"]).toContain(sunResonance?.quality);
    });

    it("should calculate Moon-HourPillar resonance", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      const moonResonance = result.resonances.find((r) => r.type === "Moon-HourPillar");
      expect(moonResonance).toBeDefined();
      expect(moonResonance?.eastern).toBe("Metal"); // Hour Pillar Xin is Metal
      expect(moonResonance?.western).toContain("scorpio");
    });

    it("should not include resonance for missing planets", () => {
      const result = calculateFusion(goldenBaZiChart, minimalPlanets);

      // Minimal planets don't have signs, so no resonances should be calculated
      expect(result.resonances.length).toBe(0);
    });

    it("should include description for each resonance", () => {
      const result = calculateFusion(goldenBaZiChart, fullPlanets);

      result.resonances.forEach((resonance) => {
        expect(resonance.description).toBeDefined();
        expect(resonance.description?.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Element Vector Calculations", () => {
    it("should weight Day Master (dayStem) highest in Ba Zi vector", () => {
      // Create a chart with all same stems except day
      const testChart: BaZiChart = {
        ...goldenBaZiChart,
        year: { ...goldenBaZiChart.year, stemIndex: 0, element: "Wood" }, // Jia
        month: { ...goldenBaZiChart.month, stemIndex: 0, element: "Wood" }, // Jia
        day: { ...goldenBaZiChart.day, stemIndex: 2, element: "Fire" }, // Bing
        hour: { ...goldenBaZiChart.hour, stemIndex: 0, element: "Wood" }, // Jia
      };

      const result = calculateFusion(testChart, minimalPlanets);

      // Fire should have significant presence due to Day Master weight
      const fireIndex = 1;
      expect(result.elementVector.eastern[fireIndex]).toBeGreaterThan(0);
    });

    it("should include both stems and branches in calculation", () => {
      const result = calculateFusion(goldenBaZiChart, minimalPlanets);

      // Eastern vector should have non-zero values for multiple elements
      const nonZeroCount = result.elementVector.eastern.filter((v) => v > 0.05).length;
      expect(nonZeroCount).toBeGreaterThan(1);
    });
  });

  describe("Wu Xing Cycles", () => {
    it("should detect harmony for same elements", () => {
      // Create chart where Day Master is Fire
      const fireChart: BaZiChart = {
        ...goldenBaZiChart,
        day: { ...goldenBaZiChart.day, stemIndex: 2, element: "Fire" },
        dayMaster: { ...goldenBaZiChart.dayMaster, stem: "Bing", element: "Fire" },
      };

      // Sun in Leo (Fire sign)
      const firePlanets: Planets = {
        Sun: { longitude: 125, sign: "leo" },
        Moon: { longitude: 45 },
      };

      const result = calculateFusion(fireChart, firePlanets);
      const sunResonance = result.resonances.find((r) => r.type === "Sun-DayMaster");

      expect(sunResonance?.quality).toBe("harmony");
      expect(sunResonance?.strength).toBe(1.0);
    });

    it("should detect generating cycle harmony", () => {
      // Wood generates Fire
      const woodChart: BaZiChart = {
        ...goldenBaZiChart,
        dayMaster: { ...goldenBaZiChart.dayMaster, element: "Wood" },
      };

      // Sun in Leo (Fire sign)
      const firePlanets: Planets = {
        Sun: { longitude: 125, sign: "leo" },
        Moon: { longitude: 45 },
      };

      const result = calculateFusion(woodChart, firePlanets);
      const sunResonance = result.resonances.find((r) => r.type === "Sun-DayMaster");

      expect(sunResonance?.quality).toBe("harmony");
      expect(sunResonance?.strength).toBe(0.7);
    });

    it("should detect controlling cycle tension", () => {
      // Water controls Fire
      const waterChart: BaZiChart = {
        ...goldenBaZiChart,
        day: { ...goldenBaZiChart.day, stemIndex: 8, element: "Water" },
        dayMaster: { ...goldenBaZiChart.dayMaster, stem: "Ren", element: "Water" },
      };

      // Sun in Leo (Fire sign)
      const firePlanets: Planets = {
        Sun: { longitude: 125, sign: "leo" },
        Moon: { longitude: 45 },
      };

      const result = calculateFusion(waterChart, firePlanets);
      const sunResonance = result.resonances.find((r) => r.type === "Sun-DayMaster");

      expect(sunResonance?.quality).toBe("tension");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty planets gracefully", () => {
      const emptyPlanets: Planets = {
        Sun: { longitude: 0 },
        Moon: { longitude: 0 },
      };

      const result = calculateFusion(goldenBaZiChart, emptyPlanets);

      expect(result.elementVector.western).toHaveLength(5);
      expect(result.harmonyIndex).toBeDefined();
    });

    it("should handle all planets present", () => {
      const allPlanets: Planets = {
        Sun: { longitude: 45, sign: "taurus" },
        Moon: { longitude: 90, sign: "cancer" },
        Mercury: { longitude: 60, sign: "gemini" },
        Venus: { longitude: 30, sign: "taurus" },
        Mars: { longitude: 120, sign: "leo" },
        Jupiter: { longitude: 180, sign: "libra" },
        Saturn: { longitude: 270, sign: "capricorn" },
        Uranus: { longitude: 300, sign: "aquarius" },
        Neptune: { longitude: 330, sign: "pisces" },
        Pluto: { longitude: 270, sign: "capricorn" },
      };

      const result = calculateFusion(goldenBaZiChart, allPlanets);

      expect(result.elementVector.western).toHaveLength(5);
      // Should have multiple resonances
      expect(result.resonances.length).toBeGreaterThan(3);
    });
  });
});
