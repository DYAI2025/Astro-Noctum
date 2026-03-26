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
  skyMode: 'birth' | 'current';
  setSkyMode: (mode: 'birth' | 'current') => void;
}

const PlanetariumContext = createContext<PlanetariumContextType>({
  planetariumMode: false,
  togglePlanetarium: () => {},
  setPlanetariumMode: () => {},
  skyMode: 'birth',
  setSkyMode: () => {},
});

export function PlanetariumProvider({ children }: { children: ReactNode }) {
  const [planetariumMode, setPlanetariumModeRaw] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(PLANETARIUM_STORAGE_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
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

  const [skyMode, setSkyModeRaw] = useState<'birth' | 'current'>('birth');

  function setSkyMode(mode: 'birth' | 'current') {
    setSkyModeRaw(mode);
    if (mode === 'current') setPlanetariumMode(true);
  }

  const togglePlanetarium = () => {
    setPlanetariumModeRaw((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem(PLANETARIUM_STORAGE_KEY, String(newValue));
      } catch {
        // ignore
      }
      return newValue;
    });
  };

  return (
    <PlanetariumContext.Provider value={{ planetariumMode, togglePlanetarium, setPlanetariumMode, skyMode, setSkyMode }}>
      {children}
    </PlanetariumContext.Provider>
  );
}

export function usePlanetarium(): PlanetariumContextType {
  return useContext(PlanetariumContext);
}
