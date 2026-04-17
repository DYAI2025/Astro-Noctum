# Cymatics QA Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two bugs surfaced by the S-CYMATICS live QA session on 2026-04-17: a wrong `b` range annotation in the requirement spec, and the REQ still sitting at Draft status despite the sprint being complete.

**Architecture:** Both are documentation/SDLC artifact fixes — no production code changes. Task 1 corrects the `b` range in `REQ-F-signatur-cymatics.md` and tightens the unit test comment so they agree. Task 2 advances the same file from `Status: Draft` to `Status: Approved`, then syncs the index table in `1-objectives/CLAUDE.objectives.md`.

**Tech Stack:** Markdown file edits only. Verified by grep + vitest to confirm no test regressions.

---

### Task 1: Fix `b` range annotation in REQ-F-signatur-cymatics

**Context:** AC-1 of `REQ-F-signatur-cymatics.md` currently states `b: float 0.1..0.7`. This is wrong. The implementation formula is `b = 1.0 - a * 0.6`. With `a ∈ [0.3, 1.0]`, the real range is:
- `b_max = 1.0 − 0.3 × 0.6 = 0.82`
- `b_min = 1.0 − 1.0 × 0.6 = 0.40`

So the correct range is `b: float 0.40..0.82`. The unit test `cymatics-bridge.test.ts:126` already acknowledges this in a comment but the spec never got updated.

**Files:**
- Modify: `1-objectives/requirements/REQ-F-signatur-cymatics.md` line ~24
- Modify: `src/__tests__/cymatics-bridge.test.ts` line ~127 (remove "incorrect" comment, it's now correct)

**Step 1: Confirm the current wrong value exists**

```bash
grep "0.1..0.7\|0\.1\.\." 1-objectives/requirements/REQ-F-signatur-cymatics.md
```

Expected output: `  - \`b\`: float 0.1..0.7, derived as \`1.0 - a * 0.6\``

**Step 2: Fix the REQ annotation**

In `1-objectives/requirements/REQ-F-signatur-cymatics.md`, find AC-1 block (around line 24):

```markdown
  - `b`: float 0.1..0.7, derived as `1.0 - a * 0.6`
```

Replace with:

```markdown
  - `b`: float 0.40..0.82, derived as `1.0 - a * 0.6` (b = 1 − a×0.6; a ∈ [0.30,1.00])
```

**Step 3: Clean up the test comment that noted the old annotation was wrong**

In `src/__tests__/cymatics-bridge.test.ts` line ~127, the comment says:
```ts
// The REQ annotation "0.10..0.70" is incorrect; the formula b = 1 - a*0.6
// with a ∈ [0.3, 1.0] gives b ∈ [0.40, 0.82]. Test the formula directly.
```

Replace with a neutral comment (the annotation is now correct):
```ts
// Formula: b = 1 - a*0.6 with a ∈ [0.30, 1.00] → b ∈ [0.40, 0.82].
// Test verifies the formula holds exactly — not the REQ prose range.
```

**Step 4: Run cymatics tests to confirm nothing broke**

```bash
npx vitest run src/__tests__/cymatics-bridge.test.ts 2>&1 | tail -5
```

Expected: `26 passed`

**Step 5: Grep to confirm old annotation is gone**

```bash
grep -n "0\.1\.\.0\.7\|0\.10\.\.0\.70\|REQ annotation.*incorrect" \
  1-objectives/requirements/REQ-F-signatur-cymatics.md \
  src/__tests__/cymatics-bridge.test.ts
```

Expected: no output (both fixed).

**Step 6: Commit**

```bash
git add 1-objectives/requirements/REQ-F-signatur-cymatics.md \
        src/__tests__/cymatics-bridge.test.ts
git commit -m "fix(spec): correct b range in REQ-F-signatur-cymatics AC-1

The annotation stated b: 0.1..0.7 but the formula b = 1 - a*0.6
with a ∈ [0.30, 1.00] gives b ∈ [0.40, 0.82].
Updated REQ prose and removed stale 'incorrect' comment from test.
Surfaced by S-CYMATICS live QA session 2026-04-17.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Advance REQ-F-signatur-cymatics from Draft → Approved

**Context:** Sprint S-CYMATICS completed all 13 tasks (Done 2026-04-17). All 56 unit tests pass. TypeScript compiles clean. The requirement sat at `Draft` because the SDLC workflow requires explicit human approval. Now that QA is green and the spec annotation is corrected (Task 1), this REQ is ready to advance.

**Files:**
- Modify: `1-objectives/requirements/REQ-F-signatur-cymatics.md` — change `Status: Draft` → `Status: Approved`
- Modify: `1-objectives/CLAUDE.objectives.md` — update the Requirements index row for `REQ-F-signatur-cymatics` from `Draft` to `Approved`

**Step 1: Confirm current Draft status**

```bash
grep "^Status:" 1-objectives/requirements/REQ-F-signatur-cymatics.md
```

Expected: `Status: Draft`

**Step 2: Update REQ file status**

In `1-objectives/requirements/REQ-F-signatur-cymatics.md` line 7:

Change:
```markdown
**Status**: Draft
```

To:
```markdown
**Status**: Approved
```

**Step 3: Find the index row in CLAUDE.objectives.md**

```bash
grep -n "REQ-F-signatur-cymatics" 1-objectives/CLAUDE.objectives.md
```

This will show the line number and current status in the index table.

**Step 4: Update the index table**

In `1-objectives/CLAUDE.objectives.md`, find the row containing `REQ-F-signatur-cymatics` in the Requirements index table and change the status cell from `Draft` to `Approved`.

The row looks approximately like:
```
| [REQ-F-signatur-cymatics](requirements/REQ-F-signatur-cymatics.md) | Functional | Draft | ... |
```

Change `Draft` → `Approved` in that row only.

**Step 5: Verify both files updated**

```bash
grep "Status\|signatur-cymatics" \
  1-objectives/requirements/REQ-F-signatur-cymatics.md \
  1-objectives/CLAUDE.objectives.md
```

Expected: Both show `Approved` (not `Draft`).

**Step 6: Run full test suite to confirm no regressions**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 2006+ tests, all pass.

**Step 7: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: Clean.

**Step 8: Commit**

```bash
git add 1-objectives/requirements/REQ-F-signatur-cymatics.md \
        1-objectives/CLAUDE.objectives.md
git commit -m "docs(spec): approve REQ-F-signatur-cymatics post S-CYMATICS QA

Sprint S-CYMATICS complete — 13/13 tasks Done, 56/56 unit tests pass,
TypeScript clean, p5 absent, feature-flag default off confirmed.
QA session 2026-04-17 verified all 9 ACs. Advancing from Draft → Approved.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| b range annotation corrected | `grep "0.40..0.82" 1-objectives/requirements/REQ-F-signatur-cymatics.md` | 1 match |
| Old wrong range gone | `grep "0\.1\.\.0\.7" 1-objectives/requirements/REQ-F-signatur-cymatics.md` | no output |
| Test comment clean | `grep "incorrect" src/__tests__/cymatics-bridge.test.ts` | no output |
| Cymatics tests | `npx vitest run src/__tests__/cymatics-bridge.test.ts` | 26 passed |
| REQ status | `grep "^Status:" 1-objectives/requirements/REQ-F-signatur-cymatics.md` | `Status: Approved` |
| Index synced | `grep "REQ-F-signatur-cymatics" 1-objectives/CLAUDE.objectives.md` | contains `Approved` |
| Full suite | `npx vitest run` | 2006 passed |
| TypeScript | `npx tsc --noEmit` | Clean |
