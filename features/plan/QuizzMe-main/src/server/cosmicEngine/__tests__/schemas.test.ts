/**
 * Tests for Zod Schemas
 */

import { describe, it, expect } from "vitest";
import {
  BirthInputSchema,
  BaZiPillarSchema,
  BaZiChartSchema,
  PlanetPositionSchema,
  PlanetsSchema,
  FusionResultSchema,
  AstroProfileV1Schema,
  parseBirthInput,
  parseBaZiChart,
  isValidStem,
  isValidBranch,
  isValidWuXing,
  type BirthInput,
  type BaZiPillar,
} from "../schemas";

describe("Zod Schemas", () => {
  describe("BirthInputSchema", () => {
    it("should validate correct birth input", () => {
      const input = {
        year: 1980,
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        second: 0,
        latitude: 52.52,
        longitude: 13.405,
        timezone: "Europe/Berlin",
        houseSystem: "P" as const,
      };

      const result = BirthInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid month", () => {
      const input = {
        year: 1980,
        month: 13, // Invalid
        day: 24,
        hour: 14,
        minute: 30,
        latitude: 52.52,
        longitude: 13.405,
        timezone: "Europe/Berlin",
      };

      const result = BirthInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject year out of range", () => {
      const input = {
        year: 1500, // Too old
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        latitude: 52.52,
        longitude: 13.405,
        timezone: "Europe/Berlin",
      };

      const result = BirthInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should provide default values", () => {
      const input = {
        year: 2000,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        latitude: 0,
        longitude: 0,
        timezone: "UTC",
      };

      const result = parseBirthInput(input);
      expect(result.second).toBe(0);
      expect(result.houseSystem).toBe("P");
    });
  });

  describe("BaZiPillarSchema", () => {
    it("should validate correct pillar", () => {
      const pillar: BaZiPillar = {
        stem: "Jia",
        stemCN: "甲",
        branch: "Zi",
        branchCN: "子",
        element: "Wood",
        polarity: "Yang",
        animal: "Rat",
        animalDE: "Ratte",
        stemIndex: 0,
        branchIndex: 0,
      };

      const result = BaZiPillarSchema.safeParse(pillar);
      expect(result.success).toBe(true);
    });

    it("should reject invalid stem", () => {
      const pillar = {
        stem: "InvalidStem",
        stemCN: "甲",
        branch: "Zi",
        branchCN: "子",
        element: "Wood",
        polarity: "Yang",
        stemIndex: 0,
        branchIndex: 0,
      };

      const result = BaZiPillarSchema.safeParse(pillar);
      expect(result.success).toBe(false);
    });

    it("should reject stemIndex out of range", () => {
      const pillar = {
        stem: "Jia",
        stemCN: "甲",
        branch: "Zi",
        branchCN: "子",
        element: "Wood",
        polarity: "Yang",
        stemIndex: 15, // Invalid
        branchIndex: 0,
      };

      const result = BaZiPillarSchema.safeParse(pillar);
      expect(result.success).toBe(false);
    });
  });

  describe("BaZiChartSchema", () => {
    const validPillar: BaZiPillar = {
      stem: "Jia",
      stemCN: "甲",
      branch: "Zi",
      branchCN: "子",
      element: "Wood",
      polarity: "Yang",
      animal: "Rat",
      stemIndex: 0,
      branchIndex: 0,
    };

    it("should validate complete chart", () => {
      const chart = {
        year: validPillar,
        month: { ...validPillar, stem: "Yi" as const, stemIndex: 1 },
        day: { ...validPillar, stem: "Bing" as const, stemIndex: 2 },
        hour: { ...validPillar, stem: "Ding" as const, stemIndex: 3 },
        dayMaster: {
          stem: "Bing" as const,
          stemCN: "丙",
          element: "Fire" as const,
          polarity: "Yang" as const,
        },
        fullNotation: "甲子 乙子 丙子 丁子",
      };

      const result = BaZiChartSchema.safeParse(chart);
      expect(result.success).toBe(true);
    });
  });

  describe("PlanetPositionSchema", () => {
    it("should validate planet position", () => {
      const planet = {
        longitude: 45.5,
        latitude: 1.2,
        distance: 1.0,
        speed: 0.98,
        retrograde: false,
        sign: "taurus" as const,
        signDegree: 15.5,
        house: 2,
      };

      const result = PlanetPositionSchema.safeParse(planet);
      expect(result.success).toBe(true);
    });

    it("should reject longitude out of range", () => {
      const planet = {
        longitude: 400, // Invalid
      };

      const result = PlanetPositionSchema.safeParse(planet);
      expect(result.success).toBe(false);
    });
  });

  describe("PlanetsSchema", () => {
    it("should require Sun and Moon", () => {
      const planets = {
        Sun: { longitude: 90 },
        Moon: { longitude: 180 },
      };

      const result = PlanetsSchema.safeParse(planets);
      expect(result.success).toBe(true);
    });

    it("should fail without Sun", () => {
      const planets = {
        Moon: { longitude: 180 },
      };

      const result = PlanetsSchema.safeParse(planets);
      expect(result.success).toBe(false);
    });
  });

  describe("FusionResultSchema", () => {
    it("should validate fusion result", () => {
      const fusion = {
        elementVector: {
          combined: [0.2, 0.2, 0.2, 0.2, 0.2] as [number, number, number, number, number],
          eastern: [0.25, 0.25, 0.2, 0.15, 0.15] as [number, number, number, number, number],
          western: [0.15, 0.15, 0.2, 0.25, 0.25] as [number, number, number, number, number],
          dominantElement: "Wood" as const,
          dominantElementDE: "Holz" as const,
          deficientElement: "Water" as const,
          deficientElementDE: "Wasser" as const,
        },
        harmonyIndex: 0.75,
        harmonyInterpretation: "Gute Kohärenz",
        resonances: [],
      };

      const result = FusionResultSchema.safeParse(fusion);
      expect(result.success).toBe(true);
    });

    it("should validate with resonances", () => {
      const fusion = {
        elementVector: {
          combined: [0.2, 0.2, 0.2, 0.2, 0.2] as [number, number, number, number, number],
          eastern: [0.2, 0.2, 0.2, 0.2, 0.2] as [number, number, number, number, number],
          western: [0.2, 0.2, 0.2, 0.2, 0.2] as [number, number, number, number, number],
          dominantElement: "Fire" as const,
          dominantElementDE: "Feuer" as const,
          deficientElement: "Metal" as const,
          deficientElementDE: "Metall" as const,
        },
        harmonyIndex: 0.85,
        harmonyInterpretation: "Sehr hohe Kohärenz",
        resonances: [
          {
            type: "Sun-DayMaster",
            eastern: "Fire",
            western: "Leo",
            strength: 0.9,
            quality: "harmony" as const,
            description: "Strong alignment between Sun sign and Day Master element",
          },
        ],
      };

      const result = FusionResultSchema.safeParse(fusion);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Guards", () => {
    it("isValidStem should work correctly", () => {
      expect(isValidStem("Jia")).toBe(true);
      expect(isValidStem("Yi")).toBe(true);
      expect(isValidStem("Invalid")).toBe(false);
      expect(isValidStem(123)).toBe(false);
    });

    it("isValidBranch should work correctly", () => {
      expect(isValidBranch("Zi")).toBe(true);
      expect(isValidBranch("Chou")).toBe(true);
      expect(isValidBranch("Invalid")).toBe(false);
    });

    it("isValidWuXing should work correctly", () => {
      expect(isValidWuXing("Wood")).toBe(true);
      expect(isValidWuXing("Fire")).toBe(true);
      expect(isValidWuXing("Holz")).toBe(false); // German, not English
    });
  });

  describe("AstroProfileV1Schema", () => {
    it("should validate minimal complete profile", () => {
      const validPillar = {
        stem: "Jia" as const,
        stemCN: "甲",
        branch: "Zi" as const,
        branchCN: "子",
        element: "Wood" as const,
        polarity: "Yang" as const,
        stemIndex: 0,
        branchIndex: 0,
      };

      const profile = {
        version: "1.0" as const,
        input: {
          year: 1980,
          month: 6,
          day: 24,
          hour: 14,
          minute: 30,
          second: 0,
          latitude: 52.52,
          longitude: 13.405,
          timezone: "Europe/Berlin",
          houseSystem: "P" as const,
        },
        bazi: {
          year: validPillar,
          month: validPillar,
          day: validPillar,
          hour: validPillar,
          dayMaster: {
            stem: "Jia" as const,
            stemCN: "甲",
            element: "Wood" as const,
            polarity: "Yang" as const,
          },
          fullNotation: "甲子 甲子 甲子 甲子",
        },
        western: {
          planets: {
            Sun: { longitude: 90 },
            Moon: { longitude: 180 },
          },
        },
        fusion: {
          elementVector: {
            combined: [0.2, 0.2, 0.2, 0.2, 0.2] as [number, number, number, number, number],
            eastern: [0.2, 0.2, 0.2, 0.2, 0.2] as [number, number, number, number, number],
            western: [0.2, 0.2, 0.2, 0.2, 0.2] as [number, number, number, number, number],
            dominantElement: "Wood" as const,
            dominantElementDE: "Holz" as const,
            deficientElement: "Water" as const,
            deficientElementDE: "Wasser" as const,
          },
          harmonyIndex: 0.7,
          harmonyInterpretation: "Gute Kohärenz",
          resonances: [],
        },
        audit: {
          utcOffsetMinutes: 120,
          timezone: "Europe/Berlin",
          calculatedAt: new Date().toISOString(),
          hybrid: true,
        },
      };

      const result = AstroProfileV1Schema.safeParse(profile);
      if (!result.success) {
        console.error(result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });
});
