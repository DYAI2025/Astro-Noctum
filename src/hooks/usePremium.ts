import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    if (!user) { setIsPremium(false); setLoading(false); return; }

    const { data } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();
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

  // Realtime subscription for instant update (best-effort)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-tier')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        setIsPremium(payload.new.tier === 'premium');
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Premium tier realtime subscription failed — using polling fallback');
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { isPremium, loading };
}
