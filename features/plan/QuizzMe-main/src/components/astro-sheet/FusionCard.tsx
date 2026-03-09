"use client";

import React from 'react';
import { FusionData, WuXing } from './model';
import { Trees, Flame, Mountain, Shield, Waves, Sparkles, Activity } from 'lucide-react';

interface FusionCardProps {
  fusion: FusionData | null;
}

const ELEMENT_CONFIG: Record<WuXing, { icon: React.ElementType; color: string; colorLight: string }> = {
  Wood: { icon: Trees, color: '#22C55E', colorLight: '#DCFCE7' },
  Fire: { icon: Flame, color: '#EF4444', colorLight: '#FEE2E2' },
  Earth: { icon: Mountain, color: '#A16207', colorLight: '#FEF3C7' },
  Metal: { icon: Shield, color: '#6B7280', colorLight: '#F3F4F6' },
  Water: { icon: Waves, color: '#3B82F6', colorLight: '#DBEAFE' },
};

const ELEMENT_ORDER: WuXing[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
const ELEMENT_DE: Record<WuXing, string> = {
  Wood: 'Holz',
  Fire: 'Feuer',
  Earth: 'Erde',
  Metal: 'Metall',
  Water: 'Wasser',
};

const ElementBar: React.FC<{
  element: WuXing;
  value: number;
  isDominant: boolean;
  isDeficient: boolean;
}> = ({ element, value, isDominant, isDeficient }) => {
  const config = ELEMENT_CONFIG[element];
  const Icon = config.icon;
  const percentage = Math.round(value * 100);

  return (
    <div className="group relative">
      <div className="flex items-center gap-4 mb-2">
        <div
          className={`p-2 rounded-xl transition-all duration-300 ${
            isDominant
              ? 'bg-gradient-to-br from-[#C9A46A] to-[#8F7AD1] shadow-lg scale-110'
              : isDeficient
                ? 'bg-[#F6F3EE] border border-dashed border-[#E6E0D8]'
                : 'bg-white border border-[#E6E0D8]'
          }`}
        >
          <Icon
            size={16}
            className={isDominant ? 'text-white' : 'text-[#5A6477]'}
            style={{ color: isDominant ? undefined : config.color }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A6477]">
              {ELEMENT_DE[element]}
            </span>
            <span
              className={`mono text-[11px] font-extrabold ${
                isDominant ? 'text-[#C9A46A]' : isDeficient ? 'text-[#A1A1AA]' : 'text-[#0E1B33]'
              }`}
            >
              {percentage}%
            </span>
          </div>
          <div className="h-2 bg-[#F6F3EE] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                background: isDominant
                  ? 'linear-gradient(90deg, #C9A46A, #8F7AD1)'
                  : config.color,
                opacity: isDeficient ? 0.4 : 1,
              }}
            />
          </div>
        </div>
      </div>
      {isDominant && (
        <div className="absolute -right-2 -top-2 px-2 py-0.5 bg-[#C9A46A] text-white text-[7px] mono font-bold uppercase tracking-widest rounded-full shadow-lg">
          Dominant
        </div>
      )}
      {isDeficient && (
        <div className="absolute -right-2 -top-2 px-2 py-0.5 bg-[#E6E0D8] text-[#5A6477] text-[7px] mono font-bold uppercase tracking-widest rounded-full">
          Defizit
        </div>
      )}
    </div>
  );
};

const RadarChart: React.FC<{ vector: [number, number, number, number, number] }> = ({ vector }) => {
  const size = 200;
  const center = size / 2;
  const radius = 80;

  // Calculate points for pentagon
  const getPoint = (index: number, value: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const r = radius * value;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = vector.map((v, i) => getPoint(i, v));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Background grid
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={ELEMENT_ORDER.map((_, i) => {
            const p = getPoint(i, level);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="#E6E0D8"
          strokeWidth="0.5"
          opacity={0.5}
        />
      ))}

      {/* Axis lines */}
      {ELEMENT_ORDER.map((_, i) => {
        const p = getPoint(i, 1);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#E6E0D8"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon */}
      <path
        d={pathData}
        fill="url(#fusionGradient)"
        fillOpacity="0.3"
        stroke="url(#fusionGradient)"
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill={ELEMENT_CONFIG[ELEMENT_ORDER[i]].color}
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {ELEMENT_ORDER.map((element, i) => {
        const p = getPoint(i, 1.15);
        const Icon = ELEMENT_CONFIG[element].icon;
        return (
          <g key={element} transform={`translate(${p.x - 8}, ${p.y - 8})`}>
            <rect x="-2" y="-2" width="20" height="20" rx="4" fill="white" />
            <foreignObject x="0" y="0" width="16" height="16">
              <div className="flex items-center justify-center w-full h-full">
                <Icon size={12} color={ELEMENT_CONFIG[element].color} />
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="fusionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8F7AD1" />
          <stop offset="50%" stopColor="#7AA7A1" />
          <stop offset="100%" stopColor="#C9A46A" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const FusionCard: React.FC<FusionCardProps> = ({ fusion }) => {
  if (!fusion) {
    return (
      <div className="bg-white rounded-[2rem] border border-[#E6E0D8] p-12 text-center" data-testid="fusion-card-empty">
        <Sparkles className="mx-auto mb-4 text-[#E6E0D8]" size={32} />
        <p className="mono text-[11px] text-[#A1A1AA] uppercase tracking-[0.3em]">
          Fusion-Analyse nicht verfügbar
        </p>
      </div>
    );
  }

  const { elementVector, harmonyIndex, harmonyInterpretation, resonances } = fusion;

  return (
    <div className="bg-white rounded-[2rem] border border-[#E6E0D8] overflow-hidden shadow-xl" data-testid="fusion-card">
      {/* Header */}
      <div className="p-8 border-b border-[#E6E0D8] bg-gradient-to-r from-[#F6F3EE] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#8F7AD1] to-[#7AA7A1] rounded-2xl shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="serif text-2xl text-[#0E1B33] font-medium tracking-tight">
                Element-Fusion
              </h3>
              <p className="mono text-[9px] text-[#5A6477] uppercase tracking-widest mt-1">
                East-West Synthesis Matrix
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-[10px] text-[#5A6477] uppercase tracking-widest mb-1">
              Harmonie-Index
            </div>
            <div className="text-3xl font-bold text-[#0E1B33]" data-testid="harmony-index">
              {Math.round(harmonyIndex * 100)}%
            </div>
            <div className="mono text-[9px] text-[#7AA7A1] font-bold uppercase tracking-wider">
              {harmonyInterpretation}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Radar Chart */}
        <div className="p-8 border-r border-[#E6E0D8] flex flex-col items-center justify-center bg-[#FAFAF8]">
          <div className="w-56 h-56">
            <RadarChart vector={elementVector.combined} />
          </div>
          <div className="mt-6 text-center">
            <div className="mono text-[8px] text-[#A1A1AA] uppercase tracking-widest mb-2">
              Kombinierter Element-Vektor
            </div>
            <div className="flex items-center justify-center gap-2">
              <Activity size={12} className="text-[#7AA7A1] animate-pulse" />
              <span className="mono text-[9px] text-[#5A6477] font-bold">
                Ba Zi + Western Fusion
              </span>
            </div>
          </div>
        </div>

        {/* Element Bars */}
        <div className="p-8 space-y-6">
          {ELEMENT_ORDER.map((element, i) => (
            <ElementBar
              key={element}
              element={element}
              value={elementVector.combined[i]}
              isDominant={element === elementVector.dominantElement}
              isDeficient={element === elementVector.deficientElement}
            />
          ))}
        </div>
      </div>

      {/* Resonances */}
      {resonances.length > 0 && (
        <div className="p-8 border-t border-[#E6E0D8] bg-[#F6F3EE]" data-testid="resonances-section">
          <div className="mono text-[10px] text-[#5A6477] uppercase tracking-widest mb-4">
            Aktive Resonanzen
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resonances.slice(0, 4).map((res, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  res.quality === 'harmony'
                    ? 'bg-green-50 border-green-200'
                    : res.quality === 'tension'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-[#E6E0D8]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="mono text-[9px] font-bold uppercase tracking-wider text-[#5A6477]">
                    {res.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[8px] mono font-bold uppercase ${
                      res.quality === 'harmony'
                        ? 'bg-green-100 text-green-700'
                        : res.quality === 'tension'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {res.quality === 'harmony' ? 'Harmonie' : res.quality === 'tension' ? 'Spannung' : 'Neutral'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#0E1B33]">
                  <span className="font-bold">{res.eastern}</span>
                  <span className="text-[#A1A1AA]">↔</span>
                  <span className="font-bold">{res.western}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FusionCard;
