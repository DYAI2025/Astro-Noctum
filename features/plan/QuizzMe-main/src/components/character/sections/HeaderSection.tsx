
import React from 'react';
import { ProfileSnapshot } from '@/lib/lme/types';
import { DynamicAvatar } from '@/components/avatar/DynamicAvatar';
import { Settings, Share2, Sparkles } from 'lucide-react';

interface HeaderSectionProps {
    snapshot: ProfileSnapshot;
}

export function HeaderSection({ snapshot }: HeaderSectionProps) {
    const { identity, psyche, astro } = snapshot;
    const archetype = psyche.archetypeMix[0]?.archetype?.name || "Der Unentdeckte";
    // const archetypeDesc = psyche.archetypeMix[0]?.archetype?.description || "Mache Tests, um dein wahres Ich zu enthüllen.";

    return (
        <section className="relative w-full flex flex-col items-center pt-12 pb-12 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full pointer-events-none" />

            {/* Avatar */}
            <div className="relative z-10 mb-8 group cursor-pointer transition-transform hover:scale-105 duration-700">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-blue-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <DynamicAvatar params={psyche.avatarParams as any} size={280} className="shadow-2xl shadow-purple-900/40 border-4 border-white/5" />

                {/* Level Badge (Mock) */}
                <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Lvl {snapshot.meta.completion.unlockCount + 1}</span>
                </div>
            </div>

            {/* Identity */}
            <div className="relative z-10 text-center max-w-lg mx-auto px-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    {identity.displayName || "Gast"}
                </h1>
                <p className="text-lg md:text-xl text-purple-200/80 font-medium mb-4 flex items-center justify-center gap-2">
                    <span className="opacity-50">✦</span>
                    {archetype}
                    <span className="opacity-50">✦</span>
                </p>

                {/* Astro/Cosmic Bar */}
                <div className="flex items-center justify-center gap-4 text-slate-400 text-sm mb-8 bg-slate-900/50 p-2 rounded-full border border-white/5 inline-flex backdrop-blur-md">
                    {astro?.western?.sunSign ? (
                        <span className="px-3 py-1 bg-white/5 rounded-full hover:bg-white/10 transition-colors cursor-help" title="Sonnenzeichen">
                            ☉ {astro.western.sunSign}
                        </span>
                    ) : (
                        <span className="px-3 py-1 opacity-50 border border-dashed border-slate-700 rounded-full">? Sternzeichen</span>
                    )}
                    <span className="w-px h-4 bg-white/10" />
                    {astro?.chinese?.animal ? (
                        <span className="px-3 py-1 bg-white/5 rounded-full hover:bg-white/10 transition-colors cursor-help" title="Chinesisches Zeichen">
                            🐉 {astro.chinese.animal}
                        </span>
                    ) : (
                        <span className="px-3 py-1 opacity-50 border border-dashed border-slate-700 rounded-full">? Tierkreis</span>
                    )}
                </div>

                <div className="flex justify-center gap-4">
                    <button className="p-3 rounded-full bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white" title="Profil bearbeiten">
                        <Settings size={20} />
                    </button>
                    <button className="p-3 rounded-full bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white" title="Teilen">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>
        </section>
    );
}
