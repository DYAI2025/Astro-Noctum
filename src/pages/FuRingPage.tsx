import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAppLayout } from '@/src/contexts/AppLayoutContext';
import { FusionRing3D } from '@/src/components/fusion-ring-3d/FusionRing3D';

export default function FuRingPage() {
  const { t, lang } = useLanguage();
  const { userId } = useAppLayout();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020509] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(212,175,55,0.2),transparent_42%),radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_65%)]" />

      <section className="relative mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 pb-20 pt-10 md:px-10 md:pt-20">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
            aria-label={lang === 'de' ? 'Zurück zum Dashboard' : 'Back to dashboard'}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('furing3d.back')}
          </Link>

          <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/65">
            {t('furing3d.badge')}
          </div>
        </header>

        <div className="max-w-3xl space-y-4">
          <h1 className="font-serif text-3xl leading-tight text-[#D4AF37] md:text-5xl">
            {t('furing3d.title')}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            {t('furing3d.subtitle')}
          </p>
        </div>

        <FusionRing3D
          userId={userId}
          labels={{
            regionLabel: t('furing3d.a11y.regionLabel'),
            loading: t('furing3d.loading'),
            reducedMotionHint: t('furing3d.reducedMotionHint'),
            resolution: t('furing3d.resolutionLabel'),
            audioOn: t('furing3d.audioOn'),
            audioOff: t('furing3d.audioOff'),
            latestEvents: t('furing3d.latestEvents'),
            renderError: t('furing3d.renderError'),
            reload: t('furing3d.reload'),
            eventAnnouncePrefix: t('furing3d.eventAnnouncePrefix'),
          }}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
              <Sparkles className="h-3 w-3 text-[#D4AF37]" />
              {t('furing3d.cards.resonanceTitle')}
            </div>
            <p className="text-sm text-white/75">{t('furing3d.cards.resonanceText')}</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
              {t('furing3d.cards.spaceWeatherTitle')}
            </div>
            <p className="text-sm text-white/75">{t('furing3d.cards.spaceWeatherText')}</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
              {t('furing3d.cards.accessibilityTitle')}
            </div>
            <p className="text-sm text-white/75">{t('furing3d.cards.accessibilityText')}</p>
          </article>
        </div>
      </section>
    </div>
  );
}
