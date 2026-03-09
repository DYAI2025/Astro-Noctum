
import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Zap, Eye, Heart, Globe, Compass, RefreshCw, Star, Activity, Layers } from 'lucide-react';

const SegmentedScale: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const segments = 15;
  const activeSegments = Math.round((value / 100) * segments);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="mono text-[9px] font-bold text-white/50 uppercase tracking-[0.3em]">{label}</span>
        <span className="mono text-[10px] font-bold text-white" style={{ color }}>{value}%</span>
      </div>
      <div className="flex gap-1 h-2 w-full">
        {Array.from({ length: segments }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 rounded-sm transition-all duration-1000"
            style={{ 
              backgroundColor: i < activeSegments ? color : 'rgba(255,255,255,0.05)',
              boxShadow: i < activeSegments ? `0 0 10px ${color}44` : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface PlanetProps {
  name: string;
  size: number;
  orbitRadius: number;
  period: number; 
  color: string;
  hasRings?: boolean;
  baseAngle: number;
}

const Planet3D: React.FC<PlanetProps & { currentRotation: number }> = ({ name, size, orbitRadius, color, hasRings, currentRotation }) => {
  const radian = (currentRotation * Math.PI) / 180;
  const x = Math.cos(radian) * orbitRadius;
  const y = Math.sin(radian) * orbitRadius;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
      {/* Orbit Line */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]"
        style={{ width: orbitRadius * 2, height: orbitRadius * 2 }}
      />
      
      {/* Planet Body as Geometric Marker */}
      <div 
        className="absolute top-1/2 left-1/2"
        style={{ 
          transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0px) rotateX(-65deg)`,
          width: size,
          height: size
        }}
      >
        <div 
          className="w-full h-full relative group/planet flex items-center justify-center"
        >
          {/* Abstract Geometric Shell */}
          <div className="absolute inset-0 rotate-45 border border-white/20 scale-150 animate-pulse" />
          <div 
            className="w-full h-full rounded-full shadow-lg relative z-10"
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 15px ${color}88`,
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          />
          {hasRings && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1px] border-white/20"
              style={{ width: size * 3, height: size * 0.8, transform: 'rotateZ(25deg)' }}
            />
          )}
          
          {/* Identification Label */}
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 mono text-[5px] text-white/40 tracking-widest whitespace-nowrap opacity-0 group-hover/planet:opacity-100 transition-opacity">
            {name}_POS_CALC
          </div>
        </div>
      </div>
    </div>
  );
};

const CelestialAspects: React.FC<{ rotations: number[]; planets: PlanetProps[] }> = ({ rotations, planets }) => {
  // Simple heuristic for "aspects" based on angular difference
  const aspects = useMemo(() => {
    const list: any[] = [];
    for (let i = 0; i < rotations.length; i++) {
      for (let j = i + 1; j < rotations.length; j++) {
        const diff = Math.abs(rotations[i] - rotations[j]) % 360;
        const normalizedDiff = diff > 180 ? 360 - diff : diff;

        // Trine (120), Square (90), Conjunction (0)
        if (normalizedDiff < 15) list.push({ p1: i, p2: j, type: 'Conjunction', color: '#7AA7A1' });
        else if (Math.abs(normalizedDiff - 90) < 10) list.push({ p1: i, p2: j, type: 'Square', color: '#8F7AD1' });
        else if (Math.abs(normalizedDiff - 120) < 10) list.push({ p1: i, p2: j, type: 'Trine', color: '#C9A46A' });
      }
    }
    return list;
  }, [rotations]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 overflow-visible" viewBox="-250 -250 500 500">
      {aspects.map((aspect, idx) => {
        const rad1 = (rotations[aspect.p1] * Math.PI) / 180;
        const rad2 = (rotations[aspect.p2] * Math.PI) / 180;
        const r1 = planets[aspect.p1].orbitRadius;
        const r2 = planets[aspect.p2].orbitRadius;
        
        const x1 = Math.cos(rad1) * r1;
        const y1 = Math.sin(rad1) * r1;
        const x2 = Math.cos(rad2) * r2;
        const y2 = Math.sin(rad2) * r2;

        return (
          <g key={idx} className="animate-reveal">
            <line 
              x1={x1} y1={y1} x2={x2} y2={y2} 
              stroke={aspect.color} 
              strokeWidth="0.5" 
              strokeDasharray="2 4"
              className="animate-pulse"
            />
            <circle cx={x1} cy={y1} r="2" fill={aspect.color} />
            <circle cx={x2} cy={y2} r="2" fill={aspect.color} />
          </g>
        );
      })}
    </svg>
  );
};

const SolarSystem3D: React.FC = () => {
  const planets: PlanetProps[] = [
    { name: 'MERCURY', size: 3, orbitRadius: 35, period: 15, color: '#A1A1AA', baseAngle: 45 },
    { name: 'VENUS', size: 5, orbitRadius: 55, period: 32, color: '#EAB308', baseAngle: 120 },
    { name: 'EARTH', size: 6, orbitRadius: 80, period: 45, color: '#7AA7A1', baseAngle: 0 },
    { name: 'MARS', size: 4, orbitRadius: 100, period: 75, color: '#C9A46A', baseAngle: 280 },
    { name: 'JUPITER', size: 10, orbitRadius: 130, period: 180, color: '#D4D4D8', baseAngle: 190 },
    { name: 'SATURN', size: 9, orbitRadius: 165, period: 320, color: '#FDE68A', hasRings: true, baseAngle: 60 },
  ];

  const [rotations, setRotations] = useState<number[]>(planets.map(p => p.baseAngle));

  useEffect(() => {
    let frameId: number;
    const start = Date.now() / 1000;
    const animate = () => {
      const now = Date.now() / 1000;
      const elapsed = now - start;
      const newRotations = planets.map(p => (p.baseAngle + (elapsed * (360 / p.period))) % 360);
      setRotations(newRotations);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="relative w-full h-[450px] flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        <div className="relative w-full h-full flex items-center justify-center" style={{ transform: 'rotateX(65deg)', transformStyle: 'preserve-3d' }}>
          
          {/* Celestial Aspects Visualization Overlay */}
          <CelestialAspects rotations={rotations} planets={planets} />

          {/* Sun - core geometric center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#C9A46A] z-20 shadow-[0_0_60px_#C9A46A] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full animate-pulse bg-white/30 blur-sm" />
            <div className="w-16 h-16 border border-[#C9A46A]/20 rounded-full animate-spin-slow" />
            <div className="w-12 h-12 border border-[#C9A46A]/40 rounded-full" style={{ animation: 'rotate 10s linear infinite reverse' }} />
          </div>

          {/* Zodiac Calibration Rings */}
          <div className="absolute w-[500px] h-[500px] border border-white/5 rounded-full" />
          <div className="absolute w-[480px] h-[480px] border border-white/5 rounded-full flex items-center justify-center">
             <div className="w-full h-full border border-dashed border-white/10 opacity-20 animate-spin-slow" />
          </div>

          {planets.map((p, i) => (
            <Planet3D key={p.name} {...p} currentRotation={rotations[i]} />
          ))}
        </div>
      </div>
    </div>
  );
};

const DailyQuest: React.FC = () => {
  return (
    <div className="dark-premium-card p-12 h-full flex flex-col relative overflow-hidden group/daily">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8F7AD1]/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Enhanced with Geometric Icons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-white/10 pb-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="p-4 bg-white/5 rounded-[1.8rem] border border-white/10 relative z-10 group-hover/daily:border-[#C9A46A]/50 transition-colors">
                <Star size={28} className="text-[#C9A46A]" />
              </div>
              <div className="absolute inset-0 bg-[#C9A46A]/20 blur-xl opacity-0 group-hover/daily:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[12px] uppercase tracking-[0.5em] font-extrabold text-[#7AA7A1]">Celestial_Oracle</h3>
                <span className="mono text-[9px] text-white/30 uppercase flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded">
                  <RefreshCw size={10} className="animate-spin" /> Live_Sync
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-help">
                  <span className="text-[#C9A46A] text-xl leading-none">♓</span>
                  <span className="mono text-[10px] text-white font-bold uppercase tracking-widest">Fische</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-help">
                  <span className="text-[#7AA7A1] text-xl leading-none">🐎</span>
                  <span className="mono text-[10px] text-white font-bold uppercase tracking-widest">Metall-Pferd</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right hidden lg:block">
            <div className="mono text-[10px] text-white/40 uppercase tracking-widest">{new Date().toLocaleDateString('de-DE')}</div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <Activity size={10} className="text-[#7AA7A1] animate-pulse" />
              <div className="mono text-[9px] text-[#C9A46A] font-bold uppercase tracking-[0.4em]">Resonance: 99.4%</div>
            </div>
          </div>
        </div>

        {/* Content: 3D Visualization & Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 flex-grow items-center">
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 bg-white/[0.01] rounded-[3rem] border border-white/5 relative group/viz overflow-hidden">
            {/* Background Data Stream Visual */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden mono text-[8px] text-white p-4 leading-relaxed">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="whitespace-nowrap mb-1">
                  CALC_ORBIT_{i}: {Math.random().toFixed(8)} | VECTOR_ALPHA_{i}: {Math.random().toFixed(4)} | SYNC_STABLE
                </div>
              ))}
            </div>

            <SolarSystem3D />
            
            <div className="absolute bottom-10 flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7AA7A1]" />
                <span className="mono text-[7px] text-white/40 uppercase font-bold tracking-widest">Conjunction</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A46A]" />
                <span className="mono text-[7px] text-white/40 uppercase font-bold tracking-widest">Trine</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8F7AD1]" />
                <span className="mono text-[7px] text-white/40 uppercase font-bold tracking-widest">Square</span>
              </div>
            </div>
            
            <div className="mt-8 mono text-[8px] text-white/20 uppercase tracking-[0.6em] text-center z-10">Geometric_Alignment_Matrix_v4.0</div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center relative">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <Layers size={14} className="text-[#7AA7A1]" />
                <span className="mono text-[10px] text-[#7AA7A1] font-extrabold uppercase tracking-[0.4em]">Data_Insight_Module</span>
              </div>
              <h2 className="serif text-5xl xl:text-6xl font-light mb-8 leading-tight text-white tracking-tight">
                Intuition als Kompass.
              </h2>
              <div className="bg-white/[0.04] p-10 rounded-[2.5rem] border border-white/5 relative group transition-all hover:border-[#7AA7A1]/20 hover:bg-white/[0.06] shadow-2xl">
                <p className="text-white/80 text-xl xl:text-2xl leading-relaxed font-light italic serif">
                  "Die heutige Mars-Neptun Konjunktion verstärkt deine Empathie. Was sich wie Verwirrung anfühlt, ist in Wahrheit ein geschärfter Sinn für das Nicht-Sichtbare. Nutze die Energie des Metall-Pferdes, um diese Visionen in disziplinierte Taten zu verwandeln."
                </p>
                <div className="absolute top-4 right-4 opacity-10">
                  <Sparkles size={24} className="text-[#C9A46A]" />
                </div>
                {/* Decoration corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-xl" />
              </div>
            </div>

            {/* Strengths Scales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-10 border-t border-white/10">
              <SegmentedScale label="Energie" value={68} color="#C9A46A" />
              <SegmentedScale label="Intuition" value={94} color="#7AA7A1" />
              <SegmentedScale label="Gefühle" value={82} color="#8F7AD1" />
            </div>
          </div>
        </div>

        {/* Footer: Interactive Action */}
        <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 hover:border-[#8F7AD1]/50 transition-colors">
                <Heart size={16} className="text-[#8F7AD1]" />
              </div>
              <div className="flex flex-col">
                <span className="mono text-[9px] text-white/40 uppercase tracking-widest font-bold">Fokus: Emotionale Integrität</span>
                <span className="mono text-[7px] text-[#7AA7A1] uppercase tracking-wider">Sync_Status: High</span>
              </div>
           </div>
           <button className="group/btn relative px-10 py-4 overflow-hidden rounded-full transition-all duration-500 shadow-xl">
              <div className="absolute inset-0 bg-white group-hover/btn:bg-[#C9A46A] transition-colors" />
              <div className="relative z-10 flex items-center gap-3 text-[#0E1B33] group-hover/btn:text-white">
                <Eye size={14} className="group-hover/btn:scale-110 transition-transform" /> 
                <span className="text-[10px] font-extrabold uppercase tracking-[0.5em]">Tiefenanalyse</span>
              </div>
           </button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuest;
