import React, { createContext, useContext } from "react";
import type { MobileBootstrap } from "@bazodiac/shared";

export type PremiumTier = "free" | "premium";

export type AppStateValue = {
  userId: string;
  profile: any;
  tier: PremiumTier;
  bootstrap: MobileBootstrap | null;
  refreshProfile: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ value, children }: { value: AppStateValue; children: React.ReactNode }) {
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}
