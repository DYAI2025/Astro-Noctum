'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatPillProps {
    label: string;
    value: number; // 0..100 integer
    delay?: number;
    className?: string;
}

/**
 * StatPill Component
 *
 * Displays a single derived stat as a pill with label and value
 * Used in DerivedStatsCard for secondary stats like vitality, willpower, chaos, harmony
 *
 * Based on spec from T3.5
 */
export function StatPill({ label, value, delay = 0, className = '' }: StatPillProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`flex flex-col items-center p-3 bg-parchment rounded-lg border border-gold-subtle/50 text-center hover:shadow-md transition-shadow ${className}`}
        >
            <span className="text-xs uppercase tracking-widest text-text-ink-muted mb-1 font-sans">
                {label}
            </span>
            <span className="text-2xl font-serif font-bold text-text-ink tabular-nums">
                {value}
            </span>
        </motion.div>
    );
}
