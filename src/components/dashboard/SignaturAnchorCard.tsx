import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/src/contexts/LanguageContext';

/**
 * Static "anchor" card on the dashboard that previews the user's Signatur
 * (dominant element + birth sign) and links to `/signatur` for the full
 * 3D experience.
 *
 * Performance-safe by design: NO WebGL on the dashboard. Users opt into
 * the 3D Chladni sphere by tapping the CTA — this matches Brief Option B
 * (preview + link). Option A (embedded R3F on dashboard) is deferred
 * until Option B is stable in prod.
 *
 * Empty state: when neither dominantElement nor birthSign is provided
 * (incomplete profile), shows `signatur.anchor.empty`.
 */
interface Props {
  dominantElement?: string;
  birthSign?: string;
}

export function SignaturAnchorCard({ dominantElement, birthSign }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const hasProfile = !!(dominantElement && birthSign);

  return (
    <section
      className="cosmic-tile p-6 rounded-[2rem] flex items-center gap-4"
      data-testid="signatur-anchor-card"
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ color: 'var(--tile-text-secondary)' }}
        >
          {t('signatur.anchor.title')}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
        >
          {hasProfile
            ? `${birthSign} · ${dominantElement}`
            : t('signatur.anchor.empty')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/signatur')}
        className="text-sm text-gold hover:text-gold/80 transition-colors whitespace-nowrap"
      >
        {t('signatur.anchor.cta')}
      </button>
    </section>
  );
}
