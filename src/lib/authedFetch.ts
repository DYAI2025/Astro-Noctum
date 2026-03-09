import { supabase } from "./supabase";

/**
 * Wrapper around fetch that automatically attaches the Supabase
 * session JWT as a Bearer token. Use for all authenticated API calls
 * to server.mjs endpoints (e.g. /api/checkout, /api/share).
 */
export async function authedFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...init, headers });
}
