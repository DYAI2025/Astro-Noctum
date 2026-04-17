import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PLANET_FREQUENCIES, ELEMENT_COLORS } from '@/src/lib/cymatics/bazi-to-chladni';
import type { WuxingElement } from '@/src/lib/cymatics/bazi-to-chladni';

interface CymaticsFrequencyPanelProps {
  /** Wu-Xing element weights from apiData.wuxing.elements */
  wuxingWeights: Record<string, number>;
  /** Dominant element — used to highlight matching planets */
  dominantElement: WuxingElement;
  planetariumMode?: boolean;
  className?: string;
}

export function CymaticsFrequencyPanel({
  wuxingWeights,
  dominantElement,
  planetariumMode = true,
  className,
}: CymaticsFrequencyPanelProps) {
  const [open, setOpen] = useState(false);
  const dark = planetariumMode;

  return (
    <section
      className={`rounded-2xl border overflow-hidden ${
        dark ? 'border-white/8 bg-black/30' : 'border-slate-200 bg-white/60'
      } ${className ?? ''}`}
      data-testid="cymatics-frequency-panel"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
          dark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
        }`}
        aria-expanded={open}
      >
        <div>
          <p className={`text-xs uppercase tracking-[0.2em] font-medium ${dark ? 'text-white/70' : 'text-slate-600'}`}>
            Planetare Frequenzen
          </p>
          <p className={`text-[10px] mt-0.5 ${dark ? 'text-white/35' : 'text-slate-400'}`}>
            Hans Cousto · Kosmische Oktave · 1978
          </p>
        </div>
        {open
          ? <ChevronUp className={`h-4 w-4 shrink-0 ${dark ? 'text-white/40' : 'text-slate-400'}`} />
          : <ChevronDown className={`h-4 w-4 shrink-0 ${dark ? 'text-white/40' : 'text-slate-400'}`} />
        }
      </button>

      {open && (
        <div
          className={`border-t divide-y ${
            dark ? 'border-white/5 divide-white/5' : 'border-slate-100 divide-slate-100'
          }`}
        >
          {PLANET_FREQUENCIES.map(planet => {
            const elementWeight = wuxingWeights[planet.wuxing_element] ?? 0;
            const isDominantEl = planet.wuxing_element === dominantElement;
            const pct = Math.round(elementWeight * 100);
            const elementColor = ELEMENT_COLORS[planet.wuxing_element as WuxingElement] ?? planet.color;

            return (
              <div
                key={planet.name}
                className={`flex items-center gap-3 px-4 py-2.5 ${
                  isDominantEl ? (dark ? 'bg-white/[0.03]' : 'bg-slate-50/80') : ''
                }`}
                data-element={planet.wuxing_element}
              >
                <span
                  className="w-5 shrink-0 text-center text-lg leading-none"
                  style={{ color: planet.color }}
                  aria-hidden="true"
                >
                  {planet.symbol}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xs font-medium ${dark ? 'text-white/85' : 'text-slate-700'}`}>
                      {planet.name_de}
                    </span>
                    {isDominantEl && (
                      <span
                        className="rounded px-1 py-px text-[9px] uppercase tracking-wider font-mono"
                        style={{ background: planet.color + '25', color: planet.color }}
                      >
                        dominant
                      </span>
                    )}
                  </div>
                  <p className={`mt-0.5 text-[10px] leading-tight ${dark ? 'text-white/35' : 'text-slate-400'}`}>
                    {planet.archetype_de}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <div
                    className={`text-[10px] font-mono ${dark ? 'text-white/50' : 'text-slate-500'}`}
                    title="Planetenorbitperiode in hörbare Frequenz oktaviert (Cousto 1978)"
                  >
                    {planet.hz.toFixed(2)} Hz
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div
                      className={`h-1 w-16 overflow-hidden rounded-full ${dark ? 'bg-white/8' : 'bg-slate-200'}`}
                      title={`Wu-Xing ${planet.wuxing_element}: ${pct}% Gewicht in deinem Geburtsmoment`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${elementColor}66, ${elementColor})`,
                        }}
                      />
                    </div>
                    <span
                      className="w-7 text-right text-[10px] font-mono"
                      style={{ color: elementColor + 'aa' }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Explanatory footer — satisfies CON-no-unexplained-numbers for Hz and % values */}
          <div className={`px-4 py-2.5 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/60'}`}>
            <p className={`text-[9px] leading-relaxed ${dark ? 'text-white/25' : 'text-slate-400'}`}>
              Hz = Orbitperiode in hörbare Frequenz oktaviert · Balken = Wu-Xing-Gewicht deines Geburtsmoments
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
