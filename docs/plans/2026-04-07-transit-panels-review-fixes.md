# TransitResonancePanels Code Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 7 findings from the `/codex-review` of `TransitResonancePanels.tsx` (3 MEDIUM, 2 LOW, 2 INFO) without changing external behavior.

**Architecture:** All changes are confined to one component file (`TransitResonancePanels.tsx`) and its test file. No new modules needed. Order: structural refactors first (I-1, M-3) → dead param cleanup (M-1) → logic fixes (M-2) → dead code removal (L-1) → test coverage gap (L-2) → unused field decision (I-2).

**Tech Stack:** TypeScript, React 19, Vitest, @testing-library/react

---

### Task 1: Move constants to module scope (M-3 + I-1)

Fixes two issues at once:
- **M-3**: `aspectFraming` and `aspectMap` are rebuilt as new objects on every function call — move them to module-level `const`.
- **I-1**: `ZODIAC_DE` is declared *after* `buildExplanation` which references it — reorder for readability.

**Files:**
- Modify: `src/components/signatur/TransitResonancePanels.tsx`

**Step 1: Verify tests pass before any change**

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: 17 passed.

**Step 2: Extract `ASPECT_FRAMING` to module scope**

In `TransitResonancePanels.tsx`, find the `buildExplanation` function (around line 90). Remove the inner `aspectFraming` object and replace with a module-level const placed directly above `buildExplanation`:

```typescript
// Aspect framing strings — module-level constant (not re-allocated per call)
const ASPECT_FRAMING: Partial<Record<number, string>> = {
  0:   'steht in direkter Verbindung mit',
  60:  'bildet ein unterstützendes Sextil zu',
  90:  'bildet ein forderndes Quadrat zu',
  120: 'bildet ein harmonisches Trigon zu',
  150: 'braucht Anpassung zu',
  180: 'steht im Gegenüber zu',
};
```

Inside `buildExplanation`, replace:
```typescript
// BEFORE
const aspectFraming: Partial<Record<number, string>> = { ... };
const connection = aspectFraming[aspectDeg] ?? 'steht in Beziehung zu';

// AFTER
const connection = ASPECT_FRAMING[aspectDeg] ?? 'steht in Beziehung zu';
```

**Step 3: Extract `ASPECT_MAP` to module scope**

In `getAspectInfo` (around line 64), find the inner `aspectMap` object. Extract to module-level const placed directly above `getAspectInfo`:

```typescript
// Aspect name/quality table — module-level constant
const ASPECT_MAP: Record<number, { name: string; quality: string }> = {
  0:   { name: 'Konjunktion', quality: 'Verschmelzung' },
  30:  { name: 'Halbsextil',  quality: 'Kontakt' },
  60:  { name: 'Sextil',      quality: 'Harmonie' },
  90:  { name: 'Quadrat',     quality: 'Spannung' },
  120: { name: 'Trigon',      quality: 'Fluss' },
  150: { name: 'Quincunx',    quality: 'Anpassung' },
  180: { name: 'Opposition',  quality: 'Gegenüber' },
};
```

Inside `getAspectInfo`, replace:
```typescript
// BEFORE
const aspectMap: Record<...> = { ... };
const found = aspectMap[aspectDeg] ?? ...;

// AFTER
const found = ASPECT_MAP[aspectDeg] ?? { name: `${aspectDeg}°`, quality: 'Transit' };
```

**Step 4: Reorder `ZODIAC_DE` above `buildExplanation` (I-1)**

Cut the `ZODIAC_DE` const (currently near line 132) and paste it above `buildExplanation`. The file structure should now read:
```
PLANET_CONFIG
ASPECT_MAP
getAspectInfo()
ASPECT_FRAMING
ZODIAC_DE
buildExplanation()
poleInsight()
buildPanels()
...
```

**Step 5: Run tests**

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: 17 passed. No behavior change — pure structural refactor.

**Step 6: Commit**

```bash
git add src/components/signatur/TransitResonancePanels.tsx
git commit -m "refactor(transit-panels): extract aspect constants to module scope, reorder ZODIAC_DE"
```

---

### Task 2: Remove dead parameters from `buildExplanation` (M-1)

`buildExplanation` declares `planetKey: string` and `aspectName: string` as parameters but never uses either. The function re-derives the aspect description from `influence.aspectDeg` via `ASPECT_FRAMING`.

**Files:**
- Modify: `src/components/signatur/TransitResonancePanels.tsx`

**Step 1: Remove unused params from the function signature**

```typescript
// BEFORE
function buildExplanation(
  planetKey: string,
  config: PlanetConfig,
  influence: PlanetInfluence,
  birthSign: string,
  aspectName: string,
): string {

// AFTER
function buildExplanation(
  config: PlanetConfig,
  influence: PlanetInfluence,
  birthSign: string,
): string {
```

**Step 2: Update the call site in `buildPanels`**

Find where `buildExplanation` is called (~line 158):

```typescript
// BEFORE
const explanation = buildExplanation(key, config, influence, birthSign, aspectInfo.name);

// AFTER
const explanation = buildExplanation(config, influence, birthSign);
```

**Step 3: Run tests**

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: 17 passed.

**Step 4: Run type check**

```bash
npm run lint
```

Expected: no errors.

**Step 5: Commit**

```bash
git add src/components/signatur/TransitResonancePanels.tsx
git commit -m "refactor(transit-panels): remove unused planetKey and aspectName params from buildExplanation"
```

---

### Task 3: Fix `Live` badge and empty state copy accuracy (M-2)

When `birthSign` is set but `computeTodayPlanetInfluences` returns `null` (unrecognized sign), the **Live** badge shows above the "Geburtszeichen wird benötigt" empty state — both are wrong at the same time.

**Files:**
- Modify: `src/components/signatur/TransitResonancePanels.tsx`
- Modify: `src/__tests__/transit-resonance-panels.test.tsx`

**Step 1: Write two failing tests first**

Add these to the `describe` block in the test file:

```typescript
it('does NOT show Live badge when birthSign is set but compute returns null', () => {
  mockCompute.mockReturnValue(null);
  render(<TransitResonancePanels birthSign="Capricorn" />);
  expect(screen.queryByText('Live')).not.toBeInTheDocument();
});

it('shows different empty copy when birthSign is set vs not set', () => {
  mockCompute.mockReturnValue(null);

  const { rerender } = render(<TransitResonancePanels birthSign="Capricorn" />);
  expect(screen.getByText('Planetenposition konnte nicht berechnet werden.')).toBeInTheDocument();

  rerender(<TransitResonancePanels birthSign={undefined} />);
  expect(screen.getByText('Geburtszeichen wird benötigt, um aktive Planetentransits zu berechnen.')).toBeInTheDocument();
});
```

**Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: 2 new failures (the 2 tests above).

**Step 3: Update `TransitEmptyState` to accept `hasBirthSign` prop**

```typescript
// BEFORE
function TransitEmptyState() {
  return (
    <div className="col-span-full rounded-2xl border border-white/8 bg-black/20 px-6 py-8 text-center">
      <p className="mb-1 text-sm text-white/50">Keine Transit-Daten verfügbar</p>
      <p className="text-[11px] text-white/30">
        Geburtszeichen wird benötigt, um aktive Planetentransits zu berechnen.
      </p>
    </div>
  );
}

// AFTER
function TransitEmptyState({ hasBirthSign }: { hasBirthSign: boolean }) {
  return (
    <div className="col-span-full rounded-2xl border border-white/8 bg-black/20 px-6 py-8 text-center">
      <p className="mb-1 text-sm text-white/50">Keine Transit-Daten verfügbar</p>
      <p className="text-[11px] text-white/30">
        {hasBirthSign
          ? 'Planetenposition konnte nicht berechnet werden.'
          : 'Geburtszeichen wird benötigt, um aktive Planetentransits zu berechnen.'}
      </p>
    </div>
  );
}
```

**Step 4: Gate Live badge on `panels.length > 0` and pass `hasBirthSign` to empty state**

In `TransitResonancePanels`:

```typescript
// BEFORE
{birthSign && (
  <span className="...">Live</span>
)}
...
{panels.length > 0
  ? panels.map(data => <TransitPanel key={data.planetKey} data={data} />)
  : <TransitEmptyState />}

// AFTER
{panels.length > 0 && (
  <span className="...">Live</span>
)}
...
{panels.length > 0
  ? panels.map(data => <TransitPanel key={data.planetKey} data={data} />)
  : <TransitEmptyState hasBirthSign={!!birthSign} />}
```

**Step 5: Update the existing "shows empty state when birthSign is undefined" test**

The existing test at line ~51 now needs to also verify the copy is the "no sign" variant:

```typescript
it('shows empty state when birthSign is undefined', () => {
  mockCompute.mockReturnValue(null);
  render(<TransitResonancePanels birthSign={undefined} />);
  expect(screen.getByText('Keine Transit-Daten verfügbar')).toBeInTheDocument();
  expect(screen.getByText('Geburtszeichen wird benötigt, um aktive Planetentransits zu berechnen.')).toBeInTheDocument();
  expect(screen.queryByText('Live')).not.toBeInTheDocument();
});
```

**Step 6: Run all tests**

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: 19 passed (17 original + 2 new).

**Step 7: Commit**

```bash
git add src/components/signatur/TransitResonancePanels.tsx src/__tests__/transit-resonance-panels.test.tsx
git commit -m "fix(transit-panels): gate Live badge on panels.length, differentiate empty state copy"
```

---

### Task 4: Remove dead `poleInsight` entries + add Sextil test (L-1 + L-2)

**L-1**: The `creativity` and `logic` entries in `poleInsight` are unreachable — only assertion/empathy/intuition/discipline are mapped via `PLANET_CONFIG`.

**L-2**: No test verifies that the Sextil aspect name renders (Jupiter mock has 60° but no assertion exists).

**Files:**
- Modify: `src/components/signatur/TransitResonancePanels.tsx`
- Modify: `src/__tests__/transit-resonance-panels.test.tsx`

**Step 1: Add the missing Sextil test (TDD — test before fix)**

In the test file, add after the Opposition test:

```typescript
it('displays correct aspect name for sextile', () => {
  render(<TransitResonancePanels birthSign="Aries" />);
  expect(screen.getByText('Sextil')).toBeInTheDocument();
});
```

**Step 2: Run tests — confirm new test passes** (it should, since mock has Jupiter at 60°)

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: 20 passed (all pass).

**Step 3: Remove dead entries from `poleInsight`**

```typescript
// BEFORE
function poleInsight(dimensionId: string, isResonant: boolean): string {
  const insights: Record<string, { resonant: string; tension: string }> = {
    assertion:  { resonant: 'kraftvolles, zielgerichtetes Handeln', tension: 'bewusstes Innehalten und Neuausrichtung' },
    empathy:    { resonant: 'tiefes Mitgefühl und emotionale Verbindung', tension: 'gesunde Grenzen und Selbstfürsorge' },
    intuition:  { resonant: 'Weitblick und expansives Denken', tension: 'das Wesentliche klar zu erfassen' },
    discipline: { resonant: 'nachhaltige Strukturen und Verlässlichkeit', tension: 'neue Freiräume durch bewusstes Loslassen' },
    creativity: { resonant: 'schöpferischen Ausdruck und Lebensfreude', tension: 'tiefes Erneuerung durch Neuerfindung' },
    logic:      { resonant: 'analytische Klarheit und Präzision', tension: 'ganzheitliche Synthese statt Einzelteile' },
  };

// AFTER
function poleInsight(dimensionId: string, isResonant: boolean): string {
  const insights: Record<string, { resonant: string; tension: string }> = {
    assertion:  { resonant: 'kraftvolles, zielgerichtetes Handeln', tension: 'bewusstes Innehalten und Neuausrichtung' },
    empathy:    { resonant: 'tiefes Mitgefühl und emotionale Verbindung', tension: 'gesunde Grenzen und Selbstfürsorge' },
    intuition:  { resonant: 'Weitblick und expansives Denken', tension: 'das Wesentliche klar zu erfassen' },
    discipline: { resonant: 'nachhaltige Strukturen und Verlässlichkeit', tension: 'neue Freiräume durch bewusstes Loslassen' },
    // creativity and logic: reserved for future Sun/Mercury transit tracking
  };
```

**Step 4: Run tests — confirm still 20 passed**

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: 20 passed.

**Step 5: Commit**

```bash
git add src/components/signatur/TransitResonancePanels.tsx src/__tests__/transit-resonance-panels.test.tsx
git commit -m "refactor(transit-panels): remove unreachable poleInsight entries, add Sextil test coverage"
```

---

### Task 5: Address unused `quality` field in `AspectInfo` (I-2)

`quality` is populated in `ASPECT_MAP` and returned in `AspectInfo` but never rendered anywhere in `TransitPanel`. Two options:
- **A)** Remove it now (YAGNI — it isn't used yet)
- **B)** Keep it with a comment that `TASK-signatur-transit-panel-detail` will use it as a subtitle

Since `TASK-signatur-transit-panel-detail` is the very next task in the backlog and will likely use this field, Option B avoids churn.

**Files:**
- Modify: `src/components/signatur/TransitResonancePanels.tsx`

**Step 1: Add a comment to the `quality` field**

```typescript
interface AspectInfo {
  name: string;
  /** Short quality label e.g. "Fluss", "Spannung" — used by TASK-signatur-transit-panel-detail as panel subtitle */
  quality: string;
  colorClass: string;
}
```

No behavior change — comment only.

**Step 2: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: 20 new tests pass, no regressions beyond the pre-existing 2 flaky failures (`signatur-v3-performance`, `planetarium-context`).

**Step 3: Commit**

```bash
git add src/components/signatur/TransitResonancePanels.tsx
git commit -m "docs(transit-panels): document quality field usage in upcoming transit-panel-detail task"
```

---

## Verification

After all 5 tasks:

```bash
npx vitest run src/__tests__/transit-resonance-panels.test.tsx
```

Expected: **20 tests, 20 passed**.

```bash
npm run lint
```

Expected: no TypeScript errors.
