/**
 * Astro Onboarding Event Builder
 *
 * Builds a ContributionEvent for the onboarding.astro.v1 module.
 *
 * Event requirements:
 * - source.vertical = "character"
 * - moduleId = "onboarding.astro.v1"
 * - payload.astro required
 * - payload.markers required (element + modality, clamped 0.05-0.15)
 * - tags/unlocks from registry only
 */

import { ContributionEvent, AstroPayload, Marker, Tag, Unlock } from "@/lib/lme/types";
import { computeAstro, BirthInput, AstroResult, SIGN_ELEMENT, SIGN_MODALITY } from "@/lib/astro";

// ═══════════════════════════════════════════════════════════════════════════
// ELEMENT/MODALITY MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════






// ═══════════════════════════════════════════════════════════════════════════
// MARKER WEIGHT CONSTANTS (FLAVOR tier)
// ═══════════════════════════════════════════════════════════════════════════

const ASTRO_WEIGHT_MIN = 0.05;
const ASTRO_WEIGHT_MAX = 0.15;
const ASTRO_WEIGHT_DEFAULT = 0.10;

function clampWeight(weight: number): number {
  return Math.max(ASTRO_WEIGHT_MIN, Math.min(ASTRO_WEIGHT_MAX, weight));
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD MARKERS
// ═══════════════════════════════════════════════════════════════════════════

function buildMarkers(astro: AstroResult): Marker[] {
  const markers: Marker[] = [];
  const sunSign = astro.western.sunSign;

  // Element marker (required)
  const element = SIGN_ELEMENT[sunSign];
  if (element) {
    markers.push({
      id: `marker.astro.element.${element}`,
      weight: clampWeight(ASTRO_WEIGHT_DEFAULT),
    });
  }

  // Modality marker (required)
  const modality = SIGN_MODALITY[sunSign];
  if (modality) {
    markers.push({
      id: `marker.astro.modality.${modality}`,
      weight: clampWeight(ASTRO_WEIGHT_DEFAULT),
    });
  }

  // Chinese element marker
  const chineseElement = astro.chinese.element;
  markers.push({
    id: `marker.astro.chinese.${chineseElement}`,
    weight: clampWeight(0.08),
  });

  // Yin/Yang marker
  markers.push({
    id: `marker.astro.chinese.${astro.chinese.yinYang}`,
    weight: clampWeight(0.06),
  });

  return markers;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD TAGS
// ═══════════════════════════════════════════════════════════════════════════

function buildTags(astro: AstroResult): Tag[] {
  const tags: Tag[] = [];
  const sunSign = astro.western.sunSign;

  // Zodiac sign tag
  tags.push({
    id: `tag.astro.zodiac.${sunSign}`,
    label: sunSign.charAt(0).toUpperCase() + sunSign.slice(1),
    kind: "astro",
  });

  // Chinese animal tag
  const animal = astro.chinese.animal;
  tags.push({
    id: `tag.astro.chinese.${animal}`,
    label: animal.charAt(0).toUpperCase() + animal.slice(1),
    kind: "astro",
  });

  return tags;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD UNLOCKS
// ═══════════════════════════════════════════════════════════════════════════

function buildUnlocks(astro: AstroResult): Unlock[] {
  const unlocks: Unlock[] = [];
  const now = new Date().toISOString();

  // Zodiac sigil unlock
  unlocks.push({
    id: `unlock.sigils.zodiac_${astro.western.sunSign}`,
    unlocked: true,
    unlockedAt: now,
    level: 1,
    sourceRef: "onboarding.astro.v1",
  });

  // Chinese animal badge unlock
  unlocks.push({
    id: `unlock.badges.chinese_${astro.chinese.animal}`,
    unlocked: true,
    unlockedAt: now,
    level: 1,
    sourceRef: "onboarding.astro.v1",
  });

  return unlocks;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD ASTRO PAYLOAD
// ═══════════════════════════════════════════════════════════════════════════

function buildAstroPayload(astro: AstroResult, input: BirthInput): AstroPayload {
  const element = SIGN_ELEMENT[astro.western.sunSign];
  const modality = SIGN_MODALITY[astro.western.sunSign];

  return {
    western: {
      sunSign: astro.western.sunSign,
      ascendant: astro.western.ascendant,
      moonSign: astro.western.moonSign,
      elementsMix: {
        fire: element === "fire" ? 1 : 0,
        earth: element === "earth" ? 1 : 0,
        air: element === "air" ? 1 : 0,
        water: element === "water" ? 1 : 0,
      },
      modalitiesMix: {
        cardinal: modality === "cardinal" ? 1 : 0,
        fixed: modality === "fixed" ? 1 : 0,
        mutable: modality === "mutable" ? 1 : 0,
      },
    },
    chinese: {
      animal: astro.chinese.animal,
      element: astro.chinese.element,
      yinYang: astro.chinese.yinYang,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BUILD FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export type BuildAstroEventInput = {
  birthDate: Date;
  birthTime?: { hour: number; minute: number };
  birthPlace?: { lat: number; lng: number };
};

/**
 * Build a ContributionEvent for astro onboarding.
 *
 * @param input - Birth information
 * @returns ContributionEvent ready to be submitted
 */
export function buildAstroOnboardingEvent(
  input: BuildAstroEventInput
): ContributionEvent {
  const birthInput: BirthInput = {
    date: input.birthDate,
    time: input.birthTime,
    place: input.birthPlace,
  };

  // Compute astro data
  const astro = computeAstro(birthInput);

  // Build event components
  const markers = buildMarkers(astro);
  const tags = buildTags(astro);
  const unlocks = buildUnlocks(astro);
  const astroPayload = buildAstroPayload(astro, birthInput);

  return {
    specVersion: "sp.contribution.v1",
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    source: {
      vertical: "character",
      moduleId: "onboarding.astro.v1",
      domain: typeof window !== "undefined" ? window.location.hostname : undefined,
    },
    payload: {
      markers,
      tags,
      unlocks,
      astro: astroPayload,
      summary: {
        title: `${astro.western.sunSign.charAt(0).toUpperCase() + astro.western.sunSign.slice(1)} / ${astro.chinese.animal.charAt(0).toUpperCase() + astro.chinese.animal.slice(1)}`,
        bullets: [
          `Sun Sign: ${astro.western.sunSign}`,
          `Element: ${SIGN_ELEMENT[astro.western.sunSign]}`,
          `Chinese: ${astro.chinese.animal} (${astro.chinese.element})`,
        ],
        resultId: `astro.${astro.western.sunSign}.${astro.chinese.animal}`,
      },
    },
  };
}

/**
 * Get the computed astro data without building an event.
 * Useful for previewing results before submission.
 */
export function previewAstro(input: BuildAstroEventInput): AstroResult {
  return computeAstro({
    date: input.birthDate,
    time: input.birthTime,
    place: input.birthPlace,
  });
}
