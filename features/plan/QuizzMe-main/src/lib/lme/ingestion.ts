
import {
    ContributionEvent,
    ProfileSnapshot,
    TraitScore,
    Tag,
    Unlock,
    Field
} from './types';
import { getProfileSnapshot, saveProfileSnapshot } from './storage-full';
import { updatePsycheState } from './lme-core';
import { computeArchetypeMix } from './archetype-mix';
import { mapPsycheToAvatar } from './avatar-mapper';
import { PsycheState } from './psyche-state';

// --- Configuration ---

// Simple mapping from generic Marker IDs to Psyche Dimensions
// In a real app, this would be a sophisticated registry or database table.
const MARKER_TO_DIMENSION: Record<string, string> = {
    // Social / Connection
    'marker.social.extroversion': 'connection',
    'marker.social.empathy': 'connection',
    'marker.love.connection': 'connection',

    // Structure / Order
    'marker.cognition.system': 'structure',
    'marker.lifestyle.order': 'structure',
    'marker.skills.logic': 'structure',

    // Emergence / Creativity
    'marker.creativity': 'emergence',
    'marker.openness': 'emergence',
    'marker.lifestyle.chaos': 'emergence',

    // Depth / Intellect
    'marker.cognition.reflection': 'depth',
    'marker.skills.philosophical': 'depth',
    'marker.spirituality': 'depth',

    // Shadow
    'marker.shadow.jealousy': 'shadow',
    'marker.shadow.anger': 'shadow',
    'marker.stress': 'shadow',
};

// --- Helpers ---

function mergeTraits(current: Record<string, TraitScore>, incoming: TraitScore[]): Record<string, TraitScore> {
    const next = { ...current };
    incoming.forEach(t => {
        const existing = next[t.id];
        // Rules: higher confidence wins, or newer if equal? 
        // Spec says: higher confidence, then newer.
        // Simplified: Just overwrite for now, or check confidence.
        if (!existing || (t.confidence || 0) >= (existing.confidence || 0)) {
            next[t.id] = t;
        }
    });
    return next;
}

function mergeTags(current: Tag[], incoming: Tag[]): Tag[] {
    // Unique by ID
    const map = new Map(current.map(t => [t.id, t]));
    incoming.forEach(t => map.set(t.id, t));
    return Array.from(map.values());
}

function mergeUnlocks(current: Record<string, Unlock>, incoming: Unlock[]): Record<string, Unlock> {
    const next = { ...current };
    incoming.forEach(u => {
        const existing = next[u.id];
        // Unlock logic: simple add/overwrite
        if (!existing || u.level! > (existing.level || 0)) {
            next[u.id] = u;
        }
    });
    return next;
}

function mergeFields(current: Record<string, Field>, incoming: Field[]): Record<string, Field> {
    const next = { ...current };
    incoming.forEach(f => {
        next[f.id] = f;
    });
    return next;
}


// --- Main Pipeline ---

/**
 * Ingests a ContributionEvent, updates the full ProfileSnapshot, and saves it.
 * This is the main entry point for any result merging.
 */
export function ingestContribution(event: ContributionEvent): { accepted: boolean, snapshot: ProfileSnapshot } {
    const currentSnapshot = getProfileSnapshot();
    const { payload } = event;

    // 1. Map Markers to Dimension Scores (Aggregated by dimension)
    // We assume incoming markers have 0..1 weights usually (from traits)
    // But LME update expects: Record<dimension, score>
    const dimScores: Record<string, number> = {};
    const dimCounts: Record<string, number> = {};

    payload.markers.forEach(m => {
        let dim = MARKER_TO_DIMENSION[m.id];

        // Dynamic mapping fallback?
        if (!dim) {
            if (m.id.includes('social') || m.id.includes('love')) dim = 'connection';
            else if (m.id.includes('system') || m.id.includes('logic')) dim = 'structure';
            else if (m.id.includes('create') || m.id.includes('open')) dim = 'emergence';
            else if (m.id.includes('deep') || m.id.includes('spirit')) dim = 'depth';
            else if (m.id.includes('shadow')) dim = 'shadow';
        }

        if (dim) {
            if (!dimScores[dim]) { dimScores[dim] = 0; dimCounts[dim] = 0; }
            dimScores[dim] += m.weight; // simplistic sum, LME aggregator usually averages
            dimCounts[dim]++;
        }
    });

    // Average the inputs per dimension for this single event
    Object.keys(dimScores).forEach(d => {
        dimScores[d] = dimScores[d] / dimCounts[d];
    });

    // 2. Update Psyche State (LME Core)
    // Reliability could come from event source, defaulting to 0.5
    const nextPsycheState = updatePsycheState(
        currentSnapshot.psyche.state as PsycheState,
        dimScores,
        0.5 // Default reliability
    );

    // 3. Derived Psyche Data
    const nextArchetypeMix = computeArchetypeMix(nextPsycheState);
    const nextAvatarParams = mapPsycheToAvatar(nextPsycheState);

    // 4. Merge UI Data (Traits, Tags, Unlocks, Fields, Astro)
    const nextTraits = payload.traits ? mergeTraits(currentSnapshot.traits, payload.traits) : currentSnapshot.traits;
    const nextTags = payload.tags ? mergeTags(currentSnapshot.tags, payload.tags) : currentSnapshot.tags;
    const nextUnlocks = payload.unlocks ? mergeUnlocks(currentSnapshot.unlocks, payload.unlocks) : currentSnapshot.unlocks;
    const nextFields = payload.fields ? mergeFields(currentSnapshot.fields, payload.fields) : currentSnapshot.fields;

    // Astro Merge (Basic: Overwrite if present)
    const nextAstro = payload.astro ? { ...currentSnapshot.astro, ...payload.astro } : currentSnapshot.astro;

    // 5. Update Meta
    const filledTraitsCount = Object.keys(nextTraits).length;
    // Simple completion logic
    const nextCompletionPercent = Math.min(100, filledTraitsCount * 2); // 50 traits = 100% (example)

    // 6. Construct New Snapshot
    const nextSnapshot: ProfileSnapshot = {
        ...currentSnapshot,
        psyche: {
            state: nextPsycheState,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            archetypeMix: nextArchetypeMix as any, // Types compat
            visualAxes: {}, // Future
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            avatarParams: nextAvatarParams as any,
        },
        traits: nextTraits,
        tags: nextTags,
        unlocks: nextUnlocks,
        fields: nextFields,
        astro: nextAstro,
        meta: {
            ...currentSnapshot.meta,
            lastUpdatedAt: new Date().toISOString(),
            completion: {
                ...currentSnapshot.meta.completion,
                percent: nextCompletionPercent,
                unlockCount: Object.keys(nextUnlocks).length
            }
        }
    };

    // 7. Save
    saveProfileSnapshot(nextSnapshot);

    return { accepted: true, snapshot: nextSnapshot };
}
