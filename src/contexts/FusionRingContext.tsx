import { createContext, useContext, type ReactNode } from 'react';
import { useFusionRing } from '../hooks/useFusionRing';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import type { ContributionEvent } from '../lib/lme/types';
import type { ApiResults } from '../services/api';

interface FusionRingContextValue {
  signal: FusionRingSignal | null;
  addQuizResult: (event: ContributionEvent) => void;
  completedModules: Set<string>;
}

const FusionRingCtx = createContext<FusionRingContextValue | null>(null);

interface ProviderProps {
  apiResults: ApiResults | null;
  userId?: string;
  children: ReactNode;
}

export function FusionRingProvider({ apiResults, userId, children }: ProviderProps) {
  const { signal, addQuizResult, completedModules } = useFusionRing(apiResults, userId);
  return (
    <FusionRingCtx.Provider value={{ signal, addQuizResult, completedModules }}>
      {children}
    </FusionRingCtx.Provider>
  );
}

export function useFusionRingContext(): FusionRingContextValue {
  const ctx = useContext(FusionRingCtx);
  if (!ctx) throw new Error('useFusionRingContext must be inside FusionRingProvider');
  return ctx;
}
