
// LME/DUBA - Slice 1: Marker Aggregator
// Collects markers from quiz answers and calculates the delta for the psyche state.

import { PsycheDimensionId } from './psyche-dimensions';

export interface MarkerSet {
    [dimensionId: string]: number; // -1.0 to 1.0 (usually 0.0 to 1.0 for intensity)
}

export interface QuizResultPsyche {
    markerScores: Record<PsycheDimensionId, number>; // Averaged scores per dimension
    reliabilityWeight: number; // How much this quiz impacts the profile (0.1 - 1.0)
}

/**
 * Aggregates a list of selected answer markers into a single score map.
 * @param selectedMarkers Array of marker objects from the selected answers
 * @param reliabilityWeight Weight of the quiz type (e.g., deep test = 0.8, fun test = 0.3)
 */
export function aggregateMarkers(
    selectedMarkers: MarkerSet[],
    reliabilityWeight: number
): QuizResultPsyche {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    // 1. Sum up all markers
    selectedMarkers.forEach((markers) => {
        Object.entries(markers).forEach(([dim, value]) => {
            if (!sums[dim]) {
                sums[dim] = 0;
                counts[dim] = 0;
            }
            sums[dim] += value;
            counts[dim] += 1;
        });
    });

    // 2. Calculate average per dimension
    const markerScores: Record<string, number> = {};

    Object.keys(sums).forEach((dim) => {
        if (counts[dim] > 0) {
            markerScores[dim] = sums[dim] / counts[dim];
        }
    });

    return {
        markerScores,
        reliabilityWeight,
    };
}
