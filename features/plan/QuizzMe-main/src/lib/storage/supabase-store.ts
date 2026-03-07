/**
 * Supabase Profile Store
 *
 * Implements ProfileStateStore using the `psyche_profiles` table.
 *
 * Mapping Strategy:
 * - `ProfileState` is stored in the `archetype_params` JSONB column under the key `_raw_state`.
 * - This allows full fidelity storage without schema migration for every new field in ProfileState.
 * - Core stats (clarity, courage, etc.) could be extracted to top-level columns in the future for querying.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileStateStore, UserId } from "./store-types";
import { ProfileState, createDefaultProfileState } from "@/lib/profile";

export class SupabaseProfileStore implements ProfileStateStore {
  constructor(private supabase: SupabaseClient) {}

  async load(userId: UserId): Promise<ProfileState | null> {
    try {
      const { data, error } = await this.supabase
        .from("psyche_profiles")
        .select("archetype_params")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
            // Not found
            return null;
        }
        console.error("[SupabaseProfileStore] Load error:", error);
        return null;
      }

      if (data?.archetype_params && typeof data.archetype_params === 'object') {
        const params = data.archetype_params as Record<string, any>;
        if (params._raw_state) {
            return params._raw_state as ProfileState;
        }
      }
      
      return null;
    } catch (err) {
      console.error("[SupabaseProfileStore] Unexpected load error:", err);
      return null;
    }
  }

  async save(userId: UserId, state: ProfileState): Promise<void> {
    try {
      // 1. Prepare data
      // We store the raw state in `archetype_params._raw_state`.
      // We also try to populate high-level columns if they match, for better DB readability.
      
      const payload = {
        user_id: userId,
        // Store full state blob
        archetype_params: {
            _raw_state: state
        },
        // Update timestamp implicitly handled by trigger, but explicit is fine too
        updated_at: new Date().toISOString()
      };

      // 2. Upsert
      const { error } = await this.supabase
        .from("psyche_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        throw new Error(`Supabase upsert failed: ${error.message}`);
      }
    } catch (err) {
      console.error("[SupabaseProfileStore] Save failed:", err);
      throw err;
    }
  }

  async exists(userId: UserId): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("psyche_profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
        console.error("[SupabaseProfileStore] Exists check failed:", error);
        return false;
    }
    return (count || 0) > 0;
  }

  async delete(userId: UserId): Promise<void> {
    const { error } = await this.supabase
        .from("psyche_profiles")
        .delete()
        .eq("user_id", userId);
    
    if (error) {
        throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }
}
