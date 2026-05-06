# Phase 3 Ship Housekeeping Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the working tree so the 4 backend-hardening commits (`80443be..2540805`) can be pushed without sweeping in unrelated edits, and confirm the two Minor review findings need no further action.

**Architecture:** Inspect each working-tree change to classify it (sprint-related vs. external). Stash anything not part of Phase 3, commit anything that *is* part of Phase 3, then push only the intended 4 commits. The two Minor findings (503 status-code shift, error-body shape change) are already documented in commit messages and CHANGELOG — verify and close them.

**Tech Stack:** Git, no code changes required.

---

## Findings recap

| # | Severity | Issue | Action |
|---|----------|-------|--------|
| 1 | Important | 3 modified tracked files + 1 untracked file in working tree, none touched by this session's commits | Inspect → classify → stash or commit separately → ship clean |
| 2 | Minor | 503 AI_CONFIG_MISSING (was 401) on missing `ELEVENLABS_TOOL_SECRET` | Already documented in `ad4d21c` commit body — verify, no fix |
| 3 | Minor | Error body shape changed from `{"error":"Unauthorized"}` to envelope on the 4 migrated routes | Already documented in `ad4d21c` commit body — verify, no fix |

The unrelated files in the working tree:
```
 M src/components/Dashboard.tsx               (+2)
 M src/components/dashboard/DailyChartHero.tsx (+43)
 M src/hooks/useFirstRunDaily.ts              (+6)
?? DEVELOPMENT_BRIEF.md                        (17 KB, created today 18:05)
?? docs/plans/2026-05-06-phase3-review-fixes.md (the plan I wrote earlier — should ship)
```

---

## Task 1: Inspect each unrelated file

Read just enough of each diff to understand what it is. Don't act yet.

**Files:** none modified — read-only inspection.

### Step 1: Inspect Dashboard.tsx (+2 lines)

```bash
git diff src/components/Dashboard.tsx
```

Decision criteria:
- If it's a coherence-index display fix, dashboard-signatur work, or another active sprint → it belongs in a separate commit, not Phase 3 hardening.
- If it's commented-out code / random whitespace → revert.
- If it's clearly experimental / WIP → stash.

### Step 2: Inspect DailyChartHero.tsx (+43 lines)

```bash
git diff src/components/dashboard/DailyChartHero.tsx
```

Same decision criteria. 43 lines is substantial — likely intentional feature work.

### Step 3: Inspect useFirstRunDaily.ts (+6 lines)

```bash
git diff src/hooks/useFirstRunDaily.ts
```

### Step 4: Inspect DEVELOPMENT_BRIEF.md

```bash
head -20 DEVELOPMENT_BRIEF.md
wc -l DEVELOPMENT_BRIEF.md
```

This is 17 KB and was created at 18:05 today. Likely a fresh brief from the user for the next sprint chunk. Do NOT delete — read enough to confirm it's a doc, not code.

### Step 5: Confirm the Phase 3 plan doc is sprint-related

```bash
ls -la docs/plans/2026-05-06-phase3-review-fixes.md
head -5 docs/plans/2026-05-06-phase3-review-fixes.md
```

This was created by the writing-plans run earlier in the session and *is* part of the sprint paper trail. Will ship with the Phase 3 commits.

### Step 6: Report classification

After inspecting all four, classify each into one of:
- **A. Ships with Phase 3** (sprint-related, low-risk)
- **B. Ships separately** (clearly belongs to a different concern; commit on its own)
- **C. Stash** (WIP / unclear / not for shipping right now)
- **D. Revert** (cruft / accident)

Then ask the user to confirm the classification before any irreversible action. **No commits, stashes, or reverts in this task — just the classification.**

---

## Task 2: Execute the classification

Based on the user's confirmation in Task 1, run the agreed actions.

### Step 1: Add the Phase 3 plan doc to a separate commit

```bash
git add docs/plans/2026-05-06-phase3-review-fixes.md
git commit -m "$(cat <<'EOF'
docs(plans): Phase 3 review-fix plan

Drove the elevenLabsAuth wire-up onto four tool routes plus the
CHANGELOG Phase-3-partial update. Kept as reference for the
remaining Phase 3 work (Tasks 17-19).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 2: Handle DEVELOPMENT_BRIEF.md

Default action **based on the user's classification only**:
- If **A** (ships now): stage and commit it separately with a `docs:` message.
- If **B** (separate scope): leave untracked and stash for later.
- If **D** (delete): only delete after the user explicitly confirms.

**Never** commit a 17 KB brief without confirmation — it might contain WIP private context.

### Step 3: Handle the three Dashboard / DailyChartHero / useFirstRunDaily edits

Default: stash with a clear name, **without** the Phase 3 plan doc (which we already committed) or DEVELOPMENT_BRIEF.md (handled separately).

```bash
git stash push -m "phase3-ship-defer-2026-05-06" -- \
  src/components/Dashboard.tsx \
  src/components/dashboard/DailyChartHero.tsx \
  src/hooks/useFirstRunDaily.ts
```

Verify the stash captured exactly those three files:

```bash
git stash show --stat stash@{0}
```

Expected output: 3 files changed, ~51 insertions, no other paths.

### Step 4: Confirm working tree is clean except for whatever was deferred

```bash
git status --short
```

Expected: empty, or only the deferred items (DEVELOPMENT_BRIEF.md if classification B).

---

## Task 3: Push the cleaned commits

Pre-flight checks before push.

### Step 1: Confirm exactly the right commits are ahead of remote

```bash
git log origin/main..HEAD --oneline
```

Expected:
```
<hash> docs(plans): Phase 3 review-fix plan        (← from Task 2 Step 1)
2540805 docs(changelog): backend hardening sprint Phase 3 partial (Tasks 15-16)
ad4d21c refactor(server): wire elevenLabsAuth middleware onto tool routes
c4c591a feat(server): redact utility + structured JSON logger
80443be feat(server): ElevenLabs tool-auth middleware (timing-safe Bearer compare)
```

5 commits — all backend hardening + the plan doc. No Dashboard / DailyChartHero / useFirstRunDaily content.

### Step 2: Run the test suite once more

```bash
npx vitest run server/__tests__/ 2>&1 | tail -5
npm run lint 2>&1 | tail -3
```

Expected: 100/100 server tests pass, tsc clean. Confirms the working-tree changes from Task 2 didn't break anything (stash should be a pure deferral).

### Step 3: Push

```bash
git push 2>&1 | tail -5
```

If the push is rejected (remote ahead from a Codex agent), do:

```bash
git pull --rebase
npx vitest run server/__tests__/ 2>&1 | tail -5  # sanity after rebase
git push
```

### Step 4: Verify on remote

```bash
git log origin/main --oneline -8
```

Confirm the 5 expected commits land at the top of `origin/main` (their hashes will change if a rebase happened — the order and messages are what matters).

---

## Task 4: Close the two Minor findings (no code change)

Both minors are *documented* behaviour changes, not bugs. Verify the documentation is in place, then mark them closed.

### Step 1: Verify the 503 status-code change is in the commit body

```bash
git show ad4d21c --stat | head -3
git log -1 --format='%B' ad4d21c
```

Expected: commit message contains "503 AI_CONFIG_MISSING when ELEVENLABS_TOOL_SECRET is unset/empty (fail-closed)" — confirms the behaviour change is on record for anyone reading the commit history.

### Step 2: Verify the error-body shape change is in the commit body

Same `git show` output should also contain "Old `{"error":"Unauthorized"}` shape is gone" plus the rationale.

### Step 3: Verify CHANGELOG documents the new envelope shape

```bash
grep -A 2 "ElevenLabs tool-auth middleware" CHANGELOG.md | head -5
```

Expected: bullet describes "Structured-envelope responses (AUTH_REQUIRED / AUTH_INVALID / AI_CONFIG_MISSING) instead of the previous `{"error":"Unauthorized"}` string."

### Step 4: If any of the above checks fail, append a one-line note to the commit body or CHANGELOG

In practice all three should already be documented (they were when the commits were written). This is a verification task only.

---

## Done-when checklist

- [ ] Task 1: All 4 unrelated paths classified A/B/C/D, user confirmed.
- [ ] Task 2: Phase 3 plan doc committed; the three Dashboard/Hero/hook edits stashed under `phase3-ship-defer-2026-05-06`; DEVELOPMENT_BRIEF.md handled per user's choice.
- [ ] Task 3: Push succeeded (clean rebase if needed); remote `origin/main` shows the 5 sprint commits at HEAD; full test suite still green.
- [ ] Task 4: Both Minor findings verified as documented in commit bodies + CHANGELOG. No new commits unless documentation gap discovered.
