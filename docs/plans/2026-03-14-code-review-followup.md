# Code Review Follow-Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the four issues flagged in the PR #55 code review: unguarded chart GET route, lying space-weather test, language switch not re-generating interpretation, and two clarifying code comments.

**Architecture:** All fixes go directly on the existing `feature/arch-hardening-clean` branch in the worktree at `~/.config/superpowers/worktrees/Astro-Noctum/arch-hardening`. Three are genuine bugs, one is cosmetic. Tasks are independent — each gets its own commit.

**Tech Stack:** Express.js (server.mjs), React 19 hooks (useAstroProfile.ts), Vitest + supertest (api-routes.test.ts, useAstroProfile.test.ts)

---

## Context for Implementor

### Where is the worktree?
```bash
cd ~/.config/superpowers/worktrees/Astro-Noctum/arch-hardening
```
This is on branch `feature/arch-hardening-clean`. All commands below assume you're in this directory.

### What is `requireUserAuth`?
An async Express middleware in `server.mjs` (line 352) that validates the Supabase JWT from the `Authorization: Bearer <token>` header. Returns 401 if missing/invalid, 503 if Supabase is down.

### What is `handleRegenerate`?
A `useCallback` in `useAstroProfile.ts` (line 161) that calls `generateInterpretation(apiData, lang)` and updates interpretation/tile/house state. It already reads the current `lang` — we just need to call it automatically on lang change.

### What is the space-weather fallback?
`server.mjs` has a 4-step waterfall: NOAA → NASA DONKI → stale cache → neutral fallback. When ALL sources fail (including no stale cache), it returns `{ source: "fallback", kp_index: 0, ... }`. The test title says "neutral fallback" but the source assertion says `"DONKI"` — these contradict each other.

---

## Task 1: Guard GET /api/chart

**Files:**
- Modify: `server.mjs` (line 393)
- Modify: `src/__tests__/api-routes.test.ts` (add inside the `BAFE proxy auth guard` describe block)

The GET `/api/chart` proxies chart data to BAFE using query-string birth parameters. Chart data is user-specific and should require a valid session — same as the POST route.

### Step 1: Write the failing test

Open `src/__tests__/api-routes.test.ts`. Inside the existing `describe('BAFE proxy auth guard', ...)` block (after line 88), add:

```typescript
it('returns 401 on GET /api/chart when no Authorization header', async () => {
  const app = await loadTestApp();
  const res = await request(app)
    .get('/api/chart')
    .query({ date: '2000-01-01T12:00:00', tz: 'UTC', lat: '52', lon: '13' });
  expect(res.status).toBe(401);
  expect(res.body.error).toBe('Authentication required');
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run src/__tests__/api-routes.test.ts -t "GET /api/chart"
```

Expected: FAIL — test gets 200 (route proxies without auth check)

### Step 3: Add `requireUserAuth` to the GET /api/chart route

In `server.mjs`, change line 393 from:

```javascript
app.get("/api/chart", (req, res) => {
```

To:

```javascript
app.get("/api/chart", requireUserAuth, (req, res) => {
```

The full block becomes:
```javascript
app.get("/api/chart", requireUserAuth, (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const suffix = `/chart${qs ? `?${qs}` : ""}`;
  proxyToBafeWithFallback(bafeFallbackUrls(suffix), req, res);
});
```

### Step 4: Run test to verify it passes

```bash
npx vitest run src/__tests__/api-routes.test.ts -t "GET /api/chart"
```

Expected: PASS

### Step 5: Run full suite to check no regressions

```bash
npx vitest run src/__tests__/api-routes.test.ts
```

Expected: All 5 tests pass (the space-weather source assertion will still fail — that's Task 2).

### Step 6: Commit

```bash
git add server.mjs src/__tests__/api-routes.test.ts
git commit -m "security: guard GET /api/chart with requireUserAuth middleware"
```

---

## Task 2: Fix Lying Space-Weather Test

**Files:**
- Modify: `src/__tests__/api-routes.test.ts` (line 52)

The test title is "returns neutral fallback from /api/space-weather when upstream fails" — but the assertion `source: 'DONKI'` describes the *success* case, not the fallback. When `fetch` is mocked to reject, both NOAA and DONKI fail, so the server returns `source: 'fallback'`. The test is asserting the wrong value.

### Step 1: Confirm the bug by reading the current test

The failing test (line 42-55 in `api-routes.test.ts`):
```typescript
it('returns neutral fallback from /api/space-weather when upstream fails', async () => {
  // fetch mocked to reject → all sources fail
  expect(response.body.source).toBe('DONKI');  // ← WRONG: should be 'fallback'
```

And in `server.mjs` (line 634-636), the actual neutral fallback:
```javascript
return res.json({
  kp_index: 0,
  source: "fallback",   // ← what actually gets returned
```

### Step 2: Fix the assertion

In `src/__tests__/api-routes.test.ts`, change line 52:

```typescript
// Before:
expect(response.body.source).toBe('DONKI');

// After:
expect(response.body.source).toBe('fallback');
```

### Step 3: Run the test to verify it now passes

```bash
npx vitest run src/__tests__/api-routes.test.ts
```

Expected: The previously-failing space-weather test now PASSES. Total: 2 test files, pre-existing Tooltip failures still present, space-weather failure gone.

### Step 4: Commit

```bash
git add src/__tests__/api-routes.test.ts
git commit -m "fix: correct space-weather test assertion (source is 'fallback' not 'DONKI' when all upstreams fail)"
```

---

## Task 3: Re-Generate Interpretation on Language Switch

**Files:**
- Modify: `src/hooks/useAstroProfile.ts`
- Modify: `src/__tests__/useAstroProfile.test.ts`

When a user switches language (DE → EN or EN → DE), `useAstroProfile` never re-generates the AI interpretation. The profile-loading effect is intentionally gated by `profileFetchedForRef` to run only once per user — it can't be re-triggered by lang changes. We need a separate effect that calls `handleRegenerate` when lang changes after a profile is loaded.

**Context:** `handleRegenerate` already uses the current `lang` value (it's in its `useCallback` deps). We just need to call it at the right moment. We do NOT want to re-generate on every render or when the user is still loading — only when a loaded profile exists and lang changes after the initial mount.

### Step 1: Write the failing test

Add to `src/__tests__/useAstroProfile.test.ts`, inside the existing `describe('useAstroProfile', ...)` block:

```typescript
it('re-generates interpretation when language changes after profile is loaded', async () => {
  const { generateInterpretation } = await import('../services/gemini');
  const mockGenerate = vi.mocked(generateInterpretation);
  mockGenerate.mockResolvedValue({
    interpretation: 'English interpretation',
    tiles: {},
    houses: {},
  });

  const { result, rerender } = renderHook(
    ({ lang }: { lang: 'de' | 'en' }) => useAstroProfile(mockUser, lang),
    { initialProps: { lang: 'de' as const } }
  );

  // Wait for profile to load (not-found state, then trigger submit to reach 'found')
  await act(async () => { await new Promise(r => setTimeout(r, 50)); });
  await act(async () => {
    await result.current.handleSubmit({
      date: '2000-01-01T12:00:00',
      tz: 'Europe/Berlin',
      lat: 52.5,
      lon: 13.4,
    });
  });
  expect(result.current.profileState).toBe('found');

  const callCountAfterLoad = mockGenerate.mock.calls.length;

  // Switch language — should trigger re-generation
  await act(async () => {
    rerender({ lang: 'en' });
    await new Promise(r => setTimeout(r, 50));
  });

  expect(mockGenerate.mock.calls.length).toBeGreaterThan(callCountAfterLoad);
  expect(result.current.interpretation).toBe('English interpretation');
});
```

### Step 2: Run the test to verify it fails

```bash
npx vitest run src/__tests__/useAstroProfile.test.ts -t "re-generates"
```

Expected: FAIL — lang switch has no effect

### Step 3: Add lang-change effect to `useAstroProfile.ts`

In `src/hooks/useAstroProfile.ts`, add this new effect after the profile-loading effect (after line 127, before the `// ── Onboarding submit` comment):

```typescript
// ── Re-generate when language changes for a loaded profile ───────────
const langRef = useRef<string>(lang);
useEffect(() => {
  const prevLang = langRef.current;
  langRef.current = lang;
  if (prevLang === lang) return;              // no actual change
  if (profileState !== "found" || !apiData) return; // not loaded yet
  handleRegenerate();
}, [lang, profileState, apiData, handleRegenerate]);
```

Also add `useRef` to the import at the top if it's not already there (it is — line 1 already imports it).

### Step 4: Run the test to verify it passes

```bash
npx vitest run src/__tests__/useAstroProfile.test.ts
```

Expected: All 8 tests pass (7 original + 1 new)

### Step 5: Remove the eslint-disable comment since lang dep is now handled separately

In `src/hooks/useAstroProfile.ts`, the profile-loading effect ends with:

```typescript
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
```

Change it to:

```typescript
  }, [user]); // lang intentionally excluded — handled by separate lang-change effect below
```

### Step 6: Run full suite

```bash
npx vitest run
```

Expected: Same count as before (6 pre-existing failures from Tooltip + space-weather — Task 2 already fixed the space-weather one, so 5 pre-existing Tooltip failures).

### Step 7: Commit

```bash
git add src/hooks/useAstroProfile.ts src/__tests__/useAstroProfile.test.ts
git commit -m "fix: re-generate interpretation when user switches language after profile loads"
```

---

## Task 4: Add Clarifying Comments (Cosmetic)

**Files:**
- Modify: `server.mjs` (1 comment, ~line 229)
- Modify: `src/types/bafe.ts` (1 comment, ~line 204)

Two code patterns look like bugs at first glance but are intentional. Document them so future reviewers don't flag them.

### Step 1: Add cache user-scope comment in `server.mjs`

Find the `cacheKey` function (line 229):

```javascript
function cacheKey(method, url, reqBody) {
  const raw = `${method}:${url}:${JSON.stringify(reqBody || {})}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}
```

Add a comment above it:

```javascript
// Cache key is intentionally NOT scoped by user — BAFE calculate endpoints
// are pure functions of birth data (deterministic, no PII in response).
// Two users with identical birth data share a cached result, which is correct.
function cacheKey(method, url, reqBody) {
  const raw = `${method}:${url}:${JSON.stringify(reqBody || {})}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}
```

### Step 2: Add cast comment in `src/types/bafe.ts`

Find the return block in `parseAstroProfileJson` (line 203):

```typescript
  return {
    apiData: {
      bazi: bazi as MappedBazi | undefined,
      western: western as MappedWestern | undefined,
      fusion: fusion as BafeFusionResponse | undefined,
      wuxing: wuxing as MappedWuxing | undefined,
      tst: tst as BafeTstResponse | undefined,
    },
```

Add a comment above it:

```typescript
  // Casts below are deliberate trust boundaries: we validated the object shape
  // in the if/else above (version check + dual-path legacy extraction).
  // These will be replaced by generated types once BAFE OpenAPI spec is stable.
  return {
    apiData: {
      bazi: bazi as MappedBazi | undefined,
```

### Step 3: Run lint to confirm no type errors

```bash
npm run lint
```

Expected: Same 2 pre-existing errors in `ConversationAnalysisQuiz.tsx` — nothing new.

### Step 4: Commit

```bash
git add server.mjs src/types/bafe.ts
git commit -m "docs: clarify intentional patterns (cache user-scope, parser casts)"
```

---

## Final Verification

After all 4 tasks:

```bash
npx vitest run
```

Expected results:
- `api-routes.test.ts`: 5 passing (was 4 — added GET /api/chart test, fixed source assertion)
- `useAstroProfile.test.ts`: 8 passing (was 7 — added lang re-generation test)
- Tooltip tests: 5 pre-existing failures (unchanged — unrelated component)
- **Total: ~354 passing, 5 failing (all pre-existing Tooltip failures)**

Then push to update PR #55:

```bash
git push
```
