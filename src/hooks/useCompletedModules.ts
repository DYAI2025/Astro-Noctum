import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

const STORAGE_KEY_PREFIX = 'bazodiac_completed_quizzes';
function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

/** Read completed module IDs from localStorage (survives reload). */
export function getLocalCompleted(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/** Persist a module ID to localStorage. */
export function addLocalCompleted(userId: string, moduleId: string): void {
  try {
    const existing = getLocalCompleted(userId);
    existing.add(moduleId);
    localStorage.setItem(storageKey(userId), JSON.stringify([...existing]));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function useCompletedModules() {
  const { user } = useAuth();
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompletedModuleIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setCompletedModuleIds(new Set());

    let isActive = true;

    supabase
      .from('contribution_events')
      .select('module_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!isActive) return;

        // Merge Supabase (cluster-gated contributions) + localStorage (individual completions)
        const fromDb = data ? new Set(data.map(r => r.module_id)) : new Set<string>();
        const fromLocal = getLocalCompleted(user.id);
        const merged = new Set([...fromDb, ...fromLocal]);

        setCompletedModuleIds(merged);
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  const addModule = useCallback((moduleId: string) => {
    if (!user) return;
    addLocalCompleted(user.id, moduleId);
    setCompletedModuleIds(prev => new Set([...prev, moduleId]));

    // Also persist individual completion to Supabase (fire-and-forget)
    // This ensures completions survive cross-device / incognito scenarios
    supabase
      .from('contribution_events')
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        sector_weights: Array(12).fill(0),
        confidence: 0,
      }, { onConflict: 'user_id,module_id' })
      .then(({ error }) => {
        if (error) console.warn('[useCompletedModules] Individual persist failed:', error.message);
      });
  }, [user]);

  return { completedModuleIds, loading, addModule };
}
