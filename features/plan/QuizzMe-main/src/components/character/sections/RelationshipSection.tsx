
import React from 'react';
import { ProfileSnapshot } from '@/lib/lme/types';
import { Heart, Shield, MessageCircle, Flame, Gift, Clock, Hammer, Anchor } from 'lucide-react';

interface RelationshipSectionProps {
    snapshot: ProfileSnapshot;
}

// Helper to map archetype IDs to Love Languages and Icons
const LOVE_ARCHETYPE_MAP: Record<string, { label: string; icon: React.ElementType; color: string; desc: string }> = {
    'the_poet': {
        label: 'Worte der Anerkennung',
        icon: MessageCircle,
        color: 'text-pink-400',
        desc: 'Du liebst durch Sprache und Ausdruck.'
    },
    'the_flame': {
        label: 'Körperliche Nähe',
        icon: Flame,
        color: 'text-red-500',
        desc: 'Berührung ist deine stärkste Verbindung.'
    },
    'the_architect': {
        label: 'Hilfsbereitschaft',
        icon: Hammer,
        color: 'text-blue-400',
        desc: 'Taten sagen mehr als Worte.'
    },
    'the_sanctuary': {
        label: 'Zweisamkeit',
        icon: Clock,
        color: 'text-purple-400',
        desc: 'Ungeteilte Zeit ist dein Geschenk.'
    },
    'the_keeper': {
        label: 'Geschenke',
        icon: Gift,
        color: 'text-amber-400',
        desc: 'Symbole der Zuneigung bedeuten dir alles.'
    },
    'the_lighthouse': {
        label: 'Freiheit & Konstanz',
        icon: Anchor,
        color: 'text-emerald-400',
        desc: 'Liebe braucht Raum zum Atmen.'
    },
};

export function RelationshipSection({ snapshot }: RelationshipSectionProps) {
    // 1. Identify dominant Love Language / Archetype
    const loveTrait = Object.values(snapshot.traits)
        .filter(t => t.id.startsWith('trait.lovelang.'))
        .sort((a, b) => b.score - a.score)[0];

    // Extract ID suffix (e.g. 'the_poet')
    const archetypeId = loveTrait ? loveTrait.id.split('.').pop() || '' : '';
    const archetypeData = LOVE_ARCHETYPE_MAP[archetypeId];
    // Fallback title from tag if available
    const resultTag = snapshot.tags.find(t => t.id === 'tag.lovelang.result');
    const displayTitle = resultTag?.label || (archetypeId ? archetypeId.replace('_', ' ') : 'Unbekannt');

    // 2. Free Text Fields
    const repairRitual = snapshot.fields?.['field.love.repair_ritual'];
    const boundaries = snapshot.fields?.['field.love.boundaries'];

    const hasContent = !!loveTrait;

    if (!hasContent) {
        return (
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center border-dashed group hover:bg-slate-900/60 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 mb-4 group-hover:scale-110 transition-transform">
                    <Heart size={24} />
                </div>
                <h3 className="text-white font-bold mb-2">Beziehung & Nähe</h3>
                <p className="text-slate-500 text-sm mb-4 max-w-xs">Finde heraus, wie du liebst und was du in Beziehungen wirklich brauchst.</p>
                <button className="text-pink-400 text-sm font-medium hover:underline flex items-center gap-1">
                    Love Language Test <span className="text-xs">→</span>
                </button>
            </div>
        );
    }

    const Icon = archetypeData?.icon || Heart;

    return (
        <section className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                <span className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                    <Heart size={18} />
                </span>
                Beziehung & Nähe
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">

                {/* Left: Hero Card (Archetype) */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 border border-white/10 ${archetypeData?.color || 'text-white'}`}>
                        <Icon size={32} />
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-1">{displayTitle}</h3>
                    {archetypeData && (
                        <>
                            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${archetypeData.color}`}>
                                {archetypeData.label}
                            </p>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                {archetypeData.desc}
                            </p>
                        </>
                    )}
                </div>

                {/* Right: Dynamics & Fields */}
                <div className="space-y-4">

                    {/* Placeholder interactives */}
                    <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <h4 className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Shield size={12} /> Boundaries (Grenzen)
                        </h4>
                        {boundaries ? (
                            <p className="text-slate-300 text-sm">{typeof boundaries.value === 'string' ? boundaries.value : boundaries.value.join(', ')}</p>
                        ) : (
                            <p className="text-slate-600 text-sm italic group-hover:text-slate-500 transition-colors">
                                + Was sind deine Dealbreaker?
                            </p>
                        )}
                    </div>

                    <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <h4 className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Heart size={12} /> Repair Ritual
                        </h4>
                        {repairRitual ? (
                            <p className="text-slate-300 text-sm">{typeof repairRitual.value === 'string' ? repairRitual.value : repairRitual.value.join(', ')}</p>
                        ) : (
                            <p className="text-slate-600 text-sm italic group-hover:text-slate-500 transition-colors">
                                + Wie versöhnst du dich am besten?
                            </p>
                        )}
                    </div>

                    {/* Fun Badge Area */}
                    <div className="pt-2">
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs rounded-lg">
                                💕 Romantik-Modus
                            </span>
                            <span className="px-2 py-1 bg-slate-700/50 border border-white/10 text-slate-400 text-xs rounded-lg border-dashed">
                                + Tag hinzufügen
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
