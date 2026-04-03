# Bright Mode Review Fixes (#1 + #2) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two blocking issues flagged in the `/code-reviewer` pass: broken hover opacity on the Vertiefen button, and fragmented CSS variable declarations in index.css.

**Architecture:** Two surgical edits — no new abstractions. Fix #1 moves `opacity` from an inline style (which defeats Tailwind hover) to a Tailwind utility class. Fix #2 merges the second `:root` and `.planetarium` blocks added during the bright-mode sprint into the canonical first blocks, then removes the duplicate sections.

**Tech Stack:** React/TSX, Tailwind v4, plain CSS custom properties.

---

### Task 1: Fix hover opacity on Vertiefen button (DashboardTagesEnergie.tsx)

**Files:**
- Modify: `src/components/dashboard/DashboardTagesEnergie.tsx:442-443`
- Test: `src/__tests__/dashboard-tages-energie.test.tsx` (existing — run to confirm no regression)

**Background:**
Tailwind utility classes like `hover:opacity-80` are CSS rules. Inline `style={{ opacity: 0.5 }}` has higher CSS specificity, so the hover class silently has no effect. The fix is to remove `opacity` from the inline style and express the base opacity as a Tailwind class (`opacity-50`), leaving only `color` in the inline style.

**Step 1: Open the file and locate the button**

```
src/components/dashboard/DashboardTagesEnergie.tsx  line ~440
```

Current code:
```tsx
<button
  onClick={onOpenDayModal}
  className="w-full flex items-center justify-end gap-1 px-5 py-3 text-[9px] font-sans uppercase tracking-wider transition-colors tages-impuls-divider hover:opacity-80"
  style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
>
```

**Step 2: Apply the fix**

Change to:
```tsx
<button
  onClick={onOpenDayModal}
  className="w-full flex items-center justify-end gap-1 px-5 py-3 text-[9px] font-sans uppercase tracking-wider transition-opacity tages-impuls-divider opacity-50 hover:opacity-80"
  style={{ color: 'var(--tile-text-secondary)' }}
>
```

Key changes:
- `transition-colors` → `transition-opacity` (we're animating opacity, not color)
- Add `opacity-50` to className (base state)
- Remove `opacity: 0.5` from inline style (only `color` remains)

**Step 3: Run type check**

```bash
npm run lint
```
Expected: no errors.

**Step 4: Run tests**

```bash
npm run test
```
Expected: same pass rate as before (1064/1065 — the one pre-existing failure in `birthform-validation` is unrelated).

**Step 5: Commit**

```bash
git add src/components/dashboard/DashboardTagesEnergie.tsx
git commit -m "fix(dashboard): restore hover opacity on Vertiefen button — inline style was defeating Tailwind hover class"
```

---

### Task 2: Merge fragmented CSS variable blocks in index.css

**Files:**
- Modify: `src/index.css` (lines ~49–71 and ~292–300)

**Background:**
During the bright-mode sprint a second `:root` block and second `.planetarium` block were added at line ~292 to define `--color-text-bright-dim`. CSS merges multiple same-selector blocks but this fragments the single source of truth. The canonical `:root` block is at line 49 and `.planetarium` at line 63 — the new variable belongs there.

**Step 1: Locate the two blocks to merge**

In `src/index.css`:

**Existing `:root` block (lines ~49–61)** — add `--color-text-bright-dim` here:
```css
:root {
  /* Default: Morning (Light) Tile Settings */
  --tile-bg: rgba(255, 255, 255, 0.85);
  --tile-border: rgba(30, 41, 59, 0.08);
  --tile-text-primary: #1E293B;
  --tile-text-secondary: rgba(30, 41, 59, 0.6);
  --tile-accent: #92400E;
  --tile-glow: rgba(146, 64, 14, 0.05);

  --c-obsidian:  #00050A;
  --c-gold:      #D4AF37;
  --c-gold-glow: rgba(212, 175, 55, 0.4);
}
```

**Existing `.planetarium` block (lines ~63–71)** — add `--color-text-bright-dim` here:
```css
.planetarium {
  /* Planetarium (Dark) Tile Settings */
  --tile-bg: rgba(13, 15, 20, 0.85);
  --tile-border: rgba(212, 175, 55, 0.15);
  --tile-text-primary: rgba(255, 255, 255, 0.92);
  --tile-text-secondary: rgba(255, 255, 255, 0.6);
  --tile-accent: #D4AF37;
  --tile-glow: rgba(212, 175, 55, 0.08);
}
```

**Duplicate blocks to DELETE (lines ~292–300)**:
```css
/* ── Missing CSS variables (referenced in components) ──────────────────── */

:root {
  --color-text-bright-dim: rgba(30, 41, 59, 0.45);  /* #1E293B/45 — dim secondary on light bg */
}

.planetarium {
  --color-text-bright-dim: rgba(255, 255, 255, 0.40);  /* white/40 — dim secondary on dark bg */
}
```

**Step 2: Add variable to the existing `:root` block**

After `--c-gold-glow` and before the closing `}`:
```css
:root {
  /* Default: Morning (Light) Tile Settings */
  --tile-bg: rgba(255, 255, 255, 0.85);
  --tile-border: rgba(30, 41, 59, 0.08);
  --tile-text-primary: #1E293B;
  --tile-text-secondary: rgba(30, 41, 59, 0.6);
  --tile-accent: #92400E;
  --tile-glow: rgba(146, 64, 14, 0.05);
  --color-text-bright-dim: rgba(30, 41, 59, 0.45);

  --c-obsidian:  #00050A;
  --c-gold:      #D4AF37;
  --c-gold-glow: rgba(212, 175, 55, 0.4);
}
```

**Step 3: Add variable to the existing `.planetarium` block**

```css
.planetarium {
  /* Planetarium (Dark) Tile Settings */
  --tile-bg: rgba(13, 15, 20, 0.85);
  --tile-border: rgba(212, 175, 55, 0.15);
  --tile-text-primary: rgba(255, 255, 255, 0.92);
  --tile-text-secondary: rgba(255, 255, 255, 0.6);
  --tile-accent: #D4AF37;
  --tile-glow: rgba(212, 175, 55, 0.08);
  --color-text-bright-dim: rgba(255, 255, 255, 0.40);
}
```

**Step 4: Delete the duplicate section**

Remove the entire block (heading comment + both selectors + their contents) that starts with `/* ── Missing CSS variables` at line ~292. The `.wuxing-bar-track`, `.wuxing-bar-fill` and the mode-aware tile classes below it are NOT deleted — only the two duplicate `:root`/`.planetarium` declarations.

The section to delete is exactly:
```css
/* ── Missing CSS variables (referenced in components) ──────────────────── */

:root {
  --color-text-bright-dim: rgba(30, 41, 59, 0.45);  /* #1E293B/45 — dim secondary on light bg */
}

.planetarium {
  --color-text-bright-dim: rgba(255, 255, 255, 0.40);  /* white/40 — dim secondary on dark bg */
}

```
(9 lines including the trailing blank line)

**Step 5: Run type check + build sanity**

```bash
npm run lint
```
Expected: no errors.

**Step 6: Run tests**

```bash
npm run test
```
Expected: 1064/1065 passing (same as before).

**Step 7: Commit**

```bash
git add src/index.css
git commit -m "fix(css): merge duplicate :root/.planetarium blocks — consolidate --color-text-bright-dim into canonical variable declarations"
```

---

### Task 3: Verify both fixes together

**Step 1: Run full lint + test**

```bash
npm run lint && npm run test
```
Expected: lint clean, 1064/1065 tests pass.

**Step 2: Verify no CSS regressions**

Open browser dev tools on the dashboard in bright mode and check:
- `computed` value of `--color-text-bright-dim` on `:root` should be `rgba(30, 41, 59, 0.45)`
- Switching to planetarium mode should show `rgba(255, 255, 255, 0.40)`
- Click "Vertiefen →" button area — should visually fade in on hover

**Step 3: Ship**

```bash
git log --oneline -3
```
Confirm two clean commits, then push.
