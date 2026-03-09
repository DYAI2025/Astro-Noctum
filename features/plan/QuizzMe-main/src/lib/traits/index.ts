/**
 * Traits Module
 *
 * Two-layer trait system: baseScore (stable anchor) + shiftZ (dynamic offset)
 *
 * Usage:
 * 1. Initialize from base scores (astro onboarding):
 *    const states = initFromBaseScores(baseScores)
 *
 * 2. Apply quiz evidence:
 *    const newStates = applyBulkEvidence(states, evidenceByTrait, tierGain, confidence)
 *
 * 3. Render for UI:
 *    const scores = renderTraitScores(states)  // -> Record<traitId, 1-100>
 */

export * from "./trait-state";
export * from "./trait-engine";
export * from "./tier-gains";
