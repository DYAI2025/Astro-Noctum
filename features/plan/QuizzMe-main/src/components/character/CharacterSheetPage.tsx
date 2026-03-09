'use client';

import React, { useMemo } from 'react';
import { usePsycheProfile } from '@/hooks/usePsycheProfile';
import { calcDerivedStats } from '@/domain/derivedStats';
import { CoreStatsCard } from './CoreStatsCard';
import { ClimateCard } from './ClimateCard';
import { DerivedStatsCard } from './DerivedStatsCard';
import { ArchetypeStoryCard } from './ArchetypeStoryCard';
import { MetaBadgesRow } from './MetaBadgesRow';
import { AfterQuizDeltaBanner } from './AfterQuizDeltaBanner';
import { OrnamentLayer } from '@/components/ornaments/OrnamentLayer';
import { characterSheetCopy } from '@/content/character-sheet.de';

/**
 * CharacterSheetPage Component
 *
 * Main wrapper component for the character sheet view
 * Implements responsive 2-column grid (Desktop) / stack (Mobile)
 *
 * Layout:
 * - Desktop: 12-column grid with 7/5 split
 * - Mobile: Single column stack
 *
 * Based on spec T3.1 and overall Phase 3 design
 */
export function CharacterSheetPage() {
    const { profile, isLoading, error } = usePsycheProfile();

    const derivedStats = useMemo(() => {
        if (!profile) return null;
        return calcDerivedStats(profile.stats);
    }, [profile]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-emerald">
                <div className="animate-pulse text-gold-primary font-serif text-xl">
                    Grimoire wird geöffnet...
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-emerald">
                <div className="text-red-400 font-sans">
                    Fehler beim Laden des Profils.
                </div>
            </div>
        );
    }

    return (
        <main className="relative min-h-screen bg-bg-emerald text-text-ink pb-20">
            {/* Ornament Background Layer */}
            <OrnamentLayer />

            {/* Header Section */}
            <header className="relative z-10 pt-20 pb-10 px-4 text-center">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-text-light mb-3 text-gold-gradient">
                    {characterSheetCopy.header.title}
                </h1>
                <p className="font-sans text-text-light-muted max-w-lg mx-auto">
                    {characterSheetCopy.header.subtitle}
                </p>
            </header>

            {/* Main Content Grid */}
            <div className="relative z-10 container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                    {/* LEFT COLUMN (Core & Climate) - Span 7 */}
                    <div className="lg:col-span-7 space-y-6">
                        <CoreStatsCard
                            stats={profile.stats}
                            deltas={profile.last_delta?.stats_delta}
                        />
                        <ClimateCard
                            state={profile.state}
                            deltas={profile.last_delta?.state_delta}
                        />
                    </div>

                    {/* RIGHT COLUMN (Archetype, Derived, Meta) - Span 5 */}
                    <div className="lg:col-span-5 space-y-6">
                        <ArchetypeStoryCard
                            archetype={profile.archetype_params?.dominant_archetype}
                            secondary={profile.archetype_params?.secondary_archetypes}
                            snippet={profile.narrative_snippet}
                        />

                        {derivedStats && (
                            <DerivedStatsCard stats={derivedStats} />
                        )}

                        {/* Meta Badges */}
                        {profile.meta_stats && (
                            <MetaBadgesRow meta={profile.meta_stats} className="mt-4" />
                        )}
                    </div>
                </div>
            </div>

            {/* After-Quiz Delta Banner (floating at top) */}
            <AfterQuizDeltaBanner />
        </main>
    );
}
