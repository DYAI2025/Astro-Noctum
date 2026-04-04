# P1 Bugfix: Dashboard Data Wiring — Zero Gauges, Missing Vibe & Daily Pulse Text

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 production-visible data bugs where Dashboard sections show zero/empty/missing content because `soulprintSectors` is null when the bootstrap (FuFirE) is unavailable.

**Architecture:** The root cause is shared: when `soulprintSectors` is null in the DB (bootstrap failure, pre-migration user), three downstream paths break. The fix is to derive synthetic soulprint sectors from existing BAFE apiData as a fallback, so that InfluenceGauges, VibesSection, and DashboardTagesEnergie all have usable data.

**Tech Stack:** React 19, TypeScript, Vitest, Supabase, Zod schemas

---

## Root Cause Analysis

```
User without soulprint_sectors in DB (bootstrap failed / pre-migration)
        ↓
Dashboard.tsx: profileMeta.soulprintSectors = null
        ↓
┌───────────────────────────────────────────────────────────┐
│ natalWeights = toNatalWeightsOrUndefined(null) → undefined│
│     → InfluenceGauges: weights?.Mars ?? 0 → ALL ZERO      │
│                                                           │
│ useFirstRunDaily guard: !soulprintSectors → SKIP FETCH    │
│     → dailyData stays null → TagesEnergie returns null    │
│                                                           │
│ VibesSection: fetchVibes() succeeds but server has no     │
│     soulprint → returns empty/generic response → blank    │
└───────────────────────────────────────────────────────────┘
```

**Fix strategy:** In Dashboard.tsx, when `soulprintSectors` is null but `apiData` is available, derive a synthetic 12-sector soulprint from the Western zodiac sign using a deterministic mapping. This unblocks all three downstream paths.

---

### Task 1: Derive Synthetic Soulprint from BAFE Data (TASK-influence-gauges-zero-fix)

**Files:**
- Modify: `src/components/Dashboard.tsx:217-224`
- Modify: `src/lib/signatur/weight-utils.ts` (add `syntheticSoulprintFromSign`)
- Create: `src/__tests__/synthetic-soulprint.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/synthetic-soulprint.test.ts`:

```tsx
import { describe, it, expect } from 'vitest';
import { syntheticSoulprintFromSign } from '../lib/signatur/weight-utils';

describe('syntheticSoulprintFromSign', () => {
  it('returns a 12-element array for a valid sign', () => {
    const result = syntheticSoulprintFromSign('Aries');
    expect(result).toHaveLength(12);
    expect(result.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('returns the same array for the same sign (deterministic)', () => {
    const a = syntheticSoulprintFromSign('Cancer');
    const b = syntheticSoulprintFromSign('Cancer');
    expect(a).toEqual(b);
  });

  it('has the highest value at the sign index (0=Aries...11=Pisces)', () => {
    const result = syntheticSoulprintFromSign('Cancer'); // index 3
    expect(result[3]).toBeGreaterThan(result[0]);
  });

  it('returns a uniform 0.5 array for empty string', () => {
    const result = syntheticSoulprintFromSign('');
    expect(result).toEqual(Array(12).fill(0.5));
  });

  it('returns a uniform 0.5 array for unknown sign', () => {
    const result = syntheticSoulprintFromSign('NotASign');
    expect(result).toEqual(Array(12).fill(0.5));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/synthetic-soulprint.test.ts`
Expected: FAIL — `syntheticSoulprintFromSign` does not exist

**Step 3: Implement syntheticSoulprintFromSign**

Add to `src/lib/signatur/weight-utils.ts`:

```tsx
const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/**
 * Generate a synthetic 12-sector soulprint from a zodiac sign name.
 * Used as a fallback when soulprint_sectors is unavailable (bootstrap failure).
 * The sign's sector gets the highest weight; adjacent sectors taper.
 */
export function syntheticSoulprintFromSign(sign: string): number[] {
  const idx = SIGN_ORDER.indexOf(sign);
  if (idx === -1) return Array(12).fill(0.5);

  return Array.from({ length: 12 }, (_, i) => {
    const dist = Math.min(Math.abs(i - idx), 12 - Math.abs(i - idx));
    // Peak at sign index (0.85), smooth taper, floor at 0.25
    return Math.max(0.25, 0.85 - dist * 0.1);
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/synthetic-soulprint.test.ts`
Expected: PASS (5 tests)

**Step 5: Wire the fallback in Dashboard.tsx**

In `src/components/Dashboard.tsx`, find the section where `profileMeta` state is set after the Supabase fetch (line ~217-224). After the existing soulprint assignment, add a fallback:

```tsx
// AFTER existing code (line ~224):
setProfileMeta({
  birthInput,
  soulprintSectors: soulprint,
  quizSectors: EMPTY_SECTORS,
  birthCity: birthRes.data?.place_label || '',
});
```

Also import `syntheticSoulprintFromSign` and add a computed fallback AFTER the `profileMeta` state, before the `natalWeights` memo:

```tsx
import { syntheticSoulprintFromSign } from '@/src/lib/signatur/weight-utils';

// After profileMeta state, before natalWeights memo:
const effectiveSoulprint = profileMeta.soulprintSectors
  ?? syntheticSoulprintFromSign(apiData?.western?.zodiac_sign || '');

// Then change natalWeights to use effectiveSoulprint:
const natalWeights = useMemo(
  () => toNatalWeightsOrUndefined(effectiveSoulprint),
  [effectiveSoulprint],
);

const dimensionWeights = useMemo(
  () => toDimensionWeightsOrUndefined(effectiveSoulprint),
  [effectiveSoulprint],
);
```

**Step 6: Run tests**

Run: `npx vitest run src/__tests__/synthetic-soulprint.test.ts src/__tests__/influence-gauges-live.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add src/lib/signatur/weight-utils.ts src/components/Dashboard.tsx src/__tests__/synthetic-soulprint.test.ts
git commit -m "fix(dashboard): derive synthetic soulprint from zodiac sign when DB soulprint is null

Fixes BUG-17: InfluenceGauges showed 0% for all planets because
natalWeights was undefined when soulprint_sectors was null in DB.
Now falls back to a sign-weighted 12-sector synthetic soulprint."
```

---

### Task 2: Fix Daily Pulse Text Missing (TASK-daily-pulse-text-missing-fix)

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts:81`
- Modify: `src/components/Dashboard.tsx` (pass effectiveSoulprint)

**Step 1: Fix the guard in useFirstRunDaily**

The guard at line 81 blocks the entire fetch when `soulprintSectors` is null:

```tsx
// BEFORE:
if (!userId || !birthData || !soulprintSectors || fetchedRef.current) return;

// AFTER:
if (!userId || !birthData || fetchedRef.current) return;
```

And where `soulprintSectors` is used in the fetchDailyExperience call (line ~121), pass a fallback:

```tsx
const data = await fetchDailyExperience(
  birthData,
  soulprintSectors ?? Array(12).fill(0.5),  // neutral fallback
  quizSectors,
  todayDate,
);
```

**Step 2: Update Dashboard.tsx to pass effectiveSoulprint**

In Dashboard.tsx, where `useFirstRunDaily` is called:

```tsx
// BEFORE:
const { dailyData, dayHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
  userId,
  profileMeta.birthInput,
  profileMeta.soulprintSectors,
  profileMeta.quizSectors,
);

// AFTER:
const { dailyData, dayHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
  userId,
  profileMeta.birthInput,
  effectiveSoulprint,
  profileMeta.quizSectors,
);
```

This ensures the daily fetch always fires when birthInput is available, even without real soulprint data.

**Step 3: Run tests**

Run: `npx vitest run src/__tests__/daily-cache-key.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts src/components/Dashboard.tsx
git commit -m "fix(dashboard): Daily Pulse text missing when soulprint_sectors is null

Remove hard soulprint null guard from useFirstRunDaily — pass neutral
fallback array instead. Daily experience API can work with approximate data."
```

---

### Task 3: Fix Vibe Text Missing (TASK-vibe-text-missing-fix)

**Files:**
- Modify: `src/components/dashboard/VibesSection.tsx`
- Modify: `src/components/dashboard/VibesModal.tsx`

**Step 1: Add error handling for empty Vibe response**

The Vibe API may return a structurally valid response but with empty `kurzsignal` or empty `treiber`. VibesModal should handle this gracefully.

In `src/components/dashboard/VibesModal.tsx`, after the data destructuring, add an empty-content guard:

```tsx
// Near line ~93, after the horizon label:
const hasContent = data.kurzsignal && data.kurzsignal.trim().length > 0;

// In the JSX, wrap the Kurzsignal display:
{hasContent ? (
  <p className="font-serif text-2xl sm:text-3xl text-center leading-snug text-gold max-w-[24ch]">
    {data.kurzsignal}
  </p>
) : (
  <p className="text-sm text-white/40 text-center italic">
    {t('dashboard.vibesModal.emptyContent')}
  </p>
)}
```

**Step 2: Add i18n key**

In `src/i18n/translations.ts`:

EN: `emptyContent: 'Your Vibe is being prepared — please try again shortly.'`
DE: `emptyContent: 'Dein Vibe wird vorbereitet — bitte versuche es gleich nochmal.'`

Add under the existing `dashboard.vibesModal` namespace.

**Step 3: Add PremiumGate to VibesSection**

Per REQ-F-vibes-core (premium-only), wrap the VibesSection CTA:

In `src/components/dashboard/VibesSection.tsx`, import PremiumGate and wrap the button:

```tsx
import { PremiumGate } from '../PremiumGate';

// In the render, wrap the button + cooldown:
<PremiumGate teaser={lang === 'de' ? 'Dein persönlicher Vibe — nur für Premium' : 'Your personal Vibe — Premium only'}>
  <div className="flex flex-col items-center gap-2">
    <button ...>...</button>
    {cooldownLabel && ...}
    {error && ...}
  </div>
</PremiumGate>
```

Note: This also needs the `isPremium` prop or the `usePremium` hook. Check if VibesSection already has access — if not, add `usePremium` import and call.

**Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/dashboard/VibesSection.tsx src/components/dashboard/VibesModal.tsx src/i18n/translations.ts
git commit -m "fix(dashboard): Vibe text missing + premium gate

Handle empty Vibe API response gracefully with fallback message.
Gate VibesSection behind PremiumGate per REQ-F-vibes-core (premium-only)."
```

---

## Summary

| Task | Bug | Root Cause | Fix |
|------|-----|-----------|-----|
| 1 | BUG-17 | soulprint null → natalWeights undefined → 0% | Synthetic soulprint from zodiac sign |
| 2 | BUG-19 | soulprint null guard blocks daily fetch | Remove null guard, pass neutral array |
| 3 | BUG-18 | Empty API response + no premium gate | Empty-content guard + PremiumGate |

**Shared root cause:** All 3 bugs stem from missing `soulprint_sectors` in the DB. Task 1 fixes the upstream data, which cascades to fix Tasks 2 and 3. However, Tasks 2 and 3 have additional defense-in-depth fixes.

**Total: 3 tasks, ~30 minutes, 3 commits**
