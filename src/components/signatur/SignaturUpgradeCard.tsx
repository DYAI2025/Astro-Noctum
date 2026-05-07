import { useLanguage } from '@/src/contexts/LanguageContext';
import { usePremium } from '@/src/hooks/usePremium';
import { UpgradeButton } from '@/src/components/UpgradeButton';

/**
 * Persistent upgrade card for the /signatur page.
 *
 * Mirrors the bottom upgrade card on the dashboard (`/`) but with
 * Signatur-scoped copy. Free users see ONE persistent CTA; premium users
 * see nothing (component returns null).
 *
 * The cluster-trigger PremiumUpgradeModal stays in place — it serves a
 * different intent (focused upsell when a free user taps a locked
 * cluster) and is owned by `SignaturPage` directly.
 */
export function SignaturUpgradeCard() {
  const { t } = useLanguage();
  const { isPremium } = usePremium();

  if (isPremium) return null;

  return (
    <section
      className="relative mx-auto w-full max-w-md px-4 pb-12 md:px-10"
      data-testid="signatur-upgrade-card"
    >
      <div className="glass-card flex flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:gap-6 sm:px-8 sm:py-8">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-ink">
            {t('signatur.upgradeCard.title')}
          </p>
          <p className="text-xs text-ink/50 mt-1">
            {t('signatur.upgradeCard.subtitle')}
          </p>
        </div>
        <UpgradeButton />
      </div>
    </section>
  );
}
