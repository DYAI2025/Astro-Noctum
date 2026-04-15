import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    if (!user) { setIsPremium(false); setLoading(false); return; }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      if (error) {
        // On query/network failure, fall back to a safe non-premium default.
        console.warn('[premium] fetch failed, using safe default:', error.message);
        setIsPremium(false);
        setLoading(false);
        return;
      }
      setIsPremium(data?.tier === 'premium');
      setLoading(false);
    } catch (error) {
      // Handles thrown TypeError cases like "Failed to fetch" (e.g. CSP/network).
      console.warn('[premium] fetch failed, using safe default:', error);
      setIsPremium(false);
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => { fetchTier(); }, [fetchTier]);

  // Re-fetch when tab becomes visible (catches Stripe redirect return)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchTier();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchTier]);

  // Realtime subscription for instant update; falls back to 30s polling on failure
  useEffect(() => {
    if (!user) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (pollInterval) return;
      console.warn('[premium] Realtime failed — starting 30s poll fallback');
      pollInterval = setInterval(fetchTier, 30_000);
    };

    const stopPolling = () => {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    };

    const channel = supabase
      .channel('profile-tier')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        setIsPremium(payload.new.tier === 'premium');
        stopPolling();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          startPolling();
        } else if (status === 'SUBSCRIBED') {
          stopPolling();
        }
      });

    return () => {
      stopPolling();
      supabase.removeChannel(channel);
    };
  }, [user, fetchTier]);

  return { isPremium, loading };
}
