# UI Guidelines Compliance Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all findings from the Web Interface Guidelines review — transition-all anti-pattern, BlueprintCard hardcoded dark bg, global reduced-motion gap, and the already-applied small fixes (ellipsis, aria-hidden, focus-visible).

**Architecture:** Pure CSS/className changes across dashboard components. No logic changes. The small fixes (Task 1) are already applied — just need commit. Remaining tasks address the 10x transition-all, 1x hardcoded bg, and 1x reduced-motion scope.

**Tech Stack:** Tailwind v4, CSS custom properties, React

---

### Task 1: Commit already-applied small fixes

The following are already done in the working tree:
- `DailyChartHero.tsx` — ChevronDown `aria-hidden="true"`, Warum? button `focus-visible:ring-1`, `transition-transform duration-200`
- `AgentSection.tsx:183` — `'...'` → `'…'`
- `DashboardLeviSection.tsx:99` — `'...'` → `'…'`

**Step 1: Run tests**

```bash
npx vitest run src/__tests__/daily-chart-hero.test.tsx
```
Expected: 31 PASS

**Step 2: Commit**

```bash
git add src/components/dashboard/DailyChartHero.tsx src/components/dashboard/AgentSection.tsx src/components/dashboard/DashboardLeviSection.tsx
git commit -m "fix(ui): ellipsis, aria-hidden, focus-visible per Web Interface Guidelines"
```

---

### Task 2: Replace transition-all with explicit properties (10 files)

Each `transition-all` should list only the properties that actually change on hover/interaction.

**Files + replacements:**

| File | Line | Current | Replacement |
|------|------|---------|-------------|
| `CosmicInfluenceSection.tsx:120` | `transition-all duration-1000` | `transition-[height] duration-1000` (bar height animates) |
| `TourOverlay.tsx:88` | `transition-all duration-300` | `transition-colors duration-300` (bg + border on hover) |
| `DashboardAstroSection.tsx:206` | `transition-all duration-1000` | `transition-[width] duration-1000` (progress bar width) |
| `BlueprintCard.tsx:37` | `transition-all duration-500` | `transition-[border-color] duration-500` (border glow on hover) |
| `VibesSection.tsx:63` | `transition-all duration-300` | `transition-[border-color] duration-300` |
| `LeviOrb.tsx:24` | `transition-all duration-700` | `transition-[transform,filter] duration-700` (scale + blur) |
| `ResonanzSnapshot.tsx:18` | `transition-all` | `transition-colors` (bg/border/text color) |
| `SkyModeToggle.tsx:17` | `transition-all duration-300` | `transition-colors duration-300` |
| `DashboardHeroNav.tsx:67` | `transition-all duration-300` | `transition-[background-color,border-color,transform] duration-300` |
| `BlueprintReveal.tsx:72` | `transition-all duration-300` | `transition-colors duration-300` |

**Step 1: Apply all 10 replacements**

**Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: 1795 PASS

**Step 3: Commit**

```bash
git add src/components/dashboard/
git commit -m "perf(ui): replace transition-all with explicit properties in dashboard"
```

---

### Task 3: BlueprintCard — mode-aware background

**File:** `src/components/dashboard/BlueprintCard.tsx:37`

Current: `bg-[#0A0A14]/80` — hardcoded dark, renders dark in bright mode too.

**Step 1: Replace with CSS var**

```tsx
// Before:
className="relative bg-[#0A0A14]/80 backdrop-blur-xl border border-[#D4AF37]/15 ..."

// After:
className="relative backdrop-blur-xl border border-[#D4AF37]/15 ..."
style={{ background: 'var(--tile-bg)' }}
```

Note: `--tile-bg` is already defined for both modes in `index.css`.

**Step 2: Run tests**

```bash
npx vitest run
```

**Step 3: Commit**

```bash
git add src/components/dashboard/BlueprintCard.tsx
git commit -m "fix(theme): BlueprintCard use --tile-bg for mode-aware background"
```

---

### Task 4: Expand prefers-reduced-motion scope to dashboard

**File:** `src/index.css` — around line 845

Current scope: `.landing-hero-root`, `.enter-screen` only.

**Step 1: Expand the rule**

```css
@media (prefers-reduced-motion: reduce) {
  .landing-hero-root *, .landing-hero-root ::before, .landing-hero-root ::after,
  .enter-screen *, .enter-screen ::before, .enter-screen ::after,
  .daily-chart-hero *, .cosmic-tile * {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0s !important;
  }
}
```

This covers `DailyChartHero` (`.daily-chart-hero` class) and all `cosmic-tile` cards.

**Step 2: Run tests**

```bash
npx vitest run
```

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "a11y: expand prefers-reduced-motion to dashboard cosmic-tile cards"
```

---

## Done Criteria

| Finding | Severity | Task | Status |
|---------|----------|------|--------|
| Ellipsis `...` → `…` | Minor | 1 | Applied |
| ChevronDown missing aria-hidden | Minor | 1 | Applied |
| Warum? button missing focus-visible | Minor | 1 | Applied |
| 10x transition-all anti-pattern | Low | 2 | |
| BlueprintCard hardcoded dark bg | Medium | 3 | |
| prefers-reduced-motion dashboard gap | Medium | 4 | |
