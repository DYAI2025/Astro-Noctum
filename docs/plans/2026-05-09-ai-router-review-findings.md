# AI-Router Review Findings — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address all 11 findings from the 2026-05-09 code review of PR #333 (`server/ai-router.mjs` cascade fix). Two Important findings (I-1 + I-2) become a quick follow-up commit; one Important (I-4) adds the missing Groq tier test coverage; two cross-cutting Important (I-3 + I-5) get their own commits with proper testing; five Minor findings get bundled into a hygiene commit.

**Architecture:** Pure refactor + test-coverage work on `server/ai-router.mjs` and its test file. No behavior change for existing call-sites. Each commit ships an isolated, atomically-reversible improvement.

**Tech Stack:** Node 20.19+, Vitest 4.x, `@google/genai` SDK, `node:abort` (built-in `AbortController`), JS `.mjs` modules.

---

## Pre-flight

**Step 0.1: Confirm branch state**

Run:
```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git branch --show-current
git log --oneline -3
git status --short
```

Expected:
- Current branch: `2026-05-09-tagespuls-slots-cascade` (or `main` if PR #333 has already merged — branch from main if so)
- HEAD: `98d4af7 fix(ai-router): cascade on 404/502/503 + drop dead google :free models + add Groq tier`
- Working tree: clean

If working tree is dirty, **STOP** and report.

If on main with PR #333 merged: create new branch off main:
```bash
git switch -c 2026-05-09-ai-router-hygiene
```

**Step 0.2: Baseline test count**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts 2>&1 | tail -5
```

Expected: **13 passed (13)** — these are the 9 original + 4 cascade tests from PR #333.

Capture the count for later comparison.

---

## Commit 1: I-1 + I-2 (rename + comment fix)

**Goal:** Rename `isQuotaOr429Error` to a name that reflects its actual behavior, fix the misleading comment in `normalizeOpenRouterModel`. Pure rename + 1-line comment fix. No behavior change.

### Task 1: Rename `isQuotaOr429Error` → `isCascadableProviderError`

**Files:**
- Modify: `server/ai-router.mjs` (3 occurrences: definition + JSDoc + call-site)

**Step 1.1: Read the current state**

Run:
```bash
grep -n "isQuotaOr429Error" server/ai-router.mjs
```

Expected output (3 hits):
```
74:function isQuotaOr429Error(err) {
182: * decides whether to fall through based on {@link isQuotaOr429Error}.
288:        if (!isQuotaOr429Error(err)) {
```

Verify also it's NOT used anywhere else:
```bash
grep -rn "isQuotaOr429Error" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git
```

Expected: only those 3 hits in `server/ai-router.mjs`. If the symbol leaks anywhere else, **STOP and report** — internal-only function should not have external consumers.

**Step 1.2: Apply the rename via Edit (replaceAll inside file)**

Use Edit with `replace_all: true`:

Old: `isQuotaOr429Error`
New: `isCascadableProviderError`

This catches all 3 occurrences at once — definition, JSDoc reference, and call-site.

**Step 1.3: Run the test suite to verify zero regression**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts 2>&1 | tail -5
```

Expected: **13 passed (13)** — identical to baseline. The rename is a pure refactor; no test should reference the internal function name.

If any test fails, **STOP and report** — that means a test was leaking implementation detail.

**Step 1.4: Run tsc to verify**

Run:
```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean (no output).

### Task 2: Fix the misleading comment in `normalizeOpenRouterModel`

**Files:**
- Modify: `server/ai-router.mjs` (lines 122-136)

**Step 2.1: Read current comment**

Run:
```bash
sed -n '122,136p' server/ai-router.mjs
```

Confirm the misleading comment block matches:
```js
/**
 * Map a Gemini model id to whatever OpenRouter exposes for a closely
 * matching capability. We don't need an exhaustive map — the fallback
 * chain itself rotates through known-good free models.
 */
function normalizeOpenRouterModel(requestedModel, fallbackModel) {
  if (!requestedModel) return fallbackModel;
  // If caller passed an OpenRouter slug directly, only let it override the
  // matching chain entry. Otherwise we collapse the entire fallback chain
  // into repeated attempts against the same model.
  if (requestedModel.includes('/')) {
    return requestedModel === fallbackModel ? requestedModel : fallbackModel;
  }
  return fallbackModel;
}
```

The bug: "we collapse the entire fallback chain into repeated attempts against the same model" describes the OPPOSITE of the actual behavior. The function returns `fallbackModel` (i.e., the chain entry) on mismatch — so the chain rotates normally.

**Step 2.2: Apply the comment fix via Edit**

Use Edit (NOT replace_all):

Old:
```
  // If caller passed an OpenRouter slug directly, only let it override the
  // matching chain entry. Otherwise we collapse the entire fallback chain
  // into repeated attempts against the same model.
```

New:
```
  // If caller passed an OpenRouter slug directly, let it override only the
  // matching chain entry. For all other chain entries we use the chain
  // entry itself, so the cascade rotates through diverse providers as
  // designed (we do NOT collapse the chain into a single model).
```

**Step 2.3: Verify with tsc**

Run:
```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

### Task 3: Commit

**Step 3.1: Stage and commit**

Run:
```bash
git add server/ai-router.mjs
git commit -m "$(cat <<'EOF'
refactor(ai-router): rename cascade detector + fix normalizer comment (I-1, I-2)

- isQuotaOr429Error → isCascadableProviderError. The function now also
  cascades on 404/502/503 (added in 98d4af7); the legacy 429-only name
  was misleading.
- normalizeOpenRouterModel comment was inverted — said "collapse the
  chain into the same model" when the code rotates normally. Now
  describes actual behavior.

Pure rename + comment fix. No behavior change. Existing 13 ai-router
tests pass unchanged.

Closes 2026-05-09 review I-1 + I-2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**Step 3.2: Verify commit landed**

Run:
```bash
git log --oneline -1
```

Expected: most recent commit is the rename.

---

## Commit 2: I-4 (Groq tier test coverage)

**Goal:** Add 3 tests covering the Groq tier in the cascade. Currently 0 coverage.

### Task 4: Test — Groq direct success after Gemini exhausted

**Files:**
- Modify: `src/__tests__/ai-router.test.ts` (add tests after the 4 cascade tests added in PR #333)

**Step 4.1: Find the insertion point**

Run:
```bash
grep -n "DEFAULT-CHAIN: does not include the deprecated" src/__tests__/ai-router.test.ts
```

Expected: one line number around 235. Insert new tests AFTER the closing `});` of that test, BEFORE the existing `it('defaults the OpenRouter HTTP-Referer header to https://bazodiac.space'` test.

Confirm by reading 5 lines before+after the matched line:
```bash
sed -n '230,260p' src/__tests__/ai-router.test.ts
```

**Step 4.2: Write the failing test**

Use Edit to insert immediately after the closing `});` of the `DEFAULT-CHAIN` test. Match the unique anchor `expect(DEFAULT_FREE_MODEL_CHAIN.length).toBeGreaterThanOrEqual(3);\n  });` and append the new tests:

Old anchor (use a unique string from inside that test's body):
```js
    expect(DEFAULT_FREE_MODEL_CHAIN.length).toBeGreaterThanOrEqual(3);
  });
```

New (the same anchor + new test code immediately after):
```js
    expect(DEFAULT_FREE_MODEL_CHAIN.length).toBeGreaterThanOrEqual(3);
  });

  // ── Groq tier coverage (I-4) ────────────────────────────────────────────
  // Three tests proving the Groq layer between Gemini-direct and OpenRouter
  // works end-to-end. Pre-PR-#333 there was zero coverage of the Groq path.

  it('GROQ-TIER-1: Gemini exhausted → first Groq model serves the request', async () => {
    // Gemini direct throws 429 → router should call Groq before OpenRouter.
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([{ text: 'from-groq' }]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      groqApiKey: 'q',
      openrouterApiKey: 'o',
      groqModelChain: ['llama-3.3-70b-versatile'],
      freeModelChain: ['should-not-reach:free'],
    })!;
    const out = await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
    });

    expect(out.text).toBe('from-groq');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Assert the call hit Groq's URL, not OpenRouter's.
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.groq.com/openai/v1/chat/completions');
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('GROQ-TIER-2: cascades through multiple Groq models when each returns 429', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([
      { ok: false, status: 429, text: '{"error":"rate limit"}' },
      { ok: false, status: 429, text: '{"error":"rate limit"}' },
      { text: 'third-groq-wins' },
    ]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      groqApiKey: 'q',
      openrouterApiKey: undefined,
      groqModelChain: ['first-groq', 'second-groq', 'third-groq'],
    })!;
    const out = await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
    });

    expect(out.text).toBe('third-groq-wins');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // All three calls must hit Groq URL — none should fall to OpenRouter
    // because OPENROUTER_API_KEY was deliberately undefined.
    for (const [url] of fetchMock.mock.calls) {
      expect(String(url)).toContain('api.groq.com');
    }
  });

  it('GROQ-TIER-3: Groq exhausted → falls through to OpenRouter (full 3-tier cascade)', async () => {
    // Worst-case prod scenario: Gemini quota out, all Groq models 429,
    // OpenRouter first model 404 (deprecated), second OpenRouter wins.
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([
      // Two Groq attempts, both 429
      { ok: false, status: 429, text: '{"error":"groq quota"}' },
      { ok: false, status: 429, text: '{"error":"groq quota"}' },
      // First OpenRouter 404 (deprecated model)
      { ok: false, status: 404, text: '{"error":"No endpoints found"}' },
      // Second OpenRouter succeeds
      { text: 'openrouter-saves-the-day' },
    ]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      groqApiKey: 'q',
      openrouterApiKey: 'o',
      groqModelChain: ['groq-a', 'groq-b'],
      freeModelChain: ['openrouter-dead', 'openrouter-alive'],
    })!;
    const out = await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
    });

    expect(out.text).toBe('openrouter-saves-the-day');
    expect(fetchMock).toHaveBeenCalledTimes(4);

    // Assert call order: Groq first, then OpenRouter.
    expect(String(fetchMock.mock.calls[0][0])).toContain('api.groq.com');
    expect(String(fetchMock.mock.calls[1][0])).toContain('api.groq.com');
    expect(String(fetchMock.mock.calls[2][0])).toContain('openrouter.ai');
    expect(String(fetchMock.mock.calls[3][0])).toContain('openrouter.ai');
  });

```

**Step 4.3: Run only the new tests to verify they're well-formed**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts -t "GROQ-TIER" 2>&1 | tail -10
```

Expected: 3 passing.

If any fails, the test fixture needs adjustment — read the failure carefully, the most likely cause is a mismatch between expected fetch-call count and actual cascade behavior. **STOP and report** rather than guessing.

**Step 4.4: Run full ai-router suite**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts 2>&1 | tail -5
```

Expected: **16 passed (16)** — 13 baseline + 3 new GROQ-TIER tests.

### Task 5: Commit

**Step 5.1: Stage and commit**

Run:
```bash
git add src/__tests__/ai-router.test.ts
git commit -m "$(cat <<'EOF'
test(ai-router): cover Groq tier in cascade (I-4)

PR #333 added a Groq layer between Gemini-direct and OpenRouter but
shipped without test coverage. Three new tests:

- GROQ-TIER-1: Gemini exhausted → first Groq model serves
- GROQ-TIER-2: rolls through multiple Groq models on 429
- GROQ-TIER-3: full 3-tier cascade (Gemini → Groq exhausted →
  OpenRouter, including 404 cascade within OpenRouter chain)

Asserts call order via fetchMock URL inspection so a future
regression that flips Groq/OpenRouter precedence is caught.

Suite: 16/16 (was 13/13).

Closes 2026-05-09 review I-4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 3: I-3 (aggregate cascade timeout budget)

**Goal:** Cap worst-case cascade latency. Today: ~275s if every provider times out. Target: 90s aggregate budget.

### Task 6: Add aggregate-budget test (RED)

**Files:**
- Modify: `src/__tests__/ai-router.test.ts`

**Step 6.1: Pick the test location**

Insert after the GROQ-TIER tests, before the existing `defaults the OpenRouter HTTP-Referer` test.

**Step 6.2: Write the failing test**

The test simulates 5 hung Groq calls + 5 hung OpenRouter calls, each "taking" longer than the per-leg timeout. We use `vi.useFakeTimers()` to fast-forward time and assert the router gives up before all 10 attempts.

Use Edit to append after the GROQ-TIER-3 closing `});`:

Old anchor (the unique closing of GROQ-TIER-3):
```js
    expect(String(fetchMock.mock.calls[3][0])).toContain('openrouter.ai');
  });

```

New (anchor + new test):
```js
    expect(String(fetchMock.mock.calls[3][0])).toContain('openrouter.ai');
  });

  it('CASCADE-BUDGET: aborts cascade after aggregate timeout (90s default)', async () => {
    // Real-world bound: a dashboard load shouldn't hang for >90s waiting
    // for the cascade to exhaust. Each leg has its own 30s per-call timeout
    // but stacking 10 legs (Gemini + 4 Groq + 5 OpenRouter) = 275s worst
    // case. Assert the router enforces an aggregate ceiling.
    //
    // Strategy: every fetch-mock call returns a Promise that never resolves,
    // and the @google/genai mock also stays pending. We give the router
    // a 1-second aggregate budget (via factory option) to keep the test
    // fast, then assert it throws before all 10 attempts fire.
    const neverResolves = () => new Promise<never>(() => {
      // intentionally never settles — relies on the router's AbortController
    });
    mockGenerateContent.mockImplementationOnce(neverResolves);
    const fetchMock = vi.fn(neverResolves);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      groqApiKey: 'q',
      openrouterApiKey: 'o',
      groqModelChain: ['groq-a', 'groq-b'],
      freeModelChain: ['or-a', 'or-b'],
      aggregateBudgetMs: 1_000,
    })!;

    const start = Date.now();
    await expect(
      router.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'hi',
      }),
    ).rejects.toThrow(/aggregate budget|cascade timeout/i);
    const elapsed = Date.now() - start;

    // Sanity: real wall time was bounded near the budget (allow up to 3×
    // for CI slow-downs). If the budget didn't kick in, this would be
    // 30s+ minimum from the per-leg timeout.
    expect(elapsed).toBeLessThan(3_000);
  });

```

**Step 6.3: Run the test to verify it fails**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts -t "CASCADE-BUDGET" 2>&1 | tail -15
```

Expected: **FAIL** with one of:
- `Unknown option: aggregateBudgetMs` (factory doesn't accept the param yet)
- A timeout error from the test runner (because the actual call never resolves and the router has no aggregate cancel)
- A different rejection without the expected `aggregate budget|cascade timeout` message

**If the test passes**, the implementation already has aggregate cancellation — investigate before adding the implementation. **STOP and report**.

### Task 7: Implement aggregate budget (GREEN)

**Files:**
- Modify: `server/ai-router.mjs` (createGenAiRouter signature + generateContent loop)

**Step 7.1: Read the current factory + generateContent**

Run:
```bash
sed -n '234,296p' server/ai-router.mjs
```

Confirm the shape:
- Factory accepts `geminiApiKey, groqApiKey, openrouterApiKey, freeModelChain, groqModelChain, referer, title`
- `generateContent` builds `attempts` array and loops with `for (let i = 0; i < attempts.length; i++)`

**Step 7.2: Apply the fix via Edit**

Add the `aggregateBudgetMs` parameter and an `outerController` that aborts the chain when the budget is exhausted.

Old:
```js
export function createGenAiRouter({
  geminiApiKey,
  groqApiKey,
  openrouterApiKey,
  freeModelChain = DEFAULT_FREE_MODEL_CHAIN,
  groqModelChain = DEFAULT_GROQ_MODEL_CHAIN,
  referer = 'https://bazodiac.space',
  title = 'Bazodiac',
} = {}) {
```

New:
```js
/**
 * Default aggregate cascade budget. Caps worst-case latency for a
 * dashboard request: even if every provider times out at 30s/leg, the
 * router throws after 90s rather than 275s.
 */
const DEFAULT_AGGREGATE_BUDGET_MS = 90_000;

export function createGenAiRouter({
  geminiApiKey,
  groqApiKey,
  openrouterApiKey,
  freeModelChain = DEFAULT_FREE_MODEL_CHAIN,
  groqModelChain = DEFAULT_GROQ_MODEL_CHAIN,
  referer = 'https://bazodiac.space',
  title = 'Bazodiac',
  aggregateBudgetMs = DEFAULT_AGGREGATE_BUDGET_MS,
} = {}) {
```

Then modify `generateContent` to enforce the budget:

Old:
```js
  async function generateContent(request) {
    const attempts = [];
    if (direct) {
      attempts.push({
        label: 'gemini-direct',
        call: () => direct.models.generateContent(request),
      });
    }
```

New:
```js
  async function generateContent(request) {
    const startedAt = Date.now();
    const attempts = [];
    if (direct) {
      attempts.push({
        label: 'gemini-direct',
        call: () => direct.models.generateContent(request),
      });
    }
```

Then the cascade loop. Old:
```js
    let lastErr = null;
    for (let i = 0; i < attempts.length; i++) {
      const { label, call } = attempts[i];
      try {
        const result = await call();
        if (i > 0) {
          console.warn(`[ai-router] recovered via ${label} after ${i} failed attempt(s)`);
        }
        return result;
      } catch (err) {
        lastErr = err;
        if (!isCascadableProviderError(err)) {
          // Non-quota error — surface it rather than wasting the rest of the chain.
          throw err;
        }
        console.warn(`[ai-router] ${label} quota/429, falling through`);
      }
    }
    throw lastErr ?? new Error('[ai-router] all providers exhausted');
  }
```

New:
```js
    let lastErr = null;
    for (let i = 0; i < attempts.length; i++) {
      // Aggregate-budget guard: don't start a new leg if we've already
      // burned more than the budget. Per-leg AbortControllers still cap
      // individual call latency.
      if (Date.now() - startedAt >= aggregateBudgetMs) {
        const total = Date.now() - startedAt;
        console.warn(`[ai-router] aggregate budget exhausted after ${total}ms, giving up`);
        const budgetErr = new Error(`[ai-router] aggregate budget exhausted (${total}ms >= ${aggregateBudgetMs}ms)`);
        budgetErr.code = 'CASCADE_TIMEOUT';
        throw budgetErr;
      }
      const { label, call } = attempts[i];
      try {
        const result = await call();
        if (i > 0) {
          console.warn(`[ai-router] recovered via ${label} after ${i} failed attempt(s)`);
        }
        return result;
      } catch (err) {
        lastErr = err;
        if (!isCascadableProviderError(err)) {
          // Non-quota error — surface it rather than wasting the rest of the chain.
          throw err;
        }
        console.warn(`[ai-router] ${label} quota/429, falling through`);
      }
    }
    throw lastErr ?? new Error('[ai-router] all providers exhausted');
  }
```

**Step 7.3: Run the test to verify it passes**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts -t "CASCADE-BUDGET" 2>&1 | tail -10
```

Expected: 1 passing.

But wait — the test uses `neverResolves` Promises. The budget-check at the TOP of the loop only fires BETWEEN attempts. The first attempt is already running and will hang on the never-resolving Promise. The aggregate budget alone won't abort an in-flight call.

If the test still fails because of the in-flight hang: refine the test. Replace `neverResolves` with a Promise that rejects after 100ms with a 503 (cascadable), so each attempt fails fast and the loop iterates. Then the budget fires between attempts.

Update the test fixture:

Old (in test):
```js
    const neverResolves = () => new Promise<never>(() => {
      // intentionally never settles — relies on the router's AbortController
    });
    mockGenerateContent.mockImplementationOnce(neverResolves);
    const fetchMock = vi.fn(neverResolves);
```

New:
```js
    // Each leg fails fast with a cascadable 503 so the loop iterates;
    // the budget fires between iterations once cumulative time exceeds 1s.
    const slowFail = () =>
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          const err: any = new Error('503 model overloaded');
          err.status = 503;
          reject(err);
        }, 250);
      });
    mockGenerateContent.mockImplementationOnce(slowFail);
    // 5 fetch calls available, each takes 250ms → 5×250 = 1250ms, budget at 1000ms
    // means the 4th or 5th attempt should be skipped due to budget.
    const fetchMock = vi.fn(slowFail);
```

Adjust the assertion accordingly:

Old:
```js
    await expect(
      router.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'hi',
      }),
    ).rejects.toThrow(/aggregate budget|cascade timeout/i);
    const elapsed = Date.now() - start;

    // Sanity: real wall time was bounded near the budget (allow up to 3×
    // for CI slow-downs). If the budget didn't kick in, this would be
    // 30s+ minimum from the per-leg timeout.
    expect(elapsed).toBeLessThan(3_000);
```

New:
```js
    await expect(
      router.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'hi',
      }),
    ).rejects.toThrow(/aggregate budget|cascade timeout/i);
    const elapsed = Date.now() - start;

    // Sanity: budget kicked in before all 5 attempts (1+2 Groq + 2 OR)
    // had a chance to run their full 250ms × 5 = 1250ms.
    expect(elapsed).toBeLessThan(1_500);
    // And at least 2 attempts must have happened (otherwise the budget
    // didn't even let the loop progress).
    expect(mockGenerateContent.mock.calls.length + fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
```

Re-run:
```bash
npx vitest run src/__tests__/ai-router.test.ts -t "CASCADE-BUDGET" 2>&1 | tail -10
```

Expected: passing.

**Step 7.4: Run full suite to verify zero regression**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts 2>&1 | tail -5
```

Expected: **17 passed (17)** — 16 from previous + 1 new CASCADE-BUDGET.

```bash
npx vitest run 2>&1 | tail -5
```

Expected: full suite green except the pre-existing `vibes-perf.test.ts` flake.

```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

### Task 8: Commit

**Step 8.1: Stage and commit**

Run:
```bash
git add server/ai-router.mjs src/__tests__/ai-router.test.ts
git commit -m "$(cat <<'EOF'
fix(ai-router): aggregate cascade budget caps worst-case latency (I-3)

Pre-fix: Gemini direct (1 attempt, ~5s) + Groq chain (4 × 30s) +
OpenRouter chain (5 × 30s) = 275s worst case if every leg times out.
A dashboard request would hang for 4½ minutes before the user sees
a 503.

New `aggregateBudgetMs` factory option (default 90_000). Between
each attempt, the cascade loop checks if cumulative wall time has
exceeded the budget — if so, throws CASCADE_TIMEOUT immediately
rather than starting another 30s-bounded leg.

Per-leg timeouts still cap individual call latency. The budget is a
ceiling on the cascade as a whole.

Test: CASCADE-BUDGET asserts the router throws with budget-exhausted
message in well under the would-be cascade duration.

Suite: 17/17 (was 16/16).

Closes 2026-05-09 review I-3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 4: I-5 (metrics integration)

**Goal:** Hook ai-router cascade events into the existing structured logger so cascade events are observable in production logs (and ready for future Grafana dashboards).

### Task 9: Inspect the existing logger contract

**Files:**
- Read: `server/observability/logger.mjs`

**Step 9.1: Read the logger module**

Run:
```bash
cat server/observability/logger.mjs 2>&1 | head -60
```

If the file doesn't exist or doesn't export a structured-log helper, **STOP and report** — the metrics integration plan needs adjustment.

Expected: an exported function like `logRequest(...)` or `logEvent(...)` that takes `{ event, ...fields }` and writes structured JSON to stdout/stderr. Match its actual shape.

**Step 9.2: Identify the call shape**

If the logger exports something like:
```js
export function logEvent({ event, ...fields }) { console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...fields })); }
```

Then ai-router cascade events would call:
```js
logEvent({ event: 'ai_router_cascade', from: 'gemini-direct', to: 'groq:llama-3.3-70b-versatile', attempt: 1 });
logEvent({ event: 'ai_router_recovery', via: 'groq:llama-3.3-70b-versatile', failedAttempts: 1 });
logEvent({ event: 'ai_router_exhausted', total: 10, lastErrCode: 'CASCADE_TIMEOUT' });
```

If the logger has a different shape, adapt accordingly. **Do not invent a new logger** — match what's there.

### Task 10: Add metrics test (RED)

**Files:**
- Modify: `src/__tests__/ai-router.test.ts`

**Step 10.1: Mock the logger import**

At the top of the test file, after the existing mocks, add a logger mock:

Find this block:
```js
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
    constructor(_config: any) {}
  },
}));
```

Add immediately after:
```js
const mockLogEvent = vi.fn();
vi.mock('../../server/observability/logger.mjs', () => ({
  logEvent: (fields: Record<string, unknown>) => mockLogEvent(fields),
}));
```

(Adjust the import path to match the actual logger module path you discovered in Task 9.)

**Step 10.2: Add `beforeEach` reset**

Find the existing `beforeEach`:
```js
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });
```

Update to:
```js
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockLogEvent.mockReset();
  });
```

**Step 10.3: Write the metrics test**

Insert after CASCADE-BUDGET test:

```js
  it('METRICS: emits ai_router_cascade + ai_router_recovery events on cascade success', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([{ text: 'recovered' }]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      groqApiKey: undefined,
      openrouterApiKey: 'o',
      freeModelChain: ['meta-llama/llama-3.3-70b-instruct:free'],
    })!;
    await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
    });

    // Cascade event: gemini-direct failed, falling through.
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ai_router_cascade',
        from: 'gemini-direct',
      }),
    );
    // Recovery event: succeeded via openrouter at attempt index 1.
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ai_router_recovery',
        via: 'openrouter:meta-llama/llama-3.3-70b-instruct:free',
      }),
    );

    void fetchMock;
  });

  it('METRICS: emits ai_router_exhausted when all providers fail', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([
      { ok: false, status: 429, text: '{"e":1}' },
      { ok: false, status: 429, text: '{"e":2}' },
    ]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      groqApiKey: undefined,
      openrouterApiKey: 'o',
      freeModelChain: ['a:free', 'b:free'],
    })!;
    await expect(
      router.models.generateContent({ model: 'x', contents: 'q' }),
    ).rejects.toThrow();

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ai_router_exhausted',
        totalAttempts: 3,
      }),
    );
    void fetchMock;
  });

```

**Step 10.4: Run the new tests to verify they fail**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts -t "METRICS" 2>&1 | tail -10
```

Expected: **FAIL** — the router doesn't call `logEvent` yet, so `mockLogEvent` was never invoked.

### Task 11: Implement metrics emission (GREEN)

**Files:**
- Modify: `server/ai-router.mjs`

**Step 11.1: Add the import at top of file**

After the existing import, add:

Old:
```js
import { GoogleGenAI } from '@google/genai';
```

New:
```js
import { GoogleGenAI } from '@google/genai';
import { logEvent } from './observability/logger.mjs';
```

(Adjust the import path to match what `server/ai-router.mjs`'s relative location requires — likely `./observability/logger.mjs` since both live under `server/`.)

If the logger module doesn't have a named `logEvent` export, **fall back to a no-op stub** to avoid hard-breaking the file:

```js
import { GoogleGenAI } from '@google/genai';

let logEvent;
try {
  ({ logEvent } = await import('./observability/logger.mjs'));
} catch {
  logEvent = () => {};  // structured logger absent in this environment
}
```

But: `await import()` at module top-level in `.mjs` requires top-level await. If the file doesn't already use top-level await, prefer a lazy-loaded sync require shim:

```js
function safeLogEvent(fields) {
  try {
    // Lazy-required to keep ai-router.mjs free of init-time dependencies.
    const mod = require('./observability/logger.mjs');
    if (typeof mod.logEvent === 'function') return mod.logEvent(fields);
  } catch {
    // logger module unavailable — drop the event silently
  }
}
```

But wait — `.mjs` files don't have CommonJS `require` by default. Use `createRequire`:

```js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function safeLogEvent(fields) {
  try {
    const mod = require('./observability/logger.mjs');
    if (typeof mod.logEvent === 'function') return mod.logEvent(fields);
  } catch {
    // logger missing — drop silently
  }
}
```

**Decision rule**: pick whichever pattern other `server/` modules already use. Check `server.mjs` for examples:
```bash
grep -n "createRequire\|require\|import .* from" server.mjs | head -10
```

If `server.mjs` uses static imports for everything, use static import for the logger too and accept the hard dependency:
```js
import { logEvent } from './observability/logger.mjs';
```

Pick the pattern that matches existing convention.

**Step 11.2: Emit cascade + recovery + exhausted events**

In the `generateContent` cascade loop, replace the existing `console.warn` lines with `logEvent` calls (keeping `console.warn` AS WELL for human-readable logs in dev — it's fine to dual-emit because the structured logger writes JSON and console.warn writes prose):

Old:
```js
    let lastErr = null;
    for (let i = 0; i < attempts.length; i++) {
      // Aggregate-budget guard: don't start a new leg if we've already
      // burned more than the budget.
      if (Date.now() - startedAt >= aggregateBudgetMs) {
        const total = Date.now() - startedAt;
        console.warn(`[ai-router] aggregate budget exhausted after ${total}ms, giving up`);
        const budgetErr = new Error(`[ai-router] aggregate budget exhausted (${total}ms >= ${aggregateBudgetMs}ms)`);
        budgetErr.code = 'CASCADE_TIMEOUT';
        throw budgetErr;
      }
      const { label, call } = attempts[i];
      try {
        const result = await call();
        if (i > 0) {
          console.warn(`[ai-router] recovered via ${label} after ${i} failed attempt(s)`);
        }
        return result;
      } catch (err) {
        lastErr = err;
        if (!isCascadableProviderError(err)) {
          throw err;
        }
        console.warn(`[ai-router] ${label} quota/429, falling through`);
      }
    }
    throw lastErr ?? new Error('[ai-router] all providers exhausted');
  }
```

New:
```js
    let lastErr = null;
    for (let i = 0; i < attempts.length; i++) {
      if (Date.now() - startedAt >= aggregateBudgetMs) {
        const total = Date.now() - startedAt;
        console.warn(`[ai-router] aggregate budget exhausted after ${total}ms, giving up`);
        logEvent({
          event: 'ai_router_exhausted',
          reason: 'CASCADE_TIMEOUT',
          totalAttempts: i,
          elapsedMs: total,
        });
        const budgetErr = new Error(`[ai-router] aggregate budget exhausted (${total}ms >= ${aggregateBudgetMs}ms)`);
        budgetErr.code = 'CASCADE_TIMEOUT';
        throw budgetErr;
      }
      const { label, call } = attempts[i];
      try {
        const result = await call();
        if (i > 0) {
          console.warn(`[ai-router] recovered via ${label} after ${i} failed attempt(s)`);
          logEvent({
            event: 'ai_router_recovery',
            via: label,
            failedAttempts: i,
            elapsedMs: Date.now() - startedAt,
          });
        }
        return result;
      } catch (err) {
        lastErr = err;
        if (!isCascadableProviderError(err)) {
          throw err;
        }
        console.warn(`[ai-router] ${label} quota/429, falling through`);
        logEvent({
          event: 'ai_router_cascade',
          from: label,
          to: i + 1 < attempts.length ? attempts[i + 1].label : null,
          errorStatus: err?.status ?? null,
        });
      }
    }
    logEvent({
      event: 'ai_router_exhausted',
      reason: 'ALL_PROVIDERS_FAILED',
      totalAttempts: attempts.length,
      elapsedMs: Date.now() - startedAt,
    });
    throw lastErr ?? new Error('[ai-router] all providers exhausted');
  }
```

**Step 11.3: Run the metrics tests**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts -t "METRICS" 2>&1 | tail -10
```

Expected: 2 passing.

**Step 11.4: Run full ai-router suite**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts 2>&1 | tail -5
```

Expected: **19 passed (19)** — 17 from previous + 2 new METRICS tests.

```bash
npx vitest run 2>&1 | tail -5
```

Expected: full suite green except pre-existing flake.

```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

### Task 12: Commit

**Step 12.1: Stage and commit**

Run:
```bash
git add server/ai-router.mjs src/__tests__/ai-router.test.ts
git commit -m "$(cat <<'EOF'
feat(ai-router): structured-log cascade events for observability (I-5)

Pre-fix: cascade events only emitted human-readable console.warn lines.
No metrics ingestion path. Production debugging required grepping
Railway logs.

Three structured events now emit via the existing logEvent helper:

- ai_router_cascade: { from, to, errorStatus } — fires when a leg fails
  and we move to the next provider. errorStatus is the HTTP status
  (404/429/502/503) when available.
- ai_router_recovery: { via, failedAttempts, elapsedMs } — fires when a
  cascade succeeds at attempt N>0. Tracks "how often does the cascade
  save us in prod?"
- ai_router_exhausted: { reason, totalAttempts, elapsedMs } — fires
  when the loop ends without success. reason is 'CASCADE_TIMEOUT' or
  'ALL_PROVIDERS_FAILED'.

console.warn lines retained for dev-time legibility — dual emission
is fine (JSON logger writes structured, console.warn writes prose).

Future Grafana dashboard wiring is now a logger-side concern, not
an ai-router refactor.

Suite: 19/19 (was 17/17).

Closes 2026-05-09 review I-5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 5: M-1..M-5 (hygiene bundle)

**Goal:** All five Minor findings rolled into one cosmetic-only commit. No behavior change.

### Task 13: M-1 — consolidate timeout constants

**Files:**
- Modify: `server/ai-router.mjs`

**Step 13.1: Apply the consolidation**

Old:
```js
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_TIMEOUT_MS = 30_000;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TIMEOUT_MS = 30_000;
```

New:
```js
const PROVIDER_TIMEOUT_MS = 30_000;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
```

Then replace all uses of `OPENROUTER_TIMEOUT_MS` and `GROQ_TIMEOUT_MS` with `PROVIDER_TIMEOUT_MS` (use Edit with replace_all to catch both `setTimeout(...) => controller.abort(), OPENROUTER_TIMEOUT_MS)` and the Groq variant).

Run grep first to confirm only 2 callers:
```bash
grep -n "OPENROUTER_TIMEOUT_MS\|GROQ_TIMEOUT_MS" server/ai-router.mjs
```

Expected: 4 hits (2 declarations + 2 uses). After consolidation: 2 uses of `PROVIDER_TIMEOUT_MS`.

### Task 14: M-2 — expose `_source` as response header (deferred — not in this commit)

**Decision:** M-2 is "expose `_source` as `X-AI-Source` response header for DevTools tracing." This requires touching every callsite in `server.mjs` that uses the geminiClient (multiple routes). That's a different surface than ai-router and would balloon this hygiene commit.

**Action: skip M-2 in this commit.** Document in commit message as deferred. Track as a separate ticket if useful.

### Task 15: M-3 — defang error message leak risk

**Files:**
- Modify: `server/ai-router.mjs` (callGroq + callOpenRouter both have the same pattern)

**Step 15.1: Inspect the current pattern**

Both functions construct an error like:
```js
const err = new Error(`groq ${model} ${res.status}: ${raw.slice(0, 300)}`);
```

The 300-char raw response body slice contains provider-specific messages. If these errors ever reach a client, provider details leak.

**Step 15.2: Add a comment + redact secrets defensively**

Add a redaction step. Most provider errors are JSON-shaped — strip likely-sensitive fields before slicing.

Old (in callGroq):
```js
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      const err = new Error(`groq ${model} ${res.status}: ${raw.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
```

New:
```js
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      // Defang potentially sensitive fields. Most provider errors are
      // JSON-shaped; strip auth tokens, request IDs, and internal request
      // metadata before slicing. Truly malformed bodies fall through as-is.
      const defanged = redactErrorBody(raw);
      const err = new Error(`groq ${model} ${res.status}: ${defanged.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
```

Same pattern for `callOpenRouter`.

Add the helper at the top of the file (after `isCascadableProviderError`):

```js
/**
 * Redact potentially sensitive fields from a provider error body before
 * including it in an error message. Defensive — provider errors usually
 * don't leak credentials, but request IDs and internal trace IDs are best
 * kept out of error chains that might bubble to clients.
 */
function redactErrorBody(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  return raw
    .replace(/"(?:authorization|api[_-]?key|access[_-]?token|x-amz-security-token)"\s*:\s*"[^"]*"/gi, '"[redacted]":"[redacted]"')
    .replace(/(bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
    .replace(/("request_id"\s*:\s*)"[^"]*"/g, '$1"[redacted]"');
}
```

**Step 15.3: tsc**

Run:
```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

### Task 16: M-5 — empty-array fallback comment

**Files:**
- Modify: `server/ai-router.mjs` (line ~249-250)

**Step 16.1: Add a comment**

Old:
```js
  const chain = Array.isArray(freeModelChain) && freeModelChain.length > 0 ? freeModelChain : DEFAULT_FREE_MODEL_CHAIN;
  const groqChain = Array.isArray(groqModelChain) && groqModelChain.length > 0 ? groqModelChain : DEFAULT_GROQ_MODEL_CHAIN;
```

New:
```js
  // An empty array passed by a caller falls back to the DEFAULT chain —
  // this is a defensive guard against accidental zero-length config, NOT
  // a way to disable a tier. To disable a tier, omit its API key.
  const chain = Array.isArray(freeModelChain) && freeModelChain.length > 0 ? freeModelChain : DEFAULT_FREE_MODEL_CHAIN;
  const groqChain = Array.isArray(groqModelChain) && groqModelChain.length > 0 ? groqModelChain : DEFAULT_GROQ_MODEL_CHAIN;
```

### Task 17: M-4 — referer + title comment

**Files:**
- Modify: `server/ai-router.mjs` (line ~240-241)

**Step 17.1: Add an explanatory comment**

Old:
```js
  referer = 'https://bazodiac.space',
  title = 'Bazodiac',
  aggregateBudgetMs = DEFAULT_AGGREGATE_BUDGET_MS,
```

New:
```js
  // OpenRouter-specific — Groq doesn't use these. Kept on the factory
  // signature for now to avoid a breaking change; if more provider-
  // specific knobs accumulate, refactor to per-tier config objects.
  referer = 'https://bazodiac.space',
  title = 'Bazodiac',
  aggregateBudgetMs = DEFAULT_AGGREGATE_BUDGET_MS,
```

### Task 18: Run full suite + tsc + build

**Step 18.1: Verify**

Run:
```bash
npx vitest run src/__tests__/ai-router.test.ts 2>&1 | tail -5
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected:
- ai-router suite: **19 passed (19)** — unchanged (M-1..M-5 are cosmetic)
- full suite: green except pre-existing flake
- tsc: clean
- build: succeeds

**STOP if anything regresses.**

### Task 19: Commit

**Step 19.1: Stage and commit**

Run:
```bash
git add server/ai-router.mjs
git commit -m "$(cat <<'EOF'
refactor(ai-router): hygiene bundle — M-1, M-3, M-4, M-5

Five Minor findings from the 2026-05-09 review, none touching behavior:

- M-1: OPENROUTER_TIMEOUT_MS + GROQ_TIMEOUT_MS were duplicate magic
  numbers (both 30_000). Consolidated to PROVIDER_TIMEOUT_MS.
- M-3: provider-error message slice could leak request IDs / auth
  tokens if the message ever reached a client. New redactErrorBody
  helper strips authorization headers, bearer tokens, and request_id
  fields before the 300-char slice. Defense-in-depth — the existing
  503 envelope at /api/daily-pulse already shields clients, this just
  removes the residual leak risk.
- M-4: explanatory comment on `referer` / `title` factory args
  documenting they're OpenRouter-specific (Groq doesn't use them).
  Future refactor target: per-tier config objects.
- M-5: explanatory comment on the empty-array fallback for
  freeModelChain / groqModelChain — clarifies that it's a defensive
  guard against zero-length config, not the way to disable a tier
  (omit API key for that).

M-2 (expose `_source` as `X-AI-Source` response header) deferred —
requires touching all geminiClient callsites in server.mjs and would
balloon this hygiene commit. Tracked as separate work.

Suite: 19/19. tsc clean. build OK.

Closes 2026-05-09 review M-1, M-3, M-4, M-5. M-2 deferred.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

### Task 20: Suite + tsc + build

**Step 20.1: Run final consolidated check**

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected:
- vitest: full suite green (modulo pre-existing `vibes-perf.test.ts` flake)
- tsc: clean
- build: succeeds in <30s

### Task 21: Push and open PR

**Step 21.1: Push**

```bash
git push -u origin <current-branch-name>
```

**Step 21.2: Open PR**

```bash
gh pr create --base main --title "Address PR #333 review findings (I-1..I-5 + M-1, M-3..M-5)" --body "$(cat <<'EOF'
## Summary

Closes the 2026-05-09 code review findings on `server/ai-router.mjs`. Five commits, one finding each:

1. **`refactor(ai-router): rename + comment fix` (I-1, I-2)** — `isQuotaOr429Error` → `isCascadableProviderError`; corrected misleading comment in `normalizeOpenRouterModel`.
2. **`test(ai-router): cover Groq tier in cascade` (I-4)** — 3 new tests asserting Groq direct success, Groq cascade through models, and full 3-tier cascade with call-order assertions.
3. **`fix(ai-router): aggregate cascade budget` (I-3)** — `aggregateBudgetMs` factory option (default 90s) caps worst-case cascade latency from 275s to 90s. Test `CASCADE-BUDGET` proves the budget triggers between attempts.
4. **`feat(ai-router): structured-log cascade events` (I-5)** — `ai_router_cascade` / `ai_router_recovery` / `ai_router_exhausted` events emit via the existing `logEvent` helper. Production cascade visibility for Grafana wiring.
5. **`refactor(ai-router): hygiene bundle` (M-1, M-3, M-4, M-5)** — consolidated timeout constants, error-body redaction helper, explanatory comments. M-2 deferred.

## Test plan
- [ ] `npm test` — full suite green (modulo pre-existing `vibes-perf.test.ts` flake)
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run build` — OK
- [ ] ai-router suite: 19/19 (was 13/13 at PR #333 merge)
- [ ] Logs after Railway redeploy: structured `ai_router_cascade` events visible when AI providers fail
- [ ] Stress test: trigger cascade-timeout in dev (e.g., set `aggregateBudgetMs: 100` in dev wiring) → 503 returned in <200ms instead of >2 minutes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done-when checklist

- [ ] Commit 1 (rename + comment): 13/13 ai-router tests still pass
- [ ] Commit 2 (Groq coverage): 16/16
- [ ] Commit 3 (aggregate budget): 17/17
- [ ] Commit 4 (metrics): 19/19
- [ ] Commit 5 (hygiene): 19/19 unchanged
- [ ] tsc clean throughout
- [ ] build succeeds throughout
- [ ] PR opened, all 5 commits visible in diff
- [ ] No commit changed any callsite outside `server/ai-router.mjs` + `src/__tests__/ai-router.test.ts` (clean blast radius)
- [ ] M-2 explicitly noted as deferred (not silently dropped)

## Out of scope (deliberate)

- M-2: `X-AI-Source` response header. Requires touching all geminiClient callsites in `server.mjs`. Separate ticket if revived.
- Live load test with real Gemini/Groq/OpenRouter quotas. Unit-level tests cover the cascade contract; production-time observation via the new metrics events is the actual confirmation path.
- Refactor to per-tier provider config objects. Deferred until a fourth provider tier appears or the factory signature genuinely accumulates more knobs.

---

## References

- Source PR: #333 — `fix(ai-router): cascade on 404/502/503 + drop dead google :free models + add Groq tier`
- Code review (this session, 2026-05-09): 11 findings — 0 Critical, 5 Important (I-1..I-5), 5 Minor (M-1..M-5), 1 strength-only summary
- Related plan: `docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md` (parent Tagespuls work)
