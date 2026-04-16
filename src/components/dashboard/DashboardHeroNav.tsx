import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ZodiacIcon, WuXingIcon, BaZiAnimalIcon } from '../animated-icons/CosmicSymbols';

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
      icon: <ZodiacIcon sign={sunSign} className="w-8 h-8" />,
    },
    {
      id: 'bazi',
      labelKey: 'dashboard.heroNav.baziLabel',
      ariaKey: 'dashboard.heroNav.baziAria',
      value: zodiacAnimal || '—',
      icon: <BaZiAnimalIcon animal={zodiacAnimal} className="w-8 h-8" />,
    },
    {
      id: 'wuxing',
      labelKey: 'dashboard.heroNav.wuxingLabel',
      ariaKey: 'dashboard.heroNav.wuxingAria',
      value: dominantElement || '—',
      icon: <WuXingIcon element={dominantElement} className="w-8 h-8" />,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
    >
      {tiles.map((tile) => {
        const glowClass = tile.id === 'western' ? 'glow-gold' :
                         tile.id === 'bazi' ? 'glow-green' :
                         tile.id === 'wuxing' ? (
                           tile.value.includes('Water') ? 'glow-blue' :
                           tile.value.includes('Wood') ? 'glow-green' :
                           tile.value.includes('Fire') ? 'glow-orange' :
                           tile.value.includes('Earth') ? 'glow-orange' :
                           tile.value.includes('Metal') ? 'glow-white' : 'glow-purple'
                         ) : '';

        return (
          <button
            key={tile.id}
            type="button"
            onClick={() => onTileClick?.(tile.id)}
            aria-label={t(tile.ariaKey)}
            className={[
              'group relative flex flex-col items-center justify-center',
              'gap-3 py-8 px-6 rounded-2xl w-full cosmic-tile',
              glowClass,
              'cursor-pointer',
            ].join(' ')}
          >
          {/* Icon */}
          <div className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" style={{ color: 'var(--tile-accent)' }}>
            {tile.icon}
          </div>

          {/* Label */}
          <p className="text-[9px] font-sans uppercase tracking-[0.35em] opacity-60 group-hover:opacity-90 transition-opacity duration-300" style={{ color: 'var(--tile-accent)' }}>
            {t(tile.labelKey)}
          </p>

          {/* Value */}
          <p className="font-serif text-lg transition-colors duration-300" style={{ color: 'var(--tile-text-primary)' }}>
            {tile.value}
          </p>

          {/* Open hint */}
          <span aria-hidden="true" className="text-xs opacity-30 group-hover:opacity-70 transition-opacity duration-300" style={{ color: 'var(--tile-accent)' }}>
            ↗
          </span>
        </button>
      )})}
    </motion.div>
  );
}
