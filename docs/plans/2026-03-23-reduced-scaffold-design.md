# Reduced SDLC Scaffold for Bazodiac-WebApp

**Date:** 2026-03-23
**Status:** Approved
**Approach:** Scaffold-Overlay (full 4-phase model, streamlined)

## Problem Statement

Three issues with current development process:

1. **Decision drift** — Architecture/design decisions are made but not systematically recorded; agents undermine them later
2. **No traceability** — Features arise ad-hoc without a traceable chain (Goal -> Requirement -> Task -> Code)
3. **Agent context overload** — Too many unstructured docs; agents don't know what currently applies

## Tooling Roles

| Tool | Role |
|------|------|
| **Scaffold (in-repo)** | Source of truth for goals, requirements, decisions, tasks, architecture |
| **Miro** ([Board](https://miro.com/app/board/uXjVGuainfM=/)) | Brainstorming and ideation only — not a source of truth |
| **GitHub Issues** | Bug reports and CI failures |
| **GitHub PRs** | Code review |

Rules:
- Miro ideas become "real" only when formalized as a scaffold artifact
- `tasks.md` is the sole task source — replaces TASKS.md and BACKLOG.md
- Agents never read Miro — they work only with repo artifacts

## Directory Structure

```
Bazodiac-WebApp/
├── Astro-Noctum/              # existing monorepo (src/, apps/, server/)
│   └── CLAUDE.md              # EXISTING — stays as code-level instructions
│
├── 1-objectives/              # NEW
│   ├── CLAUDE.objectives.md
│   ├── goals/                 # GOAL-*.md
│   ├── requirements/          # REQ-F-*.md, REQ-PERF-*.md, etc.
│   ├── assumptions/           # ASM-*.md
│   └── constraints/           # CON-*.md
│
├── 2-design/                  # NEW
│   ├── CLAUDE.design.md
│   ├── architecture.md        # consolidated from QWEN.md, ARCHITECTURE_EXPERIENCE.md
│   ├── data-model.md          # Supabase schema documentation
│   ├── api-design.md          # Express + external API endpoints
│   └── decisions/             # DEC-*.md + DEC-*.history.md
│
├── 3-code/                    # NEW
│   ├── CLAUDE.code.md
│   ├── tasks.md               # replaces TASKS.md + BACKLOG.md
│   ├── frontend/              # CLAUDE.frontend.md only (code lives in Astro-Noctum/src/)
│   ├── api-server/            # CLAUDE.api-server.md only (code lives in Astro-Noctum/server/)
│   └── mobile/                # CLAUDE.mobile.md only (code lives in Astro-Noctum/apps/mobile/)
│
├── 4-deploy/                  # NEW
│   ├── CLAUDE.deploy.md
│   └── runbooks/              # Railway, VPS, Expo deployment procedures
│
├── CLAUDE.md                  # NEW — root scaffold instructions
└── archive/                   # migrated legacy docs
```

Key deviation from standard scaffold: `3-code/<component>/` directories contain only `CLAUDE.<component>.md` files (decisions index, requirements references) — no code. They are a steering layer, not code containers.

## CLAUDE.md Hierarchy

```
Bazodiac-WebApp/CLAUDE.md              <- NEW root: scaffold rules, project overview
|
+-- 1-objectives/CLAUDE.objectives.md  <- phase instructions
+-- 2-design/CLAUDE.design.md          <- phase instructions + decisions index
+-- 3-code/CLAUDE.code.md              <- phase instructions + component list
|   +-- frontend/CLAUDE.frontend.md    <- points to Astro-Noctum/src/
|   +-- api-server/CLAUDE.api-server.md
|   +-- mobile/CLAUDE.mobile.md
+-- 4-deploy/CLAUDE.deploy.md
|
+-- Astro-Noctum/CLAUDE.md             <- EXISTING: code conventions, dev commands
```

Agent behavior:
- Working in Astro-Noctum/ -> reads existing CLAUDE.md as before
- Planning features or making decisions -> reads root CLAUDE.md + phase files
- Decisions are indexed into component CLAUDE.md files so code-writing agents see relevant decisions

## Migration Plan

### One-time migration from existing docs

| Source | Target | Action |
|--------|--------|--------|
| TRUE_NORTH.md, GOAL.md | 1-objectives/goals/GOAL-*.md | Extract top-level goals |
| Specified features (Miro, Dev Briefs) | 1-objectives/requirements/REQ-F-*.md | Derive functional requirements |
| Implicit architecture decisions | 2-design/decisions/DEC-*.md | e.g. DEC-supabase-backend, DEC-swiss-ephemeris, DEC-wuxing-ui-mapping |
| QWEN.md, ARCHITECTURE_EXPERIENCE.md | 2-design/architecture.md | Consolidate |
| Supabase schema docs | 2-design/data-model.md | Schema + RLS policies |
| API_EXPERIENCE.md | 2-design/api-design.md | Consolidate endpoints |
| TASKS.md, BACKLOG.md | 3-code/tasks.md | Open tasks only |
| BACKLOG_ARCHETYPES.md | Evaluate, then archive or convert to requirements | |

### Stays in place (no migration)

- BRANDVOICE.md, QUIZ_MAPPING_MARKERS.md — code references, not scaffold artifacts
- CHANGELOG.md, BUGS.md — operational files
- docs/plans/ (in Astro-Noctum) — existing plan files remain
- .claude/commands/ — all 10 existing commands stay, complement SDLC skills

### Archived after migration

- TRUE_NORTH.md, GOAL.md, QWEN.md, ARCHITECTURE_EXPERIENCE.md, API_EXPERIENCE.md
- TASKS.md, BACKLOG.md, BACKLOG_ARCHETYPES.md
- DEV_BRIEF_*.md (already completed)
- AGENTS.md, AGENTS-PROTOCOL.md, CLAWTEAM-PROTOCOL.md, METACLAW-FRAMEWORK.md (relevant rules absorbed into CLAUDE.md hierarchy)

## Streamlining vs. Standard Scaffold

### Removed

| Element | Reason |
|---------|--------|
| User Stories (US-*) | Overhead — requirements cover this; features already specified |
| Stakeholders (stakeholders.md) | Small team, clear who is involved |
| /SDLC-elicit interactive ceremony | One-time migration instead |
| /SDLC-init | Root CLAUDE.md written manually from existing context |

### Unchanged

- Decisions system (two files, procedures, phase indexing)
- Phase gates (advisory, not blocking)
- Graduated safeguards (Always ask / Precedent / Decide and record)
- /SDLC-status, /SDLC-execute-next-task, /SDLC-fix
- /SDLC-design, /SDLC-decompose, /SDLC-implementation-plan
- Kebab-case IDs, traceability links

### Adapted

| Element | Adaptation |
|---------|-----------|
| 3-code/component/ | Contains only CLAUDE.md, no code — code stays in Astro-Noctum |
| Phase gate Objectives -> Design | Simplified: at least one Goal + one Requirement Approved |
| Root CLAUDE.md | Integrates Bazodiac context + reference to Astro-Noctum/CLAUDE.md |
| Migration instead of elicitation | Goals/Requirements/Constraints generated once from existing docs |
