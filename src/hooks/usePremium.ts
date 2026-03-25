import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    if (!user) { setIsPremium(false); setLoading(false); return; }

    const { data, error } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();
    if (error) {
      // On network failure, keep the last known state instead of resetting to false
      console.error('[premium] fetch failed, keeping last known state:', error.message);
      setLoading(false);
      return;
    }
    setIsPremium(data?.tier === 'premium');
    setLoading(false);
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
      console.error('[premium] Realtime failed — starting 30s poll fallback');
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
