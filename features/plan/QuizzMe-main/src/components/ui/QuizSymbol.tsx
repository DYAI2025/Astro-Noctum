import React from 'react';

export type QuizSymbolVariant =
    | 'love'
    | 'social-role'
    | 'rpg'
    | 'personality'
    | 'celebrity'
    | 'destiny'
    | 'aura';

export type QuizSymbolSize = 'small' | 'medium' | 'large' | 'hero';
export type QuizSymbolState = 'default' | 'muted' | 'interactive' | 'cta';

interface QuizSymbolProps {
    variant: QuizSymbolVariant;
    size?: QuizSymbolSize;
    state?: QuizSymbolState;
    className?: string;
}

/**
 * QuizSymbol
 * 
 * Renders a "Glowing-Outlines" symbol with CSS-based glow effects from design tokens.
 * Supports 6 quiz types with distinct colors and multiple size/state variants.
 * 
 * @param variant - Which symbol to show (determines SVG source and glow color)
 * @param size - 'small' (20px) | 'medium' (40px) | 'large' (64px) | 'hero' (96px)
 * @param state - 'default' (subtle double glow) | 'muted' (very subtle) | 'interactive' (hover glow) | 'cta' (pulsing)
 */
export function QuizSymbol({
    variant,
    size = 'medium',
    state = 'default',
    className = ''
}: QuizSymbolProps) {

    const classes = [
        'quiz-symbol',
        `quiz-symbol--${variant}`,
        `quiz-symbol--${size}`,
        `quiz-symbol--${state}`,
        className
    ].filter(Boolean).join(' ');

    // Map variant to SVG file name
    const svgSrc = `/assets/symbol-${variant}.svg`;

    return (
        <div className={classes}>
            <svg
                className="w-full h-full"
                viewBox="0 0 128 128"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label={`${variant} quiz symbol`}
            >
                <image href={svgSrc} x="0" y="0" width="128" height="128" />
            </svg>
        </div>
    );
}