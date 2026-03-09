
// LME/DUBA - Slice 1: Core Aggregation Logic
// Updates the PsycheState based on new quiz markers.

import { DimensionState, PsycheState } from './psyche-state';
import { PSYCHE_DIMENSIONS, PsycheDimensionId } from './psyche-dimensions';

/**
 * Updates a single dimension state based on a new input value and alpha.
 */
function updateDimension(
    currentState: DimensionState,
    newValue: number,
    baseAlpha: number,
    reliabilityWeight: number
): DimensionState {
    // Effective alpha depends on the reliability of the signal (quiz)
    // High reliability (0.8) -> faster update
    // Low reliability (0.2) -> slower update
    const effectiveAlpha = baseAlpha * reliabilityWeight;

    // 1. Update Value (Exponential Moving Average)
    // new_val = old_val + alpha * (input - old_val)
    const nextValue = currentState.value + effectiveAlpha * (newValue - currentState.value);

    // 2. Update Momentum (Trend)
    // momentum tracks the direction and speed of change
    // decayed old momentum + immediate change
    const delta = nextValue - currentState.value;
    const nextMomentum = 0.7 * currentState.momentum + 0.3 * (delta * 10); // *10 to scale to visible range

    // 3. Update Baseline (Long-term anchor)
    // Very slow moving average (alpha ~0.01)
    const nextBaseline = currentState.baseline * 0.99 + nextValue * 0.01;

    return {
        value: Math.max(0, Math.min(1, nextValue)), // Clamp 0-1
        momentum: Math.max(-1, Math.min(1, nextMomentum)), // Clamp -1 to 1
        baseline: Math.max(0, Math.min(1, nextBaseline)), // Clamp 0-1
    };
}

/**
 * Updates the entire psyche state given a set of new marker scores.
 * @param currentState The user's current psyche state
 * @param markerScores The averaged markers from the completed quiz
 * @param reliabilityWeight The weight/impact of the quiz type
 */
export function updatePsycheState(
    currentState: PsycheState,
    markerScores: Record<string, number>,
    reliabilityWeight: number
): PsycheState {
    const nextState: PsycheState = { ...currentState };

    // Iterate over all known dimensions
    Object.keys(PSYCHE_DIMENSIONS).forEach((dimId) => {
        const id = dimId as PsycheDimensionId;
        const baseAlpha = PSYCHE_DIMENSIONS[id].baseAlpha;
        const currentDimState = currentState[id];

        // If the quiz provided a score for this dimension, update it.
        // If NOT, we tend slightly towards baseline? Or stay same?
        // Decision: If not measured, state remains constant (momentum decays)

        if (markerScores[id] !== undefined) {
            nextState[id] = updateDimension(
                currentDimState,
                markerScores[id],
                baseAlpha,
                reliabilityWeight
            );
        } else {
            // Decay momentum if not stimulated
            nextState[id] = {
                ...currentDimState,
                momentum: currentDimState.momentum * 0.9,
            };
        }
    });

    return nextState;
}
