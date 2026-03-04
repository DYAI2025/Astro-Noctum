// Tests: zodiacSigns data completeness and helpers
import { describe, it, expect } from "vitest";
import {
  ZODIAC_SIGNS_DATA,
  getZodiacSign,
  getSignName,
} from "../lib/astro-data/zodiacSigns";

describe("ZODIAC_SIGNS_DATA completeness", () => {
  it("contains exactly 12 signs", () => {
    expect(ZODIAC_SIGNS_DATA).toHaveLength(12);
  });

  it("every sign has a unique key", () => {
    const keys = ZODIAC_SIGNS_DATA.map((s) => s.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(12);
  });

  it("every sign has non-empty EN and DE names", () => {
    ZODIAC_SIGNS_DATA.forEach(({ key, name }) => {
      expect(name.en, `${key} EN name`).toBeTruthy();
      expect(name.de, `${key} DE name`).toBeTruthy();
    });
  });

  it("every sign has sun descriptions in EN and DE (≥ 20 chars each)", () => {
    ZODIAC_SIGNS_DATA.forEach(({ key, sun }) => {
      expect(sun.en.length, `${key} sun.en too short`).toBeGreaterThan(20);
      expect(sun.de.length, `${key} sun.de too short`).toBeGreaterThan(20);
    });
  });

  it("every sign has moon descriptions in EN and DE (≥ 20 chars each)", () => {
    ZODIAC_SIGNS_DATA.forEach(({ key, moon }) => {
      expect(moon.en.length, `${key} moon.en too short`).toBeGreaterThan(20);
      expect(moon.de.length, `${key} moon.de too short`).toBeGreaterThan(20);
    });
  });

  it("every sign has ascendant descriptions in EN and DE (≥ 20 chars each)", () => {
    ZODIAC_SIGNS_DATA.forEach(({ key, asc }) => {
      expect(asc.en.length, `${key} asc.en too short`).toBeGreaterThan(20);
      expect(asc.de.length, `${key} asc.de too short`).toBeGreaterThan(20);
    });
  });

  it("every sign has an emoji", () => {
    ZODIAC_SIGNS_DATA.forEach(({ key, emoji }) => {
      expect(emoji, `${key} emoji`).toBeTruthy();
    });
  });

  it("all 12 API sign names are present", () => {
    const expected = [
      "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
      "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
    ];
    expected.forEach((sign) => {
      expect(
        ZODIAC_SIGNS_DATA.some((s) => s.key === sign),
        `${sign} is missing`,
      ).toBe(true);
    });
  });
});

describe("getZodiacSign", () => {
  it("returns sign data for Leo", () => {
    const s = getZodiacSign("Leo");
    expect(s?.key).toBe("Leo");
    expect(s?.name.de).toBe("Löwe");
  });

  it("is case-insensitive", () => {
    expect(getZodiacSign("leo")?.key).toBe("Leo");
    expect(getZodiacSign("ARIES")?.key).toBe("Aries");
  });

  it("returns undefined for empty string", () => {
    expect(getZodiacSign("")).toBeUndefined();
  });

  it("returns undefined for unknown sign", () => {
    expect(getZodiacSign("Ophiuchus")).toBeUndefined();
  });
});

describe("getSignName", () => {
  it("returns German name for lang=de", () => {
    expect(getSignName("Leo",         "de")).toBe("Löwe");
    expect(getSignName("Aries",       "de")).toBe("Widder");
    expect(getSignName("Scorpio",     "de")).toBe("Skorpion");
    expect(getSignName("Sagittarius", "de")).toBe("Schütze");
    expect(getSignName("Capricorn",   "de")).toBe("Steinbock");
    expect(getSignName("Aquarius",    "de")).toBe("Wassermann");
    expect(getSignName("Pisces",      "de")).toBe("Fische");
  });

  it("returns English name for lang=en", () => {
    expect(getSignName("Leo",         "en")).toBe("Leo");
    expect(getSignName("Sagittarius", "en")).toBe("Sagittarius");
  });

  it("falls back to apiKey for unknown sign (no crash)", () => {
    expect(getSignName("Unknown", "de")).toBe("Unknown");
    expect(getSignName("",        "en")).toBe("");
  });
});
