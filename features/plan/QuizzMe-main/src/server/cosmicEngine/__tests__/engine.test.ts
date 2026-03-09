/**
 * Tests for CosmicEngine Loading Logic
 *
 * Tests the singleton engine loader with various configurations:
 * - Local Python engine
 * - Cloud engine fallback
 * - Mock engine fallback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { BirthInput, AstroProfileV1 } from "../schemas";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock the fusionSign module
vi.mock("../fusionSign", () => ({
  generateFusionSign: vi.fn().mockReturnValue(undefined),
}));

// Mock the astronomy-utils module
vi.mock("../astronomy-utils", () => ({
  getWesternZodiacSign: vi.fn().mockReturnValue("cancer"),
  STEM_ELEMENT_INDEX: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4],
  BRANCH_FIXED_ELEMENT_INDEX: [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4],
  WU_XING: ["Wood", "Fire", "Earth", "Metal", "Water"],
  WU_XING_DE: ["Holz", "Feuer", "Erde", "Metall", "Wasser"],
  STEMS_CN: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
  BRANCHES_CN: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
  ZODIAC_ANIMALS_DE: [
    "Ratte",
    "Büffel",
    "Tiger",
    "Hase",
    "Drache",
    "Schlange",
    "Pferd",
    "Ziege",
    "Affe",
    "Hahn",
    "Hund",
    "Schwein",
  ],
  SOLAR_MONTH_START_LONS: [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285],
  calculateTrueSolarTime: vi.fn().mockReturnValue(720),
  normalizeDeg: (deg: number) => ((deg % 360) + 360) % 360,
}));

// Define the mock factory for the engine dependency
const mockCreateEngine = vi.fn();

// Intercept the `createRequire` call used in engine.ts
vi.mock("module", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createRequire: () => {
      const requireMock = (id: string) => {
        if (id === "cosmic-architecture-engine") {
          return { createEngine: mockCreateEngine };
        }
        if (id === "path") return require("path");
        return {};
      };
      requireMock.resolve = (id: string) => {
        if (id === "cosmic-architecture-engine") return "/mock/path/index.js";
        return "";
      };
      return requireMock;
    },
  };
});

// Test fixture: Valid birth input
const validInput: BirthInput = {
  year: 1980,
  month: 6,
  day: 24,
  hour: 14,
  minute: 30,
  second: 0,
  latitude: 52.52,
  longitude: 13.405,
  timezone: "Europe/Berlin",
  houseSystem: "P",
};

// Mock result structure
const createMockResult = (source: string): Partial<AstroProfileV1> => ({
  version: "1.0",
  audit: {
    utcOffsetMinutes: 0,
    timezone: "UTC",
    calculatedAt: new Date().toISOString(),
    hybrid: source === "hybrid",
    engineVersion: source,
  },
});

describe("CosmicEngine Loading Logic", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    mockCreateEngine.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("attempts to load real engine and gracefully falls back when missing", { timeout: 15000 }, async () => {
    // Mock the fallback engine
    vi.doMock("../cosmic-fallback", () => ({
      createMockEngine: vi.fn().mockReturnValue({
        calculateProfile: vi.fn().mockResolvedValue({
          planets: { Sun: { longitude: 92 }, Moon: { longitude: 215 } },
          audit: { utc_offset_minutes: 120 },
        }),
      }),
    }));

    const { getCosmicEngine } = await import("../engine");
    const engine = await getCosmicEngine();
    const result = await engine.calculateProfile(validInput);

    // Should return AstroProfileV1 structure
    expect(result.version).toBe("1.0");
    expect(result.bazi).toBeDefined();
    expect(result.fusion).toBeDefined();
  });

  it("forces mock engine when COSMIC_FORCE_MOCK is 'true'", async () => {
    process.env.COSMIC_FORCE_MOCK = "true";

    mockCreateEngine.mockResolvedValue({
      initialize: vi.fn(),
      calculateProfile: vi.fn(),
    });

    vi.doMock("../cosmic-fallback", () => ({
      createMockEngine: vi.fn().mockReturnValue({
        calculateProfile: vi.fn().mockResolvedValue({
          planets: { Sun: { longitude: 92 }, Moon: { longitude: 215 } },
          audit: { utc_offset_minutes: 0 },
        }),
      }),
    }));

    const { getCosmicEngine } = await import("../engine");
    const engine = await getCosmicEngine();
    const result = await engine.calculateProfile(validInput);

    // Should still return valid profile
    expect(result.version).toBe("1.0");
    expect(result.bazi).toBeDefined();
    expect(result.audit).toBeDefined();
  });

  it("uses Cloud Engine when COSMIC_CLOUD_URL is set", async () => {
    process.env.COSMIC_CLOUD_URL = "https://my-cosmic-cloud.fly.dev";

    // Mock global fetch
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        planets: { Sun: { longitude: 92, sign: "cancer" }, Moon: { longitude: 215 } },
        audit: { utc_offset_minutes: 120 },
      }),
    });
    global.fetch = fetchMock;

    const { getCosmicEngine } = await import("../engine");
    const engine = await getCosmicEngine();
    const result = await engine.calculateProfile(validInput);

    expect(fetchMock).toHaveBeenCalledWith("https://my-cosmic-cloud.fly.dev/compute", expect.anything());
    expect(result.version).toBe("1.0");
    expect(result.audit.hybrid).toBe(true);
  });

  it("falls back to mock engine if real engine logic fails", async () => {
    mockCreateEngine.mockRejectedValue(new Error("Import failed"));

    vi.doMock("../cosmic-fallback", () => ({
      createMockEngine: vi.fn().mockReturnValue({
        calculateProfile: vi.fn().mockResolvedValue({
          planets: { Sun: { longitude: 92 }, Moon: { longitude: 215 } },
          audit: { utc_offset_minutes: 0 },
        }),
      }),
    }));

    const { getCosmicEngine } = await import("../engine");
    const engine = await getCosmicEngine();
    const result = await engine.calculateProfile(validInput);

    // Should return valid profile from mock
    expect(result.version).toBe("1.0");
    expect(result.bazi).toBeDefined();
    expect(result.fusion).toBeDefined();
  });
});
