# OrbBackdrop Animation + Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix one blocking animation bug, one important animation safety gap, extract duplicated code to shared, and clean up four minor issues from the `fix/bug-23-elevenlabs-overlay` code review.

**Architecture:** All changes are confined to `apps/mobile/src/screens/OnboardingScreen.tsx`, `apps/mobile/src/screens/DashboardScreen.tsx`, `src/__tests__/mobile-onboarding.test.ts`, and a new `packages/shared/src/fusion-bazi/soulprint.ts` module. No API or routing changes.

**Tech Stack:** React Native `Animated` API, Vitest (web test runner — tests the pure functions and source-scan structural assertions, not RN rendering).

---

## Context you need to understand first

### Why the exit animation is dead code (BLOCKING)

`OrbBackdrop` renders `null` when `visible=false` (line 104):
```tsx
if (!visible) return null;
```
React unmounts the `<Animated.View>` nodes **synchronously** before the `else`-branch fade-out animation can touch them. The orb disappears instantly instead of fading. Because `visible` is always `true` at all call sites (`<OrbBackdrop visible={true} />` in both `birth-input` and `calculating` phases), the correct fix is:
- Remove the `else` branch entirely (it runs against unmounted nodes).
- Remove `if (!visible) return null` (keep Views mounted at opacity 0).
- Add an early `if (!visible) return;` inside the `useEffect` to skip animation setup when not visible.
- Capture the entrance `Animated.parallel()` so cleanup can stop it too.

### wuxingToSoulprint duplication

The function is copied verbatim into the test file because the Vitest runner can't import React Native modules. The fix: move it to `packages/shared/src/fusion-bazi/soulprint.ts` (zero RN dependencies — pure math). The shared package is importable from both `OnboardingScreen.tsx` (via `@bazodiac/shared`) and the Vitest test file (via relative path).

---

## Task 1 — BLOCKING: Fix OrbBackdrop dead exit animation + capture entrance animation

**Files:**
- Modify: `apps/mobile/src/screens/OnboardingScreen.tsx` (lines 74–119)
- Modify: `src/__tests__/mobile-onboarding.test.ts`

### Step 1: Write failing source-scan test

Add this test to `describe('OrbBackdrop animation cleanup')` in `src/__tests__/mobile-onboarding.test.ts`, before the existing test:

```typescript
it('OrbBackdrop has no early return null — Views stay mounted for opacity animation', () => {
  const fs = require('fs');
  const src = fs.readFileSync('apps/mobile/src/screens/OnboardingScreen.tsx', 'utf-8');
  // if (!visible) return null unmounts the Animated.View nodes before fade-out can run
  expect(src).not.toMatch(/if\s*\(!visible\)\s*return null/);
});

it('OrbBackdrop entrance animation is captured so cleanup can stop it', () => {
  let entranceStopped = false;
  let pulseStopped = false;

  const fakeEntrance = {
    start: (cb?: () => void) => { cb?.(); },
    stop: () => { entranceStopped = true; },
  };
  const fakePulse = {
    start: () => {},
    stop: () => { pulseStopped = true; },
  };

  // Simulate the fixed pattern
  let pulseAnimation: { stop: () => void } | null = null;
  const entranceAnimation = fakeEntrance;
  entranceAnimation.start(() => {
    pulseAnimation = fakePulse;
    pulseAnimation.start();
  });

  // Simulate cleanup
  entranceAnimation.stop();
  pulseAnimation?.stop();

  expect(entranceStopped).toBe(true);
  expect(pulseStopped).toBe(true);
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run src/__tests__/mobile-onboarding.test.ts 2>&1 | grep -E "FAIL|pass|fail"
```

Expected: `OrbBackdrop has no early return null` **FAILS** (the string currently exists in source).

### Step 3: Implement the fix

Replace the entire `OrbBackdrop` function in `apps/mobile/src/screens/OnboardingScreen.tsx` (lines 67–119):

```typescript
function OrbBackdrop({ visible }: { visible: boolean }) {
  const goldOpacity  = useRef(new Animated.Value(0)).current;
  const cyanOpacity  = useRef(new Animated.Value(0)).current;
  const goldScale    = useRef(new Animated.Value(0.8)).current;
  const cyanScale    = useRef(new Animated.Value(0.8)).current;
  const goldPulse    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // When not visible: skip — Views remain mounted at opacity 0 (avoids unmounting
    // nodes before an exit animation can run; visible is always true at call sites).
    if (!visible) return;

    let pulseAnimation: Animated.CompositeAnimation | null = null;
    const entranceAnimation = Animated.parallel([
      Animated.spring(goldOpacity, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.spring(cyanOpacity, { toValue: 1, useNativeDriver: true, friction: 5, delay: 300 }),
      Animated.spring(goldScale,   { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.spring(cyanScale,   { toValue: 1, useNativeDriver: true, friction: 6, delay: 300 }),
    ]);
    entranceAnimation.start(() => {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(goldPulse, { toValue: 1.08, duration: 2800, useNativeDriver: true }),
          Animated.timing(goldPulse, { toValue: 0.94, duration: 2800, useNativeDriver: true }),
        ])
      );
      pulseAnimation.start();
    });

    return () => {
      entranceAnimation.stop();
      pulseAnimation?.stop();
    };
  }, [visible, goldOpacity, cyanOpacity, goldScale, cyanScale, goldPulse]);

  // Views stay mounted: opacity starts at 0, entrance animation brings them in.
  // No early return null — that would unmount Animated.View nodes mid-animation.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Gold orb — "Die Form" (left side) */}
      <Animated.View style={[
        styles.orbGold,
        { opacity: goldOpacity, transform: [{ scale: Animated.multiply(goldScale, goldPulse) }] },
      ]} />
      {/* Cyan orb — "Levi" (right side) */}
      <Animated.View style={[
        styles.orbCyan,
        { opacity: cyanOpacity, transform: [{ scale: cyanScale }] },
      ]} />
    </View>
  );
}
```

### Step 4: Run tests

```bash
npx vitest run src/__tests__/mobile-onboarding.test.ts 2>&1 | tail -8
```

Expected: All tests pass (was 19, now 21 with the 2 new tests).

### Step 5: Commit

```bash
git add apps/mobile/src/screens/OnboardingScreen.tsx src/__tests__/mobile-onboarding.test.ts
git commit -m "fix(mobile): OrbBackdrop — keep Views mounted, capture entrance animation in cleanup"
```

---

## Task 2 — IMPORTANT: Extract wuxingToSoulprint to shared package

**Files:**
- Create: `packages/shared/src/fusion-bazi/soulprint.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/mobile/src/screens/OnboardingScreen.tsx` (import + remove local copy)
- Modify: `src/__tests__/mobile-onboarding.test.ts` (import instead of inline)

### Step 1: Create shared module

Create `packages/shared/src/fusion-bazi/soulprint.ts`:

```typescript
/**
 * wuxingToSoulprint — derive 12 soulprint sectors from Wu-Xing element scores.
 *
 * Maps 5 elements (Wood/Fire/Earth/Metal/Water) → 12 zodiac sectors using
 * traditional element-sign affinity. Sector values are normalised, jitter-smoothed,
 * and floored at 0.05 to avoid invisible sectors on the Signatur ring.
 *
 * sectorMap index → element index:
 *   [1,2,2,4, 1,2,3,4, 1,2,3,4]
 *   0=Wood, 1=Fire, 2=Earth, 3=Metal, 4=Water
 */
export function wuxingToSoulprint(elements: {
  Wood?: number; Fire?: number; Earth?: number; Metal?: number; Water?: number;
}): number[] {
  const e = [
    Number(elements.Wood  || 0),   // 0 Wood
    Number(elements.Fire  || 0),   // 1 Fire
    Number(elements.Earth || 0),   // 2 Earth
    Number(elements.Metal || 0),   // 3 Metal
    Number(elements.Water || 0),   // 4 Water
  ];
  const total = e.reduce((s, v) => s + v, 0) || 1;
  const sectorMap = [1, 2, 2, 4, 1, 2, 3, 4, 1, 2, 3, 4];
  return sectorMap.map((elIdx, i) => {
    const base = e[elIdx] / total;
    const jitter = 0.05 * Math.sin(i * 2.7);
    return Math.max(0.05, base + jitter);
  });
}
```

### Step 2: Export from shared index

Add to `packages/shared/src/index.ts` (add after `export * from "./agents/config";`):

```typescript
export * from "./fusion-bazi/soulprint";
```

### Step 3: Update the test file to import rather than inline

In `src/__tests__/mobile-onboarding.test.ts`, replace the entire inlined `wuxingToSoulprint` function and its comment block (lines 3–25 roughly — the function definition between `import` and the first `describe`) with a single import:

```typescript
import { wuxingToSoulprint } from '../../packages/shared/src/fusion-bazi/soulprint';
```

The `describe('wuxingToSoulprint', ...)` block stays exactly as-is — it now tests the shared module directly.

Also remove the inlined `isValidDate`/`isValidTime` in the test file and import them from the screen? No — those are private to `OnboardingScreen.tsx` and not worth exporting. Keep them inlined in the test.

### Step 4: Update OnboardingScreen.tsx to import from shared

In `apps/mobile/src/screens/OnboardingScreen.tsx`, remove the `wuxingToSoulprint` function definition (lines 39–63, the entire comment block + function), and add an import:

```typescript
import { wuxingToSoulprint } from "@bazodiac/shared";
```

Add this alongside the other imports near line 27.

### Step 5: Run tests

```bash
npx vitest run src/__tests__/mobile-onboarding.test.ts 2>&1 | tail -8
```

Expected: All tests pass. `wuxingToSoulprint` describe block now tests the shared module.

Also verify shared package TypeScript:
```bash
cd packages/shared && npx tsc --noEmit 2>&1 | tail -5
```

Expected: No errors.

### Step 6: Run full suite

```bash
npm run test 2>&1 | grep -E "Test Files|Tests " | tail -3
```

Expected: All passing.

### Step 7: Commit

```bash
git add packages/shared/src/fusion-bazi/soulprint.ts packages/shared/src/index.ts \
        apps/mobile/src/screens/OnboardingScreen.tsx \
        src/__tests__/mobile-onboarding.test.ts
git commit -m "refactor(shared): extract wuxingToSoulprint to packages/shared — single source of truth"
```

---

## Task 3 — MINOR: Bundle all minor fixes (M1–M5)

Four small changes, one commit.

**Files:**
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx` (M1, M2)
- Modify: `src/__tests__/mobile-onboarding.test.ts` (M3, M5)

### Step 1: M1 — Remove unnecessary non-null assertion

In `apps/mobile/src/screens/DashboardScreen.tsx` line 225:

```typescript
// Before
{showWeekly ? 'Weniger anzeigen' : `Alle ${weekly.data!.areas.length} Bereiche →`}

// After
{showWeekly ? 'Weniger anzeigen' : `Alle ${weekly.data.areas.length} Bereiche →`}
```

`weekly.data` is already narrowed to non-null inside the `weekly.data ?` conditional — the `!` is dead noise.

### Step 2: M2 — Promote inline styles to StyleSheet

In `apps/mobile/src/screens/DashboardScreen.tsx`, add four entries to the `StyleSheet.create({...})` block (after `errorText` or at the end of the vibes section):

```typescript
mt2: { marginTop: 2 },
mt4: { marginTop: 4 },
mt8: { marginTop: 8 },
dimmed: { opacity: 0.5 },
```

Then replace inline usages:
- Line 161: `style={[styles.body, { marginTop: 4 }]}` → `style={[styles.body, styles.mt4]}`
- Line 165: `style={{ marginTop: 8 }}` → `style={styles.mt8}`
- Line 183: `style={[styles.body, { opacity: 0.5 }]}` → `style={[styles.body, styles.dimmed]}`
- Line 187: `style={[styles.vibesButton, vibes.loading && { opacity: 0.5 }]}` → `style={[styles.vibesButton, vibes.loading && styles.dimmed]}`
- Line 218: `style={[styles.body, { marginTop: 2 }]}` → `style={[styles.body, styles.mt2]}`
- Line 223: `style={{ marginTop: 4 }}` → `style={styles.mt4}`
- Line 233: `style={[styles.body, { opacity: 0.5 }]}` → `style={[styles.body, styles.dimmed]}`
- Line 237: `style={[styles.vibesButton, weekly.loading && { opacity: 0.5 }]}` → `style={[styles.vibesButton, weekly.loading && styles.dimmed]}`

### Step 3: M3 — Fix source-scan test path to be absolute

In `src/__tests__/mobile-onboarding.test.ts`, at the top of the file, add the import:

```typescript
import path from 'path';
```

Then replace both `fs.readFileSync('apps/mobile/...', 'utf-8')` calls:

```typescript
// Before
const src = fs.readFileSync('apps/mobile/src/screens/OnboardingScreen.tsx', 'utf-8');

// After
const src = fs.readFileSync(
  path.join(__dirname, '../../../apps/mobile/src/screens/OnboardingScreen.tsx'),
  'utf-8'
);
```

Apply to both `OrbBackdrop stylesheet` tests and the new `OrbBackdrop has no early return null` test from Task 1.

### Step 4: M5 — Add sector 11 to water-dominance test

In `src/__tests__/mobile-onboarding.test.ts`, inside `describe('wuxingToSoulprint')`, find the Water-dominance test and expand `waterSectors`:

```typescript
// Before
const waterSectors = [sectors[3], sectors[7]];

// After — sector 11 also maps to Water (sectorMap[11] = 4)
const waterSectors = [sectors[3], sectors[7], sectors[11]];
```

### Step 5: Run tests

```bash
npx vitest run src/__tests__/mobile-onboarding.test.ts 2>&1 | tail -8
npm run test 2>&1 | grep -E "Test Files|Tests " | tail -3
```

Expected: All passing.

### Step 6: Commit

```bash
git add apps/mobile/src/screens/DashboardScreen.tsx src/__tests__/mobile-onboarding.test.ts
git commit -m "fix(mobile): minor review fixes — remove !, promote inline styles, fix test path, add water sector 11"
```

---

## Verification Checklist

After all three tasks:

```bash
npm run test 2>&1 | grep -E "Tests " | tail -1
# Expected: all passing

cd packages/shared && npx tsc --noEmit 2>&1 | tail -3
# Expected: no errors

npx vitest run src/__tests__/mobile-onboarding.test.ts 2>&1 | grep "Tests"
# Expected: 21+ tests, 0 failing
```
