import { useLanguage } from "@/src/contexts/LanguageContext";
import {
  useUpgradeCheckout,
  type UpgradeCheckoutError,
} from "@/src/hooks/useUpgradeCheckout";

interface Props {
  label?: string;
  className?: string;
}

const ERROR_I18N_KEY: Record<UpgradeCheckoutError, string> = {
  auth_required: "dashboard.premium.errors.authRequired",
  already_premium: "dashboard.premium.errors.alreadyPremium",
  network: "dashboard.premium.errors.network",
  stripe_unavailable: "dashboard.premium.errors.stripeUnavailable",
  server: "dashboard.premium.errors.server",
  unknown: "dashboard.premium.errors.unknown",
};

export function UpgradeButton({ label, className }: Props) {
  const { t } = useLanguage();
  const { startUpgradeCheckout, isLoading, error } = useUpgradeCheckout();

  return (
    <>
      <button
        type="button"
        onClick={startUpgradeCheckout}
        disabled={isLoading}
        className={
          className ||
          "shrink-0 px-5 py-2.5 bg-[#D4AF37] text-[#00050A] text-sm font-semibold rounded-xl hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-60 disabled:cursor-wait"
        }
      >
        {isLoading ? "…" : label || t("dashboard.premium.cta")}
      </button>
      {error && (
        <p
          role="alert"
          data-testid="upgrade-button-error"
          className="mt-2 text-xs text-red-400/80 text-center"
        >
          {t(ERROR_I18N_KEY[error])}
        </p>
      )}
    </>
  );
}
