/**
 * Derived Stats Calculator
 * Implements logic to compute secondary stats from core psyche profile.
 *
 * All formulas follow the specification in feature-char-sheet-impl.md (FR-3)
 */
import { PsycheCoreStats, DerivedStatsV1 } from '@/lib/types/psyche';

/**
 * Maps a 0..1 value to a 0..100 integer percentage
 * Clamps input to valid range [0, 1]
 *
 * @param value - Input value in range 0..1
 * @returns Integer percentage 0..100
 */
export function toPercent01(value: number): number {
    return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

/**
 * Calculates derived stats based on core stats
 *
 * Rules (FR-3):
 * - vitality = avg(clarity, connection)
 * - willpower = avg(courage, order)
 * - chaos = shadow
 * - harmony = 1 - abs(shadow - connection) [mapped to 0..100]
 *
 * All inputs are expected to be in range [0, 1]
 * All outputs are in range [0, 100]
 *
 * @param stats - Core psyche stats (0..1 range)
 * @returns Derived stats (0..100 range)
 */
export function calcDerivedStats(stats: PsycheCoreStats): DerivedStatsV1 {
    // Helper for averaging two values
    const avg = (a: number, b: number) => (a + b) / 2;

    // Calculate raw values (0..1)
    const vitalityRaw = avg(stats.clarity, stats.connection);
    const willpowerRaw = avg(stats.courage, stats.order);
    const chaosRaw = stats.shadow;

    // Harmony: 1 - distance between shadow and connection
    // If shadow and connection are far apart (dist=1), harmony is 0
    // If they are equal (dist=0), harmony is 1
    // This represents inner coherence/alignment
    const dist = Math.abs(stats.shadow - stats.connection);
    const harmonyRaw = 1 - dist;

    // Convert all to 0..100 percentage
    return {
        vitality: toPercent01(vitalityRaw),
        willpower: toPercent01(willpowerRaw),
        chaos: toPercent01(chaosRaw),
        harmony: toPercent01(harmonyRaw),
    };
}
