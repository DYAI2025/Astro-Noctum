# Sphere Wuxing Surfaces — Preflight Fixes Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. After all preflight tasks pass, hand off to subagent-driven execution of `2026-04-30-sphere-wuxing-surfaces.md` Tasks 1–11 (5b, 5c included; 9b deferred).

**Goal:** Resolve 4 findings from critical review of the sphere-wuxing-surfaces plan so the main plan can execute cleanly inside an isolated worktree.

**Architecture:** Pure environment / scope work. No production code change. Series of `git`/`fs` operations + a documentation addendum + a baseline-build verification gate.

**Tech Stack:** git worktrees, npm scripts (vitest, tsc), shell.

**Branch context at preflight start:**
- Working tree: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum`
- Current branch: `2026-04-20-quiz-signatur-sprint-1` (dirty, with unrelated WIP)
- Origin: GitHub (per Task 0 the new worktree branches from `origin/main`)
- Worktree to create: `.worktrees/sphere-wuxing-surfaces` → `feature/sphere-wuxing-surfaces`

---

## Findings being addressed

| # | Finding | Severity | Resolved by |
|---|---------|----------|-------------|
| F1 | Plan file `2026-04-30-sphere-wuxing-surfaces.md` is untracked on a dirty branch; it will not exist in a worktree branched from `origin/main`. | Blocker | Task P1 (commit plan files to current branch) + Task P3 (copy spec into worktree post-create) |
| F2 | Plan references `outputs/preview-3d-wuxing.html` as a Phase-1 mockup; file does not exist anywhere in the repo. | Soft | Task P2 (addendum: GLSL is the source of truth) |
| F3 | Scope ambiguity for Tasks 5b/5c/9b. Re-reading shows 5b/5c are explicit Coverage-Gaps (required), 9b is "Variante B" alternative (optional). | Resolved on re-read | Task P2 (document in addendum) |
| F4 | Plan assumes `gl_FragColor` works. With `three@^0.175.0` + `@react-three/fiber@^9.5.0` + R3F default `ShaderMaterial`, this is fine (legacy GLSL 1.0 syntax is auto-translated). | Verified | No action — recorded in addendum |

---

## Task P0: Capture baseline

**Goal:** Snapshot the current dirty state and verify build is green BEFORE we touch anything. This is the safety net that lets us roll back.

**Files:** none (read-only)

**Step 1: Snapshot working tree state**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git status --short > /tmp/preflight-baseline-status.txt
git rev-parse HEAD > /tmp/preflight-baseline-head.txt
git stash list > /tmp/preflight-baseline-stash.txt
echo "Baseline captured: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /tmp/preflight-baseline-meta.txt
```

Expected: three small files in `/tmp/`, no errors.

**Step 2: Run typecheck on the main repo to confirm we are starting from green**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx tsc --noEmit 2>&1 | tail -20
```

Expected: `0 errors` or only pre-existing errors (we will not introduce new ones).

If new errors appear: STOP and report. Do not proceed.

**Step 3: Run focused test on the component the new plan touches**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx vitest run src/components/signatur-3d 2>&1 | tail -30
```

Expected: tests pass for `SignatureSphere3D` and any siblings.

If failing: STOP and report.

**Step 4: No commit — this is a read-only checkpoint.**

---

## Task P1: Commit only the new plan files to the current branch

**Goal:** Track the new plan files (incl. the one we are executing and this preflight) on `2026-04-20-quiz-signatur-sprint-1`. This makes the spec available on origin once pushed and survivable across worktrees. We deliberately do NOT touch the unrelated dirty edits in `CLAUDE.md` or the older plan modification — those stay in the working tree as the user left them.

**Files:**
- Add: `docs/plans/2026-04-30-sphere-wuxing-surfaces.md`
- Add: `docs/plans/2026-04-30-sphere-wuxing-preflight.md` (this file)
- Add: `docs/plans/2026-04-28-handoff-home-onepage-fokus.md` (sibling untracked)
- Add: `docs/plans/2026-04-28-spec-home-onepage-fokus.md` (sibling untracked)
- Add: `docs/plans/2026-04-29-handoff-fusion-chart-overlay.md` (sibling untracked)
- Add: `docs/plans/2026-04-29-spec-fusion-chart-overlay.md` (sibling untracked)

**Step 1: Confirm scope of what we are about to add**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git status --short -- 'docs/plans/'
```

Expected: lists exactly the 6 plan files above as `??` (untracked) and the older `2026-04-20-MASTER-PROMPTS-for-claude-code.md` as `M` (modified — DO NOT include).

**Step 2: Stage only the 6 new plan files explicitly**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git add \
  docs/plans/2026-04-30-sphere-wuxing-surfaces.md \
  docs/plans/2026-04-30-sphere-wuxing-preflight.md \
  docs/plans/2026-04-28-handoff-home-onepage-fokus.md \
  docs/plans/2026-04-28-spec-home-onepage-fokus.md \
  docs/plans/2026-04-29-handoff-fusion-chart-overlay.md \
  docs/plans/2026-04-29-spec-fusion-chart-overlay.md
```

**Step 3: Verify diff scope**

```bash
git diff --cached --stat
```

Expected: 6 files, all under `docs/plans/`, all green (additions only).

If anything else appears staged: `git restore --staged <file>` to drop it.

**Step 4: Commit**

```bash
git commit -m "docs(plans): track 2026-04-28..2026-04-30 plans incl. sphere-wuxing-surfaces and preflight"
```

**Step 5: Verify dirty state is reduced but unrelated WIP is preserved**

```bash
git status --short
```

Expected: still shows `M CLAUDE.md` and `M docs/plans/2026-04-20-MASTER-PROMPTS-for-claude-code.md` and the `.agent/` untracked tree. Those are the user's WIP and we leave them alone.

---

## Task P2: Write the addendum

**Goal:** Document the resolutions to F2 (missing mockup), F3 (scope), F4 (WebGL/GLSL compat) in a short addendum so the main plan is correct without rewriting it.

**Files:**
- Create: `docs/plans/2026-04-30-sphere-wuxing-surfaces.addendum.md`

**Step 1: Write the addendum**

Content (write verbatim):

```markdown
# Sphere Wuxing Surfaces — Plan Addendum

> Companion to `2026-04-30-sphere-wuxing-surfaces.md`. Resolves preflight findings F2/F3/F4 from `2026-04-30-sphere-wuxing-preflight.md` without touching the main plan body.

## F2 — Missing mockup `outputs/preview-3d-wuxing.html`

The main plan (Architecture section) refers to `outputs/preview-3d-wuxing.html` as a Phase-1 mockup that "already validated" the heightfield/albedo logic. **That file does not exist in this repo.** The GLSL in main-plan Task 3 is therefore the **single source of truth** for both vertex and fragment shaders.

**Implication for execution:** there is no reference render to A/B against. Visual verification falls entirely on Task 8 (Storybook) and Task 10 (real-profile smoke). If a future iteration needs a mockup, generate it from the GLSL — not the other way round.

## F3 — Scope decision

| Task | Status | Reason |
|------|--------|--------|
| 0–4 | Required | Foundation: types, constants, palettes, shaders, material builder |
| 5    | Required | API surface — `dominantElement` prop |
| 5b   | **Required** | Self-described as "Coverage-Gap 1 aus dem externen Implementierungsprompt" — gold wireframe is a stated visual requirement |
| 5c   | **Required** | Self-described as "Coverage-Gap 2" — halo wireframe for line readability is a stated requirement |
| 6    | Required | The actual visual swap |
| 7    | Required | Glue from `SignaturRenderer` |
| 8    | Required | Storybook stories — primary visual verification gate |
| 9    | Required | Performance smoke |
| 9b   | **Deferred** | "Variante B" — explicit alternative (Partikel-Layer). Out of scope for this iteration; track as follow-up if Task 9 perf budget allows |
| 10   | Required | Real BaZi-profile smoke |
| 11   | Required | PR prep |

Subagent dispatch order is therefore: 1, 2, 3, 4, 5, 5b, 5c, 6, 7, 8, 9, 10, 11.

## F4 — WebGL / GLSL compatibility

Verified versions (from `package.json` at HEAD):
- `three`: `^0.175.0`
- `@react-three/fiber`: `^9.5.0`
- `@react-three/drei`: `^10.7.7`
- `react`: `^19.0.0`
- `vitest`: `^4.0.18`
- `typescript`: `~5.8.2`

The main plan's GLSL uses GLSL 1.0 conventions (`gl_FragColor`, no `#version` directive). With Three.js r150+ and the default `ShaderMaterial` (not `RawShaderMaterial`), Three.js prepends the appropriate GLSL preamble and translates legacy syntax for WebGL2 contexts. **No GLSL changes required.**

If a future change introduces `RawShaderMaterial` or sets `glslVersion: THREE.GLSL3`, the shaders will need rewriting (`out vec4 outColor;` etc.). Out of scope for this iteration.

## F1 — Plan portability (worked around in preflight P3)

The main plan file is committed to `2026-04-20-quiz-signatur-sprint-1` by preflight Task P1. The worktree branched from `origin/main` will not contain it natively until either (a) the new branch merges with main, or (b) preflight Task P3 copies the two plan documents in. We do (b).
```

**Step 2: Stage and commit**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git add docs/plans/2026-04-30-sphere-wuxing-surfaces.addendum.md
git commit -m "docs(plans): add sphere-wuxing-surfaces addendum (mockup absence, scope, glsl compat)"
```

**Step 3: Verify**

```bash
git log --oneline -3
```

Expected: top two commits are the preflight P1 + P2 commits.

---

## Task P3: Create worktree per main-plan Task 0 and seed plan files

**Goal:** Execute main-plan Task 0 (worktree creation) AND copy the plan docs into the worktree so the new branch has the spec next to the code.

**Files:**
- Create dir: `.worktrees/sphere-wuxing-surfaces/` (via `git worktree add`)
- Copy: `docs/plans/2026-04-30-sphere-wuxing-surfaces.md` into worktree
- Copy: `docs/plans/2026-04-30-sphere-wuxing-surfaces.addendum.md` into worktree
- Copy: `docs/plans/2026-04-30-sphere-wuxing-preflight.md` into worktree

**Step 1: Fetch latest main**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git fetch origin main
```

Expected: fetch completes; `origin/main` ref exists.

**Step 2: Create the worktree**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git worktree add .worktrees/sphere-wuxing-surfaces -b feature/sphere-wuxing-surfaces origin/main
```

Expected: prints `Preparing worktree (new branch 'feature/sphere-wuxing-surfaces')` and `HEAD is now at <sha>`.

If the branch name already exists locally: STOP. Do not force. Report and ask.

**Step 3: Verify worktree state**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces
git status --short
git log --oneline -1
ls docs/plans/2026-04-30-sphere-wuxing-surfaces.md 2>&1
```

Expected: clean working tree; HEAD at `origin/main`; the plan file does NOT exist yet (this is the F1 problem we are about to fix).

**Step 4: Copy the three plan documents into the worktree from the main checkout**

```bash
MAIN_REPO=/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
WT=$MAIN_REPO/.worktrees/sphere-wuxing-surfaces
mkdir -p "$WT/docs/plans"
cp "$MAIN_REPO/docs/plans/2026-04-30-sphere-wuxing-surfaces.md" "$WT/docs/plans/"
cp "$MAIN_REPO/docs/plans/2026-04-30-sphere-wuxing-surfaces.addendum.md" "$WT/docs/plans/"
cp "$MAIN_REPO/docs/plans/2026-04-30-sphere-wuxing-preflight.md" "$WT/docs/plans/"
```

**Step 5: Stage and commit the spec on the feature branch**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces
git add docs/plans/2026-04-30-sphere-wuxing-surfaces.md docs/plans/2026-04-30-sphere-wuxing-surfaces.addendum.md docs/plans/2026-04-30-sphere-wuxing-preflight.md
git commit -m "docs(plans): seed sphere-wuxing-surfaces spec + addendum + preflight onto feature branch"
```

Expected: 3 files staged, 1 commit on `feature/sphere-wuxing-surfaces`.

**Step 6: Install dependencies inside the worktree**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces
npm install 2>&1 | tail -10
```

Expected: success or "up to date". Worktree shares the parent's `node_modules` if symlinked, or installs its own.

If it fails: report and do not proceed. Do not retry blindly.

**Step 7: Baseline verify inside the worktree**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces
npx tsc --noEmit 2>&1 | tail -10
npx vitest run src/components/signatur-3d 2>&1 | tail -20
```

Expected: tsc green, tests green. This is the baseline against which all main-plan tasks are evaluated.

If anything fails: STOP and report. Do not start main-plan tasks against a broken baseline.

**Step 8: Verify the empty-branch baseline commit (main-plan Task 0 step 4)**

The original Task 0 step 4 calls for an empty marker commit. We've already done a non-empty commit in P3 step 5 (the spec seed). That marker is therefore redundant — skip the `--allow-empty` step. Document this deviation:

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces
git log --oneline -3
```

Expected: shows the spec-seed commit on top of `origin/main`. No further commits needed before main-plan Task 1.

---

## Task P4: Hand off to subagent-driven execution of main plan

**Goal:** Confirm preflight green and announce hand-off.

**Files:** none.

**Step 1: Print hand-off summary**

Compose and emit (to user, in chat) a one-screen summary:
- Preflight outcome (green / blockers)
- Worktree path
- Branch name
- Main-plan dispatch order: 1, 2, 3, 4, 5, 5b, 5c, 6, 7, 8, 9, 10, 11 (9b deferred)
- Confirmation that main-plan execution will use `superpowers:subagent-driven-development`

**Step 2: Switch working directory context to the worktree**

All subsequent subagent dispatches in this session run with `cwd = /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces`.

**Step 3: Begin main-plan Task 1 (Wuxing-Element-Typ vereinheitlichen) via the implementer subagent template** — this kicks off the real execution under `subagent-driven-development`.

---

## Risks specific to preflight

1. **`npm install` inside the worktree may fail on first run** if the parent's `node_modules` linkage is dirty. Mitigation: run `npm install --no-audit --no-fund` and report failure verbatim; do not retry blindly.
2. **`origin/main` may be behind reality** if origin push has been delayed. Verify in P3 step 1 by inspecting `git rev-parse origin/main` against `git log origin/main -1`.
3. **The unrelated dirty edits on the current branch** (`CLAUDE.md`, older plan, `.agent/` untracked) are deliberately untouched. If the user later wants them committed, that is a separate task.
4. **The branch name `feature/sphere-wuxing-surfaces` may collide** with a previously created (and removed) branch ref. P3 step 2 fails fast in that case and surfaces the conflict to the user — do not force.
