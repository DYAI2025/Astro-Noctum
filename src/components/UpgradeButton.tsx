import { useState } from "react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { trackEvent } from "@/src/lib/analytics";
import { authedFetch } from "@/src/lib/authedFetch";

interface Props {
  label?: string;
  className?: string;
}

export function UpgradeButton({ label, className }: Props) {
  const { t } = useLanguage();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState(false);

  const handleUpgrade = async () => {
    trackEvent('upgrade_clicked');
    setIsRedirecting(true);
    setError(false);
    try {
      const res = await authedFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setIsRedirecting(false);
        setError(true);
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
      else { setIsRedirecting(false); setError(true); }
    } catch {
      setIsRedirecting(false);
      setError(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={isRedirecting}
        className={className || "shrink-0 px-5 py-2.5 bg-[#D4AF37] text-[#00050A] text-sm font-semibold rounded-xl hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-60 disabled:cursor-wait"}
      >
        {isRedirecting ? "..." : (label || t("dashboard.premium.cta"))}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-400/80 text-center">
          {t("dashboard.premium.checkoutError")}
        </p>
      )}
    </>
  );
}
