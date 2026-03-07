/**
 * Astro Module
 *
 * Astrological computations and anchor mapping.
 */

export * from "./compute";
export * from "./astronomy";
export * from "./time-helpers";
export {
  computeBaseScores,
  isAnchorableTrait,
  ANCHORABLE_TRAIT_IDS,
  type ZodiacSign,
  type ChineseAnimal,
  type AstroInput,
} from "@/lib/registry/astro-anchor-map.v1";
