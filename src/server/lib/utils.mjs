/**
 * Exponential-backoff fetch helper.
 * Retries on network errors and 5xx responses only; 4xx is returned immediately.
 */
export async function fetchWithRetry(url, options, maxRetries = 3, baseDelayMs = 2000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        // 2xx–3xx: success; 4xx: client error, do not retry
        return res;
      }
      // 5xx: server error — fall through to retry
      lastError = new Error(`Service responded with ${res.status}`);
    } catch (err) {
      // Network error
      lastError = err;
    }
    if (attempt < maxRetries) {
      const delayMs = baseDelayMs * Math.pow(2, attempt); // 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

/**
 * Returns the current ISO week number.
 */
export function getISOWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

/**
 * Clamp a value between min and max.
 */
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * Lerp between a and b by t.
 */
export const lerp = (a, b, t) => a + (b - a) * t;
