import { Link } from 'react-router-dom';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import { SECTOR_DOMAINS, SECTOR_ARCHETYPAL_COLORS } from '../lib/fusion-ring/draw';

interface RingTeaserProps {
  signal: FusionRingSignal;
  lang: 'de' | 'en';
}

export function RingTeaserCard({ signal, lang }: RingTeaserProps) {
  const top3 = signal.sectors
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  const resolution = Math.round(signal.resolution * 100);

  return (
    <div className="morning-card p-6">
      <p className="text-sm font-medium text-[#1E2A3A]/80 mb-4">
        {lang === 'de' ? 'Dein Energieprofil' : 'Your Energy Profile'}
      </p>

      <div className="space-y-2 mb-4">
        {top3.map(({ val, idx }) => (
          <div key={idx} className="flex items-center gap-3 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: SECTOR_ARCHETYPAL_COLORS[idx] }}
            />
            <span className="text-[#1E2A3A]/55 flex-1">{SECTOR_DOMAINS[idx]}</span>
            <span className="font-mono text-[#8B6914]/70" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(val * 100)}%
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#1E2A3A]/35 mb-4">
        {lang === 'de' ? `Auflösung: ${resolution}%` : `Resolution: ${resolution}%`}
      </p>

      <Link
        to="/fu-ring"
        className="inline-block text-xs px-4 py-2 rounded border border-[#8B6914]/25 text-[#8B6914]/70 transition-colors hover:bg-[#8B6914]/8 hover:border-[#8B6914]/40 focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        {lang === 'de' ? 'Fu-Ring erkunden' : 'Explore Fu-Ring'}
      </Link>
    </div>
  );
}
