/**
 * Signatur DevUI — Debug Presets
 * 
 * Vordefinierte Test-Konfigurationen für häufige Debug-Szenarien.
 * Jedes Preset ist ein Partial<DebugOverrides> Objekt.
 */

import type { DebugOverrides } from './types';

export const DEBUG_PRESETS: Record<string, DebugOverrides> = {
  // ─── Input-Variation ───────────────────────────────────────
  /**
   * Test: Input-Variation zwischen Natal und Quiz
   * 
   * Natal: assertion=0.95, empathy=0.05 (extrem)
   * Quiz:  assertion=0.05, empathy=0.95 (opposite)
   * 
   * Erwartung: Starke Lissajous-Kreuzung, chaotisches Muster
   */
  'input-variation-test': {
    natalOverride: new Map([
      ['assertion', 0.95],
      ['empathy', 0.05],
      ['creativity', 0.8],
      ['logic', 0.2],
      ['intuition', 0.7],
      ['discipline', 0.3],
    ]),
    quizOverride: new Map([
      ['assertion', 0.05],
      ['empathy', 0.95],
      ['creativity', 0.2],
      ['logic', 0.8],
      ['intuition', 0.3],
      ['discipline', 0.7],
    ]),
    forceDissonance: true,
    persistenceOverride: 0.95,
    timeFreeze: false,
  },

  // ─── Zeit-Kontinuität ──────────────────────────────────────
  /**
   * Test: Zeit-Kontinuität (kein Springen)
   * 
   * Langsame Bewegung (0.1x Speed) für präzise Beobachtung
   * Kurze Trails (500 Punkte) für schnellen Reset-Test
   * 
   * Erwartung: Poles bewegen sich glatt, keine Sprünge
   */
  'time-continuity-test': {
    timeScrub: 0,
    timeSpeed: 0.1,
    trailLengthOverride: 500,
    persistenceOverride: 0.9,
  },

  // ─── Determinismus ─────────────────────────────────────────
  /**
   * Test: Deterministische Pole-Positionen
   * 
   * Force Consonance für klare Kreis-Form
   * Konstanter Glow (8px) ohne Additive Blend
   * 
   * Erwartung: Reproduzierbare, identische Muster bei gleichen Inputs
   */
  'determinism-test': {
    forceConsonance: true,
    glowRadiusOverride: [8, 8],
    disableAdditiveBlend: true,
    timeFreeze: true,
  },

  // ─── Design-Kalibrierung ───────────────────────────────────
  /**
   * Preset: Maximale Kontrast-Sichtbarkeit
   * 
   * Sehr lange Trails (0.99 Persistenz)
   * Minimales Fade (0.02 Alpha)
   * Starker Glow (20-30px)
   * Density Field Overlay aktiv
   * 
   * Erwartung: Emergente Verdichtungen klar sichtbar
   */
  'calibration-max-contrast': {
    persistenceOverride: 0.99,
    fadeAlphaOverride: 0.02,
    glowRadiusOverride: [20, 30],
    showDensityField: true,
    densityThreshold: 0.6,
  },

  // ─── High Dissonance ───────────────────────────────────────
  /**
   * Preset: Maximale Spannung
   * 
   * Alle Dissonanzen auf 1.0
   * Hohe Persistenz (0.9) für überlappende Trails
   * Mittlerer Glow (15-25px)
   * 
   * Erwartung: Chaotische Kreuzungen, aufgebrochene Form
   */
  'high-dissonance': {
    forceDissonance: true,
    persistenceOverride: 0.9,
    glowRadiusOverride: [15, 25],
    timeSpeed: 0.5,
  },

  // ─── Trail-Persistenz ──────────────────────────────────────
  /**
   * Preset: Maximale Trail-Akkumulation
   * 
   * Extrem hohe Persistenz (0.99)
   * Maximale Länge (4000 Punkte)
   * Minimales Fade (0.01)
   * 
   * Erwartung: Dichte, sich verdichtende Form über Zeit
   */
  'trail-endurance': {
    persistenceOverride: 0.99,
    trailLengthOverride: 4000,
    fadeAlphaOverride: 0.01,
    timeSpeed: 2.0,
  },

  // ─── Cosmic Storm ──────────────────────────────────────────
  /**
   * Preset: Extreme Space Weather-Effekte
   * 
   * Kp-Index 9 (extrem)
   * Solar Storm 100% Intensität
   * Verstärkter Glow (25-35px)
   * Density Field für Emergenz-Analyse
   * 
   * Erwartung: Ring-Intensivierung, Partikel-Eruptionen
   */
  'cosmic-storm': {
    kpIndexOverride: 9,
    solarStormOverride: 1.0,
    spaceWeatherModulation: true,
    glowRadiusOverride: [25, 35],
    showDensityField: true,
    densityThreshold: 0.5,
  },

  // ─── Production-Simulation ─────────────────────────────────
  /**
   * Preset: Production-ähnliche Einstellungen
   * 
   * Keine Overrides — simuliert Production-Verhalten
   * 
   * Erwartung: Normales User-Erlebnis ohne Debug-Modifikationen
   */
  'production-like': {
    // Leer — keine Overrides
  },

  // ─── Konsonanz-Test ────────────────────────────────────────
  /**
   * Preset: Reine Konsonanz (Harmonie-Test)
   * 
   * Natal und Quiz identisch (aligned)
   * Force Consonance aktiv
   * Sanfte Persistenz (0.85)
   * 
   * Erwartung: Symmetrische, kreisförmige Bewegung
   */
  'pure-consonance': {
    natalOverride: new Map([
      ['assertion', 0.7],
      ['empathy', 0.5],
      ['creativity', 0.8],
      ['logic', 0.6],
      ['intuition', 0.7],
      ['discipline', 0.5],
    ]),
    quizOverride: new Map([
      ['assertion', 0.7],
      ['empathy', 0.5],
      ['creativity', 0.8],
      ['logic', 0.6],
      ['intuition', 0.7],
      ['discipline', 0.5],
    ]),
    forceConsonance: true,
    persistenceOverride: 0.85,
    glowRadiusOverride: [10, 18],
  },

  // ─── Single Dimension Focus ────────────────────────────────
  /**
   * Preset: Einzelne Dimension isoliert testen
   * 
   * Nur assertion auf Extremwerten (Natal 0.9, Quiz 0.1)
   * Alle anderen Dimensionen neutral (0.5)
   * 
   * Erwartung: assertion-Dominanz im Muster sichtbar
   */
  'single-dimension-assertion': {
    natalOverride: new Map([
      ['assertion', 0.9],
      ['empathy', 0.5],
      ['creativity', 0.5],
      ['logic', 0.5],
      ['intuition', 0.5],
      ['discipline', 0.5],
    ]),
    quizOverride: new Map([
      ['assertion', 0.1],
      ['empathy', 0.5],
      ['creativity', 0.5],
      ['logic', 0.5],
      ['intuition', 0.5],
      ['discipline', 0.5],
    ]),
    persistenceOverride: 0.9,
    glowRadiusOverride: [12, 20],
  },

  // ─── Density Field Calibration ─────────────────────────────
  /**
   * Preset: Density Field Kalibrierung
   * 
   * Verschiedene Threshold-Werte zum Testen
   * Hohe Persistenz für gute Dichte-Bildung
   * 
   * Erwartung: Heatmap zeigt emergente Strukturen
   */
  'density-field-calibration': {
    showDensityField: true,
    densityThreshold: 0.5,
    persistenceOverride: 0.97,
    fadeAlphaOverride: 0.015,
    trailLengthOverride: 3000,
    timeSpeed: 1.5,
  },
};

/**
 * Helper: Preset-Namen für UI-Select
 */
export const PRESET_LABELS: Record<keyof typeof DEBUG_PRESETS, string> = {
  'input-variation-test': 'Input Variation (Extremwerte)',
  'time-continuity-test': 'Zeit-Kontinuität (Langsam)',
  'determinism-test': 'Determinismus (Reproduzierbar)',
  'calibration-max-contrast': 'Kalibrierung (Max Kontrast)',
  'high-dissonance': 'Hohe Dissonanz (Chaotisch)',
  'trail-endurance': 'Trail-Akkumulation (Lang)',
  'cosmic-storm': 'Cosmic Storm (Kp=9)',
  'production-like': 'Production-Simulation',
  'pure-consonance': 'Reine Konsonanz (Harmonie)',
  'single-dimension-assertion': 'Single Dimension (Assertion)',
  'density-field-calibration': 'Density Field Kalibrierung',
};

/**
 * Helper: Preset-Beschreibungen für Tooltips
 */
export const PRESET_DESCRIPTIONS: Record<keyof typeof DEBUG_PRESETS, string> = {
  'input-variation-test': 'Natal und Quiz mit extremen opposite Werten — testet Dissonanz-Maximum',
  'time-continuity-test': 'Langsame Bewegung für präzise Beobachtung von Trail-Kontinuität',
  'determinism-test': 'Force Consonance + konstante Parameter — testet reproduzierbare Muster',
  'calibration-max-contrast': 'Maximale Trail-Sichtbarkeit für Design-Kalibrierung',
  'high-dissonance': 'Alle Dissonanzen auf 1.0 — chaotische Kreuzungen',
  'trail-endurance': 'Extrem lange Trails für Akkumulations-Tests',
  'cosmic-storm': 'Kp-Index 9 + Solar Storm 100% — testet Space Weather-Effekte',
  'production-like': 'Keine Overrides — simuliert Production-Verhalten',
  'pure-consonance': 'Natal und Quiz identisch — harmonische Kreisbewegung',
  'single-dimension-assertion': 'Nur assertion auf Extremwerten — isolierte Dimension-Analyse',
  'density-field-calibration': 'Optimiert für Density Field / Heatmap-Visualisierung',
};
