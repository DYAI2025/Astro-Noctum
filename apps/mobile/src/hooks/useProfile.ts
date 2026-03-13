import { useCallback, useEffect, useState } from "react";
import { fetchAstroProfile, fetchTier } from "../lib/profile";

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

  return {
    profile,
    tier,
    loading,
    refresh,
    setProfile,
  };
}
