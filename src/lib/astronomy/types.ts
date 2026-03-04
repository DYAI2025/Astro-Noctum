// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// TypeScript interfaces for astronomical and visual data
// ═══════════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';

export interface PlanetData {
  name: string;
  a: number;
  e: number;
  i: number;
  omega: number;
  w: number;
  M0: number;
  period: number;
  radius: number;
  color: string;
  symbol: string;
  rings?: boolean;
}

export interface StarData {
  name: string;
  ra: number;
  dec: number;
  mag: number;
  con: string;
}

export interface CityData {
  name: string;
  lat: number;
  lon: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface EquatorialCoordinates {
  ra: number;
  dec: number;
}

export interface HorizontalCoordinates {
  altitude: number;
  azimuth: number;
}

export type ViewMode = "orrery" | "transition" | "planetarium";

export interface BirthData {
  date: Date;
  city: CityData;
}

export interface HoveredObject {
  name: string;
  type: "star" | "planet";
  altitude: number;
  azimuth: number;
  mag?: number;
  con?: string;
  symbol?: string;
  color?: string;
  screenX: number;
  screenY: number;
}

export interface CelestialOrreryConfig {
  initialDate?: Date;
  initialViewMode?: ViewMode;
  initialSpeed?: number;
  sunRadius?: number;
  orbitScale?: number;
  showOrbits?: boolean;
  showConstellations?: boolean;
  showConstellationNames?: boolean;
  observerLatitude?: number;
  observerLongitude?: number;
  onViewModeChange?: (mode: ViewMode) => void;
  onDateChange?: (date: Date) => void;
  onPlanetClick?: (planetKey: string, planet: PlanetData) => void;
  onStarClick?: (star: StarData) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface CelestialOrreryAPI {
  setViewMode: (mode: ViewMode) => void;
  getViewMode: () => ViewMode;
  setDate: (date: Date) => void;
  getDate: () => Date;
  setSpeed: (speed: number) => void;
  getSpeed: () => number;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  isPlaying: () => boolean;
  setCameraPosition: (x: number, y: number, z: number) => void;
  lookAt: (x: number, y: number, z: number) => void;
  resetCamera: () => void;
  setObserverLocation: (latitude: number, longitude: number) => void;
  getObserverLocation: () => { latitude: number; longitude: number };
  getPlanetPosition: (planetKey: string) => Position3D | null;
  focusOnPlanet: (planetKey: string) => void;
  setShowOrbits: (show: boolean) => void;
  setShowConstellations: (show: boolean) => void;
  setShowConstellationNames: (show: boolean) => void;
  showBirthChart: (birthDate: string, birthTime: string, city: CityData) => void;
  getScene: () => THREE.Scene | null;
  getCamera: () => THREE.Camera | null;
  getRenderer: () => THREE.WebGLRenderer | null;
}

export interface ConstellationLines {
  [constellation: string]: [string, string][];
}

export interface ConstellationNames {
  [constellation: string]: string;
}
