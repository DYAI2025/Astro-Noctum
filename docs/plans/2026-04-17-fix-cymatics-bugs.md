# Cymatics Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two bugs found by /find-bugs in the S-CYMATICS implementation: a NaN guard weakness in harmony_index extraction and a redundant memo dependency in FuRingPage.

**Architecture:** Both fixes are in `src/pages/FuRingPage.tsx`. Fix 1 tightens the `harmonyIndex` guard from `typeof === 'number'` (which passes `NaN`) to `Number.isFinite` (which rejects `NaN` and `Infinity`). Fix 2 removes the redundant `apiData?.wuxing?.elements` dep from the `chladniParams` useMemo (it is already covered by `apiData?.wuxing`). Existing tests in `src/__tests__/furing-page-chladni-derivation.test.ts` are extended to cover the NaN case.

**Tech Stack:** TypeScript, React 19, Vitest

---

### Task 1: Add failing NaN test

`typeof NaN === 'number'` is `true`, so the current guard lets `NaN` through to `baziToChladniParams`, which would produce `a = NaN` and show `"NaN"` in `ChladniParamsBadge`. The fix is to use `Number.isFinite` instead.

**Files:**
- Modify: `src/__tests__/furing-page-chladni-derivation.test.ts` (add 1 test case in the existing `FuRingPage harmony_index extraction` describe block)

**Step 1: Add the failing test**

Open `src/__tests__/furing-page-chladni-derivation.test.ts`. Find the describe block `'FuRingPage harmony_index extraction'`. Inside the `extractHarmony` helper it mirrors the FuRingPage guard logic:

```ts
function extractHarmony(wuxing: Record<string, unknown>): number {
  const raw = wuxing['harmony_index'];
  return typeof raw === 'number' ? raw : 0.5;
}
```

Add a new test **after** the existing `'falls back to 0.5 when harmony_index is non-numeric'` test:

```ts
it('falls back to 0.5 when harmony_index is NaN (typeof NaN === "number")', () => {
  expect(extractHarmony({ harmony_index: NaN })).toBe(0.5);
});
```

**Step 2: Run to confirm it fails**

```bash
npx vitest run src/__tests__/furing-page-chladni-derivation.test.ts 2>&1 | tail -15
```

Expected: 1 test FAILS — `extractHarmony({ harmony_index: NaN })` returns `NaN` instead of `0.5` because the current `typeof` guard passes NaN through.

---

### Task 2: Fix the NaN guard in FuRingPage

**Files:**
- Modify: `src/pages/FuRingPage.tsx` line ~118

**Step 1: Locate the line**

In `src/pages/FuRingPage.tsx`, find the `chladniParams` useMemo (around line 113–120):

```ts
const chladniParams = useMemo(() => {
  const pillars = apiData?.bazi?.pillars;
  const wuxingWeights = apiData?.wuxing?.elements;
  if (!pillars || !wuxingWeights) return undefined;
  const rawHarmony = apiData?.wuxing?.['harmony_index'];
  const harmonyIndex = typeof rawHarmony === 'number' ? rawHarmony : 0.5;
  return baziToChladniParams(pillars, wuxingWeights, harmonyIndex);
}, [apiData?.bazi?.pillars, apiData?.wuxing?.elements, apiData?.wuxing]);
```

**Step 2: Apply both fixes in one edit**

Replace:
```ts
  const harmonyIndex = typeof rawHarmony === 'number' ? rawHarmony : 0.5;
  return baziToChladniParams(pillars, wuxingWeights, harmonyIndex);
}, [apiData?.bazi?.pillars, apiData?.wuxing?.elements, apiData?.wuxing]);
```

With:
```ts
  const harmonyIndex = Number.isFinite(rawHarmony as number) ? (rawHarmony as number) : 0.5;
  return baziToChladniParams(pillars, wuxingWeights, harmonyIndex);
}, [apiData?.bazi?.pillars, apiData?.wuxing]);
```

Two changes in one line swap:
- `typeof rawHarmony === 'number'` → `Number.isFinite(rawHarmony as number)` (rejects NaN and Infinity)
- Dep array: remove `apiData?.wuxing?.elements` (redundant — `wuxing` covers all wuxing field changes including `elements`)

**Step 3: Also update the test helper to mirror the new guard**

Back in `src/__tests__/furing-page-chladni-derivation.test.ts`, update `extractHarmony` to mirror the fixed FuRingPage code:

```ts
function extractHarmony(wuxing: Record<string, unknown>): number {
  const raw = wuxing['harmony_index'];
  return Number.isFinite(raw as number) ? (raw as number) : 0.5;
}
```

**Step 4: Run tests to confirm all pass**

```bash
npx vitest run src/__tests__/furing-page-chladni-derivation.test.ts 2>&1 | tail -10
```

Expected: All tests PASS (7 tests including the new NaN case).

**Step 5: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 2005+ tests, all pass.

**Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: Clean.

**Step 7: Commit**

```bash
git add src/pages/FuRingPage.tsx src/__tests__/furing-page-chladni-derivation.test.ts
git commit -m "fix: use Number.isFinite for harmony_index guard + drop redundant memo dep

- typeof NaN === 'number' is true, so the previous guard let NaN through
  to baziToChladniParams, producing NaN params and 'NaN' badge display.
  Number.isFinite correctly rejects NaN and Infinity.
- Removed redundant apiData?.wuxing?.elements dep from chladniParams
  useMemo — already covered by apiData?.wuxing (parent object reference
  changes whenever any child field changes).
- Test added: harmony_index: NaN falls back to 0.5

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Step 8: Push**

```bash
git push
```

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| NaN test added and passing | `npx vitest run src/__tests__/furing-page-chladni-derivation.test.ts` | 7/7 pass |
| Full suite | `npx vitest run` | 2005+ pass |
| TypeScript | `npx tsc --noEmit` | Clean |
