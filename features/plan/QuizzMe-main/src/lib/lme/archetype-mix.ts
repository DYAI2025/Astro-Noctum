
// LME/DUBA - Slice 1: Archetype Mix
// Calculates the user's affinity to each archetype based on their psyche state.

import { PsycheState } from './psyche-state';
import { ARCHETYPES, Archetype } from './archetypes';

export interface ArchetypeResult {
    archetypeId: string;
    weight: number; // 0.0 - 1.0 (percentage match)
    archetype: Archetype;
}

export type ArchetypeMix = ArchetypeResult[];

/**
 * Calculates the Euclidean distance between the user's state and an archetype's vector.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateDistance(state: PsycheState, protoVector: any): number {
    let sumSq = 0;
    const dimensions = ['shadow', 'connection', 'structure', 'emergence', 'depth'];

    for (const dim of dimensions) {
        const userVal = state[dim as keyof PsycheState]?.value || 0.5;
        const protoVal = protoVector[dim] || 0.5;
        const diff = userVal - protoVal;
        sumSq += diff * diff;
    }

    return Math.sqrt(sumSq);
}

/**
 * Computes the archetype mix using a Softmax function over negative distances.
 * Closer distance = Higher weight.
 */
export function computeArchetypeMix(state: PsycheState): ArchetypeMix {
    const tau = 0.5; // Temperature parameter. Lower = sharper peaks (more exclusive). Higher = flatter distribution.

    const results: { id: string; score: number; archetype: Archetype }[] = [];
    let sumExp = 0;

    // 1. Calculate raw scores (exp(-dist^2 / tau))
    Object.values(ARCHETYPES).forEach((archetype) => {
        const dist = calculateDistance(state, archetype.protoVector);
        // Gaussian kernel
        const score = Math.exp(-(dist * dist) / tau);

        results.push({
            id: archetype.id,
            score: score,
            archetype: archetype
        });

        sumExp += score;
    });

    // 2. Normalize to probability distribution (Softmax)
    const mix: ArchetypeMix = results.map((r) => ({
        archetypeId: r.id,
        weight: r.score / sumExp,
        archetype: r.archetype
    }));

    // 3. Sort by weight descending
    mix.sort((a, b) => b.weight - a.weight);

    return mix;
}
