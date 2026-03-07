'use client';

import React from 'react';
import { MetaStats } from '@/lib/types/psyche';
import { characterSheetCopy } from '@/content/character-sheet.de';

interface MetaBadgesRowProps {
    meta?: MetaStats;
    className?: string;
}

/**
 * MetaBadgesRow Component
 *
 * Displays meta-stats as badge chips:
 * - Intensity (quiet/noticeable/intense)
 * - Tempo (calm/dynamic/volatile)
 * - Shadow confirmation (only if confidence >= 0.65)
 *
 * Based on spec from T3.4
 */
export function MetaBadgesRow({ meta, className = '' }: MetaBadgesRowProps) {
    if (!meta) return null;

    const intensityColors = {
        quiet: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        noticeable: 'bg-gold-light/20 text-gold-dark border-gold-subtle',
        intense: 'bg-amber-100 text-amber-800 border-amber-300',
    };

    const tempoColors = {
        calm: 'bg-blue-50 text-blue-700 border-blue-200',
        dynamic: 'bg-purple-50 text-purple-700 border-purple-200',
        volatile: 'bg-red-50 text-red-700 border-red-200',
    };

    const showShadowBadge = meta.shadow_confirmed && meta.shadow_confidence >= 0.65;

    return (
        <div className={`flex flex-wrap gap-2 items-center ${className}`}>
            {/* Intensity Badge */}
            <div
                className={`px-3 py-1 rounded-full border text-xs font-sans uppercase tracking-wider ${intensityColors[meta.intensity]}`}
            >
                {meta.intensity === 'quiet' && 'Leise'}
                {meta.intensity === 'noticeable' && 'Spürbar'}
                {meta.intensity === 'intense' && 'Stark'}
            </div>

            {/* Tempo Badge */}
            <div
                className={`px-3 py-1 rounded-full border text-xs font-sans uppercase tracking-wider ${tempoColors[meta.tempo]}`}
            >
                {meta.tempo === 'calm' && 'Ruhig'}
                {meta.tempo === 'dynamic' && 'Beweglich'}
                {meta.tempo === 'volatile' && 'Dynamisch'}
            </div>

            {/* Shadow Confirmed Badge (conditional) */}
            {showShadowBadge && (
                <div className="px-3 py-1 rounded-full border text-xs font-sans uppercase tracking-wider bg-slate-100 text-slate-800 border-slate-300">
                    Schatten: Bestätigt
                </div>
            )}

            {/* Optional: Shadow Uncertain (muted or hidden) */}
            {!showShadowBadge && meta.shadow_confidence < 0.65 && (
                <div className="px-3 py-1 rounded-full border text-xs font-sans uppercase tracking-wider bg-slate-50 text-slate-400 border-slate-200">
                    Schatten: Unbestimmt
                </div>
            )}
        </div>
    );
}
