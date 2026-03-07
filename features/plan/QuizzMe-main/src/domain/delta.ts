/**
 * Delta Computation & Movers Logic
 * Handles calculation of changes between psyche profile snapshots
 * and identification of "top movers" (dimensions with significant changes)
 */

import { PsycheCoreStats, PsycheState, PsycheDelta } from '@/lib/types/psyche';

/**
 * Represents a dimension that has changed
 */
export interface Mover {
    dimension: string;
    delta: number; // signed change value
    magnitude: number; // absolute magnitude for sorting
}

/**
 * Computes deltas between two core stat snapshots
 *
 * @param current - Current stats
 * @param previous - Previous stats
 * @returns Partial stats delta object
 */
export function computeStatsDelta(
    current: PsycheCoreStats,
    previous: PsycheCoreStats
): Partial<PsycheCoreStats> {
    const delta: Partial<PsycheCoreStats> = {};

    (Object.keys(current) as Array<keyof PsycheCoreStats>).forEach((key) => {
        const diff = current[key] - previous[key];
        if (Math.abs(diff) > 0.001) { // Filter out floating point noise
            delta[key] = diff;
        }
    });

    return delta;
}

/**
 * Computes deltas between two state snapshots
 *
 * @param current - Current state
 * @param previous - Previous state
 * @returns Partial state delta object
 */
export function computeStateDelta(
    current: PsycheState,
    previous: PsycheState
): Partial<PsycheState> {
    const delta: Partial<PsycheState> = {};

    (Object.keys(current) as Array<keyof PsycheState>).forEach((key) => {
        const diff = current[key] - previous[key];
        if (Math.abs(diff) > 0.001) {
            delta[key] = diff;
        }
    });

    return delta;
}

/**
 * Extracts movers from stats delta
 *
 * @param delta - Stats delta object
 * @returns Array of movers sorted by magnitude (descending)
 */
export function extractStatsMovers(delta: Partial<PsycheCoreStats>): Mover[] {
    const movers: Mover[] = [];

    (Object.keys(delta) as Array<keyof PsycheCoreStats>).forEach((key) => {
        const value = delta[key];
        if (value !== undefined) {
            movers.push({
                dimension: key,
                delta: value,
                magnitude: Math.abs(value),
            });
        }
    });

    // Sort by magnitude descending
    return movers.sort((a, b) => b.magnitude - a.magnitude);
}

/**
 * Extracts movers from state delta
 *
 * @param delta - State delta object
 * @returns Array of movers sorted by magnitude (descending)
 */
export function extractStateMovers(delta: Partial<PsycheState>): Mover[] {
    const movers: Mover[] = [];

    (Object.keys(delta) as Array<keyof PsycheState>).forEach((key) => {
        const value = delta[key];
        if (value !== undefined) {
            movers.push({
                dimension: key,
                delta: value,
                magnitude: Math.abs(value),
            });
        }
    });

    // Sort by magnitude descending
    return movers.sort((a, b) => b.magnitude - a.magnitude);
}

/**
 * Computes top movers from a full delta
 * Combines stats and state movers and returns top N by magnitude
 *
 * @param delta - Full psyche delta
 * @param topN - Number of top movers to return (default 3)
 * @returns Top N movers sorted by magnitude
 */
export function computeTopMovers(delta: PsycheDelta, topN = 3): Mover[] {
    const allMovers: Mover[] = [
        ...extractStatsMovers(delta.stats_delta),
        ...extractStateMovers(delta.state_delta),
    ];

    // Sort by magnitude and take top N
    return allMovers
        .sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, topN);
}

/**
 * Creates a delta from current and previous snapshots
 *
 * @param current - Current profile snapshot
 * @param previous - Previous profile snapshot
 * @returns Complete delta object
 */
export function createDelta(
    current: { stats: PsycheCoreStats; state: PsycheState },
    previous: { stats: PsycheCoreStats; state: PsycheState }
): PsycheDelta {
    const stats_delta = computeStatsDelta(current.stats, previous.stats);
    const state_delta = computeStateDelta(current.state, previous.state);

    const delta: PsycheDelta = {
        date: new Date().toISOString(),
        stats_delta,
        state_delta,
    };

    // Compute and attach movers
    const movers = computeTopMovers(delta);
    if (movers.length > 0) {
        delta.movers = movers;
    }

    return delta;
}

/**
 * Gets top movers from delta, with fallback to computing from snapshots
 *
 * @param delta - Delta object (may have precomputed movers)
 * @param topN - Number of top movers to return
 * @returns Top movers array
 */
export function getTopMovers(delta: PsycheDelta, topN = 3): Mover[] {
    // Use precomputed movers if available
    if (delta.movers && delta.movers.length > 0) {
        return delta.movers.slice(0, topN);
    }

    // Otherwise compute on the fly
    return computeTopMovers(delta, topN);
}

/**
 * Checks if a delta is significant (has meaningful changes)
 * A delta is significant if any dimension changed by >= threshold
 *
 * @param delta - Delta to check
 * @param threshold - Minimum magnitude to be considered significant (default 0.05 = 5%)
 * @returns True if delta is significant
 */
export function isDeltaSignificant(delta: PsycheDelta, threshold = 0.05): boolean {
    const movers = getTopMovers(delta, 1);
    return movers.length > 0 && movers[0].magnitude >= threshold;
}
