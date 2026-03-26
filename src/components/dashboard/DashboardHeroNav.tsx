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
}

interface TileConfig {
  id: string;
  anchor: string;
  labelDe: string;
  labelEn: string;
  ariaLabelDe: string;
  ariaLabelEn: string;
  value: string;
  icon: ReactNode;
}

export function DashboardHeroNav({ sunSign, dominantElement, zodiacAnimal }: DashboardHeroNavProps) {
  const { lang } = useLanguage();

  const tiles: TileConfig[] = [
    {
      id: 'western',
      anchor: '#section-western',
      labelDe: 'Sonnenzeichen',
      labelEn: 'Sun Sign',
      ariaLabelDe: 'Zur Westlichen Astrologie springen',
      ariaLabelEn: 'Jump to Western Astrology',
      value: sunSign || '—',
      icon: <SunIcon className="w-7 h-7" />,
    },
    {
      id: 'bazi',
      anchor: '#section-bazi',
      labelDe: 'BaZi',
      labelEn: 'BaZi',
      ariaLabelDe: 'Zu BaZi springen',
      ariaLabelEn: 'Jump to BaZi',
      value: zodiacAnimal || '—',
      icon: <PillarIcon className="w-7 h-7" />,
    },
    {
      id: 'wuxing',
      anchor: '#section-wuxing',
      labelDe: 'Wu Xing',
      labelEn: 'Wu Xing',
      ariaLabelDe: 'Zu Wu Xing springen',
      ariaLabelEn: 'Jump to Wu Xing',
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
        <a
          key={tile.id}
          href={tile.anchor}
          aria-label={lang === 'de' ? tile.ariaLabelDe : tile.ariaLabelEn}
          className={[
            'group relative flex flex-col items-center justify-center',
            'gap-3 py-8 px-6 rounded-2xl',
            'border border-[#D4AF37]/15 bg-[#00050A]/60 backdrop-blur-md',
            'hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5',
            'transition-all duration-300 cursor-pointer no-underline',
            'shadow-[0_0_0_0_rgba(212,175,55,0)] hover:shadow-[0_0_24px_0_rgba(212,175,55,0.08)]',
          ].join(' ')}
        >
          {/* Icon */}
          <div className="text-[#D4AF37]/60 group-hover:text-[#D4AF37]/90 transition-colors duration-300">
            {tile.icon}
          </div>

          {/* Label */}
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#D4AF37]/50 group-hover:text-[#D4AF37]/80 transition-colors duration-300">
            {lang === 'de' ? tile.labelDe : tile.labelEn}
          </p>

          {/* Value */}
          <p className="font-serif text-lg text-white/80 group-hover:text-white transition-colors duration-300">
            {tile.value}
          </p>

          {/* Arrow hint */}
          <span aria-hidden="true" className="text-[#D4AF37]/20 group-hover:text-[#D4AF37]/50 text-xs transition-colors duration-300">
            ↓
          </span>
        </a>
      ))}
    </motion.div>
  );
}
