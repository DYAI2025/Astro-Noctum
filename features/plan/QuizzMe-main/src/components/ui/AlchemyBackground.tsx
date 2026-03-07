'use client';

import React from 'react';

/**
 * AlchemyBackground Component
 * 
 * Modern Alchemy themed background with emerald-to-midnight gradient
 * and optional mystical decorative elements.
 */

interface AlchemyBackgroundProps {
    children: React.ReactNode;
    variant?: 'default' | 'radial' | 'minimal';
    withStars?: boolean;
    withBotanicals?: boolean;
    backgroundImage?: string;
    className?: string;
}

export function AlchemyBackground({
    children,
    variant = 'default',
    withStars = true,
    withBotanicals = false,
    backgroundImage,
    className = '',
}: AlchemyBackgroundProps) {
    const bgClass = variant === 'radial'
        ? 'alchemy-bg-radial'
        : variant === 'minimal'
            ? ''
            : 'alchemy-bg-dark';

    return (
        <div className={`relative min-h-screen overflow-hidden ${bgClass} ${className}`}>
            {/* Custom Background Image */}
            {backgroundImage && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.8 // Blend slightly with the base theme
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: variant === 'radial'
                        ? 'radial-gradient(ellipse at 50% 30%, rgba(5, 59, 63, 0.6) 0%, rgba(4, 23, 38, 0.85) 60%, rgba(2, 17, 26, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(5, 59, 63, 0.7) 0%, rgba(4, 23, 38, 0.85) 50%, rgba(2, 17, 26, 0.95) 100%)',
                    // Reduced opacity if image is present to let it shine through, but keeping text readable
                    opacity: backgroundImage ? 0.85 : 1
                }}
                aria-hidden="true"
            />

            {/* Subtle star pattern (only if no custom image or explicitly requested) */}
            {withStars && !backgroundImage && (
                <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                        backgroundImage: `
              radial-gradient(circle at 15% 20%, rgba(210, 169, 90, 0.3) 1px, transparent 1px),
              radial-gradient(circle at 85% 15%, rgba(210, 169, 90, 0.2) 1px, transparent 1px),
              radial-gradient(circle at 45% 80%, rgba(210, 169, 90, 0.25) 1px, transparent 1px),
              radial-gradient(circle at 70% 60%, rgba(210, 169, 90, 0.15) 1px, transparent 1px),
              radial-gradient(circle at 25% 55%, rgba(247, 243, 234, 0.2) 1px, transparent 1px),
              radial-gradient(circle at 90% 85%, rgba(247, 243, 234, 0.15) 1px, transparent 1px),
              radial-gradient(circle at 10% 75%, rgba(210, 169, 90, 0.2) 1px, transparent 1px),
              radial-gradient(circle at 60% 25%, rgba(247, 243, 234, 0.25) 1px, transparent 1px)
            `,
                        backgroundSize: '100% 100%',
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Botanical line art decorations (optional) */}
            {withBotanicals && (
                <>
                    {/* Left botanical */}
                    <svg
                        className="absolute left-0 bottom-0 w-32 md:w-48 h-auto opacity-10 pointer-events-none"
                        viewBox="0 0 100 200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        aria-hidden="true"
                    >
                        <path d="M50 200 Q30 150 50 100 Q70 50 50 0" className="text-gold-primary" style={{ stroke: '#D2A95A' }} />
                        <path d="M50 150 Q20 130 10 100" style={{ stroke: '#D2A95A' }} />
                        <path d="M50 120 Q80 100 90 70" style={{ stroke: '#D2A95A' }} />
                        <ellipse cx="10" cy="100" rx="8" ry="12" style={{ stroke: '#D2A95A' }} />
                        <ellipse cx="90" cy="70" rx="8" ry="12" style={{ stroke: '#D2A95A' }} />
                    </svg>

                    {/* Right botanical */}
                    <svg
                        className="absolute right-0 top-0 w-32 md:w-48 h-auto opacity-10 pointer-events-none transform rotate-180"
                        viewBox="0 0 100 200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        aria-hidden="true"
                    >
                        <path d="M50 200 Q30 150 50 100 Q70 50 50 0" style={{ stroke: '#D2A95A' }} />
                        <path d="M50 150 Q20 130 10 100" style={{ stroke: '#D2A95A' }} />
                        <path d="M50 120 Q80 100 90 70" style={{ stroke: '#D2A95A' }} />
                        <ellipse cx="10" cy="100" rx="8" ry="12" style={{ stroke: '#D2A95A' }} />
                        <ellipse cx="90" cy="70" rx="8" ry="12" style={{ stroke: '#D2A95A' }} />
                    </svg>
                </>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
