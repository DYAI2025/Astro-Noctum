
// LME/DUBA - Slice 1: Persistence
// Manages saving/loading the PsycheState to/from LocalStorage.

import { PsycheState, DEFAULT_PSYCHE_STATE } from './psyche-state';

const STORAGE_KEY = 'dys_psyche_state_v1';

export function getPsycheState(): PsycheState {
    if (typeof window === 'undefined') return DEFAULT_PSYCHE_STATE;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_PSYCHE_STATE;

        const parsed = JSON.parse(raw);
        // Basic validation implies checking keys, but for MVP we assume data integrity
        return { ...DEFAULT_PSYCHE_STATE, ...parsed };
    } catch (e) {
        console.error("Failed to load psyche state", e);
        return DEFAULT_PSYCHE_STATE;
    }
}

export function savePsycheState(state: PsycheState): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save psyche state", e);
    }
}

export function resetPsycheState(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
