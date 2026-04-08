# Bug Fix Sweep Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 pre-existing test failures and 3 code quality bugs surfaced by code review, then bring documentation and the bug tracker up to date.

**Architecture:** All fixes are surgical — one file or one concept each. No shared state changes. Tests first on every code change.

**Tech Stack:** TypeScript, Vitest, React, Tailwind v4, `src/lib/fusion-bazi/resonance.ts` (locked module), `2-design/architecture.md`.

---

## Bug inventory

| # | ID | File | Symptom |
|---|-----|------|---------|
| 1 | BUG-FT-1 | `src/__tests__/kp-coercion.test.ts:11` | Inline function uses `"Calm"` and `"Storm"` but tests expect `"Quiet"` and `"storm"` |
| 2 | BUG-FT-2 | `src/__tests__/planetarium-context.test.tsx:25,31` | `getByText('current')` finds 2 nodes after mode switch — span + button |
| 3 | BUG-UI-1 | `src/components/dashboard/AktiveEinfluesseFusion.tsx:128` | `bg-white/8` is not a valid Tailwind v4 opacity class (no `/8` stop) |
| 4 | BUG-REFACTOR-1 | `src/components/dashboard/AktiveEinfluesseFusion.tsx:99–104` | `VALID_STEMS` hardcodes stem list that can drift from `HeavenlyStem` type |
| 5 | BUG-DOCS-1 | `2-design/architecture.md:325–327,357` | Hook table + data flow diagram still reference cancelled `useTransitNow` and old `useTransitState` interface |
| 6 | BUG-TRACKER-1 | `3-code/tasks.md:257–259` | BUG-21/22/23 rows still show `Todo` despite having been fixed in earlier commits |

---

### Task 1: Fix kp-coercion English labels

**What's broken:**  
`src/__tests__/kp-coercion.test.ts` defines an inline pure function `computeKpBadgeLabel` (lines 7–13). The function body uses `"Calm"` for the no-storm EN label and `"Storm"` (title-case) for storm labels. Two test expectations disagree: line 35 expects `"Quiet"`, line 39 expects lowercase `"storm"`. The function is the subject under test — the expectations are the spec. Fix the function, not the expectations.

**Files:**
- Modify: `src/__tests__/kp-coercion.test.ts:11`

**Step 1: Confirm the current failure**

```bash
npx vitest run src/__tests__/kp-coercion.test.ts 2>&1 | grep "FAIL\|Expected\|Received"
```
Expected output includes:
```
Expected: "Kp 0.0 · Quiet"
Received: "Kp 0.0 · Calm"
Expected: "Kp 5.1 · G3 storm"
Received: "Kp 5.1 · G3 Storm"
```

**Step 2: Fix the inline function**

In `src/__tests__/kp-coercion.test.ts`, change line 11 from:
```typescript
const labelEn = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} Storm` : `Kp ${kp.toFixed(1)} · Calm`;
```
to:
```typescript
const labelEn = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} storm` : `Kp ${kp.toFixed(1)} · Quiet`;
```
(lowercase `storm`, `Quiet` not `Calm`)

**Step 3: Verify all 5 tests pass**

```bash
npx vitest run src/__tests__/kp-coercion.test.ts
```
Expected: `5 passed`

**Step 4: Commit**

```bash
git add src/__tests__/kp-coercion.test.ts
git commit -m "fix(test): correct EN labels in kp-coercion inline helper — Quiet/storm not Calm/Storm"
```

---

### Task 2: Fix planetarium-context ambiguous selector

**What's broken:**  
After `setSkyMode('current')`, the `<span data-testid="sky-mode">` renders `current` and the `<button>current</button>` is still present. `screen.getByText('current')` finds both → throws. Fix: use `getByRole('button', { name: 'current' })` to target the button specifically.

**Files:**
- Modify: `src/__tests__/planetarium-context.test.tsx:25,31`

**Step 1: Confirm the failure**

```bash
npx vitest run src/__tests__/planetarium-context.test.tsx 2>&1 | grep "FAIL\|Found multiple"
```
Expected: `Found multiple elements with the text: current`

**Step 2: Fix both fireEvent.click calls**

In `src/__tests__/planetarium-context.test.tsx`, change:
- Line 25: `fireEvent.click(screen.getByText('current'))` → `fireEvent.click(screen.getByRole('button', { name: 'current' }))`
- Line 31: same change (same pattern used for the third test)

After fix the file should look like:
```typescript
it('switches to current sky', async () => {
  render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'current' })); });
  expect(screen.getByTestId('sky-mode').textContent).toBe('current');
});

it('switching to current sky enables planetariumMode', async () => {
  render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'current' })); });
  expect(screen.getByTestId('planetarium').textContent).toBe('true');
});
```

**Step 3: Verify all 3 tests pass**

```bash
npx vitest run src/__tests__/planetarium-context.test.tsx
```
Expected: `3 passed`

**Step 4: Verify full suite — should now be 0 pre-existing failures**

```bash
npx vitest run 2>&1 | grep "Tests "
```
Expected: `N passed (N)` with no `failed`

**Step 5: Commit**

```bash
git add src/__tests__/planetarium-context.test.tsx
git commit -m "fix(test): use getByRole(button) to avoid ambiguous getByText in planetarium test"
```

---

### Task 3: Fix invalid Tailwind opacity class

**What's broken:**  
`src/components/dashboard/AktiveEinfluesseFusion.tsx:128` has `bg-white/8`. Tailwind v4 does not include a `/8` opacity stop in the default scale. The class is silently ignored — the skeleton row renders without the intended tint.

**Files:**
- Modify: `src/components/dashboard/AktiveEinfluesseFusion.tsx:128`

**Step 1: Confirm the class is the bug**

```bash
grep -n "bg-white/8" src/components/dashboard/AktiveEinfluesseFusion.tsx
```
Expected: `128:            <div className="h-3 w-32 rounded bg-white/8" />`

**Step 2: Write a test that confirms the skeleton renders visible rows**

In `src/__tests__/aktive-einfluesse-fusion.test.tsx`, add before the last `});`:
```typescript
it('skeleton rows have no invalid Tailwind classes', () => {
  vi.mocked(useDailyTransit).mockReturnValue({
    bodies: null,
    loading: true,
    error: null,
  });
  const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
  const rows = container.querySelectorAll('[class*="bg-white/"]');
  rows.forEach((el) => {
    // bg-white/8 is invalid — all opacity classes should use steps ≥ 10
    const cls = el.getAttribute('class') ?? '';
    expect(cls).not.toMatch(/bg-white\/[1-9](?!\d)/);
  });
});
```

**Step 3: Run to confirm it fails**

```bash
npx vitest run src/__tests__/aktive-einfluesse-fusion.test.tsx 2>&1 | grep "FAIL\|passed"
```

**Step 4: Fix the class**

In `src/components/dashboard/AktiveEinfluesseFusion.tsx`, change line 128:
```diff
-            <div className="h-3 w-32 rounded bg-white/8" />
+            <div className="h-3 w-32 rounded bg-white/10" />
```

**Step 5: Run tests — all pass**

```bash
npx vitest run src/__tests__/aktive-einfluesse-fusion.test.tsx
```
Expected: `10 passed`

**Step 6: Commit**

```bash
git add src/components/dashboard/AktiveEinfluesseFusion.tsx src/__tests__/aktive-einfluesse-fusion.test.tsx
git commit -m "fix(ui): replace invalid bg-white/8 Tailwind class with bg-white/10 in skeleton"
```

---

### Task 4: Fix VALID_STEMS to use STEM_ELEMENT keys

**What's broken:**  
`src/components/dashboard/AktiveEinfluesseFusion.tsx:99–104` defines `VALID_STEMS` as a manually hardcoded `Set<string>` of the 10 Heavenly Stems. If `resonance.ts` ever adds or removes stems, this set silently diverges. The module already exports `STEM_ELEMENT` (a `Record<HeavenlyStem, WuXingElement>`) — its key set IS the canonical list.

**Files:**
- Modify: `src/components/dashboard/AktiveEinfluesseFusion.tsx:97–105`

**Step 1: Look at the current code**

```bash
sed -n '97,110p' src/components/dashboard/AktiveEinfluesseFusion.tsx
```

**Step 2: Write a test proving the guard stays in sync with resonance.ts**

In `src/__tests__/aktive-einfluesse-fusion.test.tsx`, add:
```typescript
import { STEM_ELEMENT } from '../lib/fusion-bazi/resonance';

it('isHeavenlyStem guard accepts all stems in STEM_ELEMENT', () => {
  // All keys in STEM_ELEMENT must render the component (not null)
  Object.keys(STEM_ELEMENT).forEach((stem) => {
    const { getByTestId, unmount } = render(
      <AktiveEinfluesseFusion dayMasterStem={stem} />
    );
    expect(getByTestId('aktive-einfluesse-fusion')).toBeInTheDocument();
    unmount();
  });
});
```

**Step 3: Run to confirm it passes with current code (green baseline)**

```bash
npx vitest run src/__tests__/aktive-einfluesse-fusion.test.tsx 2>&1 | grep "passed\|failed"
```

**Step 4: Replace VALID_STEMS with STEM_ELEMENT-based guard**

In `src/components/dashboard/AktiveEinfluesseFusion.tsx`, update the import at the top:
```diff
 import {
   calculatePlanetBaziResonance,
   type PlanetName,
   type HeavenlyStem,
   type WuXingElement,
   type ResonanceType,
+  STEM_ELEMENT,
 } from '../../lib/fusion-bazi/resonance';
```

Then replace lines 99–104 (the VALID_STEMS block):
```diff
-const VALID_STEMS = new Set<string>([
-  'Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui',
-]);
-
-function isHeavenlyStem(s: string | undefined): s is HeavenlyStem {
-  return s != null && VALID_STEMS.has(s);
-}
+// Uses STEM_ELEMENT keys as the canonical HeavenlyStem list — stays in sync with resonance.ts
+function isHeavenlyStem(s: string | undefined): s is HeavenlyStem {
+  return s != null && s in STEM_ELEMENT;
+}
```

**Step 5: Run all AktiveEinfluesseFusion tests**

```bash
npx vitest run src/__tests__/aktive-einfluesse-fusion.test.tsx
```
Expected: all pass (11 now)

**Step 6: Typecheck**

```bash
npm run typecheck:src
```
Expected: `No TypeScript errors in src/`

**Step 7: Commit**

```bash
git add src/components/dashboard/AktiveEinfluesseFusion.tsx src/__tests__/aktive-einfluesse-fusion.test.tsx
git commit -m "refactor(AktiveEinfluesseFusion): derive isHeavenlyStem guard from STEM_ELEMENT keys — eliminates drift risk"
```

---

### Task 5: Update stale architecture.md hook references

**What's broken:**  
`2-design/architecture.md` lines 325–327 contain a hook table that includes `useTransitNow()` (cancelled task) and `useTransitState(soulprint, quiz)` (cancelled — the actual implementation is `useFusionSignal(userId)` from `src/hooks/useFusionSignal.ts`). The data flow diagram at line 357 also references `useTransitState`.

No code change — only the design document.

**Files:**
- Modify: `2-design/architecture.md` (lines 319–366)

**Step 1: Read the current section**

```bash
sed -n '319,375p' 2-design/architecture.md
```

**Step 2: Replace the hook table**

Current:
```markdown
| Hook | BAFE source | Cache TTL | Output |
|------|-------------|-----------|--------|
| `useTransitNow()` | `GET /transit/now` | 5 min (in-memory) | `sector_intensity[12]` |
| `useTransitState(soulprint, quiz)` | `POST /transit/state` | 15 min, keyed on input hash | `events[]`, `transit_contribution` |
| `useDailyTransit(date, tz, lat, lon)` | `POST /calculate/western` with today's date | 1 hour, keyed on date | `bodies{}`, `aspects[]` |
```

Replace with:
```markdown
| Hook | Endpoint | Cache TTL | Output |
|------|----------|-----------|--------|
| `useFusionSignal(userId)` | `GET /api/transit-state/:userId` | Polled 800ms, server-side cache | `events[]` (TransitEvent with description_de, personal_context, priority) |
| `useDailyTransit()` | `POST /api/calculate/western` (date=today noon UTC, lat=0 lon=0) | 1 hour, keyed on UTC date | `bodies{}` with degree_in_sign, is_retrograde |
```

**Step 3: Replace the data flow diagram**

Current (lines ~352–373):
```
useDailyTransit() ─────────────────────────────────┐
  (POST /calculate/western, date=today)             │
  → bodies{ planet: {degree, sign, retrograde} }   │
                                                    ├──> AktiveEinfluesseFusion
useTransitState(soulprint, quiz) ───────────────────┤    (6 planet cards)
  (POST /transit/state)                             │
  → events[], transit_contribution                  │
         │                                          │
         └──> DayPulseExpanded                     │
              (description_de, personal_context)   │
                                                   │
apiData.bazi.pillars.day.stem ──> fusion-bazi/ ────┘
```

Replace with:
```
useDailyTransit() ─────────────────────────────────┐
  (POST /api/calculate/western, date=today)         │
  → bodies{ planet: {degree_in_sign, is_retrograde}}│
                                                    ├──> AktiveEinfluesseFusion
apiData.bazi.pillars.day.stem ──> fusion-bazi/ ────┘    (6 planet cards)
  (Day Master HeavenlyStem)       resonance.ts
                                  → ResonanceResult

useFusionSignal(userId) ─────────> DayPulseExpanded
  (GET /api/transit-state/:userId) (description_de, personal_context)
  → events[].description_de

useSpaceWeather() ──────────────> MagnetsturmKarte
  (kpIndex >= 4 → visible)

apiData.{bazi,western,wuxing} ──> NatalSignaturStatic
  (static, collapsed by default)
```

**Step 4: Verify no other stale references remain**

```bash
grep -n "useTransitNow\|useTransitState" 2-design/architecture.md
```
Expected: no output

**Step 5: Commit**

```bash
git add 2-design/architecture.md
git commit -m "docs(architecture): replace cancelled useTransitNow/useTransitState with actual useFusionSignal/useDailyTransit"
```

---

### Task 6: Update bug tracker — BUG-21/22/23 to Done

**What's broken:**  
`3-code/tasks.md` Bug Tracker section shows BUG-21, BUG-22, and BUG-23 as `Todo`. All three were fixed in earlier commits:
- BUG-21 (quiz latency): Fixed by `TASK-quiz-result-latency-fix` (Done)
- BUG-22 (placeholder headings): Fixed by `TASK-quiz-placeholder-headings-fix` (Done)
- BUG-23 (ElevenLabs overlay): Fixed in commits `4decbab` and `af4c176`

**Files:**
- Modify: `3-code/tasks.md` lines 257–259

**Step 1: Look at the current lines**

```bash
sed -n '257,259p' 3-code/tasks.md
```

**Step 2: Update BUG-21 to Done**

Change the BUG-21 row from `| api-server | Todo |` to `| api-server | Done |` and append fix note:
```
| BUG-21 | Quiz result generation latency 3-4 minutes (expected: seconds) | api-server | Done | Fixed: refresh() added to useFusionSignal + 500ms delayed call post-quiz in FuRingPage (TASK-quiz-result-latency-fix) |
```

**Step 3: Update BUG-22 to Done**

```
| BUG-22 | Quiz headings contain DE/EN placeholder text instead of final copy | frontend | Done | Fixed: all 24 quizzes audited, final DE+EN titles+subtitles confirmed (TASK-quiz-placeholder-headings-fix) |
```

**Step 4: Update BUG-23 to Done**

```
| BUG-23 | UI layer covers ElevenLabs widget — agents cannot be selected/clicked | frontend | Done | Fixed: global ElevenLabs script + z-index:2147483647 + position:fixed + pointer-events:auto on widget container (commits 4decbab, af4c176) |
```

**Step 5: Verify final test suite is fully green (except any still-known pre-existing)**

```bash
npx vitest run 2>&1 | grep "Tests "
```
Expected: all passed, 0 failed

**Step 6: Commit**

```bash
git add 3-code/tasks.md
git commit -m "docs(tasks): mark BUG-21/22/23 as Done — tracker lagged behind actual fix commits"
```

---

## Final verification

```bash
npx vitest run 2>&1 | grep "Tests "
npm run typecheck:src
grep -n "useTransitNow\|useTransitState" 2-design/architecture.md
grep "BUG-21\|BUG-22\|BUG-23" 3-code/tasks.md | grep "Todo"
```

All expected to return clean.
