
import React from 'react';
import { ProfileSnapshot, TraitScore } from '@/lib/lme/types';

interface PersonalitySectionProps {
    snapshot: ProfileSnapshot;
}

const TraitSlider = ({ trait }: { trait: TraitScore }) => {
    // Labels for low/high end
    const getLabels = (id: string) => {
        if (id.includes('introversion') || id.includes('extroversion')) return ['Introvertiert', 'Extrovertiert'];
        if (id.includes('system')) return ['Systemisch', 'Narrativ'];
        return ['Niedrig', 'Hoch'];
    };

    const [leftLabel, rightLabel] = getLabels(trait.id);
    const percent = trait.score;

    return (
        <div className="mb-6 group">
            <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                <span>{leftLabel}</span>
                <span className="text-purple-400">{percent}%</span>
                <span>{rightLabel}</span>
            </div>
            <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                {/* Band markers */}
                <div className="absolute left-[20%] w-px h-full bg-slate-700/30" />
                <div className="absolute left-[40%] w-px h-full bg-slate-700/30" />
                <div className="absolute left-[60%] w-px h-full bg-slate-700/30" />
                <div className="absolute left-[80%] w-px h-full bg-slate-700/30" />

                {/* Fill */}
                <div
                    className="absolute h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-1"
                    style={{ width: `${percent}%` }}
                >
                    <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse" />
                </div>
            </div>
            {/* Confidence Dot */}
            <div className="flex justify-end mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${trait.confidence && trait.confidence > 0.7 ? 'bg-green-500/50' : 'bg-amber-500/50'}`} title={`Verlässlichkeit: ${(trait.confidence || 0) * 100}%`}></div>
            </div>
        </div>
    );
};

export function PersonalitySection({ snapshot }: PersonalitySectionProps) {
    const socialTraits = Object.values(snapshot.traits).filter(t => t.id.startsWith('trait.social'));
    const styles = snapshot.tags.filter(t => t.kind === 'style');

    if (socialTraits.length === 0 && styles.length === 0) {
        return (
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
                <h3 className="text-white font-bold mb-2">Persönlichkeit & Sozialbatterie</h3>
                <p className="text-slate-500 text-sm mb-4">Wie lädst du auf? Wie wirkst du auf andere?</p>
                <button className="text-purple-400 text-sm hover:underline">Quiz starten →</button>
            </div>
        );
    }

    return (
        <section className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">⚡</span>
                Persönlichkeit
            </h2>

            <div className="space-y-4">
                {socialTraits.map(trait => (
                    <TraitSlider key={trait.id} trait={trait} />
                ))}
            </div>

            {styles.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className="text-sm text-slate-500 uppercase tracking-widest mb-4">Vibe Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {styles.map(tag => (
                            <span key={tag.id} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">
                                #{tag.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
