# Tagespuls Migration Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the three follow-up items from the PR #342 post-merge code review — make both daily-interpretation migrations idempotent and orphan-safe, and route the persist-failure log through `redactLog`.

**Architecture:** Three independent defensive additions. Tasks 1 and 2 are SQL-only and modify migrations that have already been applied to production — we keep the on-disk migration files in sync with the production schema, so a fresh clone replaying them from scratch (CI, new env, disaster recovery) succeeds. Task 3 is a one-line server change with a vitest regression test.

**Tech Stack:** PostgreSQL (Supabase), Node.js (Express), Vitest.

**Branch:** `2026-05-13-tagespuls-migration-hardening` off `main`.

**Findings being addressed** (from the 2026-05-13 code review of PR #342):
- **I-1**: `supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql:49-50` — `ADD CONSTRAINT` not wrapped in `IF NOT EXISTS`; re-running the migration fails with `42710`.
- **I-2**: `supabase-migrations/20260510_daily_interpretation_one_per_user_date.sql:63-65` — `SET NOT NULL` runs after a backfill that depends on the FK to `daily_pulses`; any orphan row (FK bypassed historically, manual SQL) crashes the migration.
- **M-1**: `server.mjs:3495` — `console.error('[daily-interpretation] Persist failed:', insErr?.code || insErr?.message)` was deferred because Supabase JS errors typically carry only PG codes. The redact helper exists; route the log through it to remove the foot-gun.

**Out of scope:** the cosmetic test-fixture dead field (M-2 from the review). Not worth a commit.

**Pre-flight verification (run once before Task 1):**

```bash
git checkout main
git pull --ff-only
git checkout -b 2026-05-13-tagespuls-migration-hardening
npx vitest run server/__tests__/daily-interpretation.test.mjs 2>&1 | tail -5
```
Expected: existing daily-interpretation tests pass (baseline must be green before changing migrations or server code).

---

### Task 1: Idempotent constraint add in `_one_per_pulse.sql`

**Files:**
- Modify: `supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql:48-50`

**Context:** The sibling migration (`_one_per_user_date.sql:69-80`) already wraps `ADD CONSTRAINT` in a `DO $$ ... IF NOT EXISTS` block. This task brings `_one_per_pulse.sql` into the same shape so a re-run does not fail.

**Step 1: Read the current end of `_one_per_pulse.sql`**

Run: `tail -5 supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql`

Expected output (the failing-on-re-run shape):
```sql
-- Add the new constraint: at most one interpretation per daily_pulse_id.
ALTER TABLE daily_interpretations
  ADD CONSTRAINT daily_interpretations_one_per_pulse UNIQUE (daily_pulse_id);
```

**Step 2: Replace the bare ADD CONSTRAINT with the IF NOT EXISTS pattern**

Use the Edit tool. Replace this block:

```sql
-- Add the new constraint: at most one interpretation per daily_pulse_id.
ALTER TABLE daily_interpretations
  ADD CONSTRAINT daily_interpretations_one_per_pulse UNIQUE (daily_pulse_id);
```

With:

```sql
-- Add the new constraint: at most one interpretation per daily_pulse_id.
-- Wrapped in IF NOT EXISTS so a migration replay (CI, fresh clone, disaster
-- recovery) does not fail with 42710 (duplicate_object) after this migration
-- has already been applied in production.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'daily_interpretations'::regclass
      AND conname = 'daily_interpretations_one_per_pulse'
  ) THEN
    ALTER TABLE daily_interpretations
      ADD CONSTRAINT daily_interpretations_one_per_pulse UNIQUE (daily_pulse_id);
  END IF;
END $$;
```

**Step 3: Verify the migration file is syntactically valid**

Run: `head -1 supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql && wc -l supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql`

Expected: line count grew from 51 to ~62. First line is unchanged comment.

**Step 4: Sanity-grep for the new pattern**

Run: `grep -A1 "IF NOT EXISTS" supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql | head -10`

Expected: shows the `SELECT 1 FROM pg_constraint ...` block.

**Step 5: Commit**

```bash
git add supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql
git commit -m "$(cat <<'EOF'
fix(migration): make one_per_pulse constraint add idempotent (PR-342 review I-1)

Wrap the ADD CONSTRAINT in a DO $$ IF NOT EXISTS block so a migration
replay (CI, fresh clone, disaster recovery) doesn't fail with 42710
after this migration has already been applied in production. Matches
the sibling _one_per_user_date.sql pattern.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Orphan-safe backfill in `_one_per_user_date.sql`

**Files:**
- Modify: `supabase-migrations/20260510_daily_interpretation_one_per_user_date.sql:38-65`

**Context:** The migration adds nullable `user_id`/`pulse_date`, backfills them from a `daily_pulses` join, then `SET NOT NULL`. If any `daily_interpretations` row has a `daily_pulse_id` that no longer matches a `daily_pulses` row (FK violation that historically slipped through, or a manual SQL operation), the backfill UPDATE skips it, the row stays NULL, and `SET NOT NULL` aborts the migration. The FK has `ON DELETE CASCADE`, so this should be impossible — but a defensive cleanup is a 4-line addition that removes the foot-gun.

**Step 1: Read the section that needs the orphan delete**

Run: `sed -n '38,65p' supabase-migrations/20260510_daily_interpretation_one_per_user_date.sql`

Expected: shows the `UPDATE ... FROM daily_pulses dp WHERE dp.id = di.daily_pulse_id ...` followed by the dedupe CTE and the `ALTER COLUMN ... SET NOT NULL`.

**Step 2: Insert the defensive orphan delete before the backfill UPDATE**

Use the Edit tool. Replace:

```sql
UPDATE daily_interpretations di
SET user_id = dp.user_id,
    pulse_date = dp.date
FROM daily_pulses dp
WHERE dp.id = di.daily_pulse_id
  AND (di.user_id IS NULL OR di.pulse_date IS NULL);
```

With:

```sql
-- Defensive: remove any orphan interpretations whose daily_pulse_id no
-- longer matches a daily_pulses row. The FK has ON DELETE CASCADE so
-- this should never match — but if a manual SQL op or a historic
-- FK-bypass left a stray row, the backfill below would leave its
-- user_id/pulse_date NULL and the SET NOT NULL at the end of this
-- migration would abort. One DELETE removes the foot-gun.
DELETE FROM daily_interpretations di
WHERE NOT EXISTS (
  SELECT 1 FROM daily_pulses dp WHERE dp.id = di.daily_pulse_id
);

UPDATE daily_interpretations di
SET user_id = dp.user_id,
    pulse_date = dp.date
FROM daily_pulses dp
WHERE dp.id = di.daily_pulse_id
  AND (di.user_id IS NULL OR di.pulse_date IS NULL);
```

**Step 3: Verify the new DELETE is in place and the rest of the migration is unchanged**

Run: `grep -B1 -A4 "Defensive: remove any orphan" supabase-migrations/20260510_daily_interpretation_one_per_user_date.sql`

Expected: shows the comment + DELETE block.

Run: `grep -c "ALTER COLUMN user_id SET NOT NULL" supabase-migrations/20260510_daily_interpretation_one_per_user_date.sql`

Expected: `1` (still exactly one occurrence).

**Step 4: Static review — confirm ordering**

The migration must run in this order:
1. ADD COLUMN (already in place)
2. CREATE OR REPLACE FUNCTION + trigger (already in place)
3. **NEW**: DELETE orphans
4. UPDATE backfill (existing)
5. Dedupe CTE (existing)
6. SET NOT NULL (existing)
7. ADD CONSTRAINT (existing)

Run: `grep -n "ADD COLUMN\|CREATE OR REPLACE\|CREATE TRIGGER\|^DELETE FROM daily_interpretations di\|^UPDATE daily_interpretations\|SET NOT NULL\|ADD CONSTRAINT" supabase-migrations/20260510_daily_interpretation_one_per_user_date.sql`

Expected: line numbers appear in increasing order matching the seven steps above.

**Step 5: Commit**

```bash
git add supabase-migrations/20260510_daily_interpretation_one_per_user_date.sql
git commit -m "$(cat <<'EOF'
fix(migration): drop orphan interpretations before SET NOT NULL (PR-342 review I-2)

The backfill UPDATE relies on the FK to daily_pulses to find every row's
user_id/pulse_date. The FK has ON DELETE CASCADE so an orphan shouldn't
exist, but if one slipped through historically the SET NOT NULL at the
end of the migration would abort. Add a defensive DELETE of orphan rows
before the backfill so the migration is robust to that edge case.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Route persist-failure log through `redactLog`

**Files:**
- Modify: `server.mjs:3489-3496`
- Test: `server/__tests__/daily-interpretation.test.mjs` (append new test case)

**Context:** The existing code logs `insErr?.code || insErr?.message`. The inline comment (M-5) acknowledges `message` *could* leak row data in future Supabase changes. The helper `redactLog` already exists at `server/utils/redact.mjs` and the file already imports `hashId` from the same module — adding `redactLog` to the import is one line.

This task uses TDD: a failing test first, then the minimal change.

**Step 1: Inspect the redact helper signature**

Run: `grep -A20 "^export function redactLog" server/utils/redact.mjs | head -25`

Expected: signature is `redactLog(value, depth = 0)` and returns a redacted shallow copy of the value (strings truncated/key-name redacted, primitives passed through). Confirm before writing the test.

**Step 2: Write the failing test**

Append the following test to `server/__tests__/daily-interpretation.test.mjs` inside the existing `describe('POST /api/daily-interpretation — no-placeholders contract', ...)` block (after `DIN-RACE-002`):

```js
  it('DIN-LOG-001: persist failure does not log raw Supabase message verbatim', async () => {
    // PR #342 review M-1: console.error('[daily-interpretation] Persist failed:', ...)
    // previously logged insErr?.code || insErr?.message. If a future Supabase
    // change surfaces user content in `message`, that content leaks to logs.
    // Route the log through redactLog so an attacker-controlled string in
    // `message` does not appear verbatim in the captured console output.
    const sentinel = 'attacker_controlled_email_address_alice@example.com_token_xyz';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input
        : input instanceof URL ? input.toString()
          : input?.url ?? '';
      const method = (init?.method || 'GET').toUpperCase();

      if (url.includes('auth/v1/user')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ id: 'user-1', email: 't@test.com', aud: 'authenticated' }),
          text: async () => JSON.stringify({ id: 'user-1' }),
        };
      }
      if (url.includes('/daily_pulses')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [PULSE_ROW],
          text: async () => JSON.stringify([PULSE_ROW]),
        };
      }
      if (url.includes('/astro_profiles')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => PROFILE_FIXTURE,
          text: async () => JSON.stringify(PROFILE_FIXTURE),
        };
      }
      if (url.includes('/daily_interpretations')) {
        if (method === 'POST') {
          // Non-23505 error so the recovery branch is skipped and the
          // generic console.error path is reached.
          return {
            ok: false, status: 500,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ code: '08006', message: sentinel }),
            text: async () => JSON.stringify({ code: '08006', message: sentinel }),
          };
        }
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [],
          text: async () => '[]',
        };
      }
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}',
      };
    });

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = await loadApp(makeGeminiTextMock('Generated text that fails to persist.'));

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: PULSE_ROW.id,
        selected_archetype_key: 'sonne',
        locale: 'de',
      });

    expect(res.status).toBe(500);

    const persistErrCalls = errSpy.mock.calls.filter((call) =>
      typeof call[0] === 'string' && call[0].includes('[daily-interpretation] Persist failed:'),
    );
    expect(persistErrCalls.length).toBeGreaterThan(0);

    // The sentinel must NOT appear verbatim in any captured persist-failure
    // log line, regardless of which argument position it would end up in.
    const flattened = persistErrCalls.map((call) => JSON.stringify(call)).join('\n');
    expect(flattened).not.toContain(sentinel);

    errSpy.mockRestore();
  });
```

Then verify the test exists by running it (it must fail because the production code still logs `message` raw):

Run: `npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-LOG-001" 2>&1 | tail -20`

Expected: **1 test failed** — the `expect(flattened).not.toContain(sentinel)` assertion fails because the current code passes `insErr?.message` directly to `console.error`, so the sentinel appears verbatim in the captured call.

If the test instead passes on this RED step, **stop** and investigate — the test is not actually exercising the persist-failure log path (likely a mock-routing mistake). Do not proceed to Step 3.

**Step 3: Add `redactLog` to the existing import**

Use the Edit tool on `server.mjs:28`.

Replace:
```js
import { hashId } from "./server/utils/redact.mjs";
```

With:
```js
import { hashId, redactLog } from "./server/utils/redact.mjs";
```

**Step 4: Route the persist-failure log through `redactLog`**

Use the Edit tool on `server.mjs:3489-3496`.

Replace the existing block:
```js
      // M-5: prefer Postgres `code` over `message` to avoid logging
      // row data that the message field MIGHT contain. Supabase JS
      // errors don't typically carry user content in `message` (they
      // surface PG codes like 23505, 23503, etc.), but `code || message`
      // is belt-and-braces. If a future Supabase change exposes more in
      // `message`, swap to redactLog(insErr) from server/utils/redact.mjs.
      console.error('[daily-interpretation] Persist failed:', insErr?.code || insErr?.message);
```

With:
```js
      // M-5 (resolved 2026-05-13): route the full error through redactLog
      // so a future Supabase change that surfaces user content in `message`
      // does not leak it to logs. We still prefer `code` for the human-
      // readable line ID; `redactLog` carries the structured-but-safe rest.
      console.error(
        '[daily-interpretation] Persist failed:',
        insErr?.code || 'unknown_code',
        redactLog(insErr),
      );
```

**Step 5: Run the test to verify it passes**

Run: `npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-LOG-001" 2>&1 | tail -20`

Expected: **1 test passed**.

**Step 6: Run the full daily-interpretation suite to verify no regression**

Run: `npx vitest run server/__tests__/daily-interpretation.test.mjs 2>&1 | tail -10`

Expected: all existing tests still green (DIN-RACE-001, DIN-RACE-002, DIN-LOOPHOLE-001, DIN-LOG-001, etc.). Test count grew by exactly 1.

**Step 7: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -10`

Expected: no new errors (or unchanged pre-existing baseline).

**Step 8: Commit**

```bash
git add server.mjs server/__tests__/daily-interpretation.test.mjs
git commit -m "$(cat <<'EOF'
fix(server): route daily-interpretation persist log through redactLog (PR-342 review M-1)

The existing comment acknowledged that insErr.message could carry row
data in a future Supabase change; the redact helper exists. Apply it
now and lock the behavior with DIN-LOG-001 — a regression test that
plants a sentinel string in the Supabase error's message field and
asserts it does not appear in the captured console.error call.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Post-implementation verification

Once all three tasks are committed:

**Step 1: Full test suite**

Run: `npx vitest run 2>&1 | tail -5`

Expected: full suite green (2323/2323 or current baseline + 1 new test).

**Step 2: Typecheck (full monorepo)**

Run: `npm run typecheck:src 2>&1 | tail -5`

Expected: clean.

**Step 3: Schema/migration alignment check**

The two migration files now describe the same end-state as `supabase-schema.sql` — they always did, this PR doesn't change the *end state*, only the path to get there. Verify:

Run: `grep -c "daily_interpretations_one_per_pulse\|daily_interpretations_one_per_user_date" supabase-schema.sql`

Expected: `2` (both constraints still declared in the schema file).

**Step 4: Manual psql replay test (optional, only if a local Supabase is running)**

```bash
# Apply migration twice against a local Supabase instance:
supabase db reset --linked
supabase migration up
supabase migration up   # second run must succeed, not fail with 42710
```

If you don't have a local Supabase set up, the static SQL inspection in Task 1 Step 4 + Task 2 Step 4 is sufficient — the patterns used (`DO $$ IF NOT EXISTS`, `DELETE FROM ... WHERE NOT EXISTS`) are well-known idempotent SQL idioms.

**Step 5: Push and open PR**

```bash
git push -u origin 2026-05-13-tagespuls-migration-hardening
gh pr create --title "fix(tagespuls): migration idempotency + redact persist log (PR-342 follow-up)" --body "$(cat <<'EOF'
## Summary
Follow-up to PR #342 addressing the three open items from the 2026-05-13 code review.

- **I-1**: `_one_per_pulse.sql` ADD CONSTRAINT now wrapped in `DO $$ IF NOT EXISTS` block — matches sibling migration pattern, safe to replay.
- **I-2**: `_one_per_user_date.sql` deletes orphan interpretations before the SET NOT NULL backfill — defensive against historical FK bypass.
- **M-1**: `[daily-interpretation] Persist failed:` now routes the error through `redactLog`, locked by new DIN-LOG-001 regression test.

No schema end-state changes — only the path to get there. `supabase-schema.sql` is untouched.

## Test plan
- [ ] `npx vitest run server/__tests__/daily-interpretation.test.mjs` — green, +1 new test
- [ ] `npm run typecheck:src` — clean
- [ ] `npx vitest run` — full suite green

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Notes for the executing engineer

- **Why no automated test for the migration changes (Tasks 1 & 2)?** The repo has no Postgres-in-CI harness; setting one up for two SQL idempotency tests is overkill. The patterns used here (`DO $$ IF NOT EXISTS` for constraints, `DELETE FROM ... WHERE NOT EXISTS` for orphan cleanup) are the standard Postgres idempotent-DDL idioms — the static inspection step in each task is the verification.
- **Task 3 deliberately uses TDD** (write failing test → run → see RED → minimal fix → run → see GREEN). Don't skip the RED step. If the test passes on the first run before the production code is changed, the test isn't reaching the code path under test and the mock setup needs review.
- **All three tasks are independent** — they can be reordered. The plan presents them in dependency-free numeric order to match the review-finding labels (I-1, I-2, M-1).
- **Do not modify `supabase-schema.sql`** — it already describes the correct end state. Changing it here would create a phantom diff suggesting a schema change where there isn't one.
