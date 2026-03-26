# CR-07: Bereichsreihenfolge im unteren Dashboard anpassen

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorder the Dashboard lower sections so the WuXing element visualization appears before the BaZi text block. Visual-first, text-second.

**Architecture:** 1 task. The WuXing balance bars (Block C) and BaZi Four Pillars (Block B) live inside `DashboardAstroSection.tsx` within the PremiumGate. We swap Block C above Block B while keeping the shared header (Block A) and interpretation (Block D) in place.

**Tech Stack:** TypeScript, React 19, Tailwind CSS v4, Vitest

**GitHub Issue:** #173 — CR-07

---

## Task 1: Reorder WuXing above BaZi in DashboardAstroSection

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`

**Current order inside PremiumGate (lines 211–303):**
1. Block A: `SectionDivider` — "BaZi & WuXing" header (lines 214–218)
2. Block B: `BaZiFourPillars` — Four Pillars cards (lines 220–232)
3. Block C: WuXing Balance — element bars with tooltips (lines 234–291)
4. Block D: `BaZiInterpretation` — text interpretation (lines 293–301)

**Target order:**
1. Block A: Header (keep)
2. Block C: WuXing Balance (move up)
3. Block B: Four Pillars (move down)
4. Block D: Interpretation (keep)

### Step 1: Read the file

```bash
cat src/components/dashboard/DashboardAstroSection.tsx
```

Verify the blocks are at the expected line numbers.

### Step 2: Move Block C above Block B

In `DashboardAstroSection.tsx`, cut the entire Block C (WuXing Balance, from the `{/* Block C: Element Balance */}` comment through its closing `</div>` — lines 234–291) and paste it immediately after Block A's closing tag (line 218), before Block B starts.

The result inside the `<PremiumGate>` should be:

```tsx
<motion.div className="mb-12" {...fadeIn(0.3)}>
  {/* Block A: Header */}
  <SectionDivider ... />

  {/* Block C: Element Balance (moved up — visual first) */}
  <div className="mb-10">
    {/* ... WuXing bars ... */}
  </div>

  {/* Block B: Four Pillars (moved down) */}
  {apiData.bazi?.pillars && (
    <div className="mb-10">
      {/* ... BaZiFourPillars ... */}
    </div>
  )}

  {/* Block D: Interpretation */}
  <div className="morning-card p-6 md:p-8">
    <BaZiInterpretation ... />
  </div>
</motion.div>
```

No code changes — pure JSX reordering.

### Step 3: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (no type changes, only render order).

### Step 4: Full test run

```bash
npm run test 2>&1 | tail -10
```

Expected: all tests pass (no behavioral changes).

### Step 5: Commit

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat(cr07): reorder Dashboard — WuXing elements before BaZi Four Pillars

Visual-first: element balance bars now appear above the Four Pillars cards.
closes #173"
```

---

## Final Verification

```bash
npm run test && npx tsc --noEmit
```

**Manual check:**
1. Open Dashboard → scroll to BaZi & WuXing section
2. WuXing element bars (Holz/Feuer/Erde/Metall/Wasser) appear first
3. Four Pillars cards appear below the elements
4. Interpretation text remains at the bottom
5. No broken tooltips, links, or animations

**PR title:** `feat(cr07): Reorder Dashboard — WuXing elements before BaZi`

**Branch:** `feature/cr07-section-reorder`

**Closes:** #173
