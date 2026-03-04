// ═══════════════════════════════════════════════════════════════════════════════
// CELESTIAL ORRERY HOOK
// React hook for managing state and providing API control
// Adapted from 3DSolarSystem_animation reference for Astro-Noctum
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import type {
  ViewMode, CityData, BirthData, HoveredObject, Position3D, CelestialOrreryAPI,
} from '../lib/astronomy/types';
import { daysSinceJ2000 } from '../lib/astronomy/calculations';

export interface UseCelestialOrreryReturn {
  viewMode: ViewMode;
  showOrbits: boolean;
  showConstellations: boolean;
  showConstellationNames: boolean;
  simTime: number;
  speed: number;
  isPlaying: boolean;
  selectedCity: CityData;
  hoveredObject: HoveredObject | null;
  setViewMode: (mode: ViewMode) => void;
  setShowOrbits: (show: boolean) => void;
  setShowConstellations: (show: boolean) => void;
  setShowConstellationNames: (show: boolean) => void;
  setSimTime: (time: number | ((prev: number) => number)) => void;
  setSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSelectedCity: (city: CityData) => void;
  setHoveredObject: (obj: HoveredObject | null) => void;
  currentDate: Date;
  observerLat: number;
  observerLon: number;
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  api: CelestialOrreryAPI;
}

export function useCelestialOrrery(
  initialCity: CityData,
  initialDate?: Date,
): UseCelestialOrreryReturn {
  const [viewMode, setViewMode] = useState<ViewMode>('orrery');
  const [showOrbits, setShowOrbits] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showConstellationNames, setShowConstellationNames] = useState(true);
  const [simTime, setSimTime] = useState(() => daysSinceJ2000(initialDate || new Date()));
  const [speed, setSpeed] = useState(86400);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [hoveredObject, setHoveredObject] = useState<HoveredObject | null>(null);

  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});

  const currentDate = new Date(
    Date.UTC(2000, 0, 1, 12, 0, 0) + simTime * 24 * 60 * 60 * 1000,
  );
  const observerLat = customLat ? parseFloat(customLat) : selectedCity.lat;
  const observerLon = customLon ? parseFloat(customLon) : selectedCity.lon;

  const api: CelestialOrreryAPI = {
    setViewMode,
    getViewMode: () => viewMode,
    setDate: useCallback((date: Date) => setSimTime(daysSinceJ2000(date)), []),
    getDate: () => currentDate,
    setSpeed,
    getSpeed: () => speed,
    play:  () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    togglePlayPause: () => setIsPlaying(p => !p),
    isPlaying: () => isPlaying,
    setCameraPosition: useCallback((x: number, y: number, z: number) => {
      cameraRef.current?.position.set(x, y, z);
    }, []),
    lookAt: useCallback((x: number, y: number, z: number) => {
      if (cameraRef.current && 'lookAt' in cameraRef.current) {
        (cameraRef.current as THREE.PerspectiveCamera).lookAt(x, y, z);
      }
    }, []),
    resetCamera: useCallback(() => {
      if (cameraRef.current) {
        cameraRef.current.position.set(100, 80, 100);
        if ('lookAt' in cameraRef.current) {
          (cameraRef.current as THREE.PerspectiveCamera).lookAt(0, 0, 0);
        }
      }
    }, []),
    setObserverLocation: useCallback((lat: number, lon: number) => {
      setCustomLat(lat.toString());
      setCustomLon(lon.toString());
    }, []),
    getObserverLocation: () => ({ latitude: observerLat, longitude: observerLon }),
    getPlanetPosition: useCallback((key: string): Position3D | null => {
      const mesh = planetMeshesRef.current[key];
      if (!mesh) return null;
      return { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
    }, []),
    focusOnPlanet: useCallback((key: string) => {
      const mesh = planetMeshesRef.current[key];
      if (!mesh || !cameraRef.current) return;
      const p = mesh.position;
      cameraRef.current.position.set(p.x + 20, p.y + 15, p.z + 20);
      if ('lookAt' in cameraRef.current) {
        (cameraRef.current as THREE.PerspectiveCamera).lookAt(p);
      }
    }, []),
    setShowOrbits,
    setShowConstellations,
    setShowConstellationNames,
    showBirthChart: useCallback((birthDate: string, birthTime: string, city: CityData) => {
      const [y, m, d] = birthDate.split('-').map(Number);
      const [h, min] = birthTime.split(':').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, h, min));
      setSimTime(daysSinceJ2000(date));
      setSelectedCity(city);
      setIsPlaying(false);
      setViewMode('transition');
    }, []),
    getScene:    () => sceneRef.current,
    getCamera:   () => cameraRef.current,
    getRenderer: () => rendererRef.current,
  };

  return {
    viewMode, showOrbits, showConstellations, showConstellationNames,
    simTime, speed, isPlaying, selectedCity, hoveredObject,
    setViewMode, setShowOrbits, setShowConstellations, setShowConstellationNames,
    setSimTime, setSpeed, setIsPlaying, setSelectedCity, setHoveredObject,
    currentDate, observerLat, observerLon,
    sceneRef, cameraRef, rendererRef,
    api,
  };
}

export default useCelestialOrrery;
