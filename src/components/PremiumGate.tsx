import { usePremium } from "@/src/hooks/usePremium";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { UpgradeButton } from "./UpgradeButton";

interface Props {
  children: React.ReactNode;
  /** Override the default teaser text (otherwise uses t("dashboard.premium.teaser")) */
  teaser?: string;
  /** Override the CTA button label (otherwise uses t("dashboard.premium.cta")) */
  ctaLabel?: string;
}

export function PremiumGate({ children, teaser, ctaLabel }: Props) {
  const { isPremium } = usePremium();
  const { t } = useLanguage();

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian/70 rounded-2xl backdrop-blur-sm">
        <div className="text-center p-6 max-w-md">
          <h3 className="font-serif text-2xl text-gold mb-3">
            {t("dashboard.premium.title")}
          </h3>
          <p className="text-dawn/70 mb-5 text-sm leading-relaxed">
            {teaser || t("dashboard.premium.teaser")}
          </p>
          <UpgradeButton
            label={ctaLabel}
            className="px-6 py-3 bg-gold text-obsidian font-semibold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-wait"
          />
        </div>
      </div>
    </div>
  );
}
