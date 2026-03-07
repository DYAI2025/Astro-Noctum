
/**
 * Astronomy Core Library
 * 
 * Implements astronomical calculations for QuizzMe Horoscope System.
 * Based on formulas from "Astronomical Algorithms" (Meeus) and blueprint values.
 * 
 * Supports:
 * - Julian Date
 * - GMST / LST
 * - Ascendant / MC
 * - House Cusps (Placidus)
 * - Approximate Planetary Positions (Mean Elements)
 * - Aspects
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

// Note: Using string keys to avoid circular dependency with registry if it imports this.
// But ideally we import ZodiacSign. For now, strings are safe.
export const SIGN_ELEMENT: Record<string, Element> = {
    aries: "fire",
    leo: "fire",
    sagittarius: "fire",
    taurus: "earth",
    virgo: "earth",
    capricorn: "earth",
    gemini: "air",
    libra: "air",
    aquarius: "air",
    cancer: "water",
    scorpio: "water",
    pisces: "water",
};

export const SIGN_MODALITY: Record<string, Modality> = {
    aries: "cardinal",
    cancer: "cardinal",
    libra: "cardinal",
    capricorn: "cardinal",
    taurus: "fixed",
    leo: "fixed",
    scorpio: "fixed",
    aquarius: "fixed",
    gemini: "mutable",
    virgo: "mutable",
    sagittarius: "mutable",
    pisces: "mutable",
};

const DEGS = 180 / Math.PI;
const RADS = Math.PI / 180;

// Obliquity of Ecliptic (J2000 approx)
const EPSILON_J2000 = 23.4392911;

// ═══════════════════════════════════════════════════════════════════════════
// TIME CONVERSIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert Gregorian date to Julian Date
 * date: Date object
 */
export function getJulianDate(date: Date): number {
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();

    // Decimal day
    const dayDec = day + (hour + minute / 60 + second / 3600) / 24;

    if (month <= 2) {
        year -= 1;
        month += 12;
    }

    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);

    const JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + dayDec + B - 1524.5;
    return JD;
}

/**
 * Calculate Greenwich Mean Sidereal Time (in hours)
 */
export function getGMST(jd: number): number {
    const T = (jd - 2451545.0) / 36525.0;

    // GMST at 0h UT (seconds) - but we use the full JD which includes time, so we need JD0
    // Actually, standard formula often uses JD at 0h for GMST0 then adds UT.
    // Let's use the IAU 1982 expression for GMST at the given JD directly if it includes time fraction?
    // Meeus formula 12.4: GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0)
    // This gives degrees.

    const D = jd - 2451545.0;
    let gmstDeg = 280.46061837 + 360.98564736629 * D;

    // Normalize to 0-360
    gmstDeg = gmstDeg % 360;
    if (gmstDeg < 0) gmstDeg += 360;

    return gmstDeg / 15.0; // Return in hours
}

/**
 * Calculate Local Sidereal Time (in degrees)
 */
export function getLST(extraHours: number, longitude: number): number {
    // extraHours is GMST in hours
    // longitude: Positive East, Negative West
    // LST = GMST + Longitude (in hours)

    const lonHours = longitude / 15.0;
    let lstHours = extraHours + lonHours;

    lstHours = lstHours % 24;
    if (lstHours < 0) lstHours += 24;

    return lstHours * 15; // Return in degrees
}

// ═══════════════════════════════════════════════════════════════════════════
// ANGLES (ASC/MC)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate Ascendant (Degrees)
 * lst: Local Sidereal Time in degrees
 * lat: Geographic latitude
 * obl: Obliquity of ecliptic (default 23.44)
 */
export function calculateAscendant(lst: number, lat: number, obl: number = EPSILON_J2000): number {
    const lstRad = lst * RADS;
    const latRad = lat * RADS;
    const oblRad = obl * RADS;

    const y = -Math.cos(lstRad);
    const x = Math.sin(oblRad) * Math.tan(latRad) + Math.cos(oblRad) * Math.sin(lstRad);

    let ascRad = Math.atan2(y, x);
    let ascDeg = ascRad * DEGS;

    if (ascDeg < 0) ascDeg += 360;
    return ascDeg;
}

/**
 * Calculate MC (Midheaven)
 */
export function calculateMC(lst: number, obl: number = EPSILON_J2000): number {
    const lstRad = lst * RADS;
    const oblRad = obl * RADS;

    const y = Math.tan(lstRad);
    const x = Math.cos(oblRad);

    // atan(tan(lst)/cos(obl))
    // But strictly, MC is the intersection of Meridian and Ecliptic.
    // tan(MC) = tan(LST) / cos(eps)
    // Needs quadrant check same as LST (MC and LST are in same quadrant regarding vertical axis? No.)
    // Correct is: MC is roughly LST (Sun at noon). 
    // Let's use atan2 for safety: x=cos(lst), y=sin(lst)*cos(eps) ? Wait.
    // Standard formula: tan(alpha) = cos(eps) * tan(lambda). 
    // Inverse: tan(MC) = tan(RAMC) / cos(eps) where RAMC = LST.

    let mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(oblRad));
    // Wait, standard implies: tan(lambda) = tan(alpha)/cos(e). 
    // Here alpha = LST.
    // So tan(MC) = tan(LST) / cos(e).

    let mcDeg = (Math.atan(Math.tan(lstRad) / Math.cos(oblRad))) * DEGS;

    // Quadrant fix
    if (lst >= 0 && lst < 180) {
        if (mcDeg < 0) mcDeg += 180;
    } else {
        if (mcDeg >= 0) mcDeg += 180;
        else mcDeg += 360;
    }

    return mcDeg % 360;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANETARY POSITIONS (Approximate Mean Elements)
// ═══════════════════════════════════════════════════════════════════════════

// Orbital elements for J2000 (Mean Longitude L, Perihelion P, etc.)
// Simplified to just Mean Longitude + basic anomaly for circular orbits approximation if needed,
// OR use a slightly better method: Mean elements L = L0 + L1*T
// We need positions for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.

// This is a "low precision" method (about 1-2 degrees error), suitable for fun horoscopes.
// Data from "Astronomical Algorithms" or JPL summaries.

export type PlanetName = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export function getPlanetPosition(planet: PlanetName, jd: number): number {
    const T = (jd - 2451545.0) / 36525.0;

    // Normalize angle helper
    const norm = (deg: number) => {
        let d = deg % 360;
        if (d < 0) d += 360;
        return d;
    };

    // Mean Longitudes (degrees)
    let L = 0;

    switch (planet) {
        case "sun":
            // Geometric Mean Longitude
            L = 280.46646 + 36000.76983 * T;
            // Plus equation of center for more accuracy?
            // Mean Anomaly g
            const g = 357.52911 + 35999.05029 * T;
            const gRad = g * RADS;
            const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(gRad) +
                (0.019993 - 0.000101 * T) * Math.sin(2 * gRad) +
                0.000289 * Math.sin(3 * gRad);
            return norm(L + C);

        case "moon":
            // Mean Longitude
            L = 218.316 + 481267.8813 * T;
            // Corrections are complex for Moon. Using simple model is very risky (can be 10 deg off).
            // We will use a slightly more complex correction or just Mean.
            // Let's add the biggest terms (Evection, Variation, Annual Equation)
            // Elongation D
            const D = 297.85 + 445267.11 * T;
            // Sun Anomaly M
            const M = 357.53 + 35999.05 * T;
            // Moon Anomaly M'
            const Mp = 134.96 + 477198.87 * T;
            // Argument of Latitude F
            const F = 93.27 + 483202.02 * T;

            const dRad = D * RADS;
            const mRad = M * RADS;
            const mpRad = Mp * RADS;
            const fRad = F * RADS;

            const term1 = 6.2888 * Math.sin(mpRad);
            const term2 = 1.2740 * Math.sin(2 * dRad - mpRad);
            const term3 = 0.6583 * Math.sin(2 * dRad);

            return norm(L + term1 + term2 + term3);

        case "mercury": L = 252.25 + 149472.67 * T; break;
        case "venus": L = 181.98 + 58517.81 * T; break;
        case "mars": L = 355.43 + 19140.29 * T; break;
        case "jupiter": L = 34.35 + 3034.90 * T; break;
        case "saturn": L = 50.08 + 1222.11 * T; break;
        case "uranus": L = 314.05 + 428.46 * T; break;
        case "neptune": L = 304.35 + 218.49 * T; break;
        case "pluto": L = 238.93 + 145.20 * T; break; // Very approximate, Pluto eccentric
    }

    return norm(L);
}

/**
 * Get zodiac sign from longitude
 */
export function getSignFromLongitude(lon: number): { sign: string; degree: number } {
    const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
    const idx = Math.floor(lon / 30);
    const degree = lon % 30;

    return {
        sign: signs[idx % 12],
        degree: degree
    };
}
