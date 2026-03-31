# Live-Page Bugfix & UX Sprint — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 confirmed bugs and implement 3 UX improvements on the live Dashboard at bazodiac.space.

**Architecture:** All changes are in the React SPA frontend. No backend/API changes needed. The Dashboard renders sections top-to-bottom in `Dashboard.tsx` via `FadeIn` wrappers. Light-background cards use the `.morning-card` CSS class. Dark-on-light text uses `text-[#1E2A3A]`.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, TypeScript

---

## Phase 1: Bug Fixes (High Priority)

### Task 1: Fix Day Pulse / Day Trace morning-card contrast

The `CosmicWeatherCard` renders the daily horoscope as the first content section. When it uses `.morning-card` (light bg `rgba(255,255,255,0.82)`), the inner text and Day Pulse badge may lack contrast.

**Files:**
- Modify: `src/components/CosmicWeatherCard.tsx`
- Test: `src/__tests__/cosmic-weather-card.test.tsx` (if exists, else visual check)

**Step 1: Read CosmicWeatherCard.tsx and identify all color classes**

Read the file. Look for any `text-white`, `text-zinc-*`, `bg-black/` or opacity classes that assume a dark background but render inside a `.morning-card`.

**Step 2: Fix text contrast on morning-card**

Replace low-contrast classes with dark-text equivalents:
- `text-white/40` or `text-white/50` on labels → `text-[#1E2A3A]/50`
- `text-white/80` or `text-white` on values → `text-[#1E2A3A]/80`
- `bg-zinc-900` inner cards → `bg-[#1E2A3A]/5`
- Badge colors: ensure `DAY-PULSE` / `DAY-TRACE` labels are legible — use `text-[#8B6914]` (gold) instead of light gray

**Step 3: Verify visually**

Run `npm run dev` and check `/` in both default and planetarium mode. The `.planetarium .morning-card` override in `index.css:399` will handle dark-mode planetarium automatically.

**Step 4: Commit**

```bash
git add src/components/CosmicWeatherCard.tsx
git commit -m "fix(dashboard): Day Pulse/Trace morning-card contrast — dark text on light bg"
```

---

### Task 2: Remove duplicate nav entries below Planetarium

The `AstroAccordion` renders Sonnenzeichen/BaZi/WuXing as expandable sections below the Orrery, duplicating the `DashboardHeroNav` tiles above.

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx` (line ~238)
- Modify: `src/components/dashboard/AstroAccordion.tsx` (if standalone removal needed)

**Step 1: Read DashboardAstroSection.tsx lines 230-250**

Identify where `<AstroAccordion>` is rendered. The hero nav (lines 171-176) already provides Sonnenzeichen/BaZi/WuXing clickable tiles that open `AstroDetailModal`.

**Step 2: Remove or collapse AstroAccordion**

Remove the `<AstroAccordion>` render call entirely. The `DashboardHeroNav` tiles + `AstroDetailModal` already provide the same navigation + detail content. The accordion is redundant.

```tsx
// REMOVE this line (~238):
// <AstroAccordion apiData={apiData} tileTexts={tileTexts} />
```

**Step 3: Run tests**

```bash
npx vitest run src/__tests__/astro-accordion.test.tsx
```

If tests reference `AstroAccordion` rendering on the Dashboard, update or remove them (the accordion tests themselves can remain — the component exists, just isn't mounted on Dashboard anymore).

**Step 4: Commit**

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "fix(dashboard): remove duplicate AstroAccordion below Planetarium — HeroNav+DetailModal covers this"
```

---

### Task 3: Fix "heutiger Himmel" constellation display

The `BirthChartOrrery` computes constellations for birth date but may not recompute constellation name labels when switching to `currentSky` mode.

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx` (lines 658-660, 769-787)
- Modify: `src/components/dashboard/SkyModeToggle.tsx` (verify toggle works)

**Step 1: Read BirthChartOrrery.tsx lines 650-790**

Understand the animation loop. When `currentSkyRef.current` is true (line 658), `simTimeRef.current` is overridden to today. Star positions update. But constellation name sprites and line visibility may not update if they're only computed once at mount.

**Step 2: Verify constellation lines follow star positions**

Lines 755-767 update constellation line geometry every frame from star positions — these should work. The issue is likely the **constellation name labels** (lines 769-787) which compute a centroid from star positions.

**Step 3: Ensure constellation name labels update each frame**

If constellation name sprite positions are computed once at mount (not in the animation loop), move the centroid computation into the render loop so they track correctly when switching to current sky.

**Step 4: Test manually**

Run `npm run dev`, go to Dashboard, toggle "heutiger Himmel" via SkyModeToggle. Verify:
- Star positions shift to today's sky
- Constellation lines move with stars
- Constellation names reposition correctly

**Step 5: Commit**

```bash
git add src/components/BirthChartOrrery.tsx
git commit -m "fix(planetarium): constellation labels track correctly in current-sky mode"
```

---

### Task 4: Remove empty "deine Form" MiniSignature tile

The `MiniSignature` component renders after BaZi/WuXing but shows an empty ring when no meaningful data is available.

**Files:**
- Modify: `src/components/Dashboard.tsx` (lines ~431-442)

**Step 1: Read Dashboard.tsx lines 430-445**

The MiniSignature renders in a `FadeIn` wrapper with `max-w-xs mx-auto`.

**Step 2: Remove the MiniSignature section**

Comment out or remove the entire `MiniSignature` block (lines ~431-442). The full Signatur is available on `/signatur` — showing it as a tiny Dashboard tile adds no value and confuses users.

```tsx
// REMOVE this block:
// <FadeIn delay={0.35}>
//   <div className="max-w-xs mx-auto">
//     {v3Enabled ? <MiniSignature ... /> : null}
//   </div>
// </FadeIn>
```

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): remove empty MiniSignature tile — full Signatur available at /signatur"
```

---

### Task 5: Remove duplicate Kosmischer Blueprint

The `BlueprintReveal` teaser card appears as a standalone section, then the full `DashboardInterpretationSection` shows the same content again.

**Files:**
- Modify: `src/components/Dashboard.tsx` (lines ~478-485)

**Step 1: Read Dashboard.tsx lines 475-505**

`BlueprintReveal` renders at line ~478, then `DashboardInterpretationSection` at line ~493. Both show "Kosmischer Blueprint" content.

**Step 2: Remove BlueprintReveal section**

Remove the standalone `BlueprintReveal` block. The `DashboardInterpretationSection` already handles the full Blueprint with premium gating.

```tsx
// REMOVE this block:
// <FadeIn delay={0.45}>
//   <BlueprintReveal ... />
// </FadeIn>
```

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): remove duplicate BlueprintReveal — InterpretationSection already shows Blueprint"
```

---

## Phase 2: UX Improvements (Medium Priority)

### Task 6: Promote Day Pulse to hero element

Move the `CosmicWeatherCard` (Day Pulse / daily horoscope) to a more prominent position and increase its visual weight.

**Files:**
- Modify: `src/components/CosmicWeatherCard.tsx`
- Modify: `src/components/Dashboard.tsx` (render order)

**Step 1: Enhance CosmicWeatherCard styling**

Make the card visually hero-grade:
- Increase padding: `p-5 sm:p-8` → `p-6 sm:p-10`
- Larger text: headline from `text-base` → `text-lg sm:text-xl font-serif`
- Add subtle gold border: `border border-[#8B6914]/20`
- Increase the Day Pulse/Trace badge size
- Add a decorative gold accent line below the badge

**Step 2: Verify render position**

The card is already the first content section after the header (Dashboard.tsx line ~385). Confirm it stays prominent after removing other sections.

**Step 3: Commit**

```bash
git add src/components/CosmicWeatherCard.tsx src/components/Dashboard.tsx
git commit -m "feat(dashboard): promote Day Pulse to hero element — larger, bolder, gold accents"
```

---

### Task 7: Move "Heutige Einflüsse" next to Day Pulse

Group daily context together: Day Pulse + Heutige Einflüsse should be adjacent.

**Files:**
- Modify: `src/components/Dashboard.tsx` (reorder sections)

**Step 1: Move InfluenceGauges block**

In Dashboard.tsx, cut the `InfluenceGauges` FadeIn block (lines ~469-475) and paste it directly after the `CosmicWeatherCard` block (after line ~396).

**Step 2: Adjust FadeIn delays**

Update delay values to maintain smooth stagger:
- CosmicWeatherCard: `delay={0.1}` (unchanged)
- InfluenceGauges: `delay={0.15}` (moved up)
- AstroSection: `delay={0.2}` (adjusted)
- Agents: `delay={0.3}` (adjusted)

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): move Heutige Einflüsse next to Day Pulse — group daily context"
```

---

### Task 8: Redesign Levi + Eve/Viktoria agent tiles as premium cards

Replace the current compact agent tiles with larger, luxurious profile cards.

**Files:**
- Modify: `src/components/dashboard/AgentSection.tsx`
- Modify: `packages/shared/src/agents/config.ts` (update accent colors)

**Step 1: Update agent config colors**

In `packages/shared/src/agents/config.ts`:
- Levi: `accentColor: '#8B6914'` (gold), add `gradientFrom: '#1a1a3e'` (dark blue), `gradientTo: '#0d0d1a'`
- Eve: rename display to `'Viktoria'`, `accentColor: '#2dd4bf'` (teal/petrol), add `gradientFrom: '#1a1a2e'` (deep violet), `gradientTo: '#0d0d1a'`

**Step 2: Redesign AgentSection card**

In `AgentSection.tsx`, replace the current compact `.morning-card` with a taller, more luxurious card:
- Full-width card (not grid 2-col — stack vertically on mobile, side-by-side on desktop)
- Background: subtle gradient using agent's `gradientFrom`/`gradientTo`
- Gold (Levi) or silver (Viktoria) decorative border ornament
- Larger agent name in serif font
- Description text in 2-3 lines
- CTA button with agent's accent color
- Status dot prominently visible

Design tokens per agent:
- **Levi**: Gold (#D4AF37) accents, dark navy (#0a1028) bg, white text
- **Viktoria**: Teal (#2dd4bf) + violet (#7c3aed) accents, deep purple (#0d0a1a) bg, silver text

**Step 3: Update grid in Dashboard.tsx**

Ensure the agents section uses `grid-cols-1 md:grid-cols-2 gap-6` with larger cards.

**Step 4: Commit**

```bash
git add src/components/dashboard/AgentSection.tsx packages/shared/src/agents/config.ts src/components/Dashboard.tsx
git commit -m "feat(dashboard): premium Levi + Viktoria agent tiles — luxurious gradient cards with brand colors"
```

---

## Phase 3: New section order after all changes

After all tasks, the Dashboard render order becomes:

```
1. Header (title + birth date)
2. CosmicWeatherCard (Day Pulse — HERO)
3. InfluenceGauges (Heutige Einflüsse — grouped with daily)
4. DashboardAstroSection (HeroNav tiles + Orrery + BaZi Deep)
   — no more AstroAccordion
   — no more MiniSignature
5. AgentSection (Levi + Viktoria — large premium cards)
6. DashboardInterpretationSection (Kosmischer Blueprint — no more duplicate)
7. ShareCard
8. Footer
9. DayModeModal (overlay)
```

---

## Deferred to Feature Sprint (not in this plan)

These items from the requirements doc need design decisions or new data sources:

| Item | Reason deferred |
|------|-----------------|
| 3.1 Today constellation in Solar System mode | Needs architectural decision on orrery view switching |
| 3.2 Fullscreen for Bright Mode | No "bright mode" exists — needs clarification |
| 3.3 Kosmisches Wetter module | Needs data source decision + UI design |
| 3.4 Link from daily context to Signatur | Can be added as CTA on InfluenceGauges — quick follow-up |
| Hour stem content | Needs 10 bilingual interpretations authored |

---

## Execution order

| # | Task | Priority | Est. |
|---|------|----------|------|
| 1 | Day Pulse contrast fix | Bug | 5 min |
| 2 | Remove duplicate nav (AstroAccordion) | Bug | 3 min |
| 3 | Fix constellation labels in current-sky | Bug | 15 min |
| 4 | Remove empty MiniSignature tile | Bug | 2 min |
| 5 | Remove duplicate Blueprint | Bug | 2 min |
| 6 | Promote Day Pulse to hero | UX | 10 min |
| 7 | Move Heutige Einflüsse up | UX | 5 min |
| 8 | Redesign agent tiles (Levi + Viktoria) | UX | 20 min |
