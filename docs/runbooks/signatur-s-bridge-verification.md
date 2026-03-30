# Runbook: S-BRIDGE Refactor Verification

> Verify that the S-BRIDGE shared-package refactor has no regressions.
> Run after every change to `packages/shared/src/signatur/` or `bipolar-engine.ts`.

---

## 1. TypeScript — No Type Errors

```bash
# Root project
npx tsc --noEmit

# Shared package
cd packages/shared && npx tsc --noEmit && cd ../..
```

**Expected**: no output (zero errors).

---

## 2. Test Suite — All Tests Green

```bash
# Bridge contract + Hz guard-tests + determinism tests
npx vitest run src/__tests__/signatur-shared-bridge.test.ts src/__tests__/signatur-v3-engine.test.ts
```

**Expected**:
```
Test Files  2 passed (2)
Tests       44 passed (44)
```

### Full suite (no regressions elsewhere)

```bash
npm run test
```

**Expected**: all tests pass. Any failure unrelated to S-BRIDGE is a pre-existing issue.

---

## 3. Visual — MiniSignature Renders on Dashboard

1. `npm run dev` in one terminal, `PORT=3001 node server.mjs` in another
2. Open `http://localhost:3000`
3. Log in with a test account that has birth data
4. Navigate to Dashboard
5. Verify MiniSignature (240×240 canvas) renders and animates

**Expected**: Signatur V3 bipolar trails visible, poles moving, no console errors.

---

## 4. Visual — Signatur Page Full Render

1. Navigate to `/signatur`
2. Verify full-size V3 engine renders at High tier
3. Open DevTools → Console: no errors

**Expected**: 12 poles moving, trails accumulating, canvas responsive to window resize.

---

## 5. Import Chain Verification

```bash
# Confirm bipolar-engine no longer defines its own DIMENSION_DEFS locally
grep -n "poleA.*Durchsetzung\|hz:.*144.72" src/components/signatur-v3/bipolar-engine.ts
```

**Expected**: no output (values only exist in `packages/shared/src/signatur/dimension-defs.ts`).

```bash
# Confirm shared package exports all required symbols
node -e "
  const { DIMENSION_DEFS, soulprintToDimensionWeights, quizSectorsToQuizWeights, soulprintToNatalWeights } =
    require('./packages/shared/src/signatur/index.ts');
  console.log('DIMENSION_DEFS length:', DIMENSION_DEFS.length);
  console.log('All exports:', typeof soulprintToDimensionWeights, typeof quizSectorsToQuizWeights, typeof soulprintToNatalWeights);
" 2>/dev/null || echo "(Use vitest import check above instead — ESM module)"
```

---

## 6. Hz Guard-Test — Intentional Change Workflow

If you need to update Hz values intentionally:

1. Update `packages/shared/src/signatur/dimension-defs.ts` (the value in `DIMENSION_DEFS`)
2. Update `EXPECTED_HZ` in the same file
3. Update `SPEC_HZ` in `src/__tests__/signatur-shared-bridge.test.ts`
4. Update `SWIFT_CONSTANTS.md` Hz table and Swift array
5. Run `npx vitest run src/__tests__/signatur-shared-bridge.test.ts` — must be green

**Never update Hz values without updating all 4 locations.**

---

## Quick-Check Summary

| Check | Command | Expected |
|---|---|---|
| TypeScript (root) | `npx tsc --noEmit` | no output |
| TypeScript (shared) | `cd packages/shared && npx tsc --noEmit` | no output |
| Bridge contract tests | `npx vitest run src/__tests__/signatur-shared-bridge.test.ts` | 30 passed |
| Engine determinism tests | `npx vitest run src/__tests__/signatur-v3-engine.test.ts` | 18 passed |
| MiniSignature visual | Browser @ `/` | Renders, no errors |
| Signatur page visual | Browser @ `/signatur` | Renders, no errors |
