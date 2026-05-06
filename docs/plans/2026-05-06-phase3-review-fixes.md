# Phase 3 Review-Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the two Minor findings from the `/full-review` of commits `80443be..c4c591a` by wiring the new ElevenLabs auth middleware onto its five inline-bearer-check sites and adding a Phase 3 sub-section to `CHANGELOG.md`.

**Architecture:** Replace the five inline `token !== ELEVENLABS_TOOL_SECRET` checks in `server.mjs` with the new `elevenLabsAuth` middleware (timing-safe, structured envelope, fail-closed on misconfig). Each call site is a small, identical patch — register the middleware on the route, remove the inline header parse + comparison, leave the handler body untouched. CHANGELOG renames the existing 2026-05-06 entry to `(Phases 1 + 2 + 3 partial)` and appends three feature bullets.

**Tech Stack:** Express.js, no new dependencies. The `crypto.timingSafeEqual` helper is already in place via `server/middleware/elevenLabsAuth.mjs` from Task 15.

---

## Findings recap

| # | Severity | Issue | Action |
|---|----------|-------|--------|
| 1 | Minor | `elevenLabsAuth` middleware exists but the five tool routes still use the inline timing-unsafe check | Replace inline checks with middleware on /api/profile/:userId, /api/agent/conversation, /api/agent/daily/:userId, /api/agent/match, /api/agent/summary |
| 2 | Minor | CHANGELOG.md missing Phase 3 entry for Tasks 15–16 | Insert Phase 3 (partial) sub-section under the existing 2026-05-06 block |

The "library-only" Task 16 logger flag from the review is **not** addressed here — wiring `logRequest` into the request lifecycle is a deliberate larger refactor scheduled for a later sprint. We are explicitly NOT hooking it into all routes in this fix batch.

---

## Task 1: Wire `elevenLabsAuth` onto the five tool routes

The middleware ships with these contract guarantees that the inline checks lacked:

1. `crypto.timingSafeEqual` instead of `===`.
2. `503 AI_CONFIG_MISSING` if `ELEVENLABS_TOOL_SECRET` is unset/empty (fail-closed).
3. Structured-envelope responses on every error path.

Replacing the inline checks gives all five routes those guarantees in one shot.

### Audit: locate every inline call site

```bash
grep -nE "ELEVENLABS_TOOL_SECRET|authHeader\.replace.*Bearer" server.mjs
```

Expected matches (inline tool-auth sites only — Stripe, Supabase JWT auth are different routes):

| Line | Route |
|------|-------|
| ~4683 | `GET  /api/profile/:userId` |
| ~4922 | `POST /api/agent/conversation` |
| ~4965 | `GET  /api/agent/daily/:userId` |
| ~5085 | `POST /api/agent/match` |
| ~5361 | `POST /api/agent/summary` (uses Supabase JWT — verify, exclude if so) |

The exact line numbers may drift between commits. Use grep at execution time, not these hardcoded numbers.

**Note on `/api/agent/summary`** (line ~5321 in current state): inspect before touching. If it uses `requireUserAuth` (Supabase JWT path), it is **not** an ElevenLabs tool endpoint and must be left alone. Re-grep:

```bash
sed -n '5320,5340p' server.mjs
```

Only the four routes that match `if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET)` should be migrated.

**Files:**
- Modify: `server.mjs` (import + four route registrations)

### Step 1: Add the import

Modify the existing import block in `server.mjs` (around line 11–13):

```js
// BEFORE
import { aiRouter } from "./server/routes/ai.routes.mjs";
import { requestIdMiddleware } from "./server/middleware/requestId.mjs";
import { requireOwnership } from "./server/middleware/ownership.mjs";

// AFTER (add one line)
import { aiRouter } from "./server/routes/ai.routes.mjs";
import { requestIdMiddleware } from "./server/middleware/requestId.mjs";
import { requireOwnership } from "./server/middleware/ownership.mjs";
import { elevenLabsAuth } from "./server/middleware/elevenLabsAuth.mjs";
```

### Step 2: Replace the inline check on `/api/profile/:userId`

Find the route at `server.mjs:~4683`. Current shape:

```js
app.get("/api/profile/:userId", async (req, res) => {
  // Verify bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }
  // … handler body continues …
});
```

Patch:

```js
app.get("/api/profile/:userId", elevenLabsAuth, async (req, res) => {
  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }
  // … handler body continues …
});
```

The 6 inline auth lines drop. The handler body stays identical.

### Step 3: Replace the inline check on `/api/agent/conversation`

Same shape, same patch. Use the `Edit` tool with the exact existing inline check as `old_string` so we don't accidentally edit a different route.

### Step 4: Replace the inline check on `/api/agent/daily/:userId`

Same pattern.

### Step 5: Replace the inline check on `/api/agent/match`

Same pattern.

### Step 6: Verify nothing else broke

```bash
node --check server.mjs && echo "syntax OK"
npx vitest run server/__tests__/elevenLabsAuth.test.mjs
npx vitest run server/__tests__/ 2>&1 | tail -5
```

Expected:
- `syntax OK`
- 7/7 elevenLabsAuth tests pass (unchanged, the middleware itself didn't change)
- 100/100 server tests pass

Then a server-boot smoke test to confirm the routes still mount and the migrated check returns the new envelope:

```bash
SUPABASE_URL=http://localhost VITE_SUPABASE_URL=http://localhost \
SUPABASE_SERVICE_ROLE_KEY=placeholder VITE_SUPABASE_ANON_KEY=placeholder \
ELEVENLABS_TOOL_SECRET=test-secret PORT=3001 node server.mjs > /tmp/server-smoke.log 2>&1 &
SERVER_PID=$!
sleep 4

# Test each route returns the structured envelope on missing auth
for route in \
  "GET /api/profile/abc" \
  "POST /api/agent/conversation" \
  "GET /api/agent/daily/abc" \
  "POST /api/agent/match"; do
  echo "--- $route ---"
  method=$(echo "$route" | cut -d' ' -f1)
  path=$(echo "$route" | cut -d' ' -f2)
  curl -sS -X "$method" "http://localhost:3001$path" \
    -H 'Content-Type: application/json' -d '{}' \
    -w '\nHTTP %{http_code}\n'
done

kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
```

Expected for every call: HTTP 401 with body `{"error":{"code":"AUTH_REQUIRED",...}}` (the new envelope), not the old `{"error":"Unauthorized"}` string.

Then verify the wrong-token path returns AUTH_INVALID:

```bash
curl -sS http://localhost:3001/api/profile/abc \
  -H 'Authorization: Bearer wrong' -w '\nHTTP %{http_code}\n'
# Expected: 401, error.code: AUTH_INVALID
```

### Step 7: Commit

```bash
git add server.mjs
git commit -m "$(cat <<'EOF'
refactor(server): wire elevenLabsAuth middleware onto tool routes

Replaces five inline `token !== ELEVENLABS_TOOL_SECRET` checks in
/api/profile/:userId, /api/agent/conversation, /api/agent/daily/:userId,
and /api/agent/match with the new server/middleware/elevenLabsAuth.mjs
(Task 15). Each route gains:

- crypto.timingSafeEqual instead of string === (eliminates the
  byte-by-byte timing oracle on the secret).
- 503 AI_CONFIG_MISSING when ELEVENLABS_TOOL_SECRET is unset/empty
  (fail-closed) instead of treating any token as wrong-secret.
- Structured envelope responses (AUTH_REQUIRED / AUTH_INVALID /
  AI_CONFIG_MISSING) — same shape as the AI router and ownership
  middleware. Old `{"error":"Unauthorized"}` shape is gone.

ElevenLabs custom-tool clients see the same 401 status code on the
unhappy path; only the response body shape changes. Tools that ignore
the body (most do — they retry on any 401) are unaffected.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: CHANGELOG Phase 3 (partial) entry

Extend the existing `## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phases 1 + 2)` block: rename the header to `(Phases 1 + 2 + 3 partial)`, append three Phase 3 feature bullets, refresh the Tests count, refresh Notes.

**Files:**
- Modify: `CHANGELOG.md`

### Step 1: Read the current top of `CHANGELOG.md`

```bash
head -25 CHANGELOG.md
```

Confirm the first heading is the Phases 1+2 block.

### Step 2: Rename the header

Use the `Edit` tool:

```
old_string: ## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phases 1 + 2)
new_string: ## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phases 1 + 2 + 3 partial)
```

### Step 3: Append three Phase 3 bullets at the end of `### Features`

Insert these directly after the "Visibility-aware client polling" bullet, **before** `### Refactoring`:

```markdown
- **ElevenLabs tool-auth middleware** (`server/middleware/elevenLabsAuth.mjs`) — `crypto.timingSafeEqual` Bearer-secret check replaces the five inline `token !== ELEVENLABS_TOOL_SECRET` comparisons on `/api/profile/:userId`, `/api/agent/conversation`, `/api/agent/daily/:userId`, and `/api/agent/match`. Fail-closed: returns 503 `AI_CONFIG_MISSING` when `ELEVENLABS_TOOL_SECRET` is unset/empty so misconfigured deploys can't accidentally accept random tokens. Structured-envelope responses (AUTH_REQUIRED / AUTH_INVALID / AI_CONFIG_MISSING) instead of the previous `{"error":"Unauthorized"}` string.
- **Server log redaction utility** (`server/utils/redact.mjs`) — deep-copy redactor that replaces values for known-secret keys (`Authorization`, `Cookie`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `stripe-signature`, `ELEVENLABS_TOOL_SECRET`, `password`, `token`, `api_key`, `secret`, etc.) with `[REDACTED]`. Bounded recursion (MAX_DEPTH=6) so cycles cannot blow the stack. Case-insensitive exact-key match — innocent fields like `tokens_used` stay readable. Never mutates input.
- **Structured request logger** (`server/observability/logger.mjs`) — emits one JSON line per request with `request_id` / `method` / `route` / `status` / `latency_ms` / `provider` / `cache_status` / `quota_status` / `error_code`. User IDs and IPs go through SHA-256 → 12-char hex (`hashId`) so logs are user-groupable without carrying PII into log storage. Library-only — no route emits log lines yet; wiring into the request lifecycle is a follow-up.
```

### Step 4: Update the `### Tests` count

Find the existing line:

```markdown
- 73 server-side tests (was 47): ApiError classes (5), …
```

Replace with:

```markdown
- 100 server-side tests (was 47): ApiError classes (5), request ID middleware (4), auth middleware (5), error handler (5), AI rate limit (3), Zod validate (6), AI schemas (9), AI routes (10), ownership middleware (4), AI quota service (12), cache service (10), ElevenLabs auth middleware (7), redact utility (14), and structured logger (6). 5 client tests for `useSignaturSignal` cover polling cadence (POLL-001..005). Full suite: 2196/2196.
```

### Step 5: Update the `### Notes` section

Find:

```markdown
- Implementation plan: `docs/plans/2026-05-06-backend-hardening.md` (Phases 1 + 2 of 5).
- Review-fix plans: `docs/plans/2026-05-06-backend-hardening-review-fixes.md` (Phase 1) + `docs/plans/2026-05-06-phase2-review-fixes.md` (Phase 2).
- AI quota service is **wired** into the codebase but **not yet attached** to any route. The next sprint chunk wires it onto `/api/interpret` and `/api/analyze/conversation`, then expands to `/api/experience/*` and `/api/agent/*`.
- ElevenLabs auth refactor, structured logger + redact, public-data stale-if-error cache, Stripe-webhook regression test, and the CI secret-scan are scheduled for Phase 3 (Tasks 15–19 in the main plan).
```

Replace the last bullet with:

```markdown
- Phase 3 partial: Tasks 15 (ElevenLabs auth middleware) and 16 (redact + logger) shipped. Tasks 17 (Stripe webhook regression test), 18 (public-data stale-if-error cache), and 19 (CI secret-scan) are still pending — they'll land in the next batch.
- Review-fix plans: `docs/plans/2026-05-06-backend-hardening-review-fixes.md` (Phase 1) + `docs/plans/2026-05-06-phase2-review-fixes.md` (Phase 2) + `docs/plans/2026-05-06-phase3-review-fixes.md` (Phase 3 partial — this batch wires elevenLabsAuth onto its five callers).
```

### Step 6: Verify the diff is exactly what you expected

```bash
git diff CHANGELOG.md | head -60
```

Expected: header rename, three new feature bullets, updated Tests count, updated Notes. No deletions of Phase 1 or Phase 2 content.

### Step 7: Commit

```bash
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
docs(changelog): backend hardening sprint Phase 3 partial (Tasks 15-16)

Records the ElevenLabs auth middleware (Task 15), redact utility, and
structured JSON logger (Task 16) shipped in commits 80443be..c4c591a,
plus the elevenLabsAuth wire-up follow-up in this batch. Phase 3 is
"partial" — Tasks 17 (Stripe webhook regression test), 18 (public-data
stale-if-error cache), and 19 (CI secret-scan) are still pending.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Final verification

**Files:** none — sign-off only.

### Step 1: Full test suite

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 2196/2196 pass — no test count change (the wire-up doesn't add tests, the existing elevenLabsAuth tests already cover the middleware behaviour).

### Step 2: Typecheck

```bash
npm run lint 2>&1 | tail -3
```

Expected: zero errors.

### Step 3: Server boot smoke

Identical to Task 1 Step 6 — confirms migrated routes return the structured envelope.

### Step 4: Sign off

After Steps 1–3 pass, the batch is ready for `/ship`.

---

## Done-when checklist

- [ ] Task 1: All four ElevenLabs tool routes call `elevenLabsAuth` middleware; inline `token !== ELEVENLABS_TOOL_SECRET` checks deleted; live curl shows the new envelope.
- [ ] Task 2: `CHANGELOG.md` header reads `(Phases 1 + 2 + 3 partial)`; three Phase 3 bullets present; Tests count is 100; Notes lists Tasks 17–19 as pending.
- [ ] Task 3: Full test suite green at 2196 + tsc clean + smoke test confirms migrated routes use the new envelope.
