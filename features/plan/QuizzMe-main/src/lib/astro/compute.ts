/**
 * Astro Compute
 *
 * Computes astrological data from birth date.
 *
 * MVP (Phase 5a):
 * - sunSign: always computed from birth date
 * - chineseAnimal/element/yinYang: computed from birth year
 *
 * Future (Phase 5b):
 * - ascendant/moonSign: requires birth time + ephemeris library
 */

import type { ZodiacSign, ChineseAnimal } from "@/lib/registry/astro-anchor-map.v1";
import {
  getJulianDate,
  getGMST,
  getLST,
  calculateAscendant,
  getPlanetPosition,
  getSignFromLongitude,
  PlanetName
} from "./astronomy";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ChineseElement = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";

export type AstroResult = {
  western: {
    sunSign: ZodiacSign;
    ascendant?: string;
    moonSign?: string;
    planets?: Array<{
      name: string;
      sign: string;
      degree: number;
      longitude: number;
      house?: number;
    }>;
    houses?: Array<{
      number: number;
      sign: string;
      degree: number;
      longitude: number;
    }>;
    aspects?: Array<{
      from: string;
      to: string;
      type: string;
      orb: number;
    }>;
  };
  chinese: {
    animal: ChineseAnimal;
    element: ChineseElement;
    yinYang: YinYang;
  };
};

export type BirthInput = {
  date: Date;
  time?: { hour: number; minute: number }; // Optional for future use
  place?: { lat: number; lng: number }; // Optional for future use
};

// ═══════════════════════════════════════════════════════════════════════════
// WESTERN ZODIAC (Sun Sign)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Zodiac sign date ranges (approximate, using tropical zodiac)
 * Format: [startMonth, startDay, endMonth, endDay]
 */
const ZODIAC_RANGES: [ZodiacSign, number, number, number, number][] = [
  ["capricorn", 12, 22, 1, 19],
  ["aquarius", 1, 20, 2, 18],
  ["pisces", 2, 19, 3, 20],
  ["aries", 3, 21, 4, 19],
  ["taurus", 4, 20, 5, 20],
  ["gemini", 5, 21, 6, 20],
  ["cancer", 6, 21, 7, 22],
  ["leo", 7, 23, 8, 22],
  ["virgo", 8, 23, 9, 22],
  ["libra", 9, 23, 10, 22],
  ["scorpio", 10, 23, 11, 21],
  ["sagittarius", 11, 22, 12, 21],
];

/**
 * Get sun sign from birth date
 */
export function getSunSign(date: Date): ZodiacSign {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  for (const [sign, startMonth, startDay, endMonth, endDay] of ZODIAC_RANGES) {
    // Handle Capricorn wrapping around year end
    if (startMonth > endMonth) {
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay)
      ) {
        return sign;
      }
    } else {
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (month > startMonth && month < endMonth)
      ) {
        return sign;
      }
    }
  }

  // Fallback (should never reach)
  return "aries";
}

// ═══════════════════════════════════════════════════════════════════════════
// CHINESE ZODIAC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chinese zodiac animals in cycle order (starting from Rat)
 */
const CHINESE_ANIMALS: ChineseAnimal[] = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
];

/**
 * Chinese elements in cycle order
 */
const CHINESE_ELEMENTS: ChineseElement[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

/**
 * Get Chinese zodiac animal from birth year.
 * Note: This is simplified and doesn't account for lunar new year dates.
 * For more accuracy, would need to check if birthdate is before/after
 * Chinese New Year for that year.
 */
export function getChineseAnimal(year: number): ChineseAnimal {
  // 1900 was Year of the Rat
  const index = ((year - 1900) % 12 + 12) % 12;
  return CHINESE_ANIMALS[index];
}

/**
 * Get Chinese element from birth year.
 * Elements cycle every 2 years (same element for yin and yang year).
 */
export function getChineseElement(year: number): ChineseElement {
  // Element changes every 2 years
  // 1900 was Metal Rat (yang)
  const index = Math.floor(((year - 1900) % 10 + 10) % 10 / 2);
  return CHINESE_ELEMENTS[index];
}

/**
 * Get Yin/Yang from birth year.
 * Even years are Yang, odd years are Yin.
 */
export function getYinYang(year: number): YinYang {
  return year % 2 === 0 ? "yang" : "yin";
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

// (Imports moved to top)

/**
 * Compute astrological data from birth information.
 */
export function computeAstro(input: BirthInput): AstroResult {
  const year = input.date.getFullYear();
  const sunSign = getSunSign(input.date);

  const baseDate = new Date(input.date);
  if (input.time) {
    baseDate.setHours(input.time.hour, input.time.minute, 0, 0);
  } else {
    baseDate.setHours(12, 0, 0, 0);
  }

  const jd = getJulianDate(baseDate);
  const planetOrder: Array<{ id: PlanetName; label: string }> = [
    { id: "sun", label: "Sun" },
    { id: "moon", label: "Moon" },
    { id: "mercury", label: "Mercury" },
    { id: "venus", label: "Venus" },
    { id: "mars", label: "Mars" },
    { id: "jupiter", label: "Jupiter" },
    { id: "saturn", label: "Saturn" },
    { id: "uranus", label: "Uranus" },
    { id: "neptune", label: "Neptune" },
    { id: "pluto", label: "Pluto" },
  ];

  const planets = planetOrder.map(({ id, label }) => {
    const longitude = getPlanetPosition(id, jd);
    const signInfo = getSignFromLongitude(longitude);
    return {
      name: label,
      sign: signInfo.sign,
      degree: signInfo.degree,
      longitude,
    };
  });

  const aspects = buildNatalAspects(planets);

  // Basic result
  const result: AstroResult = {
    western: {
      sunSign,
      planets,
      aspects,
      houses: [],
    },
    chinese: {
      animal: getChineseAnimal(year),
      element: getChineseElement(year),
      yinYang: getYinYang(year),
    },
  };

  // Advanced calculation if time/place available
  if (input.time && input.place) {
    // Construct full date object with time UTC assumption or local? 
    // Usually input date is local. We need to handle timezone. 
    // For MVP/Freemium static, we assume input time is Local Mean Time or broadly correct.
    // Ideally we need Timezone offset.
    // We will assume "Local Time" and if we lack TZ, we approximate or treat as UTC-1/2 for DE.
    // Or better: construct Date with the specific time.

    // Create date object with correct time
    const fullDate = new Date(input.date);
    fullDate.setHours(input.time.hour);
    fullDate.setMinutes(input.time.minute);

    // Calculate JD
    const jdForHouses = getJulianDate(fullDate); // Note: this uses UTC methods on the date object

    const gmst = getGMST(jdForHouses);
    const lst = getLST(gmst, input.place.lng);
    const ascDeg = calculateAscendant(lst, input.place.lat);
    const ascInfo = getSignFromLongitude(ascDeg);

    const moonDeg = getPlanetPosition("moon", jdForHouses);
    const moonInfo = getSignFromLongitude(moonDeg);

    // Add to result (using Type assertion if necessary as types might need update or are optional)
    // Types in AstroResult.western support ascendant/moonSign? 
    // Let's verify type above in this file.

    // We need to cast or update the type. The existing type has only sunSign. 
    // I will update the AstroResult type definition IN THIS FILE as well to match.

    Object.assign(result.western, {
      ascendant: ascInfo.sign,
      moonSign: moonInfo.sign,
    });

    const houses = buildEqualHouses(ascDeg);
    const planetsWithHouses = planets.map((planet) => ({
      ...planet,
      house: getHouseNumber(ascDeg, planet.longitude),
    }));

    result.western.houses = houses;
    result.western.planets = planetsWithHouses;
  }

  return result;
}

function buildEqualHouses(ascendantLongitude: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const longitude = (ascendantLongitude + index * 30) % 360;
    const signInfo = getSignFromLongitude(longitude);
    return {
      number: index + 1,
      sign: signInfo.sign,
      degree: signInfo.degree,
      longitude,
    };
  });
}

function getHouseNumber(ascendantLongitude: number, planetLongitude: number) {
  const diff = (planetLongitude - ascendantLongitude + 360) % 360;
  return Math.floor(diff / 30) + 1;
}

function buildNatalAspects(planets: Array<{ name: string; longitude: number }>) {
  const aspects: Array<{ from: string; to: string; type: string; orb: number }> = [];
  const aspectAngles = [
    { angle: 0, type: "conjunct" },
    { angle: 60, type: "sextile" },
    { angle: 90, type: "square" },
    { angle: 120, type: "trine" },
    { angle: 180, type: "opposite" },
  ];
  const orbAllowance = 6;

  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const from = planets[i];
      const to = planets[j];
      const diff = Math.abs(from.longitude - to.longitude);
      const distance = Math.min(diff, 360 - diff);

      for (const aspect of aspectAngles) {
        const orb = Math.abs(distance - aspect.angle);
        if (orb <= orbAllowance) {
          aspects.push({
            from: from.name,
            to: to.name,
            type: aspect.type,
            orb,
          });
          break;
        }
      }
    }
  }

  return aspects;
}

/**
 * Calculate current transits for a user
 */
export function calculateDailyTransits(natalChart: Partial<AstroResult> | null, date: Date = new Date()) {
  // TODO: Implement full transit logic matching blueprint
  // using getPlanetPosition for current date vs natal positions.
  // For now returning basic planet lookup

  const jd = getJulianDate(date);
  const currentPlanets: Record<string, { longitude: number; sign: string; degree: number }> = {};
  const planets: PlanetName[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

  planets.forEach(p => {
    const lon = getPlanetPosition(p, jd);
    currentPlanets[p] = {
      longitude: lon,
      ...getSignFromLongitude(lon)
    };
  });

  // Moon Phase (simple)
  const sunLon = currentPlanets.sun.longitude;
  const moonLon = currentPlanets.moon.longitude;
  let phaseAngle = moonLon - sunLon;
  if (phaseAngle < 0) phaseAngle += 360;

  const phaseValue = phaseAngle / 360; // 0..1

  // TRANSIT CALCULATION
  const activeTransits = [];

  if (natalChart) {
    // We assume natalChart has { planets: { sun: { longitude... }, ... } }
    // OR we just use what we have available. 
    // If we don't have full natal positions passed, we can't do much except generic transits (Moon to Sun Sign etc).
    // For MVP "Freemium", we typically just compute "Transit Planet -> Natal Sun".
    // Let's implement that robustness.

    const natalSunLon = (natalChart?.western?.sunSign)
      ? getApproxSunLongitude(natalChart.western.sunSign)
      : null;

    if (natalSunLon !== null) {
      // Check Transits to Natal Sun
      // Jupiter, Saturn, Mars, Moon

      const transitPlanetsToCheck: PlanetName[] = ["jupiter", "saturn", "mars", "moon", "venus", "mercury"];

      for (const tPlanet of transitPlanetsToCheck) {
        const tLon = currentPlanets[tPlanet].longitude;
        const diff = Math.abs(tLon - natalSunLon);
        const dist = Math.min(diff, 360 - diff);

        // Check major aspects: 0, 90, 120, 180
        const orb = 6; // Wide orb for daily general

        let aspectName = "";
        if (dist < orb) aspectName = "conjunct";
        else if (Math.abs(dist - 180) < orb) aspectName = "opposite";
        else if (Math.abs(dist - 120) < orb) aspectName = "trine";
        else if (Math.abs(dist - 90) < orb) aspectName = "square";

        if (aspectName) {
          activeTransits.push({
            planet: tPlanet,
            natalPoint: "sun",
            aspect: aspectName,
            key: `${tPlanet}_${aspectName}_sun`
          });
        }
      }
    }
  }

  return {
    date: date.toISOString(),
    currentPlanets,
    activeTransits, // New field
    moonPhase: {
      value: phaseValue,
      illumination: 0.5 * (1 - Math.cos(phaseAngle * Math.PI / 180)),
      label: getMoonPhaseLabel(phaseValue)
    }
  };
}

// Helper to estimate Sun position from Sign (middle of sign) if we don't have degree
// This is a rough fallback
function getApproxSunLongitude(sign: string): number {
  const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
  const idx = signs.indexOf(sign.toLowerCase());
  if (idx === -1) return 0;
  return idx * 30 + 15; // Middle of sign
}

function getMoonPhaseLabel(v: number): string {
  if (v < 0.03) return "New Moon";
  if (v < 0.22) return "Waxing Crescent";
  if (v < 0.28) return "First Quarter";
  if (v < 0.47) return "Waxing Gibbous";
  if (v < 0.53) return "Full Moon";
  if (v < 0.72) return "Waning Gibbous";
  if (v < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

/**
 * Calculate energy peaks for the day based on planetary hours and transits
 */
export function calculateEnergyPeaks(transits: ReturnType<typeof calculateDailyTransits>) {
  const peaks: Array<{
    time: string;
    type: 'high' | 'medium' | 'low';
    description: string;
    planet: string;
  }> = [];

  // Moon-based energy peaks (every ~2.5 hours the moon aspect changes)
  const moonSign = transits.currentPlanets.moon?.sign;

  // Morning peak - Sun influence
  peaks.push({
    time: '06:00 - 09:00',
    type: transits.activeTransits.some(t => t.planet === 'jupiter') ? 'high' : 'medium',
    description: 'Optimale Zeit für Neuanfänge und Planung',
    planet: 'sun',
  });

  // Mid-morning - Mercury influence
  peaks.push({
    time: '09:00 - 12:00',
    type: transits.activeTransits.some(t => t.planet === 'mercury' && t.aspect === 'trine') ? 'high' : 'medium',
    description: 'Beste Zeit für Kommunikation und Lernen',
    planet: 'mercury',
  });

  // Afternoon - Mars influence
  const hasMarsTension = transits.activeTransits.some(t => t.planet === 'mars' && (t.aspect === 'square' || t.aspect === 'opposite'));
  peaks.push({
    time: '14:00 - 17:00',
    type: hasMarsTension ? 'low' : 'high',
    description: hasMarsTension ? 'Vorsicht bei Konflikten, Energie kanalisieren' : 'Ideale Zeit für aktive Arbeit und Sport',
    planet: 'mars',
  });

  // Evening - Venus influence
  peaks.push({
    time: '18:00 - 21:00',
    type: transits.activeTransits.some(t => t.planet === 'venus') ? 'high' : 'medium',
    description: 'Beste Zeit für Beziehungen und Kreativität',
    planet: 'venus',
  });

  // Night - Moon influence
  const moonPhaseEnergy = transits.moonPhase.value > 0.4 && transits.moonPhase.value < 0.6 ? 'high' : 'medium';
  peaks.push({
    time: '21:00 - 00:00',
    type: moonPhaseEnergy,
    description: 'Zeit für Reflexion und emotionale Verarbeitung',
    planet: 'moon',
  });

  return peaks;
}

/**
 * Get overall day quality based on transits
 */
export function getDayQuality(transits: ReturnType<typeof calculateDailyTransits>): {
  score: number; // 0-100
  label: string;
  color: string;
} {
  let score = 50; // Base score

  for (const transit of transits.activeTransits) {
    // Positive aspects
    if (transit.aspect === 'trine') score += 15;
    if (transit.aspect === 'conjunct' && ['venus', 'jupiter'].includes(transit.planet)) score += 20;
    if (transit.aspect === 'conjunct' && transit.planet === 'mercury') score += 10;

    // Challenging aspects
    if (transit.aspect === 'square') score -= 10;
    if (transit.aspect === 'opposite' && ['mars', 'saturn'].includes(transit.planet)) score -= 15;

    // Jupiter always adds optimism
    if (transit.planet === 'jupiter') score += 10;
    // Saturn can be sobering
    if (transit.planet === 'saturn' && transit.aspect !== 'trine') score -= 5;
  }

  // Moon phase influence
  if (transits.moonPhase.label === 'Full Moon') score += 10;
  if (transits.moonPhase.label === 'New Moon') score += 5;

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine label and color
  let label: string;
  let color: string;

  if (score >= 80) {
    label = 'Exzellent';
    color = '#22C55E';
  } else if (score >= 65) {
    label = 'Gut';
    color = '#7AA7A1';
  } else if (score >= 45) {
    label = 'Ausgeglichen';
    color = '#C9A46A';
  } else if (score >= 30) {
    label = 'Herausfordernd';
    color = '#F59E0B';
  } else {
    label = 'Anspruchsvoll';
    color = '#EF4444';
  }

  return { score, label, color };
}

/**
 * Check if birth time is known (for future asc/moon calculation)
 */
export function hasBirthTime(input: BirthInput): boolean {
  return input.time !== undefined;
}

/**
 * Check if birth place is known (for future asc calculation)
 */
export function hasBirthPlace(input: BirthInput): boolean {
  return input.place !== undefined;
}
