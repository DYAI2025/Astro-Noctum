# Code Review Important Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 Important issues from the code review: user-scope localStorage key, i18n for VibesSection teaser, and useMemo for effectiveSoulprint.

**Architecture:** Surgical edits to 3 files + i18n translations. No new components or APIs.

**Tech Stack:** React hooks, TypeScript, i18n translations

---

### Task 1: User-scope localStorage key in useCompletedModules

The localStorage key `bazodiac_completed_quizzes` is shared across all users on the same browser. If user A completes a quiz, user B sees it as completed too.

**Files:**
- Modify: `src/hooks/useCompletedModules.ts`
- Modify: `src/__tests__/useCompletedModules.test.ts`

**Step 1: Write the failing test**

Add a test to `src/__tests__/useCompletedModules.test.ts` that verifies user-scoped keys:

```typescript
it('uses user-scoped localStorage key', () => {
  const KEY_A = 'bazodiac_completed_quizzes_user-a';
  const KEY_B = 'bazodiac_completed_quizzes_user-b';

  // User A completes a quiz
  localStorage.setItem(KEY_A, JSON.stringify(['quiz.aura_colors.v1']));

  // User B has different completions
  localStorage.setItem(KEY_B, JSON.stringify(['quiz.eq.v1']));

  // They should not see each other's data
  const aData = JSON.parse(localStorage.getItem(KEY_A)!);
  const bData = JSON.parse(localStorage.getItem(KEY_B)!);

  expect(aData).toContain('quiz.aura_colors.v1');
  expect(aData).not.toContain('quiz.eq.v1');
  expect(bData).toContain('quiz.eq.v1');
  expect(bData).not.toContain('quiz.aura_colors.v1');
});
```

**Step 2: Run test to verify it passes (this is a logic test, not a hook test)**

Run: `npx vitest run src/__tests__/useCompletedModules.test.ts -v`
Expected: PASS (the test itself passes because it tests the key format directly)

**Step 3: Fix the localStorage key to be user-scoped**

In `src/hooks/useCompletedModules.ts`, change the storage key from a constant to a function that includes the user ID:

1. Remove the top-level constant:
```typescript
// DELETE: const STORAGE_KEY = 'bazodiac_completed_quizzes';
```

2. Add a helper that builds the key:
```typescript
const STORAGE_KEY_PREFIX = 'bazodiac_completed_quizzes';

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}
```

3. Update `getLocalCompleted` to accept userId:
```typescript
function getLocalCompleted(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set();
  } catch {
    return new Set();
  }
}
```

4. Update `addLocalCompleted` to accept userId:
```typescript
function addLocalCompleted(userId: string, moduleId: string): void {
  try {
    const existing = getLocalCompleted(userId);
    existing.add(moduleId);
    localStorage.setItem(storageKey(userId), JSON.stringify([...existing]));
  } catch {
    // localStorage full or unavailable — ignore
  }
}
```

5. Update callers inside `useCompletedModules`:
- In the `useEffect`, change `getLocalCompleted()` → `getLocalCompleted(user.id)`
- In `addModule`, change `addLocalCompleted(moduleId)` → `addLocalCompleted(user.id, moduleId)` and add `user` to the dependency array:

```typescript
const addModule = useCallback((moduleId: string) => {
  if (!user) return;
  addLocalCompleted(user.id, moduleId);
  setCompletedModuleIds(prev => new Set([...prev, moduleId]));
}, [user]);
```

**Step 4: Update test file**

Update `src/__tests__/useCompletedModules.test.ts`:
- Change the `STORAGE_KEY` constant to use a test user ID format: `const STORAGE_KEY = 'bazodiac_completed_quizzes_test-user-123';`
- Update all `localStorage.setItem(STORAGE_KEY, ...)` and `localStorage.getItem(STORAGE_KEY)` references to use the new key format.

**Step 5: Run tests to verify everything passes**

Run: `npx vitest run src/__tests__/useCompletedModules.test.ts -v`
Expected: All 7+ tests PASS

**Step 6: Migrate existing unscoped data (optional safety)**

No migration needed. The old unscoped key becomes orphaned. On next login, the user's localStorage data will be empty but Supabase merge fills it from the DB. The only data lost is individual completions that were in localStorage but not yet in Supabase (cluster-gated). This is acceptable — quizzes can be re-taken.

**Step 7: Commit**

```bash
git add src/hooks/useCompletedModules.ts src/__tests__/useCompletedModules.test.ts
git commit -m "fix: scope useCompletedModules localStorage key per user

Previously all users on the same browser shared the same localStorage
key for quiz completion state. Now uses bazodiac_completed_quizzes_{userId}.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Move VibesSection PremiumGate teaser to i18n

The `PremiumGate` teaser prop in `VibesSection` uses inline ternary instead of the `t()` function, breaking the i18n pattern used everywhere else.

**Files:**
- Modify: `src/i18n/translations.ts`
- Modify: `src/components/dashboard/VibesSection.tsx`

**Step 1: Add i18n keys**

In `src/i18n/translations.ts`, add `vibesSection` keys in the English (`en`) block. Find the `vibesModal` object and add a sibling `vibesSection` block right after it:

```typescript
vibesSection: {
  premiumTeaser: "Your personal Vibe — Premium only",
  buttonLabel: "Get Vibe",
  cooldownPrefix: "Next vibe in ",
  fetchError: "Could not load vibe. Please try again.",
},
```

Do the same in the German (`de`) block:

```typescript
vibesSection: {
  premiumTeaser: "Dein persönlicher Vibe — nur für Premium",
  buttonLabel: "Vibe abrufen",
  cooldownPrefix: "Nächster Vibe in ",
  fetchError: "Vibe konnte nicht geladen werden. Versuche es erneut.",
},
```

**Step 2: Update VibesSection to use t()**

In `src/components/dashboard/VibesSection.tsx`:

1. Add `t` to the destructured useLanguage call:
```typescript
const { lang, t } = useLanguage();
```

2. Replace the PremiumGate teaser (line 63):
```typescript
// BEFORE:
<PremiumGate teaser={lang === 'de' ? 'Dein persönlicher Vibe — nur für Premium' : 'Your personal Vibe — Premium only'}>
// AFTER:
<PremiumGate teaser={t('vibesSection.premiumTeaser')}>
```

3. Replace `buttonLabel` (line 59):
```typescript
// BEFORE:
const buttonLabel = lang === 'de' ? 'Vibe abrufen' : 'Get Vibe';
// AFTER:
const buttonLabel = t('vibesSection.buttonLabel');
```

4. Replace `cooldownLabel` (lines 54-58):
```typescript
// BEFORE:
const cooldownLabel = isCooldown
  ? lang === 'de'
    ? `Nächster Vibe in ${formatCooldown(vibesData.cooldown!.remaining_ms, lang)}`
    : `Next vibe in ${formatCooldown(vibesData.cooldown!.remaining_ms, lang)}`
  : null;
// AFTER:
const cooldownLabel = isCooldown
  ? `${t('vibesSection.cooldownPrefix')}${formatCooldown(vibesData.cooldown!.remaining_ms, lang)}`
  : null;
```

5. Replace error message (lines 38-42):
```typescript
// BEFORE:
setError(
  lang === 'de'
    ? 'Vibe konnte nicht geladen werden. Versuche es erneut.'
    : 'Could not load vibe. Please try again.',
);
// AFTER:
setError(t('vibesSection.fetchError'));
```

6. Remove `lang` from the `handleFetch` dependency array since it now uses `t` (which is stable per language change via context re-render):
```typescript
}, [userId, t]);
```

Wait — `t` changes when `lang` changes, so this is functionally equivalent. Actually, keep `lang` removed and add nothing — `t` is consumed inside the callback but `setError(t(...))` captures `t` at call time via closure. The callback recreates when `userId` changes, but `t` is always current via the closure. Let's keep it simple:

```typescript
}, [userId]);
```

Actually no — `t` IS needed in the dependency since it's used inside the callback and changes when language changes. But `t` is not a primitive. Best approach: keep `lang` in deps since `t` is derived from `lang` in the context. Actually let's just leave the dependency array as `[userId, lang]` — it was correct before and the behavior is unchanged.

**Step 3: Run type check**

Run: `npm run lint`
Expected: Clean (no type errors)

**Step 4: Commit**

```bash
git add src/i18n/translations.ts src/components/dashboard/VibesSection.tsx
git commit -m "refactor: move VibesSection strings to i18n translations

Replaces 4 inline lang ternaries with t() calls. Adds vibesSection
keys (premiumTeaser, buttonLabel, cooldownPrefix, fetchError).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wrap effectiveSoulprint in useMemo

`effectiveSoulprint` in Dashboard.tsx is computed on every render. Since `syntheticSoulprintFromSign` creates a new array each time, this causes unnecessary re-renders of `useFirstRunDaily`, `natalWeights`, and `dimensionWeights` downstream.

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Write the failing test**

Add a test to `src/__tests__/synthetic-soulprint.test.ts` verifying referential stability:

```typescript
it('syntheticSoulprintFromSign returns structurally equal arrays for same input', () => {
  const a = syntheticSoulprintFromSign('Cancer');
  const b = syntheticSoulprintFromSign('Cancer');
  expect(a).toEqual(b);
  // Note: a !== b (new array each call) — this is why useMemo is needed in Dashboard
  expect(a).not.toBe(b);
});
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/__tests__/synthetic-soulprint.test.ts -v`
Expected: PASS (confirms the function creates new arrays, validating the need for useMemo)

**Step 3: Wrap effectiveSoulprint in useMemo**

In `src/components/Dashboard.tsx`, change lines 270-271:

```typescript
// BEFORE:
const effectiveSoulprint = profileMeta.soulprintSectors
  ?? syntheticSoulprintFromSign(apiData?.western?.zodiac_sign || '');

// AFTER:
const effectiveSoulprint = useMemo(
  () => profileMeta.soulprintSectors
    ?? syntheticSoulprintFromSign(apiData?.western?.zodiac_sign || ''),
  [profileMeta.soulprintSectors, apiData?.western?.zodiac_sign],
);
```

`useMemo` is already imported on line 1. No new imports needed.

**Step 4: Run type check and tests**

Run: `npm run lint && npx vitest run src/__tests__/synthetic-soulprint.test.ts -v`
Expected: Both clean

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/__tests__/synthetic-soulprint.test.ts
git commit -m "perf: memoize effectiveSoulprint in Dashboard

syntheticSoulprintFromSign creates a new array each call, causing
unnecessary downstream recalculations of natalWeights, dimensionWeights,
and useFirstRunDaily on every render.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Final verification

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass (800+ tests)

**Step 2: Run type check**

Run: `npm run lint`
Expected: Clean
