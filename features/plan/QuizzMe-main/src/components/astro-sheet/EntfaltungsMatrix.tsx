"use client";

import React from 'react';
import { Activity, Zap, TrendingUp, Lock, Unlock } from 'lucide-react';

interface EntfaltungsMatrixProps {
  stats: Array<{
    label: string;
    value: number; // Current level (0-100)
    potential: number; // Max potential (0-100)
  }>;
}

const DIMENSION_COLORS = [
  { primary: '#C9A46A', light: '#FEF3C7' }, // Gold
  { primary: '#7AA7A1', light: '#D1FAE5' }, // Teal
  { primary: '#8F7AD1', light: '#EDE9FE' }, // Purple
  { primary: '#EF4444', light: '#FEE2E2' }, // Red
  { primary: '#3B82F6', light: '#DBEAFE' }, // Blue
];

const RadarPentagon: React.FC<{
  current: number[];
  potential: number[];
  labels: string[];
}> = ({ current, potential, labels }) => {
  const size = 280;
  const center = size / 2;
  const radius = 110;

  const getPoint = (index: number, value: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const r = radius * (value / 100);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const currentPoints = current.map((v, i) => getPoint(i, v));
  const potentialPoints = potential.map((v, i) => getPoint(i, v));

  const currentPath = currentPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  const potentialPath = potentialPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" data-testid="entfaltungs-radar">
      <defs>
        <linearGradient id="currentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7AA7A1" />
          <stop offset="100%" stopColor="#C9A46A" />
        </linearGradient>
        <linearGradient id="potentialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8F7AD1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C9A46A" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={[0, 1, 2, 3, 4].map((i) => {
            const p = getPoint(i, level);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="#E6E0D8"
          strokeWidth={level === 100 ? "1" : "0.5"}
          opacity={level === 100 ? 0.8 : 0.4}
        />
      ))}

      {/* Axis lines */}
      {[0, 1, 2, 3, 4].map((i) => {
        const p = getPoint(i, 100);
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

      {/* Potential polygon (outer) */}
      <path
        d={potentialPath}
        fill="url(#potentialGradient)"
        stroke="#8F7AD1"
        strokeWidth="1"
        strokeDasharray="4 2"
        opacity="0.6"
        data-testid="potential-area"
      />

      {/* Current polygon (inner) */}
      <path
        d={currentPath}
        fill="url(#currentGradient)"
        fillOpacity="0.25"
        stroke="url(#currentGradient)"
        strokeWidth="2.5"
        data-testid="current-area"
      />

      {/* Current points */}
      {currentPoints.map((p, i) => (
        <g key={`current-${i}`}>
          <circle
            cx={p.x}
            cy={p.y}
            r="6"
            fill={DIMENSION_COLORS[i % 5].primary}
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
          />
        </g>
      ))}

      {/* Labels */}
      {labels.map((label, i) => {
        const p = getPoint(i, 125);
        const isUnlocked = current[i] >= potential[i] * 0.7;
        return (
          <g key={`label-${i}`} transform={`translate(${p.x}, ${p.y})`}>
            <rect
              x="-40"
              y="-12"
              width="80"
              height="24"
              rx="12"
              fill={isUnlocked ? DIMENSION_COLORS[i % 5].light : '#F6F3EE'}
              stroke={isUnlocked ? DIMENSION_COLORS[i % 5].primary : '#E6E0D8'}
              strokeWidth="1"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] font-bold uppercase tracking-wider"
              fill={isUnlocked ? DIMENSION_COLORS[i % 5].primary : '#5A6477'}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Center pulse */}
      <circle cx={center} cy={center} r="4" fill="#7AA7A1" className="animate-pulse" />
      <circle cx={center} cy={center} r="8" fill="none" stroke="#7AA7A1" strokeWidth="1" opacity="0.3" />
    </svg>
  );
};

const EntfaltungsMatrix: React.FC<EntfaltungsMatrixProps> = ({ stats }) => {
  // Ensure we have 5 dimensions for the pentagon
  const dimensions = stats.slice(0, 5);
  while (dimensions.length < 5) {
    dimensions.push({ label: 'N/A', value: 50, potential: 80 });
  }

  const current = dimensions.map(d => d.value);
  const potential = dimensions.map(d => d.potential);
  const labels = dimensions.map(d => d.label);

  // Calculate overall progress
  const totalCurrent = current.reduce((a, b) => a + b, 0);
  const totalPotential = potential.reduce((a, b) => a + b, 0);
  const overallProgress = Math.round((totalCurrent / totalPotential) * 100);

  // Count unlocked dimensions
  const unlockedCount = dimensions.filter((d, i) => current[i] >= potential[i] * 0.7).length;

  return (
    <div
      className="bg-white rounded-[2rem] border border-[#E6E0D8] overflow-hidden shadow-xl"
      data-testid="entfaltungs-matrix"
    >
      {/* Header */}
      <div className="p-8 border-b border-[#E6E0D8] bg-gradient-to-r from-[#F6F3EE] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#7AA7A1] to-[#C9A46A] rounded-2xl shadow-lg">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h3 className="serif text-2xl text-[#0E1B33] font-medium tracking-tight">
                Entfaltungs-Matrix
              </h3>
              <p className="mono text-[9px] text-[#5A6477] uppercase tracking-widest mt-1">
                Potenzial-Visualisierung
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-[10px] text-[#5A6477] uppercase tracking-widest mb-1">
              Gesamt-Fortschritt
            </div>
            <div className="text-3xl font-bold text-[#0E1B33]" data-testid="overall-progress">
              {overallProgress}%
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Radar Chart */}
        <div className="p-8 border-r border-[#E6E0D8] flex flex-col items-center justify-center bg-[#FAFAF8]">
          <div className="w-72 h-72">
            <RadarPentagon current={current} potential={potential} labels={labels} />
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#7AA7A1] to-[#C9A46A]" />
              <span className="mono text-[9px] text-[#5A6477] uppercase tracking-wider">Aktuell</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-[#8F7AD1] bg-[#8F7AD1]/20" />
              <span className="mono text-[9px] text-[#5A6477] uppercase tracking-wider">Potenzial</span>
            </div>
          </div>
        </div>

        {/* Dimension Bars */}
        <div className="p-8 space-y-5">
          {dimensions.map((dim, i) => {
            const isUnlocked = dim.value >= dim.potential * 0.7;
            const gap = dim.potential - dim.value;

            return (
              <div
                key={i}
                className="group relative"
                data-testid={`dimension-${i}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <Unlock size={14} className="text-[#7AA7A1]" />
                    ) : (
                      <Lock size={14} className="text-[#A1A1AA]" />
                    )}
                    <span className="mono text-[10px] font-bold uppercase tracking-widest text-[#5A6477]">
                      {dim.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`mono text-[11px] font-bold ${isUnlocked ? 'text-[#7AA7A1]' : 'text-[#0E1B33]'}`}>
                      {dim.value}%
                    </span>
                    {gap > 10 && (
                      <span className="mono text-[9px] text-[#C9A46A] font-bold flex items-center gap-1">
                        <TrendingUp size={10} />
                        +{gap}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar with potential overlay */}
                <div className="h-3 bg-[#F6F3EE] rounded-full overflow-hidden relative">
                  {/* Potential marker */}
                  <div
                    className="absolute top-0 bottom-0 border-r-2 border-dashed border-[#8F7AD1]/60"
                    style={{ left: `${dim.potential}%` }}
                  />
                  {/* Current progress */}
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                    style={{
                      width: `${dim.value}%`,
                      background: isUnlocked
                        ? `linear-gradient(90deg, ${DIMENSION_COLORS[i % 5].primary}, #7AA7A1)`
                        : DIMENSION_COLORS[i % 5].primary,
                    }}
                  >
                    {isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                    )}
                  </div>
                </div>

                {isUnlocked && (
                  <div className="absolute -right-1 -top-1">
                    <div className="px-2 py-0.5 bg-[#7AA7A1] text-white text-[7px] mono font-bold uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1">
                      <Zap size={8} />
                      Freigeschaltet
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary */}
          <div className="pt-6 border-t border-[#E6E0D8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7AA7A1] animate-pulse" />
              <span className="mono text-[9px] text-[#5A6477] uppercase tracking-widest">
                {unlockedCount}/{dimensions.length} Dimensionen freigeschaltet
              </span>
            </div>
            <div className="mono text-[8px] text-[#A1A1AA] uppercase tracking-widest">
              Matrix v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntfaltungsMatrix;
