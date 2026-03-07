/**
 * useCosmicEngine React Hook
 * Layer 3: React integration for the Cosmic Engine
 * Provides reactive state management for astronomical calculations
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  CosmicEngineAdapter,
  CosmicEngineConfig,
  MoonPosition,
  ObserverLocation,
  PlanetId,
  PlanetPosition,
  SolarSystemState,
  SunPosition,
} from '@/lib/cosmicEngine/types';
import { createCosmicEngine } from '@/lib/cosmicEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseCosmicEngineOptions extends CosmicEngineConfig {
  /** Auto-update interval in ms (0 = no auto-update) */
  autoUpdateInterval?: number;
  /** Initial date (default: now) */
  initialDate?: Date;
  /** Initial observer location */
  initialObserver?: ObserverLocation;
  /** Planets to track (default: all) */
  planets?: PlanetId[];
}

export interface UseCosmicEngineReturn {
  // State
  date: Date;
  observer: ObserverLocation | undefined;
  isLoading: boolean;
  error: Error | null;

  // Data
  planets: Map<PlanetId, PlanetPosition>;
  sun: SunPosition | null;
  moon: MoonPosition | null;
  solarSystem: SolarSystemState | null;

  // Actions
  setDate: (date: Date) => void;
  setObserver: (observer: ObserverLocation | undefined) => void;
  refresh: () => Promise<void>;

  // Engine access
  engine: CosmicEngineAdapter;

  // Cache stats
  getCacheStats: () => { hits: number; misses: number; size: number };
  clearCache: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * React hook for accessing the Cosmic Engine
 * Provides reactive astronomical data with automatic updates
 *
 * @example
 * ```tsx
 * function SolarSystemView() {
 *   const { planets, moon, isLoading, setDate } = useCosmicEngine({
 *     initialObserver: { latitude: 52.52, longitude: 13.405 }, // Berlin
 *   });
 *
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <div>
 *       {Array.from(planets.values()).map(planet => (
 *         <Planet key={planet.id} position={planet.cartesian} />
 *       ))}
 *       {moon && <Moon position={moon.cartesian} phase={moon.phase} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCosmicEngine(
  options: UseCosmicEngineOptions = {}
): UseCosmicEngineReturn {
  const {
    autoUpdateInterval = 0,
    initialDate,
    initialObserver,
    planets: planetFilter,
    ...engineConfig
  } = options;

  // Engine instance (created once)
  const engineRef = useRef<CosmicEngineAdapter | null>(null);
  if (!engineRef.current) {
    engineRef.current = createCosmicEngine(engineConfig);
  }
  const engine = engineRef.current;

  // State
  const [date, setDateState] = useState<Date>(initialDate ?? new Date());
  const [observer, setObserverState] = useState<ObserverLocation | undefined>(initialObserver);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Data state
  const [planets, setPlanets] = useState<Map<PlanetId, PlanetPosition>>(new Map());
  const [sun, setSun] = useState<SunPosition | null>(null);
  const [moon, setMoon] = useState<MoonPosition | null>(null);
  const [solarSystem, setSolarSystem] = useState<SolarSystemState | null>(null);

  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);

  /**
   * Fetch all astronomical data
   */
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const state = await engine.getSolarSystemState(date, observer);

      if (!isMountedRef.current) return;

      // Filter planets if specified
      let filteredPlanets = state.planets;
      if (planetFilter && planetFilter.length > 0) {
        filteredPlanets = new Map();
        for (const id of planetFilter) {
          const planet = state.planets.get(id);
          if (planet) {
            filteredPlanets.set(id, planet);
          }
        }
      }

      setPlanets(filteredPlanets);
      setSun(state.sun);
      setMoon(state.moon);
      setSolarSystem(state);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err : new Error('Failed to fetch astronomical data'));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [engine, date, observer, planetFilter]);

  // Fetch data when date or observer changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-update interval
  useEffect(() => {
    if (autoUpdateInterval <= 0) return;

    const interval = setInterval(() => {
      setDateState(new Date());
    }, autoUpdateInterval);

    return () => clearInterval(interval);
  }, [autoUpdateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Actions
  const setDate = useCallback((newDate: Date) => {
    setDateState(newDate);
  }, []);

  const setObserver = useCallback((newObserver: ObserverLocation | undefined) => {
    setObserverState(newObserver);
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Cache management
  const getCacheStats = useCallback(() => {
    return engine.getCacheStats();
  }, [engine]);

  const clearCache = useCallback(() => {
    engine.clearCache();
  }, [engine]);

  return {
    // State
    date,
    observer,
    isLoading,
    error,

    // Data
    planets,
    sun,
    moon,
    solarSystem,

    // Actions
    setDate,
    setObserver,
    refresh,

    // Engine
    engine,

    // Cache
    getCacheStats,
    clearCache,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseCosmicAnimationOptions extends UseCosmicEngineOptions {
  /** Target frames per second for updates */
  targetFPS?: number;
  /** Initial playback speed (days per second) */
  initialSpeed?: number;
  /** Whether to start playing immediately */
  autoPlay?: boolean;
}

export interface UseCosmicAnimationReturn extends UseCosmicEngineReturn {
  // Playback controls
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: number) => void;
  jumpToDate: (date: Date) => void;
}

/**
 * Animation-focused hook for the Cosmic Engine
 * Provides playback controls for time-lapse visualization
 *
 * @example
 * ```tsx
 * function AnimatedOrrery() {
 *   const {
 *     planets,
 *     isPlaying,
 *     speed,
 *     play,
 *     pause,
 *     setSpeed
 *   } = useCosmicAnimation({
 *     targetFPS: 30,
 *     initialSpeed: 1, // 1 day per second
 *     autoPlay: false,
 *   });
 *
 *   return (
 *     <div>
 *       <canvas ref={canvasRef} />
 *       <button onClick={isPlaying ? pause : play}>
 *         {isPlaying ? 'Pause' : 'Play'}
 *       </button>
 *       <input
 *         type="range"
 *         min={0.1}
 *         max={365}
 *         value={speed}
 *         onChange={e => setSpeed(Number(e.target.value))}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCosmicAnimation(
  options: UseCosmicAnimationOptions = {}
): UseCosmicAnimationReturn {
  const {
    targetFPS = 30,
    initialSpeed = 1,
    autoPlay = false,
    ...engineOptions
  } = options;

  const baseHook = useCosmicEngine(engineOptions);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeedState] = useState(initialSpeed);

  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const frameInterval = 1000 / targetFPS;

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!isPlaying) return;

      const elapsed = timestamp - lastUpdateRef.current;

      if (elapsed >= frameInterval) {
        // Calculate new date based on speed (days per second)
        const msPerDay = 24 * 60 * 60 * 1000;
        const msAdvance = (elapsed / 1000) * speed * msPerDay;
        const newDate = new Date(baseHook.date.getTime() + msAdvance);
        baseHook.setDate(newDate);

        lastUpdateRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastUpdateRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, speed, frameInterval, baseHook]);

  // Playback controls
  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(Math.max(0.001, newSpeed));
  }, []);

  const jumpToDate = useCallback((date: Date) => {
    baseHook.setDate(date);
  }, [baseHook]);

  return {
    ...baseHook,
    isPlaying,
    speed,
    play,
    pause,
    togglePlayPause,
    setSpeed,
    jumpToDate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE PLANET HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simplified hook for tracking a single planet
 */
export function usePlanetPosition(
  planet: PlanetId,
  date?: Date,
  observer?: ObserverLocation
): {
  position: PlanetPosition | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { planets, isLoading, error } = useCosmicEngine({
    planets: [planet],
    initialDate: date,
    initialObserver: observer,
  });

  return {
    position: planets.get(planet) ?? null,
    isLoading,
    error,
  };
}

/**
 * Simplified hook for tracking the Moon
 */
export function useMoonPosition(
  date?: Date,
  observer?: ObserverLocation
): {
  moon: MoonPosition | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { moon, isLoading, error } = useCosmicEngine({
    planets: [], // Don't fetch planets
    initialDate: date,
    initialObserver: observer,
  });

  return {
    moon,
    isLoading,
    error,
  };
}

export default useCosmicEngine;
