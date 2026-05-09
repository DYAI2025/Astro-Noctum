# Dashboard hierarchy audit (TASK-3.1)

**Date:** 2026-05-07
**Branch:** `2026-05-07-dashboard-3d-anchor`
**HEAD before audit:** `83c2cb1` (TASK-2.2 SignaturAnchorCard mounted)
**Plan reference:** `docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md` § Task 3.1
**Pre-req:** TASK-2.2 SignaturAnchorCard mounted (commit `83c2cb1`).

## Brief target

The plan defines 8 sections in a single linear hierarchy:

| # | Section | Purpose |
|---|---|---|
| 1 | DailyChartHero | "Was ist heute los" — unified volatile hero |
| 2 | SignaturAnchorCard | "Wer bin ich" — persistent identity preview |
| 3 | AgentSection | Vertiefen via voice |
| 4 | DashboardAstroSection | Big Four (PremiumGate, info-only) |
| 5 | DashboardInterpretationSection | AI-Synthese (PremiumGate) |
| 6 | DashboardTagesEnergie | Day-Pulse details |
| 7 | MagnetsturmKarte | Space weather card |
| 8 | DashboardBottomUpgradeCard | Single upgrade CTA (free only) |

## Current order (post TASK-2.2)

| # | Section | File:line | Gated by | Notes |
|---|---|---|---|---|
| 1 | DailyChartHero | `Dashboard.tsx:375` | none (loading prop) | Aligned with target #1 |
| 2 | SignaturAnchorCard | `Dashboard.tsx:399` | none | NEW (2026-05-07, TASK-2.2). Aligned with target #2 |
| 3 | AgentSection (×N grid) | `Dashboard.tsx:415` | premium gated per agent | Aligned with target #3 |
| 4 | NatalSignaturStatic → DashboardAstroSection | `Dashboard.tsx:444` | PremiumGate inside | Aligned with target #4 (wrapped in NatalSignaturStatic accordion) |
| 5 | BirthChartOrrery (Planetarium) | `Dashboard.tsx:462` | Suspense lazy-load | **Not in brief target** — present in code |
| 6 | SkyModeToggle | `Dashboard.tsx:487` | `planetariumMode` only | **Not in brief target** — present in code |
| 7 | MagnetsturmKarte | `Dashboard.tsx:493` | self-hides when Kp < 4 | Brief target #7 — **moved up by 2 vs target** |
| 8 | DashboardBottomUpgradeCard | `Dashboard.tsx:500` | free users only (internal) | Brief target #8 — aligned |
| 9 | DashboardInterpretationSection | `Dashboard.tsx:509` | PremiumGate inside | Brief target #5 — **off by 4 positions** |
| 10 | ShareCard | `Dashboard.tsx:519` | none | **Not in brief target** — present in code |
| 11 | LegalFooter | `Dashboard.tsx:526` | none | **Not in brief target** — present in code |

`DashboardTagesEnergie` is **deliberately not mounted**. It was removed in commit
`882eea8` ("fix(S-DCH-BUGFIX): 5 regression fixes + day-modal trigger rewiring",
2026-04-15) with the rationale: *"Remove duplicate DashboardTagesEnergie section
from Dashboard.tsx … Wire onOpenDayModal into DailyChartHero after TagesEnergie
removal."* The Day-Pulse content is now owned by DailyChartHero (volatile hero
via `DEC-dashboard-volatile-first`). The component file still exists at
`src/components/dashboard/DashboardTagesEnergie.tsx` and is referenced from
tests only.

## Diff against target

### Sections aligned (5 of 8)

- **DailyChartHero** (target #1, current #1) — match
- **SignaturAnchorCard** (target #2, current #2) — match
- **AgentSection** (target #3, current #3) — match
- **DashboardAstroSection** (target #4, current #4) — match (wrapped in `NatalSignaturStatic`)
- **DashboardBottomUpgradeCard** (target #8, current #8) — match (after MagnetsturmKarte)

### Sections out of order (1)

- **DashboardInterpretationSection**
  - Target position: #5 (right after DashboardAstroSection)
  - Current position: #9 (after Planetarium, SkyModeToggle, MagnetsturmKarte, DashboardBottomUpgradeCard)
  - Reordering risk: **medium-to-high**. Moving it up by 4 slots crosses:
    1. `planetariumSentinelRef` (tour overlay step anchor, line 461)
    2. `BirthChartOrrery` Suspense wrapper (line 462)
    3. `SkyModeToggle` conditional (line 486–490)
    4. `MagnetsturmKarte` (line 493)
    5. `DashboardBottomUpgradeCard` (line 500)
    6. `navHintsSentinelRef` (tour overlay step anchor, line 504)
    7. `<div id="interpretation-section" />` deep-link anchor (line 506)
  - The `interpretation-section` anchor appears to be referenced by deep links
    or scroll-to behavior; its placement currently sits immediately above the
    section. Moving the section without also moving the anchor would break it.
  - The fadeIn cadence (`0.02 → 0.08 → 0.14 → 0.20 → 0.22 → 0.26 → 0.28 → 0.30 → 0.32`)
    would need recomputation across 4 sections to keep the staggered rhythm
    smooth.

### Sections in code but not in brief target (4)

- **BirthChartOrrery (Planetarium)** — between AstroSection and Magnetsturm
- **SkyModeToggle** — between Planetarium and Magnetsturm
- **ShareCard** — bottom of page, after Interpretation
- **LegalFooter** — final element

These appear to be intentional additions not captured in the brief's
abridged target list. The brief target seems to be a "core hierarchy"
abstraction rather than an exhaustive section inventory. Without explicit
PO direction to remove/relocate these, leave in place.

### Sections in brief target but not in code (1)

- **DashboardTagesEnergie** — deliberately removed in `882eea8` (duplicate of
  DailyChartHero). The brief target list has not been updated to reflect this
  cleanup. Recommend: PO discussion to update the plan or formally retire the
  component (`archive/` move).

## Action

**🚨 Major mismatch — audit-only, defer to a dedicated hierarchy sprint.**

Reasoning:

1. The single out-of-order section (DashboardInterpretationSection) requires
   crossing two tour-overlay sentinel refs, a deep-link anchor, the entire
   Planetarium/Sky block, MagnetsturmKarte, and the Bottom Upgrade Card. This
   is **not** a mechanical JSX block-swap.
2. Four sections present in code (Planetarium, SkyModeToggle, ShareCard,
   LegalFooter) have no positions assigned in the brief. The brief target is
   incomplete relative to actual production. A reorder commit would force
   inventing target positions for these — that is a product decision, not a
   code refactor.
3. One section in the brief target (DashboardTagesEnergie) was deliberately
   retired with rationale recorded in `882eea8`. The brief is stale.
4. Per the project rule "minimize blast radius" and the explicit guidance in
   the TASK-3.1 prompt: *"Default to NOT reordering unless the misalignment is
   clearly hurting the user experience and the reorder is mechanical."* The
   user-experience harm is unverified (the current position of Interpretation
   below Planetarium has shipped for weeks without complaint), and the reorder
   is non-mechanical.

### Recommended follow-up (out of scope for TASK-3.1)

A dedicated planning task (`/SDLC-elicit` or PO refinement session) should:

1. Decide canonical target positions for **Planetarium**, **SkyModeToggle**,
   **ShareCard**, **LegalFooter**.
2. Decide whether DashboardInterpretationSection moves to position #5 or stays
   at the end (its current "after the volatile content / before footer" slot
   is not unreasonable — Interpretation is a slow-changing premium artifact,
   reading it as an epilogue may be intentional UX).
3. Decide whether to formally archive `DashboardTagesEnergie.tsx` and update
   the brief target list to remove it.
4. Once positions are pinned, a **single reorder commit** with sentinel-ref
   relocation + fadeIn cadence renumbering can be planned.

## Changes applied this commit

**None to `Dashboard.tsx`.** This is a doc-only commit recording the audit
state and deferring action.
