import { hashId } from '../utils/redact.mjs';

/**
 * Emit one structured JSON log line per request.
 *
 * Fields chosen for the operational dashboards we'd want under a
 * cost / abuse / latency incident — provider attribution, cache hit
 * rate, per-route latency, error code distribution, quota state.
 *
 * Privacy: user IDs and IPs are never logged in raw form. They go
 * through a SHA-256 short-hash so logs can be grouped by user without
 * carrying PII into log storage. Same hash → same row across requests.
 *
 * Why JSON-on-stdout: Railway, Vercel, and most container hosts pipe
 * stdout into a structured log aggregator that already understands
 * JSON. No extra dependency, no daemon, easy to grep locally.
 *
 * @param {object} entry
 * @param {string}        entry.requestId      `req_<uuid>` from requestIdMiddleware
 * @param {string}        entry.method         HTTP method
 * @param {string}        entry.route          Route pattern (not raw URL — keeps cardinality low)
 * @param {number}        entry.status         HTTP status code
 * @param {number}        entry.latencyMs      Wall-clock latency
 * @param {string|null}  [entry.userId]        Will be hashed.
 * @param {string|null}  [entry.ip]            Will be hashed.
 * @param {string|null}  [entry.errorCode]     ApiError code, if any
 * @param {string|null}  [entry.provider]      'gemini' | 'openrouter' | 'fufire' | 'noaa' …
 * @param {string|null}  [entry.cacheStatus]   'HIT' | 'MISS' | null
 * @param {string|null}  [entry.quotaStatus]   'allowed' | 'exceeded' | 'reserved' | null
 */
export function logRequest({
  requestId,
  method,
  route,
  status,
  latencyMs,
  userId = null,
  ip = null,
  errorCode = null,
  provider = null,
  cacheStatus = null,
  quotaStatus = null,
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    request_id: requestId,
    method,
    route,
    status,
    latency_ms: latencyMs,
    user_id_hash: hashId(userId),
    ip_hash: hashId(ip),
    error_code: errorCode,
    provider,
    cache_status: cacheStatus,
    quota_status: quotaStatus,
  };
  console.log(JSON.stringify(entry));
}
