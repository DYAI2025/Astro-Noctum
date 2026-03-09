import React from 'react';
import { AstroSheetViewModel } from './model';
import { Orbit, Compass, Sparkles } from 'lucide-react';

export function NatalChartCard({ natal }: Pick<AstroSheetViewModel, 'natal'>) {
  return (
    <div className="premium-card p-10">
      <div className="flex items-center gap-4 mb-8 border-b border-[#E6E0D8] pb-6">
        <div className="p-3 bg-[#F6F3EE] rounded-xl">
          <Orbit size={20} className="text-[#0E1B33]" />
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.4em] font-extrabold text-[#5A6477]">Natal Chart</h3>
          <div className="text-[9px] mono text-[#A1A1AA] mt-1">Planeten • Häuser • Aspekte</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0E1B33] uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            Planetenpositionen
          </div>
          <ul className="space-y-2 text-sm text-[#5A6477]">
            {natal.planets.map((planet) => (
              <li key={`${planet.name}-${planet.sign}`} className="flex justify-between">
                <span className="font-semibold text-[#0E1B33]">{planet.name}</span>
                <span>{planet.sign} {planet.degree.toFixed(1)}°{planet.house ? ` • Haus ${planet.house}` : ''}</span>
              </li>
            ))}
            {natal.planets.length === 0 && <li className="text-xs text-[#A1A1AA]">Keine Planetendaten vorhanden</li>}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0E1B33] uppercase tracking-[0.2em]">
            <Compass size={14} />
            Häuser
          </div>
          <ul className="space-y-2 text-sm text-[#5A6477]">
            {natal.houses.map((house) => (
              <li key={`house-${house.number}`} className="flex justify-between">
                <span className="font-semibold text-[#0E1B33]">Haus {house.number}</span>
                <span>{house.sign} {house.degree.toFixed(1)}°</span>
              </li>
            ))}
            {natal.houses.length === 0 && <li className="text-xs text-[#A1A1AA]">Keine Häuserdaten vorhanden</li>}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0E1B33] uppercase tracking-[0.2em]">
            <Orbit size={14} />
            Aspekte
          </div>
          <ul className="space-y-2 text-sm text-[#5A6477]">
            {natal.aspects.map((aspect, idx) => (
              <li key={`${aspect.from}-${aspect.to}-${idx}`} className="flex justify-between">
                <span className="font-semibold text-[#0E1B33]">{aspect.from} → {aspect.to}</span>
                <span>{aspect.type}{aspect.orb ? ` (${aspect.orb.toFixed(1)}°)` : ''}</span>
              </li>
            ))}
            {natal.aspects.length === 0 && <li className="text-xs text-[#A1A1AA]">Keine Aspektdaten vorhanden</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
