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

**Phase: Code — in progress (2026-05-14).** Design phase completed 2026-05-13 (architecture / data-model / api-design drafted; 6 components decomposed; 59-task implementation plan populated). Spec gate cleared 2026-05-07. Mid-Design REQ-SEC elicitation (2026-05-13) added 9 Approved security requirements, closing the previously-known REQ-SEC gap. Mid-Code transition (2026-05-14) recorded [DEC-codebase-lives-in-sibling-prod-dir](decisions/DEC-codebase-lives-in-sibling-prod-dir.md) formalizing this SDLC scaffold as a documentation/governance overlay on the existing `Astro-Noctum-prod/` codebase.

**Specification artifacts (post-elicitation):** Stakeholders 3; Goals 6 (all Approved); Requirements **39 total — 28 Approved (19 prior + 9 new REQ-SEC), 11 Should-have Draft**; Assumptions 5 (Unverified); Constraints 7 (Active). Requirement class distribution now includes 9 REQ-SEC (previously 0).

**Constraints (2026-05-14 update):** 7 total — 6 Active, 1 Deprecated (CON-aphorisms-human-approved, superseded by DEC-aphorism-batch-approval-bp-2026-05-14).

**Design documents:**
- `architecture.md` — **drafted (2026-05-13)**, updated same day. Brownfield map with 3 Frozen subsystems, 8 Active subsystems, 3 Cross-cutting concerns. System context + dashboard-mount + upgrade-funnel sequence diagrams. Constraint, assumption, and requirement coverage tables (all 28 Approved + 11 Draft mapped to owning subsystem).
- `data-model.md` — **drafted (2026-05-13)**. 11 entities (operational / reference / compliance-state), ER diagram, RTBF cascade specification, deletion-job state machine, analytics event schemas, 8 cross-entity invariants. §6 conceptually resolves gap I-1 by modelling premium as a state (`subscription_state.tier`), not a separate stakeholder.
- `api-design.md` — **drafted (2026-05-13)**. 13 endpoints (3 frozen + 10 active): `/api/checkout`, `/api/stripe/webhook`, `/api/impact/active`, `/v1/users/:userId/daily-pulse`, `.../daily-interpretation`, `.../consents` (read/create/revoke), `.../data-export`, `.../rtbf` (request/confirm/cancel), `.../subscription-state`, `/api/stripe/portal-session`. Auth, error envelope, rate-limit table, CSRF / origin policy, webhook idempotency, versioning strategy.

**Decisions:** 4 recorded (most recent 2026-05-14) — `DEC-supabase-as-personal-data-store`, `DEC-llm-provider-gemini`, `DEC-rtbf-grace-window-24h`, `DEC-aphorism-batch-approval-bp-2026-05-14`. All Active. Indexed in spec, design, and deploy phase indexes. Resolves the high-impact portion of DI-1 from the 2026-05-13 design completeness assessment; the deferred decisions (`DEC-rate-limit-store`, `DEC-auth-session-storage`) remain to be recorded during Code/Deploy phase when the implementation choice is concrete.

**Gap analysis (2026-05-13, fresh):** 0 Critical, 2 Important, 5 Minor. Spec → Design gate remains ✅ (no Critical findings). Important: **I-1** STK-user-premium without direct goal source-link — **conceptually resolved by `data-model.md` §6** (premium = state, not stakeholder); formal Spec-side closure (e.g., updating STK-user-premium description) optional, not blocking. **I-2** ASM-supabase-fits-personal-data-scale (High risk) still Unverified — drives entire CC-1 GDPR layer; verify Supabase EU residency, DPA suitability, RTBF cascade timing before Code phase. Minor: M-1 no REQ-PORT; M-2 no REQ-SCA; M-3 no user stories (deliberate); M-4 no top-level security/trust goal anchoring 9 REQ-SEC (stylistic); M-5 11 Should-have requirements still Draft.

**Design completeness assessment (2026-05-13, fresh):** 0 Critical, 2 Important, 3 Minor. All 28 Approved requirements covered across the three design documents; all 7 constraints addressed; all 11 Draft requirements assigned. **Design → Code gate posture:** architecture ✅ / data-model ✅ / api-design ✅ / no Critical findings ✅ / components identified ✅ (6 components, 2026-05-13). Important findings: **DI-1** No `DEC-*` records — partially resolved (3 of ≥5 recorded 2026-05-13: Supabase, LLM provider, RTBF grace window). Remaining: `DEC-rate-limit-store` and `DEC-auth-session-storage`, deferred to Code/Deploy phase when implementation choice is concrete. **DI-2** Carryover from Spec analysis: ASM-supabase-fits-personal-data-scale (High risk) Unverified. Minor: DM-1 email-delivery service for RTBF confirmation not specified (deploy concern); DM-2 operator/admin endpoints (RTBF retry, aphorism status changes) deliberately out of scope; DM-3 11 Should-have requirements still Draft (carryover).

**Components identified (2026-05-13):** 6 components decomposed into `3-code/` per `docs/plans/2026-05-13-component-decomposition.md`. `shared-types` (TypeScript types-only package), `web-frontend` (React SPA), `web-server` (Node `/api/*` routes), `edge-functions` (Supabase Edge Functions for `/v1/*` HTTP + scheduled jobs), `database` (Supabase Postgres schema), `tagespuls-package` (Python + TypeScript aphorism content + build pipeline). Each component has a `CLAUDE.component.md` describing responsibility, interfaces, requirement coverage, and relevant decisions.

**Aphorism corpus (2026-05-14 — F6 batch):** Expanded to 54 review files / 33 approved entries (was 21 / 0) via plan `docs/plans/2026-05-14-aphorism-batch-extension-aph-0089-0121.md`. New batch IDs: aph-0089..aph-0121 (contiguous). Prod commits land on feature branch `feature/aphorism-batch-aph-0089-0121`. The 21 existing review files remain `status: draft`. Mode coverage of the approved pool: 19 `pulse`, 14 `spannung`, 0 `trace` — `trace`-mode daily-pulse rendering needs additional content before that surface can ship.

**Implementation plan (2026-05-14):** `3-code/tasks.md` populated with **59 tasks across 13 phases (P0–P12)**, each phase ending with a deployable/testable system. Coverage: all 28 Approved + 11 Draft requirements have at least one implementing task; all 6 Active constraints respected; all 5 Active decisions enforced or referenced. Critical-path phases: P0 (baseline + shared-types + Python build verify) → P2 (database foundation) → P3/P9 (security + GDPR endpoints) → P8 (Tagespuls Neu) → P10/P11 (premium + schedulers) → P12 (pre-launch verification incl. ASM-supabase verification closing I-2). Known content blocker: `trace`-mode aphorisms still 0-approved, surface remains effectively gated in P8-TASK-8-8 until corpus expansion.

**Implementation progress (2026-05-14):** 1 of 59 tasks Done — **TASK-0-1** (baseline checks: tsc / build / test all pass, 2 pre-existing observations recorded in `docs/baseline-checks-2026-05-14.md`). Currently in Phase 0; next task TASK-0-2 (shared-types workspace package skeleton).

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
