/**
 * Space Weather Panel — scientific/factual NASA data display.
 *
 * Shows current Kp index, X-ray flux, proton flux, G-scale,
 * solar cycle phase, and personal resonance profile.
 * All data sourced from NOAA SWPC + NASA DONKI via server proxy.
 */

import { Activity, Zap, Radio, Sun, Waves, ShieldAlert } from 'lucide-react';
import type { ResonanceProfile } from '../../lib/space-weather/cosmic-resonance';

interface SpaceWeatherPanelProps {
  kpIndex: number;
  gScale: string;
  xrayFlux: number | null;
  xrayClass: string | null;
  protonFlux: number | null;
  f107: number | null;
  solarCyclePhase: string | null;
  ringModulation: number;
  solarPressure: number;
  events: { type: string; description?: string }[];
  alerts: string[];
  resonance: ResonanceProfile | null;
  lastUpdate: string | null;
}

const KP_COLORS = [
  'text-emerald-400', 'text-emerald-400', 'text-emerald-300', 'text-yellow-300',
  'text-yellow-400', 'text-orange-400', 'text-orange-500', 'text-red-400',
  'text-red-500', 'text-red-600',
];

const RESONANCE_LABELS: Record<string, { de: string; color: string }> = {
  absorptiv: { de: 'Absorptiv', color: 'text-blue-400' },
  reaktiv: { de: 'Reaktiv', color: 'text-orange-400' },
  distributiv: { de: 'Distributiv', color: 'text-cyan-400' },
  resistiv: { de: 'Resistiv', color: 'text-emerald-400' },
};

function GaugeBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="uppercase tracking-[0.15em] text-white/50">{label}</span>
        <span className="font-mono text-white/70">{value.toFixed(value < 10 ? 1 : 0)}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SpaceWeatherPanel({
  kpIndex, gScale, xrayFlux, xrayClass, protonFlux, f107,
  solarCyclePhase, ringModulation, solarPressure, events, alerts,
  resonance, lastUpdate,
}: SpaceWeatherPanelProps) {
  const kpColor = KP_COLORS[Math.min(9, Math.round(kpIndex))] ?? 'text-white/60';
  const resonanceInfo = resonance ? RESONANCE_LABELS[resonance.resonanceType] : null;

  return (
    <aside className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/40 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Kosmisches Wetter
          </span>
        </div>
        <span className="text-[9px] font-mono text-white/30">
          NASA / NOAA
        </span>
      </div>

      {/* Kp Index — hero metric */}
      <div className="flex items-end gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">Kp-Index</div>
          <div className={`font-mono text-3xl font-bold ${kpColor}`}>
            {kpIndex.toFixed(1)}
          </div>
        </div>
        <div className="mb-1 flex flex-col items-end gap-0.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
            kpIndex >= 5 ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 bg-white/5 text-white/50'
          }`}>
            {gScale}
          </span>
          {kpIndex >= 5 && (
            <span className="text-[9px] text-orange-400/70">
              {kpIndex >= 7 ? 'Starker Sturm' : 'Geomagnetisch aktiv'}
            </span>
          )}
        </div>
      </div>

      {/* Gauges */}
      <div className="space-y-2">
        <GaugeBar value={kpIndex} max={9} color="bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" label="Geomagnetisch" />
        {xrayFlux !== null && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 uppercase tracking-[0.15em] text-white/50">
              <Zap className="h-3 w-3" /> Röntgen
            </span>
            <span className="font-mono text-white/70">{xrayClass ?? '—'}</span>
          </div>
        )}
        {protonFlux !== null && (
          <GaugeBar value={Math.log10(Math.max(0.1, protonFlux)) + 1} max={4} color="bg-blue-500/60" label="Proton Flux" />
        )}
        {f107 !== null && (
          <GaugeBar value={f107} max={300} color="bg-amber-500/50" label="F10.7 Solar Flux" />
        )}
      </div>

      {/* Ring Modulation */}
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Waves className="h-3 w-3 text-[#D4AF37]/60" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">Signatur-Modulation</span>
        </div>
        <span className="font-mono text-sm text-[#D4AF37]">
          {((ringModulation - 1) * 100).toFixed(0)}%
        </span>
      </div>

      {/* Personal Resonance */}
      {resonance && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">Deine Resonanz</span>
            {resonanceInfo && (
              <span className={`text-[10px] font-semibold ${resonanceInfo.color}`}>
                {resonanceInfo.de}
              </span>
            )}
          </div>
          <GaugeBar
            value={resonance.globalSensitivity}
            max={1}
            color="bg-gradient-to-r from-[#D4AF37]/40 to-[#D4AF37]"
            label="Empfänglichkeit"
          />
          {/* Top 3 most sensitive dimensions */}
          <div className="space-y-1">
            {Object.entries(resonance.dimensions)
              .sort(([, a], [, b]) => b.sensitivity - a.sensitivity)
              .slice(0, 3)
              .map(([dimId, dim]) => (
                <div key={dimId} className="flex items-center justify-between text-[9px]">
                  <span className="capitalize text-white/40">{dimId}</span>
                  <span className="font-mono text-white/60">{(dim.sensitivity * 100).toFixed(0)}%</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Events */}
      {events.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3 text-orange-400/60" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">Aktive Events</span>
          </div>
          {events.slice(0, 3).map((evt, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-white/60">
              <span className="font-mono text-white/40">{evt.type.replace(/_/g, ' ')}</span>
              {evt.description && <span className="ml-1.5">{evt.description}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1">
          {alerts.slice(0, 2).map((alert, i) => (
            <div key={i} className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-2.5 py-1.5 text-[10px] text-orange-300/80">
              {alert.length > 80 ? alert.slice(0, 80) + '…' : alert}
            </div>
          ))}
        </div>
      )}

      {/* Solar Cycle + Timestamp */}
      <div className="flex items-center justify-between text-[9px] text-white/25">
        {solarCyclePhase && <span>Zyklus: {solarCyclePhase}</span>}
        {lastUpdate && (
          <span className="font-mono">
            {new Date(lastUpdate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </aside>
  );
}
