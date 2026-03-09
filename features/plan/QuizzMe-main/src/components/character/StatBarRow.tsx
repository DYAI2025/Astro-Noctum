'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { toPercent01 } from '@/domain/derivedStats';
import { calcAnimationDuration, createMoverGlowAnimation } from '@/utils/deltaAnimations';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StatBarRowProps {
    label: string;
    value: number; // 0..1
    delta?: number; // +/- change, e.g. 0.05
    colorClass?: string;
    showValue?: boolean;
    delay?: number;
    isTopMover?: boolean; // Whether this stat is in top 3 movers
}

/**
 * StatBarRow Component
 *
 * Displays a single core stat with:
 * - Horizontal progress bar
 * - Numeric value display
 * - Delta chip (if changed)
 * - Highlight glow for top movers
 * - Delta-driven animation duration
 *
 * Based on spec T3.2 with Phase 4 enhancements
 */
export function StatBarRow({
    label,
    value,
    delta,
    colorClass = 'bg-gold-gradient',
    showValue = true,
    delay = 0,
    isTopMover = false,
}: StatBarRowProps) {
    const percentage = toPercent01(value);
    const hasDelta = delta !== undefined && Math.abs(delta) > 0.001;
    const deltaPercent = hasDelta ? toPercent01(Math.abs(delta!)) : 0;
    const isPositive = delta! > 0;

    // Detect reduced motion preference
    const prefersReducedMotion = useReducedMotion();

    // Calculate delta-driven animation duration with reduced motion support
    const animationDuration = useMemo(() => {
        if (!hasDelta) return prefersReducedMotion ? 0.25 : 1;
        const magnitude = Math.abs(delta!);
        return calcAnimationDuration(magnitude, prefersReducedMotion);
    }, [hasDelta, delta, prefersReducedMotion]);

    // Mover highlight animation config (skip in reduced motion)
    const glowAnimation = (isTopMover && !prefersReducedMotion) ? createMoverGlowAnimation() : {};

    return (
        <motion.div
            className="flex flex-col gap-1 w-full mb-3 group"
            {...glowAnimation}
        >
            <div className="flex justify-between items-end mb-1">
                <span className="font-sans text-sm font-medium text-text-ink group-hover:text-gold-dark transition-colors">
                    {label}
                </span>

                <div className="flex items-center gap-2">
                    {/* Delta Pill - Shows for 2.5s then fades out */}
                    {hasDelta && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: [0.8, 1, 1, 0.8],
                            }}
                            transition={{
                                duration: 2.5,
                                times: [0, 0.2, 0.8, 1],
                                delay: delay + animationDuration,
                            }}
                            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                isPositive
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                            }`}
                        >
                            {isPositive ? '+' : '-'}
                            {deltaPercent}%
                        </motion.span>
                    )}

                    {/* Numeric Value */}
                    {showValue && (
                        <motion.span
                            className="font-sans text-sm font-bold tabular-nums text-text-ink-muted"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: delay + 0.2 }}
                        >
                            {percentage}%
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Track */}
            <div className="h-2 w-full bg-parchment-dark rounded-full overflow-hidden relative shadow-inner">
                {/* Fill - Delta-driven animation */}
                <motion.div
                    className={`h-full rounded-full ${colorClass}`}
                    style={{
                        background:
                            'linear-gradient(90deg, var(--alchemy-gold-dark) 0%, var(--alchemy-gold-primary) 100%)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        duration: animationDuration,
                        delay,
                        ease: 'easeOut',
                    }}
                />
            </div>
        </motion.div>
    );
}
