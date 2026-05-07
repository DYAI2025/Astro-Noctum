import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { trackEvent } from "@/src/lib/analytics";
import { authedFetch } from "@/src/lib/authedFetch";

/**
 * Disambiguated client-side error keys for the upgrade-to-premium flow.
 *
 * Maps the server's mixed (legacy + structured) /api/checkout response
 * envelope onto a stable, typed surface that callers can render
 * specific copy for. Keys are also embedded into analytics event names
 * (`upgrade_checkout_error_<key>`).
 */
export type UpgradeCheckoutError =
  | "auth_required"
  | "already_premium"
  | "network"
  | "stripe_unavailable"
  | "server"
  | "unknown";

export type UseUpgradeCheckoutResult = {
  /**
   * Triggers the checkout flow. Idempotent while in flight: a second
   * call is a no-op and emits `upgrade_checkout_blocked_in_flight`.
   */
  startUpgradeCheckout: () => Promise<void>;
  /** True from the moment a click is accepted until success-redirect or error. */
  isLoading: boolean;
  /** Last error key, or null if none / cleared. */
  error: UpgradeCheckoutError | null;
  /** Resets `error` to null (for retry-after-dismiss UX). */
  clearError: () => void;
};

type StructuredEnvelope = {
  error?: { code?: string; message?: string };
  code?: string;
};

/**
 * Single owner of the upgrade-to-premium client side-effects:
 *
 *   - Optional client-side preflight (skip fetch if not authed)
 *   - POST /api/checkout via authedFetch
 *   - Maps server response (mixed legacy + structured envelope) onto
 *     6 typed UpgradeCheckoutError keys
 *   - Fires the upgrade_checkout_* analytics funnel
 *   - Redirects on success (window.location.href = body.url)
 *   - Re-entry guard: rage-clicks while loading are no-ops
 *
 * Anti-requirements: this hook never renders, never calls another
 * endpoint, never logs to console, and is the only place the client
 * speaks to /api/checkout.
 */
export function useUpgradeCheckout(): UseUpgradeCheckoutResult {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<UpgradeCheckoutError | null>(null);
  // useRef gives us a synchronous in-flight flag that doesn't race
  // with React's state batching when two clicks land in the same tick.
  const inFlightRef = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fail = useCallback((key: UpgradeCheckoutError) => {
    setError(key);
    setIsLoading(false);
    inFlightRef.current = false;
    trackEvent(`upgrade_checkout_error_${key}` as const);
  }, []);

  const startUpgradeCheckout = useCallback(async () => {
    // Re-entry guard fires before any analytics: a blocked click is
    // not a "click", it's a duplicate of one already in flight.
    if (inFlightRef.current) {
      trackEvent("upgrade_checkout_blocked_in_flight");
      return;
    }
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    // Legacy event for back-compat with existing GA4 dashboards,
    // followed by the new funnel-start event.
    trackEvent("upgrade_clicked");
    trackEvent("upgrade_checkout_started");

    // Client-side preflight: if there is no Supabase session we know
    // the server will 401, so save the round trip.
    if (!user) {
      fail("auth_required");
      return;
    }

    let res: Response;
    try {
      res = await authedFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      fail("network");
      return;
    }

    // Try to parse JSON once; many error paths still return a body,
    // and we want to inspect both `code` and `error.code` shapes.
    let body: (StructuredEnvelope & { url?: string }) | null = null;
    try {
      body = (await res.json()) as StructuredEnvelope & { url?: string };
    } catch {
      body = null;
    }

    // Structured envelope takes priority when present — it's the
    // forward-compatible path the server may move to fully later.
    const structuredCode = body?.error?.code;
    if (structuredCode === "AUTH_REQUIRED" || structuredCode === "AUTH_INVALID") {
      fail("auth_required");
      return;
    }
    if (
      structuredCode === "FORBIDDEN" &&
      (res.status === 400 || res.status === 403)
    ) {
      fail("already_premium");
      return;
    }

    if (!res.ok) {
      // Status-based mapping covers today's mixed-shape responses.
      if (res.status === 401) {
        fail("auth_required");
        return;
      }
      if (res.status === 400) {
        // The only documented 400 from /api/checkout today is the
        // "bereits Premium" path. If the server adds new 400s we'll
        // misclassify until they get a structured code — acceptable
        // because the surface is stable.
        fail("already_premium");
        return;
      }
      if (res.status === 503 || body?.code === "STRIPE_NOT_CONFIGURED") {
        fail("stripe_unavailable");
        return;
      }
      if (res.status >= 500) {
        fail("server");
        return;
      }
      fail("unknown");
      return;
    }

    // 200 OK — but the contract requires a redirect URL.
    const url = body?.url;
    if (typeof url !== "string" || url.length === 0) {
      fail("unknown");
      return;
    }

    trackEvent("upgrade_checkout_success_redirect");
    // Intentionally do NOT clear isLoading / inFlightRef here —
    // the page is being unloaded, and clearing would briefly let
    // the disabled CTA become clickable again.
    window.location.href = url;
  }, [user, fail]);

  return { startUpgradeCheckout, isLoading, error, clearError };
}
