/**
 * Supabase Database Types
 * 
 * These types match the public schema tables used by the app
 */

export interface Database {
  public: {
    Tables: {
      psyche_profiles: {
        Row: PsycheProfileRow;
        Insert: PsycheProfileInsert;
        Update: PsycheProfileUpdate;
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      astro_profiles: {
        Row: AstroProfileRow;
        Insert: AstroProfileInsert;
        Update: AstroProfileUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export interface ProfileRow {
  id: string;
  email: string | null;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email?: string | null;
  onboarding_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  email?: string | null;
  onboarding_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PsycheProfileRow {
  id: string;
  user_id: string | null;
  device_id: string | null;
  
  // Core Stats (0..1)
  clarity: number;
  courage: number;
  connection: number;
  order: number;
  shadow: number;
  
  // Climate State (0..1)
  shadow_light: number;
  cold_warm: number;
  surface_depth: number;
  me_we: number;
  mind_heart: number;
  
  // Optional JSON fields
  meta_stats: MetaStatsJson | null;
  archetype_params: ArchetypeParamsJson | null;
  narrative_snippet: string | null;
  last_delta: DeltaJson | null;
  
  created_at: string;
  updated_at: string;
}

export interface PsycheProfileInsert {
  id?: string;
  user_id?: string | null;
  device_id?: string | null;
  
  clarity: number;
  courage: number;
  connection: number;
  order: number;
  shadow: number;
  
  shadow_light: number;
  cold_warm: number;
  surface_depth: number;
  me_we: number;
  mind_heart: number;
  
  meta_stats?: MetaStatsJson | null;
  archetype_params?: ArchetypeParamsJson | null;
  narrative_snippet?: string | null;
  last_delta?: DeltaJson | null;
  
  created_at?: string;
  updated_at?: string;
}

export interface PsycheProfileUpdate {
  id?: string;
  user_id?: string | null;
  device_id?: string | null;
  
  clarity?: number;
  courage?: number;
  connection?: number;
  order?: number;
  shadow?: number;
  
  shadow_light?: number;
  cold_warm?: number;
  surface_depth?: number;
  me_we?: number;
  mind_heart?: number;
  
  meta_stats?: MetaStatsJson | null;
  archetype_params?: ArchetypeParamsJson | null;
  narrative_snippet?: string | null;
  last_delta?: DeltaJson | null;
  
  updated_at?: string;
}

// JSON field types
interface MetaStatsJson {
  intensity: 'quiet' | 'noticeable' | 'intense';
  tempo: 'calm' | 'dynamic' | 'volatile';
  shadow_confidence: number;
  shadow_confirmed: boolean;
}

interface ArchetypeParamsJson {
  dominant_archetype: string;
  secondary_archetypes?: string[];
  archetype_mix?: Record<string, number>;
}

interface DeltaJson {
  date: string;
  stats_delta: Record<string, number>;
  state_delta: Record<string, number>;
  movers?: Array<{
    dimension: string;
    delta: number;
    magnitude: number;
  }>;
}

export interface AstroProfileRow {
  user_id: string;
  username: string;
  birth_date: string;
  birth_time: string;
  birth_time_local: string;
  iana_time_zone: string;
  fold: number | null;
  birth_place_name: string;
  birth_place_country: string | null;
  birth_lat: number;
  birth_lng: number;
  sun_sign: string | null;
  moon_sign: string | null;
  asc_sign: string | null;
  astro_json: Record<string, any>;
  astro_meta_json: Record<string, any> | null;
  astro_validation_json: Record<string, any> | null;
  astro_compute_hash: string | null;
  astro_computed_at: string | null;
  astro_validation_status: string | null;
  input_status: 'ready' | 'computing' | 'computed' | 'error';
  account_tier: 'free' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface AstroProfileInsert {
  user_id: string;
  username: string;
  birth_date: string;
  birth_time: string;
  birth_time_local?: string;
  iana_time_zone: string;
  fold?: number | null;
  birth_place_name: string;
  birth_place_country?: string | null;
  birth_lat: number;
  birth_lng: number;
  sun_sign?: string | null;
  moon_sign?: string | null;
  asc_sign?: string | null;
  astro_json?: Record<string, any>;
  astro_meta_json?: Record<string, any> | null;
  astro_validation_json?: Record<string, any> | null;
  astro_compute_hash?: string | null;
  astro_computed_at?: string | null;
  astro_validation_status?: string | null;
  input_status?: 'ready' | 'computing' | 'computed' | 'error';
  account_tier?: 'free' | 'premium';
  created_at?: string;
  updated_at?: string;
}

export interface AstroProfileUpdate {
  username?: string;
  birth_date?: string;
  birth_time?: string;
  birth_time_local?: string;
  iana_time_zone?: string;
  fold?: number | null;
  birth_place_name?: string;
  birth_place_country?: string | null;
  birth_lat?: number;
  birth_lng?: number;
  sun_sign?: string | null;
  moon_sign?: string | null;
  asc_sign?: string | null;
  astro_json?: Record<string, any>;
  astro_meta_json?: Record<string, any> | null;
  astro_validation_json?: Record<string, any> | null;
  astro_compute_hash?: string | null;
  astro_computed_at?: string | null;
  astro_validation_status?: string | null;
  input_status?: 'ready' | 'computing' | 'computed' | 'error';
  account_tier?: 'free' | 'premium';
  created_at?: string;
  updated_at?: string;
}
