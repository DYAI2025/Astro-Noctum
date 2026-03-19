# Accessibility Fixes for Quiz-Cluster Signatur Components

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix WCAG 2.1 AA violations (critical + high) in ClusterSidebar, ClusterPipeline, and QuizOverlay.

**Architecture:** Surgical edits to 3 existing components — add missing ARIA attributes, fix contrast ratios, add focus management to the quiz dialog, and respect reduced-motion preference. No new files.

**Tech Stack:** React 19, Tailwind CSS v4, motion/react, lucide-react

---

## Files — DO NOT MODIFY (reference only)

| File | Why |
|------|-----|
| `src/components/ClusterCard.tsx` | Reference for correct ARIA patterns (has `aria-controls`, `role="progressbar"`) |

## Files to Modify

| File | Fixes |
|------|-------|
| `src/components/signatur/ClusterSidebar.tsx` | ARIA controls, progressbar role, icon aria-hidden, contrast, sr-only labels |
| `src/components/signatur/ClusterPipeline.tsx` | Reduced motion support |
| `src/components/QuizOverlay.tsx` | Focus management, loading a11y |

---

## Task 1: Add `aria-controls` and `id` to ClusterPanel expand/collapse

**Files:**
- Modify: `src/components/signatur/ClusterSidebar.tsx:54-58,96-103`

**WCAG:** 4.1.2 — Name, Role, Value

**Step 1: Add `aria-controls` to the toggle button**

In `ClusterSidebar.tsx`, change the button (line 54-58) from:

```tsx
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full cursor-pointer items-center justify-between p-3"
        aria-expanded={expanded}
      >
```

to:

```tsx
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full cursor-pointer items-center justify-between p-3"
        aria-expanded={expanded}
        aria-controls={`cluster-panel-${cluster.id}`}
      >
```

**Step 2: Add `id` and `role="region"` to the expanded panel**

Change the expanded `motion.div` (line 98-103) from:

```tsx
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
```

to:

```tsx
          <motion.div
            id={`cluster-panel-${cluster.id}`}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
```

**Step 3: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/signatur/ClusterSidebar.tsx
git commit -m "fix(a11y): add aria-controls and region role to ClusterPanel expand"
```

---

## Task 2: Add `role="progressbar"` with ARIA value attributes

**Files:**
- Modify: `src/components/signatur/ClusterSidebar.tsx:82-93`

**WCAG:** 4.1.2 — Name, Role, Value

**Step 1: Add progressbar role and aria attributes**

Change the progress bar container (line 82-93) from:

```tsx
      {!complete && progress > 0 && (
        <div className="px-3 pb-2">
          <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
```

to:

```tsx
      {!complete && progress > 0 && (
        <div className="px-3 pb-2">
          <div
            className="h-0.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${cluster.name} ${Math.round(progress * 100)}%`}
          >
```

**Step 2: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/signatur/ClusterSidebar.tsx
git commit -m "fix(a11y): add progressbar role and ARIA values to cluster progress"
```

---

## Task 3: Add `aria-hidden` to decorative icons and fix contrast

**Files:**
- Modify: `src/components/signatur/ClusterSidebar.tsx:61,64,72-75,145,149-151`

**WCAG:** 1.1.1 (Non-text Content), 1.4.3 (Contrast)

**Step 1: Hide decorative emoji icon from screen readers**

Change line 61 from:

```tsx
          <span className="text-lg">{cluster.icon}</span>
```

to:

```tsx
          <span className="text-lg" aria-hidden="true">{cluster.icon}</span>
```

**Step 2: Fix status text contrast and hide chevron icons**

Change the status span (line 64) from:

```tsx
            <span className="text-[10px] text-white/40">
```

to:

```tsx
            <span className="text-[10px] text-white/60">
```

Change the chevron icons (lines 72-76) from:

```tsx
        <div className="flex items-center gap-1.5">
          {complete && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-white/30" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/30" />
          }
        </div>
```

to:

```tsx
        <div className="flex items-center gap-1.5">
          {complete && <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />}
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-white/40" aria-hidden="true" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/40" aria-hidden="true" />
          }
        </div>
```

**Step 3: Fix quiz slot text contrast and add sr-only state labels**

Change the quiz slot text and icons (lines 144-153) from:

```tsx
                  >
                    <span className={quizDone ? 'text-white/80' : 'text-white/50'}>
                      {name}
                    </span>
                    {quizDone ? (
                      <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                    ) : needsPremium ? (
                      <Lock className="h-3 w-3 shrink-0 text-white/20" />
                    ) : null}
                  </button>
```

to:

```tsx
                  >
                    <span className={quizDone ? 'text-white/80' : 'text-white/60'}>
                      {name}
                    </span>
                    {quizDone ? (
                      <>
                        <Check className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                        <span className="sr-only">{lang === 'de' ? 'Abgeschlossen' : 'Completed'}</span>
                      </>
                    ) : needsPremium ? (
                      <>
                        <Lock className="h-3 w-3 shrink-0 text-white/30" aria-hidden="true" />
                        <span className="sr-only">Premium</span>
                      </>
                    ) : null}
                  </button>
```

**Step 4: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/signatur/ClusterSidebar.tsx
git commit -m "fix(a11y): add aria-hidden to icons, fix contrast, add sr-only state labels"
```

---

## Task 4: Add focus management to QuizOverlay

**Files:**
- Modify: `src/components/QuizOverlay.tsx:1,71-77,89-98`

**WCAG:** 2.4.3 (Focus Order)

**Step 1: Add `useRef` import and ref for dialog**

Change line 1 from:

```tsx
import { useEffect, useCallback, Suspense, lazy } from 'react';
```

to:

```tsx
import { useEffect, useCallback, useRef, Suspense, lazy } from 'react';
```

**Step 2: Add ref to close button and auto-focus on open**

Add a ref before the `handleKeyDown` callback (after line 80):

```tsx
  const closeButtonRef = useRef<HTMLButtonElement>(null);
```

Change the `useEffect` (lines 89-98) from:

```tsx
  useEffect(() => {
    if (!quizId) return;
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while overlay is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [quizId, handleKeyDown]);
```

to:

```tsx
  useEffect(() => {
    if (!quizId) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    // Move focus to close button when dialog opens
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [quizId, handleKeyDown]);
```

**Step 3: Attach ref to the close button**

Change the close button (line 127-131) from:

```tsx
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gold/50 transition-colors hover:bg-gold/10 hover:text-gold"
              aria-label="Close quiz"
            >
```

to:

```tsx
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gold/50 transition-colors hover:bg-gold/10 hover:text-gold"
              aria-label="Close quiz"
            >
```

**Step 4: Add `role="status"` and label to loading fallback**

Change `QuizLoadingFallback` (lines 71-77) from:

```tsx
function QuizLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
    </div>
  );
}
```

to:

```tsx
function QuizLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="Loading quiz">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
    </div>
  );
}
```

**Step 5: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/QuizOverlay.tsx
git commit -m "fix(a11y): auto-focus close button on dialog open, add loading status role"
```

---

## Task 5: Respect `prefers-reduced-motion` in ClusterPipeline

**Files:**
- Modify: `src/components/signatur/ClusterPipeline.tsx:1-2,12,41-77`

**WCAG:** 2.3.3 (Animation from Interactions)

**Step 1: Import `useReducedMotion`**

Change line 1-2 from:

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
```

to:

```tsx
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
```

**Step 2: Add hook call and skip animation when reduced motion preferred**

In the component body (after line 14), add:

```tsx
  const prefersReducedMotion = useReducedMotion();
```

Change the animation effect (line 27, inside the useEffect) from:

```tsx
    // First time seeing this cluster complete — animate
    setShowAnimation(true);
    localStorage.setItem(storageKey, 'true');

    const timer = setTimeout(() => {
      setShowAnimation(false);
      setShowStaticLine(true);
    }, 2000);

    return () => clearTimeout(timer);
```

to:

```tsx
    localStorage.setItem(storageKey, 'true');

    if (prefersReducedMotion) {
      setShowStaticLine(true);
      return;
    }

    setShowAnimation(true);
    const timer = setTimeout(() => {
      setShowAnimation(false);
      setShowStaticLine(true);
    }, 2000);

    return () => clearTimeout(timer);
```

Add `prefersReducedMotion` to the dependency array of the useEffect:

```tsx
  }, [isComplete, storageKey, prefersReducedMotion]);
```

**Step 3: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/signatur/ClusterPipeline.tsx
git commit -m "fix(a11y): respect prefers-reduced-motion in pipeline animation"
```

---

## Task 6: Run full validation

**Files:** None (validation only)

**Step 1: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm run test`
Expected: All tests pass (no new failures)

**Step 3: Commit if any fixes needed**

```bash
git add -u
git commit -m "fix(a11y): post-validation cleanup"
```

---

## Execution Order Summary

```
Task 1  (aria-controls + region)     → 2 min
Task 2  (progressbar role)           → 2 min
Task 3  (aria-hidden + contrast)     → 5 min
Task 4  (focus management)           → 5 min
Task 5  (reduced motion)             → 3 min
Task 6  (validation)                 → 2 min
```

## Files Modified

| File | Changes |
|------|---------|
| `src/components/signatur/ClusterSidebar.tsx` | aria-controls, progressbar role, aria-hidden on icons, contrast fixes, sr-only labels |
| `src/components/signatur/ClusterPipeline.tsx` | useReducedMotion, skip animation when preferred |
| `src/components/QuizOverlay.tsx` | Auto-focus close button on open, loading status role |

## WCAG Criteria Addressed

| WCAG | Criterion | Fix |
|------|-----------|-----|
| 4.1.2 | Name, Role, Value | aria-controls, progressbar role, loading status |
| 1.1.1 | Non-text Content | aria-hidden on decorative icons |
| 1.4.3 | Contrast (Minimum) | Bump white/40→white/60, white/50→white/60 |
| 1.4.1 | Use of Color | sr-only labels for completed/premium states |
| 2.4.3 | Focus Order | Auto-focus dialog close button |
| 2.3.3 | Animation from Interactions | useReducedMotion in pipeline |
