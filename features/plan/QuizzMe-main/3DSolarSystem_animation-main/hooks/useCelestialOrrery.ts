// ═══════════════════════════════════════════════════════════════════════════════
// CELESTIAL ORRERY HOOK
// React hook for managing state and providing API control
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import {
  ViewMode,
  CityData,
  BirthData,
  HoveredObject,
  Position3D,
  CelestialOrreryAPI
} from '../lib/astronomy/types';
import { daysSinceJ2000 } from '../lib/astronomy/calculations';

export interface UseCelestialOrreryReturn {
  // State
  viewMode: ViewMode;
  showOrbits: boolean;
  showConstellations: boolean;
  showConstellationNames: boolean;
  simTime: number;
  speed: number;
  isPlaying: boolean;
  dateInput: string;
  selectedCity: CityData;
  customLat: string;
  customLon: string;
  birthData: BirthData | null;
  transitionProgress: number;
  hoveredObject: HoveredObject | null;

  // Setters
  setViewMode: (mode: ViewMode) => void;
  setShowOrbits: (show: boolean) => void;
  setShowConstellations: (show: boolean) => void;
  setShowConstellationNames: (show: boolean) => void;
  setSimTime: (time: number | ((prev: number) => number)) => void;
  setSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDateInput: (input: string) => void;
  setSelectedCity: (city: CityData) => void;
  setCustomLat: (lat: string) => void;
  setCustomLon: (lon: string) => void;
  setBirthData: (data: BirthData | null) => void;
  setTransitionProgress: (progress: number | ((prev: number) => number)) => void;
  setHoveredObject: (obj: HoveredObject | null) => void;

  // Computed values
  currentDate: Date;
  observerLat: number;
  observerLon: number;

  // Refs (for Three.js objects)
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;

  // API
  api: CelestialOrreryAPI;
}

export function useCelestialOrrery(
  initialCity: CityData,
  initialDate?: Date
): UseCelestialOrreryReturn {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('orrery');
  const [showOrbits, setShowOrbits] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showConstellationNames, setShowConstellationNames] = useState(true);
  const [simTime, setSimTime] = useState(() =>
    daysSinceJ2000(initialDate || new Date())
  );
  const [speed, setSpeed] = useState(86400);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dateInput, setDateInput] = useState('');
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [hoveredObject, setHoveredObject] = useState<HoveredObject | null>(null);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Planet meshes ref (for API access)
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});

  // Computed values
  const currentDate = new Date(
    Date.UTC(2000, 0, 1, 12, 0, 0) + simTime * 24 * 60 * 60 * 1000
  );

  const observerLat = customLat ? parseFloat(customLat) : selectedCity.lat;
  const observerLon = customLon ? parseFloat(customLon) : selectedCity.lon;

  // API Implementation
  const api: CelestialOrreryAPI = {
    // View control
    setViewMode,
    getViewMode: () => viewMode,

    // Time control
    setDate: useCallback((date: Date) => {
      setSimTime(daysSinceJ2000(date));
    }, []),
    getDate: () => currentDate,
    setSpeed,
    getSpeed: () => speed,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    togglePlayPause: () => setIsPlaying(p => !p),
    isPlaying: () => isPlaying,

    // Camera control
    setCameraPosition: useCallback((x: number, y: number, z: number) => {
      if (cameraRef.current) {
        cameraRef.current.position.set(x, y, z);
      }
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

    // Observer location
    setObserverLocation: useCallback((latitude: number, longitude: number) => {
      setCustomLat(latitude.toString());
      setCustomLon(longitude.toString());
    }, []),
    getObserverLocation: () => ({ latitude: observerLat, longitude: observerLon }),

    // Planet control
    getPlanetPosition: useCallback((planetKey: string): Position3D | null => {
      const mesh = planetMeshesRef.current[planetKey];
      if (!mesh) return null;
      return {
        x: mesh.position.x,
        y: mesh.position.y,
        z: mesh.position.z
      };
    }, []),
    focusOnPlanet: useCallback((planetKey: string) => {
      const mesh = planetMeshesRef.current[planetKey];
      if (!mesh || !cameraRef.current) return;

      const pos = mesh.position;
      cameraRef.current.position.set(
        pos.x + 20,
        pos.y + 15,
        pos.z + 20
      );

      if ('lookAt' in cameraRef.current) {
        (cameraRef.current as THREE.PerspectiveCamera).lookAt(pos);
      }
    }, []),

    // Settings
    setShowOrbits,
    setShowConstellations,
    setShowConstellationNames,

    // Birth chart
    showBirthChart: useCallback((birthDate: string, birthTime: string, city: CityData) => {
      const [y, m, d] = birthDate.split('-').map(Number);
      const [h, min] = birthTime.split(':').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, h, min));

      setBirthData({ date, city });
      setSimTime(daysSinceJ2000(date));
      setSelectedCity(city);
      setIsPlaying(false);
      setViewMode('transition');
    }, []),

    // Scene access
    getScene: () => sceneRef.current,
    getCamera: () => cameraRef.current,
    getRenderer: () => rendererRef.current
  };

  return {
    // State
    viewMode,
    showOrbits,
    showConstellations,
    showConstellationNames,
    simTime,
    speed,
    isPlaying,
    dateInput,
    selectedCity,
    customLat,
    customLon,
    birthData,
    transitionProgress,
    hoveredObject,

    // Setters
    setViewMode,
    setShowOrbits,
    setShowConstellations,
    setShowConstellationNames,
    setSimTime,
    setSpeed,
    setIsPlaying,
    setDateInput,
    setSelectedCity,
    setCustomLat,
    setCustomLon,
    setBirthData,
    setTransitionProgress,
    setHoveredObject,

    // Computed
    currentDate,
    observerLat,
    observerLon,

    // Refs
    sceneRef,
    cameraRef,
    rendererRef,

    // API
    api
  };
}

export default useCelestialOrrery;
