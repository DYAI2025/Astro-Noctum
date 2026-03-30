/**
 * DashboardBigFour — Identity card showing the user's 4 key astrological markers.
 *
 * Replaces the old 3-tile DashboardHeroNav per wireframe F1.
 * 2x2 grid on mobile, 4-col row on desktop.
 *
 * Items:
 *  1. Sternzeichen  (Western sun sign)
 *  2. Mondzeichen   (Western moon sign)
 *  3. Aszendent     (Western ascendant)
 *  4. BaZi-Tier     (Chinese zodiac animal)
 */

import { motion } from 'motion/react';
import { Sun, Moon, ArrowUp, Orbit } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// ── Types ──────────────────────────────────────────────────────────────

export interface DashboardBigFourProps {
  sunSign?: string;
  moonSign?: string;
  ascendant?: string;
  baziAnimal?: string;
  onTileClick?: (id: 'sun' | 'moon' | 'asc' | 'bazi') => void;
}

// ── Tile config ────────────────────────────────────────────────────────

interface TileConfig {
  id: 'sun' | 'moon' | 'asc' | 'bazi';
  label: string;
  value: string;
  icon: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────

export function DashboardBigFour({
  sunSign,
  moonSign,
  ascendant,
  baziAnimal,
  onTileClick,
}: DashboardBigFourProps) {
  const { t } = useLanguage();

  const tiles: TileConfig[] = [
    {
      id: 'sun',
      label: t('dashboard.bigFour.sunSign') || 'Sternzeichen',
      value: sunSign || '\u2014',
      icon: <Sun className="w-5 h-5" />,
    },
    {
      id: 'moon',
      label: t('dashboard.bigFour.moonSign') || 'Mondzeichen',
      value: moonSign || '\u2014',
      icon: <Moon className="w-5 h-5" />,
    },
    {
      id: 'asc',
      label: t('dashboard.bigFour.ascendant') || 'Aszendent',
      value: ascendant || '\u2014',
      icon: <ArrowUp className="w-5 h-5" />,
    },
    {
      id: 'bazi',
      label: t('dashboard.bigFour.baziAnimal') || 'BaZi-Tier',
      value: baziAnimal || '\u2014',
      icon: <Orbit className="w-5 h-5" />,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
    >
      {tiles.map((tile, i) => (
        <button
          key={tile.id}
          type="button"
          onClick={() => onTileClick?.(tile.id)}
          className={[
            'group relative flex flex-col items-center justify-center',
            'gap-2 py-5 px-4 rounded-2xl w-full',
            'border border-[#D4AF37]/12 bg-[#00050A]/60 backdrop-blur-md',
            'hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/5',
            'transition-all duration-300 cursor-pointer',
          ].join(' ')}
        >
          {/* Icon */}
          <motion.div
            className="text-[#D4AF37]/50 group-hover:text-[#D4AF37]/80 transition-colors duration-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
          >
            {tile.icon}
          </motion.div>

          {/* Label */}
          <p className="text-[8px] uppercase tracking-[0.3em] text-[#D4AF37]/40 group-hover:text-[#D4AF37]/70 transition-colors duration-300">
            {tile.label}
          </p>

          {/* Value */}
          <p className="font-serif text-base text-white/80 group-hover:text-white transition-colors duration-300 truncate max-w-full">
            {tile.value}
          </p>
        </button>
      ))}
    </motion.div>
  );
}
