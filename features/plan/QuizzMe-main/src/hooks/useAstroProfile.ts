"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AstroProfileRow } from "@/components/astro-sheet/model";

export function useAstroProfile() {
  const [profile, setProfile] = useState<AstroProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Session expired. Please log in again.");
        router.replace('/login');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("astro_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is valid for new users
         throw error;
      }
      
      setProfile(data as AstroProfileRow | null);
    } catch (err: unknown) {
      console.error("Error fetching astro profile:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("astro-profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "astro_profiles", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as AstroProfileRow);
          }
        }
      );

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return { profile, loading, error, refetch: fetchProfile };
}
