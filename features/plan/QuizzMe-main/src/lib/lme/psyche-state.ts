
// LME/DUBA - Slice 1: User State Model
// Defines the structure of the user's psyche state in memory/storage.

import { PsycheDimensionId } from './psyche-dimensions';

export interface DimensionState {
    value: number;      // 0.0 - 1.0: Current weighted mean
    momentum: number;   // -1.0 - 1.0: Recent trend/velocity
    baseline: number;   // 0.0 - 1.0: Long-term average (anchoring)
}

export type PsycheState = Record<PsycheDimensionId, DimensionState>;

// Initial state for a new user (neutral balance)
export const DEFAULT_PSYCHE_STATE: PsycheState = {
    shadow: { value: 0.5, momentum: 0, baseline: 0.5 },
    connection: { value: 0.5, momentum: 0, baseline: 0.5 },
    structure: { value: 0.5, momentum: 0, baseline: 0.5 },
    emergence: { value: 0.5, momentum: 0, baseline: 0.5 },
    depth: { value: 0.5, momentum: 0, baseline: 0.5 },
};
