
import React from 'react';
import { ClusterContributionEvent } from '@/lib/types/cluster';

interface MentalistClusterCardProps {
  payload: ClusterContributionEvent['payload'];
}

export function MentalistClusterCard({ payload }: MentalistClusterCardProps) {
  const { clusterAttribute, summary } = payload;
  const { archetype, narrative, components } = clusterAttribute;

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div className="relative bg-gradient-to-br from-[#4A0E4E] to-[#1A0A2E] rounded-xl overflow-hidden shadow-2xl border-4 border-[#E8B4E8]/50 p-1 transform transition-transform hover:scale-[1.02]">
        {/* Mystical Overlay Effect */}
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-purple-500/10 pointer-events-none"></div>
        
        {/* Floating orbs decoration */}
        <div className="absolute top-4 left-4 w-16 h-16 bg-purple-500/20 rounded-full blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-8 right-8 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
        
        <div className="relative bg-[#0D0A1A] rounded-lg p-6 md:p-10 text-center border border-white/10">
          
          {/* Header */}
          <div className="mb-6">
            <div className="text-5xl mb-4">🔮</div>
            <span className="inline-block px-3 py-1 bg-[#E8B4E8]/20 text-[#E8B4E8] text-xs font-bold tracking-widest uppercase rounded-full mb-4 border border-[#E8B4E8]/30">
              Mentalist Cluster Complete
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-2 drop-shadow-lg">
              {archetype}
            </h2>
            <p className="text-purple-200 text-lg font-light tracking-wide">{summary.tagline}</p>
          </div>

          {/* Components Grid - 3 columns for Mentalist */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {components.map((comp) => {
              // Map quiz IDs to icons and labels
              const quizInfo: Record<string, { icon: string; label: string }> = {
                'lovelang': { icon: '💜', label: 'Liebessprache' },
                'charme': { icon: '✨', label: 'Charme' },
                'eq': { icon: '🎭', label: 'EQ' }
              };
              const info = quizInfo[comp.quizId.split('.')[1]] || { icon: '⭐', label: comp.quizId.split('.')[1] };
              
              return (
                <div key={comp.quizId} className="bg-[#4A0E4E]/20 rounded-lg p-3 border border-purple-500/20">
                  <div className="text-2xl mb-1">{info.icon}</div>
                  <div className="text-xs text-[#E8B4E8] uppercase opacity-70 mb-1">{info.label}</div>
                  <div className="text-white font-medium text-sm">{comp.component}</div>
                </div>
              );
            })}
          </div>

          {/* Narrative */}
          <div className="bg-black/30 rounded-xl p-6 text-left mb-8 border border-purple-500/10">
            <p className="text-purple-100 leading-relaxed font-serif text-lg">
              {narrative}
            </p>
          </div>

          {/* Stats/Bullets */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {summary.bullets.map((bullet, i) => (
              <span 
                key={i} 
                className="px-3 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full border border-purple-500/30"
              >
                {bullet}
              </span>
            ))}
          </div>

          {/* Action / Footer */}
          <div className="text-center">
            <button 
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-lg hover:from-purple-400 hover:to-indigo-400 transition-colors shadow-lg shadow-purple-500/30"
              onClick={() => window.print()}
            >
              Karte Speichern
            </button>
            <p className="mt-4 text-xs text-white/30 uppercase tracking-widest">
              Mentalist Collection • 1/1
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
