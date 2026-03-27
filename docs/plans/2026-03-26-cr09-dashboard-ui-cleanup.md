# CR-09: Dashboard UI-Fehler bereinigen — Sammelpunkt

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit the Dashboard for remaining visual inconsistencies, unnecessary text, non-functional elements, and layout noise. Fix identified issues in a single sweep.

**Architecture:** 3 tasks. Task 1 is a visual audit that produces a concrete sub-issue list. Task 2 fixes identified issues. Task 3 runs the full test suite and commits.

**Tech Stack:** TypeScript, React 19, Tailwind CSS v4, Vitest

**GitHub Issue:** #177 — CR-09

**Note:** CR-09 is a Sammelpunkt (collection ticket). Several sub-issues overlap with already-fixed CR tickets (CR-01 through CR-04, S-DP-01 through S-DP-22). This plan focuses on NEW issues not yet addressed.

---

## Task 1: Visual Audit — Identify remaining issues

**Files:**
- Read: `src/components/Dashboard.tsx`
- Read: `src/components/dashboard/DashboardAstroSection.tsx`
- Read: `src/components/dashboard/AstroAccordion.tsx`
- Read: `src/components/dashboard/InfluenceGauges.tsx`
- Read: `src/components/dashboard/DashboardLeviSection.tsx`
- Read: `src/components/dashboard/DashboardInterpretationSection.tsx`
- Read: `src/components/dashboard/BlueprintCard.tsx`

### Step 1: Run the app and audit each section

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npm run dev
```

Open `http://localhost:3000` in browser. Walk through each Dashboard section top-to-bottom. For each, check:

**Audit checklist:**
- [ ] No orphan text (text without purpose or that repeats nearby text)
- [ ] No non-functional buttons/links (anything clickable that does nothing)
- [ ] No EN/DE language mix (all user-facing text in correct language per `useLanguage`)
- [ ] No layout jank (overlapping elements, broken spacing, cut-off text)
- [ ] No debug/dev artifacts visible in production mode
- [ ] Section spacing is consistent (mb-10/mb-12/mb-16 pattern)
- [ ] All icons render (no broken SVG or missing assets)
- [ ] Dark mode contrast: all text readable on obsidian background

### Step 2: Document findings

Create a comment in #177 with the concrete list:

```bash
gh issue comment 177 --body "## Visual Audit Results ($(date +%Y-%m-%d))

### Already fixed by prior CRs
- CR-01: Auth separation ✅
- CR-02: Planetarium default ✅
- CR-03a/b: Neustarten + Zahlung entfernen ✅
- CR-04: Redundante Textzeilen ✅
- S-DP series: Ghost UI, KI-Synthese, Blueprint text, Wu-Xing Wind ✅

### New issues found
[List each issue with section name, description, and severity]

### Recommendation
[Which issues to fix in this PR vs defer]"
```

### Step 3: Commit audit results

No code change in this task — just documentation.

---

## Task 2: Fix identified issues

**Files:** Determined by audit in Task 1. Common targets:

### Known cleanup candidates (from code review):

**2a. InfluenceGauges uses hardcoded German**

In `InfluenceGauges.tsx` (line 53), the heading "Heutige Einflüsse" is hardcoded German. Should respect `useLanguage()`.

**Fix:**
```typescript
// Add at top:
import { useLanguage } from '../../contexts/LanguageContext';

// In component:
const { lang } = useLanguage();

// Replace line 53:
<h2 ...>{lang === 'de' ? 'Heutige Einflüsse' : "Today's Influences"}</h2>
```

**2b. "LIVE FEED" badge in InfluenceGauges**

Line 54: "LIVE FEED" text appears but the data is static defaults. Either:
- Remove the badge (honest), OR
- Change to "TRANSIT DATA" (less misleading)

Recommendation: change to a neutral label.

**Fix:**
```tsx
// Replace "LIVE FEED" with:
<div className="text-[8px] font-mono text-zinc-600">TRANSIT</div>
```

**2c. Section spacing audit**

Walk `Dashboard.tsx` section margins:
- CosmicWeatherCard: `mb-10` (line 327 wrapper)
- UpgradeBanner: `mb-12` (line 341)
- AstroSection: internal
- MiniSignature: `mb-12 sm:mb-16`
- Levi: `mb-12 sm:mb-16`
- InfluenceGauges: `mb-10`
- BlueprintCard: `mb-10`
- Interpretation: `mb-12 sm:mb-16`
- ShareCard: `mb-16`

The `mb-10` on InfluenceGauges and Blueprint feels tight compared to `mb-12` on other sections. Normalize to `mb-12 sm:mb-16` for visual consistency.

**Fix in Dashboard.tsx:**
```tsx
// Line 405: change mb-10 to mb-12 sm:mb-16
<motion.div className="mb-12 sm:mb-16" {...fadeIn(0.42)}>

// Line 412: change mb-10 to mb-12 sm:mb-16
<motion.div className="mb-12 sm:mb-16" {...fadeIn(0.45)}>
```

### Step: Apply fixes

For each fix above, make the edit, then run:
```bash
npx tsc --noEmit 2>&1 | head -10
```

### Step: Run tests

```bash
npm run test 2>&1 | tail -10
```

### Step: Commit

```bash
git add -u
git commit -m "fix(cr09): Dashboard UI cleanup — i18n heading, LIVE FEED badge, spacing

- InfluenceGauges heading now respects language context (DE/EN)
- Replaced misleading 'LIVE FEED' badge with 'TRANSIT'
- Normalized section spacing to mb-12 sm:mb-16
closes #177"
```

---

## Task 3: Final verification + any additional fixes from audit

### Step 1: Full test suite

```bash
npm run test 2>&1 | tail -10
```

### Step 2: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

### Step 3: Visual re-check

Open Dashboard again, confirm all audit findings are resolved. If Task 1 found additional issues beyond 2a/2b/2c, fix them now and commit separately with descriptive message.

---

## Final Verification

```bash
npm run test && npx tsc --noEmit
```

**Manual check:**
1. Switch language to EN → "Today's Influences" heading appears
2. Switch language to DE → "Heutige Einflüsse" heading appears
3. "TRANSIT" badge (not "LIVE FEED")
4. Section spacing is even (no cramped sections)
5. No orphan text, no broken buttons, no debug artifacts

**PR title:** `fix(cr09): Dashboard UI cleanup — i18n, spacing, badge`

**Branch:** `feature/cr09-dashboard-ui-cleanup`

**Closes:** #177
