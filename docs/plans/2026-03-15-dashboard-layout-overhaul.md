# Dashboard Layout Overhaul — Real Data, No Placeholders

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the Dashboard page layout per the spec (Western → BaZi/WuXing → Four Pillars → WuXing Bar Chart → Levi CTA → Houses → Gesamtanalyse), eliminate all placeholder text, verify real API data binding throughout.

**Architecture:** The Dashboard is a React SPA rendering BAFE API data through `DashboardAstroSection.tsx`. The main changes are: (1) reorder sections to match spec, (2) make Levi CTA a full-width centered card instead of a sidebar column, (3) add rich individual house tooltips, (4) verify WuXing bar chart uses real API data, (5) ensure Gesamtanalyse shows real Gemini-generated text. No new components needed — this is a restructuring of `Dashboard.tsx` and `DashboardAstroSection.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Framer Motion, Vitest

---

## Current State Analysis

### Component Hierarchy (what exists now)
```
Dashboard.tsx
  ├─ Header + Upgrade Banner
  ├─ DashboardAstroSection.tsx
  │   ├─ 3D Orrery
  │   ├─ Western Signs (3-col grid: Sun/Moon/Asc)          ← spec §1 ✓
  │   ├─ BaZi Cards (4-col grid: Animal/Element/Day/Month) ← spec §2 ✓
  │   ├─ PremiumGate
  │   │   ├─ Four Pillars (BaZiFourPillars)                ← spec §3 ✓
  │   │   ├─ WuXing Bar Chart                              ← spec §4 ✓
  │   │   └─ BaZiInterpretation
  │   └─ PremiumGate: Houses (4-col grid)                  ← spec §6 (tooltips need work)
  ├─ Grid (md:grid-cols-3)
  │   ├─ DashboardInterpretationSection (col-span-2)       ← spec §7
  │   └─ DashboardLeviSection (col-span-1)                 ← spec §5 (needs restructure)
  └─ ShareCard + Footer
```

### What Needs to Change
| Spec | Current | Required Change |
|------|---------|-----------------|
| §1 Western 3-col | ✅ Already correct | None — verify equal sizing |
| §2 BaZi 4-col | ✅ Already correct | None — verify equal sizing |
| §3 Four Pillars | ✅ Behind PremiumGate | None — already real data |
| §4 WuXing bar chart | ✅ Behind PremiumGate | Verify real data, slightly smaller card |
| §5 Levi CTA | ❌ Sidebar 1/3 width | Move to full-width centered rectangle below WuXing, above Houses |
| §6 Houses | ⚠️ Tooltips are thin | Enrich tooltips with meaningful interpretation text |
| §7 Gesamtanalyse | ⚠️ Could show fallback | Move below Levi; verify no placeholder when Gemini returns data |
| Layout order | ❌ Interpretation+Levi before Houses | Reorder: ...WuXing → Levi → Houses → Gesamtanalyse |

### Key Files
| File | Path | Role |
|------|------|------|
| Dashboard | `src/components/Dashboard.tsx` | Top-level layout, section ordering |
| AstroSection | `src/components/dashboard/DashboardAstroSection.tsx` | Western + BaZi + Pillars + WuXing + Houses |
| InterpretationSection | `src/components/dashboard/DashboardInterpretationSection.tsx` | Gesamtanalyse |
| LeviSection | `src/components/dashboard/DashboardLeviSection.tsx` | Levi CTA + ElevenLabs widget |
| API service | `src/services/api.ts` | BAFE data fetching + mapping |
| Gemini service | `src/services/gemini.ts` | AI interpretation + tiles + houses |
| Server interpret | `server.mjs:39-83` | `buildGeminiPrompt()` — requests tiles + houses JSON |
| Types | `src/types/bafe.ts`, `src/types/interpretation.ts` | Data shapes |

### Data Verification Status
| Data Point | Source | Binding | Status |
|------------|--------|---------|--------|
| Sun/Moon/Asc | `apiData.western.zodiac_sign/moon_sign/ascendant_sign` | Sign lookup → name + emoji + art + description | ✅ Real |
| Year Animal | `apiData.bazi.zodiac_sign` | Branch lookup → animal name + description | ✅ Real |
| Dominant Element | `apiData.wuxing.dominant_element` | WuXing lookup → name + description | ✅ Real |
| Day Master | `apiData.bazi.day_master` | Stem lookup → name + description | ✅ Real |
| Month Stem | `apiData.bazi.pillars.month.stem` | Stem lookup → name + description | ✅ Real |
| Four Pillars | `apiData.bazi.pillars` | Direct render via BaZiFourPillars | ✅ Real |
| WuXing counts | `apiData.wuxing.elements` or `.element_counts` | Bar percentages | ⚠️ Verify per-user variation |
| House signs | `apiData.western.houses` | Sign resolution per house | ✅ Real |
| House tooltips | `houseTexts[N]` from Gemini | Conditional tooltip | ⚠️ Only if Gemini returns them |
| Interpretation | `interpretation` from Gemini | Markdown render | ⚠️ Falls back to template text |
| Tile texts | `tileTexts.{sun,moon,...}` from Gemini | ExpandableText | ⚠️ Optional, may be empty |

---

## Task 1: Restructure Dashboard Layout Order

**Goal:** Move the section order in `Dashboard.tsx` to: Astro (Western+BaZi+Pillars+WuXing) → Levi CTA → Houses → Gesamtanalyse → ShareCard

**Files:**
- Modify: `src/components/Dashboard.tsx:226-250` (the grid containing Interpretation + Levi)
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:689-754` (extract Houses out)

### Step 1: Read the current Dashboard.tsx layout

Read `src/components/Dashboard.tsx` to confirm current section order.

### Step 2: Extract Houses from DashboardAstroSection

In `src/components/dashboard/DashboardAstroSection.tsx`, the Houses section (lines 689-754) is currently inside the AstroSection. It needs to stay there but we need the Levi CTA to come between WuXing and Houses in the visual flow. The cleanest approach: split `DashboardAstroSection` to accept a `leviSlot` render prop that gets inserted between the WuXing block and the Houses block.

Edit `src/components/dashboard/DashboardAstroSection.tsx`:
- Add prop: `leviSlot?: React.ReactNode`
- Insert `{leviSlot}` between the WuXing PremiumGate (line 687) and Houses PremiumGate (line 689)

### Step 3: Restructure Dashboard.tsx — remove 3-col grid, insert Levi as slot

In `src/components/Dashboard.tsx`:
- Remove the `md:grid-cols-3` grid wrapping Interpretation + Levi (lines 226-250)
- Pass `<DashboardLeviSection>` as the `leviSlot` prop to `<DashboardAstroSection>`
- Move `<DashboardInterpretationSection>` to appear AFTER `<DashboardAstroSection>` as a standalone full-width section

### Step 4: Verify the dev server renders correctly

Run: `npm run dev`
Expected: Page loads with new section order: Western → BaZi → Pillars → WuXing → Levi → Houses → Gesamtanalyse → ShareCard

### Step 5: Commit

```bash
git add src/components/Dashboard.tsx src/components/dashboard/DashboardAstroSection.tsx
git commit -m "refactor(AN-20): reorder dashboard sections — Levi between WuXing and Houses"
```

---

## Task 2: Restyle Levi CTA as Full-Width Centered Card

**Goal:** Make Levi a horizontally dominant, centered rectangular card instead of a narrow sidebar column.

**Files:**
- Modify: `src/components/dashboard/DashboardLeviSection.tsx:64-125`

### Step 1: Read DashboardLeviSection current layout

Read `src/components/dashboard/DashboardLeviSection.tsx`.

### Step 2: Change layout to full-width centered rectangle

The card currently uses `morning-card p-5 sm:p-7 flex flex-col`. Change to a horizontal layout:

```tsx
// Replace the outer div (line 65):
<div
  ref={leviSectionRef}
  className="morning-card p-5 sm:p-7 md:p-8 max-w-3xl mx-auto flex flex-col md:flex-row md:items-center gap-5 sm:gap-6"
  style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', overflow: 'visible' }}
>
```

- On mobile: stacked vertical (as now)
- On md+: horizontal layout with status left, button center/right
- `max-w-3xl mx-auto` keeps it centered and horizontally dominant but not full-bleed

### Step 3: Adjust internal layout for horizontal mode

The status indicator + text should be on the left, the call button in the center/right:
- Wrap status indicator div + button in a flex container
- On md+: `flex-row items-center justify-between`
- On mobile: keep vertical stack

### Step 4: Ensure ElevenLabs widget renders below the CTA bar

The `elevenlabs-convai` widget (lines 99-112) should appear below the horizontal bar when active, spanning full width of the card.

### Step 5: Visual verification

Run dev server, check:
- Levi card is centered, wider than tall
- Button is clearly visible
- On click (premium), ElevenLabs widget opens below logically
- Mobile: stacks vertically

### Step 6: Commit

```bash
git add src/components/dashboard/DashboardLeviSection.tsx
git commit -m "style(AN-20): restyle Levi CTA as full-width centered card"
```

---

## Task 3: Enrich House Tooltips with Meaningful Interpretation

**Goal:** House tooltips must contain personalized, substantive text — not just "{Sign} shapes your house of {Name}". The text comes from Gemini (`houseTexts`). When Gemini text is missing, generate a richer static fallback.

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:700-750` (house rendering)
- Create: `src/lib/astro-data/houseInterpretations.ts` (static fallback data)

### Step 1: Create house interpretation fallback data

Create `src/lib/astro-data/houseInterpretations.ts` with a `getHouseInterpretation(houseNum: number, sign: string, lang: "de"|"en"): string` function.

This function returns 2-3 sentences covering:
1. What the house governs
2. How the sign manifests in that house
3. A personal strength or growth area

Example for House 1 + Gemini:
- DE: "Zwillinge im ersten Haus verleihen dir eine lebhafte, vielseitige Ausstrahlung. Du wirkst auf andere neugierig und kommunikativ — dein Auftreten passt sich flexibel an dein Gegenüber an. Deine Stärke liegt darin, durch Worte Verbindung zu schaffen."
- EN: "Gemini in the first house gives you a lively, versatile presence. Others perceive you as curious and communicative — your demeanor flexibly adapts to whoever is in front of you. Your strength lies in creating connection through words."

Include all 12 signs × 12 houses would be 144 entries — too many. Instead, build a template system:
- 12 house descriptions (what the house governs)
- 12 sign archetypes (how the sign operates)
- Combine dynamically: "{sign archetype} in your {house domain}. {combined strength/tension}."

### Step 2: Wire fallback into house card rendering

In `DashboardAstroSection.tsx`, update the house card rendering (lines 700-750):

Replace the thin one-liner (lines 729-735):
```tsx
{lang === "de"
  ? `${signDisplay} prägt das Lebensfeld ${meaning.name.de}.`
  : `${signDisplay} shapes your house of ${meaning.name.en}.`}
```

With:
```tsx
{houseText
  ? houseText.slice(0, 80) + (houseText.length > 80 ? "…" : "")
  : getHouseInterpretation(num!, sign, lang).slice(0, 80) + "…"}
```

And ensure the tooltip ALWAYS appears (not just when `houseText` exists):
```tsx
const tooltipContent = houseText || getHouseInterpretation(num!, sign, lang);
// Always wrap in <Tooltip>
```

### Step 3: Run type check

Run: `npm run lint`
Expected: No TypeScript errors

### Step 4: Visual verification

Run dev server, hover over houses:
- Every house shows a tooltip (not just ones with Gemini text)
- Tooltip text is substantive: mentions house meaning + sign effect + personal angle
- No generic "{Sign} shapes your house of {Name}" text remains

### Step 5: Commit

```bash
git add src/lib/astro-data/houseInterpretations.ts src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat(AN-20): rich house tooltips with sign-specific fallback interpretations"
```

---

## Task 4: Verify WuXing Bar Chart Uses Real API Data

**Goal:** Confirm the WuXing bar chart renders real per-user data, not defaults. Add console logging for verification.

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:194-210` (wuxingCounts extraction)
- Modify: `src/services/api.ts:214-248` (calculateWuxing mapping)

### Step 1: Read WuXing data extraction code

Read `src/components/dashboard/DashboardAstroSection.tsx:194-210` and `src/services/api.ts:214-248`.

### Step 2: Add development-only data verification logging

In `DashboardAstroSection.tsx`, after the `wuxingCounts` memo (line 198), add:

```tsx
// Development-only WuXing data verification
useEffect(() => {
  if (import.meta.env.DEV && Object.keys(wuxingCounts).length > 0) {
    console.log("[WuXing Verify] Raw API elements:", apiData.wuxing?.elements);
    console.log("[WuXing Verify] Fallback element_counts:", apiData.wuxing?.element_counts);
    console.log("[WuXing Verify] Mapped counts:", wuxingCounts);
    console.log("[WuXing Verify] Total:", totalCount, "Max:", maxCount, "Has data:", hasWuxingData);
  }
}, [wuxingCounts]);
```

### Step 3: Verify key mapping handles both German and English element keys

In `api.ts:calculateWuxing()` (lines 214-248), verify the mapping handles:
- BAFE returns `{ Wood: N, Fire: N, ... }` (English keys)
- OR `{ Holz: N, Feuer: N, ... }` (German keys)
- The current code at line 233-245 extracts both — verify this is correct

In `DashboardAstroSection.tsx:637`, the bar chart lookups use:
```tsx
const count = Number(wuxingCounts[el.key] ?? wuxingCounts[el.name.de] ?? 0);
```
Where `el.key` is English and `el.name.de` is German — this covers both cases. ✅

### Step 4: Check for silent fallback masking

In `api.ts:calculateWuxing()`, if the endpoint fails, the function returns empty WuXing data (from the `emptyApiData()` fallback at lines 264-288). Check that the fallback doesn't inject fake element counts.

Read `api.ts` lines 264-288 to verify `emptyApiData()` returns empty `elements: {}`.

### Step 5: Verify bar rendering with empty data

If `hasWuxingData` is false (all counts are 0), the chart shows a 100%-width faded bar for each element (lines 659-661). This is correct — it's a visual placeholder, not fake data.

### Step 6: Remove dev logging before commit (or gate behind flag)

Keep the logging gated behind `import.meta.env.DEV` — it won't appear in production builds.

### Step 7: Commit

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "fix(AN-20): verify WuXing bar chart data binding, add dev-mode verification logging"
```

---

## Task 5: Fix Gesamtanalyse Section — Eliminate Placeholder Text

**Goal:** Ensure the "Gesamtanalyse" section never shows placeholder text when real data is available. Investigate the data flow from Gemini → interpretation string → render.

**Files:**
- Modify: `src/components/dashboard/DashboardInterpretationSection.tsx`
- Read: `src/services/gemini.ts` (interpretation fetching)
- Read: `src/services/interpretation-templates.ts` (template fallback)
- Read: `server.mjs:39-83` (Gemini prompt)

### Step 1: Trace the interpretation data flow

1. `useAstroProfile.ts` calls `generateInterpretation(results, lang)` (line 147)
2. `gemini.ts` POSTs to `/api/interpret` on server (line 15)
3. `server.mjs` sends data to Gemini with `buildGeminiPrompt()` (line 1104)
4. Gemini returns JSON with `{ interpretation, tiles, houses }`
5. If Gemini fails, falls back to `interpretation-templates.ts` template text
6. If template is empty, falls back to static "Your cosmic profile is being calculated..." text (line 44-46)

### Step 2: Identify placeholder scenarios

Placeholder text appears when:
1. **Gemini API unavailable** (503 from server) → falls to template → falls to static text
2. **Gemini returns empty** → falls to template → falls to static text
3. **Profile loaded from Supabase but `storedInterpretation` is missing** → regenerates via Gemini (line 98-110)
4. **Regeneration fails** → sets "Dein kosmisches Profil wird geladen…" (line 107)

### Step 3: Improve the template fallback quality

The template fallback in `interpretation-templates.ts` already generates a multi-paragraph reading using Western + BaZi + WuXing data. Verify it produces output for any valid API data set.

Check: Does `generateTemplateInterpretation()` return empty string only when ALL data is empty? Yes — line 358 returns "" only if no paragraphs were built.

### Step 4: Improve the static fallback text

Replace the generic "Your cosmic profile is being calculated..." (gemini.ts:43-46) with a more informative message that acknowledges the data is real but AI interpretation is temporarily unavailable:

```tsx
const fallbackMsg = lang === "de"
  ? "## Dein kosmisches Profil\n\nDie KI-gestützte Interpretation ist derzeit nicht verfügbar. Deine astrologischen Daten wurden erfolgreich berechnet — die Karten oben zeigen dein vollständiges Profil. Die ausführliche Analyse wird automatisch generiert, sobald der Dienst wieder erreichbar ist."
  : "## Your Cosmic Profile\n\nThe AI-powered interpretation is currently unavailable. Your astrological data has been calculated successfully — the cards above show your complete profile. The detailed analysis will be generated automatically once the service is available again.";
```

### Step 5: Add loading state indicator to Gesamtanalyse

In `DashboardInterpretationSection.tsx`, when interpretation is empty or is the loading placeholder, show a subtle skeleton/loading indicator instead of placeholder text.

Add check:
```tsx
const isPlaceholder = !interpretation || interpretation.includes("wird berechnet") || interpretation.includes("being calculated");
```

If `isPlaceholder`, render a skeleton loading state instead of the text.

### Step 6: Visual verification

Run dev server:
- With Gemini available: rich personalized text appears
- Without Gemini (kill server): template text appears (still personalized, references signs/elements)
- With both failing: informative "unavailable" message, not generic placeholder

### Step 7: Commit

```bash
git add src/services/gemini.ts src/components/dashboard/DashboardInterpretationSection.tsx
git commit -m "fix(AN-20): eliminate placeholder text in Gesamtanalyse, improve fallback messaging"
```

---

## Task 6: Ensure Equal Card Sizing Within Rows

**Goal:** Cards within the same row must have identical height. Verify the existing Tailwind grid + flex layout enforces this.

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx` (card containers)

### Step 1: Audit Western Signs grid (3-col)

Lines 301-421: `grid md:grid-cols-3 gap-5`
Each card uses `morning-card p-5 sm:p-7 flex flex-col justify-between`.

The `grid` layout + `flex flex-col justify-between` should auto-equalize heights. But cards with zodiac artwork images may be taller. Check that `justify-between` pushes content and footer apart evenly.

**Fix if needed:** Add `min-h-0` or explicit `h-full` to ensure grid stretch behavior.

### Step 2: Audit BaZi grid (4-col)

Lines 429-590: `grid md:grid-cols-4 gap-5`
Same card structure. The Year Animal card has a large coin image (w-32/h-32) which may make it taller.

**Fix if needed:** Constrain the coin image area or let the grid stretch all cards to match.

### Step 3: Verify responsive behavior

- On mobile (< md): cards stack vertically → order preserved ✓
- On md+: 3-col and 4-col grids → cards stretch to same height ✓
- Check that no card has `h-auto` or other height-breaking styles

### Step 4: Test with browser DevTools

Run dev server, use Chrome DevTools responsive mode:
- 1440px width: 3-col and 4-col grids, equal heights
- 768px width: verify breakpoint behavior
- 375px width: single column, stacked

### Step 5: Fix any height inconsistencies found

Common fix: ensure all card divs have `h-full` when inside a grid.

### Step 6: Commit (only if changes needed)

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "style(AN-20): enforce equal card heights within grid rows"
```

---

## Task 7: Scale Down WuXing Bar Chart Card

**Goal:** The WuXing diagram card should be visually slightly smaller than the main sign cards (spec §4).

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:634` (WuXing card container)

### Step 1: Add max-width constraint to WuXing card

The WuXing bar chart is inside `morning-card p-6 md:p-8` (line 634). Add a max-width to make it visually smaller:

```tsx
<div className="morning-card p-5 md:p-6 max-w-2xl">
```

This constrains the card width while keeping it left-aligned within the section.

### Step 2: Reduce internal padding slightly

Change from `p-6 md:p-8` to `p-5 md:p-6` for a more compact feel.

### Step 3: Visual verification

The WuXing card should appear noticeably but not drastically smaller than the 3-col Western sign cards above.

### Step 4: Commit

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "style(AN-20): reduce WuXing bar chart card size per spec"
```

---

## Task 8: Remove Generic One-Liner from House Cards

**Goal:** Replace the thin "{Sign} prägt das Lebensfeld {House}" text in house cards with a richer preview from the tooltip content.

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:729-735`

### Step 1: Replace one-liner with tooltip preview

Currently (lines 729-735):
```tsx
{meaning && sign && (
  <p className="text-[9px] sm:text-[10px] text-[#1E2A3A]/40 leading-relaxed line-clamp-2">
    {lang === "de"
      ? `${signDisplay} prägt das Lebensfeld ${meaning.name.de}.`
      : `${signDisplay} shapes your house of ${meaning.name.en}.`}
  </p>
)}
```

Replace with a truncated preview of the tooltip content (from Task 3):
```tsx
{meaning && sign && (
  <p className="text-[9px] sm:text-[10px] text-[#1E2A3A]/40 leading-relaxed line-clamp-2">
    {(houseText || getHouseInterpretation(num!, sign, lang)).slice(0, 90)}…
  </p>
)}
```

This makes the card itself more informative while the tooltip shows the full text.

### Step 2: Commit

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "content(AN-20): replace generic house one-liners with interpretation previews"
```

---

## Task 9: Gesamtanalyse Full-Width Layout

**Goal:** Move Gesamtanalyse from a 2/3-width column to a full-width section below Houses.

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/dashboard/DashboardInterpretationSection.tsx:37` (remove `md:col-span-2`)

### Step 1: Remove grid wrapper from Dashboard.tsx

In Dashboard.tsx, the Interpretation section is currently inside a `md:grid-cols-3` grid (shared with Levi). Since Levi was moved to a slot in Task 1, remove the grid wrapper entirely and render InterpretationSection as a standalone full-width block.

### Step 2: Remove col-span from InterpretationSection

In `DashboardInterpretationSection.tsx` line 37:
```tsx
// Before:
<div className="morning-card p-5 sm:p-8 md:col-span-2">
// After:
<div className="morning-card p-5 sm:p-8">
```

### Step 3: Add max-width for readability

Add `max-w-4xl` to keep prose readable on wide screens:
```tsx
<div className="morning-card p-5 sm:p-8 max-w-4xl mx-auto">
```

### Step 4: Commit

```bash
git add src/components/Dashboard.tsx src/components/dashboard/DashboardInterpretationSection.tsx
git commit -m "style(AN-20): make Gesamtanalyse full-width below Houses"
```

---

## Task 10: Final Type Check, Build, and Visual QA

**Goal:** Ensure everything compiles and looks correct.

**Files:** All modified files

### Step 1: Run TypeScript check

Run: `npm run lint`
Expected: 0 errors (warnings OK)

### Step 2: Run build

Run: `npm run build`
Expected: Successful build

### Step 3: Run tests

Run: `npm run test`
Expected: All existing tests pass

### Step 4: Visual QA checklist

Start dev server (`npm run dev`) and verify:

- [ ] Western signs: 3 equal-sized cards horizontally (Sun → Moon → Asc)
- [ ] BaZi section: 4 equal-sized cards (Animal → Element → Day Master → Month Stem)
- [ ] Four Pillars: 4 stele cards with real pillar data
- [ ] WuXing bar chart: slightly smaller card, real per-user data, percentages vary
- [ ] Levi CTA: centered full-width rectangle, clearly visible button
- [ ] ElevenLabs widget: opens below Levi CTA when activated
- [ ] Houses: 12 cards, each with a substantive tooltip (hover to verify)
- [ ] No generic "{Sign} shapes your house" text visible
- [ ] Gesamtanalyse: full-width, real AI text (not "wird berechnet" placeholder)
- [ ] Responsive: mobile layout stacks cleanly with preserved order
- [ ] No console errors

### Step 5: Commit final

```bash
git add -A
git commit -m "chore(AN-20): final QA pass for dashboard layout overhaul"
```

---

## Data Gap Documentation

If during implementation you discover a **data problem** (not a layout problem), document it here:

| Field | Expected API Field | Actual Response | Current Fallback | Fix Needed |
|-------|-------------------|-----------------|------------------|------------|
| (fill during implementation) | | | | |

### Known Backend Gaps
- **WuXing distribution**: If BAFE returns only `dominant_element` but no `elements` counts, the bar chart shows empty bars. This is a backend gap — do NOT fabricate frontend data. Log it.
- **House texts**: If Gemini fails or doesn't return `houses` in its JSON response, house tooltips fall back to the static `getHouseInterpretation()` function (Task 3). This is acceptable.
