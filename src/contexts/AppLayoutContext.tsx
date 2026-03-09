import { createContext, useContext, type ReactNode } from 'react';
import type { ApiIssue } from '../services/api';

export interface AppLayoutValue {
  interpretation: string;
  apiData: any;
  userId: string;
  birthDate: string | null;
  onReset: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  apiIssues: ApiIssue[];
  onStopAudio: () => void;
  onResumeAudio: () => void;
  isFirstReading: boolean;
}

const AppLayoutCtx = createContext<AppLayoutValue | null>(null);

export function AppLayoutProvider({ value, children }: { value: AppLayoutValue; children: ReactNode }) {
  return <AppLayoutCtx.Provider value={value}>{children}</AppLayoutCtx.Provider>;
}

export function useAppLayout(): AppLayoutValue {
  const ctx = useContext(AppLayoutCtx);
  if (!ctx) throw new Error('useAppLayout must be inside AppLayoutProvider');
  return ctx;
}
