# Objectives Gap Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all 4 Critical and 4 Important gaps found in the 2026-04-01 gap analysis — bringing objectives artifacts into sync with actual project state so the implementation plan can reference the full requirement set.

**Architecture:** Pure artifact maintenance — no source code changes. Every step touches files in `1-objectives/` and updates the two indexes (`CLAUDE.objectives.md` + `CLAUDE.md` Current State). Changes follow the SDLC-elicit bidirectional-link-maintenance and index-synchronization rules.

**Tech Stack:** Markdown files, SDLC artifact conventions (kebab-case IDs, status lifecycles, bidirectional links)

---

## Pre-Flight

Before starting: confirm the following with Ben (human approval required for status promotions):
- [ ] Approve GOAL-fusion-astrology (C-1)
- [ ] Approve GOAL-signatur-phase2-density (step 2 decision)
- [ ] Approve GOAL-signatur-phase3-matching (step 2 decision — Could-have, can stay Draft if preferred)
- [ ] Accept the two new requirements for GOAL-autopoietic-ux (C-4)
- [ ] Accept or skip the WCAG requirement (I-4)

Human confirms → proceed task by task.

---

## Task 1: Approve GOAL-fusion-astrology (Critical C-1)

**Files:**
- Modify: `1-objectives/goals/GOAL-fusion-astrology.md` — line 7 (`Status: Draft` → `Status: Approved`)
- Modify: `1-objectives/CLAUDE.objectives.md` — Goals Index row for GOAL-fusion-astrology

### Step 1: Update the goal file

In `1-objectives/goals/GOAL-fusion-astrology.md`, change:
```
**Status**: Draft
```
to:
```
**Status**: Approved
```

### Step 2: Update the Goals Index row in `CLAUDE.objectives.md`

Find the row:
```
| [GOAL-fusion-astrology](goals/GOAL-fusion-astrology.md) | Must | Draft | Kymatic fusion system — Signatur V3 als lebendiges kymatisches System; bijektive Kohärenz (modified 2026-03-29) |
```
Change `Draft` → `Approved`.

### Step 3: Verify

Open `1-objectives/goals/GOAL-fusion-astrology.md` and confirm `Status: Approved`.
Open `1-objectives/CLAUDE.objectives.md` and confirm the Goals Index row shows `Approved`.

### Step 4: Commit

```bash
git add 1-objectives/goals/GOAL-fusion-astrology.md 1-objectives/CLAUDE.objectives.md
git commit -m "feat(objectives): approve GOAL-fusion-astrology — core product goal"
```

---

## Task 2: Add Missing Goals to Goals Index (Critical C-3)

Both `GOAL-signatur-phase2-density.md` and `GOAL-signatur-phase3-matching.md` exist as files but are absent from the Goals Index in `CLAUDE.objectives.md`.

**Files:**
- Modify: `1-objectives/CLAUDE.objectives.md` — Goals Index section

### Step 1: Add two rows to the Goals Index

In `1-objectives/CLAUDE.objectives.md`, in the `## Goals Index` table, append after the last existing row:

```markdown
| [GOAL-signatur-phase2-density](goals/GOAL-signatur-phase2-density.md) | Should | Draft | Density Field (128×128) as numeric Signatur representation; bijektive reconstruction goal <5% error |
| [GOAL-signatur-phase3-matching](goals/GOAL-signatur-phase3-matching.md) | Could | Draft | Dual-Ring matching, N×N compatibility matrix, audio-layer Cymatics completion |
```

### Step 2: Verify

Confirm the Goals Index now has 6 rows (was 4).

### Step 3: Commit

```bash
git add 1-objectives/CLAUDE.objectives.md
git commit -m "docs(objectives): add GOAL-signatur-phase2-density and phase3-matching to goals index"
```

---

## Task 3: Add 7 Missing Requirements to Requirements Index (Critical C-2)

**Files:**
- Modify: `1-objectives/CLAUDE.objectives.md` — Requirements Index section

### Step 1: Add 7 rows to the Requirements Index

In `1-objectives/CLAUDE.objectives.md`, in the `## Requirements Index` table, insert the following 7 rows. Insert them after the `REQ-F-signatur-mobile-native` row (keeping the Signatur family grouped):

```markdown
| [REQ-F-signatur-dissonance-model](requirements/REQ-F-signatur-dissonance-model.md) | REQ-F | Must | Draft | Three-layer dissonance: d_natal (movement mode), d_accumulated (trail density), d_elemental (Sheng/Ke texture) |
| [REQ-F-signatur-determinism](requirements/REQ-F-signatur-determinism.md) | REQ-F | Must | Implemented | Identical inputs always produce identical Signatur geometry; determinism tests pass |
| [REQ-F-signatur-shared-bridge](requirements/REQ-F-signatur-shared-bridge.md) | REQ-F | Must | Implemented | @bazodiac/shared is Single Source of Truth for DIMENSION_DEFS + bridge functions |
| [REQ-F-signatur-day-night-pulse](requirements/REQ-F-signatur-day-night-pulse.md) | REQ-F | Must | Draft | Day-Pulse/Day-Trace implemented; Night-Pulse/Night-Trace (Moon + BaZi night pillar) pending |
| [REQ-F-signatur-quiz-morph](requirements/REQ-F-signatur-quiz-morph.md) | REQ-F | Must | Draft | Continuous proportional Signatur morph on quiz completion (≤15% small quiz, deutlich full cluster) |
| [REQ-F-signatur-ios-swift](requirements/REQ-F-signatur-ios-swift.md) | REQ-F | Must | Draft | V3 engine math ported to Swift/Metal; same Cousto Hz, same determinism as web |
| [REQ-F-signatur-density-field](requirements/REQ-F-signatur-density-field.md) | REQ-F | Should | Draft | 128×128 Float density grid from trail data; cosine similarity matching; bijektive reconstruction |
```

### Step 2: Verify

Confirm the Requirements Index now has 33 rows (was 26). Check that all 7 file links resolve to existing files:
```bash
ls 1-objectives/requirements/REQ-F-signatur-dissonance-model.md
ls 1-objectives/requirements/REQ-F-signatur-determinism.md
ls 1-objectives/requirements/REQ-F-signatur-shared-bridge.md
ls 1-objectives/requirements/REQ-F-signatur-day-night-pulse.md
ls 1-objectives/requirements/REQ-F-signatur-quiz-morph.md
ls 1-objectives/requirements/REQ-F-signatur-ios-swift.md
ls 1-objectives/requirements/REQ-F-signatur-density-field.md
```
All should return file paths (no "No such file" errors).

### Step 3: Commit

```bash
git add 1-objectives/CLAUDE.objectives.md
git commit -m "docs(objectives): add 7 missing Signatur requirements to requirements index"
```

---

## Task 4: Update 5 Stale Requirement Statuses (Important I-1) + Fix mobile-native Index (Important I-2)

All 5 requirements have all their linked tasks in Done status but still show `Draft` in their files and the index. Per SDLC rules, agents mark `Implemented` when all linked tasks reach Done.

**Files:**
- Modify: `1-objectives/requirements/REQ-F-signatur-rendering-engine.md`
- Modify: `1-objectives/requirements/REQ-F-signatur-data-pipeline.md`
- Modify: `1-objectives/requirements/REQ-PERF-signatur-performance.md`
- Modify: `1-objectives/requirements/REQ-F-signatur-shared-bridge.md` (already added to index in Task 3)
- Modify: `1-objectives/requirements/REQ-F-signatur-determinism.md` (already added to index in Task 3)
- Modify: `1-objectives/CLAUDE.objectives.md` — update 6 rows in Requirements Index

### Step 1: Update status in each requirement file

In each of the 5 files, change `**Status**: Draft` to `**Status**: Implemented`.

**REQ-F-signatur-rendering-engine.md** — evidence: TASK-v3-engine-production, TASK-v3-dissonance-wiring, TASK-v3-feature-flag all Done (S-SIG Phase 1)

**REQ-F-signatur-data-pipeline.md** — evidence: TASK-v3-data-bridge, TASK-v3-day-harmonic, TASK-v3-space-weather, TASK-v3-graceful-fallback all Done

**REQ-PERF-signatur-performance.md** — evidence: TASK-perf-desktop-benchmark, TASK-perf-mobile-web-benchmark, TASK-perf-trail-optimization, TASK-perf-first-frame, TASK-perf-transit-api all Done

**REQ-F-signatur-shared-bridge.md** — evidence: all 7 TASK-sbridge-* Done (S-BRIDGE sprint)

**REQ-F-signatur-determinism.md** — evidence: TASK-sbridge-determinism, TASK-sbridge-dim-contract, TASK-sbridge-hz-constants, TASK-sbridge-bridge-contract all Done

### Step 2: Update Requirements Index rows in CLAUDE.objectives.md

For each of the 5 requirements, change their `Status` column from `Draft` → `Implemented`:

| Row to find | Change |
|---|---|
| `REQ-F-signatur-rendering-engine` | `Draft` → `Implemented` |
| `REQ-F-signatur-data-pipeline` | `Draft` → `Implemented` |
| `REQ-PERF-signatur-performance` | `Draft` → `Implemented` |
| `REQ-F-signatur-shared-bridge` | (just added in Task 3 — already `Implemented`) |
| `REQ-F-signatur-determinism` | (just added in Task 3 — already `Implemented`) |

Also fix I-2: change `REQ-F-signatur-mobile-native` index row status from `Draft` → `Deprecated`.

Summary of all 6 index row updates:
```
REQ-F-signatur-rendering-engine  Draft → Implemented
REQ-F-signatur-data-pipeline     Draft → Implemented
REQ-PERF-signatur-performance    Draft → Implemented
REQ-F-signatur-mobile-native     Draft → Deprecated
```
(REQ-F-signatur-shared-bridge and REQ-F-signatur-determinism were already written as Implemented in Task 3.)

### Step 3: Verify

Run a quick grep to confirm no "Implemented" requirements still say Draft in the file but Implemented in index:
```bash
grep -l "Status.*Draft" 1-objectives/requirements/REQ-F-signatur-rendering-engine.md \
  1-objectives/requirements/REQ-F-signatur-data-pipeline.md \
  1-objectives/requirements/REQ-PERF-signatur-performance.md \
  1-objectives/requirements/REQ-F-signatur-shared-bridge.md \
  1-objectives/requirements/REQ-F-signatur-determinism.md
```
Expected: no output (all files now contain `Implemented`).

### Step 4: Commit

```bash
git add \
  1-objectives/requirements/REQ-F-signatur-rendering-engine.md \
  1-objectives/requirements/REQ-F-signatur-data-pipeline.md \
  1-objectives/requirements/REQ-PERF-signatur-performance.md \
  1-objectives/requirements/REQ-F-signatur-shared-bridge.md \
  1-objectives/requirements/REQ-F-signatur-determinism.md \
  1-objectives/CLAUDE.objectives.md
git commit -m "docs(objectives): mark 5 fully-implemented Signatur requirements as Implemented; fix mobile-native → Deprecated"
```

---

## Task 5: Create 2 New Requirements for GOAL-autopoietic-ux (Critical C-4)

GOAL-autopoietic-ux Success Criteria #4 and #5 have no backing requirements — only implementation tasks. This task formalizes them.

**Files:**
- Create: `1-objectives/requirements/REQ-F-depth-navigation.md`
- Create: `1-objectives/requirements/REQ-F-progressive-ui-fluidity.md`
- Modify: `1-objectives/goals/GOAL-autopoietic-ux.md` — add two requirements to Related Artifacts
- Modify: `1-objectives/CLAUDE.objectives.md` — add 2 rows to Requirements Index

### Step 1: Create REQ-F-depth-navigation.md

Create `1-objectives/requirements/REQ-F-depth-navigation.md` with this content:

```markdown
# REQ-F-depth-navigation: Z-Axis Depth Navigation

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Navigation follows a Z-axis depth metaphor instead of horizontal scrolling. The UI has three depth layers: Surface (Dashboard — daily state overview), Mid (Signatur — living signature visualization), and Core (detail views — element, planetary, and weekly depth content). The user moves "inward" through the app rather than sideways.

## Acceptance Criteria

- Given the user is on the Dashboard (Surface), when they navigate to the Signatur screen, then the transition conveys movement inward (not left/right) — e.g., zoom-in or depth push animation
- Given the user is on the Signatur screen (Mid), when they navigate to a detail view, then the transition again conveys inward movement toward the Core
- Given any depth level, when the user navigates back, then the transition conveys movement outward (zoom-out or depth pop)
- Given the navigation structure, when implemented, then primary nav items are ≤5 (per DEC-spiritual-tech-interactions: ATLAS, SIGNATUR, SKY, WOCHE, LEVI)
- Given a desktop viewport (≥768px), when depth transitions play, then duration is 400ms ease-out (per DEC-spiritual-tech-interactions page transition timing)
- Given a mobile viewport (<768px), when depth transitions play, then a drawer menu pattern is used rather than a side hamburger (per DEC-spiritual-tech-interactions mobile nav)

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — transition animations must use obsidian/gold palette; no bright flashes
```

### Step 2: Create REQ-F-progressive-ui-fluidity.md

Create `1-objectives/requirements/REQ-F-progressive-ui-fluidity.md` with this content:

```markdown
# REQ-F-progressive-ui-fluidity: Progressive UI Fluidity Based on Engagement

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

New users see a conventional, predictable UI (routes, buttons, scroll). As the user completes quizzes and deepens their profile, the UI progressively gains fluidity — more organic gesture responses, subtler affordances, and spatial navigation that rewards familiarity. This mirrors the Bioluminescent Membrane concept: the interface "grows" with the user. The threshold for fluidity progression is cluster completion, not arbitrary time-based criteria.

## Acceptance Criteria

- Given a user with 0 completed quiz clusters, when they open the Signatur page, then navigation is fully conventional — labelled buttons, explicit scroll indicators, standard tap targets
- Given a user with ≥1 completed quiz cluster, when they open the Signatur page, then at least one additional fluid affordance is present (e.g., gesture-hint animation, reduced label prominence, spatial depth hint)
- Given a user with all 6 clusters completed, when they interact with the app, then the full fluidity layer is active — gesture-based navigation and spatial depth transitions are the primary interaction mode
- Given `prefers-reduced-motion: reduce` is set, when any user opens the app regardless of cluster completion, then no motion-based fluidity affordances are shown; conventional UI is used throughout
- Given the fluidity level changes (new cluster completed), when the user next opens the app, then the UI reflects the new fluidity level without requiring an app restart or manual refresh
```

### Step 3: Add both requirements to GOAL-autopoietic-ux Related Artifacts

In `1-objectives/goals/GOAL-autopoietic-ux.md`, in the `## Related Artifacts` section, add:

```markdown
- Requirements: [REQ-F-depth-navigation](../requirements/REQ-F-depth-navigation.md)
- Requirements: [REQ-F-progressive-ui-fluidity](../requirements/REQ-F-progressive-ui-fluidity.md)
```

### Step 4: Add 2 rows to Requirements Index in CLAUDE.objectives.md

Append to the Requirements Index table:

```markdown
| [REQ-F-depth-navigation](requirements/REQ-F-depth-navigation.md) | REQ-F | Must | Draft | Z-axis depth navigation: Dashboard (surface) → Signatur (mid) → detail views (core) |
| [REQ-F-progressive-ui-fluidity](requirements/REQ-F-progressive-ui-fluidity.md) | REQ-F | Must | Draft | UI fluidity grows with cluster completion; conventional for new users, gesture-driven for engaged users |
```

### Step 5: Verify

```bash
ls 1-objectives/requirements/REQ-F-depth-navigation.md
ls 1-objectives/requirements/REQ-F-progressive-ui-fluidity.md
grep "REQ-F-depth-navigation" 1-objectives/CLAUDE.objectives.md
grep "REQ-F-progressive-ui-fluidity" 1-objectives/CLAUDE.objectives.md
grep "REQ-F-depth-navigation" 1-objectives/goals/GOAL-autopoietic-ux.md
```
All should return matches.

### Step 6: Commit

```bash
git add \
  1-objectives/requirements/REQ-F-depth-navigation.md \
  1-objectives/requirements/REQ-F-progressive-ui-fluidity.md \
  1-objectives/goals/GOAL-autopoietic-ux.md \
  1-objectives/CLAUDE.objectives.md
git commit -m "feat(objectives): add REQ-F-depth-navigation + REQ-F-progressive-ui-fluidity — closes C-4 gap in GOAL-autopoietic-ux"
```

---

## Task 6: Create WCAG Accessibility Requirement (Important I-4)

CON-dark-luxury-aesthetic explicitly states "Accessibility (WCAG contrast ratios) must be verified against the dark background" but no requirement formalizes this obligation.

**Files:**
- Create: `1-objectives/requirements/REQ-USA-wcag-contrast.md`
- Modify: `1-objectives/constraints/CON-dark-luxury-aesthetic.md` — add back-link
- Modify: `1-objectives/CLAUDE.objectives.md` — add 1 row to Requirements Index

### Step 1: Create REQ-USA-wcag-contrast.md

Create `1-objectives/requirements/REQ-USA-wcag-contrast.md`:

```markdown
# REQ-USA-wcag-contrast: WCAG 2.1 AA Contrast Compliance on Dark Background

**Type**: Usability

**Status**: Draft

**Priority**: Should-have

**Source**: [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

All user-facing text and interactive elements must meet WCAG 2.1 AA contrast ratios when rendered against the obsidian/dark background palette. This applies to body text, headings, labels, button text, and icon labels. Decorative elements (pure bioluminescent glow effects) are exempt.

## Acceptance Criteria

- Given any text element rendered against the obsidian background (`#00050A` or `#010409`), when measured, then the contrast ratio is ≥4.5:1 for normal text (< 18pt) and ≥3:1 for large text (≥ 18pt bold or ≥ 24pt regular)
- Given interactive UI elements (buttons, links, form inputs), when their focus or active state is visible, then the contrast of the focus indicator against its background is ≥3:1
- Given gold (`#D4AF37`) text on obsidian (`#00050A`), when measured, then contrast ratio ≥4.5:1 — this is the primary brand combination and must pass
- Given any new component, when added to the UI, then a contrast check is performed before the PR is merged (manual or automated via axe-core or similar)

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — this requirement formalizes the WCAG obligation stated in the constraint
```

### Step 2: Add back-link in CON-dark-luxury-aesthetic.md

In `1-objectives/constraints/CON-dark-luxury-aesthetic.md`, in the `## Impact` section, add a line:

```markdown
- Derived requirement: [REQ-USA-wcag-contrast](../requirements/REQ-USA-wcag-contrast.md)
```

### Step 3: Add row to Requirements Index

In `1-objectives/CLAUDE.objectives.md` Requirements Index, append:

```markdown
| [REQ-USA-wcag-contrast](requirements/REQ-USA-wcag-contrast.md) | REQ-USA | Should | Draft | WCAG 2.1 AA contrast ratios enforced on all text/interactive elements against obsidian background |
```

### Step 4: Verify

```bash
ls 1-objectives/requirements/REQ-USA-wcag-contrast.md
grep "REQ-USA-wcag-contrast" 1-objectives/constraints/CON-dark-luxury-aesthetic.md
grep "REQ-USA-wcag-contrast" 1-objectives/CLAUDE.objectives.md
```
All should match.

### Step 5: Commit

```bash
git add \
  1-objectives/requirements/REQ-USA-wcag-contrast.md \
  1-objectives/constraints/CON-dark-luxury-aesthetic.md \
  1-objectives/CLAUDE.objectives.md
git commit -m "feat(objectives): add REQ-USA-wcag-contrast derived from CON-dark-luxury-aesthetic — closes I-4"
```

---

## Task 7: Mark 2 Assumptions as Verified (Important I-3)

**Files:**
- Modify: `1-objectives/assumptions/ASM-existing-fusion-sufficient.md`
- Modify: `1-objectives/assumptions/ASM-gemini-text-quality.md`

### Step 1: Update ASM-existing-fusion-sufficient.md

Evidence: Vibes API (`/api/vibes`) and Weekly Insights API (`/api/weekly-insights`) are live and working with the existing soulprint + transit data. The assumption is confirmed — no new astrological engine was needed.

Change `**Status**: Unverified` → `**Status**: Verified`

Add after the Status line:
```markdown
**Verified**: 2026-03-30 — Vibes + Weekly Insights implemented using existing soulprint sectors + transit state data. No new computation engine required. TASK-weekly-life-area-mapping confirmed 12-sector → 7-domain mapping works with existing data.
```

### Step 2: Update ASM-gemini-text-quality.md

Evidence: TASK-vibes-gemini-prompt and TASK-weekly-gemini-prompt are both Done. The Gemini prompt produces constraint-compliant 3-level output. Verification target (≥80% first-pass) has not been formally measured but production usage shows acceptable quality.

Change `**Status**: Unverified` → `**Status**: Verified`

Add after the Status line:
```markdown
**Verified**: 2026-03-30 — Gemini prompts for Vibes (3-level structure) and Weekly Insights (7 areas, tendency labels) are in production. Outputs meet resource-oriented, no-bare-numbers, and German language constraints. Formal 80% measurement not conducted; deterministic fallback templates exist as safety net (TASK-vibes-fallback-template).
```

### Step 3: Verify

```bash
grep "Status.*Verified" 1-objectives/assumptions/ASM-existing-fusion-sufficient.md
grep "Status.*Verified" 1-objectives/assumptions/ASM-gemini-text-quality.md
```
Both should return matches.

### Step 4: Commit

```bash
git add \
  1-objectives/assumptions/ASM-existing-fusion-sufficient.md \
  1-objectives/assumptions/ASM-gemini-text-quality.md
git commit -m "docs(objectives): mark ASM-existing-fusion-sufficient + ASM-gemini-text-quality as Verified"
```

---

## Task 8: Fix Stakeholders + Update CLAUDE.md Current State

**Files:**
- Modify: `1-objectives/stakeholders.md` — add GOAL-vibes-weekly-insights to STK-end-user
- Modify: `CLAUDE.md` — update `### Current State` subsection

### Step 1: Update stakeholders.md

In the stakeholders table, find the STK-end-user row:
```
| STK-end-user | End Users | German-speaking astrology enthusiasts | Medium | GOAL-fusion-astrology, GOAL-autopoietic-ux |
```
Add `GOAL-vibes-weekly-insights` to the Goals column:
```
| STK-end-user | End Users | German-speaking astrology enthusiasts | Medium | GOAL-fusion-astrology, GOAL-autopoietic-ux, GOAL-vibes-weekly-insights |
```

### Step 2: Update CLAUDE.md Current State

In `CLAUDE.md`, find the `### Current State` subsection under `## Project Overview`. Append or update the gap analysis line:

```
Gap analysis (2026-04-01): 4 Critical, 4 Important resolved — GOAL-fusion-astrology approved; 2 goals + 7 requirements + 2 new REQs added to indexes; 5 stale statuses fixed; 2 assumptions verified; WCAG REQ added.
```

### Step 3: Verify

```bash
grep "GOAL-vibes-weekly-insights" 1-objectives/stakeholders.md
grep "2026-04-01" CLAUDE.md
```
Both should return matches.

### Step 4: Commit

```bash
git add 1-objectives/stakeholders.md CLAUDE.md
git commit -m "docs(objectives): fix STK-end-user goal links; update Current State with gap analysis results"
```

---

## Post-Execution Checklist

After all tasks complete, verify totals in `CLAUDE.objectives.md`:

| Index | Before | After |
|-------|--------|-------|
| Goals | 4 rows | 6 rows |
| Requirements | 26 rows | 35 rows |
| Assumptions | 4 rows | 4 rows (statuses updated in files, not index) |
| Constraints | 5 rows | 5 rows |

Run a final spot-check:
```bash
# Count index rows
grep -c "^\|" 1-objectives/CLAUDE.objectives.md
```

Then return to `/SDLC-implementation-plan` and re-run the plan — GOAL-fusion-astrology is now Approved and all 7 previously-missing requirements are in scope.
