import { useEffect, useState } from 'react';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';

const STORAGE_KEY = 'bazodiac_quiz_last_suggestion';

/** Pure function — exported for testing */
export function pickSuggestion(completedModuleIds: Set<string>): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(STORAGE_KEY) === today) return null;
  if (Math.random() > 0.3) return null;

  const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
  const open = allModules.filter(id => !completedModuleIds.has(id));
  if (open.length === 0) return null;

  const pick = open[Math.floor(Math.random() * open.length)];
  localStorage.setItem(STORAGE_KEY, today);
  return pick;
}

export function useQuizSuggestion(completedModuleIds: Set<string>) {
  const [suggestedModule, setSuggestedModule] = useState<string | null>(null);

  useEffect(() => {
    setSuggestedModule(pickSuggestion(completedModuleIds));
  }, [completedModuleIds]);

  return suggestedModule;
}
