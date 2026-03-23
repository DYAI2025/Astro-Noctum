# Scaffold Overlay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overlay the ai-scrum-scaffold onto the Astro-Noctum monorepo so that agents have decision records, traceability, and structured context — without disrupting existing code or workflows.

**Architecture:** Four scaffold phase directories (`1-objectives/`, `2-design/`, `3-code/`, `4-deploy/`) are added at the Astro-Noctum repo root. Existing docs are migrated into scaffold artifacts, then archived. The CLAUDE.md hierarchy is extended (not replaced). Component directories in `3-code/` contain only steering files, not code.

**Tech Stack:** Markdown, Claude Code skills (`.claude/skills/SDLC-*/`), git

**Reference:** Design doc at `docs/plans/2026-03-23-reduced-scaffold-design.md`

---

### Task 1: Create scaffold directory skeleton

**Files:**
- Create: `1-objectives/goals/.gitkeep`
- Create: `1-objectives/requirements/.gitkeep`
- Create: `1-objectives/assumptions/.gitkeep`
- Create: `1-objectives/constraints/.gitkeep`
- Create: `2-design/decisions/.gitkeep`
- Create: `3-code/frontend/.gitkeep`
- Create: `3-code/api-server/.gitkeep`
- Create: `3-code/mobile/.gitkeep`
- Create: `4-deploy/runbooks/.gitkeep`
- Create: `archive/.gitkeep`

**Step 1: Create all directories**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
mkdir -p 1-objectives/{goals,requirements,assumptions,constraints}
mkdir -p 2-design/decisions
mkdir -p 3-code/{frontend,api-server,mobile}
mkdir -p 4-deploy/runbooks
mkdir -p archive
touch 1-objectives/goals/.gitkeep 1-objectives/requirements/.gitkeep \
      1-objectives/assumptions/.gitkeep 1-objectives/constraints/.gitkeep \
      2-design/decisions/.gitkeep \
      3-code/frontend/.gitkeep 3-code/api-server/.gitkeep 3-code/mobile/.gitkeep \
      4-deploy/runbooks/.gitkeep archive/.gitkeep
```

**Step 2: Commit**

```bash
git add 1-objectives/ 2-design/ 3-code/ 4-deploy/ archive/
git commit -m "feat: create SDLC scaffold directory skeleton"
```

---

### Task 2: Copy scaffold templates and procedures

Copy the artifact templates and decision procedures from ai-scrum-scaffold. These provide the structure agents use when creating new artifacts.

**Files:**
- Create: `1-objectives/goals/_template.md`
- Create: `1-objectives/requirements/_template.md`
- Create: `1-objectives/assumptions/_template.md`
- Create: `1-objectives/constraints/_template.md`
- Create: `2-design/decisions/_template.md`
- Create: `2-design/decisions/_template.history.md`
- Create: `2-design/decisions/PROCEDURES.md`
- Create: `4-deploy/runbooks/_template.md`

**Step 1: Copy templates from scaffold repo**

```bash
SCAFFOLD=/Users/benjaminpoersch/Projects/codebase/Scrum_Master/ai-scrum-scaffold
ASTRO=/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum

cp "$SCAFFOLD/1-objectives/goals/_template.md"        "$ASTRO/1-objectives/goals/"
cp "$SCAFFOLD/1-objectives/requirements/_template.md"  "$ASTRO/1-objectives/requirements/"
cp "$SCAFFOLD/1-objectives/assumptions/_template.md"   "$ASTRO/1-objectives/assumptions/"
cp "$SCAFFOLD/1-objectives/constraints/_template.md"   "$ASTRO/1-objectives/constraints/"
cp "$SCAFFOLD/2-design/decisions/_template.md"         "$ASTRO/2-design/decisions/"
cp "$SCAFFOLD/2-design/decisions/_template.history.md" "$ASTRO/2-design/decisions/"
cp "$SCAFFOLD/2-design/decisions/PROCEDURES.md"        "$ASTRO/2-design/decisions/"
cp "$SCAFFOLD/4-deploy/runbooks/_template.md"          "$ASTRO/4-deploy/runbooks/"
```

**Step 2: Remove .gitkeep files that are no longer needed (directories now have content)**

```bash
rm -f "$ASTRO/1-objectives/goals/.gitkeep" \
      "$ASTRO/1-objectives/requirements/.gitkeep" \
      "$ASTRO/1-objectives/assumptions/.gitkeep" \
      "$ASTRO/1-objectives/constraints/.gitkeep" \
      "$ASTRO/2-design/decisions/.gitkeep" \
      "$ASTRO/4-deploy/runbooks/.gitkeep"
```

**Step 3: Commit**

```bash
git add 1-objectives/ 2-design/ 4-deploy/
git commit -m "feat: add scaffold artifact templates and decision procedures"
```

---

### Task 3: Copy SDLC skills

Copy all 8 SDLC skills from the scaffold repo into Astro-Noctum's `.claude/skills/`. These coexist with the existing 10 commands in `.claude/commands/`.

**Files:**
- Create: `.claude/skills/SDLC-init/SKILL.md`
- Create: `.claude/skills/SDLC-elicit/SKILL.md`
- Create: `.claude/skills/SDLC-design/SKILL.md`
- Create: `.claude/skills/SDLC-decompose/SKILL.md`
- Create: `.claude/skills/SDLC-implementation-plan/SKILL.md`
- Create: `.claude/skills/SDLC-execute-next-task/SKILL.md`
- Create: `.claude/skills/SDLC-fix/SKILL.md`
- Create: `.claude/skills/SDLC-status/SKILL.md`

**Step 1: Copy skills**

```bash
SCAFFOLD=/Users/benjaminpoersch/Projects/codebase/Scrum_Master/ai-scrum-scaffold
ASTRO=/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum

for skill in SDLC-init SDLC-elicit SDLC-design SDLC-decompose \
             SDLC-implementation-plan SDLC-execute-next-task SDLC-fix SDLC-status; do
  mkdir -p "$ASTRO/.claude/skills/$skill"
  cp "$SCAFFOLD/.claude/skills/$skill/SKILL.md" "$ASTRO/.claude/skills/$skill/"
done
```

**Step 2: Verify skills are discoverable**

```bash
ls "$ASTRO/.claude/skills/SDLC-"*/SKILL.md
```

Expected: 8 SKILL.md files listed.

**Step 3: Commit**

```bash
git add .claude/skills/SDLC-*/
git commit -m "feat: add SDLC lifecycle skills from scaffold"
```

---

### Task 4: Write phase instruction files

Create the CLAUDE.<phase>.md files adapted for Bazodiac. These are based on the scaffold originals but trimmed (no User Stories, no Stakeholders) and adapted (component dirs are steering-only).

**Files:**
- Create: `1-objectives/CLAUDE.objectives.md`
- Create: `2-design/CLAUDE.design.md`
- Create: `3-code/CLAUDE.code.md`
- Create: `4-deploy/CLAUDE.deploy.md`

**Step 1: Write `1-objectives/CLAUDE.objectives.md`**

Base on the scaffold's version but remove User Stories and Stakeholders sections. Keep: Goals, Requirements, Assumptions, Constraints with their index tables, status lifecycles, conflict resolution, and assumption invalidation procedures. Add the Goals Index, Requirements Index, Assumptions Index, and Constraints Index tables (empty, with HTML comments for guidance).

Reference: read `/Users/benjaminpoersch/Projects/codebase/Scrum_Master/ai-scrum-scaffold/1-objectives/CLAUDE.objectives.md` and adapt.

**Step 2: Write `2-design/CLAUDE.design.md`**

Copy scaffold's version mostly as-is. It lists architecture.md, data-model.md, api-design.md, decisions/. Add empty Decisions Index table.

Reference: read `/Users/benjaminpoersch/Projects/codebase/Scrum_Master/ai-scrum-scaffold/2-design/CLAUDE.design.md` and adapt.

**Step 3: Write `3-code/CLAUDE.code.md`**

Adapt scaffold's version. Key changes:
- Components section lists frontend, api-server, mobile with their real code paths
- Component isolation rule adapted: code lives in `src/`, `server/`, `apps/mobile/` — the `3-code/<component>/` dirs are steering-only
- Build commands section: reference Astro-Noctum's existing CLAUDE.md for `npm run dev`, `npm run build`, `npm run test` etc.
- Task tracking section: points to `tasks.md`

Reference: read `/Users/benjaminpoersch/Projects/codebase/Scrum_Master/ai-scrum-scaffold/3-code/CLAUDE.code.md` and adapt.

**Step 4: Write `4-deploy/CLAUDE.deploy.md`**

Copy scaffold's version. Mention Railway (web), VPS/nginx (sky.bazodiac.space), and Expo (mobile) as deployment targets.

Reference: read `/Users/benjaminpoersch/Projects/codebase/Scrum_Master/ai-scrum-scaffold/4-deploy/CLAUDE.deploy.md` and adapt.

**Step 5: Commit**

```bash
git add 1-objectives/CLAUDE.objectives.md 2-design/CLAUDE.design.md \
        3-code/CLAUDE.code.md 4-deploy/CLAUDE.deploy.md
git commit -m "feat: add phase-specific CLAUDE instruction files for Bazodiac"
```

---

### Task 5: Write component steering files

Create the CLAUDE.<component>.md files that connect scaffold decisions/requirements to real code paths.

**Files:**
- Create: `3-code/frontend/CLAUDE.frontend.md`
- Create: `3-code/api-server/CLAUDE.api-server.md`
- Create: `3-code/mobile/CLAUDE.mobile.md`

**Step 1: Write `3-code/frontend/CLAUDE.frontend.md`**

```markdown
Component-specific instructions for the **frontend**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

## Code Location

All frontend source code lives in `../../src/` (Astro-Noctum/src/).
For code conventions, build commands, and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Scope

React 19 SPA with Tailwind CSS v4, Framer Motion, Three.js (Fusion Ring).
Includes: components, pages, hooks, contexts, services, i18n, Storybook.

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
<!-- Add rows as decisions are recorded -->

## Addressed Requirements

| Requirement | Status |
|-------------|--------|
<!-- Add rows as tasks are completed -->
```

**Step 2: Write `3-code/api-server/CLAUDE.api-server.md`**

Same structure. Code location: `../../server/`. Scope: Express.js API routes, Stripe webhooks, Supabase client, Gemini/ElevenLabs integration.

**Step 3: Write `3-code/mobile/CLAUDE.mobile.md`**

Same structure. Code location: `../../apps/mobile/`. Scope: Expo 53 iOS app, React Native, shared package integration.

**Step 4: Remove .gitkeep files and commit**

```bash
rm -f 3-code/frontend/.gitkeep 3-code/api-server/.gitkeep 3-code/mobile/.gitkeep
git add 3-code/frontend/ 3-code/api-server/ 3-code/mobile/
git commit -m "feat: add component steering files for frontend, api-server, mobile"
```

---

### Task 6: Create empty scaffold design documents

Create placeholder design documents that will be populated during migration (Task 9).

**Files:**
- Create: `2-design/architecture.md`
- Create: `2-design/data-model.md`
- Create: `2-design/api-design.md`
- Create: `3-code/tasks.md`

**Step 1: Write placeholders**

Each file gets a title and a `<!-- TODO: populate during migration -->` comment. `tasks.md` gets the task table header from the scaffold:

```markdown
# Development Tasks

| ID | Task | Component | Phase | Req | Status | Notes |
|----|------|-----------|-------|-----|--------|-------|
<!-- Tasks will be generated by /SDLC-implementation-plan -->
```

**Step 2: Commit**

```bash
git add 2-design/architecture.md 2-design/data-model.md 2-design/api-design.md 3-code/tasks.md
git commit -m "feat: add placeholder design documents and task tracker"
```

---

### Task 7: Write root CLAUDE.md for Bazodiac-WebApp scope

This is the most critical file. It sits at the Astro-Noctum root and **extends** (not replaces) the existing CLAUDE.md. Since we can't have two CLAUDE.md files in the same directory, integrate the scaffold instructions into the existing CLAUDE.md.

**Files:**
- Modify: `CLAUDE.md` (Astro-Noctum root)

**Step 1: Read the existing CLAUDE.md fully**

```bash
cat CLAUDE.md
```

Understand current structure and content.

**Step 2: Add scaffold sections to existing CLAUDE.md**

Insert the following sections after the existing project description but before code-specific instructions. The scaffold sections to add:

1. **SDLC Scaffold** — brief explanation that this repo uses the ai-scrum-scaffold overlay
2. **Skills table** — the 8 SDLC skills + reference to existing 10 commands
3. **Phase structure** — table linking to phase dirs and CLAUDE.<phase>.md files
4. **Artifacts** — types, naming convention (kebab-case IDs), locations
5. **Decisions** — how to use and record decisions, link to PROCEDURES.md
6. **Graduated Safeguards** — the three tiers (Always ask / Precedent / Decide and record)
7. **Phase Gates** — simplified gates (at least one Goal + Requirement Approved before Design)
8. **Tooling Roles** — Scaffold = source of truth, Miro = brainstorming, GitHub Issues = bugs
9. **Cross-Skill Artifact Procedures** — link to SKILL.md files for each phase

Do NOT duplicate content already in phase CLAUDE files — reference them instead.
Do NOT remove any existing content from CLAUDE.md.

**Step 3: Verify the file is valid markdown and not too long**

The scaffold additions should be 80-120 lines. Total CLAUDE.md should stay under 300 lines.

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: integrate SDLC scaffold instructions into CLAUDE.md"
```

---

### Task 8: Record key architecture decisions

Extract the most important implicit decisions from the codebase and formalize them as DEC-* records. Start with 3-5 high-impact decisions that agents most need to respect.

**Files:**
- Create: `2-design/decisions/DEC-supabase-backend.md`
- Create: `2-design/decisions/DEC-supabase-backend.history.md`
- Create: `2-design/decisions/DEC-swiss-ephemeris.md`
- Create: `2-design/decisions/DEC-swiss-ephemeris.history.md`
- Create: `2-design/decisions/DEC-wuxing-ui-mapping.md`
- Create: `2-design/decisions/DEC-wuxing-ui-mapping.history.md`
- Modify: `2-design/CLAUDE.design.md` (add to Decisions Index)
- Modify: `3-code/frontend/CLAUDE.frontend.md` (add relevant decisions)
- Modify: `3-code/api-server/CLAUDE.api-server.md` (add relevant decisions)

**Step 1: Read existing docs for decision context**

Read TRUENORTH.md, QWEN.md, CLAUDE.md, and key source files to understand:
- Why Supabase (not Firebase, not custom Postgres)
- Why Swiss Ephemeris via BAFE (not other astrology APIs)
- How Wu-Xing maps to UI physics (from TRUENORTH.md autopoiesis model)

**Step 2: Create DEC-supabase-backend.md from template**

Use `2-design/decisions/_template.md`. Fill in: context (why Supabase), decision (Supabase as sole backend with RLS), enforcement (no direct Postgres, always use Supabase client, RLS on every table), scope (api-server, frontend), trigger conditions (Code: when writing data access; Deploy: when provisioning infrastructure).

**Step 3: Create DEC-supabase-backend.history.md from template**

Involvement: `ai-proposed/human-approved` (decision was implicit, now formalized).

**Step 4: Create DEC-swiss-ephemeris.md and history**

Context: deterministic astrological calculations. Decision: Swiss Ephemeris via BAFE Python library. Enforcement: no alternative astrology APIs, all chart calculations go through bazi_engine.

**Step 5: Create DEC-wuxing-ui-mapping.md and history**

Context: TRUENORTH autopoiesis model. Decision: Wu-Xing elements drive UI physics (colors, animations, layout resonance). Enforcement: element-to-style mapping is centralized, not scattered across components.

**Step 6: Update decisions indexes in CLAUDE.design.md and component files**

Add rows to the Decisions Index tables with File column links and trigger conditions.

**Step 7: Commit**

```bash
git add 2-design/decisions/DEC-*.md 2-design/CLAUDE.design.md \
        3-code/frontend/CLAUDE.frontend.md 3-code/api-server/CLAUDE.api-server.md
git commit -m "feat: record 3 key architecture decisions as DEC-* records"
```

---

### Task 9: Migrate objectives from existing docs

Extract goals, requirements, and constraints from TRUENORTH.md, GOAL.md, and known project constraints.

**Files:**
- Create: `1-objectives/goals/GOAL-fusion-astrology.md` (core product goal)
- Create: `1-objectives/goals/GOAL-autopoietic-ux.md` (UI adapts to user's elemental signature)
- Create: `1-objectives/constraints/CON-german-ui.md`
- Create: `1-objectives/constraints/CON-dark-luxury-aesthetic.md`
- Create: 3-5 `1-objectives/requirements/REQ-F-*.md` from the most important specified features
- Modify: `1-objectives/CLAUDE.objectives.md` (update all index tables)

**Step 1: Read TRUENORTH.md and GOAL.md fully**

Extract the core goals and constraints.

**Step 2: Create goal files from template**

Each goal needs: description, success criteria, priority (MoSCoW), status (Approved — these are established goals), and links to requirements.

**Step 3: Create constraint files from template**

CON-german-ui: UI text is German, code/comments English.
CON-dark-luxury-aesthetic: Dark OLED-first design, Wu-Xing color palette.

**Step 4: Create 3-5 key requirement files**

Derive from the most important features that are already specified. Examples:
- REQ-F-natal-chart-calculation
- REQ-F-fusion-ring-visualization
- REQ-F-bazi-partnership-synastry
- REQ-F-cosmic-encounter-onboarding
- REQ-PERF-chart-calculation-speed

Each needs: testable acceptance criteria, priority, status, traces-to goal.

**Step 5: Update index tables in CLAUDE.objectives.md**

Add rows with File column links for all created artifacts.

**Step 6: Commit**

```bash
git add 1-objectives/
git commit -m "feat: migrate core goals, constraints, and requirements from existing docs"
```

---

### Task 10: Migrate design documents

Consolidate existing architecture docs into the scaffold's design files.

**Files:**
- Modify: `2-design/architecture.md`
- Modify: `2-design/data-model.md`
- Modify: `2-design/api-design.md`

**Step 1: Read source documents**

- QWEN.md — tech stack, system overview
- ARCHITECTURE_EXPERIENCE.md (in Astro-Noctum if exists, or in parent dir)
- Supabase migration files in `supabase-migrations/`
- Server route files in `server/`

**Step 2: Write architecture.md**

Consolidate into scaffold format: system overview, component diagram (text-based), tech stack summary, key integration points (Supabase, Stripe, Gemini, ElevenLabs, NASA DONKI). Reference decisions by ID (DEC-supabase-backend, etc.). Reference requirements by ID.

**Step 3: Write data-model.md**

Document Supabase tables, RLS policies, key relationships. Source from migration files.

**Step 4: Write api-design.md**

Document Express API endpoints, external API integrations, authentication flow. Source from server/ route files.

**Step 5: Commit**

```bash
git add 2-design/architecture.md 2-design/data-model.md 2-design/api-design.md
git commit -m "feat: consolidate architecture, data model, and API design docs"
```

---

### Task 11: Migrate open tasks to scaffold format

Transfer open tasks from TASKS.md and BACKLOG.md into the scaffold's `3-code/tasks.md`.

**Files:**
- Modify: `3-code/tasks.md`

**Step 1: Read TASKS.md and BACKLOG.md**

Identify all items that are not Done/completed.

**Step 2: Convert to scaffold task format**

Each task needs: ID (TASK-kebab-name), description, component, phase grouping, requirement link (if applicable), status (Pending).

**Step 3: Group into phases**

Organize tasks so each phase ends with a deployable/testable state.

**Step 4: Commit**

```bash
git add 3-code/tasks.md
git commit -m "feat: migrate open tasks from TASKS.md and BACKLOG.md to scaffold format"
```

---

### Task 12: Archive migrated docs

Move all migrated source documents to `archive/` to avoid confusion.

**Files:**
- Move: `TRUENORTH.md` → `archive/`
- Move: `GOAL.md` → `archive/`
- Move: `QWEN.md` → `archive/`
- Move: `TASKS.md` → `archive/`
- Move: `BACKLOG.md` → `archive/`
- Move: `BACKLOG_ARCHETYPES.md` → `archive/`
- Move: `AGENTS.md` → `archive/`
- Move: `AGENTS-PROTOCOL.md` → `archive/`
- Move: `CLAWTEAM-PROTOCOL.md` → `archive/`
- Move: `METACLAW-FRAMEWORK.md` → `archive/`
- Move: `DEV_BRIEF_*.md` → `archive/`

**Step 1: Move files**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
mv TRUENORTH.md GOAL.md QWEN.md TASKS.md BACKLOG.md BACKLOG_ARCHETYPES.md \
   AGENTS.md AGENTS-PROTOCOL.md CLAWTEAM-PROTOCOL.md METACLAW-FRAMEWORK.md \
   DEV_BRIEF_*.md archive/ 2>/dev/null
```

**Step 2: Verify nothing is broken**

Check that CLAUDE.md doesn't reference any moved files. If it does, update the references to point to `archive/`.

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: archive migrated docs replaced by scaffold artifacts"
```

---

### Task 13: Verify scaffold integrity

Run `/SDLC-status` to verify the scaffold is working correctly.

**Step 1: Run status check**

Invoke `/SDLC-status` in Claude Code.

**Step 2: Verify output**

Expected: artifact counts per phase, task progress, gate readiness. No errors about missing files or broken links.

**Step 3: Fix any issues found**

If `/SDLC-status` reports problems, fix them before marking this task complete.

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve scaffold integrity issues found by SDLC-status"
```
