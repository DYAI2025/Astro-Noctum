'use client';

import React from 'react';

/**
 * AlchemyCard Component
 * 
 * Cream/parchment background card with gold border
 * for "Modern Alchemy" grimoire-style UI elements.
 */

interface AlchemyCardProps {
    children: React.ReactNode;
    variant?: 'default' | 'parchment' | 'elevated';
    size?: 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    className?: string;
    as?: 'div' | 'article' | 'section';
}

// Ornament SVG (Corner Flourish - simplified placeholder)
const CornerOrnament = ({ className }: { className: string }) => (
    <svg viewBox="0 0 40 40" className={`absolute w-10 h-10 text-gold-muted opacity-40 pointer-events-none ${className}`} fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M5,35 L5,5 L35,5" />
        <circle cx="5" cy="5" r="2" fill="currentColor" />
    </svg>
);

export function AlchemyCard({
    children,
    variant = 'default',
    size = 'md',
    hoverable = false,
    cornerOrnaments = false,
    className = '',
    as: Component = 'div',
}: AlchemyCardProps & { cornerOrnaments?: boolean }) {
    // Size padding classes
    const sizeStyles = {
        sm: 'p-4',
        md: 'p-6 md:p-8',
        lg: 'p-8 md:p-12',
    };

    return (
        <Component
            className={`
        relative overflow-hidden
        rounded-2xl border
        ${sizeStyles[size]}
        ${hoverable ? 'transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'shadow-sm'}
        ${className}
      `}
            style={{
                background: variant === 'elevated' ? 'var(--bg-parchment-light)' : 'var(--bg-parchment)',
                borderColor: 'var(--border-gold-subtle)',
                color: 'var(--text-ink)',
            }}
        >
            {cornerOrnaments && (
                <>
                    <CornerOrnament className="top-2 left-2" />
                    <CornerOrnament className="top-2 right-2 rotate-90" />
                    <CornerOrnament className="bottom-2 right-2 rotate-180" />
                    <CornerOrnament className="bottom-2 left-2 -rotate-90" />
                </>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </Component>
    );
}

/**
 * AlchemyCardHeader - Optional header section for cards
 */
interface AlchemyCardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function AlchemyCardHeader({ children, className = '' }: AlchemyCardHeaderProps) {
    return (
        <div
            className={`border-b pb-4 mb-4 ${className}`}
            style={{ borderColor: 'var(--alchemy-gold-muted)' }}
        >
            {children}
        </div>
    );
}

/**
 * AlchemyCardTitle - Serif title for card headers
 */
interface AlchemyCardTitleProps {
    children: React.ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function AlchemyCardTitle({
    children,
    className = '',
    as: Component = 'h2'
}: AlchemyCardTitleProps) {
    return (
        <Component
            className={`font-serif font-semibold text-xl md:text-2xl ${className}`}
            style={{
                color: 'var(--alchemy-text-dark)',
                fontFamily: 'var(--font-serif)',
            }}
        >
            {children}
        </Component>
    );
}

/**
 * AlchemyCardContent - Main content area
 */
interface AlchemyCardContentProps {
    children: React.ReactNode;
    className?: string;
}

export function AlchemyCardContent({ children, className = '' }: AlchemyCardContentProps) {
    return (
        <div
            className={`font-sans ${className}`}
            style={{
                fontFamily: 'var(--font-sans)',
                lineHeight: 'var(--leading-relaxed)',
            }}
        >
            {children}
        </div>
    );
}

/**
 * AlchemyCardFooter - Optional footer with actions
 */
interface AlchemyCardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function AlchemyCardFooter({ children, className = '' }: AlchemyCardFooterProps) {
    return (
        <div
            className={`border-t pt-4 mt-4 flex items-center gap-4 ${className}`}
            style={{ borderColor: 'var(--alchemy-gold-muted)' }}
        >
            {children}
        </div>
    );
}
