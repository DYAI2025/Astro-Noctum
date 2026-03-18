import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

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

    // When a new user logs in or the user changes, reset loading and
    // clear any previous completion state while we fetch fresh data.
    setLoading(true);
    setCompletedModuleIds(new Set());

    let isActive = true;

    supabase
      .from('contribution_events')
      .select('module_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!isActive) {
          return;
        }
        if (data) {
          setCompletedModuleIds(new Set(data.map(r => r.module_id)));
        }
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  const addModule = useCallback((moduleId: string) => {
    setCompletedModuleIds(prev => new Set([...prev, moduleId]));
  }, []);

  return { completedModuleIds, loading, addModule };
}
