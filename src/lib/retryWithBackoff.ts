/**
 * Retry an async operation with exponential backoff.
 * Returns the result on success, throws after all retries exhausted.
 *
 * @param shouldRetry — optional guard; when provided, only errors passing
 *   this check trigger a retry. Errors that fail the check are re-thrown
 *   immediately (e.g. 4xx client errors should not be retried).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
    shouldRetry?: (error: unknown) => boolean;
  } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry, shouldRetry } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && (shouldRetry ? shouldRetry(err) : true)) {
        onRetry?.(attempt + 1, err);
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}
