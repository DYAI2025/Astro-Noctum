# Tagespuls Pre-Merge Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Close the 4 pre-merge items from the 2026-05-09 code review of branch `2026-05-09-tagespuls-no-placeholders` so the Tagespuls no-placeholders work can ship: commit the 50+ untracked files in 3 logical chunks, add the missing route-handler tests (IDOR + 5 error-code branches), apply rate-limiting to `/api/daily-interpretation`, and annotate the divergent reference `schema.sql`.

**Architecture:** 6 commits across 4 phases. Phase A = repository hygiene (3 chunks of WIP commits). Phase B = test coverage gap close. Phase C = security/cost hardening. Phase D = doc-correctness 1-line annotation. No new features. Existing 2280+ test suite stays green throughout.

**Tech Stack:** Vitest + supertest pattern (matching existing `src/__tests__/*` conventions), express-rate-limit (already in dependencies — used by `apiLimiter`), Markdown for the schema annotation.

**Source context:**
- Code-review findings: posted in this session above (HIGH-1 + MEDIUM-1..4 + LOW-1..3 + INFO-1..2). Plan addresses HIGH-1 (Phase B), MEDIUM-4 (Phase C), INFO-1 (Phase D), INFO-2 (Phase A).
- Branch: `2026-05-09-tagespuls-no-placeholders` (currently ~3 commits ahead of main + 50 untracked files + 1 modified `server.mjs`).
- Touched files for new work: `server/services/tagespuls.service.mjs` (already committed in helpers), `server.mjs` (untracked WIP routes), `apps/tagespuls_package/**` (entire package tree untracked).

---

## Pre-Flight: State Verification

**Step 0.1: Confirm git state and untracked surface**

```bash
git branch --show-current     # expect: 2026-05-09-tagespuls-no-placeholders
git status --short            # expect: 1 M file (server.mjs) + many untracked under apps/tagespuls_package/ and tagespuls_package/
git log --oneline main..HEAD  # expect: 3-4 commits already (Phase B+C migrations + seed)
```

**Step 0.2: Verify duplicate `tagespuls_package/` at root**

```bash
diff -r tagespuls_package/ apps/tagespuls_package/ 2>&1 | head -20
ls tagespuls_package/ 2>&1 | head -10
```

If contents are identical or the root copy is empty/symlink, **report and remove the root copy** (`rm -rf tagespuls_package/`) before any commit so it doesn't get accidentally staged. If contents differ meaningfully, halt and surface to user — that's an unresolved scope question.

**Step 0.3: Baseline test suite**

```bash
npm test 2>&1 | tail -5
```

**Expected:** 2280/2280 (or higher — branch may already have added tests). Capture the exact count for later comparison.

**Step 0.4: Confirm migration vs reference schema divergence is documented**

```bash
grep -n "DIVERGE\|nullable\|NULLABLE\|design reference" supabase-migrations/20260509_tagespuls_tables.sql apps/tagespuls_package/packages/db/schema.sql 2>/dev/null | head
```

Confirm migration has the divergence comments (it does per code review). Reference schema does NOT yet — that's Phase D.

---

## Phase A: WIP Commit Cleanup (3 chunks)

The 50+ untracked files are logically partitioned by concern. Splitting into 3 commits keeps the history readable and lets a reviewer focus on one concern at a time.

### Task A1: Commit server-side runtime — routes + service helpers

**Files (already on disk, just stage):**
- Modify: `server.mjs` (439-line addition with 2 routes + helpers)
- Anything new under `server/services/` (verify with `git status server/`)

**Step A1.1: Stage exactly the runtime files**

```bash
git status server/ server.mjs
git add server.mjs
# IF server/services/tagespuls.service.mjs is also new (untracked), add it:
git add server/services/tagespuls.service.mjs 2>/dev/null || true
git status --short
```

**Expected:** Only `server.mjs` (M) and possibly `server/services/tagespuls.service.mjs` (A) staged. NOTHING else.

**Step A1.2: Run targeted tests**

```bash
npx vitest run src/__tests__/daily-pulse-aphorism-select.test.ts src/__tests__/daily-pulse-aphorism-to-wire.test.ts 2>&1 | tail -5
```

**Expected:** Pass (these are the existing helper-tests).

**Step A1.3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(tagespuls): GET /api/daily-pulse + POST /api/daily-interpretation routes

Adds the runtime for the no-placeholders Tagespuls flow:
- GET /api/daily-pulse: load-or-create per-user-per-day pulse with
  aphorism (slot_1) + AI-generated slot_2/slot_3 (nullable on LLM
  failure — never substituted with generic copy).
- POST /api/daily-interpretation: archetype-specific Tagesdeutung,
  idempotent on (pulse, archetype, locale).

Architecture invariants (enforced inline + tested at helper layer):
- Missing astro_profiles.astro_json → 422 PROFILE_REQUIRED.
- Total LLM exhaustion → 503 AI_UNAVAILABLE with retry_after.
- Empty approved aphorism corpus for mode → 503 APHORISM_POOL_EMPTY.
- Cache rows with null slots are NOT written to L1.
- Aphorism cooldown ledger only updated when slots are complete.

Closes audit Cluster D + S-3 fail-loud requirements (no silent fallbacks,
no generic text, every error path has a discriminating code).

Helper functions live in server/services/tagespuls.service.mjs — pure,
covered by daily-pulse-aphorism-{select,to-wire}.test.ts.
EOF
)"
```

Do NOT push yet — Phase B+C tasks add follow-up commits to the same branch.

### Task A2: Commit reference schema + voice/build scripts

**Files (untracked — new package directories):**
- `apps/tagespuls_package/packages/db/schema.sql`
- `apps/tagespuls_package/packages/api/openapi.yaml`
- `apps/tagespuls_package/packages/voice/scripts/build_aphorisms.py`
- `apps/tagespuls_package/packages/voice/scripts/select_daily_aphorism.py`
- `apps/tagespuls_package/packages/voice/scripts/validate_aphorisms.py`
- `apps/tagespuls_package/packages/voice/data/aphorisms.json`
- `apps/tagespuls_package/packages/voice/data/aphorisms.sample.json` (if present)

**Step A2.1: Stage exactly the packages tree**

```bash
git add apps/tagespuls_package/packages/
git status --short
```

**Expected:** Only files under `apps/tagespuls_package/packages/` staged. NOT `apps/tagespuls_package/docs/`, `knowledge/`, or `.claude/` (those go in A3).

**Step A2.2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(tagespuls): db schema reference + voice/build scripts

Reference schema and OpenAPI for the tagespuls subsystem (5 tables,
3 endpoints), plus the Python build/validate/select pipeline that
produced the seeded 21-row aphorism corpus from
knowledge/bazodiaac-brain/aphorisms/.

NOTE: Production DDL lives in supabase-migrations/20260509_tagespuls_tables.sql
which intentionally diverges from this reference (slot_2/3 nullable;
user_astro_profiles omitted; auth.users FK pattern). The reference
schema retains the canonical academic shape; the migration is the
adapted-to-prod version. Phase D of pre-merge will add a header banner
to schema.sql to make this explicit.
EOF
)"
```

### Task A3: Commit knowledge base + skills + docs

**Files:**
- `apps/tagespuls_package/README.md`
- `apps/tagespuls_package/docs/` (entire dir: PROMPT_MODULE..., decisions-risks.md, gbrain-obsidian-live-ops.md, day-pulse-trace-pipeline.md, validation-report.md, etc.)
- `apps/tagespuls_package/.claude/skills/` (aphorism-curator + day-pulse-trace SKILL.md + README.md)
- `apps/tagespuls_package/knowledge/` (bazodiaac-brain/{aphorisms, _meta, _templates, intake})

**Step A3.1: Stage**

```bash
git add apps/tagespuls_package/README.md \
        apps/tagespuls_package/docs/ \
        apps/tagespuls_package/.claude/ \
        apps/tagespuls_package/knowledge/
git status --short
```

**Expected:** All remaining untracked files under `apps/tagespuls_package/` are now staged. The `.DS_Store` files should be excluded by `.gitignore` (verify; if they slip through, add `**/.DS_Store` to repo `.gitignore`).

**Step A3.2: If `.DS_Store` files appear in staging, fix `.gitignore` first**

```bash
git status --short | grep DS_Store
```

If hits: add to `.gitignore`:
```
**/.DS_Store
```
Then `git rm --cached <each .DS_Store>` and add `.gitignore` to the commit.

**Step A3.3: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs(tagespuls): knowledge base + skills + design docs package

Includes:
- knowledge/bazodiaac-brain/aphorisms/ — curated source markdown
  (21 files seed, see Phase A commit bb60ffb).
- knowledge/bazodiaac-brain/{_meta,_templates,intake}/ — tone vocab,
  aphorism template, intake register + RIGHTS_NOTES.
- .claude/skills/{aphorism-curator,day-pulse-trace}/ — Claude Code
  skills for adding new aphorisms (curator) and writing slot_2/3
  prompts (day-pulse-trace).
- docs/ — design docs: API+DB architecture, decisions+risks,
  PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md (the canonical voice spec),
  validation-report, gbrain-obsidian-live-ops.

This split keeps the runtime (Task A1) and the curator workflow
(this Task A3) reviewable as separate concerns.
EOF
)"
```

---

## Phase B: Route-Handler Tests (HIGH-1)

Add Vitest integration tests for the 2 routes. Pattern: hoist the supabase + gemini clients via Vitest mocks; exercise each error branch + the happy path. Target file: ONE test file with 7+ describe blocks. Co-located with existing `src/__tests__/*.test.ts`.

### Task B1: Write the integration test file

**Files:**
- Create: `src/__tests__/api-daily-pulse.test.ts`

**Step B1.1: Read the existing helper test for pattern reference**

```bash
cat src/__tests__/daily-pulse-aphorism-select.test.ts | head -80
```

Note the mocking pattern (Supabase client mock, helper imports) and reuse it.

**Step B1.2: Write the test file**

Use Write tool to create `src/__tests__/api-daily-pulse.test.ts`. The file must exercise the following branches at minimum (each as a separate `it()` block):

- **`it('returns 400 INVALID_LOCALE for unknown locale param')`** — call `GET /api/daily-pulse?date=2026-05-09&locale=zh` with mocked auth `req.userId = 'u1'`. Expect 400 + body `{ error: { code: 'INVALID_LOCALE' } }`.
- **`it('returns 400 INVALID_DATE for malformed date param')`** — call with `date=09-05-2026`. Expect 400 + `INVALID_DATE`.
- **`it('returns 422 PROFILE_REQUIRED when astro_profiles row missing')`** — mock supabase to return `{ data: null }` for `astro_profiles` query. Expect 422 + `PROFILE_REQUIRED`.
- **`it('returns 422 PROFILE_REQUIRED when astro_json is empty object')`** — mock returns `{ astro_json: {} }`. Expect 422.
- **`it('returns 422 PROFILE_REQUIRED when harmony_index cannot be derived')`** — mock returns `{ astro_json: { fusion: {} } }` (no harmony). Expect 422.
- **`it('returns 503 APHORISM_POOL_EMPTY when no aphorism matches mode')`** — full fixtures, but supabase aphorisms query returns `[]`. Expect 503 + `APHORISM_POOL_EMPTY`.
- **`it('serves L1 cache hit without DB call')`** — first call populates cache, second call returns same payload, supabase mock asserts call count is `1` (not `2`). (Test framework: vi.spyOn the supabase mock and assert calls.)
- **`it('happy path: returns aphorism + slots + council')`** — full fixtures, aphorism row, gemini-slot-mock returns `{slot_2:'...', slot_3:'...'}`. Expect 200 + payload with `aphorism.slot_1/2/3`, `mode`, `intensity`, `council` array of 6.
- **`it('IDOR: POST /api/daily-interpretation with mismatched user_id returns 404')`** — mock `daily_pulses` query with `user_id` filter returning `null` (because the pulse belongs to another user). Expect 404 + `PULSE_NOT_FOUND`.
- **`it('idempotent: POST /daily-interpretation twice returns same row')`** — first call inserts, second call hits L2 (existing), returns same `{id, text}`.

For mocking guidance, the file should follow this skeleton (adjust per project conventions):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the gemini client + supabase before importing the express app.
vi.mock('../../server/services/tagespuls.service.mjs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/services/tagespuls.service.mjs')>();
  return {
    ...actual,
    // Helpers stay real; we only mock external IO clients via the supabase + gemini globals in server.mjs.
  };
});

// Supabase client mock — installed via the existing pattern in
// src/__tests__/daily-pulse-aphorism-select.test.ts.

// Gemini client mock — see existing test pattern; provide a stub that
// returns valid JSON for slot generation.

describe('GET /api/daily-pulse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset L1 cache between tests — the route uses module-level Map().
    // Either expose a reset hook in server.mjs or use vi.resetModules() to reload.
  });

  it('returns 400 INVALID_LOCALE for unknown locale param', async () => {
    // ...
  });

  // ... rest of the cases above
});

describe('POST /api/daily-interpretation', () => {
  // ... IDOR + idempotency + AI_UNAVAILABLE branches
});
```

**Note on cache reset:** the in-memory `dailyPulseCache` Map is module-scoped in `server.mjs`. Two clean options:
1. Expose `__resetTagespulsCache()` test-only helper in `server.mjs` and call from `beforeEach`.
2. Use `vi.resetModules()` between tests so the module re-evaluates (heavier but simpler).

**Choose option 1** — add the export at the bottom of `server.mjs`:
```javascript
// Test-only helpers — never imported in prod code paths.
export const __resetTagespulsCache = process.env.NODE_ENV === 'test'
  ? () => dailyPulseCache.clear()
  : () => { throw new Error('test-only helper'); };
```

This is one extra surface but keeps tests fast and readable.

**Step B1.3: Run the new test file (RED initially since helpers may need extending)**

```bash
npx vitest run src/__tests__/api-daily-pulse.test.ts 2>&1 | tail -15
```

**Expected:** Initially RED — likely 1-3 mocking issues. Fix as needed (cache reset path, mock factory shape) until all 10 cases GREEN.

**Step B1.4: Run the FULL test suite to ensure no regression**

```bash
npm test 2>&1 | tail -5
```

**Expected:** Test count = baseline + 10 (matching the 10 `it()` blocks). All pass.

**Step B1.5: Commit**

Stage the test file + the `__resetTagespulsCache` export if added.

```bash
git add src/__tests__/api-daily-pulse.test.ts server.mjs
git status --short  # confirm only those 2 files
git commit -m "$(cat <<'EOF'
test(tagespuls): integration tests for daily-pulse + daily-interpretation routes

Closes the route-handler test gap flagged in the 2026-05-09 code
review (HIGH-1). 10 cases covering:
- INVALID_LOCALE / INVALID_DATE / INVALID_BODY validation
- PROFILE_REQUIRED (missing astro_profiles, empty astro_json,
  unresolvable harmony_index)
- APHORISM_POOL_EMPTY when corpus is empty for mode
- L1 cache hit path (asserts no second supabase call)
- Happy path returning aphorism + slots + 6-figure council
- IDOR boundary on POST /daily-interpretation (404 PULSE_NOT_FOUND
  when daily_pulse_id belongs to another user)
- Idempotency: repeat POST returns existing row

Adds a test-only __resetTagespulsCache export to server.mjs to clear
the module-scoped L1 Map between cases. Production callers cannot
reach it (throws unless NODE_ENV === 'test').

Test count: <BASELINE>+10 → all green.
EOF
)"
```

(Replace `<BASELINE>` with the actual count from Step 0.3.)

---

## Phase C: Rate-Limit on `/api/daily-interpretation` (MEDIUM-4)

The route hits Gemini per call → cost-DoS risk. Add per-user rate-limit using the existing express-rate-limit infra.

### Task C: Add rate-limit middleware

**Files:**
- Modify: `server.mjs` (add limiter near existing `apiLimiter` + apply to `/api/daily-interpretation`)

**Step C.1: Find existing limiter pattern**

```bash
grep -n "apiLimiter\|rateLimit\|express-rate-limit" server.mjs | head
```

Note the import + how `apiLimiter` is constructed — reuse the pattern.

**Step C.2: Define `dailyInterpretationLimiter`**

Above the route definition, add:

```javascript
import rateLimit from 'express-rate-limit';  // already imported elsewhere — verify

const dailyInterpretationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 6,                     // 6 calls/hour/user — natural cap (1× per archetype × 6 archetypes)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,  // per-user, not per-IP — auth is required upstream
  message: { error: { code: 'RATE_LIMITED', retry_after: 3600 } },
  // Skip preflight + when no userId yet (auth middleware will reject anyway)
  skip: (req) => req.method === 'OPTIONS',
});
```

**Step C.3: Apply to the route**

Find:
```javascript
app.post('/api/daily-interpretation', requireUserAuth, express.json({ limit: '10kb' }), async (req, res) => {
```

Change to:
```javascript
app.post('/api/daily-interpretation', requireUserAuth, dailyInterpretationLimiter, express.json({ limit: '10kb' }), async (req, res) => {
```

**Order matters:** auth before limiter (so limiter knows userId), JSON parser after (no point parsing if rate-limited).

**Step C.4: Add a test for the limiter**

Add to `src/__tests__/api-daily-pulse.test.ts` a case:

```typescript
it('returns 429 RATE_LIMITED after 6 calls in 1h window', async () => {
  // Make 6 calls (each with valid pulse + archetype + locale) — all 200 or 503.
  // 7th call must be 429 with body { error: { code: 'RATE_LIMITED' } }.
});
```

**Step C.5: Run tests + commit**

```bash
npx vitest run src/__tests__/api-daily-pulse.test.ts 2>&1 | tail -5
# expect: all green (existing cases + new RATE_LIMITED case)

npm test 2>&1 | tail -5
# expect: baseline+11 all green

git add server.mjs src/__tests__/api-daily-pulse.test.ts
git commit -m "$(cat <<'EOF'
fix(tagespuls): rate-limit /api/daily-interpretation to 6 calls/hour/user

Closes 2026-05-09 code-review MEDIUM-4: Gemini-quota DoS surface on
the interpretation route. Limit chosen to match the natural use case
(1× per archetype × 6 archetypes per pulse), giving the user enough
headroom to compare archetypes without enabling silent quota burn.

Per-user keyGenerator (req.userId from requireUserAuth middleware
upstream) — not per-IP, so users behind shared NAT aren't punished
for each other's calls. Returns 429 with code RATE_LIMITED + 3600s
retry_after.

Test added: 7th call within window must return 429.
EOF
)"
```

---

## Phase D: schema.sql Annotation (INFO-1)

5-line header to mark the reference schema as design-only and point at the actual production migration.

### Task D: Add design-reference banner

**Files:**
- Modify: `apps/tagespuls_package/packages/db/schema.sql`

**Step D.1: Read current first lines**

```bash
head -5 apps/tagespuls_package/packages/db/schema.sql
```

**Step D.2: Prepend the banner**

Use Edit to insert at the top of the file (before the first `create table` statement):

```sql
-- ⚠️ DESIGN REFERENCE ONLY — production schema lives in
-- supabase-migrations/20260509_tagespuls_tables.sql
-- That file documents three intentional divergences from this reference:
--   1. user_astro_profiles is OMITTED (uses existing astro_profiles table,
--      one source of truth for chart data, no separate populate pipeline).
--   2. daily_pulses.slot_2 / slot_3 are NULLABLE (when LLM exhausted,
--      row stores aphorism + computed mode but null slots — no fake text).
--   3. user_id FKs reference auth.users(id), not user_astro_profiles
--      (matches existing astro_profiles, birth_data, natal_charts patterns).
-- Update this file when the reference shape changes; do NOT use it to
-- generate prod DDL.

```

**Step D.3: Verify**

```bash
git diff apps/tagespuls_package/packages/db/schema.sql | head -15
```

Expected: 11 added lines at the top, no other changes.

**Step D.4: Commit**

```bash
git add apps/tagespuls_package/packages/db/schema.sql
git commit -m "$(cat <<'EOF'
docs(tagespuls): annotate schema.sql as design reference only (INFO-1)

11-line banner makes the reference→migration relationship explicit so
the next reviewer doesn't read schema.sql as production truth (it
declares slot_1/2/3 NOT NULL while the actual migration declares
slot_2/3 NULLABLE — without the banner this looks like a critical bug).

Closes 2026-05-09 code-review INFO-1.
EOF
)"
```

---

## Phase E: Final Push + PR Comment

### Task E.1: Run full test suite + lint

```bash
npm test 2>&1 | tail -5
npm run lint 2>&1 | tail -5
```

**Expected:** baseline+11 all green; lint clean.

### Task E.2: Pre-push divergence check

```bash
git fetch origin 2026-05-09-tagespuls-no-placeholders 2>&1
git log origin/2026-05-09-tagespuls-no-placeholders..HEAD --oneline
```

Expected: 6 new commits (Phase A1+A2+A3 + B + C + D).

### Task E.3: Push

```bash
git push origin 2026-05-09-tagespuls-no-placeholders
```

### Task E.4: Optional — comment the close on the PR (if PR exists)

```bash
gh pr list --head 2026-05-09-tagespuls-no-placeholders 2>&1 | head -3
# if a PR exists for this branch:
# gh pr comment <NUM> --body "..."
```

---

## Out of Scope (deferred follow-ups from code review)

These came from the same review but are explicitly out of scope for pre-merge:

- **MEDIUM-1** (cooldown bypass when pool empty) — needs corpus-extension policy decision; either grow seed beyond 21 or implement tier-fallback. Deferred until corpus reaches 60+ rows naturally OR product decides on tier system.
- **MEDIUM-2** (race condition on concurrent daily-pulse requests) — micro-optimization; only meaningful at higher load. Track as TODO comment in `server.mjs` near the upsert.
- **MEDIUM-3** (cache stale on profile change) — needs `astro_profiles.updated_at` SELECT join. Forward sprint.
- **LOW-1** (Map-based L1 cache doesn't scale across processes) — Redis introduction is its own sprint; in-memory acceptable up to 1k MAU.
- **LOW-2** (`console.warn` telemetry) — project-wide pattern, addressed in S-3 cluster G (fail-loud backend).
- **LOW-3** (`weather_stale` always false) — needs cosmic_weather_snapshots integration; Phase D of the bigger Tagespuls plan, not pre-merge.

These should be tracked in `3-code/tasks.md` as new `TASK-*` rows in a follow-up commit, but doing so during this pre-merge plan adds scope.

---

## Summary

| Phase | Tasks | Commits | Files Touched | Tests Added |
|---|---|---|---|---|
| Pre-Flight 0.1–0.4 | Read-only state checks | 0 | 0 | 0 |
| A1 — server runtime | Stage + commit `server.mjs` (+ optional `tagespuls.service.mjs`) | 1 | 1-2 | 0 |
| A2 — db/voice/api refs | Stage + commit `apps/tagespuls_package/packages/` | 1 | ~7 | 0 |
| A3 — knowledge + skills + docs | Stage + commit `apps/tagespuls_package/{docs,knowledge,.claude,README}` | 1 | ~40 | 0 |
| B — route tests | Write `api-daily-pulse.test.ts` (10 cases) + `__resetTagespulsCache` export | 1 | 2 | +10 |
| C — rate-limit | Add `dailyInterpretationLimiter` + 1 test | 1 | 2 | +1 |
| D — schema annotation | Prepend 11-line banner to `schema.sql` | 1 | 1 | 0 |
| E — push | Full suite + lint + push (+ optional PR comment) | 0 | 0 | 0 |

**Total: 6 commits, ~50 files touched (mostly pre-existing untracked WIP getting tracked), 11 new tests, 0 new dependencies.**

After Phase E, the branch is fully test-covered, rate-limited, internally documented, and ready to merge. The 6 deferred items are tracked separately and don't block.
