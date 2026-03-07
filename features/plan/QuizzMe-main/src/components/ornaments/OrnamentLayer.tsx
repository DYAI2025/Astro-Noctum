'use client';

import React from 'react';

/**
 * OrnamentLayer Component
 *
 * Provides subtle background ornamentation for the character sheet
 * Includes:
 * - Background watermark (constellation/star-map pattern) at very low opacity
 * - Optional divider flourishes
 *
 * Design goals:
 * - Opacity 4-8% to not interfere with readability
 * - Gold/subtle color palette
 * - Responsive and lightweight
 *
 * Based on spec T3.7 and T1.2
 */
export function OrnamentLayer() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Constellation Watermark Background */}
            <ConstellationWatermark />

            {/* Optional: Corner Flourishes for full-page layout */}
            <CornerFlourishes />
        </div>
    );
}

/**
 * ConstellationWatermark
 *
 * Subtle star/constellation pattern as background watermark
 * Uses very low opacity (4-8%) to maintain readability
 */
function ConstellationWatermark() {
    return (
        <svg
            className="absolute inset-0 w-full h-full opacity-[0.06]"
            viewBox="0 0 1200 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--alchemy-gold-primary)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--alchemy-gold-primary)" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Star points */}
            <circle cx="200" cy="150" r="2" fill="url(#starGlow)" />
            <circle cx="450" cy="100" r="1.5" fill="url(#starGlow)" />
            <circle cx="800" cy="200" r="2" fill="url(#starGlow)" />
            <circle cx="1000" cy="150" r="1" fill="url(#starGlow)" />
            <circle cx="300" cy="400" r="1.5" fill="url(#starGlow)" />
            <circle cx="600" cy="350" r="2" fill="url(#starGlow)" />
            <circle cx="900" cy="450" r="1.5" fill="url(#starGlow)" />
            <circle cx="150" cy="600" r="1" fill="url(#starGlow)" />
            <circle cx="500" cy="650" r="2" fill="url(#starGlow)" />
            <circle cx="850" cy="700" r="1.5" fill="url(#starGlow)" />

            {/* Constellation lines */}
            <path
                d="M200,150 L450,100 L800,200 M300,400 L600,350 L900,450 M150,600 L500,650 L850,700"
                stroke="var(--alchemy-gold-muted)"
                strokeWidth="0.5"
                opacity="0.3"
            />

            {/* Alchemy circles (subtle) */}
            <circle cx="600" cy="400" r="80" stroke="var(--alchemy-gold-muted)" strokeWidth="0.5" fill="none" opacity="0.2" />
            <circle cx="600" cy="400" r="60" stroke="var(--alchemy-gold-muted)" strokeWidth="0.3" fill="none" opacity="0.15" />
        </svg>
    );
}

/**
 * CornerFlourishes
 *
 * Decorative corner elements (optional)
 * Very subtle, only visible on large screens
 */
function CornerFlourishes() {
    return (
        <>
            {/* Top-left corner flourish */}
            <svg
                className="absolute top-0 left-0 w-32 h-32 opacity-[0.08] hidden lg:block"
                viewBox="0 0 100 100"
                fill="none"
                stroke="var(--alchemy-gold-dark)"
                strokeWidth="1"
            >
                <path d="M5,95 Q5,50 50,50 Q5,50 5,5" />
                <circle cx="5" cy="5" r="2" fill="var(--alchemy-gold-dark)" />
            </svg>

            {/* Top-right corner flourish */}
            <svg
                className="absolute top-0 right-0 w-32 h-32 opacity-[0.08] hidden lg:block rotate-90"
                viewBox="0 0 100 100"
                fill="none"
                stroke="var(--alchemy-gold-dark)"
                strokeWidth="1"
            >
                <path d="M5,95 Q5,50 50,50 Q5,50 5,5" />
                <circle cx="5" cy="5" r="2" fill="var(--alchemy-gold-dark)" />
            </svg>

            {/* Bottom-right corner flourish */}
            <svg
                className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.08] hidden lg:block rotate-180"
                viewBox="0 0 100 100"
                fill="none"
                stroke="var(--alchemy-gold-dark)"
                strokeWidth="1"
            >
                <path d="M5,95 Q5,50 50,50 Q5,50 5,5" />
                <circle cx="5" cy="5" r="2" fill="var(--alchemy-gold-dark)" />
            </svg>

            {/* Bottom-left corner flourish */}
            <svg
                className="absolute bottom-0 left-0 w-32 h-32 opacity-[0.08] hidden lg:block -rotate-90"
                viewBox="0 0 100 100"
                fill="none"
                stroke="var(--alchemy-gold-dark)"
                strokeWidth="1"
            >
                <path d="M5,95 Q5,50 50,50 Q5,50 5,5" />
                <circle cx="5" cy="5" r="2" fill="var(--alchemy-gold-dark)" />
            </svg>
        </>
    );
}
