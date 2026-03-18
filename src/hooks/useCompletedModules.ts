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

    supabase
      .from('contribution_events')
      .select('module_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setCompletedModuleIds(new Set(data.map(r => r.module_id)));
        }
        setLoading(false);
      });
  }, [user]);

  const addModule = useCallback((moduleId: string) => {
    setCompletedModuleIds(prev => new Set([...prev, moduleId]));
  }, []);

  return { completedModuleIds, loading, addModule };
}
