
/**
 * Shared Astronomy & Ba Zi Constants
 */

export const STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
export const STEMS_CN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

export const BRANCHES = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
export const BRANCHES_CN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const ZODIAC_ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
export const ZODIAC_ANIMALS_DE = ['Ratte', 'Büffel', 'Tiger', 'Hase', 'Drache', 'Schlange', 'Pferd', 'Ziege', 'Affe', 'Hahn', 'Hund', 'Schwein'];

export const WU_XING = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
export const WU_XING_DE = ['Holz', 'Feuer', 'Erde', 'Metall', 'Wasser'];

// Stem -> Element Index (0=Wood, 1=Fire, 2=Earth, 3=Metal, 4=Water)
// Jia/Yi -> Wood, Bing/Ding -> Fire, etc.
export const STEM_ELEMENT_INDEX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];

// Branch -> Fixed Element Index (Standard TCM associations)
// Zi (Rat)=Water, Chou (Ox)=Earth, Yin (Tiger)=Wood, etc.
// Sequence: Water, Earth, Wood, Wood, Earth, Fire, Fire, Earth, Metal, Metal, Earth, Water
export const BRANCH_FIXED_ELEMENT_INDEX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

// Solar Month Starts (Longitude Deg)
// Month 1 (Tiger/Yin) starts at 315° (Li Chun)
export const SOLAR_MONTH_START_LONS = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];

/**
 * Normalizes degrees to 0-360 range
 */
export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Calculates Equation of Time (EoT) in minutes.
 * Approximation based on NOAA.
 */
export function calculateEquationOfTime(utcDate: Date): number {
  const start = Date.UTC(utcDate.getUTCFullYear(), 0, 1, 0, 0, 0);
  const diff = utcDate.getTime() - start;
  const doy = Math.floor(diff / 86400000); // Day of Year
  
  // B in radians
  const B = (2 * Math.PI / 364.0) * (doy - 81);
  
  // EoT in minutes
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/**
 * Calculates True Solar Time (TST) in minutes (0-1440).
 */
export function calculateTrueSolarTime(
    hour: number, 
    minute: number, 
    longitudeDeg: number, 
    utcDate: Date,
    tzOffsetMinutes: number // e.g. +60 for CET
): number {
    // Local Mean Time (LMT) minutes
    // Input hour is "Clock Time" (Local Civil Time).
    // We need UTC first or work relative to timezone.
    
    // Easier approach: Start from UTC
    const utcHours = utcDate.getUTCHours();
    const utcMinutes = utcDate.getUTCMinutes() + (utcDate.getUTCSeconds() / 60);
    const totalUtcMinutes = utcHours * 60 + utcMinutes;
    
    // Solar Time = UTC + (Long * 4min) + EoT
    // (Positive Longitude = East = Later Time)
    const geoOffset = longitudeDeg * 4; 
    const eot = calculateEquationOfTime(utcDate);
    
    const trueSolarMinutes = totalUtcMinutes + geoOffset + eot;
    
    return normalizeMinutes(trueSolarMinutes);
}

function normalizeMinutes(mins: number): number {
    return ((mins % 1440) + 1440) % 1440;
}

/**
 * Helper: Julian Day Number (JDN) from Date object.
 * Used for the Day Pillar cycle.
 */
export function getJulianDayNumber(date: Date): number {
    // Simple conversion for JDN (starts at noon)
    // We need integer JDN for the day pillar lookup.
    // Algorithm for JD from year/month/day
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth() + 1;
    let d = date.getUTCDate();
    
    if (m <= 2) {
        y -= 1;
        m += 12;
    }
    
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    
    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    return Math.floor(jd);
}

/**
 * Helper: Get Western Zodiac Sign from Sun Longitude.
 */
export function getWesternZodiacSign(lon: number): string {
    const signs = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 
        'Leo', 'Virgo', 'Libra', 'Scorpio', 
        'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    // 0 = Aries start (Vernal Equinox).
    const idx = Math.floor(((lon % 360) + 360) % 360 / 30);
    return signs[idx];
}
