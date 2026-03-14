import { useState } from "react";
import { authedFetch } from "@/src/lib/authedFetch";
import { usePremium } from "@/src/hooks/usePremium";

/** Small link that opens the Stripe Customer Portal for premium users. */
export function ManageSubscription({ className = "" }: { className?: string }) {
  const { isPremium, loading } = usePremium();
  const [redirecting, setRedirecting] = useState(false);

  if (loading || !isPremium) return null;

  const handleManage = async () => {
    setRedirecting(true);
    try {
      const res = await authedFetch("/api/customer-portal", { method: "POST" });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else console.warn("[ManageSubscription] No portal URL:", error);
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
      {redirecting ? "..." : "Abo verwalten"}
    </button>
  );
}
