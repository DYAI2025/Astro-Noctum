// Tests: constellationFromSign — birth constellation logic
import { describe, it, expect } from "vitest";
import {
  getConstellationForSign,
  getSunSignFromDate,
  SIGN_TO_CONSTELLATION,
} from "../lib/astro-data/constellationFromSign";

// ─── getConstellationForSign ──────────────────────────────────────────────

describe("getConstellationForSign", () => {
  it("maps all 12 zodiac signs without gaps", () => {
    const signs = [
      "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
      "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
    ];
    signs.forEach((sign) => {
      expect(getConstellationForSign(sign), `${sign} should map to a constellation`).toBeDefined();
    });
  });

  it("maps Scorpio → Scorpius (IAU name, not Scorpio)", () => {
    expect(getConstellationForSign("Scorpio")?.key).toBe("Scorpius");
  });

  it("maps Capricorn → Capricornus (IAU name)", () => {
    expect(getConstellationForSign("Capricorn")?.key).toBe("Capricornus");
  });

  it("returns bilingual names for Leo", () => {
    const c = getConstellationForSign("Leo");
    expect(c?.name.en).toBe("Leo");
    expect(c?.name.de).toBe("Löwe");
  });

  it("returns bilingual names for Aquarius", () => {
    const c = getConstellationForSign("Aquarius");
    expect(c?.name.de).toBe("Wassermann");
    expect(c?.name.en).toBe("Aquarius");
  });

  it("returns undefined for empty string", () => {
    expect(getConstellationForSign("")).toBeUndefined();
  });

  it("returns undefined for unknown sign", () => {
    expect(getConstellationForSign("Ophiuchus")).toBeUndefined();
  });

  it("all constellation keys are non-empty strings", () => {
    Object.values(SIGN_TO_CONSTELLATION).forEach(({ key }) => {
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    });
  });

  it("all entries have matching sign field", () => {
    Object.entries(SIGN_TO_CONSTELLATION).forEach(([signKey, info]) => {
      expect(info.sign).toBe(signKey);
    });
  });
});

// ─── getSunSignFromDate ───────────────────────────────────────────────────

describe("getSunSignFromDate", () => {
  const cases: [number, number, string][] = [
    // Aries: Mar 21 – Apr 19
    [3, 21, "Aries"],
    [4, 1,  "Aries"],
    [4, 19, "Aries"],
    // Taurus: Apr 20 – May 20
    [4, 20, "Taurus"],
    [5, 10, "Taurus"],
    [5, 20, "Taurus"],
    // Gemini: May 21 – Jun 20
    [5, 21, "Gemini"],
    [6, 20, "Gemini"],
    // Cancer: Jun 21 – Jul 22
    [6, 21, "Cancer"],
    [7, 22, "Cancer"],
    // Leo: Jul 23 – Aug 22
    [7, 23, "Leo"],
    [8, 22, "Leo"],
    // Virgo: Aug 23 – Sep 22
    [8, 23, "Virgo"],
    [9, 22, "Virgo"],
    // Libra: Sep 23 – Oct 22
    [9, 23, "Libra"],
    [10, 22, "Libra"],
    // Scorpio: Oct 23 – Nov 21
    [10, 23, "Scorpio"],
    [11, 21, "Scorpio"],
    // Sagittarius: Nov 22 – Dec 21
    [11, 22, "Sagittarius"],
    [12, 21, "Sagittarius"],
    // Capricorn: Dec 22 – Jan 19 (year boundary)
    [12, 22, "Capricorn"],
    [12, 31, "Capricorn"],
    [1,  1,  "Capricorn"],
    [1,  19, "Capricorn"],
    // Aquarius: Jan 20 – Feb 18
    [1,  20, "Aquarius"],
    [2,  18, "Aquarius"],
    // Pisces: Feb 19 – Mar 20
    [2,  19, "Pisces"],
    [3,  20, "Pisces"],
  ];

  it.each(cases)("month=%d day=%d → %s", (month, day, expected) => {
    expect(getSunSignFromDate(month, day)).toBe(expected);
  });

  it("returns a non-empty string for all days of the year", () => {
    const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInMonth[m - 1]; d++) {
        const sign = getSunSignFromDate(m, d);
        expect(sign.length, `month=${m} day=${d}`).toBeGreaterThan(0);
      }
    }
  });
});
