import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { MobileBootstrap } from "@bazodiac/shared";
import { authedFetch } from "./api";

export type CheckoutResult = "success" | "cancel" | "unknown";

function deepLinkForResult(result: "success" | "cancel"): string {
  return Linking.createURL(`checkout/${result}`);
}

function inferResult(url?: string): CheckoutResult {
  if (!url) return "unknown";
  const normalized = url.toLowerCase();
  if (normalized.includes("checkout/success") || normalized.includes("upgrade=success")) return "success";
  if (normalized.includes("checkout/cancel") || normalized.includes("upgrade=cancel")) return "cancel";
  return "unknown";
}

export async function beginCheckout(bootstrap: MobileBootstrap | null): Promise<CheckoutResult> {
  const successUrl = deepLinkForResult("success");
  const cancelUrl = deepLinkForResult("cancel");

  const response = await authedFetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      successUrl,
      cancelUrl,
      platform: "mobile",
      fallbackSuccessUrl: bootstrap?.checkout.default_success_url,
      fallbackCancelUrl: bootstrap?.checkout.default_cancel_url,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`checkout failed (${response.status}) ${message.slice(0, 220)}`);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload?.url) {
    throw new Error("checkout URL missing");
  }

  const returnUrl = Linking.createURL("checkout/success");
  const authResult = await WebBrowser.openAuthSessionAsync(payload.url, returnUrl);

  if (authResult.type === "success") {
    return inferResult(authResult.url);
  }

  if (authResult.type === "cancel") {
    return "cancel";
  }

  return "unknown";
}
