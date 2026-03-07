
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export type ActionTileVariant = 'gold' | 'mystic' | 'danger' | 'neutral';

interface ActionTileProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  href: string;
  variant?: ActionTileVariant;
  notification?: string;
  className?: string;
  backgroundImageSrc?: string;
}

/**
 * ActionTile ("Artifact")
 * 
 * Rich interactive tile for dashboard navigation.
 * Features hover effects, notification badges, and variant styling.
 */
export function ActionTile({
  title,
  subtitle,
  icon,
  href,
  variant = 'neutral',
  notification,
  className = '',
  backgroundImageSrc
}: ActionTileProps) {
  
  const variantStyles = {
    gold: 'border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-neutral-900/40',
    mystic: 'border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-neutral-900/40',
    danger: 'border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-neutral-900/40',
    neutral: 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/20'
  };

  return (
    <Link 
      href={href}
      className={`
        group relative block p-6 rounded-xl border backdrop-blur-md transition-all duration-300
        ${variantStyles[variant]}
        ${className}
        overflow-hidden
      `}
    >
      {/* Background Image (Optional) */}
      {backgroundImageSrc && (
        <>
            {/* Replaced inline background image with absolute img for better lint compliance */}
            <Image 
                src={backgroundImageSrc}
                alt=""
                fill
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60 grayscale group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </>
      )}

      {/* Notification Badge */}
      {notification && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse border border-neutral-950">
          {notification}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon Container */}
        {icon && (
          <div className={`
            p-3 rounded-lg bg-neutral-950/50 border border-white/5 
            group-hover:scale-110 transition-transform duration-300
            ${variant === 'gold' ? 'text-amber-500' : ''}
            ${variant === 'mystic' ? 'text-indigo-400' : ''}
            ${variant === 'danger' ? 'text-red-400' : ''}
            ${variant === 'neutral' ? 'text-neutral-400' : ''}
          `}>
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`
            text-lg font-serif font-medium mb-1 truncate
            ${variant === 'gold' ? 'text-amber-50' : 'text-neutral-100'}
          `}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-neutral-400 font-light leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Arrow (Changes per variant) */}
        <div className={`
          opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 self-center
          ${variant === 'gold' ? 'text-amber-500' : 'text-neutral-500'}
        `}>
          →
        </div>
      </div>
    </Link>
  );
}
