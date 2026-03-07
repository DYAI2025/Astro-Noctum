
import React, { useEffect, useState } from 'react';
import { Stat } from './types';
import { Activity, ShieldCheck } from 'lucide-react';

interface StatsCardProps { stats: Stat[]; }

const SegmentedBar: React.FC<{ value: number }> = ({ value }) => {
  const totalSegments = 20;
  const [displayValue, setDisplayValue] = useState(0);

  // Animate the fill on mount or value change
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayValue(value);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value]);

  const activeSegments = Math.round((displayValue / 100) * totalSegments);
  
  return (
    <div className="segmented-bar">
      {Array.from({ length: totalSegments }).map((_, i) => (
        <div 
          key={i} 
          className={`segment transition-all duration-300 ${i < activeSegments ? 'active scale-y-110' : 'opacity-40'}`}
          style={{ 
            transitionDelay: `${i * 25}ms`,
            // Add a subtle glow to active segments
            boxShadow: i < activeSegments ? '0 0 8px rgba(14, 27, 51, 0.15)' : 'none'
          }}
        />
      ))}
    </div>
  );
};

const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <div className="premium-card p-14">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-16">
        <div className="max-w-xs space-y-8">
          <div className="p-4 bg-[#0E1B33] inline-flex rounded-2xl shadow-lg">
            <Activity className="text-[#7AA7A1]" size={24} />
          </div>
          <div>
            <h3 className="serif text-5xl font-light text-[#0E1B33] leading-tight">Biometrische Matrix</h3>
            <p className="text-sm text-[#5A6477] mt-4 font-light leading-relaxed">
              Deine aktuelle Resonanz wird über 5 Kernparameter abgebildet. Jede Veränderung im Transit-Feld beeinflusst diese Werte in Echtzeit über das Siderische Interface.
            </p>
          </div>
          <div className="flex items-center gap-3 py-3 border-y border-[#E6E0D8]">
            <ShieldCheck size={14} className="text-[#C9A46A]" />
            <span className="mono text-[9px] text-[#5A6477] font-bold uppercase tracking-[0.3em]">Integrity_Check: Passed</span>
          </div>
        </div>

        <div className="flex-grow w-full space-y-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-4 group">
              <div className="flex justify-between items-baseline px-1">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-[#7AA7A1] opacity-0 group-hover:opacity-100 transition-opacity" />
                   <span className="mono text-[11px] font-extrabold text-[#0E1B33] uppercase tracking-[0.4em] group-hover:text-[#7AA7A1] transition-colors cursor-default">
                     {stat.label}
                   </span>
                </div>
                <span className="mono text-[11px] font-bold text-[#C9A46A] tracking-[0.1em]">{stat.value}%</span>
              </div>
              <SegmentedBar value={stat.value} />
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-8 opacity-40">
             <div className="flex gap-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#E6E0D8] animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
             </div>
             <span className="mono text-[8px] text-[#5A6477] font-bold uppercase tracking-[0.4em] select-none">
                Reference: Natal_Matrix_v1.2_Stable
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
