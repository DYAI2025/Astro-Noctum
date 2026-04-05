# Code Review Fix Plan — 2 CRITICALs + 3 HIGHs

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 5 issues flagged by code review (2 CRITICAL, 3 HIGH) from the bug-fix-sweep commit.

**Architecture:** Each fix is independent. CRITICALs fix data corruption / caching bugs. HIGHs improve robustness and UX. All changes are backward-compatible.

**Tech Stack:** React 19, TypeScript, Vitest, Supabase SDK

---

## Task 1: CRITICAL — Fix `useCompletedModules` schema mismatch

The upsert sends `sector_weights` and `confidence` as top-level columns, but the actual `contribution_events` table has `event_id`, `occurred_at`, `payload` (JSONB).

**Files:**
- Modify: `src/hooks/useCompletedModules.ts:78-89`
- Test: `src/__tests__/useCompletedModules-schema.test.ts`

### Step 1: Fix the upsert to match actual schema

In `src/hooks/useCompletedModules.ts`, replace the broken upsert block.

### Step 2: Run tests

Run: `npx vitest run src/__tests__/useCompletedModules`
Expected: PASS

### Step 3: Commit

```bash
git commit -m "fix(BUG-20): useCompletedModules upsert matches contribution_events schema"
```

---

## Task 2: CRITICAL — Don't cache fallback daily data

`setCachedDaily(fallback)` writes the fallback to localStorage keyed by date. This prevents real data from loading for the rest of the day.

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts:178-180`
- Test: `src/__tests__/daily-fallback.test.ts`

### Step 1: Remove `setCachedDaily` from catch block

### Step 2: Write test for `buildFallbackDaily`

### Step 3: Run tests

Run: `npx vitest run src/__tests__/daily-fallback.test.ts`
Expected: PASS

### Step 4: Commit

```bash
git commit -m "fix(BUG-19): don't cache fallback daily — allow real data on retry"
```

---

## Task 3: HIGH — Replace fragile `isSyntheticSoulprint` heuristic with explicit flag

Instead of stddev threshold detection, use the binary fact: `profileMeta.soulprintSectors === null`.

**Files:**
- Modify: `src/components/Dashboard.tsx:448`
- Modify: `src/lib/signatur/weight-utils.ts` (remove `isSyntheticSoulprint`)
- Modify: `src/__tests__/weight-utils-synthetic.test.ts`

### Step 1: Replace in Dashboard, remove dead code

### Step 2: Update tests

### Step 3: Commit

```bash
git commit -m "fix(BUG-17): replace heuristic isSyntheticSoulprint with explicit null check"
```

---

## Task 4: HIGH — Gate `useDeviceLocation` behind skyMode

Prevent browser location prompt on every Dashboard mount. Only request when user toggles to "current sky".

**Files:**
- Modify: `src/hooks/useDeviceLocation.ts`
- Modify: `src/components/Dashboard.tsx:118`

### Step 1: Add `enabled` param, use in Dashboard

### Step 2: Commit

```bash
git commit -m "fix(BUG-16): only request geolocation when skyMode is 'current'"
```

---

## Task 5: HIGH — Fix ternary precedence + NaN guard in Orrery observer

**Files:**
- Modify: `src/components/dashboard/InfluenceGauges.tsx:92`
- Modify: `src/components/BirthChartOrrery.tsx:165-166`

### Step 1: Parenthesize ternary, add isFinite guard

### Step 2: Commit

```bash
git commit -m "fix: InfluenceGauges ternary clarity + Orrery observer NaN guard"
```
