import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyHoroscope } from '../lib/experience';
import type { DailyResponse } from '@bazodiac/shared';

const CACHE_KEY = 'daily_horoscope_cache';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyHoroscope(profile: any) {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!profile || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      // 1. Check cache
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.date === todayKey() && cached?.data) {
            setDaily(cached.data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 2. Fetch from API
      try {
        const birth = {
          date: profile.birth_date || '',
          time: profile.birth_time || '12:00',
          tz: profile.iana_time_zone || 'Europe/Berlin',
          lat: profile.birth_lat || 0,
          lon: profile.birth_lng || 0,
        };

        const soulprintSectors = profile.astro_json?.soulprint_sectors || Array(12).fill(0);
        const quizSectors = Array(12).fill(0);

        const result = await fetchDailyHoroscope(birth, soulprintSectors, quizSectors, todayKey());
        setDaily(result);

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), data: result }));
      } catch (err) {
        console.warn('[DailyHoroscope] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile]);

  return { daily, loading };
}
