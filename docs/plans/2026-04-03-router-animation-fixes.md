# Router Animation Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three issues found in the post-session code review: scale exit animations silently broken by `display: contents`, duplicate FADE_VARIANTS, and undocumented ISO string comparison assumption in BirthForm.

**Architecture:** Two changes in `src/router.tsx` (layout wrapper + constant dedup) and one comment in `src/components/BirthForm.tsx`. No new files. No new deps.

**Tech Stack:** React 19, Framer Motion (`motion/react`), Tailwind CSS v4, Vitest

---

## Context: why `display: contents` was added

`<AppRoutes>` is mounted inside a `<main>` element in `App.tsx:554`. The `<main>` uses:
- Signatur route: `flex-grow w-full` (no centering)
- All other routes: `flex-grow flex flex-col items-center justify-center`

Without any style, the extra `motion.div` wrapper becomes a flex child of `<main>`. On non-Signatur routes the centering then applies to the `motion.div`, not to the page content directly — which is fine *if* the `motion.div` passes flex context through. `display: contents` was the lazy fix: it removes the box entirely so the child pages behave as direct children of `<main>`.

**Problem:** `display: contents` = no rendered box → Framer Motion has nothing to apply `transform: scale(...)` to → exit scale animations are silently no-ops.

**Correct fix:** Give the `motion.div` `w-full` so it doesn't shrink in the flex row, but keep it a real box. The page content inside each route already handles its own centering/max-width, so removing `display: contents` has no visible layout impact.

---

## Task 1: Replace `display: contents` with `w-full`

**Files:**
- Modify: `src/router.tsx:99–101`

### Step 1: Verify current behaviour (no test needed — visual regression)

Open dev server and navigate between routes to confirm scale exit animations appear to do nothing (no scale-down on leaving route).

```bash
npm run dev
# Open http://localhost:3000, navigate / → /signatur, watch transition
```

Expected: entering route fades+scales in correctly; **exiting route does NOT scale** (it just disappears because scale on a display:contents element is a no-op).

### Step 2: Apply the fix

In `src/router.tsx`, **replace** line 99–101:

```diff
-        // Use `contents` display so the wrapper div doesn't break flex/grid layouts
-        style={{ display: 'contents' }}
+        // w-full preserves flex layout without suppressing the scale transform box
+        className="w-full"
```

Full updated `motion.div` opening tag (lines 93–101):
```tsx
      <motion.div
        key={location.key}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full"
      >
```

### Step 3: Visually verify fix in dev

```bash
# Dev server should still be running
# Navigate / → /signatur (inward: scale up), /signatur → / (outward: scale down)
# Both entering AND exiting routes should now animate scale
```

Expected: Both enter AND exit transitions now show scale animation.

### Step 4: Run lint and tests

```bash
npm run lint
npm run test -- src/__tests__/depth-navigation.test.tsx
```

Expected: 0 type errors, 14 tests pass.

### Step 5: Commit

```bash
git add src/router.tsx
git commit -m "fix(router): replace display:contents with w-full — restores scale exit animations"
```

---

## Task 2: Merge duplicate FADE_VARIANTS constants in router.tsx

**Files:**
- Modify: `src/router.tsx:33–44, 89`

`LATERAL_VARIANTS` and `REDUCED_VARIANTS` are byte-for-byte identical. Merge into `FADE_VARIANTS`.

### Step 1: Apply the refactor

Replace lines 33–50 in `src/router.tsx`:

**Before:**
```ts
const LATERAL_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

// When prefers-reduced-motion is active: only opacity, no scale
const REDUCED_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

function getVariants(direction: TransitionDirection) {
  if (direction === 'inward') return INWARD_VARIANTS;
  if (direction === 'outward') return OUTWARD_VARIANTS;
  return LATERAL_VARIANTS;
}
```

**After:**
```ts
// Opacity-only fade: used for lateral navigation and prefers-reduced-motion
const FADE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

function getVariants(direction: TransitionDirection) {
  if (direction === 'inward') return INWARD_VARIANTS;
  if (direction === 'outward') return OUTWARD_VARIANTS;
  return FADE_VARIANTS;
}
```

Also update line 89 where `REDUCED_VARIANTS` is referenced:

**Before:**
```ts
  const variants = prefersReducedMotion ? REDUCED_VARIANTS : getVariants(direction);
```

**After:**
```ts
  const variants = prefersReducedMotion ? FADE_VARIANTS : getVariants(direction);
```

### Step 2: Run lint and tests

```bash
npm run lint
npm run test -- src/__tests__/depth-navigation.test.tsx
```

Expected: 0 type errors, 14 tests pass.

### Step 3: Commit

```bash
git add src/router.tsx
git commit -m "refactor(router): merge LATERAL_VARIANTS + REDUCED_VARIANTS into FADE_VARIANTS"
```

---

## Task 3: Document ISO string comparison assumption in BirthForm.tsx

**Files:**
- Modify: `src/components/BirthForm.tsx:120`

### Step 1: Apply the one-liner comment

In `src/components/BirthForm.tsx`, update lines 120–122:

**Before:**
```ts
    if (date > today) {
      newErrors.date = t("form.futureDate");
    }
```

**After:**
```ts
    // ISO YYYY-MM-DD strings: lexicographic order matches chronological order
    if (date > today) {
      newErrors.date = t("form.futureDate");
    }
```

### Step 2: Run the affected test to confirm nothing broke

```bash
npm run test -- src/__tests__/birthform-validation.test.tsx
```

Expected: 2 tests pass.

### Step 3: Commit

```bash
git add src/components/BirthForm.tsx
git commit -m "docs(BirthForm): clarify ISO date string comparison is intentional"
```

---

## Final verification

Run the full test suite to confirm all changes are green:

```bash
npm run test 2>&1 | grep -E "Test Files|Tests:"
```

Expected:
```
Test Files  1 failed | 141 passed (142)   ← vibes-perf is the server-only skip
      Tests  1 failed | 1155 passed (1156)
```
