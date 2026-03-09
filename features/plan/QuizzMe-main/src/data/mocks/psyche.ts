import { PsycheProfileV1 } from '@/lib/types/psyche';

export const MOCK_PSYCHE_PROFILE: PsycheProfileV1 = {
    id: 'mock-user-123',
    stats: {
        clarity: 0.72,
        courage: 0.45,
        connection: 0.88,
        order: 0.30,
        shadow: 0.15,
    },
    state: {
        shadow_light: 0.8,
        cold_warm: 0.7,
        surface_depth: 0.9,
        me_we: 0.6,
        mind_heart: 0.4
    },
    meta_stats: {
        intensity: 'noticeable',
        tempo: 'dynamic',
        shadow_confidence: 0.72,
        shadow_confirmed: true
    },
    narrative_snippet: "Du navigierst mit offenem Herzen, doch deine Wurzeln suchen noch nach festem Halt im Chaos.",
    archetype_params: {
        dominant_archetype: "Der Leuchtturm",
        secondary_archetypes: ["Der Wanderer"]
    },
    // Simulate a recent change for dev purposes
    last_delta: {
        date: new Date().toISOString(),
        stats_delta: {
            connection: 0.05,
            courage: -0.02
        },
        state_delta: {
            cold_warm: 0.1
        }
    }
};
