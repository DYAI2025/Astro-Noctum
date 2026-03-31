# R2-2 + R2-3 + R2-4 — Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Three quality fixes in `DashboardTagesEnergie.tsx`: (1) memoize `buildWeatherPills` to avoid rebuild on every poll cycle; (2) add `role="progressbar"` + ARIA attrs to resonance bar; (3) guard against empty `synthesis` string from AI.

**Architecture:** All three fixes are in `src/components/dashboard/DashboardTagesEnergie.tsx` only. No new files except tests. R2-2 adds `useMemo` following the existing pattern in `InfluenceGauges.tsx`. R2-3 adds ARIA attributes to the `motion.div` resonance bar following the pattern in `DissonanceValues.tsx`. R2-4 adds a German fallback string when `synthesis` and `summary` are both empty strings.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library

---

## Bug context

### R2-2 — `buildWeatherPills` not memoized

```ts
// DashboardTagesEnergie.tsx — inside component, no useMemo
const weatherPills = buildWeatherPills(spaceWeather, daily);
```

`useSpaceWeather()` polls every 5 minutes, triggering a Dashboard state update → `DashboardTagesEnergie` re-renders → `buildWeatherPills` runs again, creating a new array + new JSX icon elements every time. `InfluenceGauges.tsx` (same directory) memoizes an equivalent computation. This fix aligns the pattern.

**Deps for useMemo:**
- `spaceWeather.kpIndex` — pill 1 trigger
- `spaceWeather.gScale` — pill 1 label
- `spaceWeather.xrayClass` — pill 2 trigger + label
- `spaceWeather.events` — pills 3–5 (reference stable between polls unless events change)
- `daily` — transit focus (changes only on day change)

> **Important:** Use the `spaceWeather` object itself as the dep, not individual fields. `useSpaceWeather` creates a new state object on every poll, so `spaceWeather` reference changes are the correct signal. `daily` changes only once per day.

---

### R2-3 — `role="progressbar"` missing on resonance bar

```tsx
// DashboardTagesEnergie.tsx — resonance bar motion.div
<motion.div
  className="h-full rounded-full"
  initial={{ width: 0 }}
  animate={{ width: `${resonancePct}%` }}
  // ↑ no ARIA role, valuenow, valuemin, valuemax, label
/>
```

The project uses `role="progressbar"` in `DissonanceValues.tsx`, `ClusterSidebar.tsx`, `ClusterCard.tsx`. Missing here makes the resonance bar invisible to screen readers. The existing codebase pattern:

```tsx
role="progressbar"
aria-valuenow={pct}
aria-valuemin={0}
aria-valuemax={100}
aria-label="descriptive label"
```

---

### R2-4 — Empty `synthesis` string not guarded

```ts
// DashboardTagesEnergie.tsx
const bodyText = daily.fusion.synthesis || daily.fusion.summary;
```

`z.string()` allows `""`. If the AI generation fails and the server returns `synthesis: ""`, `|| daily.fusion.summary` also returns `""` if both are empty. Result: blank `<p>` body — user sees no daily text. Needs a German fallback string.

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/dashboard/DashboardTagesEnergie.tsx` | Alle drei Fixes |
| `src/__tests__/dashboard-tages-energie.test.tsx` | Neue Tests für R2-3 + R2-4 (R2-2 is structural, no unit test needed) |

---

## Task 1 — Failing tests für R2-3 + R2-4

**Datei:** `src/__tests__/dashboard-tages-energie.test.tsx`

### Schritt 1: Neue describe-Blöcke am Ende der Datei anhängen

```tsx
describe('DashboardTagesEnergie — Resonanz-Bar Accessibility', () => {
  it('hat role="progressbar" auf dem Resonanz-Balken', () => {
    mockIsPremium = true;
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={SPACE_WEATHER} />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
  });

  it('hat aria-valuenow, aria-valuemin, aria-valuemax auf dem Resonanz-Balken', () => {
    mockIsPremium = true;
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={SPACE_WEATHER} />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');
    // aria-valuenow should be a number string
    const valuenow = Number(bar?.getAttribute('aria-valuenow'));
    expect(valuenow).toBeGreaterThanOrEqual(0);
    expect(valuenow).toBeLessThanOrEqual(100);
  });
});

describe('DashboardTagesEnergie — Body Fallback', () => {
  it('zeigt Fallback-Text wenn synthesis und summary beide leer', () => {
    mockIsPremium = true;
    const dailyEmpty: DailyResponse = {
      ...DAILY,
      fusion: { ...DAILY.fusion, synthesis: '', summary: '' },
    };
    render(
      <DashboardTagesEnergie daily={dailyEmpty} dayHarmonic={null} spaceWeather={SPACE_WEATHER} />
    );
    // Kein leerer Body — Fallback-Text soll angezeigt werden
    const body = screen.queryByText('');
    // Suche nach dem Fallback-String
    expect(screen.getByText(/Tagesimpuls wird/i)).toBeDefined();
  });

  it('zeigt synthesis wenn vorhanden', () => {
    mockIsPremium = true;
    render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={SPACE_WEATHER} />
    );
    expect(
      screen.getByText('Heute trägt Feuer deine Energie. Die Holz-Achse ist aktiv.')
    ).toBeDefined();
  });
});
```

### Schritt 2: Tests ausführen — RED

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:**
- `role="progressbar"` Tests → FAIL (kein progressbar im DOM)
- `aria-valuenow` Test → FAIL
- Fallback-Text Test → FAIL (leerer String wird gerendert)
- synthesis-Test → PASS (bereits funktioniert)

---

## Task 2 — R2-3 implementieren: ARIA auf Resonanz-Bar

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: ARIA-Attribute zum resonance-bar `motion.div` hinzufügen

Finde den Bar-Block (ca. Zeile 387):

```tsx
          {/* Bar */}
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${resonancePct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{
                background: `linear-gradient(90deg, #D4AF37 0%, ${resonance > 0.5 ? '#22d3ee' : '#8B6914'} 100%)`,
              }}
            />
          </div>
```

**Ersetzen durch:**

```tsx
          {/* Bar */}
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              role="progressbar"
              aria-valuenow={resonancePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Resonanz mit dem Kosmos: ${resonancePct}%`}
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${resonancePct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{
                background: `linear-gradient(90deg, #D4AF37 0%, ${resonance > 0.5 ? '#22d3ee' : '#8B6914'} 100%)`,
              }}
            />
          </div>
```

### Schritt 2: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -5
```

**Erwartetes Ergebnis:** Keine Ausgabe (clean).

---

## Task 3 — R2-4 implementieren: `bodyText` Fallback

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: Fallback-String hinzufügen

Finde (ca. Zeile 270):

```ts
  // Body: synthesis ist der Haupt-Narrativ
  const bodyText = daily.fusion.synthesis || daily.fusion.summary;
```

**Ersetzen durch:**

```ts
  // Body: synthesis ist der Haupt-Narrativ.
  // Fallback wenn KI-Generierung leer zurückgibt (z.string() erlaubt "").
  const bodyText =
    daily.fusion.synthesis ||
    daily.fusion.summary ||
    'Tagesimpuls wird gerade berechnet …';
```

### Schritt 2: TypeScript + Tests

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -5
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis nach R2-3 + R2-4:** Alle ARIA-Tests + Fallback-Tests grün.

---

## Task 4 — R2-2 implementieren: `useMemo` für `buildWeatherPills`

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: `useMemo` zum React-Import hinzufügen

```tsx
// VORHER (Zeile 1):
import type { ReactNode } from 'react';

// NACHHER:
import { useMemo, type ReactNode } from 'react';
```

### Schritt 2: `buildWeatherPills`-Aufruf in `useMemo` einwickeln

Finde (ca. Zeile 267):

```ts
  const weatherPills = buildWeatherPills(spaceWeather, daily);
```

**Ersetzen durch:**

```ts
  const weatherPills = useMemo(
    () => buildWeatherPills(spaceWeather, daily),
    // spaceWeather reference changes on every 5-min poll (new state object from useSpaceWeather).
    // daily changes at most once per day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spaceWeather, daily],
  );
```

### Schritt 3: TypeScript + Tests

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -5
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep "Tests "
```

**Erwartetes Ergebnis:** Clean. Alle Tests weiterhin grün — `useMemo` ändert kein Verhalten, nur wann der Array gebaut wird.

> **Kein separater Test nötig:** `useMemo` ist ein Render-Optimierung, kein beobachtbares Verhalten. Bestehende Tests die `buildWeatherPills`-Output prüfen (Magnetsturm-Pills etc.) laufen weiter durch und beweisen dass der memoized Output korrekt ist.

---

## Task 5 — Full Suite + Commit

### Schritt 1: Alle neuen Tests

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:** 14/14 grün (10 bestehende + 4 neue).

### Schritt 2: Full Suite

```bash
npx vitest run 2>&1 | tail -3
```

**Erwartetes Ergebnis:** Keine neuen Failures gegenüber Baseline.

### Schritt 3: Commit

```bash
git add \
  src/components/dashboard/DashboardTagesEnergie.tsx \
  src/__tests__/dashboard-tages-energie.test.tsx \
  docs/plans/2026-03-29-r2-2-r2-3-r2-4-memo-aria-fallback.md

git commit -m "fix(dashboard): R2-2 useMemo pills, R2-3 progressbar ARIA, R2-4 body fallback

R2-2: Wrap buildWeatherPills in useMemo([spaceWeather, daily]).
  useSpaceWeather polls every 5min creating new state object → memoize
  to avoid rebuilding array + JSX elements on every poll cycle.
  Pattern consistent with InfluenceGauges.tsx (same directory).

R2-3: Add role=progressbar + aria-valuenow/min/max/label to resonance bar.
  Consistent with DissonanceValues.tsx, ClusterSidebar.tsx, ClusterCard.tsx.
  Tests (2): progressbar role present, ARIA attrs correct.

R2-4: Add German fallback for empty synthesis/summary strings.
  z.string() allows '' — AI generation can fail silently.
  Fallback: 'Tagesimpuls wird gerade berechnet …'
  Tests (2): fallback shown on empty strings, synthesis shown when present."
```

---

## Verifikation

| Check | Kommando | Erwartung |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Keine Fehler |
| Tests | `npx vitest run src/__tests__/dashboard-tages-energie.test.tsx` | 14/14 ✓ |
| Full Suite | `npx vitest run` | Keine neuen Failures |
| useMemo | `grep "useMemo" src/components/dashboard/DashboardTagesEnergie.tsx` | 1 Treffer |
| ARIA | `grep "progressbar" src/components/dashboard/DashboardTagesEnergie.tsx` | 1 Treffer |
| Fallback | `grep "Tagesimpuls wird" src/components/dashboard/DashboardTagesEnergie.tsx` | 1 Treffer |
