
// LME/DUBA - Slice 1: Psyche Pack
// Defines the core dimensions for the dynamic personality profile.

export interface PsycheDimension {
    id: string;
    name: string;
    description: string;
    baseAlpha: number; // Learning rate (how fast this dimension changes)
}

export const PSYCHE_DIMENSIONS: Record<string, PsycheDimension> = {
    shadow: {
        id: 'shadow',
        name: 'Shadow',
        description: 'Embrace of darker, complex, or hidden aspects of the self.',
        baseAlpha: 0.15,
    },
    connection: {
        id: 'connection',
        name: 'Connection',
        description: 'Orientation towards others, empathy, and social harmony.',
        baseAlpha: 0.12,
    },
    structure: {
        id: 'structure',
        name: 'Structure',
        description: 'Need for order, clarity, planning, and stability.',
        baseAlpha: 0.10,
    },
    emergence: {
        id: 'emergence',
        name: 'Emergence',
        description: 'Openness to the new, the unknown, and spontaneous change.',
        baseAlpha: 0.12,
    },
    depth: {
        id: 'depth',
        name: 'Depth',
        description: 'Preference for introspection, philosophical thought, and meaning.',
        baseAlpha: 0.10,
    },
};

export type PsycheDimensionId = keyof typeof PSYCHE_DIMENSIONS;
