
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePsycheProfile } from '@/hooks/usePsycheProfile';
import { characterSheetCopy } from '@/content/character-sheet.de';
import { toPercent01 } from '@/domain/derivedStats';

/**
 * AfterQuizDeltaBanner Component
 *
 * Displays a temporary notification at the top of the page showing
 * the top 1-3 dimensions that changed after quiz completion.
 *
 * Features:
 * - Auto-dismiss after 8-12s (configurable, default 10s)
 * - Manual dismiss via close button
 * - Shows top movers with delta values
 * - Slide down + fade in animation
 *
 * Based on spec T4.1 and Phase 4 requirements
 */
export function AfterQuizDeltaBanner() {
    const { showBanner, dismissBanner, movers } = usePsycheProfile();

    if (!showBanner || movers.length === 0) return null;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                >
                    <div className="bg-bg-parchment/95 backdrop-blur-sm border-2 border-gold-primary rounded-lg shadow-xl p-4 flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="text-base font-serif font-semibold text-text-ink mb-2">
                                {characterSheetCopy.banner.title}
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                                {movers.slice(0, 3).map((mover) => (
                                    <span
                                        key={mover.dimension}
                                        className="inline-flex items-center gap-1.5 text-sm bg-parchment-dark px-3 py-1 rounded-full border border-gold-subtle/50"
                                    >
                                        <span className="font-medium text-text-ink capitalize">
                                            {mover.dimension}
                                        </span>
                                        <span
                                            className={`font-bold tabular-nums ${
                                                mover.delta > 0
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                            }`}
                                        >
                                            {mover.delta > 0 ? '+' : ''}
                                            {toPercent01(Math.abs(mover.delta))}%
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={dismissBanner}
                            className="ml-4 p-2 text-text-ink-muted hover:text-text-ink hover:bg-gold-muted/10 rounded transition-colors"
                            aria-label="Banner schließen"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
