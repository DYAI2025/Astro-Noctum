# Code Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address 1 medium and 2 low findings from the AI code review of TASK-dissonance-lissajous-blend, plus verify 2 visual info items.

**Architecture:** Three isolated code changes — a test file edit, a one-liner in a component, and a constant change — plus two manual visual verification steps. No cross-file dependencies. Each fix is independently committable.

**Tech Stack:** TypeScript / Vitest / React (no new dependencies)

---

### Task 1: MEDIUM — Replace lambda blend test with behavioral engine test

The test `'blend factor is clamp(d × 2, 0, 1)...'` (line 177 in `signatur-v3-engine.test.ts`) defines and tests a **local lambda** (`clampBlend`), not the actual `bipolar-engine.ts` engine. If the engine formula changed from `d*2` to `d*3`, the test would still pass green. Replace it with a behavioral test that drives `updatePoles` and verifies the 2× amplification property directly.

**Files:**
- Modify: `src/__tests__/signatur-v3-engine.test.ts:177-185`

**Step 1: Confirm the failing scenario (read the current test)**

The test to replace is at lines 177–185:

```typescript
it('blend factor is clamp(d × 2, 0, 1): 0 at d=0, 0.5 at d=0.25, 1 at d≥0.5', () => {
  const clampBlend = (d: number) => Math.min(Math.max(d * 2, 0), 1);
  expect(clampBlend(0)).toBe(0);
  expect(clampBlend(0.25)).toBe(0.5);
  expect(clampBlend(0.5)).toBe(1);
  expect(clampBlend(0.75)).toBe(1);
  expect(clampBlend(1)).toBe(1);
});
```

**Why this is wrong:** `clampBlend` is a local function — it tests nothing about the engine.

**Step 2: Replace with behavioral 2× amplification test**

The key insight: `d=0.05` (blend=0.1) and `d=0.1` (blend=0.2) are both below the vibration threshold (`d > 0.1`), so pole positions are pure blend arithmetic — no noise. The displacement ratio must be exactly 2:1 if the engine uses `blend = clamp(d * 2, 0, 1)`. It would be 1:1 if the formula was just `blend = d`.

Replace lines 177–185 with:

```typescript
it('blend amplification: displacement from symmetric scales as 2×d, not 1×d (engine)', () => {
  // Behavioral test: drives updatePoles with d=0.05 (blend=0.1) and d=0.1 (blend=0.2).
  // Both are below the vibration threshold (d > 0.1), so positions are pure blend arithmetic.
  // Verifies that clamp(d*2, 0, 1) is applied — a 1:1 formula would give ratio 1, not 2.
  const s0 = makeDissonanceState(0);
  const s05 = makeDissonanceState(0.05);  // blend = clamp(0.05 * 2, 0, 1) = 0.1
  const s10 = makeDissonanceState(0.1);   // blend = clamp(0.1  * 2, 0, 1) = 0.2

  const p0  = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
  const p05 = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);
  const p10 = initializePoles(DEFAULT_CONFIG, NATAL, NATAL);

  // 10 frames: enough for theta to accumulate a measurable Lissajous Y difference
  for (let frame = 0; frame < 10; frame++) {
    const t = frame * 0.016;
    updatePoles(p0,  s0,  DEFAULT_CONFIG, t);
    updatePoles(p05, s05, DEFAULT_CONFIG, t);
    updatePoles(p10, s10, DEFAULT_CONFIG, t);
  }

  // For each poleA (even indices): displacement ratio must be 2:1 where measurable
  let ratioChecked = false;
  for (let i = 0; i < p0.length; i += 2) {
    const disp05 = p05[i]!.y - p0[i]!.y;  // blend=0.1 → 10% of (lissajous - symmetric)
    const disp10 = p10[i]!.y - p0[i]!.y;  // blend=0.2 → 20% of (lissajous - symmetric)
    if (Math.abs(disp05) > 0.001) {
      expect(disp10 / disp05).toBeCloseTo(2.0, 1);
      ratioChecked = true;
    }
  }
  // Guard: at least one dimension must have a measurable displacement
  expect(ratioChecked).toBe(true);
});
```

**Step 3: Run the test to verify it passes**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx vitest run src/__tests__/signatur-v3-engine.test.ts 2>&1 | tail -8
```

Expected: `Tests 23 passed (23)` — count stays the same (1 replaced, not added).

**Step 4: Commit**

```bash
git add src/__tests__/signatur-v3-engine.test.ts
git commit -m "test(signatur-v3): replace lambda blend test with behavioral 2× amplification test"
```

---

### Task 2: LOW — Remove unreachable `?? {}` fallback in FusionRing3D

`FusionRing3D.tsx:135` has `quizWeights ?? v3DimensionWeights ?? {}`. The final `?? {}` is unreachable: `SignaturV3Canvas` is only rendered when `isFeatureEnabled('signature_engine_v3') && v3DimensionWeights` is truthy (line 131), so `v3DimensionWeights` is guaranteed non-null at that point. Dead code adds noise when reading the fallback chain.

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx:135`

**Step 1: Read the line to confirm it's exactly as expected**

Open `src/components/fusion-ring-3d/FusionRing3D.tsx` and verify line 135 reads:
```tsx
quizWeights={quizWeights ?? v3DimensionWeights ?? {}}
```

**Step 2: Remove the dead fallback**

Change line 135 from:
```tsx
quizWeights={quizWeights ?? v3DimensionWeights ?? {}}
```
to:
```tsx
quizWeights={quizWeights ?? v3DimensionWeights}
```

> Note: `SignaturV3Props.quizWeights` is `Record<string, number>` (non-optional), but TypeScript won't complain because `v3DimensionWeights` is `Record<string, number>` too. Confirm the type still compiles clean.

**Step 3: Run typecheck**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx tsc --noEmit 2>&1 | tail -5
```

Expected: `TypeScript compilation completed` (no errors).

**Step 4: Run full test suite**

```bash
npm run test 2>&1 | grep -E "Tests |passed|failed"
```

Expected: `Tests  1242 passed (1242)`.

**Step 5: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "refactor(FusionRing3D): remove unreachable ?? {} fallback — v3DimensionWeights is guaranteed non-null within v3 guard"
```

---

### Task 3: LOW — Tighten interpolation test tolerance

`signatur-v3-engine.test.ts:253` uses `DEFAULT_CONFIG.maxR * 0.04` (= 8px) as tolerance for the d=0.25 interpolation bounds. The actual vibration amplitude at d=0.25 is `0.25 × 200 × 0.03 = 1.5px`. A tolerance 5× larger than the noise floor could hide a regression where the blend is completely wrong but vibration coincidentally lands in range. Tighten to `maxR * 0.015` (= 3px, 2× the actual max vibration).

**Files:**
- Modify: `src/__tests__/signatur-v3-engine.test.ts:253`

**Step 1: Read the current tolerance line**

Locate line 253 in `signatur-v3-engine.test.ts`:
```typescript
const tolerance = DEFAULT_CONFIG.maxR * 0.04; // ≤ 4% of maxR vibration allowance
```

**Step 2: Tighten the tolerance**

Change to:
```typescript
const tolerance = DEFAULT_CONFIG.maxR * 0.015; // ≤ 1.5% of maxR — 2× actual max vibration (0.25 × maxR × 0.03 = 1.5px)
```

**Step 3: Run the test to confirm it still passes**

```bash
npx vitest run src/__tests__/signatur-v3-engine.test.ts 2>&1 | tail -8
```

Expected: `Tests 23 passed (23)`.

> If the test fails with the tighter tolerance, the vibration model has changed — do NOT widen back silently. Instead open `bipolar-engine.ts` lines 418–434 to read the current vibration formula, recompute the actual max amplitude, and set tolerance to 1.5× that value.

**Step 4: Commit**

```bash
git add src/__tests__/signatur-v3-engine.test.ts
git commit -m "test(signatur-v3): tighten interpolation tolerance to 1.5% maxR (2× actual vibration amplitude)"
```

---

### Task 4: INFO — Visual verification (no code changes)

These two findings require only a visual browser check, not code changes.

**Step 1: Start the dev server**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npm run dev
```

Open `http://localhost:3000` in a browser.

**Step 2: INFO #1 — PremiumGate placement in VibesSection**

Navigate to the Dashboard. Find the "Dein Vibe" / "Your Vibe" card.

✅ **Expected behavior:**
- Non-premium users: card title + subtitle visible, button area shows premium teaser text
- Premium users: card title + subtitle + full button

This is correct progressive disclosure — the heading is intentionally outside PremiumGate. No code fix needed.

**Step 3: INFO #2 — VibesSection centering on wide screens**

Resize the browser to ≥ 1400px (or use DevTools responsive mode).

Check: does `max-w-md mx-auto` on the VibesSection card leave a visual gap in the Dashboard layout?

✅ **Expected:** Card is centered within its Dashboard column, consistent with other max-width-constrained cards (e.g., `CosmicInfluenceSection` uses similar patterns).

❌ **If the card appears misaligned:** The fix is to wrap the card in a `w-full flex justify-center` outer container, or match the layout container used by adjacent dashboard sections. File a follow-up task if misalignment is found.

**Step 4: Run full test suite one final time**

```bash
npm run test 2>&1 | grep -E "Tests |passed|failed"
```

Expected: `Tests 1242 passed (1242)`.
