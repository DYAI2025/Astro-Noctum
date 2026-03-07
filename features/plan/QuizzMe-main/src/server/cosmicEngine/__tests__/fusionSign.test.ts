
/**
 * Tests for Fusion Sign Creator
 *
 * Tests the "Systemic Minimalism" symbol generator that fuses
 * Ba Zi Day Master elements with Western Sun Sign elements.
 */

import { describe, it, expect } from "vitest";
import { generateFusionSign } from "../fusionSign";
import { SymbolSpecV1Schema } from "../schemas";

describe("Fusion Sign Creator", () => {
    describe("SymbolSpecV1 Compliance", () => {
        it("should return SymbolSpecV1 compliant object", () => {
            const result = generateFusionSign("Metal", "Virgo");

            expect(result).toBeDefined();
            expect(result!.version).toBe("1.0");
            expect(result!.svg).toBeDefined();
            expect(result!.description).toBeDefined();
            expect(result!.elements).toBeDefined();
            expect(result!.colors).toBeDefined();
            expect(result!.prompt).toBeDefined();
            expect(result!.generatedAt).toBeDefined();
        });

        it("should validate against Zod schema", () => {
            const result = generateFusionSign("Metal", "Virgo");
            const validation = SymbolSpecV1Schema.safeParse(result);

            expect(validation.success).toBe(true);
        });

        it("should return undefined for empty inputs", () => {
            expect(generateFusionSign("", "Virgo")).toBeUndefined();
            expect(generateFusionSign("Metal", "")).toBeUndefined();
        });
    });

    describe("Element Mapping", () => {
        // Golden Case: Metal (Day Master) + Earth (Sun Sign)
        it("should generate correct sign for Metal Day Master and Virgo (Earth) Sun", () => {
            const result = generateFusionSign("Metal", "Virgo")!;

            expect(result.elements.bazi).toBe("Metal");
            expect(result.elements.western).toBe("Earth");

            // Polarity Check: Metal (Yang) + Earth (Yin)
            // Diamond inside Circle
            expect(result.svg).toContain("<circle"); // Background (Yin)
            expect(result.svg).toContain("<polygon"); // Foreground (Yang)

            // Colors: Yang = Blue, Yin = Beige
            expect(result.colors.primary).toMatch(/#A8D8F8|#7FB6FF/);
            expect(result.colors.secondary).toMatch(/#F2E8D1|#FAF5E6/);
        });

        it("should map all 12 Western signs correctly", () => {
            const signElementMap: Record<string, string> = {
                Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
                Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
                Gemini: "Air", Libra: "Air", Aquarius: "Air",
                Cancer: "Water", Scorpio: "Water", Pisces: "Water",
            };

            for (const [sign, expectedElement] of Object.entries(signElementMap)) {
                const result = generateFusionSign("Wood", sign)!;
                expect(result.elements.western).toBe(expectedElement);
            }
        });
    });

    describe("Polarity Conflict Resolution", () => {
        it("should handle Yang-Yang polarity conflict (Fire + Aries)", () => {
            const result = generateFusionSign("Fire", "Aries")!;

            // Both Yang - needs color contrast
            expect(result.colors.primary).not.toBe(result.colors.secondary);
            expect(result.svg).toContain('filter="url(#glow)"');
            expect(result.svg).toContain("<polygon"); // Fire -> Triangle
        });

        it("should handle Yin-Yin polarity conflict (Water + Cancer)", () => {
            const result = generateFusionSign("Water", "Cancer")!;

            // Both Yin - needs color contrast
            expect(result.colors.primary).not.toBe(result.colors.secondary);
            expect(result.svg).toContain("<circle"); // Yin -> Circle
        });

        it("should handle Yang-Yin harmony (Wood + Pisces)", () => {
            const result = generateFusionSign("Wood", "Pisces")!;

            // Wood (Yang) + Water (Yin) - natural contrast
            expect(result.svg).toContain("<circle"); // Background (Yin)
            expect(result.svg).toContain("<polygon"); // Foreground (Yang Triangle)
        });
    });

    describe("AI Prompt Generation", () => {
        it("should generate Midjourney-compatible prompt", () => {
            const result = generateFusionSign("Metal", "Virgo")!;

            expect(result.prompt).toContain("Minimalist geometric symbol");
            expect(result.prompt).toContain("Metal");
            expect(result.prompt).toContain("Earth");
            expect(result.prompt).toContain("systemic minimalism");
            expect(result.prompt).toContain("--ar 1:1");
        });

        it("should describe polarity duality in prompt", () => {
            const yangYang = generateFusionSign("Fire", "Aries")!;
            expect(yangYang.prompt).toContain("unified Yang energy");

            const yinYin = generateFusionSign("Water", "Cancer")!;
            expect(yinYin.prompt).toContain("unified Yin energy");

            const mixed = generateFusionSign("Metal", "Cancer")!;
            expect(mixed.prompt).toContain("Yang-Yin duality");
        });
    });

    describe("Description Generation", () => {
        it("should produce descriptive text with elements", () => {
            const result = generateFusionSign("Metal", "Virgo")!;

            expect(result.description).toContain("Metal");
            expect(result.description).toContain("Earth");
            expect(result.description).toContain("Yang");
            expect(result.description).toContain("Yin");
        });
    });

    describe("Fallback Handling", () => {
        it("should use fallback for unknown Western signs", () => {
            const result = generateFusionSign("Metal", "Unicorn")!;

            // Unknown sign defaults to Earth
            expect(result.elements.western).toBe("Earth");
            expect(result.svg).toBeDefined();
        });

        it("should use fallback polarity for unknown Ba Zi elements", () => {
            const result = generateFusionSign("Plastic", "Virgo")!;

            // Unknown element defaults to Yang polarity
            expect(result.svg).toBeDefined();
            expect(result.elements.bazi).toBe("Plastic"); // Passes through
        });
    });
});
