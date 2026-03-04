// ── Birth Constellation from Zodiac Sign ──────────────────────────────────
//
// Maps Western zodiac sign names (as returned by the BAFE API) to the
// corresponding IAU constellation key used in STARS / CONSTELLATION_LINES.
//
// Note on astronomy: The "birth constellation" shown in Planetarium Mode is
// the constellation the Sun was in at the time of birth — i.e. the sun sign's
// constellation. This requires only the date, not birth location.
// True Alt/Az visibility (whether the constellation rises above the horizon at
// a given location) is NOT computed here; that would require an ephemeris
// library (e.g. astronomy-engine).

export interface ConstellationInfo {
  /** Key matching CONSTELLATION_LINES and STARS.con in astronomy/data.ts */
  key: string;
  /** Human-readable names */
  name: { en: string; de: string };
  /** API sign name */
  sign: string;
}

// Scorpio → "Scorpius" (IAU), Capricorn → "Capricornus" (IAU)
export const SIGN_TO_CONSTELLATION: Record<string, ConstellationInfo> = {
  Aries:       { key: "Aries",       name: { en: "Aries",       de: "Widder"      }, sign: "Aries"       },
  Taurus:      { key: "Taurus",      name: { en: "Taurus",      de: "Stier"       }, sign: "Taurus"      },
  Gemini:      { key: "Gemini",      name: { en: "Gemini",      de: "Zwillinge"   }, sign: "Gemini"      },
  Cancer:      { key: "Cancer",      name: { en: "Cancer",      de: "Krebs"       }, sign: "Cancer"      },
  Leo:         { key: "Leo",         name: { en: "Leo",         de: "Löwe"        }, sign: "Leo"         },
  Virgo:       { key: "Virgo",       name: { en: "Virgo",       de: "Jungfrau"    }, sign: "Virgo"       },
  Libra:       { key: "Libra",       name: { en: "Libra",       de: "Waage"       }, sign: "Libra"       },
  Scorpio:     { key: "Scorpius",    name: { en: "Scorpius",    de: "Skorpion"    }, sign: "Scorpio"     },
  Sagittarius: { key: "Sagittarius", name: { en: "Sagittarius", de: "Schütze"     }, sign: "Sagittarius" },
  Capricorn:   { key: "Capricornus", name: { en: "Capricorn",   de: "Steinbock"   }, sign: "Capricorn"   },
  Aquarius:    { key: "Aquarius",    name: { en: "Aquarius",    de: "Wassermann"  }, sign: "Aquarius"    },
  Pisces:      { key: "Pisces",      name: { en: "Pisces",      de: "Fische"      }, sign: "Pisces"      },
};

/** Look up constellation info for an API zodiac sign name. Returns undefined for unknown signs. */
export function getConstellationForSign(sign: string): ConstellationInfo | undefined {
  if (!sign) return undefined;
  return SIGN_TO_CONSTELLATION[sign];
}

/**
 * Determine the Sun sign from a calendar month + day.
 * Used as a client-side fallback when API data hasn't loaded yet.
 * Note: cusp dates vary ±1 day by year; use BAFE-calculated sign for precision.
 */
export function getSunSignFromDate(month: number, day: number): string {
  if ((month === 3  && day >= 21) || (month === 4  && day <= 19)) return "Aries";
  if ((month === 4  && day >= 20) || (month === 5  && day <= 20)) return "Taurus";
  if ((month === 5  && day >= 21) || (month === 6  && day <= 20)) return "Gemini";
  if ((month === 6  && day >= 21) || (month === 7  && day <= 22)) return "Cancer";
  if ((month === 7  && day >= 23) || (month === 8  && day <= 22)) return "Leo";
  if ((month === 8  && day >= 23) || (month === 9  && day <= 22)) return "Virgo";
  if ((month === 9  && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1  && day <= 19)) return "Capricorn";
  if ((month === 1  && day >= 20) || (month === 2  && day <= 18)) return "Aquarius";
  return "Pisces"; // Feb 19 – Mar 20
}
