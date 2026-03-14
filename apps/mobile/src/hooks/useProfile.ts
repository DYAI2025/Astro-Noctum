import { useCallback, useEffect, useState } from "react";
import { fetchAstroProfile, fetchTier } from "../lib/profile";
import { supabase } from "../lib/supabase";

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<any | null>(null);
  const [tier, setTier] = useState<"free" | "premium">("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setTier("free");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [nextProfile, nextTier] = await Promise.all([
        fetchAstroProfile(userId),
        fetchTier(userId),
      ]);
      setProfile(nextProfile);
      setTier(nextTier);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const intervalId = setInterval(() => {
      void refresh();
    }, 45_000);

    const channel = supabase
      .channel(`mobile-profile-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return {
    profile,
    tier,
    loading,
    refresh,
    setProfile,
  };
}
