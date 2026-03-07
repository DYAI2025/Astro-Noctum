
import React from 'react';
import { ClusterContributionEvent } from '@/lib/types/cluster';

interface ClusterResultCardProps {
  payload: ClusterContributionEvent['payload'];
}

export function ClusterResultCard({ payload }: ClusterResultCardProps) {
  const { clusterAttribute, summary } = payload;
  const { archetype, narrative, components } = clusterAttribute;

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div className="relative bg-gradient-to-br from-[#2D5A4C] to-[#1A3C2F] rounded-xl overflow-hidden shadow-2xl border-4 border-[#A8D5BA]/50 p-1 transform transition-transform hover:scale-[1.02]">
        {/* Holographic Overlay Effect */}
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none"></div>
        
        <div className="relative bg-[#0D1F18] rounded-lg p-6 md:p-10 text-center border border-white/10">
          
          {/* Header */}
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-[#A8D5BA]/20 text-[#A8D5BA] text-xs font-bold tracking-widest uppercase rounded-full mb-4 border border-[#A8D5BA]/30">
              Cluster Complete
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-2 drop-shadow-lg">
              {archetype}
            </h2>
            <p className="text-[#E0E8E3] text-lg font-light tracking-wide">{summary.tagline}</p>
          </div>

          {/* Components Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {components.map((comp) => (
              <div key={comp.quizId} className="bg-[#2D5A4C]/20 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-[#A8D5BA] uppercase opacity-70 mb-1">{comp.quizId.split('.')[1]}</div>
                <div className="text-white font-medium capitalize">{comp.component}</div>
              </div>
            ))}
          </div>

          {/* Narrative */}
          <div className="bg-black/30 rounded-xl p-6 text-left mb-8 border border-white/5">
            <p className="text-[#E0E8E3] leading-relaxed font-serif text-lg">
              {narrative}
            </p>
          </div>

          {/* Action / Footer */}
          <div className="text-center">
            <button 
              className="px-8 py-3 bg-[#A8D5BA] text-[#1A3C2F] font-bold rounded-lg hover:bg-white transition-colors shadow-lg shadow-[#A8D5BA]/20"
              onClick={() => window.print()}
            >
              Karte Speichern
            </button>
            <p className="mt-4 text-xs text-white/30 uppercase tracking-widest">
              Naturkind Collection • 1/1
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
