# 503 Resilience Fix — postCalculation Retry + Error Extraction + Session Refresh

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate 503 "Service Unavailable" errors for new users during first-time BAFE calculations by adding client-side retry, better error messages, and proactive session refresh.

**Architecture:** Three surgical changes in the client-side API layer (`src/services/api.ts`) and one in the orchestration hook (`src/hooks/useAstroProfile.ts`). No server changes needed — BAFE and Express are healthy; the 503s are transient infrastructure responses (Railway cold-start / proxy). We reuse the existing `retryWithBackoff` utility and extend it with a `shouldRetry` guard so we only retry transient 5xx errors, never 4xx.

**Tech Stack:** TypeScript, Supabase JS v2, Vite/React, Vitest

---

## Side-Effect Analysis

### Fix 1: Retry with backoff in `postCalculation`

| Aspect | Before | After | Risk |
|---|---|---|---|
| Requests per onboarding | 5 (one per endpoint) | 5–15 (up to 3 retries per endpoint) | Low — only on 5xx; healthy BAFE returns 200 on first try |
| Time to failure | ~15s (fetchWithTimeout) | ~15s + 2 retries × backoff (worst case ~22s total) | Acceptable — user sees spinner anyway; better than fallback data |
| Rate limit impact | 5 of 100 per 15min | max 15 of 100 per 15min | Safe — well within limit |
| 401/400 behavior | Throws immediately | Still throws immediately — `shouldRetry` skips 4xx | No change |
| `retryWithBackoff` consumers | Test + unused elsewhere | Gains `shouldRetry` param, default `() => true` | **Backward-compatible** — existing callers unchanged |

### Fix 2: Better error extraction

| Aspect | Before | After | Risk |
|---|---|---|---|
| Express `{"error":"..."}` | Shown as raw JSON string | Extracted as readable message | Purely cosmetic improvement, no behavioral change |
| BAFE Problem+JSON | Works (extracts `detail`/`title`) | Still works | No change |
| Plain text body | Used as-is | Used as-is | No change |

### Fix 3: Session refresh before `calculateAll`

| Aspect | Before | After | Risk |
|---|---|---|---|
| Token freshness | Uses cached token (may be stale after long form) | Force-refreshes once before all 5 calls | One extra auth roundtrip (~100ms) |
| Refresh failure | N/A | Caught by existing try/catch in `handleSubmit` → shows error message | Graceful degradation |
| `getSession()` calls in `postCalculation` | 5× (one per endpoint) | Still 5×, but all return fresh cached token | No change — `refreshSession()` updates the cache that `getSession()` reads |
| Existing users (profile reload path) | N/A — never calls `calculateAll` | Not affected | Zero impact |

---

## Task 1: Extend `retryWithBackoff` with `shouldRetry` guard

**Files:**
- Modify: `src/lib/retryWithBackoff.ts`
- Modify: `src/__tests__/retryWithBackoff.test.ts`

### Step 1: Add failing test for `shouldRetry`

Add this test to `src/__tests__/retryWithBackoff.test.ts`:

```typescript
it('does NOT retry when shouldRetry returns false', async () => {
  const fn = vi.fn()
    .mockRejectedValueOnce(new Error('no-retry'))
    .mockResolvedValueOnce('ok');
  await expect(
    retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelay: 10,
      shouldRetry: () => false,
    }),
  ).rejects.toThrow('no-retry');
  expect(fn).toHaveBeenCalledTimes(1); // no retries
});

it('retries only when shouldRetry returns true', async () => {
  class RetriableError extends Error { retriable = true; }
  const fn = vi.fn()
    .mockRejectedValueOnce(new RetriableError('transient'))
    .mockResolvedValueOnce('ok');
  const result = await retryWithBackoff(fn, {
    maxRetries: 3,
    baseDelay: 10,
    shouldRetry: (err) => err instanceof RetriableError,
  });
  expect(result).toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
});
```

### Step 2: Run test — expect FAIL

```bash
npx vitest run src/__tests__/retryWithBackoff.test.ts
```
Expected: FAIL — `shouldRetry` option does not exist yet.

### Step 3: Implement `shouldRetry` in `retryWithBackoff`

Replace the options type and add the guard in `src/lib/retryWithBackoff.ts`:

```typescript
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
```

### Step 4: Run tests — expect PASS

```bash
npx vitest run src/__tests__/retryWithBackoff.test.ts
```
Expected: ALL PASS (new tests + existing tests unchanged).

### Step 5: Commit

```bash
git add src/lib/retryWithBackoff.ts src/__tests__/retryWithBackoff.test.ts
git commit -m "feat(retry): add shouldRetry guard to retryWithBackoff"
```

---

## Task 2: Add `ApiError` class and improve error extraction in `postCalculation`

**Files:**
- Modify: `src/services/api.ts`

### Step 1: Add `ApiError` class and fix error extraction

At the top of `src/services/api.ts` (after imports), add:

```typescript
/** Error with HTTP status — enables retry logic to distinguish 4xx from 5xx. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isRetriable(): boolean {
    return this.status >= 500;
  }
}
```

Then replace the error block in `postCalculation` (lines 101–114) with:

```typescript
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;

    // Try parsing as JSON (BAFE Problem+JSON or Express error format)
    try {
      const parsed = JSON.parse(text);
      if (parsed.detail) detail = parsed.detail;
      else if (parsed.title) detail = parsed.title;
      else if (parsed.error) detail = parsed.error;   // ← Express format
    } catch {
      // Not JSON — use raw text (e.g. plain "Service Unavailable" from proxy)
    }

    // Fallback: if detail is empty, use the HTTP status text
    if (!detail) detail = res.statusText || `HTTP ${res.status}`;

    throw new ApiError(
      `Failed to calculate ${endpoint}: ${res.status} ${detail}`,
      res.status,
      endpoint,
    );
  }
```

### Step 2: Verify no compile errors

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add src/services/api.ts
git commit -m "fix(api): add ApiError class, extract Express error field"
```

---

## Task 3: Wire retry into `postCalculation`

**Files:**
- Modify: `src/services/api.ts` (import `retryWithBackoff`, wrap fetch)

### Step 1: Add retry around the fetch call

Add import at top of `src/services/api.ts`:

```typescript
import { retryWithBackoff } from '../lib/retryWithBackoff';
```

Then refactor `postCalculation` to wrap the fetch+parse in `retryWithBackoff`:

```typescript
async function postCalculation<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return retryWithBackoff(
    async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/calculate/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let detail = text;

        try {
          const parsed = JSON.parse(text);
          if (parsed.detail) detail = parsed.detail;
          else if (parsed.title) detail = parsed.title;
          else if (parsed.error) detail = parsed.error;
        } catch {
          // Not JSON — use raw text
        }

        if (!detail) detail = res.statusText || `HTTP ${res.status}`;

        throw new ApiError(
          `Failed to calculate ${endpoint}: ${res.status} ${detail}`,
          res.status,
          endpoint,
        );
      }

      return res.json() as Promise<T>;
    },
    {
      maxRetries: 2,          // initial + 2 retries = 3 total attempts
      baseDelay: 800,         // 800ms → 1600ms backoff (enough for Railway wake)
      shouldRetry: (err) => err instanceof ApiError && err.isRetriable,
      onRetry: (attempt, err) => {
        console.warn(`[api] Retry ${attempt} for ${endpoint}:`, (err as Error).message);
      },
    },
  );
}
```

**Critical:** `shouldRetry` returns `false` for 401/400 (non-ApiError throws from `fetchWithTimeout` like AbortError are also not retried — they're not `ApiError` instances). Only 5xx `ApiError`s trigger retry.

### Step 2: Run type check

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add src/services/api.ts
git commit -m "fix(api): retry postCalculation on 5xx with exponential backoff"
```

---

## Task 4: Proactive session refresh in `calculateAll`

**Files:**
- Modify: `src/services/api.ts` (add refresh call at start of `calculateAll`)

### Step 1: Add session refresh before parallel calls

At the start of `calculateAll`, before the `Promise.all`, add:

```typescript
export async function calculateAll(data: BirthData): Promise<ApiResults> {
  const issues: ApiIssue[] = [];

  // Proactively refresh the Supabase token before firing all 5 endpoints.
  // New users may have a stale cached token after spending time on the birth form.
  // refreshSession() updates the in-memory cache that getSession() reads,
  // so the subsequent postCalculation() calls automatically use the fresh token.
  try {
    await supabase.auth.refreshSession();
  } catch (refreshErr) {
    console.warn("[api] Session refresh failed, proceeding with cached token:", refreshErr);
    // Non-fatal: postCalculation will use whatever getSession() returns.
    // If the token is truly dead, each endpoint will fail with 401 → no retry → fallback.
  }

  const withFallback = async <T>(
  // ... rest unchanged
```

### Step 2: Verify no compile errors

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add src/services/api.ts
git commit -m "fix(api): refresh Supabase session before calculateAll"
```

---

## Task 5: Verify — build, tests, existing test suite

**Files:** None (verification only)

### Step 1: Run full test suite

```bash
npx vitest run
```

Expected: All existing tests pass. The `useAstroProfile.test.ts` mocks `calculateAll`, so the retry logic inside is transparent.

### Step 2: Run production build

```bash
npm run build
```

Expected: No errors. Bundle should be ~same size (retryWithBackoff is already in bundle, ApiError class is tiny).

### Step 3: Manual smoke test (if possible)

Open the app, create a new account, fill birth form → submit. All 5 calculations should succeed (possibly after a brief retry if server was cold).

---

## Summary of all changed files

| File | Change |
|---|---|
| `src/lib/retryWithBackoff.ts` | Add `shouldRetry` option (backward-compatible) |
| `src/__tests__/retryWithBackoff.test.ts` | 2 new tests for `shouldRetry` |
| `src/services/api.ts` | Add `ApiError` class, extract `error` field, wrap in `retryWithBackoff`, add `refreshSession()` in `calculateAll` |
