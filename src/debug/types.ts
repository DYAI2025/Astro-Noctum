/**
 * Signatur DevUI — Debug Types
 * 
 * Zentrale Typ-Definitionen für alle Debug-Overrides.
 * Wird von DebugInjection, DebugPanel und Engine-Komponenten verwendet.
 */

/**
 * Debug-Overrides für alle Schichten der Signatur V3 Engine.
 * 
 * Schicht-Modell:
 *   0: Data Foundation (Input-Daten: Natal, Quiz, Soulprint)
 *   1: Core Engine (Pole Logic, Dissonanz-Berechnung)
 *   2: Trail System (Partikel-Persistenz, Buffer-Management)
 *   3: Renderer (Visualisierung: Glow, Fade, Blend-Modes)
 *   4: Time Controls (Animation: Freeze, Scrub, Speed)
 */
export interface DebugOverrides {
  // ─── Schicht 0: Data Foundation ───────────────────────────
  /** Natal weights override (6 Dimensionen) */
  natalOverride?: Map<string, number>;
  /** Quiz weights override (6 Dimensionen) */
  quizOverride?: Map<string, number>;
  /** Raw soulprint_sectors (12-sector array) */
  soulprintOverride?: number[];
  /** Contribution events (für Cluster-Testing) */
  contributionOverride?: Array<{ moduleId: string; markers: number[] }>;

  // ─── Schicht 1: Core Engine ───────────────────────────────
  /** Dissonanz pro Dimension (0-1) */
  dissonanceOverride?: Map<string, number>;
  /** Alle Dissonanzen auf 0 setzen (reine Konsonanz) */
  forceConsonance?: boolean;
  /** Alle Dissonanzen auf 1 setzen (maximale Spannung) */
  forceDissonance?: boolean;
  /** Globale Dissonanz-Skalierung (0-2) */
  dissonanceScale?: number;

  // ─── Schicht 2: Trail System ──────────────────────────────
  /** Trail-Persistenz (0.0-1.0) */
  persistenceOverride?: number;
  /** Maximale Trail-Länge (Punkte) */
  trailLengthOverride?: number;

  // ─── Schicht 3: Renderer ──────────────────────────────────
  /** Glow-Radius [min, max] in Pixeln */
  glowRadiusOverride?: [number, number];
  /** Hintergrund-Fade-Alpha (0.01-0.2) */
  fadeAlphaOverride?: number;
  /** Additive Blend-Modus deaktivieren (zum Debuggen) */
  disableAdditiveBlend?: boolean;
  /** Density Field Heatmap einblenden */
  showDensityField?: boolean;
  /** Density Field Berechnungs-Threshold */
  densityThreshold?: number;

  // ─── Schicht 4: Time Controls ─────────────────────────────
  /** Animation anhalten */
  timeFreeze?: boolean;
  /** Manueller Zeit-Offset (Sekunden) */
  timeScrub?: number;
  /** Zeit-Geschwindigkeit (0.1x - 10x) */
  timeSpeed?: number;
  /** Frame-by-Frame Navigation */
  timeStep?: 'forward' | 'backward';

  // ─── Cosmic Weather ───────────────────────────────────────
  /** Solar Storm Intensity (0-1) */
  solarStormOverride?: number;
  /** Kp-Index (0-9) */
  kpIndexOverride?: number;
  /** Ring-Modulation durch Space Weather */
  spaceWeatherModulation?: boolean;
}

/**
 * Aktueller Debug-State (read-only für UI-Rendering).
 */
export interface DebugState {
  /** Aktuelle Overrides */
  overrides: DebugOverrides;
  /** Berechnete Pole-States (wird von Engine aktualisiert) */
  poleStates?: Array<{
    dimensionId: string;
    pole: 'A' | 'B';
    x: number;
    y: number;
    radius: number;
    speed: number;
    dissonance: number;
  }>;
  /** Density Field Grid (128x128 für Heatmap-Overlay) */
  densityField?: {
    width: number;
    height: number;
    grid: number[];
    maxDensity: number;
  };
}

/**
 * Density Field Struktur für Emergence-Visualisierung.
 */
export interface DensityField {
  width: number;
  height: number;
  grid: number[];
  maxDensity: number;
}
