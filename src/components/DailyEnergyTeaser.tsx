import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';

interface DailyEnergyTeaserProps {
  signal: FusionRingSignal;
  lang: 'de' | 'en';
  isPremium: boolean;
}

export function DailyEnergyTeaser({ signal, lang, isPremium }: DailyEnergyTeaserProps) {
  const energy = useMemo(() => {
    const avg = signal.sectors.reduce((a, b) => a + b, 0) / signal.sectors.length;
    return Math.round(avg * 100);
  }, [signal]);

  return (
    <div className="morning-card p-5">
      <p className="text-sm font-medium text-[#1E2A3A]/80 mb-3">
        {lang === 'de' ? 'Dein Ringwetter heute' : 'Your Ring Weather Today'}
      </p>

      <div className="h-1.5 rounded-sm bg-[#1E2A3A]/06 mb-3 overflow-hidden">
        <div
          className="h-full rounded-sm transition-[width] duration-700"
          style={{
            width: `${energy}%`,
            background: '#D4AF37',
            opacity: 0.65,
          }}
        />
      </div>

      <p className="text-xs text-[#1E2A3A]/45 mb-4">
        {lang === 'de' ? `Energielevel: ${energy}%` : `Energy level: ${energy}%`}
      </p>

      {!isPremium && (
        <p className="text-[10px] text-[#1E2A3A]/30 mb-3 italic">
          {lang === 'de' ? 'Details im Fu-Ring verfügbar' : 'Details available in Fu-Ring'}
        </p>
      )}

      <Link
        to="/fu-ring"
        className="inline-block text-xs px-4 py-2 rounded border border-[#8B6914]/25 text-[#8B6914]/70 transition-colors hover:bg-[#8B6914]/8 hover:border-[#8B6914]/40 focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        {lang === 'de' ? 'Transit-Details' : 'Transit Details'}
      </Link>
    </div>
  );
}
