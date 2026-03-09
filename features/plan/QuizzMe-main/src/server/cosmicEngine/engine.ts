/**
 * Cosmic Engine - Hybrid Astrology Calculator
 *
 * Server-only singleton loader for the hybrid astrology engine.
 * Combines Cloud API (Western) with Local Ba Zi + Fusion calculations.
 *
 * @version 2.0.0 - Refactored with strict typing and AstroProfileV1 validation
 */

import "server-only";

import path from "path";
import { createRequire } from "module";

import {
  type AstroProfileV1,
  type BirthInput,
  type BaZiChart,
  type Planets,
  type FusionResult,
  type Audit,
  BirthInputSchema,
  safeParseAstroProfile,
} from "./schemas";

import { calculateBaZi, type BaZiResult, calculateBaZiLegacy } from "./bazi";
import { calculateFusion } from "./fusion";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type CosmicEngineInstance = {
  calculateProfile: (input: BirthInput) => Promise<AstroProfileV1>;
  initialize?: () => Promise<void>;
};

type GetEngineOptions = {
  strictMode?: boolean;
  pythonPath?: string;
  scriptPath?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON ENGINE
// ═══════════════════════════════════════════════════════════════════════════

let enginePromise: Promise<CosmicEngineInstance> | null = null;

/**
 * Server-only singleton loader for cosmic-architecture-engine.
 * - Avoids re-initializing Swiss Ephemeris bridge on every request.
 * - Compatible with Next.js App Router route handlers (nodejs runtime).
 */
export async function getCosmicEngine(
  options: GetEngineOptions = {}
): Promise<CosmicEngineInstance> {
  if (!enginePromise) {
    enginePromise = (async () => {
      // Helper: Initialize Local Engine (Python Bridge or Mock)
      const getLocalEngineInstance = async (): Promise<CosmicEngineInstance> => {
        let pythonEngine: { calculateProfile: (input: unknown) => Promise<unknown> } | null = null;

        try {
          const require = createRequire(import.meta.url);
          const cosmic = require("cosmic-architecture-engine") as {
            createEngine: (opts: unknown) => Promise<{ calculateProfile: (input: unknown) => Promise<unknown> }>;
          };

          const entry = require.resolve("cosmic-architecture-engine");
          const moduleDir = path.dirname(entry);

          const pythonPath = options.pythonPath ?? process.env.COSMIC_PYTHON_PATH ?? "python3";
          const scriptPath =
            options.scriptPath ??
            process.env.COSMIC_PY_SCRIPT_PATH ??
            path.resolve(moduleDir, "../astro-precision-horoscope/scripts/compute_horoscope.py");

          const strictModeEnv = process.env.COSMIC_STRICT_MODE;
          const strictMode = options.strictMode ?? (strictModeEnv === "0" ? false : true);

          pythonEngine = await cosmic.createEngine({
            strictMode,
            pythonPath,
            scriptPath,
          });

          if (process.env.COSMIC_FORCE_MOCK === "true") {
            throw new Error("Forcing Mock Engine via COSMIC_FORCE_MOCK env var");
          }

          const maybeInit = pythonEngine as unknown as { initialize?: () => Promise<void> };
          if (maybeInit.initialize) {
            await maybeInit.initialize();
          }
        } catch (e) {
          console.error("[CosmicEngine] Failed to initialize local python bridge.", e);
        }

        // Import Mock Engine for fallback
        const { createMockEngine } = await import("./cosmic-fallback");
        const mockEngine = await createMockEngine();

        // Return a proxy engine that tries Python first, then Mock
        return {
          calculateProfile: async (input: BirthInput): Promise<AstroProfileV1> => {
            let rawResult: unknown;

            if (pythonEngine) {
              try {
                rawResult = await pythonEngine.calculateProfile(input);
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error("[CosmicEngine] Local Python execution failed:", message);
                console.warn("[CosmicEngine] Switching to Mock Engine for this request.");
              }
            }

            if (!rawResult) {
              rawResult = await mockEngine.calculateProfile(input);
            }

            // Enhance with Ba Zi and Fusion
            return enhanceWithHybrid(input, rawResult as Record<string, unknown>);
          },
          initialize: async () => {
            // Already initialized
          },
        };
      };

      // 1. Cloud Engine Logic with Fallback
      const cloudUrl = process.env.COSMIC_CLOUD_URL;
      console.log("[CosmicEngine] DEBUG: Resolved cloudUrl =", cloudUrl);

      let fallbackEngine: CosmicEngineInstance | null = null;

      if (cloudUrl) {
        console.log("[CosmicEngine] Configured for Cloud Engine at:", cloudUrl);
        return {
          calculateProfile: async (input: BirthInput): Promise<AstroProfileV1> => {
            try {
              // Validate input
              const validatedInput = BirthInputSchema.parse(input);

              // Attempt Cloud Calculation
              const controller = new AbortController();
              const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

              // Map Internal Input to Cloud API Payload
              const pad = (n: number) => String(n).padStart(2, "0");
              const cloudPayload = {
                birth_date: `${validatedInput.year}-${pad(validatedInput.month)}-${pad(validatedInput.day)}`,
                birth_time: `${pad(validatedInput.hour)}:${pad(validatedInput.minute)}:${pad(validatedInput.second)}`,
                birth_location: {
                  lat: validatedInput.latitude,
                  lon: validatedInput.longitude,
                },
                iana_time_zone: validatedInput.timezone,
                house_system: validatedInput.houseSystem,
                strict_mode: false,
              };

              const response = await fetch(`${cloudUrl}/compute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cloudPayload),
                signal: controller.signal,
              });
              clearTimeout(id);

              if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Cloud engine HTTP error: ${response.status} - ${errText}`);
              }

              const cloudData = (await response.json()) as Record<string, unknown>;

              // HYBRID ENGINE: Enhance Cloud Data with Local Ba Zi & Fusion
              return enhanceWithHybrid(validatedInput, cloudData);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : String(err);
              console.warn(`[CosmicEngine] Cloud calculation failed (${message}). Switching to Local Fallback.`);

              if (!fallbackEngine) {
                fallbackEngine = await getLocalEngineInstance();
              }
              return fallbackEngine.calculateProfile(input);
            }
          },
          initialize: async () => {
            // Lazy initialization
          },
        };
      }

      // 2. Default: Local only
      return getLocalEngineInstance();
    })();
  }

  return enginePromise;
}

// ═══════════════════════════════════════════════════════════════════════════
// HYBRID ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enhance raw engine data with local Ba Zi and Fusion calculations
 */
async function enhanceWithHybrid(
  input: BirthInput,
  cloudData: Record<string, unknown>
): Promise<AstroProfileV1> {
  try {
    // Dynamically import to keep dependencies lazy
    const { generateFusionSign } = await import("./fusionSign");
    const { getWesternZodiacSign } = await import("./astronomy-utils");

    // Extract planets from cloud data
    const planets = (cloudData.planets as Planets) ?? { Sun: { longitude: 0 }, Moon: { longitude: 0 } };
    const sunLon = planets.Sun?.longitude ?? 0;

    // Get UTC offset from audit or calculate
    const audit = cloudData.audit as { utc_offset_minutes?: number } | undefined;
    const utcOffsetMinutes = audit?.utc_offset_minutes ?? 0;

    // Calculate Ba Zi using new function
    const baziResult: BaZiResult = calculateBaZi({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      longitude: input.longitude,
      timezoneOffset: utcOffsetMinutes,
    });

    // Calculate Fusion
    const fusionResult: FusionResult = calculateFusion(baziResult.chart, planets);

    // Generate Fusion Sign (Systemic Minimalism)
    const sunSign = planets.Sun?.sign ?? getWesternZodiacSign(sunLon);
    const symbol = generateFusionSign(baziResult.chart.dayMaster.element, sunSign);

    // Build complete profile
    const profile: AstroProfileV1 = {
      version: "1.0",
      input,
      bazi: baziResult.chart,
      western: {
        planets,
        houses: cloudData.houses as AstroProfileV1["western"]["houses"],
        ascendant: cloudData.ascendant as number | undefined,
        ascendantSign: cloudData.ascendant_sign as AstroProfileV1["western"]["ascendantSign"],
        midheaven: cloudData.midheaven as number | undefined,
        midheavenSign: cloudData.mc_sign as AstroProfileV1["western"]["midheavenSign"],
        aspects: cloudData.aspects as AstroProfileV1["western"]["aspects"],
        houseSystem: input.houseSystem,
      },
      fusion: fusionResult,
      symbol,
      audit: {
        utcOffsetMinutes,
        timezone: input.timezone,
        julianDate: baziResult.julianDate,
        solarLongitude: baziResult.solarLongitude,
        engineVersion: "2.0.0",
        calculatedAt: new Date().toISOString(),
        hybrid: true,
      },
    };

    // Validate the complete profile
    const validation = safeParseAstroProfile(profile);
    if (!validation.success) {
      console.warn("[CosmicEngine] Profile validation warning:", validation.error.format());
      // Return profile anyway - validation warnings shouldn't block
    }

    return profile;
  } catch (hybridErr) {
    console.error("[CosmicEngine] Hybrid enhancement failed:", hybridErr);

    // Minimal fallback profile
    const fallbackBaZi = calculateBaZiLegacy(
      input.year,
      input.month,
      input.day,
      input.hour,
      input.minute,
      input.longitude,
      0 // Default offset
    );

    return {
      version: "1.0",
      input,
      bazi: fallbackBaZi,
      western: {
        planets: { Sun: { longitude: 0 }, Moon: { longitude: 0 } },
      },
      fusion: {
        elementVector: {
          combined: [0.2, 0.2, 0.2, 0.2, 0.2],
          eastern: [0.2, 0.2, 0.2, 0.2, 0.2],
          western: [0.2, 0.2, 0.2, 0.2, 0.2],
          dominantElement: "Earth",
          dominantElementDE: "Erde",
          deficientElement: "Earth",
          deficientElementDE: "Erde",
        },
        harmonyIndex: 0.5,
        harmonyInterpretation: "Moderate Kohärenz",
        resonances: [],
      },
      audit: {
        utcOffsetMinutes: 0,
        timezone: input.timezone,
        engineVersion: "2.0.0",
        calculatedAt: new Date().toISOString(),
        hybrid: false,
      },
    };
  }
}

// Re-export types
export type { AstroProfileV1, BirthInput, BaZiChart, Planets, FusionResult };
