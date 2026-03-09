
'use client';

import React from 'react';
import { AlchemyCard, AlchemyCardHeader, AlchemyCardTitle, AlchemyCardContent } from '@/components/ui/AlchemyCard';
import { StatPill } from './StatPill';
import { DerivedStats } from '@/lib/types/psyche';
import { characterSheetCopy } from '@/content/character-sheet.de';

interface DerivedStatsCardProps {
    stats: DerivedStats;
    className?: string;
}

export function DerivedStatsCard({ stats, className = '' }: DerivedStatsCardProps) {
    return (
        <AlchemyCard className={className} variant="elevated">
            <AlchemyCardHeader>
                <AlchemyCardTitle as="h3" className="text-lg">{characterSheetCopy.sections.derived}</AlchemyCardTitle>
            </AlchemyCardHeader>
            <AlchemyCardContent>
                <div className="grid grid-cols-2 gap-3">
                    <StatPill label={characterSheetCopy.derived.vitality} value={stats.vitality} delay={0.1} />
                    <StatPill label={characterSheetCopy.derived.willpower} value={stats.willpower} delay={0.2} />
                    <StatPill label={characterSheetCopy.derived.chaos} value={stats.chaos} delay={0.3} />
                    <StatPill label={characterSheetCopy.derived.harmony} value={stats.harmony} delay={0.4} />
                </div>
            </AlchemyCardContent>
        </AlchemyCard>
    );
}
