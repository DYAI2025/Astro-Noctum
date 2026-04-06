import { createContext, useContext, useState, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PlanetariumContext
// Manages Planetarium Mode toggle with localStorage persistence.
// ─────────────────────────────────────────────────────────────────────────────

export const PLANETARIUM_STORAGE_KEY = "bazodiac-planetarium";
export const SKY_MODE_STORAGE_KEY = "bazodiac-skymode";

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

  const [skyMode, setSkyModeRaw] = useState<'birth' | 'current'>(() => {
    try {
      const stored = localStorage.getItem(SKY_MODE_STORAGE_KEY);
      return (stored === 'birth' || stored === 'current') ? stored : 'birth';
    } catch {
      return 'birth';
    }
  });

  const setPlanetariumMode = (value: boolean) => {
    setPlanetariumModeRaw(value);
    try {
      localStorage.setItem(PLANETARIUM_STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  };

  const setSkyMode = (mode: 'birth' | 'current') => {
    setSkyModeRaw(mode);
    try {
      localStorage.setItem(SKY_MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
    if (mode === 'current') setPlanetariumMode(true);
  };

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
