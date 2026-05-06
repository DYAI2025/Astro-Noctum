import { createHash } from 'crypto';

/**
 * Keys whose value will be replaced with `[REDACTED]` when seen at any
 * depth in a logged object. Match is case-insensitive on the *exact* key
 * (we don't substring-match because that would catch innocent fields
 * like `tokens_used` or `user_apikey_hash`).
 *
 * Categories:
 *   - HTTP auth surface
 *   - Provider API keys (server env vars)
 *   - Stripe webhook surface
 *   - Generic secret-shaped names (password / token / secret / api_key)
 */
const REDACTED_KEYS = new Set([
  // HTTP
  'authorization',
  'x-authorization',
  'cookie',
  'set-cookie',
  // Provider keys
  'gemini_api_key',
  'openrouter_api_key',
  'supabase_service_role_key',
  'supabase_anon_key',
  'stripe_secret_key',
  'stripe_publishable_key',
  // Stripe webhook
  'stripe_webhook_secret',
  'stripe-signature',
  'stripe_signature',
  // ElevenLabs
  'elevenlabs_tool_secret',
  'x-elevenlabs-signature',
  'elevenlabs_api_key',
  // Generic
  'password',
  'passphrase',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
]);

const MAX_DEPTH = 6;

/**
 * Return a deep copy of `obj` with values for known-secret keys replaced
 * by `[REDACTED]`. Recurses through nested objects and arrays. Bounded
 * by MAX_DEPTH so cycles cannot blow the stack.
 *
 * Primitives pass through unchanged. Arrays preserve order.
 *
 * The original input is never mutated.
 */
export function redactLog(value, depth = 0) {
  if (depth > MAX_DEPTH) return value;
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactLog(item, depth + 1));
  }

  const out = {};
  for (const [key, v] of Object.entries(value)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[key] = redactLog(v, depth + 1);
    } else {
      out[key] = v;
    }
  }
  return out;
}

/**
 * Stable, non-reversible short hash for log correlation. Maps a user id
 * (or IP) to a 12-char hex digest so logs can be grouped by user without
 * carrying the actual identifier into log storage.
 *
 * Returns null for falsy / empty input — never logs an empty hash.
 */
export function hashId(id) {
  if (!id || typeof id !== 'string') return null;
  return createHash('sha256').update(id).digest('hex').slice(0, 12);
}
