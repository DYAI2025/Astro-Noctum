# Tagespuls Cache-Invalidation Fix (PR #331 follow-up)

**Date:** 2026-05-14
**Branch:** `2026-05-14-tagespuls-cache-invalidation-fixes`
**Base:** `main` @ commit `24ecefb`
**Scope:** Single Critical finding from PR #331 review.

## Finding addressed

**C-1** — `dailyPulseCache` L1 (24h TTL) bakes `existing_decision` into the cached payload but is **never invalidated** by `POST /api/daily-interpretation`. After a user picks an archetype, a hard reload (closed tab, refresh) within 24h serves the stale `existing_decision: null` payload from L1, so `useDailyPulse` lands in Phase 1 with active archetype buttons instead of the locked Phase 2.

This is exactly the BUG-DAILY-003/004 regression the `existing_decision` schema field was meant to prevent. The L2 (DB) layer is correct; only the L1 in-process cache is stale.

**Source:** `server.mjs:3315-3504` (POST handler). The successful insert at line 3447 returns at line 3499 with no `dailyPulseCache.delete(...)` call between them. The race-winner 409 path at line 3480-3487 also lacks invalidation.

**Cache key shape** (`server.mjs:2925`):
```js
function tagespulsCacheKey(userId, date, locale) {
  return `daily-pulse:${userId}:${date}:${locale}`;
}
```

Cache rows exist for both `de` and `en` siblings on the same `(userId, date)` (see I-3 logic at `server.mjs:3350-3375` — locale-switching loophole prevention). A successful insert must invalidate **both locale siblings**, otherwise switching locale after pick still serves stale Phase 1.

## Findings explicitly NOT addressed in this PR (deferred)

- **I-1** (no 401-on-missing-auth tests for the two new routes) — deferred per PO decision. Will be picked up in a separate test-hygiene PR.
- **I-2** (no POST-then-GET integration test for `existing_decision` hydration) — deferred per PO decision. This PR's regression test partially covers the spirit of I-2 but is scoped to cache-invalidation, not the broader contract.

## Minor findings dropped (per skill rule — not actioned in follow-up PRs)

- **M-1** Inconsistent 503 envelope: `retry_after` body but no `Retry-After` header.
- **M-2** `DailyPulseResponseSchema.harmony_index` non-nullable, DB nullable.
- **M-3** `useDailyPulse.interpretationByKey` not cleared on `pulse.id` change.

## Task

Single TDD-style task. One commit on this branch.

### TASK-CACHE-INVAL — Invalidate dailyPulseCache after POST /api/daily-interpretation

**Files touched:**
- `server.mjs` (~6 lines added across 2 paths)
- `server/__tests__/daily-interpretation.test.mjs` (new test case appended)

**Step 1 — RED test** (write before implementation):

Append a new test case to `server/__tests__/daily-interpretation.test.mjs`:

> _Scenario: GET `/api/daily-pulse` to warm L1 cache (existing_decision: null) → POST `/api/daily-interpretation` with valid archetype → GET `/api/daily-pulse` again → expect `existing_decision.archetype_key` matches the posted archetype._
>
> Use existing supertest harness pattern and mocks for `geminiClient` and `supabaseServer`. The locale-sibling case (POST in `de`, GET in `en`) should also be asserted in a sibling test or as a 2nd `expect` block.

The test must **fail** with the current code: second GET still returns `existing_decision: null` because the cache hit short-circuits before the existing-row check.

If the RED test passes on first run: HALT. The test isn't reaching the code path under test (most likely cause: test resets cache via `__resetTagespulsCache()` between the POST and GET, masking the bug). Don't proceed; surface to user.

**Step 2 — GREEN fix** (after RED is confirmed):

In `server.mjs` POST handler `/api/daily-interpretation`:

After successful insert (currently `server.mjs:3456`, before the `return res.json(...)` at line 3499) — invalidate both locale siblings:

```js
// PR-#331 C-1 fix: invalidate L1 cache for both locales after persisting
// a decision. Without this, a hard-reload within 24h serves the stale
// existing_decision: null payload and the client misses the Phase 2 lock.
dailyPulseCache.delete(tagespulsCacheKey(userId, pulse.date, 'de'));
dailyPulseCache.delete(tagespulsCacheKey(userId, pulse.date, 'en'));
```

In the 409 race-winner path (currently `server.mjs:3478-3487`) — same two `.delete(...)` calls before returning the 409. Rationale: by the time we hit 23505, the cache may still hold a null payload from the pre-race state; future reads must hit DB.

**Step 3 — Verify GREEN:**

Run the new test → must pass.
Run the full `daily-interpretation.test.mjs` and `api-daily-pulse.test.mjs` suites → must stay green.
Run `npm run typecheck:src` → must stay clean.

**Step 4 — Commit:**

Conventional Commits format with RED→GREEN evidence:

```
fix(tagespuls): invalidate L1 cache after daily-interpretation insert (PR-#331 C-1)

Without this, the dailyPulseCache (24h TTL) keeps serving the pre-insert
payload with existing_decision: null after a successful pick. A hard
reload within 24h then lands the user in Phase 1 with active archetype
buttons instead of the locked Phase 2 — exactly the BUG-DAILY-003/004
regression the existing_decision schema field was added to prevent.

Invalidates both de+en locale siblings of (userId, pulse.date) on
successful insert and on the 409 race-winner path. L2 (DB) was already
correct; only L1 was stale.

RED: server/__tests__/daily-interpretation.test.mjs new case
"invalidates L1 cache after successful insert" — GET-POST-GET assert
existing_decision.selected_archetype_key matches posted archetype.
Fails on main: 2nd GET still returns null. Passes with this fix.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## Verification before ship

- [ ] `npm run test -- server/__tests__/daily-interpretation.test.mjs server/__tests__/api-daily-pulse.test.mjs` green
- [ ] `npm run typecheck:src` green
- [ ] `git log --oneline main..HEAD` shows exactly one commit
- [ ] PR title: `fix(tagespuls): invalidate L1 cache after daily-interpretation insert (PR-#331 follow-up)`
- [ ] PR body lists C-1 addressed, I-1/I-2 deferred, M-1/M-2/M-3 dropped (per skill rule)
