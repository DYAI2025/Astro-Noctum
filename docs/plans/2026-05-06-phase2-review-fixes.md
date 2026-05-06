# Phase 2 Review-Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the two **Important** findings and the actionable **Minor** finding from the `/full-review` of commits `5c96bf5..0b801b8` so Phase 2 of the backend hardening sprint is ship-ready.

**Architecture:** A second SQL migration revokes the over-permissive `authenticated` GRANT on the three quota RPCs. A defense-in-depth check inside each RPC raises if the caller's `auth.uid()` ≠ `p_user_id`, even via service_role-but-impersonated paths. CHANGELOG gets a Phase 2 entry. `/api/contribution/space-weather` and any other per-user contribution endpoints bust the transit-state cache, mirroring `/api/contribute`.

**Tech Stack:** Postgres / Supabase RPC, Vitest, Express. No new packages.

---

## Findings recap

| # | Severity | Issue | Action |
|---|----------|-------|--------|
| 1 | Important | Quota RPCs callable by any `authenticated` Supabase client → cross-user DoS via PostgREST | Follow-up migration: REVOKE from `authenticated`; add `auth.uid()` check inside RPC bodies |
| 2 | Important | CHANGELOG.md missing Phase 2 entry | Insert Phase 2 sub-section under existing 2026-05-06 entry |
| 3 | Minor    | `/api/contribution/space-weather` (and any future per-user contribution route) doesn't bust transit-state cache | Add `transitStateCache.del(userId)` after successful insert |

The other Minor findings (single-instance cache, auth-shape inconsistency on non-AI routes) are documented as known follow-ups and intentionally out of scope for this batch.

---

## Task 1: Quota RPC hardening — defense in depth + GRANT revoke

The RPCs already deployed to prod (commit `5c96bf5`) granted EXECUTE to `authenticated`. Even though no production code path uses that grant, an authenticated client could call the RPCs directly via PostgREST and exhaust another user's quota. Two layers of fix:

1. **Inside each RPC body:** raise an exception if `auth.uid()` ≠ `p_user_id`. The exception path is bypassed for callers whose JWT claims `role = 'service_role'` (legitimate server use).
2. **At the GRANT level:** REVOKE EXECUTE from `authenticated`. Belt and braces — even if the function-body check is buggy, PostgREST routes can't reach the RPC at all.

Apply via a follow-up migration so the on-prod state matches the on-disk SQL.

**Files:**
- Create: `supabase-migrations/20260506_ai_quota_lockdown.sql`
- Modify: `supabase-migrations/20260506_ai_quota.sql` (update the original so a fresh DB rebuild is correct)
- Modify: `supabase-schema.sql` (mirror the lockdown comment)

**Step 1: Write the lockdown migration**

`supabase-migrations/20260506_ai_quota_lockdown.sql`:

```sql
-- 20260506_ai_quota_lockdown.sql — Quota RPC hardening (review fix).
--
-- The original 20260506_ai_quota.sql migration GRANTed EXECUTE on the
-- three quota RPCs to BOTH `authenticated` and `service_role`. The
-- `authenticated` grant is unused in production (the JS service uses the
-- service-role key) and exposes a cross-user DoS:
--
--   await supabase.rpc('reserve_ai_quota',
--     { p_user_id: '<victim>', p_route_group: 'interpret',
--       p_tier: 'free', p_period: 'daily', p_limit: 20 });
--
-- Repeated 20× exhausts the victim's daily AI quota. Two-layer fix:
-- (1) defense-in-depth check inside each function body, (2) REVOKE
-- the grant entirely so PostgREST routes can't reach the RPCs.

-- 1. Defense in depth: reject calls where auth.uid() != p_user_id, except
--    when the caller is service_role (server-side path). Wrapped functions
--    keep their original logic verbatim — only the caller-identity check
--    is added at the top.

CREATE OR REPLACE FUNCTION reserve_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_tier        TEXT,
  p_period      TEXT,
  p_limit       INTEGER
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end   TIMESTAMPTZ;
  v_row          ai_quota%ROWTYPE;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot reserve quota for another user'
      USING ERRCODE = '42501';
  END IF;

  SELECT period_start, period_end
    INTO v_period_start, v_period_end
    FROM _ai_quota_period_bounds(p_period);

  INSERT INTO ai_quota (user_id, route_group, period_start, period_end, "limit", tier)
    VALUES (p_user_id, p_route_group, v_period_start, v_period_end, p_limit, p_tier)
    ON CONFLICT ON CONSTRAINT ai_quota_unique_period DO NOTHING;

  UPDATE ai_quota
    SET reserved = reserved + 1, updated_at = now()
    WHERE user_id = p_user_id
      AND route_group = p_route_group
      AND period_start = v_period_start
      AND (used + reserved) < "limit"
    RETURNING * INTO v_row;

  IF NOT FOUND THEN
    SELECT * INTO v_row FROM ai_quota
      WHERE user_id = p_user_id
        AND route_group = p_route_group
        AND period_start = v_period_start;
    RETURN jsonb_build_object(
      'allowed', false,
      'quota_remaining', GREATEST(0, v_row."limit" - v_row.used - v_row.reserved),
      'quota_reset_at', v_row.period_end
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'quota_remaining', GREATEST(0, v_row."limit" - v_row.used - v_row.reserved),
    'quota_reset_at', v_row.period_end
  );
END;
$$;

CREATE OR REPLACE FUNCTION commit_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_period      TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot commit quota for another user'
      USING ERRCODE = '42501';
  END IF;

  SELECT period_start INTO v_period_start FROM _ai_quota_period_bounds(p_period);
  UPDATE ai_quota
    SET used = used + 1,
        reserved = GREATEST(0, reserved - 1),
        updated_at = now()
    WHERE user_id = p_user_id
      AND route_group = p_route_group
      AND period_start = v_period_start
      AND reserved > 0;
END;
$$;

CREATE OR REPLACE FUNCTION refund_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_period      TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot refund quota for another user'
      USING ERRCODE = '42501';
  END IF;

  SELECT period_start INTO v_period_start FROM _ai_quota_period_bounds(p_period);
  UPDATE ai_quota
    SET reserved = GREATEST(0, reserved - 1),
        updated_at = now()
    WHERE user_id = p_user_id
      AND route_group = p_route_group
      AND period_start = v_period_start
      AND reserved > 0;
END;
$$;

-- 2. REVOKE EXECUTE from authenticated. service_role retains access (it
--    holds the JWT claim that the body check exempts).
REVOKE EXECUTE ON FUNCTION reserve_ai_quota(UUID, TEXT, TEXT, TEXT, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION commit_ai_quota(UUID, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION refund_ai_quota(UUID, TEXT, TEXT) FROM authenticated;

-- service_role grant is a no-op (already granted by the original migration)
-- but stated explicitly so a fresh deploy of just this file works.
GRANT EXECUTE ON FUNCTION reserve_ai_quota(UUID, TEXT, TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION commit_ai_quota(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refund_ai_quota(UUID, TEXT, TEXT) TO service_role;
```

**Step 2: Update the original migration so a clean rebuild is correct**

In `supabase-migrations/20260506_ai_quota.sql`, replace the final GRANT block:

```sql
-- BEFORE
GRANT EXECUTE ON FUNCTION reserve_ai_quota(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION commit_ai_quota(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION refund_ai_quota(UUID, TEXT, TEXT) TO authenticated, service_role;

-- AFTER (service_role only — `authenticated` deliberately excluded so PostgREST
-- can't reach these RPCs. The JS service uses SUPABASE_SERVICE_ROLE_KEY.)
GRANT EXECUTE ON FUNCTION reserve_ai_quota(UUID, TEXT, TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION commit_ai_quota(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refund_ai_quota(UUID, TEXT, TEXT) TO service_role;
```

Also add the body-check at the top of each function definition in the same file (so a fresh deploy starts with both layers in place).

**Step 3: Update `supabase-schema.sql` comment block**

Replace the existing comment line `-- (Definitions live only in the migration file …)` with the same line plus a note about service-role-only access:

```sql
-- RPCs: reserve_ai_quota, commit_ai_quota, refund_ai_quota
-- (Definitions live only in the migration file. EXECUTE granted to
-- service_role only — never authenticated. PostgREST cannot reach these.)
```

**Step 4: Apply the lockdown migration to prod (manual)**

The user has already deployed the original migration to Supabase. They run the lockdown migration via Supabase Dashboard → SQL Editor by pasting the contents of `supabase-migrations/20260506_ai_quota_lockdown.sql`.

Validation queries after apply:

```sql
-- Should return only `service_role`, not `authenticated`.
SELECT grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name IN ('reserve_ai_quota', 'commit_ai_quota', 'refund_ai_quota')
ORDER BY routine_name, grantee;

-- Functional smoke test: simulate non-service_role caller
SET LOCAL ROLE authenticated;
SELECT reserve_ai_quota('00000000-0000-0000-0000-000000000000'::uuid, '_smoke', 'free', 'daily', 1);
-- Expected: ERROR — permission denied (REVOKE) OR ERROR — forbidden (body check)
RESET ROLE;
```

**Step 5: Server-side smoke test that legit path still works**

The JS service uses `SUPABASE_SERVICE_ROLE_KEY`, which carries the `service_role` JWT claim. Run the existing aiQuota service tests:

```bash
npx vitest run server/__tests__/aiQuota.service.test.mjs
```

Expected: 12/12 pass (the JS service mocks the RPC, so the server-side path is unchanged by the SQL changes).

**Step 6: Commit**

```bash
git add supabase-migrations/20260506_ai_quota_lockdown.sql \
        supabase-migrations/20260506_ai_quota.sql \
        supabase-schema.sql
git commit -m "$(cat <<'EOF'
fix(db): lock down quota RPCs — service_role only, body-level auth check

Original 20260506_ai_quota.sql granted EXECUTE on the three quota RPCs
to `authenticated`. PostgREST exposes anything authenticated can EXECUTE,
which let any signed-in user call reserve_ai_quota('<victim_uuid>', ...)
20 times and exhaust someone else's daily AI quota.

Two-layer fix:

1. Body check: each RPC raises 42501 if the caller's auth.uid() differs
   from p_user_id, unless the caller has role = service_role.
2. REVOKE EXECUTE from authenticated; only service_role retains access.

The JS service in server/services/aiQuota.service.mjs uses
SUPABASE_SERVICE_ROLE_KEY (service_role JWT) — no production path is
affected.

Apply 20260506_ai_quota_lockdown.sql via Supabase SQL Editor on top
of the already-deployed 20260506_ai_quota.sql; the original file is
edited so a clean rebuild is also correct.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Cache invalidation on `/api/contribution/space-weather`

The transit-state cache is busted by `/api/contribute` but not by `/api/contribution/space-weather`. The space-weather contribution path also writes to `contribution_events` and feeds the transit-state proxy on the next poll — without busting, the user sees stale ring for up to 10 s after a major space-weather contribution event.

**Files:**
- Modify: `server.mjs` (the `/api/contribution/space-weather` POST handler around line 4280)

**Step 1: Locate the handler**

```bash
grep -n '^app\.post("/api/contribution/space-weather"' server.mjs
```

Expected: one line, around 4286.

**Step 2: Read the existing handler to find the success exit**

The handler upserts to `contribution_events` and returns `201 { ok: true }` on success (or earlier 4xx on validation/auth errors). The cache bust must run only on success — same pattern as `/api/contribute`.

**Step 3: Add `transitStateCache.del(userId)` before the success return**

Find the line immediately above the success `return res.status(201).json({ ok: true });` (or equivalent) and insert:

```js
  // Bust the user's transit-state cache so the next poll sees the new
  // space-weather contribution. Mirrors /api/contribute.
  transitStateCache.del(user.id);
```

The cache import already exists in `server.mjs:13` (added in Task 13 of the main plan). No new import needed.

**Step 4: Verify with a syntax check**

```bash
node --check server.mjs && echo "syntax OK"
```

Expected: `syntax OK`.

**Step 5: Run the full server test suite to confirm no regression**

```bash
npx vitest run server/__tests__/
```

Expected: 73/73 pass (no test directly touches `/api/contribution/space-weather`; the cache service tests cover `.del()` semantics).

**Step 6: Commit**

```bash
git add server.mjs
git commit -m "$(cat <<'EOF'
fix(server): bust transit-state cache on /api/contribution/space-weather

Mirrors /api/contribute. Without this, a space-weather contribution
leaves the transit-state cache hot for up to TRANSIT_STATE_CACHE_TTL_MS
(10s default), so the dashboard ring shows stale data after a major
event upsert.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: CHANGELOG Phase 2 entry

Extend the existing `2026-05-06` block with a Phase 2 sub-section listing the AI quota infrastructure, transit-state cache + ownership middleware, client polling reduction, and the two review-fix follow-ups (this plan's Tasks 1 and 2).

**Files:**
- Modify: `CHANGELOG.md` (insert sub-section into the existing `## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phase 1)` block; rename header to drop the `(Phase 1)` qualifier so the entry covers both phases)

**Step 1: Read the current top of `CHANGELOG.md`**

```bash
head -30 CHANGELOG.md
```

Expected: starts with `## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phase 1)`. The sub-headings are `### Features`, `### Refactoring`, `### Tests`, `### Notes`.

**Step 2: Update the header and append Phase 2 features**

Use the `Edit` tool to:

a. Rename the header from `Backend Hardening Sprint (Phase 1)` to `Backend Hardening Sprint (Phases 1 + 2)`.

b. Insert these bullets at the END of the existing `### Features` block (after the AI endpoint inventory bullet):

```markdown
- **AI quota infrastructure** (`supabase-migrations/20260506_ai_quota.sql` + `server/services/aiQuota.service.mjs`) — Postgres-side `ai_quota` table with race-safe `reserve_ai_quota` / `commit_ai_quota` / `refund_ai_quota` RPCs (atomic `UPDATE … WHERE (used + reserved) < limit RETURNING` pattern). JS service wraps the RPCs with daily/monthly tier limits read from env vars (`AI_DAILY_FREE_LIMIT` / `AI_DAILY_PREMIUM_LIMIT` / `AI_MONTHLY_FREE_LIMIT` / `AI_MONTHLY_PREMIUM_LIMIT`). Service is library-only — no route calls it yet. Follow-up migration `20260506_ai_quota_lockdown.sql` revokes the `authenticated` grant and adds an in-body `auth.uid() = p_user_id` check; only `service_role` can reach the RPCs.
- **Transit-state server-side cache + ownership middleware** (`server/middleware/ownership.mjs` + `server/services/cache.service.mjs` + `server.mjs`) — `requireOwnership('userId')` middleware compares `req.params.userId` against `req.userId` and returns 403 FORBIDDEN with the structured envelope when they differ. The `MemoryCache` class backs both `transitStateCache` (10 s default TTL via `TRANSIT_STATE_CACHE_TTL_MS`) and `publicDataCache` (5 min default via `PUBLIC_DATA_CACHE_TTL_MS`). `/api/transit-state/:userId` reads/writes the cache in both live and fallback paths and emits `X-Cache: HIT|MISS`. `/api/contribute` and `/api/contribution/space-weather` call `transitStateCache.del(userId)` so quiz and contribution events bust the cache immediately instead of waiting for TTL expiry.
- **Visibility-aware client polling** (`src/hooks/useSignaturSignal.ts`) — transit-state polling slows from 800 ms (~75 req/min/user) to 8 s active / 45 s hidden (~7.5 req/min visible, ~1.3 req/min backgrounded). `visibilitychange` listener fires an immediate refresh when the tab returns to focus. Existing exponential backoff and online/offline handling preserved unchanged.
```

c. Update the `### Tests` section to reflect the Phase 2 additions:

```markdown
### Tests

- 80 server-side tests (was 47): ApiError classes (5), request ID middleware (4), auth middleware (5), error handler (5), AI rate limit (3), Zod validate (6), AI schemas (9), AI routes (10), ownership middleware (4), AI quota service (12), cache service (10), and Stripe webhook regression placeholder. 5 new client tests for `useSignaturSignal` cover the polling cadence (POLL-001..005). Full suite: 2169/2169.
```

d. Update the `### Notes` section to reflect what shipped vs. what is still pending:

```markdown
### Notes

- Implementation plan: `docs/plans/2026-05-06-backend-hardening.md` (Phases 1 + 2 of 5).
- Review-fix plans: `docs/plans/2026-05-06-backend-hardening-review-fixes.md` (Phase 1) + `docs/plans/2026-05-06-phase2-review-fixes.md` (Phase 2).
- AI quota service is **wired** into the codebase but **not yet attached** to any route. The next sprint chunk wires it onto `/api/interpret` and `/api/analyze/conversation`, then expands to `/api/experience/*` and `/api/agent/*`.
- ElevenLabs auth refactor, structured logger + redact, public-data stale-if-error cache, Stripe-webhook regression test, and the CI secret-scan are scheduled for Phase 3 (Tasks 15–19 in the main plan).
```

**Step 3: Verify the diff is exactly what you expected**

```bash
git diff CHANGELOG.md | head -80
```

Expected: header rename, three new feature bullets, `### Tests` re-counted, `### Notes` updated. No deletions of Phase 1 content.

**Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
docs(changelog): backend hardening sprint Phase 2 (Tasks 10-14)

Records AI quota table + RPCs + service, transit-state cache +
ownership middleware, and visibility-aware client polling work shipped
in commits 5c96bf5..0b801b8, plus the lockdown follow-up.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Final verification

**Files:** none — sign-off only.

**Step 1: Full test suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 2169/2169 pass. Same as before — these fixes are SQL + comment + CHANGELOG; no JS test count changes.

**Step 2: Typecheck**

```bash
npm run lint 2>&1 | tail -3
```

Expected: zero errors.

**Step 3: Server boot smoke**

```bash
SUPABASE_URL=http://localhost VITE_SUPABASE_URL=http://localhost \
SUPABASE_SERVICE_ROLE_KEY=placeholder VITE_SUPABASE_ANON_KEY=placeholder \
PORT=3001 node server.mjs &
SERVER_PID=$!
sleep 4
curl -s http://localhost:3001/api/transit-state/abc -w '\nHTTP %{http_code}\n' | head -3
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
```

Expected: server boots without errors, transit-state route still gates with 401 from the inline `requireUserAuth`. (The structured envelope on that gate is the separate non-AI auth-shape harmonization follow-up — NOT in scope.)

**Step 4: Sign off**

After steps 1–3 pass, the batch is ready for `/ship`. No commit needed for this task.

---

## Done-when checklist

- [ ] Task 1: `supabase-migrations/20260506_ai_quota_lockdown.sql` written; original migration + schema.sql updated; user has applied the lockdown migration to prod and verified `information_schema.role_routine_grants` shows only `service_role`.
- [ ] Task 2: `/api/contribution/space-weather` calls `transitStateCache.del(user.id)` on success; full server test suite green.
- [ ] Task 3: `CHANGELOG.md` has the merged Phases 1 + 2 entry; no Phase 1 content deleted.
- [ ] Task 4: Full test suite green at 2169 + typecheck clean + server boots cleanly.
