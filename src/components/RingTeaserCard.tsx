import { Link } from 'react-router-dom';
import FusionRing from './FusionRing';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import { SECTOR_DOMAINS } from '../lib/fusion-ring/draw';

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
      <div className="flex items-start gap-6">
        <div className="shrink-0 rounded-lg overflow-hidden" style={{ background: '#020509' }}>
          <FusionRing
            signal={signal}
            size={140}
            showLabels={false}
            showKorona={false}
            showTension={false}
            animated={false}
            withBackground
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1E2A3A]/80 mb-3">
            {lang === 'de' ? 'Dein Energieprofil' : 'Your Energy Profile'}
          </p>

          <div className="space-y-1.5 mb-4">
            {top3.map(({ val, idx }) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#1E2A3A]/55">
                <span className="font-mono w-8 text-right text-[#8B6914]/70" style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(val * 100)}%</span>
                <span>{SECTOR_DOMAINS[idx]}</span>
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
      </div>
    </div>
  );
}
