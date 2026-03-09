'use client';

import React from 'react';
import { AlchemyCard, AlchemyCardHeader, AlchemyCardTitle, AlchemyCardContent } from '@/components/ui/AlchemyCard';
import { AxisRail } from './AxisRail';
import { PsycheState } from '@/lib/types/psyche';
import { characterSheetCopy } from '@/content/character-sheet.de';
import { usePsycheProfile } from '@/hooks/usePsycheProfile';
import { isTopMover } from '@/utils/deltaAnimations';

interface ClimateCardProps {
    state: PsycheState;
    deltas?: Partial<PsycheState>;
    className?: string;
}

/**
 * ClimateCard Component
 *
 * Displays 5 climate axes with bipolar rails
 * Highlights top movers when delta is present
 *
 * Based on spec T3.3 with Phase 4 highlight rules
 */
export function ClimateCard({ state, deltas, className = '' }: ClimateCardProps) {
    const { movers } = usePsycheProfile();

    return (
        <AlchemyCard className={className}>
            <AlchemyCardHeader>
                <AlchemyCardTitle>{characterSheetCopy.sections.climate}</AlchemyCardTitle>
            </AlchemyCardHeader>
            <AlchemyCardContent>
                <div className="pt-2">
                    <AxisRail
                        leftLabel={characterSheetCopy.axes.shadow}
                        rightLabel={characterSheetCopy.axes.light}
                        value={state.shadow_light}
                        delta={deltas?.shadow_light}
                        delay={0.1}
                        isTopMover={isTopMover(movers, 'shadow_light')}
                    />
                    <AxisRail
                        leftLabel={characterSheetCopy.axes.cold}
                        rightLabel={characterSheetCopy.axes.warm}
                        value={state.cold_warm}
                        delta={deltas?.cold_warm}
                        delay={0.2}
                        isTopMover={isTopMover(movers, 'cold_warm')}
                    />
                    <AxisRail
                        leftLabel={characterSheetCopy.axes.surface}
                        rightLabel={characterSheetCopy.axes.depth}
                        value={state.surface_depth}
                        delay={0.3}
                        isTopMover={isTopMover(movers, 'surface_depth')}
                    />
                    <AxisRail
                        leftLabel={characterSheetCopy.axes.me}
                        rightLabel={characterSheetCopy.axes.we}
                        value={state.me_we}
                        delta={deltas?.me_we}
                        delay={0.4}
                        isTopMover={isTopMover(movers, 'me_we')}
                    />
                    <AxisRail
                        leftLabel={characterSheetCopy.axes.mind}
                        rightLabel={characterSheetCopy.axes.heart}
                        value={state.mind_heart}
                        delta={deltas?.mind_heart}
                        delay={0.5}
                        isTopMover={isTopMover(movers, 'mind_heart')}
                    />
                </div>
            </AlchemyCardContent>
        </AlchemyCard>
    );
}
