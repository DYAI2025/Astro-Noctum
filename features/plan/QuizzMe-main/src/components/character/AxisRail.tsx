
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { calcAnimationDuration, createMoverGlowAnimation } from '@/utils/deltaAnimations';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AxisRailProps {
    leftLabel: string;
    rightLabel: string;
    value: number; // 0..1, 0.5 is center
    delta?: number;
    delay?: number;
    isTopMover?: boolean; // Whether this axis is in top 3 movers
}

/**
 * AxisRail Component
 *
 * Displays a bipolar climate axis with sliding marker
 * Supports delta-driven animations and top mover highlighting
 *
 * Based on spec T3.3 with Phase 4 enhancements
 */
export function AxisRail({
    leftLabel,
    rightLabel,
    value,
    delta,
    delay = 0,
    isTopMover = false,
}: AxisRailProps) {
    // Clamp value to 0..1
    const safeValue = Math.max(0, Math.min(1, value));

    // Detect reduced motion preference
    const prefersReducedMotion = useReducedMotion();

    // Calculate delta-driven animation duration with reduced motion support
    const animationDuration = useMemo(() => {
        if (!delta || Math.abs(delta) < 0.001) {
            return prefersReducedMotion ? 0.25 : 0.8;
        }
        const magnitude = Math.abs(delta);
        return calcAnimationDuration(magnitude, prefersReducedMotion);
    }, [delta, prefersReducedMotion]);

    // Mover highlight animation config (skip in reduced motion)
    const markerGlowAnimation = (isTopMover && !prefersReducedMotion) ? createMoverGlowAnimation() : {};

    return (
        <div className="flex flex-col mb-4">
            <div className="flex justify-between text-xs font-serif text-text-ink-muted uppercase tracking-wider mb-1.5 px-1">
                <span className={safeValue < 0.4 ? 'text-text-ink font-semibold' : ''}>
                    {leftLabel}
                </span>
                <span className={safeValue > 0.6 ? 'text-text-ink font-semibold' : ''}>
                    {rightLabel}
                </span>
            </div>

            <div className="relative h-2.5 w-full bg-parchment-dark rounded-full overflow-hidden shadow-inner flex items-center">
                {/* Center Marker Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gold-muted z-0"></div>

                {/* Active Range Fill from center */}
                <motion.div
                    className="absolute top-0 bottom-0 bg-gold-muted/30"
                    initial={{ left: '50%', right: '50%' }}
                    animate={{
                        left: safeValue < 0.5 ? `${safeValue * 100}%` : '50%',
                        right: safeValue > 0.5 ? `${(1 - safeValue) * 100}%` : '50%',
                    }}
                    transition={{
                        duration: animationDuration,
                        delay,
                        ease: 'easeOut',
                    }}
                />

                {/* Thumb Marker - Delta-driven animation + glow for movers */}
                <motion.div
                    className="absolute w-3 h-3 bg-gold-primary border-2 border-white rounded-full shadow-md z-10"
                    initial={{ left: '50%' }}
                    animate={{ left: `${safeValue * 100}%` }}
                    transition={{
                        duration: animationDuration,
                        delay,
                        ease: 'easeOut',
                    }}
                    style={{ x: '-50%' }} // Center the thumb on the point
                    {...markerGlowAnimation}
                />
            </div>
        </div>
    );
}
