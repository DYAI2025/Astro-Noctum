/**
 * Psyche Profile Domain Types
 * Defines the shape of the character sheet data contract (psyche_profile_v1)
 *
 * Data Contract Versioning:
 * - psyche_profile_v1: Main profile structure
 * - psyche_state: Climate axes (0..1 range)
 * - visual_axes_v1: Visual representation metadata
 * - derived_stats_v1: Calculated secondary stats (0..100 range)
 */

/**
 * Core psyche dimensional axes (0..1)
 * Represents the climate/personality space along 5 bipolar dimensions
 */
export interface PsycheState {
    // Dimensional Axes (0..1)
    // Maps to: [Shadow, Light]
    shadow_light: number;
    // Maps to: [Cold, Warm]
    cold_warm: number;
    // Maps to: [Surface, Depth]
    surface_depth: number;
    // Maps to: [Me, We]
    me_we: number;
    // Maps to: [Mind, Heart]
    mind_heart: number;
}

/**
 * Core personality stats (0..1)
 * Primary dimensional values that drive derived calculations
 */
export interface PsycheCoreStats {
    // Core Values (0..1 from API, displayed as 0..100)
    clarity: number;
    courage: number;
    connection: number;
    order: number;
    shadow: number;
}

/**
 * Visual representation metadata for axes
 * Provides UI-friendly labels and descriptions
 */
export interface VisualAxesV1 {
    shadow_light: {
        left_label: string;
        right_label: string;
        description?: string;
    };
    cold_warm: {
        left_label: string;
        right_label: string;
        description?: string;
    };
    surface_depth: {
        left_label: string;
        right_label: string;
        description?: string;
    };
    me_we: {
        left_label: string;
        right_label: string;
        description?: string;
    };
    mind_heart: {
        left_label: string;
        right_label: string;
        description?: string;
    };
}

/**
 * Derived stats calculated on frontend (0..100)
 * Secondary metrics computed from core stats
 *
 * Formulas:
 * - vitality = avg(clarity, connection)
 * - willpower = avg(courage, order)
 * - chaos = shadow
 * - harmony = 1 - abs(shadow - connection) mapped to 0..100
 */
export interface DerivedStatsV1 {
    vitality: number; // avg(clarity, connection)
    willpower: number; // avg(courage, order)
    chaos: number; // = shadow
    harmony: number; // 1 - abs(shadow - connection)
}

// Backward compatibility alias
export type DerivedStats = DerivedStatsV1;

/**
 * Meta-stats providing aggregate insights
 */
export interface MetaStats {
    intensity: 'quiet' | 'noticeable' | 'intense';
    tempo: 'calm' | 'dynamic' | 'volatile';
    shadow_confidence: number; // 0..1
    shadow_confirmed: boolean; // true if shadow_confidence >= 0.65
}

/**
 * Delta information representing changes from previous state
 */
export interface PsycheDelta {
    date: string;
    stats_delta: Partial<PsycheCoreStats>;
    state_delta: Partial<PsycheState>;
    movers?: Array<{
        dimension: string;
        delta: number;
        magnitude: number;
    }>;
}

/**
 * Archetype information
 */
export interface ArchetypeParams {
    dominant_archetype: string;
    secondary_archetypes?: string[];
    archetype_mix?: Record<string, number>;
}

/**
 * Complete psyche profile (v1)
 * Main data contract for character sheet rendering
 */
export interface PsycheProfileV1 {
    id: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;

    // Core Data (required)
    stats: PsycheCoreStats;
    state: PsycheState;

    // Meta Information (optional)
    meta_stats?: MetaStats;

    // Visual Configuration (optional)
    visual_axes?: VisualAxesV1;

    // Narrative & Archetypes (optional)
    archetype_params?: ArchetypeParams;
    narrative_snippet?: string;

    // Delta / History (optional)
    last_delta?: PsycheDelta;
}
