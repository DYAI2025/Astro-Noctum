// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// TypeScript interfaces for astronomical and visual data
// ═══════════════════════════════════════════════════════════════════════════════

export interface PlanetData {
  name: string;
  a: number; // Semi-major axis (AU)
  e: number; // Eccentricity
  i: number; // Inclination (degrees)
  omega: number; // Longitude of ascending node (degrees)
  w: number; // Argument of perihelion (degrees)
  M0: number; // Mean anomaly at epoch (degrees)
  period: number; // Orbital period (days)
  radius: number; // Visual radius for rendering
  color: string; // Color hex code
  symbol: string; // Unicode symbol
  rings?: boolean; // Has rings (Saturn)
}

export interface StarData {
  name: string;
  ra: number; // Right Ascension (hours)
  dec: number; // Declination (degrees)
  mag: number; // Apparent magnitude
  con: string; // Constellation abbreviation
}

export interface CityData {
  name: string;
  lat: number; // Latitude (degrees)
  lon: number; // Longitude (degrees)
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface EquatorialCoordinates {
  ra: number; // Right Ascension (hours)
  dec: number; // Declination (degrees)
}

export interface HorizontalCoordinates {
  altitude: number; // Altitude (degrees)
  azimuth: number; // Azimuth (degrees)
}

export type ViewMode = 'orrery' | 'transition' | 'planetarium';

export interface BirthData {
  date: Date;
  city: CityData;
}

export interface HoveredObject {
  name: string;
  type: 'star' | 'planet';
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
  // Initial settings
  initialDate?: Date;
  initialViewMode?: ViewMode;
  initialSpeed?: number;

  // Visual settings
  sunRadius?: number;
  orbitScale?: number;
  showOrbits?: boolean;
  showConstellations?: boolean;
  showConstellationNames?: boolean;

  // Observer location
  observerLatitude?: number;
  observerLongitude?: number;

  // Callbacks
  onViewModeChange?: (mode: ViewMode) => void;
  onDateChange?: (date: Date) => void;
  onPlanetClick?: (planetKey: string, planet: PlanetData) => void;
  onStarClick?: (star: StarData) => void;

  // Style overrides
  className?: string;
  style?: React.CSSProperties;
}

export interface CelestialOrreryAPI {
  // View control
  setViewMode: (mode: ViewMode) => void;
  getViewMode: () => ViewMode;

  // Time control
  setDate: (date: Date) => void;
  getDate: () => Date;
  setSpeed: (speed: number) => void;
  getSpeed: () => number;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  isPlaying: () => boolean;

  // Camera control
  setCameraPosition: (x: number, y: number, z: number) => void;
  lookAt: (x: number, y: number, z: number) => void;
  resetCamera: () => void;

  // Observer location
  setObserverLocation: (latitude: number, longitude: number) => void;
  getObserverLocation: () => { latitude: number; longitude: number };

  // Planet control
  getPlanetPosition: (planetKey: string) => Position3D | null;
  focusOnPlanet: (planetKey: string) => void;

  // Settings
  setShowOrbits: (show: boolean) => void;
  setShowConstellations: (show: boolean) => void;
  setShowConstellationNames: (show: boolean) => void;

  // Birth chart
  showBirthChart: (birthDate: string, birthTime: string, city: CityData) => void;

  // Scene access
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
