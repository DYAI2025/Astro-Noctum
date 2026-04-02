# Design Completeness Sprint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all 5 Critical, 4 Important, and 3 Minor findings from the 2026-04-01 Design Completeness Assessment by updating design documents and creating missing decision records.

**Architecture:** This is a documentation-only sprint — no source code changes. All changes are to `2-design/` artifacts and `CLAUDE.md`. The work fills gaps where features were implemented without corresponding design documentation: Vibes/Weekly Insights, multi-agent voice, transparency pattern, and 8 decisions missing from the phase trigger table.

**Tech Stack:** Markdown files only. No build steps, no tests. Verification = reading back what was written.

---

## Context: What Was Found

From the Design Completeness Assessment run on 2026-04-01:

**Critical (5):**
- C-1: Vibes feature has no architecture (affects REQ-F-vibes-core, REQ-F-vibes-output-structure, REQ-PERF-vibes-response-time)
- C-2: Weekly Insights has no architecture (affects REQ-F-weekly-insights-engine, REQ-F-weekly-area-prioritization)
- C-3: Transparency/Explainability pattern not designed (affects REQ-F-transparency-rule, REQ-F-explainability-layer)
- C-4: Multi-agent voice (Eve) not in architecture.md (affects REQ-F-eve-voice-agent)
- C-5: Mobile readability has no design guidance (affects REQ-USA-mobile-first-readability)

**Important (4):**
- I-1: REQ-F-quiz-generator-pipeline not in architecture
- I-2: ASM-ued-metrics-available is Unverified — orbital visualization depends on it; needs flagging
- I-3: Missing DEC for Vibes Gemini generation strategy
- I-4: Transparency enforcement is an implicit pattern (no DEC despite existing CON + REQ)

**Minor (3):**
- M-1: api-design.md missing client routes (/onboarding, /sky, /faq, /signatur/quizzes, /fu-ring alias)
- M-2: CLAUDE.design.md trigger table only lists 4 of 12 active decisions
- M-3: 9 Draft requirements partially implemented — flag in CLAUDE.md for approval sprint

---

## Key Files

Before starting, know these files:
- `2-design/architecture.md` — main document to extend (Tasks 1–4)
- `2-design/api-design.md` — add missing client routes (Task 5)
- `2-design/CLAUDE.design.md` — add missing decisions to trigger table (Task 6)
- `2-design/decisions/DEC-vibes-gemini-strategy.md` — CREATE (Task 7)
- `CLAUDE.md` — record assessment result (Task 8)

Decisions already read (do NOT re-read unless needed):
- `DEC-multi-agent-voice.md`: Config-driven AGENTS array, AgentSection, agent_conversations.agent_type
- `DEC-vibes-not-daily.md`: On-demand 2-3h, `/api/vibes`, "Vibe abrufen" CTA
- `DEC-no-number-without-explanation.md`: Every number needs explanation or qualitative label
- `DEC-top-3-weekly-focus.md`: Top-3 areas visually distinct, remaining 4 compact, deterministic
- `DEC-design-system-v2.md`: Tokens, breakpoints, touch targets ≥44px
- `DEC-spiritual-tech-interactions.md`: 300ms transitions, CosmicError, skeleton loaders, drawer nav
- `DEC-dissonance-model.md`: Three-layer dissonance, d_natal/d_accumulated/d_elemental

Vibes implementation facts (from server.mjs lines 1734–2025):
- `/api/vibes` POST, requires Supabase JWT
- L1 in-memory `vibesCache` Map + L2 Supabase `vibes_cache` table
- Engine version: `v1-gemini-vibes`
- Returns: `kurzsignal`, `treiber`, `erklaerung` (3-level output per REQ-F-vibes-output-structure)
- Fallback: deterministic (no LLM) when Gemini key missing

Weekly Insights facts (from server.mjs lines 2030–2110):
- `/api/weekly-insights` POST, requires Supabase JWT
- L1 in-memory `weeklyCache` + L2 Supabase `weekly_insights_cache`
- Cache key: `weekly:{userId}:{isoWeek}` — valid for entire ISO week
- Engine version: `v1-gemini-weekly`
- Life areas: Love, Career, Wellbeing, Creativity, Social, Learning, Energy (7 total)
- Area scores: `blendSectorsForWeeklyServer(soulprint, transitSectors)` → `computeLifeAreaScores()`
- Transit sectors: deterministic per ISO week hash (same user + same week = same top-3)

---

### Task 1: Add Vibes + Weekly Insights sections to architecture.md

**Goal**: Resolve C-1, C-2

**Files:**
- Modify: `2-design/architecture.md` (append after the existing `## Caching Strategy` section, before `## References`)

**Step 1: Read the current end of architecture.md to find insertion point**

Run:
```bash
grep -n "## Caching Strategy\|## References" 2-design/architecture.md
```
Expected: Two line numbers. Insert the new section between Caching Strategy and References.

**Step 2: Add Vibes & Weekly Insights section**

Insert the following content between `## Caching Strategy` and `## References` in `2-design/architecture.md`:

```markdown
---

## Vibes & Weekly Insights

### Vibes (On-Demand, 2–3h Horizon)

**Endpoint**: `POST /api/vibes` (requires Supabase JWT) | **Requirements**: `REQ-F-vibes-core`, `REQ-F-vibes-output-structure`, `REQ-PERF-vibes-response-time`

The Vibes feature delivers a short-horizon emotional/energetic forecast based on the user's current signature state. It is on-demand — the user requests a Vibe at any time and receives insight tuned to the next 2–3 hours. Distinct from the daily Experience API flow (`/api/experience/daily`); see `DEC-vibes-not-daily`.

**Data pipeline:**
1. Load `soulprint_sectors` (12-vector) + big-three signs from `astro_profiles`
2. Load current space weather state from `/api/space-weather/extended` (5-min cached)
3. Blend signature × transit context into a Gemini prompt
4. Generate 3-level output via Gemini (`gemini-3-flash-preview`, 15s timeout):
   - `kurzsignal` — one-sentence headline (≤120 chars)
   - `treiber` — driving force explanation (2–3 sentences)
   - `erklaerung` — deeper pattern context (paragraph)
5. Persist result to L2 cache (Supabase `vibes_cache`)

**Caching strategy:**
- L1: In-memory `vibesCache` Map with cooldown-based eviction (stale entries purged after max cooldown)
- L2: Supabase `vibes_cache` (composite key: `user_id + date + engine_version`)
- Engine version: `v1-gemini-vibes`
- Cache hit returns immediately without LLM call — achieves p95 < 2s target

**Fallback**: If Gemini API key is missing or generation fails, returns a deterministic fallback computed from soulprint sectors alone (no LLM). Marked `cached: false` in response meta.

**Performance**: `< 2s p95` (cache hit path). Gemini generation target: `< 1.5s`. (`REQ-PERF-vibes-response-time`)

---

### Weekly Insights (7 Life Areas)

**Endpoint**: `POST /api/weekly-insights` (requires Supabase JWT) | **Requirements**: `REQ-F-weekly-insights-engine`, `REQ-F-weekly-area-prioritization`

Weekly Insights computes a 7-life-area outlook for the current ISO week. The top-3 areas receive expanded content; the remaining 4 are compact 1-line tendency labels. See `DEC-top-3-weekly-focus`.

**Life areas**: Love, Career, Wellbeing, Creativity, Social, Learning, Energy

**Data pipeline:**
1. Load `soulprint_sectors` + big-three signs from `astro_profiles`
2. Compute deterministic transit sectors from ISO week hash — same user + same week always produces the same transit input
3. Blend soulprint × transit → 7 life-area scores via `computeLifeAreaScores()`
4. Rank areas by score; top-3 flagged for expanded content generation
5. Generate via Gemini (`gemini-3-flash-preview`): top-3 areas get full paragraph + tendency label; remaining 4 get 1-line tendency label only
6. Persist to Supabase `weekly_insights_cache`

**Caching strategy:**
- L1: In-memory `weeklyCache` Map, keyed by `weekly:{userId}:{isoWeek}`
- L2: Supabase `weekly_insights_cache` (keys: `user_id + iso_week + engine_version`)
- Cache valid for entire ISO week; refreshes automatically on Monday boundary (new `isoWeek` key)
- Engine version: `v1-gemini-weekly`

**Top-3 determinism**: Area ranking is derived from the soulprint × transit blend score, not randomized. Deterministic: same user + same week → same top-3. (`DEC-top-3-weekly-focus`)
```

**Step 3: Update the Caching Strategy table to include Vibes and Weekly Insights**

In the `## Caching Strategy` section, add two rows to the existing table:

```
| Vibes result (Gemini) | Cooldown-based (in-memory); weekly_insights_cache (Supabase) | In-memory + Supabase (L1+L2) |
| Weekly Insights | ISO week boundary | In-memory + Supabase (L1+L2) |
```

**Step 4: Verify**

Run:
```bash
grep -c "api/vibes\|api/weekly-insights\|REQ-F-vibes-core\|REQ-F-weekly-insights" 2-design/architecture.md
```
Expected: ≥ 6 matches

**Step 5: Commit**
```bash
git add 2-design/architecture.md
git commit -m "docs(design): add Vibes + Weekly Insights architecture (C-1, C-2)"
```

---

### Task 2: Add Transparency, Explainability, and Mobile sections to architecture.md

**Goal**: Resolve C-3, C-5

**Files:**
- Modify: `2-design/architecture.md` (append new sections before `## References`)

**Step 1: Add Transparency & Explainability section**

Append the following to `2-design/architecture.md` (after the Vibes/Weekly section from Task 1, before `## References`):

```markdown
---

## Transparency & Explainability (System-Wide Pattern)

### No Number Without Explanation

**Constraint**: `CON-no-unexplained-numbers` | **Decision**: `DEC-no-number-without-explanation` | **Requirement**: `REQ-F-transparency-rule`

Every numerical value displayed in the UI must have an accompanying explanation. If a value cannot be explained in its context, it is replaced with a qualitative label (`hoch` / `mittel` / `niedrig`) or removed entirely. This is a hard product constraint, not a guideline.

Scope: Dashboard, Vibes, Weekly Insights, Signatur coherence index, space weather display, influence gauges.

**Enforcement pattern:**
- Every `<span>` displaying a number must have an associated tooltip, inline label, or context sentence
- Internal scores (harmony index, solar pressure score, life-area score) shown to users: either display with a meaning label ("Hohe Harmonie — Westlich und BaZi konvergieren") or hide the number
- Gemini prompts include explicit instruction: "Do not include unexplained numerical values"
- PR review gate: any new numerical display requires explanation mechanism before merge

### "Warum sehe ich das?" — Explainability Layer

**Requirement**: `REQ-F-explainability-layer`

Every insight, tendency label, and influence score must have an accessible explanation of why the user sees it. The design pattern:

1. **Surface layer**: insight text (kurzsignal, tendency label, gauge value)
2. **Expand trigger**: "Warum?" link or info icon — always present, never hidden behind premium
3. **Explanation content**: 1–3 sentences citing the data inputs that drove this result (which astrological factor, signal strength, what the user could do with the information)
4. **Animation**: 300ms ease-out expand panel or bottom-sheet drawer (`DEC-spiritual-tech-interactions`)

This pattern applies to: Vibes kurzsignal, Weekly life-area tendency labels, Dashboard influence gauges, Signatur coherence index display.
```

**Step 2: Add Mobile Readability section**

Append the following (still before `## References`):

```markdown
---

## Mobile-First Design Constraints

**Constraint**: `CON-mobile-first-readability` | **Requirement**: `REQ-USA-mobile-first-readability`

All content-bearing UI sections must achieve <10s comprehension on a 375px mobile viewport. This is not a "nice to have" — it is a hard product constraint.

**Required design behaviour:**
- Maximum 3 content levels above the fold before scroll is required
- Body text minimum: `--text-sm` (14px / 1.5 line-height) — never smaller
- Touch targets ≥ 44px — enforced via `--touch-min` token (`DEC-design-system-v2`)
- Dashboard sections use progressive disclosure: headline → 1-line summary → expand for detail
- No horizontal scroll on mobile at any viewport ≥ 320px

**Responsive grid** (from `DEC-design-system-v2`):
- Mobile (< 640px): 1-column layout; 2×2 for the Big Four astrological tiles
- Tablet (640–1024px): 2 columns
- Desktop (> 1024px): 3–4 columns
```

**Step 3: Verify**

Run:
```bash
grep -c "Warum sehe ich\|CON-no-unexplained\|CON-mobile-first\|REQ-F-transparency\|REQ-F-explainability\|REQ-USA-mobile" 2-design/architecture.md
```
Expected: ≥ 6 matches

**Step 4: Commit**
```bash
git add 2-design/architecture.md
git commit -m "docs(design): add transparency, explainability, mobile-first architecture sections (C-3, C-5)"
```

---

### Task 3: Add Multi-Agent Voice + Quiz Generator sections to architecture.md

**Goal**: Resolve C-4, I-1

**Files:**
- Modify: `2-design/architecture.md` (update ElevenLabs section + append Quiz Generator section)

**Step 1: Update the ElevenLabs Voice Agent integration section**

Find the existing `### ElevenLabs Voice Agent` section in `2-design/architecture.md`. It currently only mentions Levi. Replace it with:

```markdown
### ElevenLabs Voice Agents (Multi-Agent)

**Decision**: `DEC-multi-agent-voice` | **Requirements**: `REQ-F-eve-voice-agent`, `REQ-F-agent-architecture-refactor`, `REQ-MNT-agent-extensibility`

Bazodiac uses a **config-driven multi-agent architecture** where each voice agent is defined by an `AgentConfig` entry in the `AGENTS` array (in `@bazodiac/shared`). No agent-specific components exist — all rendering derives from config.

**Two fixed agents:**
- **Levi Bazi** (`VITE_ELEVENLABS_AGENT_ID`) — primary agent, empathic/philosophical tone
- **Eve** (`VITE_ELEVENLABS_EVE_AGENT_ID`) — second agent, bold/modern persona; shows "coming soon" if env var missing

**Key architectural components:**
- `AgentProvider` context: replaces Levi-specific state with generic `activeAgent`, `agentState` keyed by `AgentId`
- `AgentSection` component: renders from config — one instance per agent, no Levi-specific code
- `AgentFloatingWidget`: one floating ElevenLabs widget per agent, keyed by `agent.id`
- `agent_conversations.agent_type` DB column: partitions conversation history — agents never see each other's sessions

**Dashboard layout**: Two fixed side-by-side tiles (not a generic gallery). The product decision is two agents; the architecture decision is config-driven extensibility for future agents.

**Server-side**: `/api/profile/:userId` and `/api/agent` accept `agent_type` parameter. Profile endpoint filters conversation history by agent type; save endpoint writes with type. Auth: `ELEVENLABS_TOOL_SECRET`.

**Extensibility**: Adding a third agent = add 1 `AgentConfig` entry + 1 env var + 1 DB migration (update `agent_type` check constraint). Zero component changes. (`REQ-MNT-agent-extensibility`)
```

**Step 2: Append Quiz Generator Pipeline section**

Append the following (before `## References`):

```markdown
---

## Quiz Generator Pipeline

**Requirement**: `REQ-F-quiz-generator-pipeline`

The quiz generator pipeline defines a formal, reusable mapping from quiz answers to Signatur dimensions. All 22 quiz components share the same data contract and output through `@bazodiac/shared`.

**Data contract (quiz output)**:
- All quizzes emit a `ContributionEvent` via `onComplete` callback
- `ContributionEvent` carries semantic `Marker`s (format: `marker.{domain}.{keyword}`, weight 0–1)
- Markers are mapped to 12-sector zodiac weight vectors via `AFFINITY_MAP` in `eventToSectorSignals()`

**Formal mappings** (defined in `@bazodiac/shared`):
1. **12-sector zodiac mapping**: `eventToSectorSignals()` + `AFFINITY_MAP` → `soulprint_sectors[12]`
2. **6D Signatur V3 mapping**: `quizSectorsToQuizWeights()` (from `packages/shared/src/signatur/`) → `quizWeights[6]` (one per DIMENSION_DEFS entry)
3. **5D Master Signal mapping**: `quiz-projection.ts` → `quizProjection[5]` (passion, stability, future, connection, autonomy)

**Cluster gate**: A cluster's contribution is only persisted when ALL quizzes in that cluster are complete. Gate logic lives in `useQuizContribution`.

**Universal scoring engine**: `scoreQuiz()` in `@bazodiac/shared/src/quizzes/scoring.ts` handles all three scoring models (multi-dimension, categorical, profile-driven) via a unified `QuizDefinition` type.
```

**Step 3: Verify**

Run:
```bash
grep -c "DEC-multi-agent-voice\|AgentConfig\|AGENTS array\|Quiz Generator\|AFFINITY_MAP\|quizSectorsToQuizWeights\|REQ-F-quiz-generator" 2-design/architecture.md
```
Expected: ≥ 7 matches

**Step 4: Commit**
```bash
git add 2-design/architecture.md
git commit -m "docs(design): add multi-agent voice + quiz generator pipeline architecture (C-4, I-1)"
```

---

### Task 4: Create DEC-vibes-gemini-strategy.md

**Goal**: Resolve I-3

**Files:**
- Create: `2-design/decisions/DEC-vibes-gemini-strategy.md`

**Step 1: Create the decision file**

Create `2-design/decisions/DEC-vibes-gemini-strategy.md` with this content:

```markdown
# DEC-vibes-gemini-strategy: Gemini for Vibes and Weekly Insights Generation

**Status**: Active

**Category**: Architecture

**Scope**: api-server

**Source**: [GOAL-vibes-weekly-insights](../../1-objectives/goals/GOAL-vibes-weekly-insights.md)

**Last updated**: 2026-04-01

## Context

Vibes (on-demand 2–3h horizon) and Weekly Insights (7 life areas, ISO week cadence) both require natural-language generation from structured astrological signal data. Options considered:

1. **Gemini Flash** — fast, cheap, German-capable, already used for Dashboard interpretation
2. **Deterministic templates** — zero latency, zero cost, but static and impersonal
3. **Custom fine-tuned model** — high quality potential, prohibitive cost and operational overhead for current scale

## Decision

Use **Gemini `gemini-3-flash-preview`** as the generation backbone for both Vibes and Weekly Insights, with a two-level caching strategy to minimize LLM calls and a deterministic fallback for API failures.

## Key Points

1. **Model**: `gemini-3-flash-preview` — same model used for Dashboard interpretation. 15s timeout for Vibes, 20s for Weekly Insights (longer = more structured output).
2. **Two-level caching**: L1 in-memory (request-lifetime; evicted by cooldown) + L2 Supabase persistence (`vibes_cache`, `weekly_insights_cache`). Cache hit = no LLM call = p95 < 200ms.
3. **Deterministic fallback**: Both endpoints return soulprint-derived content when Gemini is unavailable. Marked `cached: false` in response meta; users see insight quality degrades gracefully.
4. **Prompt constraints**: All prompts include explicit instruction: "Do not include unexplained numerical values" (enforces `CON-no-unexplained-numbers` at generation time).
5. **Engine versioning**: `v1-gemini-vibes` and `v1-gemini-weekly` in cache keys. Cache invalidated automatically when engine version changes.
6. **Verified assumption**: `ASM-gemini-text-quality` — Gemini produces constraint-compliant insight text (≥80% first-pass quality), verified in production as of 2026-03-30.

## Performance Targets

| Feature | p95 (cache hit) | p95 (generation) |
|---------|----------------|-----------------|
| Vibes | < 200ms | < 2s |
| Weekly Insights | < 200ms | < 3s |

Gemini generation target: < 1.5s per `REQ-PERF-vibes-response-time`.

## Enforcement

### Trigger conditions

- When modifying Vibes or Weekly Insights generation logic
- When changing Gemini model, temperature, or prompt structure
- When adding caching layers or changing cache invalidation rules

### Required patterns

- Both endpoints use two-level cache (L1 in-memory + L2 Supabase) — never call Gemini without checking both levels first
- Prompts must include "Do not include unexplained numerical values" instruction
- Engine version in cache key must be bumped when prompt structure changes semantically
- Fallback path must produce valid response shape (same fields, degraded quality)

### Prohibited patterns

- Calling Gemini synchronously without timeout
- Returning raw Gemini output without validating required fields (`kurzsignal`, `treiber`, `erklaerung` for Vibes; `areas` array for Weekly)
- Using a different model for these features without updating this decision

## References

- [REQ-F-vibes-core](../../1-objectives/requirements/REQ-F-vibes-core.md)
- [REQ-F-vibes-output-structure](../../1-objectives/requirements/REQ-F-vibes-output-structure.md)
- [REQ-F-weekly-insights-engine](../../1-objectives/requirements/REQ-F-weekly-insights-engine.md)
- [REQ-PERF-vibes-response-time](../../1-objectives/requirements/REQ-PERF-vibes-response-time.md)
- [DEC-vibes-not-daily](DEC-vibes-not-daily.md)
- [ASM-gemini-text-quality](../../1-objectives/assumptions/ASM-gemini-text-quality.md)
```

**Step 2: Verify**

Run:
```bash
grep -c "v1-gemini-vibes\|v1-gemini-weekly\|ASM-gemini-text-quality\|REQ-PERF-vibes" 2-design/decisions/DEC-vibes-gemini-strategy.md
```
Expected: ≥ 4 matches

**Step 3: Commit**
```bash
git add 2-design/decisions/DEC-vibes-gemini-strategy.md
git commit -m "docs(decisions): add DEC-vibes-gemini-strategy (I-3)"
```

---

### Task 5: Update api-design.md — missing client routes

**Goal**: Resolve M-1

**Files:**
- Modify: `2-design/api-design.md` (Client Routes table)

**Step 1: Read the current Client Routes table**

Run:
```bash
grep -n "Client Routes\|/onboarding\|/sky\|/faq\|/signatur/quizzes\|/fu-ring" 2-design/api-design.md
```
Expected: shows the table header but none of the missing routes.

**Step 2: Replace the Client Routes table**

Find and replace the entire `## Client Routes` section's table in `2-design/api-design.md`. The current table has 5 routes. The new table should have all routes:

```markdown
## Client Routes

Defined in `src/router.tsx`, all lazy-loaded via React Router.

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `DashboardPage` | Main astro dashboard |
| `/signatur` | `FuRingPage` | Signatur (Fusion Ring) visualization |
| `/fu-ring` | `FuRingPage` | Alias for `/signatur` (legacy route preserved) |
| `/signatur/quizzes` | `SignaturQuizzesPage` | Quiz selection for Signatur |
| `/wu-xing` | `WuXingPage` | Wu Xing five-elements detail |
| `/wissen` | `WissenPage` | SEO article index |
| `/wissen/:slug` | `ArtikelPage` | Individual SEO article |
| `/onboarding` | `OnboardingPage` | Birth data form → Signature reveal → Dashboard |
| `/sky` | `SkyPage` | Sky/space weather visualization |
| `/faq` | `FaqPage` | FAQ page |
```

**Step 3: Verify**

Run:
```bash
grep -c "/onboarding\|/sky\|/faq\|/signatur/quizzes\|/fu-ring" 2-design/api-design.md
```
Expected: 5

**Step 4: Commit**
```bash
git add 2-design/api-design.md
git commit -m "docs(design): add missing client routes to api-design.md (M-1)"
```

---

### Task 6: Update CLAUDE.design.md — complete decisions trigger table

**Goal**: Resolve M-2

**Files:**
- Modify: `2-design/CLAUDE.design.md` (Decisions Relevant to This Phase table)

**Step 1: Read the current decisions table**

Run:
```bash
grep -n "DEC-" 2-design/CLAUDE.design.md
```
Expected: 4 entries (supabase-backend, swiss-ephemeris, wuxing-ui-mapping, master-signal-weights).

**Step 2: Replace the decisions table**

Find and replace the `## Decisions Relevant to This Phase` section's table with the complete 12-decision table:

```markdown
## Decisions Relevant to This Phase

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When designing data storage, auth flows, or new tables |
| [DEC-swiss-ephemeris](decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE for all astrological calculations | When designing any feature that needs astrological data |
| [DEC-wuxing-ui-mapping](decisions/DEC-wuxing-ui-mapping.md) | Wu-Xing elements drive UI physics via centralized mapping | When designing any visualization using element data or colors |
| [DEC-master-signal-weights](decisions/DEC-master-signal-weights.md) | Master Signal formula locked: 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost | When proposing changes to signal weights, fusion formula, or adding new signal sources |
| [DEC-dissonance-model](decisions/DEC-dissonance-model.md) | Layered dissonance model (d_natal / d_accumulated / d_elemental) | When designing signature visualization, quiz-to-visual mapping, or transition animations |
| [DEC-signatur-v3-bipolar-trails](decisions/DEC-signatur-v3-bipolar-trails.md) | Bipolar trail engine (V3) replaces particle spirograph | When designing or modifying the Signatur renderer, trail parameters, or pole behavior |
| [DEC-multi-agent-voice](decisions/DEC-multi-agent-voice.md) | Config-driven multi-agent voice architecture (Levi + Eve) | When adding voice agents, modifying agent UI, or changing conversation persistence |
| [DEC-vibes-not-daily](decisions/DEC-vibes-not-daily.md) | "Vibes" on-demand (2–3h) instead of fixed daily insight | When designing Vibes UI, CTA text, or API endpoint naming |
| [DEC-no-number-without-explanation](decisions/DEC-no-number-without-explanation.md) | No numerical value in UI without explanation | When adding any numerical display, chart, or score to the UI |
| [DEC-top-3-weekly-focus](decisions/DEC-top-3-weekly-focus.md) | Weekly Insights highlights exactly 3 life areas as focus | When designing the Weekly Insights layout or prioritization algorithm |
| [DEC-design-system-v2](decisions/DEC-design-system-v2.md) | Unified design system with dark/bright mode tokens | When creating or modifying any UI component, color, spacing, or typography |
| [DEC-spiritual-tech-interactions](decisions/DEC-spiritual-tech-interactions.md) | Spiritual Tech interaction philosophy (transitions, errors, loading) | When writing error handling UI, adding animations, designing loading states |
| [DEC-vibes-gemini-strategy](decisions/DEC-vibes-gemini-strategy.md) | Gemini for Vibes and Weekly Insights generation with two-level caching | When modifying Vibes/Weekly generation logic, model, prompts, or cache strategy |
```

Note: This adds DEC-vibes-gemini-strategy (created in Task 4) to the table. 13 entries total.

**Step 3: Verify**

Run:
```bash
grep -c "DEC-" 2-design/CLAUDE.design.md
```
Expected: 13

**Step 4: Commit**
```bash
git add 2-design/CLAUDE.design.md
git commit -m "docs(design): complete decisions trigger table — all 13 active decisions listed (M-2)"
```

---

### Task 7: Flag ASM-ued-metrics-available and record assessment in CLAUDE.md

**Goal**: Resolve I-2, M-3, and record the assessment result

**Files:**
- Modify: `CLAUDE.md` (Current State section in Project Overview)
- Modify: `1-objectives/assumptions/ASM-ued-metrics-available.md` (add design-risk note)

**Step 1: Read the ASM file**

Read `1-objectives/assumptions/ASM-ued-metrics-available.md` to understand its current state.

**Step 2: Add design-risk note to the assumption**

The assumption states that UED metrics (home_base, σ_v, σ_a, instability, rise/recovery rate) are derivable from soulprint + transit. This is unverified. `REQ-F-orbital-signatur-visualization` depends on it. Add a note under the `## Verification Plan` or `## Notes` section:

```markdown
## Design Risk Note (2026-04-01)

**REQ-F-orbital-signatur-visualization** (Draft) depends on this assumption being true. Until verified, the orbital visualization feature should not be implemented. The architecture does not currently define the derivation path for UED metrics from soulprint + transit data.

**Verification trigger**: Before sprint S-ORBITAL or any task implementing REQ-F-orbital-signatur-visualization, verify by: (a) checking if `soulprintToNatalWeights()` output plus transit sector data contains sufficient variance to derive home_base and σ values, or (b) confirming FuFirE `/transit/state` response includes these fields.
```

**Step 3: Update CLAUDE.md Current State section**

Find the `### Current State` section in `CLAUDE.md` under `## Project Overview`. Add the following line(s):

1. Update or add the completeness assessment line:
```
Completeness assessment (2026-04-01): 5 Critical, 4 Important, 3 Minor — all resolved in design-completeness sprint (docs/plans/2026-04-01-design-completeness-sprint.md).
```

2. Add note about draft requirements needing approval:
```
9 Draft requirements pending approval sprint: signatur-dissonance-model, signatur-quiz-morph, signatur-density-field, signatur-ios-swift, signatur-day-night-pulse, orbital-signatur-visualization (blocked on ASM-ued-metrics-available), depth-navigation, progressive-ui-fluidity, wcag-contrast. Use /SDLC-elicit to approve.
```

**Step 4: Verify CLAUDE.md updated**

Run:
```bash
grep -c "Completeness assessment\|Draft requirements pending\|design-completeness-sprint" CLAUDE.md
```
Expected: ≥ 3 matches

**Step 5: Commit everything**
```bash
git add CLAUDE.md 1-objectives/assumptions/ASM-ued-metrics-available.md
git commit -m "docs(design): record completeness assessment result + flag ASM-ued-metrics risk (I-2, M-3)"
```

---

## Verification Checklist

After all tasks are complete, run these checks:

```bash
# 1. All Critical findings resolved — check for required content in architecture.md
grep -c "api/vibes\|api/weekly-insights\|Transparency\|Explainability\|DEC-multi-agent-voice\|mobile-first\|CON-mobile-first" 2-design/architecture.md
# Expected: ≥ 10

# 2. New DEC file exists
ls 2-design/decisions/DEC-vibes-gemini-strategy.md
# Expected: file exists

# 3. All 13 decisions in trigger table
grep -c "DEC-" 2-design/CLAUDE.design.md
# Expected: 13

# 4. Missing client routes added
grep -c "/onboarding\|/sky\|/faq" 2-design/api-design.md
# Expected: 3

# 5. Assessment recorded in CLAUDE.md
grep "Completeness assessment" CLAUDE.md
# Expected: line with 2026-04-01 and severity counts

# 6. Commit log looks clean
git log --oneline -8
# Expected: 5 commits from this sprint
```

---

## Summary

| Task | Findings | Files Changed |
|------|----------|---------------|
| 1 | C-1, C-2 | architecture.md |
| 2 | C-3, C-5 | architecture.md |
| 3 | C-4, I-1 | architecture.md |
| 4 | I-3 | decisions/DEC-vibes-gemini-strategy.md (new) |
| 5 | M-1 | api-design.md |
| 6 | M-2 | CLAUDE.design.md |
| 7 | I-2, M-3 | CLAUDE.md, assumptions/ASM-ued-metrics-available.md |

All tasks are documentation-only. No source code changes. No tests required.
