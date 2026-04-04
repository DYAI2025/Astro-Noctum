# S-DASH-UX Remaining Tasks — Implementation Plan

**Date:** 2026-04-04
**Sprint:** S-DASH-UX (Dashboard UX Polish & Card Redesign)
**Scope:** 21 remaining tasks across clusters A–I
**Estimated effort:** ~90 min total (2–5 min per task)

---

## Phase 1 — P1 Quick Wins (2 tasks, ~10 min)

### TASK-cosmic-influence-bright-audit (Cluster A, P1)

**Problem:** `CosmicInfluenceSection` uses hardcoded dark colors (`bg-zinc-900/40`, `border-zinc-800`, `text-zinc-300`, `text-zinc-600`, `bg-zinc-900/50`) instead of CSS custom properties. Breaks bright mode.

**Files to modify:**
- `src/components/dashboard/CosmicInfluenceSection.tsx` (lines 102, 111, 114, 155, 158, 161, 194)

**Changes:**
1. Line 155: Replace `bg-zinc-900/40 border border-zinc-800` with `cosmic-tile` class (inherits `--tile-bg`, `--tile-border`)
2. Line 102: Replace `text-zinc-300` with `style={{ color: 'var(--tile-text-secondary)' }}`
3. Line 111: Replace `text-zinc-300` with `style={{ color: 'var(--tile-text-secondary)' }}`
4. Line 114: Replace `bg-zinc-900/50` with `bg-[var(--tile-border)]`; `border-white/5` with `border-[var(--tile-border)]`
5. Line 158: Replace `text-zinc-300` with `style={{ color: 'var(--tile-text-secondary)' }}`
6. Line 161: Replace `text-emerald-500` / `text-zinc-600` conditional — keep emerald for live, use `var(--tile-text-secondary)` for no-data
7. Line 194: Replace `text-zinc-600` with `style={{ color: 'var(--tile-text-secondary)' }}`
8. `GaugeBar` inner bar glow (line 116): Replace `bg-white/10` with `bg-[var(--tile-text-primary)]/10`

**Test:** Toggle bright/dark mode in browser. All text in CosmicInfluenceSection must be readable in both modes. Gauge bars and event pills must have sufficient contrast.

---

### TASK-planetarium-fullscreen-fix (Cluster E, P1)

**Problem:** Fullscreen mode shows only a horizon strip because the canvas container keeps `aspect-[16/10]` and `max-height: 70vh` constraints from `.orrery-canvas-container` in index.css. The Three.js `onResize` handler reads `el.clientHeight` which is clamped.

**Files to modify:**
- `src/index.css` (line 182–186): Add fullscreen override
- `src/components/BirthChartOrrery.tsx` (line 1122): Add conditional class

**Changes:**
1. In `src/index.css`, after the `.orrery-canvas-container` rule (line 186), add:
   ```css
   :fullscreen .orrery-canvas-container,
   :-webkit-full-screen .orrery-canvas-container {
     aspect-ratio: auto;
     max-height: 100vh;
     height: 100vh;
     width: 100vw;
   }
   ```
2. In `BirthChartOrrery.tsx` line 1034–1038, the outer `div` already toggles `rounded-none` on fullscreen. Verify the outer div has `ref={outerRef}` (it does, line 1035). The `:fullscreen` pseudo-class applies to the element that entered fullscreen, so the CSS rule will correctly target the child `.orrery-canvas-container`.
3. In the `onResize` handler (line 960), the existing `el.clientWidth`/`el.clientHeight` reads should now return the correct fullscreen dimensions since the CSS constraints are lifted.

**Test:** Enter planetarium mode, click fullscreen button. Canvas should fill the entire screen (no black bars, no horizon-only strip). Press Esc to exit. Camera FOV changes between 60 (normal) and 90 (fullscreen) as already coded.

---

## Phase 2 — P2 Structural (11 tasks, ~50 min)

### TASK-influence-tooltips-personalized (Cluster D, P2)

**Problem:** Planet tooltips are generic ("Mars beeinflusst Energie und Antrieb"). They should explain what the current percentage means for the user's chart.

**Files to modify:**
- `src/components/dashboard/InfluenceGauges.tsx` (lines 54–79)

**Changes:**
1. Extend `useInfluences` to accept a second parameter `sunSign: string`
2. Add a `personalizedTooltip(planet, value, sunSign)` helper that returns context-aware text:
   - Low (< 30%): "Mars-Einfluss ist heute gering — deine {sunSign}-Energie wirkt unabhängig"
   - Medium (30–70%): "Mars resoniert moderat mit deinem Chart"
   - High (> 70%): "Starker Mars-Einfluss — {sunSign} spürt heute erhöhte Antriebsenergie"
3. Update `InfluenceGauges` props to accept `sunSign?: string`
4. Update `Dashboard.tsx` line 432 to pass `sunSign={sunSign}` to `InfluenceGauges`

**Note:** Task says "NEEDS REFINEMENT" — implement with intensity-based interpretation as placeholder. The exact % semantics can be refined later.

**Test:** Hover over each influence gauge. Tooltip text should reference the user's sun sign and vary by value range.

---

### TASK-cosmic-values-explained (Cluster D, P2)

**Problem:** Kp/Solar pressure values are technical. Need low/medium/high labels + user-relevant meaning.

**Files to modify:**
- `src/components/dashboard/CosmicInfluenceSection.tsx` (lines 168–181)

**Changes:**
1. Add a helper `kpInterpretation(kp: number): { level: string; meaning: string }`:
   - kp < 3: level "Ruhig", meaning "Dein kosmisches Feld ist stabil — idealer Tag für Innenschau"
   - kp 3–5: level "Moderat", meaning "Spürbare geomagnetische Aktivität — deine Signatur reagiert"
   - kp > 5: level "Stark", meaning "Hohe geomagnetische Turbulenz — Signatur-Modulation aktiv"
2. Add `solarInterpretation(pressure: number)` similarly
3. Render interpretation text as a small `<p>` below each GaugeBar, styled `text-[9px] opacity-70 mt-1`
4. Add "→ Signatur" link text pointing to `/signatur` using `<Link>`

**Test:** Check that Kp and solar pressure sections show interpretive text below the gauge bars. Verify link navigates to /signatur.

---

### TASK-agents-dark-mode-hierarchy (Cluster F, P2)

**Problem:** All agent cards look the same in dark mode. The inline gradient (line 143 of AgentSection.tsx) uses `agent.gradientFrom` but the `15` hex alpha is too subtle.

**Files to modify:**
- `src/components/dashboard/AgentSection.tsx` (line 143)

**Changes:**
1. Increase gradient alpha from `15` to `25` for non-active cards: `${agent.gradientFrom}25`
2. Add alternating card depth: odd cards get slightly different `--tile-bg` opacity. In `Dashboard.tsx` line 462, pass `index` to AgentSection; in AgentSection, use `index % 2 === 1` to add `bg-white/[0.02]` overlay
3. Alternative (simpler): In AgentSection, add a subtle `border-l-2` with `agent.accentColor` at 30% opacity for visual differentiation without index prop

**Test:** View agent grid in dark mode. Cards should be visually distinguishable from each other with subtle tonal variation.

---

### TASK-identity-signatur-row (Cluster G, P2)

**Problem:** Identity + MiniSignature should be the second section below Planetarium, as a side-by-side row.

**Files to modify:**
- `src/components/Dashboard.tsx` (lines 372–395)

**Changes:**
1. This is already implemented at lines 372–395 with `grid grid-cols-1 md:grid-cols-[1fr_auto]`. Verify layout matches spec: DashboardBigFourCard on left, MiniSignature on right.
2. If the task intends this to be the "second section" (below Planetarium + SkyModeToggle), it already is (line 372 comes right after the SkyModeToggle section).
3. Mark as already done / verify only.

**Test:** View dashboard on desktop. Identity cards should be left, MiniSignature right, directly below planetarium.

---

### TASK-daily-pulse-cluster (Cluster G, P2)

**Problem:** DashboardTagesEnergie, InfluenceGauges, and CosmicInfluenceSection are separate blocks. They should be grouped visually as one cohesive "Daily Pulse" section.

**Files to modify:**
- `src/components/Dashboard.tsx` (lines 397–441)

**Changes:**
1. Wrap TagesEnergie + InfluenceGauges + CosmicInfluence in a single parent `<section>` with a shared section label
2. Reduce gap between sub-blocks from `gap-6` to `gap-4`
3. Add section header: `<h2 className="text-[9px] uppercase tracking-[0.5em] mb-4" style={{ color: 'var(--tile-accent)', opacity: 0.6 }}>Tagesimpuls</h2>`
4. Structure:
   ```tsx
   <motion.section className="flex flex-col gap-4" {...fadeIn(0.1)}>
     <h2 ...>Tagesimpuls</h2>
     <DashboardTagesEnergie ... />
     <InfluenceGauges ... />
     <CosmicInfluenceSection ... />
   </motion.section>
   ```
5. Remove the separate `<div className="flex flex-col gap-6">` wrapper around InfluenceGauges + CosmicInfluence (lines 429–441)

**Test:** Three sub-sections appear as one visual group with tighter spacing and a shared header label.

---

### TASK-astro-three-cards (Cluster G, P2)

**Problem:** Sonnenzeichen/BaZi/WuXing currently rendered via `DashboardHeroNav` inside `DashboardAstroSection`. Need them as three equal-width horizontal cards in a row below Daily Pulse cluster.

**Files to modify:**
- `src/components/Dashboard.tsx` (lines 447–453)

**Changes:**
1. `DashboardAstroSection` already renders `DashboardHeroNav` (3 tiles in `grid grid-cols-1 sm:grid-cols-3`) as its first child. The HeroNav tiles are already styled as three equal cards.
2. Move `DashboardHeroNav` out of `DashboardAstroSection` and render it directly in `Dashboard.tsx` between the Daily Pulse cluster and the Blueprint/BaZi section.
3. In `Dashboard.tsx`, add after the daily-pulse cluster:
   ```tsx
   <motion.div {...fadeIn(0.25)}>
     <DashboardHeroNav
       sunSign={sunSign}
       dominantElement={apiData?.wuxing?.dominant_element || ''}
       zodiacAnimal={apiData?.bazi?.zodiac_sign || ''}
       onTileClick={/* need to wire detail modal */}
     />
   </motion.div>
   ```
4. Remove `DashboardHeroNav` rendering from `DashboardAstroSection.tsx` (line 133–138)
5. Wire `AstroDetailModal` state in Dashboard.tsx (move from DashboardAstroSection or duplicate)

**Test:** Three astro cards appear in a row below the Daily Pulse cluster. Clicking opens detail modal.

---

### TASK-blueprint-position (Cluster G, P2)

**Problem:** Kosmischer Blueprint is part of DashboardAstroSection at an arbitrary position. Should be directly below the three astro cards.

**Files to modify:**
- `src/components/Dashboard.tsx` (lines 447–453)
- `src/components/dashboard/DashboardAstroSection.tsx`

**Changes:**
1. After extracting HeroNav from DashboardAstroSection (TASK-astro-three-cards), what remains is the BaZi/WuXing deep section (PremiumGate-wrapped).
2. The Blueprint section (currently `BlueprintReveal` or `BlueprintCard`) is rendered inside `DashboardInterpretationSection`. Check if it needs extraction.
3. If Blueprint = the accordion section that is currently `DashboardAstroSection`, then it naturally follows the three cards after the HeroNav extraction.
4. Ensure the section order in `Dashboard.tsx` is: HeroNav → DashboardAstroSection (renamed as Blueprint section)

**Test:** Blueprint/BaZi accordion section appears directly below the three-card row.

---

### TASK-daily-pulse-naming-resolve (Cluster G, P2)

**Problem:** Three different names used: "Tagesimpuls", "Tages-Energie", "Daily Pulse". Need canonical naming.

**Files to modify:**
- `src/components/dashboard/DashboardTagesEnergie.tsx` — component name stays, but UI title should use canonical name
- i18n keys in `packages/shared/src/i18n/` or inline strings

**Changes:**
1. In `DashboardTagesEnergie.tsx`, find the rendered title/label and ensure it uses "Tagesimpuls" (DE) / "Daily Pulse" (EN)
2. Search for all occurrences of "Tages-Energie", "TagesEnergie" in UI-rendered text (component names stay as-is)
3. In the daily-pulse cluster header added in TASK-daily-pulse-cluster, use "Tagesimpuls"
4. Sub-mode names (Day-Pulse, Day-Trace) become subtitle/badge only, not the section title

**Test:** Grep codebase for rendered text. Only "Tagesimpuls" / "Daily Pulse" should appear as the section title. "Trace" appears only as a badge/subtitle.

---

### TASK-dashboard-width-alignment (Cluster H, P2)

**Problem:** Mixed `max-w-3xl`, `max-w-4xl`, `max-w-6xl` across sections.

**Files to modify:**
- `src/components/Dashboard.tsx` (line 298, 461)

**Changes:**
1. The root container is `max-w-6xl` (line 298). This should be the canonical width.
2. Line 461: Agent grid has `max-w-3xl mx-auto` — remove the `max-w-3xl` constraint so it fills the same width as other sections. Use `max-w-6xl` or remove max-w entirely (parent constrains).
3. Search for any other `max-w-3xl` or `max-w-4xl` inside child components that would cause misalignment.
4. Check `InfluenceGauges`, `CosmicInfluenceSection`, `DashboardTagesEnergie` — they use `cosmic-tile` which is full-width within parent, so they should be fine.

**Test:** All dashboard sections should align to the same left/right edges. Inspect with browser dev tools — no section should be narrower than others.

---

### TASK-bazi-wuxing-bright-audit (Cluster I, P2)

**Problem:** BaZi Four Pillars + WuXing element bars use hardcoded dark-mode colors that break in bright mode.

**Files to modify:**
- `src/components/BaZiFourPillars.tsx` (lines 87, 101, 104, 108, 129, 134, 140)
- `src/components/dashboard/DashboardAstroSection.tsx` (lines 48–53, SectionDivider)

**Changes:**
1. `BaZiFourPillars.tsx`:
   - Line 87: `morning-stele` class handles base styling. Check if this class uses CSS vars.
   - Line 101: `text-[#8B6914]/55` — replace with `style={{ color: 'var(--tile-text-secondary)' }}`
   - Line 104: `text-[#8B6914]/40` — same treatment
   - Line 108: `text-[#1E2A3A]/30` — replace with `var(--tile-text-secondary)` at lower opacity
   - Line 129: `text-[#1E2A3A]` — replace with `var(--tile-text-primary)`
   - Line 134: `text-[#1E2A3A]/35` — replace with `var(--tile-text-secondary)`
   - Line 140: `text-[#8B6914]/50` — replace with `var(--tile-accent)` at 50% opacity
2. `DashboardAstroSection.tsx` SectionDivider:
   - Line 48: `border-[#8B6914]/15` → `border-[var(--tile-border)]`
   - Line 49: `text-[#8B6914]/75` → `style={{ color: 'var(--tile-accent)', opacity: 0.75 }}`
   - Line 50: `text-[#1E2A3A]` → `style={{ color: 'var(--tile-text-primary)' }}`

**Test:** Toggle bright/dark mode. BaZi pillars and WuXing bars must be readable in both. Check contrast ratios.

---

### TASK-bazi-pillars-clickable (Cluster I, P2)

**Problem:** Four Pillars cards only have tooltip on hover. Need click to open contextual explanation specific to user's chart.

**Files to modify:**
- `src/components/BaZiFourPillars.tsx` (lines 78–85)
- New state + modal or expandable section

**Changes:**
1. Add `[expandedPillar, setExpandedPillar]` state to `BaZiFourPillars`
2. Replace `<Tooltip>` wrapper (line 85) with a clickable `<button>` that sets `expandedPillar`
3. Below the clicked pillar card, render an expandable `<motion.div>` with:
   - The existing `meta.desc[lang]` as summary
   - Stem description from `src/lib/astro-data/heavenlyStems.ts` (user's actual stem)
   - Branch/animal description from `src/lib/astro-data/earthlyBranches.ts`
4. Use `AnimatePresence` + `motion.div` with `initial={{ height: 0 }}` / `animate={{ height: 'auto' }}`
5. Keep the tooltip as a fallback for desktop hover

**Test:** Click a pillar card. An accordion-style detail section expands below with stem + animal descriptions. Click again to collapse. Only one pillar expanded at a time.

---

## Phase 3 — P3 Polish (8 tasks, ~30 min)

### TASK-card-titles-centered (Cluster A, P3)

**Problem:** Section titles (InfluenceGauges, CosmicInfluenceSection headers) are left-aligned and small.

**Files to modify:**
- `src/components/dashboard/InfluenceGauges.tsx` (line 90)
- `src/components/dashboard/CosmicInfluenceSection.tsx` (line 158)
- `src/components/dashboard/DashboardTagesEnergie.tsx` (title rendering)

**Changes:**
1. InfluenceGauges line 89: Change `flex justify-between` to `flex flex-col items-center gap-2`; increase title font: `text-xs` instead of `text-[10px]`
2. CosmicInfluenceSection line 157: Same pattern — center the header
3. DashboardTagesEnergie: Check title rendering and center if not already
4. Alternatively: Only center standalone section headers, keep in-card headers left-aligned for visual variety

**Test:** Section titles appear horizontally centered with slightly larger font size.

---

### TASK-identity-vertical-stack (Cluster B, P3)

**Problem:** DashboardBigFour uses a horizontal grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-5`). Should be a left-aligned vertical stack.

**Files to modify:**
- `src/components/dashboard/DashboardBigFour.tsx` (line 88)

**Changes:**
1. Replace `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3` with `flex flex-col gap-2`
2. Each card (line 92): Change `cosmic-tile px-4 py-3 flex items-center gap-3` — keep the horizontal icon+text layout per card but stack cards vertically
3. Remove the `md:grid-cols-5` breakpoint since vertical stack is the target at all sizes

**Test:** Five identity cards stack vertically on the left side of the identity row. MiniSignature stays on the right via the parent grid.

---

### TASK-identity-accordion (Cluster B, P3)

**Problem:** Identity cards need single-open accordion behavior.

**Files to modify:**
- `src/components/dashboard/DashboardBigFour.tsx`

**Changes:**
1. Add `[expandedKey, setExpandedKey] = useState<string | null>(null)` state
2. Wrap each card in a `<button onClick={() => setExpandedKey(prev => prev === labelKey ? null : labelKey)}>`
3. Below each card, render `<AnimatePresence>` block:
   ```tsx
   {expandedKey === labelKey && (
     <motion.div
       initial={{ height: 0, opacity: 0 }}
       animate={{ height: 'auto', opacity: 1 }}
       exit={{ height: 0, opacity: 0 }}
       transition={{ duration: 0.3, ease: 'easeOut' }}
       className="overflow-hidden"
     >
       <p className="text-xs leading-relaxed px-4 py-3" style={{ color: 'var(--tile-text-secondary)' }}>
         {/* description text */}
       </p>
     </motion.div>
   )}
   ```
4. Add `@media (prefers-reduced-motion: reduce)` handling: skip animation, show/hide instantly

**Test:** Click a card — it expands with a 300ms ease-out animation. Click another — previous collapses, new one opens. Click same — collapses.

---

### TASK-identity-accordion-content (Cluster B, P3)

**Problem:** Need per-sign/element/animal description texts for all 5 accordion panels.

**Files to modify:**
- `src/components/dashboard/DashboardBigFour.tsx` or new data file `src/lib/astro-data/identityDescriptions.ts`

**Changes:**
1. Create `src/lib/astro-data/identityDescriptions.ts` with:
   - `sunSignDescription(sign: string, lang: 'de'|'en'): string` — 2–3 sentence description per zodiac sign
   - `moonSignDescription(sign: string, lang): string`
   - `ascendantDescription(sign: string, lang): string`
   - `baziAnimalDescription(animal: string, lang): string` — leverage existing `earthlyBranches.ts` data
   - `wuxingElementDescription(element: string, lang): string` — leverage existing `wuxing.ts` data
2. In `DashboardBigFour.tsx`, import descriptions and pass the user's actual sign/element/animal to get specific text
3. Render the description inside the accordion `motion.div` from TASK-identity-accordion

**Test:** Expand each identity card. Description text must be specific to the user's actual sign/element/animal, not generic. Text should be in the current UI language (DE/EN).

---

### TASK-signatur-tile-expandable (Cluster C, P3)

**Problem:** MiniSignature tile should have expandable behavior or smooth navigation to /signatur.

**Files to modify:**
- `src/components/dashboard/MiniSignature.tsx` (line 39–40)
- `src/components/Dashboard.tsx` (line 391)

**Changes:**
1. MiniSignature already has `onClick={onExpand}` (line 39) and Dashboard passes `onExpand={() => navigate('/signatur')}` (line 391)
2. Add a visual cue that the tile is clickable: add a small "Signatur erkunden →" label at the bottom of the tile
3. Add hover state: `group-hover:border-[var(--tile-accent)]` on the outer div
4. Consider adding a brief expand animation before navigation using `motion.div` scale-up effect:
   ```tsx
   const handleExpand = () => {
     // Brief scale animation, then navigate
     setExpanding(true);
     setTimeout(() => navigate('/signatur'), 300);
   };
   ```

**Test:** Click MiniSignature. Brief scale animation plays, then navigates to /signatur page.

---

### TASK-agents-parent-container (Cluster F, P3)

**Problem:** Agent grid is a raw grid in Dashboard.tsx (line 461). Needs a cosmic-tile parent card with section title.

**Files to modify:**
- `src/components/Dashboard.tsx` (lines 459–477)

**Changes:**
1. Wrap the agent grid in a `cosmic-tile` parent:
   ```tsx
   <motion.div className="cosmic-tile p-6 md:p-8" {...fadeIn(0.4)}>
     <h2 className="text-[9px] uppercase tracking-[0.5em] mb-6"
         style={{ color: 'var(--tile-accent)', opacity: 0.6 }}>
       Astro-Agents
     </h2>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {AGENTS.map(agent => ( ... ))}
     </div>
   </motion.div>
   ```
2. Remove `max-w-3xl mx-auto` from the inner grid (width alignment task)
3. Individual AgentSection cards keep their `cosmic-tile` styling — they become nested tiles (cards within a card)

**Test:** Agents section has a visible parent card with "Astro-Agents" title. Inner cards are visually contained.

---

### TASK-agents-intro-text (Cluster F, P3)

**Problem:** No explanatory text about what agents do.

**Files to modify:**
- `src/components/Dashboard.tsx` (inside the agent parent container added above)

**Changes:**
1. Below the "Astro-Agents" title, add:
   ```tsx
   <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--tile-text-secondary)' }}>
     {t('dashboard.agents.introText')}
   </p>
   ```
2. Add i18n keys:
   - DE: "Deine KI-Begleiter helfen dir bei Tageshoroskop, Signatur-Deutung, Planetenständen, Kosmoswetter und deinem Fusion-Profil."
   - EN: "Your AI companions help with daily horoscope, signature interpretation, planetary positions, space weather, and your fusion profile."
3. Check i18n file location — likely `packages/shared/src/i18n/` or inline in LanguageContext

**Test:** Intro text appears below the "Astro-Agents" title, above the agent cards grid.

---

### TASK-card-inner-spacing (Cluster H, P3)

**Problem:** Mixed padding: `p-5`, `p-6`, `p-8` across cosmic-tile cards.

**Files to modify:**
- `src/components/dashboard/InfluenceGauges.tsx` (line 88: `p-6`)
- `src/components/dashboard/CosmicInfluenceSection.tsx` (line 155: `p-6`)
- `src/components/dashboard/MiniSignature.tsx` (line 40: `p-6 md:p-8`)
- `src/components/dashboard/AgentSection.tsx` (line 139: `p-6 sm:p-8`)

**Changes:**
1. Standardize on `p-6` as the canonical inner padding for all cosmic-tile dashboard cards
2. InfluenceGauges: already `p-6` — no change
3. CosmicInfluenceSection: already `p-6` — no change
4. MiniSignature: Change `p-6 md:p-8` to `p-6` (consistent)
5. AgentSection: Change `p-6 sm:p-8` to `p-6` (consistent)
6. Check DashboardTagesEnergie padding and normalize

**Test:** Inspect all dashboard cards — inner padding should be uniform `p-6` (24px) across all cards.

---

### TASK-bazi-section-card-harmony (Cluster I, P3)

**Problem:** BaZi/WuXing section cards need to match the three-card row style after TASK-astro-three-cards restructure.

**Files to modify:**
- `src/components/dashboard/DashboardAstroSection.tsx`

**Changes:**
1. After TASK-astro-three-cards extracts HeroNav, DashboardAstroSection becomes the BaZi/WuXing deep section only
2. Ensure BaZi pillar cards and WuXing element bars use `cosmic-tile` class consistently
3. Match border-radius (`rounded-[2rem]`), padding (`p-6`), and shadow from the HeroNav cards
4. The `morning-stele` class used by BaZiFourPillars needs to be checked for compatibility — if it conflicts, migrate to `cosmic-tile` base

**Test:** BaZi and WuXing sections visually match the three astro cards above. Same card style, border-radius, padding.

---

## Execution Order (dependency-aware)

```
Phase 1 (parallel):
  TASK-cosmic-influence-bright-audit
  TASK-planetarium-fullscreen-fix

Phase 2 — Batch A (parallel, no deps):
  TASK-influence-tooltips-personalized
  TASK-cosmic-values-explained
  TASK-agents-dark-mode-hierarchy
  TASK-daily-pulse-naming-resolve
  TASK-dashboard-width-alignment
  TASK-bazi-wuxing-bright-audit

Phase 2 — Batch B (depends on Batch A):
  TASK-daily-pulse-cluster         (after naming resolve)
  TASK-identity-signatur-row       (verify only)
  TASK-astro-three-cards           (after daily-pulse-cluster)
  TASK-blueprint-position          (after astro-three-cards)
  TASK-bazi-pillars-clickable      (after bazi-bright-audit)

Phase 3 — Batch A (parallel):
  TASK-card-titles-centered
  TASK-identity-vertical-stack
  TASK-card-inner-spacing
  TASK-agents-parent-container

Phase 3 — Batch B (depends on Batch A):
  TASK-identity-accordion          (after identity-vertical-stack)
  TASK-agents-intro-text           (after agents-parent-container)
  TASK-signatur-tile-expandable

Phase 3 — Batch C (depends on Batch B):
  TASK-identity-accordion-content  (after identity-accordion)
  TASK-bazi-section-card-harmony   (after astro-three-cards)
```

## Verification

After all tasks:
1. `npm run lint` — no new type errors
2. `npm run test` — all existing tests pass
3. Manual: toggle bright/dark mode on Dashboard — all sections readable
4. Manual: fullscreen planetarium fills viewport
5. Manual: click through all interactive elements (pillars, identity cards, agent cards, MiniSignature)
