import { useState } from "react";
import { authedFetch } from "@/src/lib/authedFetch";
import { usePremium } from "@/src/hooks/usePremium";
import { useLanguage } from "@/src/contexts/LanguageContext";

/** Small link that opens the Stripe Customer Portal for premium users. */
export function ManageSubscription({ className = "" }: { className?: string }) {
  const { isPremium, loading } = usePremium();
  const { lang } = useLanguage();
  const [redirecting, setRedirecting] = useState(false);

  if (loading || !isPremium) return null;

  const handleManage = async () => {
    setRedirecting(true);
    try {
      const res = await authedFetch("/api/customer-portal", { method: "POST" });
      const payload = await res.json().catch(() => ({} as Record<string, string>));
      if (!res.ok) {
        console.warn("[ManageSubscription] Portal request failed:", payload?.error || res.status);
        return;
      }
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }
      console.warn("[ManageSubscription] No portal URL in response");
    } catch (err) {
      console.error("[ManageSubscription] Error:", err);
    } finally {
      setRedirecting(false);
    }
  };

  return (
    <button
      onClick={handleManage}
      disabled={redirecting}
      className={`text-xs text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-wait ${className}`}
    >
      {redirecting ? "..." : (lang === "de" ? "Zahlung verwalten" : "Manage billing")}
    </button>
  );
}
