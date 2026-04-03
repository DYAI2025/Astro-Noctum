/**
 * Signatur DevUI — Debug Panel
 * 
 * React-basiertes Control Panel für alle Debug-Overrides.
 * Zugriff via Hotkey (Strg+D / Cmd+D) im Development-Modus.
 * 
 * Schichten-Modell:
 *   0: Data Foundation (Natal, Quiz, Soulprint)
 *   1: Core Engine (Dissonanz)
 *   2: Trail System (Persistenz, Länge)
 *   3: Renderer (Glow, Fade, Blend, Density)
 *   4: Time Controls (Freeze, Scrub, Speed)
 */

import { useState, useEffect, useCallback } from 'react';
import { DebugInjection, isDebugMode } from './debug-injection';
import type { DebugOverrides, DebugState } from './types';
import { DEBUG_PRESETS } from './presets';

const DIMENSIONS = ['assertion', 'empathy', 'creativity', 'logic', 'intuition', 'discipline'];

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [state, setState] = useState<DebugState | null>(null);
  const debug = DebugInjection.getInstance();

  // Sync mit DebugInjection
  useEffect(() => {
    if (!isDebugMode()) return;
    return debug.subscribe(setState);
  }, []);

  const updateOverride = useCallback((key: keyof DebugOverrides, value: unknown) => {
    debug.setOverrides({ [key]: value });
  }, []);

  const handleReset = useCallback(() => {
    debug.reset();
  }, []);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(debug.getOverrides(), null, 2);
    navigator.clipboard.writeText(json);
    alert('Debug Overrides in Clipboard kopiert');
  }, []);

  const handlePreset = useCallback((presetName: string) => {
    if (!presetName) return;
    const preset = DEBUG_PRESETS[presetName as keyof typeof DEBUG_PRESETS];
    if (preset) {
      debug.setOverrides(preset);
    }
  }, []);

  if (!isOpen || !isDebugMode()) return null;

  return (
    <div className="debug-panel fixed right-0 top-0 h-full w-80 bg-gray-900 text-white overflow-y-auto z-50 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <div>
          <h3 className="font-bold text-lg">🎛️ Signatur DevUI</h3>
          <p className="text-xs text-gray-400 mt-1">Debug Controls für Signatur V3</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-xl"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Schicht 0: Data Foundation */}
      <Section title="📊 Data Foundation (Schicht 0)">
        {DIMENSIONS.map(dim => (
          <SliderGroup
            key={dim}
            label={capitalize(dim)}
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

      {/* Schicht 1: Core Engine */}
      <Section title="⚙️ Core Engine (Schicht 1)">
        <ToggleButton
          label="Force Consonance (d=0)"
          description="Alle Dissonanzen auf 0 — harmonisches Muster"
          active={state?.overrides.forceConsonance}
          onToggle={(v) => updateOverride('forceConsonance', v)}
        />
        <ToggleButton
          label="Force Dissonance (d=1)"
          description="Alle Dissonanzen auf 1 — maximale Spannung"
          active={state?.overrides.forceDissonance}
          onToggle={(v) => updateOverride('forceDissonance', v)}
        />
        <Slider
          label="Dissonance Scale"
          min={0} max={2} step={0.1}
          value={state?.overrides.dissonanceScale ?? 1}
          onChange={(v) => updateOverride('dissonanceScale', v)}
          formatValue={(v) => v.toFixed(1)}
        />
      </Section>

      {/* Schicht 2: Trail System */}
      <Section title="🌀 Trail System (Schicht 2)">
        <Slider
          label="Persistence Rate"
          min={0.1} max={0.99} step={0.01}
          value={state?.overrides.persistenceOverride ?? 0.85}
          onChange={(v) => updateOverride('persistenceOverride', v)}
          formatValue={(v) => v.toFixed(2)}
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
          formatValue={(v) => v.toFixed(2)}
        />
        <ToggleButton
          label="Disable Additive Blend"
          description="Normal Blending statt Additive — für Farb-Debugging"
          active={state?.overrides.disableAdditiveBlend}
          onToggle={(v) => updateOverride('disableAdditiveBlend', v)}
        />
        <ToggleButton
          label="Show Density Field"
          description="Heatmap-Overlay für Emergence-Analyse"
          active={state?.overrides.showDensityField}
          onToggle={(v) => updateOverride('showDensityField', v)}
        />
        {state?.overrides.showDensityField && (
          <Slider
            label="Density Threshold"
            min={0.1} max={0.9} step={0.1}
            value={state?.overrides.densityThreshold ?? 0.7}
            onChange={(v) => updateOverride('densityThreshold', v)}
            formatValue={(v) => v.toFixed(1)}
          />
        )}
      </Section>

      {/* Schicht 4: Time Controls */}
      <Section title="⏱️ Time & Animation">
        <ToggleButton
          label="⏸️ Freeze Time"
          description="Animation anhalten"
          active={state?.overrides.timeFreeze}
          onToggle={(v) => updateOverride('timeFreeze', v)}
        />
        <Slider
          label="Time Scrub (sec)"
          min={0} max={60} step={0.1}
          value={state?.overrides.timeScrub ?? 0}
          onChange={(v) => updateOverride('timeScrub', v)}
          formatValue={(v) => v.toFixed(1)}
        />
        <Slider
          label="Time Speed"
          min={0.1} max={10} step={0.1}
          value={state?.overrides.timeSpeed ?? 1}
          onChange={(v) => updateOverride('timeSpeed', v)}
          formatValue={(v) => v.toFixed(1)}
        />
      </Section>

      {/* Cosmic Weather */}
      <Section title="🌌 Cosmic Weather">
        <Slider
          label="Solar Storm Intensity"
          min={0} max={1} step={0.05}
          value={state?.overrides.solarStormOverride ?? 0}
          onChange={(v) => updateOverride('solarStormOverride', v)}
          formatValue={(v) => v.toFixed(2)}
        />
        <Slider
          label="Kp-Index (0-9)"
          min={0} max={9} step={1}
          value={state?.overrides.kpIndexOverride ?? 0}
          onChange={(v) => updateOverride('kpIndexOverride', v)}
        />
        <ToggleButton
          label="Space Weather Modulation"
          description="Ring-Modulation durch Space Weather"
          active={state?.overrides.spaceWeatherModulation}
          onToggle={(v) => updateOverride('spaceWeatherModulation', v)}
        />
      </Section>

      {/* State Inspector */}
      {state?.poleStates && state.poleStates.length > 0 && (
        <Section title="📈 Pole State Inspector">
          <div className="text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
            {state.poleStates.map((pole, i) => (
              <div key={`${pole.dimensionId}-${pole.pole}`} className="flex justify-between items-center py-1 border-b border-gray-800">
                <span className="text-gray-300">
                  {pole.dimensionId === 'assertion' && '🔴'}
                  {pole.dimensionId === 'empathy' && '🔵'}
                  {pole.dimensionId === 'creativity' && '🟡'}
                  {pole.dimensionId === 'logic' && '🟢'}
                  {pole.dimensionId === 'intuition' && '🟣'}
                  {pole.dimensionId === 'discipline' && '🟤'}
                  {' '}{pole.dimensionId}{pole.pole}
                </span>
                <span className="text-gray-500">r={pole.radius.toFixed(1)}</span>
                <span className="text-gray-500">d={pole.dissonance.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-700 space-y-3 bg-gray-800">
        {/* Preset-Auswahl */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Quick Presets:</label>
          <select
            className="w-full bg-gray-700 hover:bg-gray-600 rounded px-3 py-2 text-sm transition-colors"
            onChange={(e) => handlePreset(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>-- Select Preset --</option>
            <option value="input-variation-test">Input Variation Test</option>
            <option value="time-continuity-test">Time Continuity Test</option>
            <option value="determinism-test">Determinism Test</option>
            <option value="calibration-max-contrast">Calibration (Max Contrast)</option>
            <option value="high-dissonance">High Dissonance</option>
            <option value="trail-endurance">Trail Endurance</option>
            <option value="cosmic-storm">Cosmic Storm</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-red-600 hover:bg-red-700 py-2 px-3 rounded text-sm font-medium transition-colors"
            onClick={handleReset}
          >
            🔄 Reset All
          </button>
          <button
            className="bg-gray-600 hover:bg-gray-500 py-2 px-3 rounded text-sm font-medium transition-colors"
            onClick={handleExport}
          >
            📋 Export
          </button>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-700">
          <button
            className="w-full bg-green-600 hover:bg-green-700 py-2 px-3 rounded text-sm font-medium transition-colors mb-2"
            onClick={() => {
              debug.setOverrides({
                forceDissonance: true,
                persistenceOverride: 0.9,
                glowRadiusOverride: [15, 25] as [number, number],
              });
            }}
          >
            🧪 High Dissonance Test
          </button>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded text-sm font-medium transition-colors"
            onClick={() => {
              debug.setOverrides({
                showDensityField: true,
                persistenceOverride: 0.99,
                fadeAlphaOverride: 0.02,
                glowRadiusOverride: [20, 30] as [number, number],
              });
            }}
          >
            🔥 Show Density Field
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 text-center text-xs text-gray-500 bg-gray-800">
        <p>Hotkey: <kbd className="bg-gray-700 px-2 py-0.5 rounded">Strg+D</kbd> / <kbd className="bg-gray-700 px-2 py-0.5 rounded">Cmd+D</kbd></p>
        <p className="mt-1">Nur im Development-Modus aktiv</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-800">
      <h4 className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 bg-gray-800/50">
        {title}
      </h4>
      <div className="px-4 py-3 space-y-3">
        {children}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400 font-mono">
          {formatValue ? formatValue(value) : typeof value === 'number' ? value.toFixed(2) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

function ToggleButton({
  label,
  description,
  active,
  onToggle,
}: {
  label: string;
  description?: string;
  active: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
        active
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      }`}
      onClick={() => onToggle(!active)}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{active ? '✓' : '○'}</span>
        <span className="font-medium">{label}</span>
      </div>
      {description && (
        <p className="text-xs text-gray-400 mt-1 ml-6">{description}</p>
      )}
    </button>
  );
}

function SliderGroup({
  label,
  natalValue,
  quizValue,
  onChange,
}: {
  label: string;
  natalValue: number;
  quizValue: number;
  onChange: (natal: number, quiz: number) => void;
}) {
  return (
    <div className="space-y-2 p-2 bg-gray-800/50 rounded-lg">
      <div className="text-xs font-medium text-gray-300">{label}</div>
      
      {/* Natal Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-blue-400">Natal</span>
          <span className="text-gray-500 font-mono">{natalValue.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={natalValue}
          onChange={(e) => onChange(parseFloat(e.target.value), quizValue)}
          className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Quiz Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-purple-400">Quiz</span>
          <span className="text-gray-500 font-mono">{quizValue.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={quizValue}
          onChange={(e) => onChange(natalValue, parseFloat(e.target.value))}
          className="w-full accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
