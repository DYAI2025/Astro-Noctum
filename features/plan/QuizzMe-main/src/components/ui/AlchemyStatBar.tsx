'use client';

import React from 'react';

/**
 * AlchemyStatBar Component
 * 
 * Horizontal stat bar for results and character sheet.
 * Shows personality traits as percentage bars with gold fill.
 */

interface AlchemyStatBarProps {
    label: string;
    value: number; // 0-100
    icon?: React.ReactNode;
    showValue?: boolean;
    variant?: 'default' | 'compact' | 'detailed';
    className?: string;
}

export function AlchemyStatBar({
    label,
    value,
    icon,
    showValue = true,
    variant = 'default',
    className = '',
}: AlchemyStatBarProps) {
    const percentage = Math.min(Math.max(value, 0), 100);

    if (variant === 'compact') {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                {icon && (
                    <span style={{ color: 'var(--alchemy-gold-primary)' }}>{icon}</span>
                )}
                <span
                    className="text-sm font-medium min-w-20"
                    style={{
                        fontFamily: 'var(--font-sans)',
                        color: 'var(--alchemy-text-dark)',
                    }}
                >
                    {label}
                </span>
                <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--alchemy-parchment)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, var(--alchemy-gold-dark) 0%, var(--alchemy-gold-primary) 100%)',
                        }}
                    />
                </div>
                {showValue && (
                    <span
                        className="text-sm font-medium w-10 text-right"
                        style={{
                            fontFamily: 'var(--font-sans)',
                            color: 'var(--alchemy-gold-dark)',
                        }}
                    >
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        );
    }

    if (variant === 'detailed') {
        return (
            <div className={`${className}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {icon && (
                            <span style={{ color: 'var(--alchemy-gold-primary)' }}>{icon}</span>
                        )}
                        <span
                            className="font-medium"
                            style={{
                                fontFamily: 'var(--font-sans)',
                                color: 'var(--alchemy-text-dark)',
                            }}
                        >
                            {label}
                        </span>
                    </div>
                    {showValue && (
                        <span
                            className="text-lg font-semibold"
                            style={{
                                fontFamily: 'var(--font-serif)',
                                color: 'var(--alchemy-gold-primary)',
                            }}
                        >
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
                <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: 'var(--alchemy-parchment)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, var(--alchemy-gold-dark) 0%, var(--alchemy-gold-primary) 50%, var(--alchemy-gold-light) 100%)',
                            boxShadow: '0 0 6px rgba(210, 169, 90, 0.3)',
                        }}
                    />
                </div>
            </div>
        );
    }

    // Default variant
    return (
        <div className={`flex items-center gap-4 ${className}`}>
            {icon && (
                <div
                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{
                        background: 'rgba(210, 169, 90, 0.15)',
                        color: 'var(--alchemy-gold-primary)',
                    }}
                >
                    {icon}
                </div>
            )}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span
                        className="text-sm font-medium"
                        style={{
                            fontFamily: 'var(--font-sans)',
                            color: 'var(--alchemy-text-dark)',
                        }}
                    >
                        {label}
                    </span>
                    {showValue && (
                        <span
                            className="text-sm font-semibold"
                            style={{
                                fontFamily: 'var(--font-sans)',
                                color: 'var(--alchemy-gold-dark)',
                            }}
                        >
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
                <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--alchemy-parchment)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, var(--alchemy-gold-dark) 0%, var(--alchemy-gold-primary) 100%)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * AlchemyStatsGrid - Grid of stat bars
 */
interface Stat {
    label: string;
    value: number;
    icon?: React.ReactNode;
}

interface AlchemyStatsGridProps {
    stats: Stat[];
    columns?: 1 | 2;
    variant?: 'default' | 'compact' | 'detailed';
    className?: string;
}

export function AlchemyStatsGrid({
    stats,
    columns = 1,
    variant = 'default',
    className = '',
}: AlchemyStatsGridProps) {
    return (
        <div
            className={`grid gap-4 ${columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1'} ${className}`}
        >
            {stats.map((stat, index) => (
                <AlchemyStatBar
                    key={stat.label + index}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    variant={variant}
                />
            ))}
        </div>
    );
}
