
'use client';

import React from 'react';
import { AlchemyCard, AlchemyCardContent } from '@/components/ui/AlchemyCard';
import { characterSheetCopy } from '@/content/character-sheet.de';

interface ArchetypeStoryCardProps {
    archetype?: string;
    secondary?: string[];
    snippet?: string;
    className?: string;
}

export function ArchetypeStoryCard({ archetype, snippet, className = '' }: ArchetypeStoryCardProps) {
    if (!archetype && !snippet) return null;

    return (
        <AlchemyCard className={className} variant="parchment" cornerOrnaments>
            <AlchemyCardContent>
                <div className="flex flex-col items-center text-center space-y-4 py-2">
                    {/* Archetype Badge */}
                    {archetype && (
                        <div className="space-y-1">
                            <span className="text-xs font-sans uppercase tracking-widest text-gold-dark">{characterSheetCopy.sections.archetype}</span>
                            <h3 className="text-2xl font-serif font-bold text-text-ink">{archetype}</h3>
                        </div>
                    )}

                    {/* Secondary Archetypes (Optional - currently unused props removed from destructuring) */}

                    {/* Divider */}
                    <div className="w-16 h-px bg-gold-muted/50 my-2"></div>

                    {/* Narrative Snippet */}
                    {snippet && (
                        <p className="font-serif italic text-lg text-text-ink-muted leading-relaxed max-w-prose">
                            „{snippet}“
                        </p>
                    )}
                </div>
            </AlchemyCardContent>
        </AlchemyCard>
    );
}
