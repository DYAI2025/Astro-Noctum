import { MobileBootstrapSchema, type MobileBootstrap } from "@bazodiac/shared";
import { mobileConfig } from "./config";
import { getAppPlatform, getAppVersion, getOrCreateDeviceId } from "./device";
import { supabase } from "./supabase";

function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${mobileConfig.apiBaseUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function telemetryHeaders(): Promise<Record<string, string>> {
  return {
    "X-App-Platform": getAppPlatform(),
    "X-App-Version": getAppVersion(),
    "X-Device-Id": await getOrCreateDeviceId(),
  };
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseHeaders = await telemetryHeaders();
  const headers = new Headers(init?.headers || {});
  Object.entries(baseHeaders).forEach(([key, value]) => headers.set(key, value));
  return fetch(toAbsoluteUrl(path), { ...init, headers });
}

export async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = new Headers(init?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const baseHeaders = await telemetryHeaders();
  Object.entries(baseHeaders).forEach(([key, value]) => headers.set(key, value));
  return fetch(toAbsoluteUrl(path), { ...init, headers });
}

export async function fetchMobileBootstrap(): Promise<MobileBootstrap> {
  const response = await apiFetch("/api/mobile/bootstrap", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`bootstrap failed (${response.status})`);
  }

  const payload = await response.json();
  return MobileBootstrapSchema.parse(payload);
}
