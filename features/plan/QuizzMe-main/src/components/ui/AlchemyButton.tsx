'use client';

import React from 'react';

/**
 * AlchemyButton Component
 * 
 * Gold-themed buttons following Modern Alchemy design.
 * Primary: Gold gradient fill
 * Secondary: Gold outline
 * Ghost: Minimal, text only
 */

interface AlchemyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

export function AlchemyButton({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props
}: AlchemyButtonProps) {
    // Size styles
    const sizeStyles = {
        sm: {
            padding: '0.5rem 1rem',
            fontSize: 'var(--text-sm)',
            gap: '0.375rem',
        },
        md: {
            padding: '0.75rem 1.5rem',
            fontSize: 'var(--text-base)',
            gap: '0.5rem',
        },
        lg: {
            padding: '1rem 2rem',
            fontSize: 'var(--text-lg)',
            gap: '0.625rem',
        },
    };

    // Variant styles
    const variantStyles = {
        primary: {
            background: 'linear-gradient(135deg, var(--alchemy-gold-light) 0%, var(--alchemy-gold-primary) 50%, var(--alchemy-gold-dark) 100%)',
            color: 'var(--alchemy-text-dark)',
            border: 'none',
            boxShadow: 'var(--shadow-md)',
        },
        secondary: {
            background: 'transparent',
            color: 'var(--alchemy-gold-primary)',
            border: '2px solid var(--alchemy-gold-primary)',
            boxShadow: 'none',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--alchemy-gold-primary)',
            border: 'none',
            boxShadow: 'none',
        },
    };

    const currentSize = sizeStyles[size];
    const currentVariant = variantStyles[variant];
    const isDisabled = disabled || loading;

    return (
        <button
            className={`
        inline-flex items-center justify-center
        font-sans font-medium
        rounded-lg
        transition-all duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
            style={{
                ...currentVariant,
                ...currentSize,
                fontFamily: 'var(--font-sans)',
                gap: currentSize.gap,
                ...(isDisabled ? {} : {}),
            }}
            disabled={isDisabled}
            onMouseEnter={!isDisabled ? (e) => {
                const target = e.currentTarget;
                if (variant === 'primary') {
                    target.style.boxShadow = 'var(--shadow-lg), var(--glow-gold-medium)';
                    target.style.transform = 'translateY(-1px)';
                } else if (variant === 'secondary') {
                    target.style.background = 'rgba(210, 169, 90, 0.1)';
                    target.style.boxShadow = 'var(--glow-gold-subtle)';
                } else {
                    target.style.color = 'var(--alchemy-gold-light)';
                }
            } : undefined}
            onMouseLeave={!isDisabled ? (e) => {
                const target = e.currentTarget;
                target.style.boxShadow = currentVariant.boxShadow;
                target.style.transform = 'translateY(0)';
                target.style.background = currentVariant.background;
                target.style.color = currentVariant.color;
            } : undefined}
            onMouseDown={!isDisabled ? (e) => {
                const target = e.currentTarget;
                target.style.transform = 'translateY(0)';
            } : undefined}
            {...props}
        >
            {loading ? (
                <span className="animate-spin mr-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="8" />
                    </svg>
                </span>
            ) : leftIcon ? (
                <span className="flex-shrink-0">{leftIcon}</span>
            ) : null}

            <span>{children}</span>

            {rightIcon && !loading && (
                <span className="flex-shrink-0">{rightIcon}</span>
            )}
        </button>
    );
}

/**
 * AlchemyLinkButton - Link styled as button
 */
interface AlchemyLinkButtonProps {
    href: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
    external?: boolean;
}

export function AlchemyLinkButton({
    href,
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    external = false,
}: AlchemyLinkButtonProps) {
    // Size styles
    const sizeStyles = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    // Variant styles
    const variantClasses = {
        primary: 'alchemy-btn alchemy-btn-primary',
        secondary: 'alchemy-btn alchemy-btn-secondary',
        ghost: 'text-gold-primary hover:text-gold-light',
    };

    return (
        <a
            href={href}
            className={`
        inline-flex items-center justify-center
        font-sans font-medium
        rounded-lg
        transition-all duration-300
        ${sizeStyles[size]}
        ${variantClasses[variant]}
        ${className}
      `}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
            {children}
        </a>
    );
}
