// ─────────────────────────────────────────────────────────────
// Transit Engine — simulated planetary positions over N days
// Structure is BAFE-ready: replace generateTransitTimeline()
// with a real ephemeris call when BAFE exposes the endpoint.
// ─────────────────────────────────────────────────────────────

export type ActiveTransit = {
  planet: string;
  symbol: string;
  sector: number;
  strength: number;
};

export type DayTransit = {
  day: number;
  signals: number[];           // 12 normalized sector influences [0..1]
  activeTransits: ActiveTransit[];
};

type PlanetDef = {
  name: string;
  symbol: string;
  speedDegPerDay: number;     // degrees moved per calendar day
  strength: number;           // max influence weight
  natalSectors: number[];     // sectors this planet traditionally rules
};

const PLANETS: PlanetDef[] = [
  { name: 'Mars',    symbol: '♂', speedDegPerDay: 0.524, strength: 0.18, natalSectors: [0, 7, 4] },
  { name: 'Venus',   symbol: '♀', speedDegPerDay: 1.200, strength: 0.14, natalSectors: [1, 6, 3] },
  { name: 'Merkur',  symbol: '☿', speedDegPerDay: 4.092, strength: 0.10, natalSectors: [2, 5, 8] },
  { name: 'Jupiter', symbol: '♃', speedDegPerDay: 0.083, strength: 0.12, natalSectors: [8, 4, 11] },
  { name: 'Saturn',  symbol: '♄', speedDegPerDay: 0.033, strength: 0.15, natalSectors: [9, 5, 10] },
  { name: 'Mond',    symbol: '☽', speedDegPerDay: 13.18, strength: 0.08, natalSectors: [3, 11, 1] },
];

/**
 * Generates a transit timeline for N days.
 * Each day: normalized 12-sector influence array + top-3 active transits.
 *
 * Aspects modelled:
 *   Conjunction  (0°)   → +50%
 *   Opposition  (180°)  → +35%
 *   Trine       (120°)  → +25%
 *   Square       (90°)  → +15%
 */
export function generateTransitTimeline(days: number, offsetDays = 0): DayTransit[] {
  const timeline: DayTransit[] = [];

  for (let d = 0; d < days; d++) {
    const dayIdx = d + offsetDays;
    const signals = new Array(12).fill(0) as number[];
    const activeTransits: ActiveTransit[] = [];

    for (const planet of PLANETS) {
      // Position in degrees (mod 360), scaled by calendar-accurate speed
      const posDeg = (dayIdx * planet.speedDegPerDay) % 360;
      const primarySector = Math.floor((posDeg / 360) * 12) % 12;

      const influence = planet.strength * (0.7 + 0.3 * Math.sin(dayIdx * 0.2 + planet.speedDegPerDay));

      // Current sector + neighbours
      signals[primarySector] += influence;
      signals[(primarySector + 1) % 12] += influence * 0.4;
      signals[(primarySector + 11) % 12] += influence * 0.3;

      // Aspect-based resonance with natal (traditional) sectors
      for (const natal of planet.natalSectors) {
        const dist = Math.abs(primarySector - natal);
        const minDist = Math.min(dist, 12 - dist);
        if (minDist === 0)      signals[natal] += influence * 0.50; // Conjunction
        else if (minDist === 6) signals[natal] += influence * 0.35; // Opposition
        else if (minDist === 4) signals[natal] += influence * 0.25; // Trine
        else if (minDist === 3) signals[natal] += influence * 0.15; // Square
      }

      if (influence > 0.05) {
        activeTransits.push({
          planet: planet.name,
          symbol: planet.symbol,
          sector: primarySector,
          strength: influence,
        });
      }
    }

    // Normalize to [0..1]
    const maxS = Math.max(...signals, 0.01);
    const normalized = signals.map(s => Math.min(s / maxS, 1));

    timeline.push({
      day: d,
      signals: normalized,
      activeTransits: activeTransits
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 3),
    });
  }

  return timeline;
}

/**
 * Compute offset so day 0 of a fresh timeline = today.
 * Pass this as `offsetDays` to generateTransitTimeline().
 */
export function todayOffset(): number {
  const epoch = new Date(2000, 0, 1); // J2000
  const now = new Date();
  return Math.floor((now.getTime() - epoch.getTime()) / 86_400_000);
}
