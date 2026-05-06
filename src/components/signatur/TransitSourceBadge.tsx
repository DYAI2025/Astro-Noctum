/**
 * Small transparency badge that tells the user whether the Signatur they
 * are looking at is driven by **live** transit data (FuFirE response) or
 * by a **fallback** (synthesized from their stored natal soulprint, or
 * pure neutral when no profile exists).
 *
 * Per the no-placeholder-fake directive, fallback state must be visually
 * indicated rather than silently presented as real transit data. The badge
 * is intentionally tiny and unobtrusive so it does not hijack attention
 * when everything is fine — on `source === 'live'` it renders nothing.
 */
import { useLanguage } from '@/src/contexts/LanguageContext';
import type { TransitSource } from '@/src/lib/schemas/transit-state';

interface TransitSourceBadgeProps {
  source: TransitSource;
  reason?: string;
  className?: string;
}

const COPY: Record<TransitSource, { de: { label: string; hint: string }; en: { label: string; hint: string } }> = {
  'live': {
    de: { label: 'Live', hint: '' },
    en: { label: 'Live', hint: '' },
  },
  'fallback-profile': {
    de: {
      label: 'Statische Natal-Signatur',
      hint: 'Live-Transits sind gerade nicht verfügbar — du siehst dein gespeichertes Natal-Muster, nicht den aktuellen Transit.',
    },
    en: {
      label: 'Static natal signature',
      hint: 'Live transits are currently unavailable — you are seeing your stored natal pattern, not today\u2019s transit.',
    },
  },
  'fallback-neutral': {
    de: {
      label: 'Neutrale Signatur',
      hint: 'Weder Transit noch Natal-Profil verfügbar — das Muster ist generisch und nicht an dich angepasst.',
    },
    en: {
      label: 'Neutral signature',
      hint: 'Neither transit nor natal profile available — the pattern is generic, not personalised.',
    },
  },
};

export function TransitSourceBadge({ source, reason, className }: TransitSourceBadgeProps) {
  const { lang } = useLanguage();
  if (source === 'live') return null;

  const copy = COPY[source][lang === 'de' ? 'de' : 'en'];
  const fullHint = reason ? `${copy.hint} (${reason})` : copy.hint;

  const toneClass =
    source === 'fallback-neutral'
      ? 'border-amber-400/40 bg-amber-950/30 text-amber-100'
      : 'border-white/15 bg-black/40 text-white/80';

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="transit-source-badge"
      data-source={source}
      title={fullHint}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide backdrop-blur-sm ${toneClass} ${className ?? ''}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          source === 'fallback-neutral' ? 'bg-amber-400' : 'bg-white/60'
        }`}
      />
      <span>{copy.label}</span>
    </div>
  );
}
