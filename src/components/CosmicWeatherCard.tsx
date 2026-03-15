/**
 * CosmicWeatherCard — Tageshoroskop Display
 *
 * Shows the daily horoscope headline, body, advice, and an intensity ring.
 * Freemium users see the card. Premium users additionally see ring overlay.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { DailyHoroscope } from '@/src/lib/horoscope/types';

interface CosmicWeatherCardProps {
  horoscope: DailyHoroscope | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  lang: 'de' | 'en';
  isPremium?: boolean;
}

/** Intensity ring visualization — a thin SVG ring with colored sectors */
function IntensityRing({ sectors, size = 48 }: { sectors: number[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const strokeWidth = 3;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={1} className="text-[#8B6914]/10" />
      {/* Sector arcs */}
      {sectors.map((intensity, i) => {
        const startAngle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const endAngle = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        const opacity = 0.15 + intensity * 0.85;
        const color = intensity > 0.6
          ? `rgba(212, 175, 55, ${opacity})`
          : intensity > 0.3
          ? `rgba(139, 105, 20, ${opacity})`
          : `rgba(139, 105, 20, ${opacity * 0.5})`;

        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + intensity * 2}
            strokeLinecap="round"
          />
        );
      })}
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2} fill="currentColor" className="text-[#8B6914]/40" />
    </svg>
  );
}

export function CosmicWeatherCard({
  horoscope,
  loading,
  error,
  onRefresh,
  lang,
  isPremium,
}: CosmicWeatherCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading && !horoscope) {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl border border-[#8B6914]/15 bg-white/50 backdrop-blur-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#8B6914]/5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-[#8B6914]/10 rounded animate-pulse" />
            <div className="h-2 w-1/2 bg-[#8B6914]/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !horoscope) {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl border border-red-200 bg-red-50/50 p-4">
        <p className="text-xs text-red-600/70">
          {lang === 'de' ? 'Horoskop konnte nicht geladen werden.' : 'Could not load horoscope.'}
        </p>
      </div>
    );
  }

  if (!horoscope) return null;

  const sectorIntensities = Array.from({ length: 12 }, (_, i) =>
    horoscope.active_sectors.includes(i) ? 0.7 : 0.15
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto"
    >
      <div className="rounded-2xl border border-[#8B6914]/15 bg-white/60 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-start gap-3 text-left hover:bg-[#8B6914]/3 transition-colors"
        >
          <IntensityRing sectors={sectorIntensities} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[8px] uppercase tracking-[0.3em] text-[#8B6914]/50 font-mono">
                {lang === 'de' ? 'Kosmisches Wetter' : 'Cosmic Weather'}
              </span>
              {isPremium && (
                <span className="text-[7px] uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-full">
                  Levi
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-[#1E2A3A]/80 leading-tight">
              {horoscope.headline}
            </p>
          </div>

          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-[#8B6914]/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8B6914]/40" />
            )}
          </div>
        </button>

        {/* Expandable Body */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                <div className="w-8 h-[1px] bg-[#8B6914]/15" />

                {/* Body text */}
                <p className="text-xs text-[#1E2A3A]/60 leading-relaxed">
                  {horoscope.body}
                </p>

                {/* Advice */}
                <div className="flex items-start gap-2 bg-[#8B6914]/5 rounded-xl p-3">
                  <span className="text-[#D4AF37] text-sm mt-0.5">✦</span>
                  <p className="text-xs text-[#1E2A3A]/70 leading-relaxed italic">
                    {horoscope.advice}
                  </p>
                </div>

                {/* Refresh + timestamp */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[8px] text-[#8B6914]/30 font-mono tracking-wider">
                    {horoscope.tier === 'premium' ? 'LEVI PREMIUM' : 'FREEMIUM'}
                  </span>

                  {onRefresh && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefresh();
                      }}
                      className="text-[#8B6914]/30 hover:text-[#8B6914]/60 transition-colors p-1"
                      title={lang === 'de' ? 'Aktualisieren' : 'Refresh'}
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
