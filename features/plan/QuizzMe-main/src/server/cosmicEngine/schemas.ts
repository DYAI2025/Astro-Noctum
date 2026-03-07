/**
 * Cosmic Engine Schemas (Zod)
 *
 * Canonical data structures for the Hybrid Engine.
 * All UI components and services consume these types.
 *
 * @version 1.0.0
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Heavenly Stems (天干) */
export const StemSchema = z.enum([
  "Jia", "Yi", "Bing", "Ding", "Wu", "Ji", "Geng", "Xin", "Ren", "Gui"
]);
export type Stem = z.infer<typeof StemSchema>;

/** Earthly Branches (地支) */
export const BranchSchema = z.enum([
  "Zi", "Chou", "Yin", "Mao", "Chen", "Si", "Wu", "Wei", "Shen", "You", "Xu", "Hai"
]);
export type Branch = z.infer<typeof BranchSchema>;

/** Wu Xing (五行) Elements */
export const WuXingSchema = z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]);
export type WuXing = z.infer<typeof WuXingSchema>;

/** Wu Xing German */
export const WuXingDESchema = z.enum(["Holz", "Feuer", "Erde", "Metall", "Wasser"]);
export type WuXingDE = z.infer<typeof WuXingDESchema>;

/** Polarity (Yin/Yang) */
export const PolaritySchema = z.enum(["Yin", "Yang"]);
export type Polarity = z.infer<typeof PolaritySchema>;

/** Chinese Zodiac Animals */
export const ZodiacAnimalSchema = z.enum([
  "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
  "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"
]);
export type ZodiacAnimal = z.infer<typeof ZodiacAnimalSchema>;

/** Western Zodiac Signs */
export const ZodiacSignSchema = z.enum([
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
]);
export type ZodiacSign = z.infer<typeof ZodiacSignSchema>;

/** Celestial Bodies */
export const CelestialBodySchema = z.enum([
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
  "NorthNode", "SouthNode", "Chiron", "Lilith"
]);
export type CelestialBody = z.infer<typeof CelestialBodySchema>;

/** House Systems */
export const HouseSystemSchema = z.enum([
  "P",  // Placidus
  "K",  // Koch
  "O",  // Porphyrius
  "R",  // Regiomontanus
  "C",  // Campanus
  "E",  // Equal
  "W"   // Whole Sign
]);
export type HouseSystem = z.infer<typeof HouseSystemSchema>;

/** Aspect Types */
export const AspectTypeSchema = z.enum([
  "conjunction", "opposition", "trine", "square", "sextile",
  "quincunx", "semisextile", "semisquare", "sesquiquadrate"
]);
export type AspectType = z.infer<typeof AspectTypeSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// BA ZI SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Single Ba Zi Pillar (柱) */
export const BaZiPillarSchema = z.object({
  /** Heavenly Stem (English) */
  stem: StemSchema,
  /** Heavenly Stem (Chinese) */
  stemCN: z.string().length(1),
  /** Earthly Branch (English) */
  branch: BranchSchema,
  /** Earthly Branch (Chinese) */
  branchCN: z.string().length(1),
  /** Element from Stem */
  element: WuXingSchema,
  /** Yin/Yang polarity */
  polarity: PolaritySchema,
  /** Zodiac animal for this branch */
  animal: ZodiacAnimalSchema.optional(),
  /** Zodiac animal (German) */
  animalDE: z.string().optional(),
  /** Stem index (0-9) */
  stemIndex: z.number().int().min(0).max(9),
  /** Branch index (0-11) */
  branchIndex: z.number().int().min(0).max(11),
});
export type BaZiPillar = z.infer<typeof BaZiPillarSchema>;

/** Day Master (日主) */
export const DayMasterSchema = z.object({
  stem: StemSchema,
  stemCN: z.string().length(1),
  element: WuXingSchema,
  polarity: PolaritySchema,
});
export type DayMaster = z.infer<typeof DayMasterSchema>;

/** Complete Ba Zi Chart (四柱) */
export const BaZiChartSchema = z.object({
  /** Year Pillar (年柱) */
  year: BaZiPillarSchema,
  /** Month Pillar (月柱) */
  month: BaZiPillarSchema,
  /** Day Pillar (日柱) */
  day: BaZiPillarSchema,
  /** Hour Pillar (时柱) */
  hour: BaZiPillarSchema,
  /** Day Master - Core Identity */
  dayMaster: DayMasterSchema,
  /** Full notation string (e.g., "甲子 乙丑 丙寅 丁卯") */
  fullNotation: z.string(),
});
export type BaZiChart = z.infer<typeof BaZiChartSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// WESTERN ASTROLOGY SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Planet Position */
export const PlanetPositionSchema = z.object({
  /** Ecliptic longitude (0-360°) */
  longitude: z.number().min(0).max(360),
  /** Ecliptic latitude (-90 to 90°) */
  latitude: z.number().min(-90).max(90).optional(),
  /** Distance from Earth (AU) */
  distance: z.number().positive().optional(),
  /** Speed in degrees per day */
  speed: z.number().optional(),
  /** Is planet retrograde? */
  retrograde: z.boolean().optional(),
  /** Zodiac sign */
  sign: ZodiacSignSchema.optional(),
  /** Degree within sign (0-30°) */
  signDegree: z.number().min(0).max(30).optional(),
  /** House placement (1-12) */
  house: z.number().int().min(1).max(12).optional(),
});
export type PlanetPosition = z.infer<typeof PlanetPositionSchema>;

/** All Planet Positions */
export const PlanetsSchema = z.object({
  Sun: PlanetPositionSchema,
  Moon: PlanetPositionSchema,
  Mercury: PlanetPositionSchema.optional(),
  Venus: PlanetPositionSchema.optional(),
  Mars: PlanetPositionSchema.optional(),
  Jupiter: PlanetPositionSchema.optional(),
  Saturn: PlanetPositionSchema.optional(),
  Uranus: PlanetPositionSchema.optional(),
  Neptune: PlanetPositionSchema.optional(),
  Pluto: PlanetPositionSchema.optional(),
  NorthNode: PlanetPositionSchema.optional(),
  SouthNode: PlanetPositionSchema.optional(),
  Chiron: PlanetPositionSchema.optional(),
  Lilith: PlanetPositionSchema.optional(),
});
export type Planets = z.infer<typeof PlanetsSchema>;

/** House Cusp */
export const HouseCuspSchema = z.object({
  /** House number (1-12) */
  house: z.number().int().min(1).max(12),
  /** Cusp longitude (0-360°) */
  longitude: z.number().min(0).max(360),
  /** Zodiac sign of cusp */
  sign: ZodiacSignSchema,
  /** Degree within sign */
  signDegree: z.number().min(0).max(30),
});
export type HouseCusp = z.infer<typeof HouseCuspSchema>;

/** Aspect between two bodies */
export const AspectSchema = z.object({
  /** First body */
  body1: CelestialBodySchema,
  /** Second body */
  body2: CelestialBodySchema,
  /** Aspect type */
  type: AspectTypeSchema,
  /** Exact angle (degrees) */
  angle: z.number().min(0).max(180),
  /** Orb (degrees from exact) */
  orb: z.number().min(0).max(15),
  /** Is applying or separating */
  applying: z.boolean().optional(),
});
export type Aspect = z.infer<typeof AspectSchema>;

/** Western Chart */
export const WesternChartSchema = z.object({
  /** All planet positions */
  planets: PlanetsSchema,
  /** House cusps */
  houses: z.array(HouseCuspSchema).length(12).optional(),
  /** Ascendant longitude */
  ascendant: z.number().min(0).max(360).optional(),
  /** Ascendant sign */
  ascendantSign: ZodiacSignSchema.optional(),
  /** Midheaven (MC) longitude */
  midheaven: z.number().min(0).max(360).optional(),
  /** Midheaven sign */
  midheavenSign: ZodiacSignSchema.optional(),
  /** Calculated aspects */
  aspects: z.array(AspectSchema).optional(),
  /** House system used */
  houseSystem: HouseSystemSchema.optional(),
});
export type WesternChart = z.infer<typeof WesternChartSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// FUSION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** 5-Element Vector (normalized, sums to 1.0) */
export const ElementVectorSchema = z.tuple([
  z.number().min(0).max(1), // Wood
  z.number().min(0).max(1), // Fire
  z.number().min(0).max(1), // Earth
  z.number().min(0).max(1), // Metal
  z.number().min(0).max(1), // Water
]);
export type ElementVector = z.infer<typeof ElementVectorSchema>;

/** Resonance between Eastern and Western elements */
export const ResonanceSchema = z.object({
  /** Type of resonance (e.g., "Sun-DayMaster", "Moon-Hour") */
  type: z.string(),
  /** Eastern component */
  eastern: z.string(),
  /** Western component */
  western: z.string(),
  /** Strength (0-1) */
  strength: z.number().min(0).max(1),
  /** Harmony or tension */
  quality: z.enum(["harmony", "tension", "neutral"]),
  /** Description */
  description: z.string().optional(),
});
export type Resonance = z.infer<typeof ResonanceSchema>;

/** Element Vector Details */
export const ElementVectorDetailsSchema = z.object({
  /** Combined (averaged) vector */
  combined: ElementVectorSchema,
  /** Eastern (Ba Zi) vector */
  eastern: ElementVectorSchema,
  /** Western (Planets) vector */
  western: ElementVectorSchema,
  /** Dominant element (English) */
  dominantElement: WuXingSchema,
  /** Dominant element (German) */
  dominantElementDE: WuXingDESchema,
  /** Deficient element (English) */
  deficientElement: WuXingSchema,
  /** Deficient element (German) */
  deficientElementDE: WuXingDESchema,
});
export type ElementVectorDetails = z.infer<typeof ElementVectorDetailsSchema>;

/** Fusion Result */
export const FusionResultSchema = z.object({
  /** Element vectors */
  elementVector: ElementVectorDetailsSchema,
  /** East-West harmony index (0-1) */
  harmonyIndex: z.number().min(0).max(1),
  /** Harmony interpretation */
  harmonyInterpretation: z.string(),
  /** Specific resonances */
  resonances: z.array(ResonanceSchema),
});
export type FusionResult = z.infer<typeof FusionResultSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// SYMBOL SCHEMAS (Sprint 2)
// ═══════════════════════════════════════════════════════════════════════════

/** Symbol Elements (Ba Zi + Western source) */
export const SymbolElementsSchema = z.object({
  /** Ba Zi Day Master element */
  bazi: z.enum(["Wood", "Fire", "Earth", "Metal", "Water"]),
  /** Western zodiac element */
  western: z.enum(["Fire", "Earth", "Air", "Water"]),
});
export type SymbolElements = z.infer<typeof SymbolElementsSchema>;

/** Symbol Colors */
export const SymbolColorsSchema = z.object({
  /** Foreground/primary color (Ba Zi) */
  primary: z.string(),
  /** Background/secondary color (Western) */
  secondary: z.string(),
  /** Canvas background */
  bg: z.string(),
});
export type SymbolColors = z.infer<typeof SymbolColorsSchema>;

/** Symbol Specification V1 - "Systemic Minimalism" */
export const SymbolSpecV1Schema = z.object({
  /** Schema version */
  version: z.literal("1.0"),
  /** Complete SVG string */
  svg: z.string(),
  /** Human-readable description */
  description: z.string(),
  /** Source elements */
  elements: SymbolElementsSchema,
  /** Color palette used */
  colors: SymbolColorsSchema,
  /** AI prompt for Midjourney/NanoBanana generation */
  prompt: z.string().optional(),
  /** Generation timestamp */
  generatedAt: z.string().datetime(),
});
export type SymbolSpecV1 = z.infer<typeof SymbolSpecV1Schema>;

// ═══════════════════════════════════════════════════════════════════════════
// ASTRO PROFILE V1 (Main Output)
// ═══════════════════════════════════════════════════════════════════════════

/** Audit/Metadata */
export const AuditSchema = z.object({
  /** UTC offset in minutes */
  utcOffsetMinutes: z.number(),
  /** IANA timezone used */
  timezone: z.string(),
  /** Julian Date of birth */
  julianDate: z.number().optional(),
  /** Solar longitude at birth */
  solarLongitude: z.number().min(0).max(360).optional(),
  /** Engine version */
  engineVersion: z.string().optional(),
  /** Calculation timestamp */
  calculatedAt: z.string().datetime(),
  /** Was this a hybrid calculation? */
  hybrid: z.boolean().default(false),
});
export type Audit = z.infer<typeof AuditSchema>;

/** Birth Input (validated) */
export const BirthInputSchema = z.object({
  /** Birth year */
  year: z.number().int().min(1800).max(2200),
  /** Birth month (1-12) */
  month: z.number().int().min(1).max(12),
  /** Birth day (1-31) */
  day: z.number().int().min(1).max(31),
  /** Birth hour (0-23) */
  hour: z.number().int().min(0).max(23),
  /** Birth minute (0-59) */
  minute: z.number().int().min(0).max(59),
  /** Birth second (0-59) */
  second: z.number().int().min(0).max(59).default(0),
  /** Latitude */
  latitude: z.number().min(-90).max(90),
  /** Longitude */
  longitude: z.number().min(-180).max(180),
  /** IANA timezone (e.g., "Europe/Berlin") */
  timezone: z.string(),
  /** House system preference */
  houseSystem: HouseSystemSchema.default("P"),
});
export type BirthInput = z.infer<typeof BirthInputSchema>;

/** Complete Astro Profile V1 */
export const AstroProfileV1Schema = z.object({
  /** Schema version */
  version: z.literal("1.0"),

  /** Original birth input */
  input: BirthInputSchema,

  /** Ba Zi (Four Pillars) chart */
  bazi: BaZiChartSchema,

  /** Western astrology chart */
  western: WesternChartSchema,

  /** East-West Fusion */
  fusion: FusionResultSchema,

  /** Identity Symbol (optional, generated in Sprint 2) */
  symbol: SymbolSpecV1Schema.optional(),

  /** Calculation audit */
  audit: AuditSchema,
});
export type AstroProfileV1 = z.infer<typeof AstroProfileV1Schema>;

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate and parse birth input
 */
export function parseBirthInput(input: unknown): BirthInput {
  return BirthInputSchema.parse(input);
}

/**
 * Validate and parse complete AstroProfile
 */
export function parseAstroProfile(data: unknown): AstroProfileV1 {
  return AstroProfileV1Schema.parse(data);
}

/**
 * Safe parse (returns success/error instead of throwing)
 */
export function safeParseAstroProfile(data: unknown) {
  return AstroProfileV1Schema.safeParse(data);
}

/**
 * Validate Ba Zi chart only
 */
export function parseBaZiChart(data: unknown): BaZiChart {
  return BaZiChartSchema.parse(data);
}

/**
 * Validate Fusion result only
 */
export function parseFusionResult(data: unknown): FusionResult {
  return FusionResultSchema.parse(data);
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════

export function isValidStem(value: unknown): value is Stem {
  return StemSchema.safeParse(value).success;
}

export function isValidBranch(value: unknown): value is Branch {
  return BranchSchema.safeParse(value).success;
}

export function isValidWuXing(value: unknown): value is WuXing {
  return WuXingSchema.safeParse(value).success;
}

export function isValidZodiacSign(value: unknown): value is ZodiacSign {
  return ZodiacSignSchema.safeParse(value).success;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS (Re-exported for convenience)
// ═══════════════════════════════════════════════════════════════════════════

export const STEMS = StemSchema.options;
export const BRANCHES = BranchSchema.options;
export const WU_XING = WuXingSchema.options;
export const ZODIAC_ANIMALS = ZodiacAnimalSchema.options;
export const ZODIAC_SIGNS = ZodiacSignSchema.options;
export const CELESTIAL_BODIES = CelestialBodySchema.options;
