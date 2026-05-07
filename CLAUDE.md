## Language Policy

**All AI outputs must be in English**, regardless of the language used in user prompts. This applies to code, comments, documentation, configuration files, commit messages, and response text.

## Memory Policy

**Do not use Claude memory files to store project information**. All project knowledge — domain context, team structure, constraints, decisions, and any other relevant information — must be captured exclusively through the SDLC artifact system (stakeholders, constraints, assumptions, goals, requirements, decisions, etc.). This ensures all knowledge is structured, traceable, and available to every team member working on the project.

---

## Project Overview

**Name:** Astro-Noctum (web frontend of the Bazodiac product)

**What it is.** Astro-Noctum is the user-facing astrology web app for Bazodiac. It combines BaZi (Chinese four-pillar astrology), Wu-Xing (five elements), and Western astrology (transits, daily impulses, harmony index) into a personalized daily experience. The dashboard serves the user's tagesaktueller Kernwert: a Daily Pulse / Daily Chart (harmony index + active influences), a 3D natal-signature sphere driven by BaZi-to-Chladni parameters, a "Council of Six" (Rat der sechs) figure-selection moment for personalized daily interpretation, and a premium tier monetized through Stripe Checkout.

**Problem it solves.** Bridges the gap between abstract astrological frameworks (BaZi, Wu-Xing, Western transits) and actionable daily framing for the user — through aphorism-based daily pulses, deterministic personalized selection, and an inspectable 3D signature representation. Free users get a stable daily orientation flow; premium unlocks deeper interpretation surfaces.

**Active dev brief.** [`docs/dev-briefs/2026-05-07-dashboard-flow-daily-pulse.md`](docs/dev-briefs/2026-05-07-dashboard-flow-daily-pulse.md) is the current sprint's intent document. It defines the immediate goals (dashboard stability, Daily Pulse visibility, 3D-Signaturkugel anchor, Stripe CTA hygiene, GreenOps polling, Tagespuls Neu-Architektur) and is the source input for the Specification phase.

### Current State

**Phase: Specification (in progress, 2026-05-07).** Source dev brief preserved in [`docs/dev-briefs/2026-05-07-dashboard-flow-daily-pulse.md`](docs/dev-briefs/2026-05-07-dashboard-flow-daily-pulse.md). Stakeholders defined (3); Constraints drafted (7, all Active); Goals approved (6 — 4 Must-have + 2 Should-have, all Approved); Requirements drafted (30 — 15 Must-have + 15 Should-have, all Draft); Assumptions drafted (5, all Unverified — 1 High risk, 3 Medium, 1 Low). User stories deliberately skipped per user choice. Requirement class distribution: 13 Functional, 9 Usability, 6 Compliance, 2 Performance, 1 Reliability, 1 Maintainability — still 0 REQ-SEC (deferred per user, accepted as known gap). **Gap analysis (2026-05-07)**: 0 Critical, 4 Important, 8 Minor — 2 of 4 Important addressed (assumptions captured + ManageSubscription requirement added); 2 remain as accepted gaps (no REQ-SEC; STK-user-premium without direct goal source-link). _(stale — artifacts changed since)_ **Spec → Design gate**: stakeholders ✅ / approved goal ✅ / approved requirement ❌ (0 of 30 approved) / gap analysis stale (re-run before advancement, or accept residual stale state since changes only added artifacts, did not invalidate previous findings).

---

## Phase-Specific Instructions

Each phase directory contains a `CLAUDE.<phase>.md` file. When working in a phase:

1. Read the phase-specific instructions — they extend (not override) this file
2. Consult the decisions index in that phase file before starting work (for the Code phase, decisions indexes are in each component's `CLAUDE.component.md`, not in `CLAUDE.code.md`)
3. Work within the appropriate phase structure

| Phase | Directory | Focus |
|-------|-----------|-------|
| **Specification** | `1-spec/` | Define what to build and why |
| **Design** | `2-design/` | Define how to build it |
| **Code** | `3-code/` | Build it |
| **Deploy** | `4-deploy/` | Ship and operate it |

### Cross-Skill Artifact Procedures

Any modification to phase artifacts — whether performed inside a skill, during a free-prompt conversation, or as a side effect of any other task — must follow the authoritative procedures for that phase:

- **Specification artifacts** (`1-spec/`): follow the procedures in [`.claude/skills/SDLC-elicit/SKILL.md`](.claude/skills/SDLC-elicit/SKILL.md) — including traceability rules, status downgrade on modification, index synchronization, bidirectional link maintenance, and Current State tracking.
- **Design artifacts** (`2-design/`): follow the procedures in [`.claude/skills/SDLC-design/SKILL.md`](.claude/skills/SDLC-design/SKILL.md) — including downstream effect checks, decision recording triggers, requirement coverage verification, and Current State tracking.
- **Code phase task artifacts** (`3-code/tasks.md`): follow the procedures in [`.claude/skills/SDLC-implementation-plan/SKILL.md`](.claude/skills/SDLC-implementation-plan/SKILL.md) — including phased task grouping, traceability links, incremental deployability, and Current State tracking.

### Phase Gates

Before creating artifacts in the next phase, check these minimum preconditions. Gates are advisory — warn the user if not met, but proceed if they confirm.

| Transition | Preconditions |
|------------|---------------|
| Spec → Design | Stakeholders defined; at least one goal Approved; at least one requirement Approved; gap analysis recorded in Current State and fresh (not stale, no Critical gaps) |
| Design → Code | All design documents drafted (`architecture.md`, `data-model.md`, `api-design.md`); completeness assessment recorded in Current State and fresh (not stale, no Critical findings); components identified (per-component directories in `3-code/`) |

There is no gate between Code and Deploy. Deploy activities (deployments, runbooks, infrastructure setup) can happen at any time during the Code phase.

---

## Artifacts

All project knowledge is captured as structured markdown files alongside the source code. This gives AI agents the full context that human developers would normally carry in their heads or scattered across external tools, and creates a traceability chain from business goals to deployed code.

### Types and locations

| Prefix | Artifact | Location |
|--------|----------|----------|
| `GOAL` | Goals | `1-spec/goals/` |
| `US` | User Stories | `1-spec/user-stories/` |
| `REQ-CLASS` | Requirements | `1-spec/requirements/` |
| `ASM` | Assumptions | `1-spec/assumptions/` |
| `CON` | Constraints | `1-spec/constraints/` |
| `STK` | Stakeholders | `1-spec/stakeholders.md` (rows) |
| `TASK` | Tasks | `3-code/tasks.md` (rows) |
| `DEC` | Decisions | `decisions/` |

### Naming

All artifact IDs use the pattern `PREFIX-kebab-name` — a type prefix followed by a descriptive kebab-case name. The descriptive name **is** the unique identifier (e.g., `DEC-use-postgres`, `REQ-F-search-by-name`). There are no numeric sequences, to avoid ID collisions when working on parallel branches.

### Phase indexes

Every `CLAUDE.<phase>.md` file contains index tables listing the artifacts in that phase. Each index must include a **File column** with a relative link to the artifact file, so that AI agents can discover the file name and human reviewers can navigate easily.

---

## Graduated Safeguards

AI agents operate autonomously within development tasks. For project-level decisions, the scaffold defines three tiers:

| Tier | When | Agent behavior |
|------|------|----------------|
| **Always ask** | Conflict resolution, design gaps, decision deprecation/supersession, phase gate advancement | Stop, present options, wait for human approval |
| **Ask first time, then follow precedent** | Naming conventions, error handling patterns, test structure | Ask once, record the decision, apply consistently afterward |
| **Decide and record** | Routine implementation choices within established patterns | Decide autonomously, record in the appropriate artifact |

When spotting a related issue, potential improvement, or ambiguous situation during a task, **surface it to the user** instead of silently deciding to act or not act.

---

## Decisions

Decisions live in `decisions/`. Each decision has two files:

- **`DEC-kebab-name.md`** — the active record (context, decision, enforcement). Read during normal task execution.
- **`DEC-kebab-name.history.md`** — the trail (alternatives, reasoning, changelog). Read only when evaluating or changing a decision.

Each `CLAUDE.<phase>.md` contains a decisions index with trigger conditions. A decision may appear in multiple phase indexes.

### How to use decisions during tasks

1. Consult the decisions index in the current phase's `CLAUDE.<phase>.md`, or in a component-specific `CLAUDE.<component>.md` when working within a specific component.
2. Follow the File column link to read the relevant `DEC-*.md` file.
3. Apply its enforcement rules.

Do **not** modify `*.history.md` except to append to the changelog.

### Recording, deprecating, or superseding decisions

When a significant decision, pattern, or constraint emerges, record it as a new decision. For the recording procedure, as well as deprecation and supersession, see [`decisions/PROCEDURES.md`](decisions/PROCEDURES.md).

---

## After Making Changes

Evaluate whether to:

1. **Update this file** if project-wide patterns or architecture change significantly.
2. **Update phase-specific files** (`CLAUDE.<phase>.md`) if phase-specific patterns or conventions are established.
3. **Create new instruction files** if a workflow becomes complex enough to need dedicated guidance.

Proactively suggest these updates when relevant.
