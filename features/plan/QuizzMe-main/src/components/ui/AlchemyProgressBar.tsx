'use client';

import React from 'react';

/**
 * AlchemyProgressBar Component
 * 
 * Thin golden progress bar for quiz flow.
 * Animates smoothly between states.
 */

interface AlchemyProgressBarProps {
    value: number; // 0-100
    max?: number;
    label?: string;
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function AlchemyProgressBar({
    value,
    max = 100,
    label,
    showPercentage = false,
    size = 'md',
    className = '',
}: AlchemyProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const heights = {
        sm: '2px',
        md: '4px',
        lg: '6px',
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Label and percentage */}
            {(label || showPercentage) && (
                <div className="flex justify-between items-center mb-2 text-sm">
                    {label && (
                        <span
                            style={{
                                color: 'var(--alchemy-text-light-muted)',
                                fontFamily: 'var(--font-sans)',
                            }}
                        >
                            {label}
                        </span>
                    )}
                    {showPercentage && (
                        <span
                            style={{
                                color: 'var(--alchemy-gold-primary)',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: 500,
                            }}
                        >
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            {/* Track */}
            <div
                className="w-full rounded-full overflow-hidden"
                style={{
                    height: heights[size],
                    background: 'rgba(210, 169, 90, 0.15)',
                }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                {/* Fill */}
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, var(--alchemy-gold-dark) 0%, var(--alchemy-gold-primary) 50%, var(--alchemy-gold-light) 100%)',
                        boxShadow: '0 0 8px rgba(210, 169, 90, 0.4)',
                        transition: 'width 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)',
                    }}
                />
            </div>
        </div>
    );
}

/**
 * QuizProgressIndicator - Specific for quiz flow
 */
interface QuizProgressIndicatorProps {
    currentQuestion: number;
    totalQuestions: number;
    className?: string;
}

export function QuizProgressIndicator({
    currentQuestion,
    totalQuestions,
    className = '',
}: QuizProgressIndicatorProps) {
    return (
        <div className={`w-full ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <span
                    className="text-sm"
                    style={{
                        color: 'var(--alchemy-text-light-muted)',
                        fontFamily: 'var(--font-sans)',
                    }}
                >
                    Frage {currentQuestion} von {totalQuestions}
                </span>
            </div>
            <AlchemyProgressBar
                value={currentQuestion}
                max={totalQuestions}
                size="sm"
            />
        </div>
    );
}
