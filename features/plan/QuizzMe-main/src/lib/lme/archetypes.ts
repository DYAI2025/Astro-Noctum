
// LME/DUBA - Slice 1: Archetypes
// Defines the target archetypes and their prototype vectors.
// The system maps the user's current state to these archetypes based on distance.

export interface Archetype {
    id: string;
    name: string;
    title: string;
    description: string;
    protoVector: {
        shadow: number;
        connection: number;
        structure: number;
        emergence: number;
        depth: number;
    };
    color: string; // Tailwind class-friendly or hex
}

export const ARCHETYPES: Record<string, Archetype> = {
    nebel: {
        id: 'nebel',
        name: 'Der Nebel',
        title: 'The Mist',
        description: 'Mysterious and undefined. You embrace the unknown and the hidden aspects of reality.',
        protoVector: { shadow: 0.8, connection: 0.3, structure: 0.2, emergence: 0.7, depth: 0.7 },
        color: 'text-slate-400',
    },
    architekt: {
        id: 'architekt',
        name: 'Der Architekt',
        title: 'The Architect',
        description: 'Builder of systems and structures. You see the blueprint behind the chaos.',
        protoVector: { shadow: 0.3, connection: 0.4, structure: 0.9, emergence: 0.3, depth: 0.6 },
        color: 'text-amber-500',
    },
    katalysator: {
        id: 'katalysator',
        name: 'Der Katalysator',
        title: 'The Catalyst',
        description: 'Spark of change and connection. You bring people and ideas together.',
        protoVector: { shadow: 0.3, connection: 0.9, structure: 0.3, emergence: 0.8, depth: 0.4 },
        color: 'text-pink-500',
    },
    seher: {
        id: 'seher',
        name: 'Der Seher',
        title: 'The Seer',
        description: 'Observer of deep truths. You look beneath the surface of things.',
        protoVector: { shadow: 0.6, connection: 0.4, structure: 0.4, emergence: 0.5, depth: 0.9 },
        color: 'text-violet-500',
    },
    diamant: {
        id: 'diamant',
        name: 'Der Diamant',
        title: 'The Diamond',
        description: 'Clear, resilient, and multi-faceted. You maintain balance under pressure.',
        protoVector: { shadow: 0.4, connection: 0.5, structure: 0.7, emergence: 0.4, depth: 0.5 },
        color: 'text-cyan-400',
    },
};

export type ArchetypeId = keyof typeof ARCHETYPES;
