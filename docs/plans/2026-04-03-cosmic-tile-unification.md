# cosmic-tile Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all `morning-card` and `bright-card` usages with a single canonical `cosmic-tile` class, eliminating alias duplication and the Tailwind v4 `@apply` risk permanently.

**Architecture:** Pure search-replace — no logic changes. All selector groups in `index.css` collapse to `.cosmic-tile` only. All JSX `className` strings switch from `morning-card`/`bright-card` to `cosmic-tile`. Special-case CSS rules targeting `.morning-card` (ElevenLabs widget, mobile overrides, touch targets) are updated to target `.cosmic-tile` instead.

**Tech Stack:** Tailwind CSS v4, React TSX, Vite — no new dependencies.

---

## Scope

**5 TSX files touched** (purely className string changes, no logic):
- `src/components/CosmicWeatherCard.tsx` — 2 occurrences
- `src/components/dashboard/DashboardAstroSection.tsx` — 2 occurrences
- `src/components/dashboard/DashboardInterpretationSection.tsx` — 1 occurrence
- `src/components/dashboard/DashboardLeviSection.tsx` — 1 occurrence
- `src/pages/WuXingPage.tsx` — 4 occurrences

**1 CSS file touched** (`src/index.css`) — remove alias selectors and update special-case rules.

**No `.bright-card` usages in TSX exist** — only CSS; those selectors are removed entirely.

---

## Task 1: Clean `src/index.css` — remove alias selectors

**File:** `src/index.css`

### Step 1: Remove `.morning-card` and `.bright-card` from the base tile selector group

Find (around line 87–97):
```css
.cosmic-tile,
.morning-card,
.bright-card {
  background: var(--tile-bg);
  ...
}
```

Replace with:
```css
.cosmic-tile {
  background: var(--tile-bg);
  border: 1px solid var(--tile-border);
  border-radius: var(--radius-card);
  color: var(--tile-text-primary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all var(--ui-transition-duration, 0.3s) var(--ui-transition-easing, cubic-bezier(0.4, 0, 0.2, 1));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
```

### Step 2: Remove `.morning-card` and `.bright-card` from element-tint selectors

Find the block (around lines 102–116):
```css
body[data-element="Wood"]  .cosmic-tile:not(:is(.planetarium *)),
body[data-element="Wood"]  .morning-card:not(:is(.planetarium *)),
body[data-element="Wood"]  .bright-card:not(:is(.planetarium *))  { --tile-glow: rgba(61, 139, 55, 0.10); }
body[data-element="Fire"]  .cosmic-tile:not(:is(.planetarium *)),
body[data-element="Fire"]  .morning-card:not(:is(.planetarium *)),
body[data-element="Fire"]  .bright-card:not(:is(.planetarium *))  { --tile-glow: rgba(197, 48, 48, 0.10); }
body[data-element="Earth"] .cosmic-tile:not(:is(.planetarium *)),
body[data-element="Earth"] .morning-card:not(:is(.planetarium *)),
body[data-element="Earth"] .bright-card:not(:is(.planetarium *)) { --tile-glow: rgba(214, 158, 46, 0.10); }
body[data-element="Metal"] .cosmic-tile:not(:is(.planetarium *)),
body[data-element="Metal"] .morning-card:not(:is(.planetarium *)),
body[data-element="Metal"] .bright-card:not(:is(.planetarium *)) { --tile-glow: rgba(113, 128, 150, 0.10); }
body[data-element="Water"] .cosmic-tile:not(:is(.planetarium *)),
body[data-element="Water"] .morning-card:not(:is(.planetarium *)),
body[data-element="Water"] .bright-card:not(:is(.planetarium *)) { --tile-glow: rgba(43, 108, 176, 0.10); }
```

Replace with (one selector per rule):
```css
body[data-element="Wood"]  .cosmic-tile:not(:is(.planetarium *)) { --tile-glow: rgba(61, 139, 55, 0.10); }
body[data-element="Fire"]  .cosmic-tile:not(:is(.planetarium *)) { --tile-glow: rgba(197, 48, 48, 0.10); }
body[data-element="Earth"] .cosmic-tile:not(:is(.planetarium *)) { --tile-glow: rgba(214, 158, 46, 0.10); }
body[data-element="Metal"] .cosmic-tile:not(:is(.planetarium *)) { --tile-glow: rgba(113, 128, 150, 0.10); }
body[data-element="Water"] .cosmic-tile:not(:is(.planetarium *)) { --tile-glow: rgba(43, 108, 176, 0.10); }
```

### Step 3: Remove `.morning-card` and `.bright-card` from hover selector group

Find (around lines 118–124):
```css
.cosmic-tile:hover,
.morning-card:hover,
.bright-card:hover {
  border-color: var(--tile-accent);
  box-shadow: 0 8px 30px var(--tile-glow);
  transform: translateY(-2px);
}
```

Replace with:
```css
.cosmic-tile:hover {
  border-color: var(--tile-accent);
  box-shadow: 0 8px 30px var(--tile-glow);
  transform: translateY(-2px);
}
```

### Step 4: Update ElevenLabs widget special rule (~line 755)

Find:
```css
.morning-card:has(elevenlabs-convai),
div:has([data-agent-widget] elevenlabs-convai) {
```

Replace with:
```css
.cosmic-tile:has(elevenlabs-convai),
div:has([data-agent-widget] elevenlabs-convai) {
```

### Step 5: Update touch-target rule (~line 830)

Find:
```css
  .morning-card button,
  .morning-card a {
    min-height: 44px;
  }
```

Replace with:
```css
  .cosmic-tile button,
  .cosmic-tile a {
    min-height: 44px;
  }
```

### Step 6: Update mobile padding override for <768px (~line 853)

Find:
```css
  .morning-card {
    padding: 1rem;
    border-radius: 12px;
  }
```

Replace with:
```css
  .cosmic-tile {
    padding: 1rem;
    border-radius: 12px;
  }
```

### Step 7: Update mobile padding override for <375px (~line 871)

Find:
```css
  .morning-card {
    padding: 0.75rem;
    border-radius: 10px;
  }
```

Replace with:
```css
  .cosmic-tile {
    padding: 0.75rem;
    border-radius: 10px;
  }
```

### Step 8: Verify no `morning-card` or `bright-card` remain in index.css

Run:
```bash
grep -n "morning-card\|bright-card" src/index.css
```

Expected output: only the comment on the ElevenLabs rule (if any) — zero selector matches. If any selector matches appear, fix them before continuing.

### Step 9: Run build to confirm CSS is valid

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in X.XXs` — no Tailwind errors.

### Step 10: Commit CSS changes

```bash
git add src/index.css
git commit -m "refactor(css): unify tile classes — remove morning-card and bright-card aliases from index.css"
```

---

## Task 2: Update TSX files — replace `morning-card` with `cosmic-tile`

All changes are purely mechanical `className` string substitutions. No logic, no prop, no import changes.

### Step 1: CosmicWeatherCard.tsx

**File:** `src/components/CosmicWeatherCard.tsx`

Two occurrences:

**Line ~80** (loading skeleton):
```tsx
// Before
<div className="w-full max-w-md mx-auto morning-card rounded-2xl border border-[#8B6914]/20 p-5">
// After
<div className="w-full max-w-md mx-auto cosmic-tile rounded-2xl border border-[#8B6914]/20 p-5">
```

**Line ~117** (main card):
```tsx
// Before
<div className="morning-card rounded-2xl border border-[#8B6914]/25 overflow-hidden shadow-[0_2px_20px_rgba(139,105,20,0.06)]">
// After
<div className="cosmic-tile rounded-2xl border border-[#8B6914]/25 overflow-hidden shadow-[0_2px_20px_rgba(139,105,20,0.06)]">
```

### Step 2: DashboardAstroSection.tsx

**File:** `src/components/dashboard/DashboardAstroSection.tsx`

**Line ~280** (WuXing bar container):
```tsx
// Before
<div className="morning-card p-5 md:p-6 max-w-2xl">
// After
<div className="cosmic-tile p-5 md:p-6 max-w-2xl">
```

**Line ~322** (BaZi interpretation container):
```tsx
// Before
<div className="morning-card p-6 md:p-8">
// After
<div className="cosmic-tile p-6 md:p-8">
```

### Step 3: DashboardInterpretationSection.tsx

**File:** `src/components/dashboard/DashboardInterpretationSection.tsx`

**Line ~41**:
```tsx
// Before
<div className="morning-card p-5 sm:p-8 md:col-span-2 max-w-4xl mx-auto">
// After
<div className="cosmic-tile p-5 sm:p-8 md:col-span-2 max-w-4xl mx-auto">
```

### Step 4: DashboardLeviSection.tsx

**File:** `src/components/dashboard/DashboardLeviSection.tsx`

**Line ~68** (Levi card wrapper — this is the one with the ElevenLabs widget inside it):
```tsx
// Before
<div ref={leviSectionRef} className={`morning-card p-5 flex flex-col items-center gap-4 max-w-xs mx-auto relative text-center ${leviActive ? 'z-[99999]' : 'z-10'}`} style={{ overflow: 'visible' }}>
// After
<div ref={leviSectionRef} className={`cosmic-tile p-5 flex flex-col items-center gap-4 max-w-xs mx-auto relative text-center ${leviActive ? 'z-[99999]' : 'z-10'}`} style={{ overflow: 'visible' }}>
```

Note: The ElevenLabs CSS rule was already updated in Task 1 to target `.cosmic-tile:has(elevenlabs-convai)` — this change completes the wiring.

### Step 5: WuXingPage.tsx

**File:** `src/pages/WuXingPage.tsx`

Four occurrences — all `morning-card` → `cosmic-tile`:

**Line ~112:**
```tsx
// Before
<div className="morning-card p-10 text-center mb-12">
// After
<div className="cosmic-tile p-10 text-center mb-12">
```

**Line ~129:**
```tsx
// Before
className="morning-card p-8 flex flex-col items-center"
// After
className="cosmic-tile p-8 flex flex-col items-center"
```

**Line ~146:**
```tsx
// Before
className="morning-card p-8 flex flex-col items-center"
// After
className="cosmic-tile p-8 flex flex-col items-center"
```

**Line ~164:**
```tsx
// Before
className="morning-card p-6 md:p-10 mb-12"
// After
className="cosmic-tile p-6 md:p-10 mb-12"
```

### Step 6: Verify zero remaining occurrences

```bash
grep -rn "morning-card\|bright-card" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected output: **empty** — no matches at all.

### Step 7: Run full test suite

```bash
npm run test 2>&1 | tail -8
```

Expected: all tests pass (the one pre-existing flake in `vibes-perf.test.ts` is unrelated — a rate-limit issue on localhost API, not caused by CSS changes).

### Step 8: Run production build

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in X.XXs`

### Step 9: Commit TSX changes

```bash
git add src/components/CosmicWeatherCard.tsx \
        src/components/dashboard/DashboardAstroSection.tsx \
        src/components/dashboard/DashboardInterpretationSection.tsx \
        src/components/dashboard/DashboardLeviSection.tsx \
        src/pages/WuXingPage.tsx
git commit -m "refactor(ui): replace morning-card/bright-card with cosmic-tile in all JSX"
```

---

## Task 3: Final verification

### Step 1: Confirm zero aliases remain anywhere

```bash
grep -rn "morning-card\|bright-card" src/ --include="*.tsx" --include="*.ts" --include="*.css" --include="*.mjs"
```

Expected: **no output**.

### Step 2: Push and confirm Railway build passes

```bash
git push
```

Watch Railway deploy log — confirm build completes without Tailwind errors.

---

## Definition of Done

- [ ] Zero occurrences of `morning-card` or `bright-card` in `src/`
- [ ] `npm run build` completes without errors
- [ ] `npm run test` passes (excluding pre-existing `vibes-perf.test.ts` rate-limit flake)
- [ ] Railway production deploy succeeds
- [ ] Cards visually identical before/after (`.cosmic-tile` has all the same styles)
