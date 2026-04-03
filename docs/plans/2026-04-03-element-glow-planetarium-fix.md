# Element Glow Planetarium Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent element-tinted card hover glows from overriding gold glow inside `.planetarium` (dark mode).

**Architecture:** Pure CSS fix — add `:not(:is(.planetarium *))` to each `body[data-element]` selector so the rules only match cards that are NOT inside a `.planetarium` ancestor. No JS changes, no hook changes, no new dependencies.

**Tech Stack:** CSS custom properties, `:is()` / `:not()` pseudo-classes (Chrome 88+, Firefox 78+, Safari 14+)

---

## Background: Why this happens

`src/index.css` has two relevant CSS rules for `--tile-glow`:

```css
/* Rule A — on the .planetarium wrapper div */
.planetarium {
  --tile-glow: rgba(212, 175, 55, 0.08);  /* gold */
}

/* Rule B — set DIRECTLY on .cosmic-tile elements */
body[data-element="Wood"] .cosmic-tile { --tile-glow: rgba(61, 139, 55, 0.10); }
```

CSS custom property inheritance: when `.cosmic-tile` resolves `var(--tile-glow)` for its box-shadow, it checks its own element first. Rule B sets the property **on the `.cosmic-tile` element itself** (specificity `0,2,1`). Rule A sets it on the `.planetarium` wrapper and would only be inherited — but Rule B's direct assignment wins regardless of inheritance. A counter-rule `.planetarium .cosmic-tile { --tile-glow: gold }` would have specificity `0,2,0` and lose.

**Fix:** Restrict Rule B so it only matches `.cosmic-tile` elements that are NOT descendants of `.planetarium`:

```css
body[data-element="Wood"] .cosmic-tile:not(:is(.planetarium *)) { ... }
```

`:is(.planetarium *)` is "an element that is a descendant of `.planetarium`". `:not(:is(.planetarium *))` excludes those. Specificity with `:is()` is the specificity of the most-specific argument inside: `.planetarium *` = `0,1,0`. So the full rule is `0,2,1` (body type + attribute + class + :not/:is pseudo = 0,3,1 roughly), which is fine — it still wins in bright mode and correctly doesn't match in dark mode.

---

## Task 1: Update `body[data-element]` glow rules in `src/index.css`

**Files:**
- Modify: `src/index.css:104–119`

### Step 1: Open the file and locate the glow block

The block to replace is at lines 104–119 (approximately, after `.cosmic-tile` base rule):

```css
/* Element-tinted card glow — applied when useElementTheme sets data-element on <body> */
body[data-element="Wood"]  .cosmic-tile,
body[data-element="Wood"]  .morning-card,
body[data-element="Wood"]  .bright-card   { --tile-glow: rgba(61, 139, 55, 0.10); }
body[data-element="Fire"]  .cosmic-tile,
body[data-element="Fire"]  .morning-card,
body[data-element="Fire"]  .bright-card   { --tile-glow: rgba(197, 48, 48, 0.10); }
body[data-element="Earth"] .cosmic-tile,
body[data-element="Earth"] .morning-card,
body[data-element="Earth"] .bright-card   { --tile-glow: rgba(214, 158, 46, 0.10); }
body[data-element="Metal"] .cosmic-tile,
body[data-element="Metal"] .morning-card,
body[data-element="Metal"] .bright-card   { --tile-glow: rgba(113, 128, 150, 0.10); }
body[data-element="Water"] .cosmic-tile,
body[data-element="Water"] .morning-card,
body[data-element="Water"] .bright-card   { --tile-glow: rgba(43, 108, 176, 0.10); }
```

### Step 2: Replace with `:not(:is(.planetarium *))` selectors

Replace the entire block above with:

```css
/* Element-tinted card glow — bright mode only (excluded inside .planetarium dark mode).
   :not(:is(.planetarium *)) prevents overriding the gold glow in dark mode.
   Specificity note: body[attr] .class:not(:is(.class *)) → 0,3,1 — wins in bright, excluded in dark. */
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

### Step 3: Run lint to confirm no CSS parse errors

```bash
npm run lint
```

Expected: 0 errors, 0 warnings.

### Step 4: Add a DOM-level regression test to `useElementTheme.test.ts`

The existing Vitest tests run in `jsdom` which does not process CSS stylesheets — so we cannot assert computed `--tile-glow` values from CSS rules. What we CAN assert is that the `data-element` attribute is set on `body`, and that the `.planetarium` element's inline style is NOT touched by the hook (confirming the hook doesn't interfere with dark mode theming).

Add these tests at the end of the `describe` block in `src/__tests__/useElementTheme.test.ts`:

```ts
it('does not set any CSS vars on an element with .planetarium class', () => {
  // Simulate: hook sets data-element on body; but hook NEVER touches
  // elements with .planetarium class — that's handled by CSS cascade alone.
  // Confirm no inline style lands on a .planetarium div.
  const planetDiv = document.createElement('div');
  planetDiv.className = 'planetarium';
  document.body.appendChild(planetDiv);

  renderHook(() => useElementTheme('Wood'));

  expect(planetDiv.style.getPropertyValue('--tile-glow')).toBe('');
  expect(planetDiv.style.getPropertyValue('--tile-accent')).toBe('');

  document.body.removeChild(planetDiv);
});

it('sets data-element on body regardless of planetarium mode (CSS handles exclusion)', () => {
  // Hook always sets the attribute; CSS :not(:is(.planetarium *)) does the filtering.
  renderHook(() => useElementTheme('Water'));
  expect(document.body.getAttribute('data-element')).toBe('Water');
});
```

### Step 5: Run the hook test suite

```bash
npx vitest run src/__tests__/useElementTheme.test.ts
```

Expected: `16 passed (16)` — the 14 existing + 2 new.

### Step 6: Run the full test suite

```bash
npm run test 2>&1 | grep -E "Test Files|Tests "
```

Expected:
```
Test Files  1 failed | 142 passed (143)   ← vibes-perf server-only skip, unchanged
      Tests  1 failed | 1185 passed (1186)
```

### Step 7: Visual check (manual, 2 minutes)

```bash
npm run dev
```

1. Open `http://localhost:3000`, log in with a test account (Wood or Fire dominant element).
2. **Bright mode** (default): hover any dashboard card → element-colored glow (green for Wood, red for Fire). ✓
3. **Dark mode** (click the telescope icon in nav): hover any card → gold glow only, no element color. ✓

### Step 8: Commit

```bash
git add src/index.css src/__tests__/useElementTheme.test.ts
git commit -m "fix(css): exclude .planetarium descendants from element card glow rules"
```

---

## Final verification

```bash
npm run test 2>&1 | grep -E "Test Files|Tests "
```

Expected: same as Step 6 — 1185 passing, only vibes-perf skipped.
