import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

const STORAGE_KEY = 'bazodiac_completed_quizzes';

/** Read completed module IDs from localStorage (survives reload). */
function getLocalCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/** Persist a module ID to localStorage. */
function addLocalCompleted(moduleId: string): void {
  try {
    const existing = getLocalCompleted();
    existing.add(moduleId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
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
        const fromLocal = getLocalCompleted();
        const merged = new Set([...fromDb, ...fromLocal]);

        setCompletedModuleIds(merged);
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  const addModule = useCallback((moduleId: string) => {
    addLocalCompleted(moduleId);
    setCompletedModuleIds(prev => new Set([...prev, moduleId]));
  }, []);

  return { completedModuleIds, loading, addModule };
}
