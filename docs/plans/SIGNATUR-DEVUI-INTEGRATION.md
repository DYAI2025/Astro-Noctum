# Signatur DevUI Integration Plan

**Phase:** Code  
**Priorität:** P1  
**Sprint:** S-DEVUI (vorgeschlagen)  
**Stand:** 2026-04-03

---

## Zusammenfassung

Dieser Plan beschreibt die Integration der **isolierten Signatur-DevUI** als kontrollierte Testumgebung für das Signatur V3 Feature. Die DevUI ermöglicht gesteuerte Eingabe von Testdaten (Natal Charts, Quiz Results, Transiten, Contribution Events, Cosmic Weather) mit visuell dargestellten Signature-Effekten in Echtzeit.

**Ziel:** Debugging und Kalibrierung der Signatur V3 Engine ohne Production-Dependencies (Supabase, BAFE, User-Auth).

---

## Architektur: Sidecar-Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Production App (Astro-Noctum)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Signatur V3 Engine (bipolar-engine.ts)         │   │
│  │  • Schicht 0: Data Foundation (API-Inputs)      │   │
│  │  • Schicht 1: Pole Initialization + Dissonanz   │   │
│  │  • Schicht 2: Trail System (Update-Loop)        │   │
│  │  • Schicht 3: Canvas Renderer (Three.js)        │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │ (State-Access via Hooks)          │
└─────────────────────┼───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Debug Sidecar (NUR Dev-Build)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  DebugInjection (Singleton)                     │   │
│  │  • Globale Overrides (alle Schichten)           │   │
│  │  • Subscriber-Pattern (Live-Updates)            │   │
│  │  • Build-Flag geschützt (NODE_ENV)              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  DebugPanel (React UI)                          │   │
│  │  • Input-Controls (Slider, Toggles)             │   │
│  │  • State Inspector (Numerisch + Visuell)        │   │
│  │  • Preset-System (Reproduzierbare Tests)        │   │
│  │  • Export/Import (State-Sequenzen)              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Test Data Generators                           │   │
│  │  • Natal Chart Generator (Zufall/Manuell)       │   │
│  │  • Quiz Result Generator (Extremwerte)          │   │
│  │  • Transit Simulator (Zeit-Scrubbing)           │   │
│  │  • Contribution Event Injector                  │   │
│  │  • Cosmic Weather Simulator (DONKI-Daten)       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Schichten-Modell

Die Debug-Integration folgt der bestehenden Schichten-Architektur der Signatur V3:

| Schicht | Komponente | Debug-Controls |
|---------|------------|----------------|
| **0: Data Foundation** | `bipolar-engine.ts` (Input) | Natal-Slider (6 Dim), Quiz-Slider (6 Dim), API-Response-Mock |
| **1: Core Engine** | `bipolar-engine.ts` (Pole Logic) | Dissonanz-Overrides, Force Consonance/Dissonance, Dimension-spezifische Werte |
| **2: Trail System** | `FusionRingCanvasV2.tsx` | Persistence Rate, Trail Length, Buffer-Clearing-Logik |
| **3: Renderer** | `FusionRingCanvasV2.tsx` | Glow Radius, Fade Alpha, Blend Modes, Density Field Overlay |
| **4: Time** | `requestAnimationFrame` | Freeze, Scrub, Speed, Step-Forward/Backward |

---

## Implementierungs-Phasen

### Phase 1: DebugInjection Interface (Schicht-übergreifend)

**Ziel:** Zentrale, typsichere Schnittstelle für Debug-Overrides.

**Dateien:**
- `src/debug/debug-injection.ts` (neu)
- `src/debug/types.ts` (neu)

**Interface-Definition:**

```typescript
// src/debug/types.ts

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

export interface DebugState {
  /** Aktuelle Overrides */
  overrides: DebugOverrides;
  /** Berechnete Pole-States (read-only) */
  poleStates?: Array<{
    dimensionId: string;
    pole: 'A' | 'B';
    x: number;
    y: number;
    radius: number;
    speed: number;
    dissonance: number;
  }>;
  /** Density Field Grid (128x128) */
  densityField?: {
    width: number;
    height: number;
    grid: number[];
    maxDensity: number;
  };
}
```

**Singleton-Klasse:**

```typescript
// src/debug/debug-injection.ts

import { DebugOverrides, DebugState } from './types';

export class DebugInjection {
  private static instance: DebugInjection;
  private overrides: DebugOverrides = {};
  private listeners: Array<(state: DebugState) => void> = [];
  private state: DebugState = { overrides: {} };

  static getInstance(): DebugInjection {
    if (!DebugInjection.instance) {
      DebugInjection.instance = new DebugInjection();
    }
    return DebugInjection.instance;
  }

  setOverrides(overrides: Partial<DebugOverrides>): void {
    this.overrides = { ...this.overrides, ...overrides };
    this.notify();
  }

  getOverrides(): DebugOverrides {
    return { ...this.overrides };
  }

  getState(): DebugState {
    return { ...this.state };
  }

  updatePoleStates(poleStates: DebugState['poleStates']): void {
    this.state.poleStates = poleStates;
    this.notify();
  }

  updateDensityField(field: DebugState['densityField']): void {
    this.state.densityField = field;
    this.notify();
  }

  subscribe(listener: (state: DebugState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  reset(): void {
    this.overrides = {};
    this.state = { overrides: {} };
    this.notify();
  }

  private notify(): void {
    this.state.overrides = { ...this.overrides };
    this.listeners.forEach(fn => fn(this.state));
  }
}

/** Build-Flag-geschützte Helper */
export function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development';
}
```

---

### Phase 2: Engine-Integration (bipolar-engine.ts)

**Ziel:** DebugInjection als optionaler Input in der Engine.

**Änderungen:**

```typescript
// src/components/signatur-v3/bipolar-engine.ts

import { DebugInjection, isDebugMode } from '../../debug/debug-injection';

export function initializePoles(
  config: SignaturV3Config,
  natal: Map<string, number>,
  quiz: Map<string, number>,
  time: number = 0
): PoleState[] {
  // Debug-Overrides anwenden (NUR im Dev-Build)
  let effectiveNatal = natal;
  let effectiveQuiz = quiz;

  if (isDebugMode()) {
    const debug = DebugInjection.getInstance();
    const overrides = debug.getOverrides();

    if (overrides.natalOverride) {
      effectiveNatal = overrides.natalOverride;
    }
    if (overrides.quizOverride) {
      effectiveQuiz = overrides.quizOverride;
    }
  }

  // ... bestehende Pole-Initialisierung mit effectiveNatal/Quiz
}

export function computeDissonance(
  natal: Map<string, number>,
  quiz: Map<string, number>
): Map<string, number> {
  let dissonance = computeV3Dissonance(natal, quiz);

  // Debug-Overrides (NUR im Dev-Build)
  if (isDebugMode()) {
    const debug = DebugInjection.getInstance();
    const overrides = debug.getOverrides();

    if (overrides.forceConsonance) {
      dissonance = new Map(Array.from(dissonance.keys()).map(k => [k, 0]));
    } else if (overrides.forceDissonance) {
      dissonance = new Map(Array.from(dissonance.keys()).map(k => [k, 1]));
    } else if (overrides.dissonanceOverride) {
      dissonance = overrides.dissonanceOverride;
    } else if (overrides.dissonanceScale !== undefined) {
      dissonance = new Map(
        Array.from(dissonance.entries()).map(([k, v]) => [k, v * overrides.dissonanceScale!])
      );
    }
  }

  return dissonance;
}

export function updatePoles(
  poles: PoleState[],
  dissonance: Map<string, number>,
  config: SignaturV3Config,
  time: number
): void {
  // Zeit-Overrides
  let effectiveTime = time;

  if (isDebugMode()) {
    const debug = DebugInjection.getInstance();
    const overrides = debug.getOverrides();

    if (overrides.timeFreeze) {
      effectiveTime = 0;
    } else if (overrides.timeScrub !== undefined) {
      effectiveTime = overrides.timeScrub;
    } else if (overrides.timeSpeed !== undefined) {
      effectiveTime = time * overrides.timeSpeed;
    }
  }

  // ... bestehende Pole-Update-Logik mit effectiveTime
}
```

---

### Phase 3: Renderer-Integration (FusionRingCanvasV2.tsx)

**Ziel:** Debug-Overrides für Trail-System und Visualisierung.

**Änderungen:**

```typescript
// src/components/fusion-ring-website/FusionRingCanvasV2.tsx

import { DebugInjection, isDebugMode } from '../../debug/debug-injection';

export function FusionRingCanvasV2({
  natalWeights,
  quizWeights,
  // ... andere Props
}: Props) {
  const debug = isDebugMode() ? DebugInjection.getInstance() : null;
  const [debugState, setDebugState] = useState<DebugState | null>(null);

  // Sync mit DebugInjection
  useEffect(() => {
    if (!debug) return;
    return debug.subscribe(setDebugState);
  }, [debug]);

  // Config-Overrides
  const config: SignaturV3Config = useMemo(() => {
    const baseConfig: SignaturV3Config = {
      maxR: 200,
      maxTrailLength: 2000,
      trailPersistence: 0.85,
      timeScale: 1.0,
    };

    if (debugState?.overrides) {
      const o = debugState.overrides;
      if (o.persistenceOverride !== undefined) {
        baseConfig.trailPersistence = o.persistenceOverride;
      }
      if (o.trailLengthOverride !== undefined) {
        baseConfig.maxTrailLength = o.trailLengthOverride;
      }
    }

    return baseConfig;
  }, [debugState?.overrides]);

  // Renderer-Overrides
  const rendererConfig = useMemo(() => {
    const base = {
      glowRadiusMin: 8,
      glowRadiusMax: 20,
      fadeAlpha: 0.05,
      useAdditiveBlend: true,
    };

    if (debugState?.overrides) {
      const o = debugState.overrides;
      if (o.glowRadiusOverride) {
        base.glowRadiusMin = o[0];
        base.glowRadiusMax = o[1];
      }
      if (o.fadeAlphaOverride !== undefined) {
        base.fadeAlpha = o.fadeAlphaOverride;
      }
      if (o.disableAdditiveBlend) {
        base.useAdditiveBlend = false;
      }
    }

    return base;
  }, [debugState?.overrides]);

  // Density Field Overlay (nur on-demand)
  const [densityField, setDensityField] = useState<DensityField | null>(null);

  useEffect(() => {
    if (!debugState?.overrides?.showDensityField) {
      setDensityField(null);
      return;
    }

    // Heavy computation — nur wenn aktiviert
    const field = computeDensityField(trails, debugState.overrides.densityThreshold ?? 0.7);
    setDensityField(field);

    // Density Field an DebugInjection melden
    debug?.updateDensityField({
      width: field.width,
      height: field.height,
      grid: field.grid,
      maxDensity: field.maxDensity,
    });
  }, [debugState?.overrides?.showDensityField, trails]);

  // ... bestehender Render-Code mit rendererConfig
}
```

---

### Phase 4: Debug Panel UI-Komponente

**Ziel:** React-basiertes Control Panel mit allen Debug-Controls.

**Datei:** `src/debug/DebugPanel.tsx`

```typescript
// src/debug/DebugPanel.tsx

import { useState, useEffect } from 'react';
import { DebugInjection, isDebugMode } from './debug-injection';
import { DebugOverrides } from './types';
import { DEBUG_PRESETS } from './presets';

const DIMENSIONS = ['assertion', 'empathy', 'creativity', 'logic', 'intuition', 'discipline'];

export function DebugPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [state, setState] = useState<DebugState | null>(null);
  const debug = DebugInjection.getInstance();

  // Sync mit DebugInjection
  useEffect(() => {
    if (!isDebugMode()) return;
    return debug.subscribe(setState);
  }, []);

  const updateOverride = (key: keyof DebugOverrides, value: any) => {
    debug.setOverrides({ [key]: value });
  };

  if (!isOpen || !isDebugMode()) return null;

  return (
    <div className="debug-panel fixed right-0 top-0 h-full w-80 bg-gray-900 text-white overflow-y-auto z-50">
      <div className="p-4 border-b border-gray-700 flex justify-between">
        <h3 className="font-bold">🎛️ Signatur DevUI</h3>
        <button onClick={onClose}>✕</button>
      </div>

      {/* Schicht 0: Data Input */}
      <Section title="📊 Data Foundation (Schicht 0)">
        {DIMENSIONS.map(dim => (
          <SliderGroup
            key={dim}
            label={dim}
            natalValue={state?.overrides.natalOverride?.get(dim) ?? 0.5}
            quizValue={state?.overrides.quizOverride?.get(dim) ?? 0.5}
            onChange={(natal, quiz) => {
              const newNatal = new Map(state?.overrides.natalOverride || []);
              const newQuiz = new Map(state?.overrides.quizOverride || []);
              newNatal.set(dim, natal);
              newQuiz.set(dim, quiz);
              updateOverride('natalOverride', newNatal);
              updateOverride('quizOverride', newQuiz);
            }}
          />
        ))}
      </Section>

      {/* Schicht 1: Engine Params */}
      <Section title="⚙️ Core Engine (Schicht 1)">
        <ToggleButton
          label="Force Consonance (d=0)"
          active={state?.overrides.forceConsonance}
          onToggle={(v) => updateOverride('forceConsonance', v)}
        />
        <ToggleButton
          label="Force Dissonance (d=1)"
          active={state?.overrides.forceDissonance}
          onToggle={(v) => updateOverride('forceDissonance', v)}
        />
        <Slider
          label="Global Dissonance Scale"
          min={0} max={2} step={0.1}
          value={state?.overrides.dissonanceScale ?? 1}
          onChange={(v) => updateOverride('dissonanceScale', v)}
        />
      </Section>

      {/* Schicht 2: Trail System */}
      <Section title="🌀 Trail System (Schicht 2)">
        <Slider
          label="Persistence Rate"
          min={0.1} max={0.99} step={0.01}
          value={state?.overrides.persistenceOverride ?? 0.85}
          onChange={(v) => updateOverride('persistenceOverride', v)}
        />
        <Slider
          label="Trail Length (Points)"
          min={100} max={4000} step={100}
          value={state?.overrides.trailLengthOverride ?? 2000}
          onChange={(v) => updateOverride('trailLengthOverride', v)}
        />
      </Section>

      {/* Schicht 3: Renderer */}
      <Section title="🎨 Visual Calibration (Schicht 3)">
        <Slider
          label="Glow Radius Min"
          min={2} max={30} step={1}
          value={state?.overrides.glowRadiusOverride?.[0] ?? 8}
          onChange={(v) => updateOverride('glowRadiusOverride', [v, state?.overrides.glowRadiusOverride?.[1] ?? 20])}
        />
        <Slider
          label="Glow Radius Max"
          min={2} max={30} step={1}
          value={state?.overrides.glowRadiusOverride?.[1] ?? 20}
          onChange={(v) => updateOverride('glowRadiusOverride', [state?.overrides.glowRadiusOverride?.[0] ?? 8, v])}
        />
        <Slider
          label="Fade Alpha"
          min={0.01} max={0.2} step={0.01}
          value={state?.overrides.fadeAlphaOverride ?? 0.05}
          onChange={(v) => updateOverride('fadeAlphaOverride', v)}
        />
        <ToggleButton
          label="Disable Additive Blend"
          active={state?.overrides.disableAdditiveBlend}
          onToggle={(v) => updateOverride('disableAdditiveBlend', v)}
        />
        <ToggleButton
          label="Show Density Field"
          active={state?.overrides.showDensityField}
          onToggle={(v) => updateOverride('showDensityField', v)}
        />
      </Section>

      {/* Schicht 4: Time Controls */}
      <Section title="⏱️ Time & Animation">
        <ToggleButton
          label="⏸️ Freeze Time"
          active={state?.overrides.timeFreeze}
          onToggle={(v) => updateOverride('timeFreeze', v)}
        />
        <Slider
          label="Time Scrub (sec)"
          min={0} max={60} step={0.1}
          value={state?.overrides.timeScrub ?? 0}
          onChange={(v) => updateOverride('timeScrub', v)}
        />
        <Slider
          label="Time Speed"
          min={0.1} max={10} step={0.1}
          value={state?.overrides.timeSpeed ?? 1}
          onChange={(v) => updateOverride('timeSpeed', v)}
        />
      </Section>

      {/* Cosmic Weather */}
      <Section title="🌌 Cosmic Weather">
        <Slider
          label="Solar Storm Intensity"
          min={0} max={1} step={0.05}
          value={state?.overrides.solarStormOverride ?? 0}
          onChange={(v) => updateOverride('solarStormOverride', v)}
        />
        <Slider
          label="Kp-Index (0-9)"
          min={0} max={9} step={1}
          value={state?.overrides.kpIndexOverride ?? 0}
          onChange={(v) => updateOverride('kpIndexOverride', v)}
        />
        <ToggleButton
          label="Space Weather Modulation"
          active={state?.overrides.spaceWeatherModulation}
          onToggle={(v) => updateOverride('spaceWeatherModulation', v)}
        />
      </Section>

      {/* State Inspector */}
      {state?.poleStates && (
        <Section title="📈 Pole State Inspector">
          <div className="text-xs font-mono space-y-1">
            {state.poleStates.map((pole, i) => (
              <div key={i} className="flex justify-between">
                <span>{pole.dimensionId}{pole.pole}</span>
                <span>r={pole.radius.toFixed(2)}</span>
                <span>d={pole.dissonance.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded"
          onClick={() => debug.reset()}
        >
          🔄 Reset All Overrides
        </button>
        <button
          className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded"
          onClick={() => {
            const json = JSON.stringify(debug.getOverrides(), null, 2);
            navigator.clipboard.writeText(json);
            alert('Overrides copied to clipboard');
          }}
        >
          📋 Export Current State
        </button>
        <button
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded"
          onClick={() => {
            // Preset: "High Dissonance Test"
            debug.setOverrides({
              forceDissonance: true,
              persistenceOverride: 0.9,
              glowRadiusOverride: [15, 25]
            });
          }}
        >
          🧪 Load Preset: High Dissonance
        </button>

        {/* Preset-Auswahl */}
        <div className="pt-2">
          <label className="text-xs text-gray-400">Presets:</label>
          <select
            className="w-full bg-gray-800 rounded px-2 py-1 text-sm mt-1"
            onChange={(e) => {
              const preset = DEBUG_PRESETS[e.target.value as keyof typeof DEBUG_PRESETS];
              if (preset) debug.setOverrides(preset);
            }}
          >
            <option value="">-- Select Preset --</option>
            <option value="input-variation-test">Input Variation Test</option>
            <option value="time-continuity-test">Time Continuity Test</option>
            <option value="determinism-test">Determinism Test</option>
            <option value="calibration-max-contrast">Calibration (Max Contrast)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Helper Components (Section, Slider, ToggleButton, SliderGroup)
// ... (wie in signature-devUI/Qwen_tsx_20260403_bgsmd5yzi.tsx)
```

---

### Phase 5: Test Data Generators

**Ziel:** Reproduzierbare Testdaten für alle Input-Typen.

**Datei:** `src/debug/test-data-generators.ts`

```typescript
// src/debug/test-data-generators.ts

import { DIMENSION_DEFS } from '@/packages/shared/src/signatur/dimension-defs';

/** Generiert zufällige Natal Weights (6 Dimensionen) */
export function generateRandomNatal(seed?: number): Map<string, number> {
  const weights = new Map<string, number>();
  DIMENSION_DEFS.forEach(dim => {
    const value = seed !== undefined
      ? (Math.sin(seed * dim.name.length) + 1) / 2  // Deterministisch
      : Math.random();
    weights.set(dim.name, value);
  });
  return weights;
}

/** Generiert Quiz Results mit extremen Werten (für Dissonanz-Tests) */
export function generateExtremeQuiz(mode: 'aligned' | 'opposite' | 'random'): Map<string, number> {
  const weights = new Map<string, number>();

  if (mode === 'aligned') {
    // Gleiche Werte wie Natal (Konsonanz)
    DIMENSION_DEFS.forEach(dim => {
      weights.set(dim.name, 0.5 + Math.random() * 0.4); // 0.5-0.9
    });
  } else if (mode === 'opposite') {
    // Opposite Werte (maximale Dissonanz)
    DIMENSION_DEFS.forEach(dim => {
      weights.set(dim.name, Math.random() * 0.2); // 0.0-0.2
    });
  } else {
    // Zufällig
    DIMENSION_DEFS.forEach(dim => {
      weights.set(dim.name, Math.random());
    });
  }

  return weights;
}

/** Generiert Soulprint Sectors (12 Sektoren) */
export function generateSoulprintSectors(pattern: 'smooth' | 'peaked' | 'random'): number[] {
  const sectors = new Array(12).fill(0);

  if (pattern === 'smooth') {
    // Sanfte Welle (wie Sinus)
    for (let i = 0; i < 12; i++) {
      sectors[i] = 0.5 + 0.3 * Math.sin((i / 12) * Math.PI * 2);
    }
  } else if (pattern === 'peaked') {
    // Einzelner Peak (z.B. Sektor 4 = Leo/Sun)
    sectors[4] = 0.95;
    for (let i = 0; i < 12; i++) {
      if (i !== 4) {
        sectors[i] = 0.3 + Math.random() * 0.2;
      }
    }
  } else {
    // Vollständig zufällig
    for (let i = 0; i < 12; i++) {
      sectors[i] = Math.random();
    }
  }

  return sectors;
}

/** Generiert Contribution Events (für Cluster-Testing) */
export function generateContributionEvent(
  moduleId: string,
  clusterId: string,
  intensity: 'low' | 'medium' | 'high'
): { moduleId: string; markers: number[] } {
  const markerCount = intensity === 'high' ? 12 : intensity === 'medium' ? 6 : 2;
  const markers = Array.from({ length: markerCount }, (_, i) => Math.random());

  return { moduleId, markers };
}

/** Simuliert Cosmic Weather (Kp-Index, Solar Storm) */
export function generateCosmicWeather(
  condition: 'quiet' | 'storm' | 'extreme'
): { kpIndex: number; solarStorm: number } {
  switch (condition) {
    case 'quiet':
      return { kpIndex: 2, solarStorm: 0.1 };
    case 'storm':
      return { kpIndex: 6, solarStorm: 0.6 };
    case 'extreme':
      return { kpIndex: 9, solarStorm: 1.0 };
    default:
      return { kpIndex: 3, solarStorm: 0.2 };
  }
}

/** Erstellt vollständiges Test-Scenario */
export function createTestScenario(scenario: string): {
  natal: Map<string, number>;
  quiz: Map<string, number>;
  soulprint: number[];
  cosmic: { kpIndex: number; solarStorm: number };
} {
  switch (scenario) {
    case 'perfect-harmony':
      return {
        natal: new Map([
          ['assertion', 0.7], ['empathy', 0.5], ['creativity', 0.8],
          ['logic', 0.6], ['intuition', 0.7], ['discipline', 0.5]
        ]),
        quiz: new Map([
          ['assertion', 0.7], ['empathy', 0.5], ['creativity', 0.8],
          ['logic', 0.6], ['intuition', 0.7], ['discipline', 0.5]
        ]),
        soulprint: generateSoulprintSectors('smooth'),
        cosmic: generateCosmicWeather('quiet'),
      };

    case 'maximum-tension':
      return {
        natal: new Map([
          ['assertion', 0.9], ['empathy', 0.2], ['creativity', 0.9],
          ['logic', 0.3], ['intuition', 0.8], ['discipline', 0.2]
        ]),
        quiz: new Map([
          ['assertion', 0.1], ['empathy', 0.9], ['creativity', 0.1],
          ['logic', 0.8], ['intuition', 0.1], ['discipline', 0.9]
        ]),
        soulprint: generateSoulprintSectors('peaked'),
        cosmic: generateCosmicWeather('extreme'),
      };

    case 'random-user':
      return {
        natal: generateRandomNatal(),
        quiz: generateExtremeQuiz('random'),
        soulprint: generateSoulprintSectors('random'),
        cosmic: generateCosmicWeather('quiet'),
      };

    default:
      return createTestScenario('random-user');
  }
}
```

---

### Phase 6: Preset-System

**Ziel:** Reproduzierbare Test-Konfigurationen für häufige Debug-Szenarien.

**Datei:** `src/debug/presets.ts`

```typescript
// src/debug/presets.ts

import { DebugOverrides } from './types';

export const DEBUG_PRESETS: Record<string, DebugOverrides> = {
  // ─── Input-Variation ───────────────────────────────────────
  'input-variation-test': {
    natalOverride: new Map([
      ['assertion', 0.95], ['empathy', 0.05], ['creativity', 0.8],
      ['logic', 0.2], ['intuition', 0.7], ['discipline', 0.3]
    ]),
    quizOverride: new Map([
      ['assertion', 0.05], ['empathy', 0.95], ['creativity', 0.2],
      ['logic', 0.8], ['intuition', 0.3], ['discipline', 0.7]
    ]),
    forceDissonance: true,
    persistenceOverride: 0.95,
    timeFreeze: false,
  },

  // ─── Zeit-Kontinuität ──────────────────────────────────────
  'time-continuity-test': {
    timeScrub: 0,
    timeSpeed: 0.1, // Langsam für Beobachtung
    trailLengthOverride: 500, // Kurz für schnellen Reset-Test
    persistenceOverride: 0.9,
  },

  // ─── Determinismus ─────────────────────────────────────────
  'determinism-test': {
    forceConsonance: true,
    glowRadiusOverride: [8, 8], // Konstant für klare Form
    disableAdditiveBlend: true, // Keine Überlagerungs-Effekte
    timeFreeze: true,
  },

  // ─── Design-Kalibrierung ───────────────────────────────────
  'calibration-max-contrast': {
    persistenceOverride: 0.99,
    fadeAlphaOverride: 0.02,
    glowRadiusOverride: [20, 30],
    showDensityField: true,
  },

  // ─── High Dissonance ───────────────────────────────────────
  'high-dissonance': {
    forceDissonance: true,
    persistenceOverride: 0.9,
    glowRadiusOverride: [15, 25],
    timeSpeed: 0.5,
  },

  // ─── Trail-Persistenz ──────────────────────────────────────
  'trail-endurance': {
    persistenceOverride: 0.99,
    trailLengthOverride: 4000,
    fadeAlphaOverride: 0.01,
  },

  // ─── Cosmic Storm ──────────────────────────────────────────
  'cosmic-storm': {
    kpIndexOverride: 9,
    solarStormOverride: 1.0,
    spaceWeatherModulation: true,
    glowRadiusOverride: [25, 35],
    showDensityField: true,
  },

  // ─── Production-Simulation ─────────────────────────────────
  'production-like': {
    // Keine Overrides — simuliert Production-Verhalten
  },
};
```

---

### Phase 7: Build-Flag Integration (Production-Safety)

**Ziel:** Debug-Code wird in Production-Builds vollständig entfernt.

**Vite-Konfiguration:**

```typescript
// vite.config.ts

import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    rollupOptions: {
      // Tree-shaking für Debug-Imports
      output: {
        manualChunks: {
          // Debug-Code nur in Development
          debug: process.env.NODE_ENV === 'development'
            ? ['src/debug/debug-injection.ts', 'src/debug/DebugPanel.tsx']
            : undefined,
        },
      },
    },
  },
});
```

**Conditional Import in App.tsx:**

```typescript
// src/App.tsx oder FuRingPage.tsx

import { useState, useEffect } from 'react';

// Lazy-load DebugPanel nur im Development
let DebugPanel: React.ComponentType<{ isOpen: boolean; onClose: () => void }> | null = null;

if (process.env.NODE_ENV === 'development') {
  import('./debug/DebugPanel').then(({ DebugPanel: Panel }) => {
    DebugPanel = Panel;
  });
}

export function FuRingPage() {
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Hotkey: Strg+D (oder Cmd+D auf Mac)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setShowDebugPanel(prev => !prev);
      }
    };

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, []);

  return (
    <>
      {/* Bestehender Signatur-Code */}
      <FusionRingCanvasV2 {...props} />

      {/* Debug Panel (nur Dev) */}
      {process.env.NODE_ENV === 'development' && DebugPanel && (
        <DebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />
      )}
    </>
  );
}
```

---

## Test-Szenarien

### Szenario 1: Input-Variation (Natal vs. Quiz)

**Ziel:** Prüfen, ob Dissonanz korrekt berechnet wird.

```typescript
// Browser Console (Dev-Build):
debug = DebugInjection.getInstance();

// Test 1: Gleiche Werte (Konsonanz)
debug.setOverrides({
  natalOverride: new Map([
    ['assertion', 0.7], ['empathy', 0.5], ['creativity', 0.8],
    ['logic', 0.6], ['intuition', 0.7], ['discipline', 0.5]
  ]),
  quizOverride: new Map([
    ['assertion', 0.7], ['empathy', 0.5], ['creativity', 0.8],
    ['logic', 0.6], ['intuition', 0.7], ['discipline', 0.5]
  ]),
});
// → Erwartung: Ruhiges, harmonisches Muster (nahezu kreisförmig)

// Test 2: Opposite Werte (maximale Dissonanz)
debug.setOverrides({
  natalOverride: new Map([
    ['assertion', 0.9], ['empathy', 0.1], ['creativity', 0.9],
    ['logic', 0.1], ['intuition', 0.9], ['discipline', 0.1]
  ]),
  quizOverride: new Map([
    ['assertion', 0.1], ['empathy', 0.9], ['creativity', 0.1],
    ['logic', 0.9], ['intuition', 0.1], ['discipline', 0.9]
  ]),
  forceDissonance: true,
});
// → Erwartung: Starke Kreuzungen, chaotische Bewegung
```

### Szenario 2: Zeit-Kontinuität

**Ziel:** Prüfen, ob Trails kontinuierlich sind (kein Springen).

```typescript
debug.setOverrides({
  timeFreeze: true,
  timeScrub: 0,
  trailLengthOverride: 200,
  persistenceOverride: 0.95,
});

// Dann manuell vorwärts bewegen:
debug.setOverrides({ timeScrub: 0.1 });
debug.setOverrides({ timeScrub: 0.2 });
debug.setOverrides({ timeScrub: 0.3 });
// → Erwartung: Poles bewegen sich glatt, keine Sprünge
```

### Szenario 3: Density Field Emergence

**Ziel:** Emergente Verdichtungen sichtbar machen.

```typescript
debug.setOverrides({
  showDensityField: true,
  densityThreshold: 0.6,
  persistenceOverride: 0.99,
  trailLengthOverride: 4000,
  timeSpeed: 2.0,
});
// → 1-2 Minuten laufen lassen, dann Heatmap beobachten
// → Erwartung: Verdichtungen an Polen mit hoher Dissonanz
```

### Szenario 4: Cosmic Weather Modulation

**Ziel:** Space Weather-Effekte auf Ring testen.

```typescript
debug.setOverrides({
  kpIndexOverride: 8,
  solarStormOverride: 0.9,
  spaceWeatherModulation: true,
  glowRadiusOverride: [20, 30],
});
// → Erwartung: Ring intensiviert sich, Partikel werden größer/heller
```

---

## Definition of Done

- [ ] `DebugInjection` Singleton implementiert und typsicher
- [ ] `bipolar-engine.ts` integriert Debug-Overrides (alle Schichten)
- [ ] `FusionRingCanvasV2.tsx` integriert Renderer-Overrides
- [ ] `DebugPanel.tsx` UI-Komponente vollständig funktionsfähig
- [ ] `test-data-generators.ts` erstellt reproduzierbare Testdaten
- [ ] `presets.ts` definiert 6+ Standard-Test-Szenarien
- [ ] Build-Flag Integration (Debug-Code nur in Dev-Builds)
- [ ] Hotkey (Strg+D / Cmd+D) öffnet/schließt Debug Panel
- [ ] Density Field Overlay funktioniert on-demand
- [ ] Pole State Inspector zeigt aktuelle Werte numerisch an
- [ ] Export/Import von Overrides funktioniert (Clipboard)
- [ ] Alle 4 Test-Szenarien manuell verifiziert
- [ ] Production-Build enthält keinen Debug-Code (Bundle-Größe prüfen)

---

## Risiken & Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|--------|------------|---------------|
| Debug-Code landet in Production | Security, Performance | Build-Flag (`NODE_ENV`), Tree-shaking, Bundle-Size-Check |
| Debug Panel stört UX | User verwirrt | Nur mit Hotkey zugänglich, kein UI-Button in Production |
| Performance-Overhead (Density Field) | FPS-Drops | Density Field nur on-demand, nicht im Render-Loop |
| TypeScript-Interfaces veralten | Type-Safety bricht | Interfaces zentral in `types.ts`, alle Overrides typisiert |
| DebugInjection wird missbraucht | Unerwartetes Verhalten | Singleton mit Subscriber-Pattern, keine globalen Variablen |

---

## Ausblick: Erweiterungsmöglichkeiten

1. **Recording & Playback:** State-Sequenzen aufnehmen und abspielen (für Regression-Tests)
2. **Split-View:** Zwei Konfigurationen nebeneinander vergleichen (A/B-Testing)
3. **Automated Tests:** Playwright-Tests mit DebugInjection-Steuerung
4. **Metrics Dashboard:** FPS, Partikel-Count, Dissonanz-Durchschnitt in Echtzeit
5. **Remote-Debug:** Debug Panel über Netzwerk zugänglich (für Team-Debugging)

---

*Bazodiac · DYAI2025 · Confidential*
