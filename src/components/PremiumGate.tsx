import { Lock } from "lucide-react";
import { usePremium } from "@/src/hooks/usePremium";
import { useLanguage } from "@/src/contexts/LanguageContext";

interface Props {
  children: React.ReactNode;
  /** Override the default teaser text (otherwise uses t("dashboard.premium.teaser")). */
  teaser?: string;
  // No ctaLabel — gate is info-only and never renders a button.
  // The single prime upgrade CTA lives at the bottom of the dashboard.
}

export function PremiumGate({ children, teaser }: Props) {
  const { isPremium } = usePremium();
  const { t } = useLanguage();

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative" data-testid="premium-gate-locked">
      <div
        className="blur-sm pointer-events-none select-none opacity-60"
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian/70 rounded-2xl backdrop-blur-sm">
        <div className="text-center p-6 max-w-md">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-gold/15 border border-gold/30 p-3">
              <Lock className="h-5 w-5 text-gold" aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs font-medium tracking-wider uppercase text-gold mb-2">
            {t("dashboard.premium.lockLabel")}
          </p>
          <p className="text-dawn/70 text-sm leading-relaxed mb-3">
            {teaser || t("dashboard.premium.teaser")}
          </p>
          <p className="text-dawn/40 text-xs">
            {t("dashboard.premium.unlockHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
