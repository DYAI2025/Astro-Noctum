/**
 * Tests for Ba Zi Calculator
 *
 * Golden Case: 1980-06-24 14:30 Berlin (52.52°N, 13.405°E)
 * - Known reference date for verification
 */

import { describe, it, expect } from "vitest";
import {
  calculateBaZi,
  calculateBaZiLegacy,
  type BaZiInput,
  type BaZiResult,
} from "../bazi";
import { BaZiChartSchema } from "../schemas";

describe("Ba Zi Calculator", () => {
  describe("calculateBaZi", () => {
    it("should calculate Ba Zi for 1980-06-24 14:30 Berlin", () => {
      const input: BaZiInput = {
        year: 1980,
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        longitude: 13.405,
        timezoneOffset: 120, // CEST (UTC+2)
      };

      const result = calculateBaZi(input);

      // Verify structure
      expect(result.chart).toBeDefined();
      expect(result.solarLongitude).toBeGreaterThan(0);
      expect(result.solarLongitude).toBeLessThan(360);
      expect(result.julianDate).toBeGreaterThan(2444000);

      // 1980 is Geng Shen (Metal Monkey) year
      // Geng = index 6, Shen = index 8
      expect(result.chart.year.stem).toBe("Geng");
      expect(result.chart.year.branch).toBe("Shen");
      expect(result.chart.year.element).toBe("Metal");
      expect(result.chart.year.polarity).toBe("Yang");
      expect(result.chart.year.animal).toBe("Monkey");

      // June 24 is in the Wu (Horse) month (around Summer Solstice)
      expect(result.chart.month.branch).toBe("Wu");

      // Day Master should exist
      expect(result.chart.dayMaster).toBeDefined();
      expect(result.chart.dayMaster.stem).toBe(result.chart.day.stem);
      expect(result.chart.dayMaster.element).toBe(result.chart.day.element);

      // Full notation should be in Chinese characters
      expect(result.chart.fullNotation).toMatch(/^[\u4e00-\u9fa5\s]+$/);
    });

    it("should handle Jan 1 2000 (J2000 epoch)", () => {
      const input: BaZiInput = {
        year: 2000,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);

      // Jan 1 2000 is before Li Chun (Feb 4ish), so it's still 1999 in Chinese calendar
      // 1999 = Ji Mao (Earth Rabbit)
      // But year 2000 starts at Li Chun, so Jan 2000 is still 1999
      expect(result.chart.year.stem).toBe("Ji");
      expect(result.chart.year.branch).toBe("Mao");
      expect(result.chart.year.animal).toBe("Rabbit");

      // Jan 1 has Sun around 280°, which is in the Rat (Zi) month (255°-285°)
      // The Ox (Chou) month starts at 285° (around Jan 6)
      expect(result.chart.month.branch).toBe("Zi");
    });

    it("should handle Jan 1 2024 (Jia Zi day)", () => {
      const input: BaZiInput = {
        year: 2024,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);

      // Jan 1 2024 is known to be Jia Zi day (Wood Rat)
      expect(result.chart.day.stem).toBe("Jia");
      expect(result.chart.day.branch).toBe("Zi");
      expect(result.chart.day.element).toBe("Wood");
      expect(result.chart.day.polarity).toBe("Yang");
    });

    it("should calculate correct solar longitude", () => {
      const input: BaZiInput = {
        year: 2024,
        month: 3,
        day: 20, // Around Spring Equinox
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);

      // Spring Equinox is around 0° (Aries ingress)
      // Should be close to 0° (within a few degrees - could be 0-5° or 355-360°)
      const isNearZero = result.solarLongitude < 5 || result.solarLongitude > 355;
      expect(isNearZero).toBe(true);
    });

    it("should validate against Zod schema", () => {
      const input: BaZiInput = {
        year: 1980,
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        longitude: 13.405,
        timezoneOffset: 120,
      };

      const result = calculateBaZi(input);

      // Validate chart against schema
      const validation = BaZiChartSchema.safeParse(result.chart);
      expect(validation.success).toBe(true);
    });
  });

  describe("Year Pillar Li Chun Logic", () => {
    it("should use previous year for dates before Li Chun", () => {
      // Feb 3, 2024 is before Li Chun (Feb 4)
      const beforeLiChun: BaZiInput = {
        year: 2024,
        month: 2,
        day: 3,
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(beforeLiChun);
      // Should still be Gui Mao (2023 = Water Rabbit)
      expect(result.chart.year.stem).toBe("Gui");
      expect(result.chart.year.branch).toBe("Mao");
    });

    it("should use current year for dates after Li Chun", () => {
      // Feb 5, 2024 is after Li Chun
      const afterLiChun: BaZiInput = {
        year: 2024,
        month: 2,
        day: 5,
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(afterLiChun);
      // Should be Jia Chen (2024 = Wood Dragon)
      expect(result.chart.year.stem).toBe("Jia");
      expect(result.chart.year.branch).toBe("Chen");
    });
  });

  describe("Five Tigers Formula (Month Pillar)", () => {
    it("should calculate correct month stem based on year stem", () => {
      // Year stem Jia (0) or Ji (5) -> Tiger month starts with Bing (2)
      const input: BaZiInput = {
        year: 1984, // Jia Zi year (stem index 0)
        month: 2,
        day: 10, // After Li Chun, in Tiger month
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);
      // Tiger month for Jia year should have Bing stem
      expect(result.chart.month.stem).toBe("Bing");
      expect(result.chart.month.branch).toBe("Yin");
    });
  });

  describe("Five Rats Formula (Hour Pillar)", () => {
    it("should calculate correct hour stem based on day stem", () => {
      // Jan 1 2024 is Jia day (stem index 0)
      // For Jia/Ji day, Rat hour starts with Jia
      const input: BaZiInput = {
        year: 2024,
        month: 1,
        day: 1,
        hour: 0, // Rat hour (23:00-01:00)
        minute: 30,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);
      // Day is Jia, so Rat hour should be Jia
      expect(result.chart.day.stem).toBe("Jia");
      expect(result.chart.hour.stem).toBe("Jia");
      expect(result.chart.hour.branch).toBe("Zi");
    });
  });

  describe("Pillar Structure", () => {
    it("should have correct stem indices (0-9)", () => {
      const input: BaZiInput = {
        year: 1980,
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        longitude: 13.405,
        timezoneOffset: 120,
      };

      const result = calculateBaZi(input);

      [result.chart.year, result.chart.month, result.chart.day, result.chart.hour].forEach(
        (pillar) => {
          expect(pillar.stemIndex).toBeGreaterThanOrEqual(0);
          expect(pillar.stemIndex).toBeLessThanOrEqual(9);
        }
      );
    });

    it("should have correct branch indices (0-11)", () => {
      const input: BaZiInput = {
        year: 1980,
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        longitude: 13.405,
        timezoneOffset: 120,
      };

      const result = calculateBaZi(input);

      [result.chart.year, result.chart.month, result.chart.day, result.chart.hour].forEach(
        (pillar) => {
          expect(pillar.branchIndex).toBeGreaterThanOrEqual(0);
          expect(pillar.branchIndex).toBeLessThanOrEqual(11);
        }
      );
    });

    it("should have Chinese characters for stems and branches", () => {
      const input: BaZiInput = {
        year: 1980,
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        longitude: 13.405,
        timezoneOffset: 120,
      };

      const result = calculateBaZi(input);

      [result.chart.year, result.chart.month, result.chart.day, result.chart.hour].forEach(
        (pillar) => {
          expect(pillar.stemCN).toMatch(/^[\u4e00-\u9fa5]$/);
          expect(pillar.branchCN).toMatch(/^[\u4e00-\u9fa5]$/);
        }
      );
    });
  });

  describe("calculateBaZiLegacy (backwards compatibility)", () => {
    it("should produce same result as new function", () => {
      const input: BaZiInput = {
        year: 1980,
        month: 6,
        day: 24,
        hour: 14,
        minute: 30,
        longitude: 13.405,
        timezoneOffset: 120,
      };

      const newResult = calculateBaZi(input);
      const legacyResult = calculateBaZiLegacy(
        input.year,
        input.month,
        input.day,
        input.hour,
        input.minute,
        input.longitude,
        input.timezoneOffset
      );

      expect(legacyResult.year.stem).toBe(newResult.chart.year.stem);
      expect(legacyResult.month.stem).toBe(newResult.chart.month.stem);
      expect(legacyResult.day.stem).toBe(newResult.chart.day.stem);
      expect(legacyResult.hour.stem).toBe(newResult.chart.hour.stem);
    });

    it("should accept optional sunLongitude parameter", () => {
      const legacyResult = calculateBaZiLegacy(
        1980,
        6,
        24,
        14,
        30,
        13.405,
        120,
        92.5 // Known sun longitude for this date
      );

      expect(legacyResult.year).toBeDefined();
      expect(legacyResult.month).toBeDefined();
      expect(legacyResult.day).toBeDefined();
      expect(legacyResult.hour).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle midnight correctly", () => {
      const input: BaZiInput = {
        year: 2024,
        month: 1,
        day: 1,
        hour: 23,
        minute: 30,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);

      // 23:30 is Early Rat hour (Zi)
      expect(result.chart.hour.branch).toBe("Zi");
    });

    it("should handle December dates correctly", () => {
      const input: BaZiInput = {
        year: 2023,
        month: 12,
        day: 22, // Winter Solstice
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);

      // Should be 2023 year, Zi (Rat) month
      expect(result.chart.year.branch).toBe("Mao"); // 2023 is Rabbit
      expect(result.chart.month.branch).toBe("Zi"); // Winter Solstice month
    });

    it("should handle leap year Feb 29", () => {
      const input: BaZiInput = {
        year: 2024,
        month: 2,
        day: 29,
        hour: 12,
        minute: 0,
        longitude: 0,
        timezoneOffset: 0,
      };

      const result = calculateBaZi(input);

      // Should calculate without error
      expect(result.chart.day.stem).toBeDefined();
      expect(result.chart.day.branch).toBeDefined();
    });

    it("should handle negative timezone offset", () => {
      const input: BaZiInput = {
        year: 2024,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        longitude: -122, // San Francisco
        timezoneOffset: -480, // PST (UTC-8)
      };

      const result = calculateBaZi(input);

      expect(result.chart).toBeDefined();
      expect(result.solarLongitude).toBeGreaterThan(0);
    });
  });
});
