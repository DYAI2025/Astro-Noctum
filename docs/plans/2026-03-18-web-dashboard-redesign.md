# Web Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize the Bazodiac web Dashboard from a flat morning-light card layout into a premium cosmic experience using the new Shadcn UI components (Button, Card, Badge), animated icons, and glass effects — while keeping all existing functionality intact.

**Architecture:** Incremental component replacement — swap `morning-card` divs with Shadcn `Card` components, replace Lucide icons with animated icons from `src/components/animated-icons/`, upgrade buttons to Shadcn `Button` variants, and add visual polish (gold glows, glass effects, better spacing). The Planetarium dark mode and tour overlay continue working unchanged.

**Tech Stack:** React 19, Tailwind CSS v4, Shadcn UI (Card, Button, Badge), animated-icons, Framer Motion, existing Bazodiac theme tokens

---

## Context for Implementor

### Current Design Language
The Dashboard uses a "morning" theme — light cream background (`#faf8f3`), dark text (`#1E2A3A`), gold accents (`#8B6914`). Cards use `morning-card` CSS class (white/70 bg, subtle border). Planetarium mode toggles to dark.

### New Design Direction
Keep the morning light base (users like it), but upgrade:
- **Cards**: From flat white to glass-morphic with better shadows and hover states
- **Buttons**: From inline styled to Shadcn Button variants with gold theming
- **Icons**: From Lucide static to animated SVG icons (hover effects)
- **Badges/Labels**: From plain text to Shadcn Badge components
- **Spacing**: Standardize to 8px grid
- **Typography**: Better hierarchy with Cormorant Garamond for headers

### Files overview
```
src/components/Dashboard.tsx               — Main orchestrator (264 lines)
src/components/dashboard/
  ├── DashboardAstroSection.tsx            — Orrery + Western + BaZi/WuXing (largest)
  ├── DashboardInterpretationSection.tsx   — AI interpretation
  ├── DashboardLeviSection.tsx             — Voice agent
  ├── SectionErrorBoundary.tsx             — Error fallback
  ├── AstroAccordion.tsx                   — Sun/Moon/Asc accordion
  ├── AstroAccordionTile.tsx               — Individual accordion tile
  ├── BlueprintCard.tsx                    — Cosmic blueprint card
  ├── TourOverlay.tsx                      — Onboarding tour
  └── DailyHoroscopeModal.tsx              — Daily modal
```

### Available components
```typescript
// Shadcn UI (src/components/ui/)
import { Button } from "../ui/button";           // 6 variants
import { Card, CardHeader, CardContent } from "../ui/card";  // 6 variants
import { Badge } from "../ui/badge";              // 6 variants

// Animated Icons (src/components/animated-icons/)
import { ZodiacIcon, WuXingIcon } from "../animated-icons/CosmicSymbols";
import { IconSun, IconMoon, IconZap, IconCrown, IconWand } from "../animated-icons";
```

---

### Task 1: Upgrade Dashboard header and buttons

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Replace the back button and regenerate button with Shadcn Button**

Import and replace:
```typescript
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
```

Replace back button (line 276-281):
```tsx
<Button variant="ghost" size="sm" onClick={onReset} className="mb-10 text-[10px] uppercase tracking-[0.3em]">
  <ArrowLeft className="w-4 h-4" /> {t("dashboard.startOver")}
</Button>
```

Replace regenerate button (line 312-319):
```tsx
<Button variant="outline" size="icon" onClick={onRegenerate} disabled={isLoading} title="Regenerate">
  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
</Button>
```

**Step 2: Upgrade the upgrade banner with Shadcn Card + Button**

Replace the upgrade banner div (line 335-351) with:
```tsx
<Card variant="gold" className="mb-8 p-5 flex items-center justify-between gap-4">
  <div>
    <p className="text-sm font-medium text-ink">{...}</p>
    <p className="text-xs text-ink/50 mt-1">{...}</p>
  </div>
  <UpgradeButton />
</Card>
```

**Step 3: Verify build**
```bash
npm run build
```

**Step 4: Commit**
```bash
git add src/components/Dashboard.tsx
git commit -m "feat: upgrade Dashboard header + buttons to Shadcn components"
```

---

### Task 2: Upgrade DashboardLeviSection with Card + animated icons

**Files:**
- Modify: `src/components/dashboard/DashboardLeviSection.tsx`

**Step 1: Replace the morning-card div with Shadcn Card**

Import:
```typescript
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { IconWand } from "../animated-icons";
```

Replace the outer `<div className="morning-card ...">` with `<Card variant="glass" className="p-5 sm:p-7">`.

Replace the call/hangup buttons with Shadcn Button:
```tsx
<Button
  variant={leviActive ? "destructive" : "outline"}
  className="w-full"
  onClick={leviActive ? handleHangUp : handleCallLevi}
>
  {leviActive ? <><PhoneOff className="w-4 h-4" /> {t('...')}</> : <><Phone className="w-4 h-4" /> {t('...')}</>}
</Button>
```

Replace the status dot text with Badge:
```tsx
<Badge variant={leviActive ? "success" : "default"}>
  {leviActive ? t('dashboard.levi.active') : t('dashboard.levi.ready')}
</Badge>
```

**Step 2: Verify build**
```bash
npm run build
```

**Step 3: Commit**
```bash
git add src/components/dashboard/DashboardLeviSection.tsx
git commit -m "feat: upgrade Levi section with Shadcn Card, Button, Badge"
```

---

### Task 3: Upgrade DashboardInterpretationSection

**Files:**
- Modify: `src/components/dashboard/DashboardInterpretationSection.tsx`

**Step 1: Replace morning-card with Shadcn Card**

Import:
```typescript
import { Card, CardHeader, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
```

Replace outer div with `<Card variant="glass" className="md:col-span-2">`.
Replace the section label span with `<Badge>`.
Replace the PremiumGate teaser button with `<Button variant="premium">`.

**Step 2: Verify build**
```bash
npm run build
```

**Step 3: Commit**
```bash
git add src/components/dashboard/DashboardInterpretationSection.tsx
git commit -m "feat: upgrade Interpretation section with Shadcn Card + Badge"
```

---

### Task 4: Upgrade WuXing bars with animated element icons

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`

**Context:** Already partially done — `WuXingIcon` was imported and used to replace chinese character emojis. Now upgrade the WuXing section card and the dominant element display.

**Step 1: Import Card + Badge**

```typescript
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
```

**Step 2: Replace the WuXing bar section morning-card**

Find `<div className="morning-card p-5 md:p-6 max-w-2xl">` in the WuXing section and replace with:
```tsx
<Card variant="elevated" className="p-5 md:p-6 max-w-2xl">
```

**Step 3: Replace the "WUXING" badge text**

Find `<Badge text="WUXING" />` or similar label and replace with:
```tsx
<Badge variant="default">WuXing 五行</Badge>
```

**Step 4: Verify build**
```bash
npm run build
```

**Step 5: Commit**
```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat: upgrade WuXing section with Shadcn Card + Badge + animated icons"
```

---

### Task 5: Upgrade Houses grid cards

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`

**Context:** The houses grid already uses `ZodiacIcon` (from previous commit). Now upgrade the individual house cards.

**Step 1: Replace house card divs with Shadcn Card**

Find the house card rendering in the grid map. Replace:
```tsx
<div className="morning-card p-3 ...">
```
With:
```tsx
<Card variant="default" className="p-3 hover:border-gold/20 transition-all">
```

This gives each house card a glass effect and gold border on hover.

**Step 2: Verify build**
```bash
npm run build
```

**Step 3: Commit**
```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat: upgrade houses grid to Shadcn Card with hover effects"
```

---

### Task 6: Add animated icons to section headers

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`

**Step 1: Add animated icons next to section titles**

Import additional icons:
```typescript
import { IconSun, IconMoonStar, IconOrbit, IconZap } from "../animated-icons";
```

Add icons to section dividers:
- BaZi & WuXing section: `<IconOrbit className="w-5 h-5 text-gold-deep inline-block mr-2" />`
- Western Houses section: `<IconSun className="w-5 h-5 text-gold-deep inline-block mr-2" />`

These icons animate on hover, adding life to the page as users scroll.

**Step 2: Verify build**
```bash
npm run build
```

**Step 3: Commit**
```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat: add animated icons to Dashboard section headers"
```

---

### Task 7: CSS polish — glass effects and gold glows

**Files:**
- Modify: `src/index.css`

**Step 1: Enhance the morning-card class with better glass effect**

Update `.morning-card` to have a subtler, more premium glass look:

```css
.morning-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 105, 20, 0.08);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.morning-card:hover {
  border-color: rgba(139, 105, 20, 0.15);
  box-shadow: 0 8px 32px rgba(139, 105, 20, 0.04), 0 0 0 1px rgba(139, 105, 20, 0.06);
}
```

**Step 2: Add a `.gold-glow` utility class**

```css
.gold-glow {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.08), 0 0 60px rgba(212, 175, 55, 0.04);
}
```

**Step 3: Verify visual changes**
```bash
npm run dev
```

Open http://localhost:3000 and verify cards have the glass effect.

**Step 4: Commit**
```bash
git add src/index.css
git commit -m "feat: enhance glass card effects and add gold-glow utility"
```

---

### Task 8: Build gate + visual verification

**Step 1: Full build**
```bash
npm run build
```

**Step 2: Run tests**
```bash
npm run test
```

**Step 3: Visual check**
Start dev server and verify:
- [ ] Header buttons use Shadcn styling
- [ ] Upgrade banner has Card gold variant
- [ ] Levi section uses Card glass + Badge
- [ ] Interpretation section uses Card glass
- [ ] WuXing bars have animated element icons
- [ ] Houses grid cards have hover effects
- [ ] Section headers have animated icons
- [ ] Glass effects look premium
- [ ] Planetarium dark mode still works
- [ ] Tour overlay still works
- [ ] No layout shifts or broken spacing

**Step 4: Commit and push**
```bash
git push origin main
```

---

## Summary

| Task | What | Impact |
|------|------|--------|
| 1 | Header + buttons → Shadcn | High — first thing users see |
| 2 | Levi section → Card + Badge | Medium — voice agent area |
| 3 | Interpretation → Card | Medium — AI section |
| 4 | WuXing → animated icons + Card | High — visual identity |
| 5 | Houses grid → Card hover | Medium — detail area |
| 6 | Section headers → animated icons | Medium — scroll experience |
| 7 | CSS glass effects | High — overall premium feel |
| 8 | Build + visual verification | Required — quality gate |

**Estimated effort:** 1-2 Stunden mit Subagents, 2-3 Stunden manuell.

**Was sich NICHT ändert:**
- Dashboard.tsx Orchestrator-Logik (tour, daily modal, profile fetch)
- DashboardAstroSection Orrery/BirthSky
- AstroAccordion Sun/Moon/Asc tiles
- Data flow (apiData, hooks, Supabase)
- Planetarium dark mode toggle
- Tour overlay
