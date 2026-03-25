# Fix Stale Tests — cosmic-encounter-flag + first-time-experience-e2e

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Die 3 pre-existing Test-Failures beseitigen, die seit Wochen die Testsuite verschmutzen.

**Architecture:** Beide Bugs sind Tests, die nicht mehr zur Implementierung passen — kein Code ist kaputt, nur die Tests sind veraltet. Kein Produktionscode wird geändert.

**Tech Stack:** Vitest, React Testing Library

---

## Kontext: Was wo schief läuft

### Bug A — `cosmic-encounter-flag.test.ts` (2 failures)

**Datei:** `src/__tests__/cosmic-encounter-flag.test.ts`
**Implementierung:** `src/lib/feature-flags.ts`

Der Test wurde geschrieben als `cosmic_encounter_v1` noch `true` sein sollte. Dann wurde das Flag absichtlich auf `false` gesetzt UND in `LOCKED_OFF` eingetragen (localStorage-Overrides werden ignoriert). Die Tests prüfen das alte Verhalten.

Aktuelles Verhalten in `feature-flags.ts`:
```typescript
const FLAGS = { cosmic_encounter_v1: false, ... };
const LOCKED_OFF = ['cosmic_encounter_v1']; // hard-disabled, no overrides
```

`isFeatureEnabled('cosmic_encounter_v1')` gibt IMMER `false` zurück — unabhängig von localStorage.

**Failing tests (beide falsch):**
- `defaults to true` → soll `false` sein (locked off)
- `can be enabled via localStorage override` → geht nicht (locked off)

**Fix:** Tests an die aktuelle Implementierung anpassen.

---

### Bug B — `first-time-experience-e2e.test.ts` (1 failure)

**Datei:** `src/__tests__/first-time-experience-e2e.test.ts`
**Implementierung:** `src/hooks/useDashboardTour.ts`

Der Test erwartet eine 4-Schritt-Tour: `0 → 1 → 2 → 3 → done`. Aber `TourStep = 0 | 1 | 'done'` — die Tour hat nur 2 Schritte. Bei `next()` auf Step 1 springt der Hook direkt zu `'done'`, nicht zu `2`.

**Failing test:**
```
act(() => result.current.next()); // 1 → 2  ← erwartet Schritt 2
expect(result.current.tourStep).toBe(2); // FAIL: ist 'done'
```

**Fix:** Test an 2-Schritt-Tour anpassen.

---

## Task 1: Fix cosmic-encounter-flag Tests

**Files:**
- Modify: `src/__tests__/cosmic-encounter-flag.test.ts`

**Step 1: Test laufen lassen um Ausgangszustand zu sehen**

```bash
npx vitest run src/__tests__/cosmic-encounter-flag.test.ts
```

Expected: 2 failed, 1 passed

**Step 2: Tests korrigieren**

Ersetze `src/__tests__/cosmic-encounter-flag.test.ts` komplett:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { isFeatureEnabled } from '../lib/feature-flags';

describe('cosmic_encounter_v1 feature flag', () => {
  beforeEach(() => {
    localStorage.removeItem('ff_cosmic_encounter_v1');
  });

  it('is locked off by default (not yet released)', () => {
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });

  it('cannot be enabled via localStorage — flag is locked off', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'true');
    // LOCKED_OFF flags ignore localStorage overrides
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });

  it('can be explicitly disabled via localStorage (redundant but valid)', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'false');
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });
});
```

**Step 3: Test laufen lassen**

```bash
npx vitest run src/__tests__/cosmic-encounter-flag.test.ts
```

Expected: 3/3 PASS

**Step 4: Commit**

```bash
git add src/__tests__/cosmic-encounter-flag.test.ts
git commit -m "fix(tests): update cosmic-encounter flag tests to match locked-off state"
```

---

## Task 2: Fix first-time-experience-e2e Tour-Progression Test

**Files:**
- Modify: `src/__tests__/first-time-experience-e2e.test.ts`

**Step 1: Test laufen lassen**

```bash
npx vitest run src/__tests__/first-time-experience-e2e.test.ts
```

Expected: 1 failed (full tour progression), 2 passed

**Step 2: Test korrigieren**

`useDashboardTour` hat `TourStep = 0 | 1 | 'done'` — nur 2 Schritte. Der E2E-Test muss das widerspiegeln.

Ersetze `src/__tests__/first-time-experience-e2e.test.ts` komplett:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { tour_completed: false }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({ then: (cb: (r: { error: null }) => void) => cb({ error: null }) }),
      }),
    }),
  },
}));

describe('First-Time Experience E2E', () => {
  it('tour starts at step 0 for new user', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe(0);
  });

  it('full tour progression: 0 → 1 → done', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));

    act(() => result.current.next()); // 0 → 1
    expect(result.current.tourStep).toBe(1);

    act(() => result.current.next()); // 1 → done
    expect(result.current.tourStep).toBe('done');
  });

  it('skip() jumps directly to done', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));

    act(() => result.current.skip());
    expect(result.current.tourStep).toBe('done');
  });
});
```

**Step 3: Test laufen lassen**

```bash
npx vitest run src/__tests__/first-time-experience-e2e.test.ts
```

Expected: 3/3 PASS

**Step 4: Full suite**

```bash
npm run test
```

Expected: 0 failed (alle pre-existing Failures beseitigt), 797+ passed

**Step 5: Commit**

```bash
git add src/__tests__/first-time-experience-e2e.test.ts
git commit -m "fix(tests): correct tour E2E test to match 2-step TourStep type (0|1|done)"
```

---

## Zusammenfassung

| Task | Datei | Problem | Fix |
|------|-------|---------|-----|
| 1 | cosmic-encounter-flag.test.ts | Tests erwarten flag=true, Code sagt locked-off=false | Tests auf locked-off Verhalten anpassen |
| 2 | first-time-experience-e2e.test.ts | Test erwartet 4-Schritt-Tour, Hook hat 2 Schritte | Test auf 0→1→done kürzen |

**Kein Produktionscode wird geändert.** Nur veraltete Tests werden korrigiert.
