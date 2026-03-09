/**
 * Test Mock Data for Psyche Profiles
 * Provides various configurations for testing graceful degradation
 */

import { PsycheProfileV1 } from '@/lib/types/psyche';

/**
 * Complete profile with all optional fields populated
 */
export const COMPLETE_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-complete',
  user_id: 'test-user-1',
  created_at: '2025-01-15T10:00:00Z',
  stats: {
    clarity: 0.75,
    courage: 0.68,
    connection: 0.82,
    order: 0.55,
    shadow: 0.42,
  },
  state: {
    shadow_light: 0.58,
    cold_warm: 0.65,
    surface_depth: 0.72,
    me_we: 0.78,
    mind_heart: 0.48,
  },
  archetype_params: {
    dominant_archetype: 'The Sage',
    secondary_archetypes: ['The Explorer', 'The Caregiver'],
  },
  narrative_snippet:
    'Du bewegst dich zwischen Weisheit und Neugier, mit einer tiefen Verbindung zu anderen.',
  last_delta: {
    date: '2025-01-14T15:30:00Z',
    stats_delta: {
      clarity: 0.05,
      connection: -0.03,
      shadow: 0.02,
    },
    state_delta: {
      shadow_light: 0.04,
      me_we: -0.02,
    },
  },
};

/**
 * Minimal profile with only required fields
 */
export const MINIMAL_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-minimal',
  stats: {
    clarity: 0.5,
    courage: 0.5,
    connection: 0.5,
    order: 0.5,
    shadow: 0.5,
  },
  state: {
    shadow_light: 0.5,
    cold_warm: 0.5,
    surface_depth: 0.5,
    me_we: 0.5,
    mind_heart: 0.5,
  },
};

/**
 * Profile without archetype data
 */
export const NO_ARCHETYPE_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-no-archetype',
  user_id: 'test-user-2',
  created_at: '2025-01-15T10:00:00Z',
  stats: {
    clarity: 0.65,
    courage: 0.72,
    connection: 0.58,
    order: 0.68,
    shadow: 0.35,
  },
  state: {
    shadow_light: 0.65,
    cold_warm: 0.58,
    surface_depth: 0.62,
    me_we: 0.55,
    mind_heart: 0.71,
  },
  narrative_snippet: 'Eine klare Ausrichtung auf Struktur und Mut.',
  last_delta: {
    date: '2025-01-14T15:30:00Z',
    stats_delta: {
      courage: 0.08,
    },
    state_delta: {
      cold_warm: 0.05,
    },
  },
};

/**
 * Profile without narrative snippet
 */
export const NO_NARRATIVE_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-no-narrative',
  user_id: 'test-user-3',
  created_at: '2025-01-15T10:00:00Z',
  stats: {
    clarity: 0.88,
    courage: 0.45,
    connection: 0.92,
    order: 0.38,
    shadow: 0.28,
  },
  state: {
    shadow_light: 0.72,
    cold_warm: 0.85,
    surface_depth: 0.55,
    me_we: 0.91,
    mind_heart: 0.62,
  },
  archetype_params: {
    dominant_archetype: 'The Caregiver',
    secondary_archetypes: ['The Innocent'],
  },
};

/**
 * Profile without delta/history data
 */
export const NO_DELTA_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-no-delta',
  user_id: 'test-user-4',
  created_at: '2025-01-15T10:00:00Z',
  stats: {
    clarity: 0.62,
    courage: 0.78,
    connection: 0.55,
    order: 0.82,
    shadow: 0.48,
  },
  state: {
    shadow_light: 0.52,
    cold_warm: 0.48,
    surface_depth: 0.75,
    me_we: 0.45,
    mind_heart: 0.38,
  },
  archetype_params: {
    dominant_archetype: 'The Ruler',
  },
  narrative_snippet: 'Ordnung und Struktur prägen deinen Weg.',
};

/**
 * Extreme edge case: All zeros
 */
export const ALL_ZEROS_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-zeros',
  stats: {
    clarity: 0,
    courage: 0,
    connection: 0,
    order: 0,
    shadow: 0,
  },
  state: {
    shadow_light: 0,
    cold_warm: 0,
    surface_depth: 0,
    me_we: 0,
    mind_heart: 0,
  },
};

/**
 * Extreme edge case: All max values
 */
export const ALL_MAX_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-max',
  stats: {
    clarity: 1,
    courage: 1,
    connection: 1,
    order: 1,
    shadow: 1,
  },
  state: {
    shadow_light: 1,
    cold_warm: 1,
    surface_depth: 1,
    me_we: 1,
    mind_heart: 1,
  },
};

/**
 * High shadow, low connection (max disharmony)
 */
export const MAX_DISHARMONY_PROFILE: PsycheProfileV1 = {
  id: 'test-profile-disharmony',
  stats: {
    clarity: 0.5,
    courage: 0.5,
    connection: 0,
    order: 0.5,
    shadow: 1,
  },
  state: {
    shadow_light: 0,
    cold_warm: 0.5,
    surface_depth: 0.5,
    me_we: 0.5,
    mind_heart: 0.5,
  },
};
