import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBootstrap } from '../lib/experience';
import type { BootstrapResponse } from '@bazodiac/shared';

const CACHE_KEY = 'signatur_bootstrap_cache';

export function useBootstrapSignatur(profile: any) {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!profile || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.userId === profile.user_id && cached?.data) {
            setBootstrap(cached.data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      try {
        const birth = {
          date: profile.birth_date || '',
          time: profile.birth_time || '12:00',
          tz: profile.iana_time_zone || 'Europe/Berlin',
          lat: profile.birth_lat || 0,
          lon: profile.birth_lng || 0,
        };
        const result = await fetchBootstrap(birth);
        setBootstrap(result);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ userId: profile.user_id, data: result }));
      } catch (err) {
        console.warn('[Bootstrap] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile]);

  return { bootstrap, loading };
}
