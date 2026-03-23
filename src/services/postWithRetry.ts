/**
 * Retry wrapper for POST requests. Retries on 5xx errors or network failures
 * with simple exponential backoff (1s, 2s). Does not retry client errors (4xx).
 * Returns the last Response on 5xx exhaustion, or null on network failure.
 */
export async function postWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  _fetch: typeof fetch = fetch,
): Promise<Response | null> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await _fetch(url, options);
      if (res.ok || res.status < 500) return res; // Don't retry client errors
      lastResponse = res;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn('[postWithRetry] Failed after retries:', err);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return lastResponse;
}
