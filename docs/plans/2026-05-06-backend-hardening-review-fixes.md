# Backend Hardening Review-Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the three findings from the `/full-review` of commits `3229c7d…693f6c5` so the backend hardening batch (Tasks 1–9) is ship-ready.

**Architecture:** Move the JSON-envelope response out of the error-handler dependency chain by writing it directly inside `auth.mjs` (matching the pattern already in `validate.mjs` and the AI router's `payloadSizeGuard`). Tighten env-var handling so a missing `SUPABASE_SERVICE_ROLE_KEY` fails loudly instead of silently. Update `CHANGELOG.md` with the sprint summary. No new dependencies.

**Tech Stack:** Express.js, Vitest, supertest (for tests). All changes in `server/` and project-root `CHANGELOG.md`.

---

## Findings recap

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | Critical | `requireUserAuth` calls `next(ApiError…)` but `server.mjs` has no error handler — auth failures return HTML, not the structured JSON envelope. | `server/middleware/auth.mjs` |
| 2 | Minor    | `placeholder` fallback for `SUPABASE_SERVICE_ROLE_KEY` masks misconfiguration in prod. | `server/middleware/auth.mjs` |
| 3 | Minor    | `CHANGELOG.md` has no entry for the 2026-05-06 backend hardening sprint. | `CHANGELOG.md` |

---

## Task 1: Auth middleware writes JSON response directly

Replace the `next(err)` call pattern with a direct `res.status().json()` response, mirroring the `validate.mjs` and `payloadSizeGuard` pattern. This removes the dependency on a downstream error handler and guarantees clients always receive the structured envelope, regardless of how `server.mjs` mounts middleware.

**Files:**
- Modify: `server/middleware/auth.mjs`
- Modify: `server/__tests__/auth.middleware.test.mjs` (drop the test-only error handler)

**Step 1: Update the failing test**

Replace `server/__tests__/auth.middleware.test.mjs` so the test app does NOT mount `errorHandler`. The middleware must produce the correct response on its own.

```js
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockGetUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

describe('requireUserAuth (direct JSON response)', () => {
  let app;

  beforeEach(async () => {
    mockGetUser.mockReset();
    const { requireUserAuth } = await import('../middleware/auth.mjs');
    const { requestIdMiddleware } = await import('../middleware/requestId.mjs');
    app = express();
    app.use(requestIdMiddleware);
    app.get('/test', requireUserAuth, (req, res) =>
      res.json({ userId: req.userId }));
    // No error handler mounted on purpose — middleware must handle responses itself
  });

  it('AUTH-001: returns 401 AUTH_REQUIRED with structured envelope when no header', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
    expect(res.body.error.recoverable).toBe(false);
    expect(res.body.error.request_id).toMatch(/^req_/);
  });

  it('AUTH-002: returns 401 AUTH_REQUIRED for non-Bearer scheme', async () => {
    const res = await request(app).get('/test').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('AUTH-003: returns 401 AUTH_INVALID with structured envelope when token invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } });
    const res = await request(app).get('/test').set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error.code).toBe('AUTH_INVALID');
    expect(res.body.error.recoverable).toBe(false);
  });

  it('AUTH-004: sets req.userId on valid token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } }, error: null });
    const res = await request(app).get('/test').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-abc');
  });

  it('AUTH-005: returns 401 AUTH_INVALID when getUser throws', async () => {
    mockGetUser.mockRejectedValue(new Error('network'));
    const res = await request(app).get('/test').set('Authorization', 'Bearer x');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });
});
```

**Step 2: Run the test to verify it fails**

```bash
npx vitest run server/__tests__/auth.middleware.test.mjs
```

Expected: FAIL — current implementation calls `next(err)`, no error handler is mounted, so Express returns a default HTML error response. Tests asserting `application/json` and `res.body.error.code` will fail.

**Step 3: Rewrite `server/middleware/auth.mjs` to respond directly**

```js
import { createClient } from '@supabase/supabase-js';
import { errorCodes } from '../errors/apiErrors.mjs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.NODE_ENV === 'production' && (!SUPABASE_URL || !SUPABASE_KEY)) {
  // Fail loudly in prod — silent fallback masks deployment misconfiguration.
  // In dev/test, missing env vars are tolerated so the harness can run with mocks.
  console.error('[server/auth] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in production. Auth will reject every request.');
}

const supabaseAdmin = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_KEY || 'placeholder',
);

function sendAuthError(req, res, code) {
  const def = errorCodes[code];
  res.status(def.status).json({
    error: {
      code,
      message: def.message,
      request_id: req.requestId ?? null,
      recoverable: def.recoverable,
      retry_after: null,
    },
  });
}

export async function requireUserAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return sendAuthError(req, res, 'AUTH_REQUIRED');
  }
  const token = header.slice(7);
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return sendAuthError(req, res, 'AUTH_INVALID');
    }
    req.userId = user.id;
    next();
  } catch {
    sendAuthError(req, res, 'AUTH_INVALID');
  }
}
```

Notes:
- Uses `errorCodes` directly (not `ApiError.fromCode`) because we never throw — we always respond.
- Production env check warns once at module load. In dev/test, mocked Supabase keeps tests clean.

**Step 4: Run the auth test to verify it passes**

```bash
npx vitest run server/__tests__/auth.middleware.test.mjs
```

Expected: PASS, 5 tests green.

**Step 5: Run the full server test suite to confirm no regressions**

```bash
npx vitest run server/__tests__/
```

Expected: PASS, all server tests green (currently 46; this task adds one new test → 47).

**Step 6: Run the full project suite (sanity)**

```bash
npm run test 2>&1 | tail -5
```

Expected: PASS for all 226 test files (the legacy benchmark hitting `127.0.0.1:3001` may still ECONNREFUSE — that's pre-existing and unrelated).

**Step 7: Commit**

```bash
git add server/middleware/auth.mjs server/__tests__/auth.middleware.test.mjs
git commit -m "$(cat <<'EOF'
fix(server): auth middleware writes structured JSON envelope directly

server.mjs has no global error handler, so next(ApiError) was falling
through to Express's default handler — clients got HTML instead of the
documented { error: { code, request_id, ... } } envelope. Match the
pattern used by validate.mjs and payloadSizeGuard: respond directly,
no error-handler dependency.

Also: fail loudly in production when SUPABASE_URL or
SUPABASE_SERVICE_ROLE_KEY are missing. Dev/test still tolerate the
placeholder fallbacks so the harness can run with mocks.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: CHANGELOG.md entry for the sprint

Document the seven commits between `259b0ab` and the auth fix as a single sprint entry, matching the existing CHANGELOG format (newest first, `## [Unreleased] - YYYY-MM-DD — <Sprint Name>`).

**Files:**
- Modify: `CHANGELOG.md` (insert new entry at the top, above the existing 2026-04-21 entry)

**Step 1: Read the top of `CHANGELOG.md` to find the insertion point**

```bash
head -20 CHANGELOG.md
```

Expected: the first heading after the file's preamble is `## [Unreleased] - 2026-04-21 — Sprint S-DASH-SIGNATUR-GAPS`. Insert the new entry directly above it.

**Step 2: Insert the new entry**

Use the `Edit` tool to add this block immediately before `## [Unreleased] - 2026-04-21 — Sprint S-DASH-SIGNATUR-GAPS`:

```markdown
## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phase 1)

### Features

- **AI endpoint hardening** (`server/routes/ai.routes.mjs`, mounted in `server.mjs:341`) — `POST /api/interpret` and `POST /api/analyze/conversation` are no longer public. Both routes now require Supabase JWT auth, are rate-limited per-user (10/10min free tier, 60/10min premium tier — both ENV-configurable via `AI_FREE_USER_LIMIT` / `AI_PREMIUM_USER_LIMIT` / `AI_WINDOW_MS`) and per-IP (`AI_IP_LIMIT`, default 30/10min), enforce a serialized-body size cap (50 KiB for `/interpret`, 25 KiB for `/analyze/conversation`, configurable via `AI_PAYLOAD_LIMIT_BYTES` / `AI_CONVERSATION_PAYLOAD_LIMIT_BYTES`), and validate the request body against Zod schemas that strip unknown keys, sanitise null bytes, and reject oversized objects. Existing handlers run unchanged via `next('route')` after the new middleware chain. (Dev brief §1, Tasks 1–9.)
- **Structured error envelope + ApiError classes** (`server/errors/apiErrors.mjs`, `server/middleware/errorHandler.mjs`) — every server-thrown `ApiError` and every middleware-direct response now uses the same shape: `{ error: { code, message, request_id, recoverable, retry_after, details? } }`. 13 typed codes (`AUTH_REQUIRED`, `AUTH_INVALID`, `FORBIDDEN`, `VALIDATION_FAILED`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `AI_QUOTA_EXCEEDED`, `AI_TIMEOUT`, `AI_PROVIDER_UNAVAILABLE`, `AI_PROVIDER_RATE_LIMITED`, `AI_OUTPUT_INVALID`, `AI_CONFIG_MISSING`, `INTERNAL_ERROR`). Stack traces never leak in response bodies.
- **Request ID propagation** (`server/middleware/requestId.mjs`, mounted globally in `server.mjs:340`) — every request gets a `req.requestId` (`req_<uuid>`). Echoed back as `X-Request-Id` header. Client-supplied `X-Request-Id` is honoured only if it matches the safe regex `^req_[a-zA-Z0-9_-]{1,64}$`; malicious values (HTML, oversized strings) are silently replaced.
- **AI endpoint inventory** (`docs/security/ai-endpoint-inventory.md`) — snapshot of all 11 routes that call Gemini/OpenRouter, current protection layer, and follow-ups (quota wiring, output validation, rate-limit gaps on `/api/synastry` and `/api/horoscope/daily`).

### Refactoring

- **Auth middleware extracted** (`server/middleware/auth.mjs`) — `requireUserAuth` is now a standalone module. Identical Supabase JWT verification logic as the in-line version it replaced; production deploys without `SUPABASE_SERVICE_ROLE_KEY` now log a fatal warning at boot.
- **Vitest config** (`vitest.config.ts`) — `include` patterns extended to cover `server/__tests__/**/*.{test,spec}.{mjs,ts}` and `packages/shared/src/**/__tests__/**/*.{test,spec}.{ts,tsx}`.

### Tests

- 47 new server-side tests covering ApiError classes (5), request ID middleware (4), auth middleware (5), error handler (5), AI rate limit (3), Zod validate (6), AI schemas (9), and AI routes (10). Full suite remains green at 2137 passing.

### Notes

- Implementation plan: `docs/plans/2026-05-06-backend-hardening.md` (Phase 1 of 5).
- AI quota service, transit-state cache, ElevenLabs auth refactor, structured logging, public-data cache, and CI secret-scan are scheduled for Phases 2–5 of the sprint.

```

**Step 3: Verify the CHANGELOG diff is what you expected**

```bash
git diff CHANGELOG.md | head -60
```

Expected: a single hunk that inserts the new section above the 2026-04-21 entry. No deletions.

**Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
docs(changelog): backend hardening sprint Phase 1 (Tasks 1-9)

Records the AI endpoint hardening, structured error envelope, request
ID propagation, auth middleware extraction, and security inventory work
shipped in commits 3229c7d..7b3717d (and the auth-response-format fix).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Final verification

**Files:** none — this is the sign-off step.

**Step 1: Run the full test suite once more**

```bash
npm run test 2>&1 | tail -5
```

Expected: 2138 tests passing (added one in Task 1).

**Step 2: Run typecheck**

```bash
npm run lint 2>&1 | tail -3
```

Expected: zero errors.

**Step 3: Manually verify the auth response shape end-to-end**

```bash
PORT=3001 node server.mjs &
SERVER_PID=$!
sleep 2

# Should now return 401 with JSON envelope, not HTML
curl -s -X POST http://localhost:3001/api/interpret \
  -H 'Content-Type: application/json' \
  -d '{"data":{},"lang":"de"}' \
  -w '\nHTTP %{http_code}\nContent-Type: %{content_type}\n'

kill $SERVER_PID
```

Expected output:
```
{"error":{"code":"AUTH_REQUIRED","message":"Authentication required.","request_id":"req_...","recoverable":false,"retry_after":null}}
HTTP 401
Content-Type: application/json; charset=utf-8
```

If this curl returns HTML or a 500, Task 1 was not applied correctly — go back and re-run its tests.

**Step 4: Sign off**

After Steps 1–3 pass, the batch is ready to push. No commit needed for this task — it is verification only.

---

## Done-when checklist

- [ ] Task 1: `auth.mjs` rewritten, 5 auth tests pass, full server test suite passes.
- [ ] Task 2: `CHANGELOG.md` has the 2026-05-06 entry above 2026-04-21.
- [ ] Task 3: `curl -X POST /api/interpret` without `Authorization` returns JSON 401 with `code: AUTH_REQUIRED`.
- [ ] Full project test suite remains green at 2138 passing.
- [ ] `npm run lint` is clean.
