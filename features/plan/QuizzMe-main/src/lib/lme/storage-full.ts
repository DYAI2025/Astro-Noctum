
import { DEFAULT_PSYCHE_STATE } from './psyche-state';
import { ProfileSnapshot } from './types';
import { mapPsycheToAvatar } from './avatar-mapper';

const STORAGE_KEY_V2 = 'dys_profile_snapshot_v1';

// Initial Empty Snapshot
export const DEFAULT_PROFILE_SNAPSHOT: ProfileSnapshot = {
    psyche: {
        state: DEFAULT_PSYCHE_STATE,
        archetypeMix: [],
        visualAxes: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        avatarParams: mapPsycheToAvatar(DEFAULT_PSYCHE_STATE) as any,
    },
    identity: {
        displayName: "Entdecker",
    },
    astro: {},
    traits: {},
    tags: [],
    unlocks: {},
    fields: {},
    meta: {
        completion: {
            percent: 0,
            filledBlocks: [],
            unlockCount: 0,
        },
        lastUpdatedAt: new Date().toISOString(),
    },
};

export function getProfileSnapshot(): ProfileSnapshot {
    if (typeof window === 'undefined') return DEFAULT_PROFILE_SNAPSHOT;

    try {
        const raw = localStorage.getItem(STORAGE_KEY_V2);
        if (!raw) return DEFAULT_PROFILE_SNAPSHOT;

        const parsed = JSON.parse(raw);
        // Deep merge or validate could happen here
        // specific fix: ensure psyche state struct is valid
        if (!parsed.psyche || !parsed.psyche.state) {
            return { ...DEFAULT_PROFILE_SNAPSHOT, ...parsed, psyche: DEFAULT_PROFILE_SNAPSHOT.psyche };
        }
        return { ...DEFAULT_PROFILE_SNAPSHOT, ...parsed };
    } catch (e) {
        console.error("Failed to load profile snapshot", e);
        return DEFAULT_PROFILE_SNAPSHOT;
    }
}

export function saveProfileSnapshot(snapshot: ProfileSnapshot): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(snapshot));
    } catch (e) {
        console.error("Failed to save profile snapshot", e);
    }
}

export function resetProfileSnapshot(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_V2);
}
