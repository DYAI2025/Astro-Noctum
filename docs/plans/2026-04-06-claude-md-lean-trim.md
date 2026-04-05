# CLAUDE.md Lean Trim Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Trim CLAUDE.md from 522 lines to ~350 by removing stale state snapshots, deduplicating module tables, and adding undocumented commands — without losing any actionable guidance.

**Architecture:** Single-file edit. Remove 3 stale sections, consolidate 2 duplicated sections, add 4 missing commands. The Key Modules table gets the biggest cut — keep only modules that have non-obvious behavior (gotchas, fallbacks, mapping quirks); remove modules whose purpose is self-evident from their path.

**Tech Stack:** Markdown editing, no code changes.

---

### Task 1: Remove stale "Current State" snapshots

**Files:**
- Modify: `CLAUDE.md:15-18` (first "Current State" block)
- Modify: `CLAUDE.md:76-93` (second "Current State" / "Project Overview" block)

**Step 1: Replace first "Current State" block (lines 15-18)**

Replace the hardcoded stats paragraph with a pointer:

```markdown
### Current State

Run `/SDLC-status` or check `3-code/tasks.md` + `git log` for live project state. Do not rely on hardcoded counts in this file.
```

**Step 2: Remove second "Project Overview > Current State" block (lines 76-93)**

Delete the entire `## Project Overview` / `### Current State` section (lines 76-93) including all the sprint history, gap analysis notes, and German-language changelog entries. This is pure audit trail that belongs in git history, not in agent context.

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: remove stale state snapshots from CLAUDE.md"
```

---

### Task 2: Trim PO Co-Worker Role section

**Files:**
- Modify: `CLAUDE.md:22-73` (PO section)

**Step 1: Remove "Key product context" subsection (lines 66-73)**

This duplicates what `/SDLC-status` returns and goes stale every session. Delete lines 66-73 (from `### Key product context` through the Monetization bullet). The rest of the PO section (Role, Responsibilities, Authority boundaries, How to engage) is durable guidance — keep it.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: remove stale PO product context from CLAUDE.md"
```

---

### Task 3: Add missing commands to Commands section

**Files:**
- Modify: `CLAUDE.md:188-227` (Commands section)

**Step 1: Add missing scripts to the Web App commands block**

After the existing commands (line ~201, after `test:coverage`), add:

```bash
npm run typecheck      # Full monorepo typecheck (src + shared + mobile)
npm run typecheck:src  # CI typecheck for src/ only (stricter, used in CI)
npm run storybook      # Storybook dev server on :6006
npm run check:text-integrity  # Verify German UI text consistency
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add missing npm scripts to CLAUDE.md commands"
```

---

### Task 4: Trim Key Modules table

**Files:**
- Modify: `CLAUDE.md:292-339` (Key Modules table)

**Step 1: Remove self-evident module entries**

Remove rows where the purpose is obvious from the file path and no gotcha is documented. Keep only modules with non-obvious behavior. 

**Remove these rows** (purpose obvious from path):
- `src/contexts/FusionRingContext.tsx` — "React context providing Fusion Ring state"
- `src/hooks/useFusionRing.ts` — "Hook that combines BAFE data + transit data"
- `src/services/contribute.ts` — "Client-side fire-and-forget service"
- `src/hooks/usePremium.ts` — "Reads profiles.is_premium"
- `src/components/PremiumGate.tsx` — "Wrapper that locks content behind premium"
- `src/data/articles.ts` — "SEO article content"
- `src/hooks/useAmbientePlayer.ts` — "Ambient audio playback control"
- `src/contexts/PlanetariumContext.tsx` — "Context for 3D orrery"
- `src/contexts/LanguageContext.tsx` — "i18n context"
- `src/contexts/AppLayoutContext.tsx` — "Layout/sidebar state"
- `src/types/interpretation.ts` — "Types for Gemini AI interpretation results"
- `src/types/bafe.ts` — just says "TypeScript types" (the gotcha is already in its own section)
- `src/components/quizzes/Kinky/` — "Kinky quiz series"
- `src/components/quizzes/PartnerMatch/` — "PartnerMatch quiz series"

**Keep these rows** (have gotchas, non-obvious mapping, or critical pipeline info):
- `src/App.tsx` — state machine orchestration
- `src/contexts/AuthContext.tsx` — signup quirk (empty identities detection)
- `src/services/api.ts` — BAFE key mapping (German→English)
- `src/services/gemini.ts` — model + timeout details
- `src/lib/supabase.ts` + `src/services/supabase.ts` — singleton vs persistence layer split
- `server.mjs` — central orchestration node
- `src/lib/fusion-ring/` — engine directory
- `src/hooks/useFusionSignal.ts` — polling + Zod schema
- `src/hooks/useQuizContribution.ts` — cluster gate logic
- `src/lib/schemas/transit-state.ts` — shared contract
- `src/components/QuizOverlay.tsx` — master quiz router
- `src/lib/lme/types.ts` — typed contract between quizzes and ring
- `src/components/quizzes/` — props contract info (keep, but trim)
- `src/components/ClusterEnergySystem.tsx` — dashboard integration
- `src/components/dashboard/` entries — keep DayModeModal (feature flag), InfluenceGauges (static defaults), DashboardLeviSection (premium gate)
- All fusion-ring-website entries — critical engine docs
- `src/hooks/useSpaceWeather.ts` — polling + G3+ trigger
- `src/lib/master-signal/` entries — GCB pipeline
- `src/lib/astronomy/` — keep (non-obvious: Kepler solver, J2000)
- `src/lib/3d/materials.ts` — keep (custom GLSL)
- `src/components/BirthChartOrrery.tsx` — keep (Keplerian mechanics)

This should cut ~14 rows (~28 lines).

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: trim self-evident entries from Key Modules table"
```

---

### Task 5: Trim Space Weather module table

**Files:**
- Modify: `CLAUDE.md:381-388` (Space Weather module table)

**Step 1: Consolidate space weather modules**

Replace the 6-row module table with a condensed 3-row version — keep only the rows with non-obvious logic:

```markdown
| Path | Purpose |
|------|---------|
| `src/lib/space-weather/noaa-adapter.ts` | Versioned NOAA SWPC fetcher — `createNoaaAdapter()` factory with v2→v1 fallback via `withFallback()` pattern |
| `src/lib/space-weather/solar-pressure.ts` | `computeSolarPressureScore()` → 0–1 blend. `computeRingModulation()` → 1.0–1.5. `kpToVisualIntensity()` → G-scale |
| `src/lib/space-weather/geometry-gating.ts` | `isSignificantGeometryEvent()` — only emits events when geometry coincides with solar disturbance (Kp >= 5, CME, or Jieqi) |
```

Remove: `types.ts` (standard type file), `donki-extended.ts` (obvious from name), `schemas/space-weather.ts` (standard Zod file).

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: consolidate space weather module table"
```

---

### Task 6: Trim Shared Package and Mobile module tables

**Files:**
- Modify: `CLAUDE.md:446-455` (Shared Package table)
- Modify: `CLAUDE.md:472-479` (Mobile modules list)

**Step 1: Trim shared package table**

Keep only entries with non-obvious logic. Remove: `constants.ts`, `experience/`, `transit/`, `i18n/` (all self-evident). Keep: `signal.ts` (weighted blend + opposition smoothing), `schema.ts` (3 scoring models), `scoring.ts` (universal engine), `definitions/` (22 quiz defs).

**Step 2: Trim mobile modules list**

Remove: `device.ts`, `theme.ts`, `useDailyHoroscope.ts` (all obvious). Keep entries with gotchas: `offlineQueue.ts` (offline queue with auto-flush), `SignaturCanvas.tsx` (currently not mounted), `QuizRenderer.tsx` (driven by shared QuizDefinition).

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: trim shared + mobile module listings"
```

---

### Task 7: Remove features/plan directory listing

**Files:**
- Modify: `CLAUDE.md:483-491`

**Step 1: Condense features/plan section**

Replace the 5-bullet listing with:

```markdown
### `features/plan/` Directory

Planning artefacts — **not part of the build**, excluded from Railway nixpacks. Do not import from them into `src/`. Contains design reference projects (QuizzMe, Fu-Ring) and prototype quizzes. Note: `allquizzes/quizzme-module-loader.ts` has a **pre-existing TSC error at line 298** — do not fix unless working on this file.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: condense features/plan section"
```

---

### Task 8: Final review — verify nothing actionable was lost

**Step 1: Read the updated CLAUDE.md end-to-end**

Scan for:
- Any section that references a removed section
- Any broken markdown links
- Line count target: ~350-380 lines (down from 522)

**Step 2: Run lint to make sure nothing broke**

Run: `npm run lint`
Expected: PASS (no source changes, just CLAUDE.md)

**Step 3: Final commit if any fixups needed**

```bash
git add CLAUDE.md
git commit -m "docs: final cleanup of CLAUDE.md trim"
```
