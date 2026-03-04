import { createContext, useContext, useState, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PlanetariumContext
// Manages Planetarium Mode toggle with localStorage persistence.
// ─────────────────────────────────────────────────────────────────────────────

export const PLANETARIUM_STORAGE_KEY = "bazodiac-planetarium";

interface PlanetariumContextType {
  planetariumMode: boolean;
  togglePlanetarium: () => void;
  setPlanetariumMode: (value: boolean) => void;
}

const PlanetariumContext = createContext<PlanetariumContextType>({
  planetariumMode: false,
  togglePlanetarium: () => {},
  setPlanetariumMode: () => {},
});

export function PlanetariumProvider({ children }: { children: ReactNode }) {
  const [planetariumMode, setPlanetariumModeRaw] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PLANETARIUM_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setPlanetariumMode = (value: boolean) => {
    setPlanetariumModeRaw(value);
    try {
      localStorage.setItem(PLANETARIUM_STORAGE_KEY, String(value));
    } catch {
      // localStorage unavailable (private browsing, etc.) — ignore
    }
  };

  const togglePlanetarium = () => setPlanetariumMode(!planetariumMode);

  return (
    <PlanetariumContext.Provider value={{ planetariumMode, togglePlanetarium, setPlanetariumMode }}>
      {children}
    </PlanetariumContext.Provider>
  );
}

export function usePlanetarium(): PlanetariumContextType {
  return useContext(PlanetariumContext);
}
