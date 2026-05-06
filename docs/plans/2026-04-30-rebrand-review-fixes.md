# Rebrand Review-Fixes Plan (1 Important + 2 Minor)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address 3 findings from the post-rebrand code review of the 15 unpushed `bazodiac.space` commits on local `main`. Land the fixes as 3 small commits on top of `main`, ready to push.

**Architecture:** One docs-only restoration of historical plan text (sed sweep over-corrected), plus two regression guards as Vitest tests so the `bazodiac.space` migration can't silently undo itself in future commits. No production-code behavior change in this plan — guards only.

**Tech Stack:** Vitest (existing), `git grep` (Node child_process), TypeScript.

---

## Pre-flight

1. We are currently on branch `feature/sphere-wuxing-surfaces` with dirty working tree (`wuxing-material.ts` modified + `.agent/*` untracked). All edits in this plan happen on `main`. Sequence:
   - Stash the dirty file: `git stash push -m "sphere-wuxing wip" src/lib/signatur-3d/wuxing-material.ts`
   - Switch: `git checkout main`
   - Execute Tasks R10–R12 directly on `main` (small, low-risk fixups stacked on top of the rebrand commits)
   - When done: `git checkout feature/sphere-wuxing-surfaces && git stash pop`
2. Baseline test sanity: `npx vitest run src/__tests__/ai-router.test.ts` — should pass before we add a new test on top.
3. The 3 corrupted lines to restore are at `docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md:301`, `:320`, `:414`. Verified context.

---

## Task R10: Restore historical `bazodiac.com` references in stripe-webhook plan doc (Important)

**Why:** Commit `1ce7637` ran a `bazodiac.com → bazodiac.space` sed sweep and accidentally rewrote text that was *intentionally documenting the old broken state*. Three lines now read as nonsense no-ops. Plan docs are project memory — restoring the historical accuracy lets a future reader understand what the plan actually fixed.

**Files:**
- Modify: `docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md` (3 lines)

**Step 1: Inspect the three lines**

```bash
sed -n '301p;320p;414p' docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md
```

Expected (current, broken state):
```
Replace `"https://bazodiac.space"` with `"https://bazodiac.space"`:
git commit -m "fix: correct APP_URL fallback from bazodiac.space to bazodiac.space"
| 4 | #4 Wrong domain | `bazodiac.space` → `bazodiac.space` | — |
```

**Step 2: Restore historical references**

Each line must distinguish OLD (the broken domain that needed replacing) from NEW (the correct domain). All three follow the same pattern: the FIRST occurrence on each line is what was wrong, the SECOND is what should replace it.

Use the Edit tool with these three exact replacements (whitespace-significant):

Line 301:
- Old: `` Replace `"https://bazodiac.space"` with `"https://bazodiac.space"`: ``
- New: `` Replace `"https://bazodiac.com"` with `"https://bazodiac.space"`: ``

Line 320:
- Old: `git commit -m "fix: correct APP_URL fallback from bazodiac.space to bazodiac.space"`
- New: `git commit -m "fix: correct APP_URL fallback from bazodiac.com to bazodiac.space"`

Line 414:
- Old: `` | 4 | #4 Wrong domain | `bazodiac.space` → `bazodiac.space` | — | ``
- New: `` | 4 | #4 Wrong domain | `bazodiac.com` → `bazodiac.space` | — | ``

**Step 3: Verify**

```bash
sed -n '301p;320p;414p' docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md
```

Expected: each line now shows `bazodiac.com` followed by `bazodiac.space` — historical migration intent is readable again.

**Step 4: Sanity check — no other lines accidentally corrupted by the same sed**

```bash
grep -nE "bazodiac\.space.*bazodiac\.space|bazodiac\.space.*→.*bazodiac\.space|fallback from bazodiac\.space to bazodiac\.space" docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md
```

Expected: zero output (the only 3 corrupted patterns are the ones we just fixed).

**Step 5: Commit**

```bash
git add docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md
git commit -m "$(cat <<'EOF'
docs(plan): restore historical bazodiac.com references in stripe webhook plan

The earlier rebrand sed sweep (commit 1ce7637) over-corrected three lines
that intentionally documented the old broken domain — they're descriptions
of WHAT the migration fixed, not target text to update. Restored so the
historical record is readable and a future reader can reconstruct the
migration intent.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task R11: Test asserting ai-router default referer is `bazodiac.space` (Minor regression guard)

**Why:** `server/ai-router.mjs:165` defaults `referer` to `https://bazodiac.space` (was Railway-internal). This default is what OpenRouter sees on every fallback call when the caller doesn't override. A future refactor or cherry-pick could silently change this back. One test prevents that.

**Files:**
- Modify: `src/__tests__/ai-router.test.ts` (append one test inside the existing `describe`)

**Step 1: Inspect the existing test file structure**

```bash
grep -n "describe\|^import" src/__tests__/ai-router.test.ts | head
```

We just need to know:
- The `import { createGenAiRouter, DEFAULT_FREE_MODEL_CHAIN } from '../../server/ai-router.mjs';` line exists
- A `describe(...)` block we can append to

**Step 2: Write the failing test**

Append inside the existing `describe(...)` block in `src/__tests__/ai-router.test.ts`. The exact location: just before the closing `});` of the outer describe.

```ts
  it('defaults the OpenRouter Referer header to https://bazodiac.space', async () => {
    // Trigger an OpenRouter call so we can inspect the Referer header
    // sent by the router. We force-fail Gemini to roll through OpenRouter.
    mockGenerateContent.mockRejectedValueOnce(
      Object.assign(new Error('quota'), { status: 429 }),
    );
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
      }),
    }));
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'or',
      // Note: NOT passing `referer` — we want to assert the default.
    });
    await router.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
    });

    expect(fetchSpy).toHaveBeenCalled();
    const init = (fetchSpy.mock.calls[0] as [string, RequestInit])[1];
    const headers = init.headers as Record<string, string>;
    expect(headers['HTTP-Referer']).toBe('https://bazodiac.space');
  });
```

**Step 3: Run — expect PASS** (the production code already has the right default; this test simply pins it)

```bash
npx vitest run src/__tests__/ai-router.test.ts
```

Expected: all pre-existing tests + the new one pass.

**Step 4: Verify the test would actually catch a regression**

Sanity check: temporarily change `server/ai-router.mjs:168` default from `https://bazodiac.space` to `https://example.com`, re-run the test, confirm it fails with a clear message, then revert. Skip this if confidence is already high — it's a 30-second sanity check, not mandatory.

**Step 5: Commit**

```bash
git add src/__tests__/ai-router.test.ts
git commit -m "$(cat <<'EOF'
test(ai-router): pin OpenRouter Referer default to bazodiac.space

Regression guard so a future refactor / cherry-pick / rebase can't
silently revert the OpenRouter HTTP-Referer default to a stale
Railway-internal URL.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task R12: Repo-wide regression guard against `bazodiac.com` reintroduction (Minor)

**Why:** The rebrand sweep removed every reference to `bazodiac.com` from production code, configs, and current docs. But future commits could trivially reintroduce one (a copy-pasted snippet, a regenerated config, an LLM-suggested URL). One Vitest test scans tracked files and fails if the dead domain appears in any production-relevant path. Historical plan docs are explicitly allow-listed because they legitimately describe the old broken state.

**Files:**
- Create: `src/__tests__/no-dead-domain.test.ts`

**Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as path from 'node:path';

/**
 * Forbids the dead `bazodiac.com` domain from reappearing in production
 * code, configs, current docs, or marketing assets. Historical plan docs
 * (`docs/plans/2026-04-25-domain-cleanup-bazodiac-space.md` and the older
 * stripe-webhook plan) are allow-listed because they legitimately
 * document the old state for migration history.
 */
describe('rebrand: no-dead-domain', () => {
  // Paths that may legitimately reference bazodiac.com (historical context only).
  const ALLOWLIST_PREFIXES = [
    'docs/plans/2026-04-25-domain-cleanup-bazodiac-space.md',
    'docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md',
    'docs/plans/2026-04-30-rebrand-review-fixes.md', // this plan
  ];

  it('contains no `bazodiac.com` in production code or current docs', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    let output = '';
    try {
      output = execSync(
        // List all files containing the dead domain, tracked by git only.
        `git grep -nFI "bazodiac.com" -- ":(top)"`,
        { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
    } catch (e: any) {
      // git grep exits 1 when there are no matches — that's the success path.
      if (e.status === 1) return;
      throw e;
    }

    const offending = output
      .split('\n')
      .filter(Boolean)
      .filter(line => {
        const filePath = line.split(':', 1)[0];
        return !ALLOWLIST_PREFIXES.some(prefix => filePath === prefix);
      });

    expect(offending, `Dead domain 'bazodiac.com' reappeared in:\n${offending.join('\n')}`)
      .toEqual([]);
  });
});
```

**Step 2: Run — expect PASS**

```bash
npx vitest run src/__tests__/no-dead-domain.test.ts
```

Expected: 1 passing. If FAIL with output listing files, those are unexpected reappearances — investigate before allow-listing.

**Step 3: Verify the guard would actually catch a regression**

Quick sanity check: temporarily add a `// bazodiac.com` line to any file under `src/` (e.g. `src/App.tsx`), re-run the test, confirm it fails with the file path in the error, then revert. Skip if you trust the construction.

**Step 4: Commit**

```bash
git add src/__tests__/no-dead-domain.test.ts
git commit -m "$(cat <<'EOF'
test(rebrand): guard against bazodiac.com reintroduction

Historical migration plans are allow-listed (they legitimately describe
the old state). Any production-code or current-doc reference to the dead
domain now fails CI.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

After all 3 tasks:

```bash
# Targeted tests
npx vitest run src/__tests__/ai-router.test.ts src/__tests__/no-dead-domain.test.ts 2>&1 | tail -3

# Spot-check fixed plan doc
sed -n '301p;320p;414p' docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md

# Full vitest sweep — should still be at the previous 2009+ count plus our 2 new tests
npx vitest run 2>&1 | tail -3

# Commits we just landed (top of main)
git log --oneline -4
```

Expected:
- Targeted tests: 2 new tests pass + all pre-existing in those files pass.
- Plan doc lines: each shows `bazodiac.com` followed by `bazodiac.space`.
- Full sweep: 2011+ tests passing, 0 failures.
- Top 4 commits: R12, R11, R10, then the merge commit `b523339`.

Then restore working state:

```bash
git checkout feature/sphere-wuxing-surfaces
git stash pop
```

Working tree is back to where it was at start of session (sphere-wuxing dirty edits restored).
