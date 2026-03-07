'use client';

import React from 'react';
import { AlchemyCard, AlchemyCardHeader, AlchemyCardTitle, AlchemyCardContent } from '@/components/ui/AlchemyCard';
import { StatBarRow } from './StatBarRow';
import { PsycheCoreStats } from '@/lib/types/psyche';
import { characterSheetCopy } from '@/content/character-sheet.de';
import { usePsycheProfile } from '@/hooks/usePsycheProfile';
import { isTopMover } from '@/utils/deltaAnimations';

interface CoreStatsCardProps {
    stats: PsycheCoreStats;
    deltas?: Partial<PsycheCoreStats>;
    className?: string;
}

/**
 * CoreStatsCard Component
 *
 * Displays 5 core personality stats with bars
 * Highlights top movers when delta is present
 *
 * Based on spec T3.1 with Phase 4 highlight rules
 */
export function CoreStatsCard({ stats, deltas, className = '' }: CoreStatsCardProps) {
    const { movers } = usePsycheProfile();

    const statKeys: Array<keyof PsycheCoreStats> = [
        'clarity',
        'courage',
        'connection',
        'order',
        'shadow',
    ];

    return (
        <AlchemyCard className={className} cornerOrnaments>
            <AlchemyCardHeader>
                <AlchemyCardTitle as="h3" className="text-lg">
                    {characterSheetCopy.sections.coreStats}
                </AlchemyCardTitle>
            </AlchemyCardHeader>
            <AlchemyCardContent>
                <div className="space-y-1">
                    {statKeys.map((key, index) => (
                        <StatBarRow
                            key={key}
                            label={characterSheetCopy.stats[key]}
                            value={stats[key]}
                            delta={deltas?.[key]}
                            delay={0.1 * (index + 1)}
                            isTopMover={isTopMover(movers, key)}
                        />
                    ))}
                </div>
            </AlchemyCardContent>
        </AlchemyCard>
    );
}
