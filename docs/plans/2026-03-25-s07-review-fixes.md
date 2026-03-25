# S07 Code Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 8 issues found in AI code review of Sprint S07 (2 HIGH, 6 MEDIUM/LOW).

**Architecture:** All fixes are surgical single-file edits. No new files, no new dependencies. Tasks are independent — execute in any order.

**Tech Stack:** TypeScript, React 19, motion/react

---

## TASK 1 (HIGH): Remove dead `DIMENSION_LABELS` constant

**Files:**
- Modify: `src/components/quizzes/LoveLanguagesQuiz.tsx` (lines 54–60)

### Steps

1. Delete the original `DIMENSION_LABELS` constant (lines 54–60) — it is an exact duplicate of `DIMENSION_LABELS_DE` which replaced it.

2. Run tests:
   ```bash
   npx vitest run
   ```
   Expected: 800 passed. `DIMENSION_LABELS` was only used in the component JSX which was already changed to use `DIMENSION_LABELS_DE`/`DIMENSION_LABELS_EN`.

3. Commit:
   ```bash
   git add src/components/quizzes/LoveLanguagesQuiz.tsx
   git commit -m "fix(quiz): remove dead DIMENSION_LABELS constant — replaced by DE/EN variants"
   ```

---

## TASK 2 (HIGH): Fix timer leak in cluster dismiss effect

**Files:**
- Modify: `src/pages/FuRingPage.tsx` (lines 49–54)

### Steps

1. In the `useEffect` that auto-dismisses cluster overlay, add a `clearTimeout` before setting the new timeout. Change:
   ```typescript
   useEffect(() => {
     if (justCompletedCluster) {
       clusterDismissRef.current = setTimeout(() => setJustCompletedCluster(null), 3000);
     }
     return () => { if (clusterDismissRef.current) clearTimeout(clusterDismissRef.current); };
   }, [justCompletedCluster]);
   ```
   To:
   ```typescript
   useEffect(() => {
     if (justCompletedCluster) {
       if (clusterDismissRef.current) clearTimeout(clusterDismissRef.current);
       clusterDismissRef.current = setTimeout(() => setJustCompletedCluster(null), 3000);
     }
     return () => { if (clusterDismissRef.current) clearTimeout(clusterDismissRef.current); };
   }, [justCompletedCluster]);
   ```

2. Run tests:
   ```bash
   npx vitest run
   ```
   Expected: 800 passed

3. Commit:
   ```bash
   git add src/pages/FuRingPage.tsx
   git commit -m "fix(quiz): clear previous dismiss timer before setting new one"
   ```

---

## TASK 3 (MEDIUM): Replace IIFE with computed variable in cluster overlay

**Files:**
- Modify: `src/pages/FuRingPage.tsx` (lines 259–284)

### Steps

1. Before the `return (` statement (line ~121), add a computed variable:
   ```typescript
   const completedClusterDef = justCompletedCluster
     ? CLUSTER_REGISTRY.find(c => c.id === justCompletedCluster) ?? null
     : null;
   ```

2. Replace the IIFE block (lines 259–284) with:
   ```tsx
   <AnimatePresence>
     {completedClusterDef && (
       <motion.div
         key={justCompletedCluster}
         className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 1.1 }}
         transition={{ duration: 0.5 }}
       >
         <div className="rounded-2xl border border-[#D4AF37]/30 bg-black/80 backdrop-blur-xl px-8 py-6 text-center">
           <p className="text-3xl mb-2">{completedClusterDef.icon}</p>
           <p className="text-[#D4AF37] font-serif text-lg font-semibold">
             {completedClusterDef.name} {lang === 'de' ? 'abgeschlossen' : 'completed'}
           </p>
           <p className="text-white/50 text-sm mt-1">
             {lang === 'de' ? 'Deine Energie wurde aktualisiert' : 'Your energy has been updated'}
           </p>
         </div>
       </motion.div>
     )}
   </AnimatePresence>
   ```
   Note: `key={justCompletedCluster}` (dynamic) replaces `key="cluster-complete"` (static) — this also fixes issue #8 (AnimatePresence key).

3. Run tests:
   ```bash
   npx vitest run
   ```
   Expected: 800 passed

4. Commit:
   ```bash
   git add src/pages/FuRingPage.tsx
   git commit -m "refactor(quiz): replace IIFE with computed var in cluster overlay, use dynamic key"
   ```

---

## TASK 4 (MEDIUM): Downgrade expected-degradation logs back to console.warn

**Files:**
- Modify: `src/hooks/usePremium.ts` (lines 20, 48)
- Modify: `src/hooks/useDashboardTour.ts` (lines 33, 52, 69, 81)

### Steps

1. In `usePremium.ts`:
   - Line 20: Change `console.error('[premium] fetch failed` back to `console.warn('[premium] fetch failed`
   - Line 48: Change `console.error('[premium] Realtime failed` back to `console.warn('[premium] Realtime failed`

2. In `useDashboardTour.ts`:
   - Line 33: Change `console.error('[tour] fetch failed` back to `console.warn('[tour] fetch failed`
   - Lines 52, 69: Keep `console.error('[tour] persist failed` as-is — actual persist failures ARE errors
   - Line 81: Change `console.error('[tour] restart persist failed` back to `console.warn` — restart failure is non-critical

3. Run tests:
   ```bash
   npx vitest run
   ```
   Expected: 800 passed

4. Commit:
   ```bash
   git add src/hooks/usePremium.ts src/hooks/useDashboardTour.ts
   git commit -m "fix(logging): downgrade expected-degradation logs back to warn, keep persist errors as error"
   ```

---

## TASK 5 (MEDIUM): Remove redundant planet name badge

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx` (lines 1118–1123)

### Steps

1. Delete the "Planet name badge" block (lines 1118–1123):
   ```tsx
   {/* Planet name badge — top-left, orrery mode only */}
   {hoveredObject && !planetariumMode && (
     <div className="absolute top-4 left-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md px-3 py-2 pointer-events-none z-10">
       <p className="text-[#D4AF37] font-serif text-sm font-semibold">{hoveredObject.name}</p>
     </div>
   )}
   ```
   The cursor-following tooltip (lines 1125+) already shows this information plus symbol/position.

2. Run tests:
   ```bash
   npx vitest run
   ```
   Expected: 800 passed

3. Commit:
   ```bash
   git add src/components/BirthChartOrrery.tsx
   git commit -m "fix(planetarium): remove redundant static planet badge — cursor tooltip is sufficient"
   ```

---

## TASK 6 (LOW): Verify PersonalityQuiz DIMENSIONS rename is safe

**Files:**
- Read-only: `src/components/quizzes/PersonalityQuiz.tsx`

### Steps

1. Search for any module-level references to the old `DIMENSIONS` name:
   ```bash
   grep -n 'DIMENSIONS' src/components/quizzes/PersonalityQuiz.tsx
   ```
   Expected: Only `DIMENSIONS_DE`, `DIMENSIONS_EN`, and `dims` references remain. No bare `DIMENSIONS`.

2. If any bare `DIMENSIONS` references found outside the component, fix them to use `DIMENSIONS_DE`.

3. No commit needed if verification passes.

---

## Final Verification

```bash
npx vitest run
```
Expected: 800+ passed, 0 failed.
