# S09 Design-Fitting Sprint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 6 design audit findings using the new Design System V2 tokens. Result: consistent spacing, typography, colors, touch targets, and WCAG contrast across all screens.

**Architecture:** Each task targets one specific audit finding. All fixes use the V2 CSS tokens from `src/index.css` — no hardcoded values. Changes are CSS/Tailwind-only where possible, minimal JSX changes.

**Tech Stack:** Tailwind CSS v4, CSS custom properties, React (JSX class changes only)

---

### Task 1: Fix Navigation Crowding (5→5 items + mobile drawer)

**Files:**
- Modify: `src/components/navigation/NavVariantA.tsx`
- Modify: `src/components/navigation/NavSidebarA.tsx`

**Issue:** 5+ nav items + lang switch crowd the header on mobile.

**Step 1:** Read current nav components, verify max 5 primary items (ATLAS, SIGNATUR, SKY, WOCHE, LEVI). FAQ moves to footer or "..." overflow.

**Step 2:** Ensure mobile nav uses full-width drawer (top-down) pattern, not side hamburger. Touch targets ≥44px (`min-h-[var(--touch-min)]`).

**Step 3:** Active nav item uses underline animation (gold in dark, blue in bright): `border-b-2 border-current transition-all duration-300`.

**Step 4:** Run `npm run lint`

**Step 5:** Commit
```bash
git commit -m "fix(nav): enforce 5-item max, 44px touch targets, drawer mobile menu"
```

---

### Task 2: Fix Spacing Inconsistency (unified section gaps)

**Files:**
- Modify: `src/components/Dashboard.tsx` — section gaps
- Modify: `src/pages/WeeklyInsightsPage.tsx` — section gaps
- Modify: `src/pages/FuRingPage.tsx` — section gaps (if applicable)

**Issue:** Inconsistent vertical spacing between sections (some 16px, some 64px, some arbitrary).

**Step 1:** Replace all section-level `space-y-*` / `gap-*` / `mb-*` between major Dashboard sections with `gap-[var(--spacing-section)]` or Tailwind `gap-20` (80px).

**Step 2:** Card internal padding: standardize to `p-6` (24px) for standard cards, `p-4` (16px) for compact cards. No `p-8`, no `p-5`, no `p-3` for cards.

**Step 3:** Run `npm run lint && npx vitest run`

**Step 4:** Commit
```bash
git commit -m "fix(spacing): standardize 80px section gaps, 24px/16px card padding"
```

---

### Task 3: Fix Mobile Grid + Touch Targets

**Files:**
- Modify: `src/components/dashboard/DashboardBigFour.tsx` — grid
- Modify: `src/components/dashboard/InfluenceGauges.tsx` — touch targets
- Modify: `src/components/ClusterCard.tsx` — touch targets
- Audit: any `h-8`, `h-10` buttons → ensure ≥`h-11` (44px)

**Issue:** 4-column grids too narrow on mobile. Progress bars and small buttons below 44px touch target.

**Step 1:** DashboardBigFour: verify `grid-cols-2` on mobile, `grid-cols-4` on desktop. Already done? Verify.

**Step 2:** Search all components for buttons/links with `h-8` (32px) or `h-9` (36px) — replace with `min-h-[var(--touch-min)]` or `min-h-11`.

**Step 3:** InfluenceGauges: ensure gauge bars have `min-h-[var(--touch-min)]` if clickable.

**Step 4:** Run `npm run lint`

**Step 5:** Commit
```bash
git commit -m "fix(mobile): 2x2 grid on mobile, 44px min touch targets on all interactive elements"
```

---

### Task 4: Fix Color System (Wu-Xing element consistency)

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx` — Wu-Xing colors
- Modify: `src/pages/WuXingPage.tsx` — element colors
- Modify: Any component using hardcoded element colors

**Issue:** Inconsistent color mapping for astrological signs/elements. No systematic element→color logic.

**Step 1:** Search for hardcoded element colors: `grep -rn "#4CAF50\|#F44336\|#FF9800\|#9E9E9E\|#2196F3\|Wood.*color\|Fire.*color\|Earth.*color\|Metal.*color\|Water.*color" src/components/`.

**Step 2:** Replace all hardcoded element colors with CSS variable references: `var(--color-element-wood)`, etc. Or use the `data-element` attribute + `.card-element` class pattern.

**Step 3:** Verify WuXingPentagon, WuXingPage, DashboardAstroSection all use the same 5 colors from the token palette.

**Step 4:** Run `npm run lint`

**Step 5:** Commit
```bash
git commit -m "fix(colors): unify Wu-Xing element colors via CSS tokens (Wood/Fire/Earth/Metal/Water)"
```

---

### Task 5: Fix Typography Hierarchy (max 4 sizes per section)

**Files:**
- Modify: Components with mixed type scales
- Reference: `docs/DESIGN_SYSTEM_V2.md` typography scale

**Issue:** Too many font sizes in limited space. Mixed Cormorant/Sora/Inter usage.

**Step 1:** Search for `font-inter\|Inter` in component files — replace with `font-sans` (Sora is the default sans).

**Step 2:** Audit Dashboard sections: each section should use max 4 of the 5 type scale steps (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`).

**Step 3:** Ensure all headings use `font-serif` (Cormorant) and all body uses `font-sans` (Sora). No mixing within a text block.

**Step 4:** Fix decimal precision: search for `.toFixed(` with >2 decimal places. The transparency audit already fixed most — verify none remain.

**Step 5:** Run `npm run lint`

**Step 6:** Commit
```bash
git commit -m "fix(typography): enforce Sora body + Cormorant headings, max 4 sizes per section"
```

---

### Task 6: Fix WCAG Contrast (bright mode)

**Files:**
- Modify: Morning/bright-mode components
- Reference: `--color-text-bright-dim: #71717A` (4.5:1 on white)

**Issue:** Secondary text `#ADB5BD` on white fails WCAG 4.5:1. Minimum: `#71717A`.

**Step 1:** Search for `#ADB5BD` or similar light grays in Tailwind classes and inline styles. Also check `text-gray-400`, `text-gray-300` used in morning-mode contexts.

**Step 2:** Replace with `text-[var(--color-text-bright-dim)]` or Tailwind `text-zinc-500` (`#71717A`).

**Step 3:** Verify contrast on all bright-mode screens: Dashboard (morning-bg), any modals rendered on white.

**Step 4:** Run `npm run lint`

**Step 5:** Commit
```bash
git commit -m "fix(a11y): enforce WCAG 4.5:1 contrast — minimum #71717A on white backgrounds"
```

---

## Summary

| Task | Issue | Key Change | Risk |
|------|-------|------------|------|
| 1 | Nav crowding | 5-item max, 44px targets, drawer | Low |
| 2 | Spacing | 80px sections, 24px cards | Low |
| 3 | Mobile grid/touch | 2x2 grid, 44px min-h | Low |
| 4 | Element colors | CSS token variables | Low |
| 5 | Typography | Sora/Cormorant only, 4 sizes max | Med |
| 6 | WCAG contrast | #71717A minimum on white | Low |

**Dependency chain:** All 6 tasks are independent — can be executed in any order or parallel.
