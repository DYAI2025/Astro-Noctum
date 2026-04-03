// src/components/dashboard/DashboardHeroNav.tsx
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

// ── Inline SVG Icons (no emoji, brand-aligned) ──────────────────────────────

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  );
}

function PillarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="4" height="18" rx="0.5" />
      <rect x="10" y="7" width="4" height="14" rx="0.5" />
      <rect x="17" y="5" width="4" height="16" rx="0.5" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  );
}

function ElementsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Pentagon representing 5 elements */}
      <polygon points="12,2 22,9 18,21 6,21 2,9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface DashboardHeroNavProps {
  sunSign: string;
  dominantElement: string;
  zodiacAnimal: string;
  onTileClick?: (id: 'western' | 'bazi' | 'wuxing') => void;
}

interface TileConfig {
  id: 'western' | 'bazi' | 'wuxing';
  labelKey: string;
  ariaKey: string;
  value: string;
  icon: ReactNode;
}

export function DashboardHeroNav({ sunSign, dominantElement, zodiacAnimal, onTileClick }: DashboardHeroNavProps) {
  const { t } = useLanguage();

  const tiles: TileConfig[] = [
    {
      id: 'western',
      labelKey: 'dashboard.heroNav.westernLabel',
      ariaKey: 'dashboard.heroNav.westernAria',
      value: sunSign || '—',
      icon: <SunIcon className="w-7 h-7" />,
    },
    {
      id: 'bazi',
      labelKey: 'dashboard.heroNav.baziLabel',
      ariaKey: 'dashboard.heroNav.baziAria',
      value: zodiacAnimal || '—',
      icon: <PillarIcon className="w-7 h-7" />,
    },
    {
      id: 'wuxing',
      labelKey: 'dashboard.heroNav.wuxingLabel',
      ariaKey: 'dashboard.heroNav.wuxingAria',
      value: dominantElement || '—',
      icon: <ElementsIcon className="w-7 h-7" />,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
    >
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          onClick={() => onTileClick?.(tile.id)}
          aria-label={t(tile.ariaKey)}
          className={[
            'group relative flex flex-col items-center justify-center',
            'gap-3 py-8 px-6 rounded-2xl w-full cosmic-tile',
            'hover:border-[var(--tile-accent)]',
            'transition-all duration-300 cursor-pointer',
          ].join(' ')}
        >
          {/* Icon */}
          <div className="transition-colors duration-300" style={{ color: 'var(--tile-accent)', opacity: 0.65 }}>
            {tile.icon}
          </div>

          {/* Label */}
          <p className="text-[9px] font-sans uppercase tracking-[0.35em] transition-colors duration-300" style={{ color: 'var(--tile-accent)', opacity: 0.6 }}>
            {t(tile.labelKey)}
          </p>

          {/* Value */}
          <p className="font-serif text-lg transition-colors duration-300" style={{ color: 'var(--tile-text-primary)' }}>
            {tile.value}
          </p>

          {/* Open hint */}
          <span aria-hidden="true" className="text-xs transition-colors duration-300" style={{ color: 'var(--tile-accent)', opacity: 0.3 }}>
            ↗
          </span>
        </button>
      ))}
    </motion.div>
  );
}
