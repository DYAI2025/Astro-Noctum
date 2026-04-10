/**
 * Synastry aspect computation — DEC-aspect-orb-tolerances
 *
 * Computes inter-aspects between two sets of planet positions (ecliptic longitudes).
 * Uses staggered orb tolerances as decided on 2026-04-10:
 *   Conjunction / Opposition : ±8°
 *   Trine / Square           : ±6°
 *   Sextile                  : ±4°
 * Only the 5 main aspects are included in V1.
 */

export interface AspectDefinition {
  name: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  angle: number;
  orb: number;
}

export const ASPECT_DEFINITIONS: AspectDefinition[] = [
  { name: 'conjunction', angle: 0,   orb: 8 },
  { name: 'opposition',  angle: 180, orb: 8 },
  { name: 'trine',       angle: 120, orb: 6 },
  { name: 'square',      angle: 90,  orb: 6 },
  { name: 'sextile',     angle: 60,  orb: 4 },
];

/** The 7 traditional planets used in the Signatur V2 engine. */
export const SYNASTRY_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;
export type SynastryPlanet = typeof SYNASTRY_PLANETS[number];

export interface SynastryAspect {
  planet1: string;
  planet2: string;
  type: AspectDefinition['name'];
  /** Ideal angle for this aspect type (0, 60, 90, 120, or 180). */
  angle: number;
  /** Deviation from the exact aspect angle in degrees (always ≥ 0). */
  orb: number;
  /** True if the aspect is within the tighter half of the orb (orb ≤ orb/2). */
  exact: boolean;
}

/**
 * Computes the smallest angular separation (0–180°) between two ecliptic longitudes.
 */
export function angularSeparation(lon1: number, lon2: number): number {
  const diff = Math.abs(((lon2 - lon1) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Returns all inter-aspects between two sets of planet positions.
 * Positions are ecliptic longitudes (0–360°) keyed by planet name.
 */
export function computeAspects(
  positions1: Partial<Record<string, number>>,
  positions2: Partial<Record<string, number>>,
): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];

  for (const p1 of SYNASTRY_PLANETS) {
    const lon1 = positions1[p1];
    if (lon1 == null) continue;

    for (const p2 of SYNASTRY_PLANETS) {
      const lon2 = positions2[p2];
      if (lon2 == null) continue;

      const sep = angularSeparation(lon1, lon2);

      for (const def of ASPECT_DEFINITIONS) {
        const deviation = Math.abs(sep - def.angle);
        if (deviation <= def.orb) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type:    def.name,
            angle:   def.angle,
            orb:     Math.round(deviation * 100) / 100,
            exact:   deviation <= def.orb / 2,
          });
          break; // one aspect per planet pair per pass
        }
      }
    }
  }

  return aspects;
}

/**
 * Extracts ecliptic longitudes from a FuFirE positions/bodies map.
 * Returns only planets in SYNASTRY_PLANETS that have a valid longitude.
 */
export function extractLongitudes(
  bodies: Record<string, { longitude?: number }> | undefined,
): Partial<Record<string, number>> {
  if (!bodies) return {};
  const result: Partial<Record<string, number>> = {};
  for (const planet of SYNASTRY_PLANETS) {
    const lon = bodies[planet]?.longitude;
    if (lon != null && isFinite(lon)) {
      result[planet] = ((lon % 360) + 360) % 360; // normalise to [0,360)
    }
  }
  return result;
}
