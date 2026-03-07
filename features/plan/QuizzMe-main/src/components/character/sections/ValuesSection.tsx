
import React from 'react';
import { ProfileSnapshot } from '@/lib/lme/types';
import { Target, Zap, Heart, AlertCircle, Quote } from 'lucide-react';

interface ValuesSectionProps {
    snapshot: ProfileSnapshot;
}

export function ValuesSection({ snapshot }: ValuesSectionProps) {
    // 1. Top Values (trait.values.*) - Sort by score desc, take top 5
    const values = Object.values(snapshot.traits)
        .filter(t => t.id.startsWith('trait.values.'))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // 2. Motivators (trait.motivation.*)
    const motivators = Object.values(snapshot.traits)
        .filter(t => t.id.startsWith('trait.motivation.'))
        .sort((a, b) => b.score - a.score);

    // 3. Alive When (field.values.alive_when)
    const aliveWhen = snapshot.fields?.['field.values.alive_when'];

    // 4. Anti-Values / No-Gos (tags or traits)
    // Looking for tags with 'misc' kind or specific ID pattern, or just traits with very low scores?
    // Spec says: Anti-Werte/No-Gos: `tags(kind=misc)` oder `traits` + threshold
    // Let's use low scoring value traits as anti-values for now + specific tags if present
    const antiValues = Object.values(snapshot.traits)
        .filter(t => t.id.startsWith('trait.values.') && t.score < 30)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);


    // Empty State Check
    const hasContent = values.length > 0 || motivators.length > 0 || aliveWhen;

    if (!hasContent) {
        return (
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center border-dashed group hover:bg-slate-900/60 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                    <Target size={24} />
                </div>
                <h3 className="text-white font-bold mb-2">Kernwerte & Motivation</h3>
                <p className="text-slate-500 text-sm mb-4 max-w-xs">Was treibt dich an? Wofür stehst du morgens auf? Finde deine inneren Kompass.</p>
                <button className="text-amber-400 text-sm font-medium hover:underline flex items-center gap-1">
                    Werte-Check starten <span className="text-xs">→</span>
                </button>
            </div>
        );
    }

    return (
        <section className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Target size={18} />
                </span>
                Werte & Antrieb
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Left Col: Values & Anti-Values */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Heart size={12} /> Top Werte
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {values.map((val, i) => (
                                <div key={val.id} className="flex items-center gap-2 bg-slate-800/50 border border-white/10 px-3 py-2 rounded-lg">
                                    <span className="text-amber-400 font-bold text-lg">{(i + 1)}.</span>
                                    <span className="text-white text-sm font-medium">
                                        {val.id.split('.').pop()?.replace(/_/g, ' ')}
                                        {/* Fallback formatting for ID if no label available */}
                                    </span>
                                    <div className="h-1 w-12 bg-slate-700 rounded-full ml-2 overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${val.score}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {antiValues.length > 0 && (
                        <div>
                            <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 mt-6">
                                <AlertCircle size={12} /> Anti-Werte (No-Gos)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {antiValues.map(val => (
                                    <span key={val.id} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded text-sm line-through decoration-red-500/50">
                                        {val.id.split('.').pop()?.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Motivation & Alive When */}
                <div className="space-y-6">
                    {aliveWhen && (
                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                            <h3 className="text-xs text-amber-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Quote size={12} /> Ich fühle mich lebendig, wenn...
                            </h3>
                            <p className="text-amber-100/90 italic text-sm leading-relaxed">
                                &quot;{Array.isArray(aliveWhen.value) ? aliveWhen.value.join(', ') : aliveWhen.value}&quot;
                            </p>
                        </div>
                    )}

                    {motivators.length > 0 && (
                        <div>
                            <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap size={12} /> Motivation
                            </h3>
                            <div className="space-y-3">
                                {motivators.map(mot => (
                                    <div key={mot.id}>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>{mot.id.split('.').pop()?.replace(/_/g, ' ')}</span>
                                            <span>{mot.score}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400"
                                                style={{ width: `${mot.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
