import { useState } from 'react';
import type { DissonanceResult } from '@/src/lib/dissonance/dissonance';

interface DissonanceValuesProps {
  dissonance: DissonanceResult;
}

function GaugeBar({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">{label}</span>
        {sublabel && (
          <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">{sublabel}</span>
        )}
        <span className="text-xs font-mono text-white/70">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#D4AF37]/70 transition-all duration-700"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

/**
 * Premium-only dissonance value display panel.
 * Controlled by local "Sichtbare Werte" toggle (off by default).
 */
export function DissonanceValues({ dissonance }: DissonanceValuesProps) {
  const [visible, setVisible] = useState(false);

  const elementalLabel =
    dissonance.d_elemental.type === 'ke'
      ? 'Ke'
      : dissonance.d_elemental.type === 'sheng'
        ? 'Sheng'
        : undefined;

  const intensityPct = Math.round(dissonance.intensity * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-4">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/70">
          Sichtbare Werte
        </span>
        <button
          onClick={() => setVisible(v => !v)}
          role="switch"
          aria-checked={visible}
          className={`relative h-5 w-9 rounded-full border transition-colors duration-200 ${
            visible
              ? 'border-[#D4AF37]/50 bg-[#D4AF37]/25'
              : 'border-white/15 bg-white/5'
          }`}
          aria-label="Dissonanzwerte anzeigen"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white/80 transition-transform duration-200 ${
              visible ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {visible && (
        <div className="space-y-3" data-testid="dissonance-gauges">
          <GaugeBar value={dissonance.d_natal} label="Natal" />
          <GaugeBar value={dissonance.d_accumulated} label="Akkumuliert" />
          <GaugeBar
            value={dissonance.d_elemental.magnitude}
            label="Elemental"
            sublabel={elementalLabel}
          />

          {/* Combined intensity */}
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Gesamtintensität
              </span>
              <span className="font-mono text-sm text-[#D4AF37]">{intensityPct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
