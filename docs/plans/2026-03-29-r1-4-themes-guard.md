# R1-4 Themes Guard Fix — Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the always-truthy `daily.fusion.day_mode &&` guard on the themes kicker with a semantically correct `themes.length > 0` check.

**Architecture:** Single-line change in `DashboardTagesEnergie.tsx`. The guard `daily.fusion.day_mode` is typed as `z.enum(['pulse', 'trace'])` — it is never null/undefined, so the condition is always `true` and the kicker paragraph always renders, even when `daily.western.themes` is empty (producing a blank line). The fix replaces the guard with the actual intent: only render when there are themes to show.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library

---

## Bug context

```tsx
// src/components/dashboard/DashboardTagesEnergie.tsx — Element+Headline section

{/* Themes as kicker */}
{daily.fusion.day_mode && (                   // ← always truthy ('pulse'|'trace')
  <p className="text-[10px] font-mono ...">
    {daily.western?.themes?.slice(0, 2).join(' · ') ?? ''}
    {/* ↑ renders '' when themes is empty → invisible blank line in layout */}
  </p>
)}
```

**Problem:** `daily.fusion.day_mode` is `z.enum(['pulse', 'trace'])` — guaranteed non-null by Zod schema. The condition never gates anything. When `western.themes` is `[]`, an empty `<p>` is rendered, taking up space and misleading future readers.

**Fix:**
```tsx
{(daily.western?.themes?.length ?? 0) > 0 && (
  <p className="text-[10px] font-mono ...">
    {daily.western!.themes!.slice(0, 2).join(' · ')}
  </p>
)}
```

Also remove the `?? ''` fallback — it is now unreachable since the guard already ensures themes is non-empty.

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/dashboard/DashboardTagesEnergie.tsx` | Guard ersetzen |
| `src/__tests__/dashboard-tages-energie.test.tsx` | 2 neue Tests anhängen |

---

## Task 1 — Failing tests

**Datei:** `src/__tests__/dashboard-tages-energie.test.tsx`

### Schritt 1: Neue describe-Gruppe am Ende der Datei anhängen

Öffne die Datei und füge vor dem letzten `}` ein:

```tsx
describe('DashboardTagesEnergie — Themes Kicker', () => {
  it('rendert Themes-Kicker wenn western.themes nicht leer', () => {
    mockIsPremium = true;
    // DAILY fixture hat themes: ['Transformation', 'Kommunikation']
    render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={SPACE_WEATHER} />
    );
    expect(screen.getByText('TRANSFORMATION · KOMMUNIKATION')).toBeDefined();
  });

  it('rendert KEINEN Themes-Kicker wenn western.themes leer', () => {
    mockIsPremium = true;
    const dailyNoThemes: DailyResponse = {
      ...DAILY,
      western: { ...DAILY.western, themes: [] },
    };
    render(
      <DashboardTagesEnergie
        daily={dailyNoThemes}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    // Mit dem alten day_mode-Guard würde hier ein leeres <p> gerendert werden.
    // Mit dem korrekten Guard soll die Kicker-Zeile komplett fehlen.
    // Prüfen: kein leeres p-Element mit dem Kicker-Styling
    const allParagraphs = document.querySelectorAll('p.text-\\[10px\\]');
    // Kein solches Element soll existieren
    expect(allParagraphs.length).toBe(0);
  });
});
```

### Schritt 2: Tests ausführen — RED

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:**
- `rendert Themes-Kicker wenn western.themes nicht leer` → FAIL (Text nicht gefunden weil uppercase in CSS, nicht im Text-Node)
- `rendert KEINEN Themes-Kicker wenn western.themes leer` → kann PASS oder FAIL

> **Hinweis zum ersten Test:** Tailwind `uppercase` ist eine CSS-Transformation — der tatsächliche Text im DOM ist **lowercase** (`Transformation · Kommunikation`), nicht `TRANSFORMATION · KOMMUNIKATION`. Wenn der Test fehlschlägt wegen case, passe ihn so an:
>
> ```tsx
> expect(screen.getByText('Transformation · Kommunikation')).toBeDefined();
> ```
>
> Prüfe beim Ausführen welcher Text tatsächlich im DOM steht und passe den Assertion-Text entsprechend an.

---

## Task 2 — Fix implementieren

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: Guard ersetzen

Finde den Block (ca. Zeile 322–327):

```tsx
            {/* Themes as kicker */}
            {daily.fusion.day_mode && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]/50 mb-1">
                {daily.western?.themes?.slice(0, 2).join(' · ') ?? ''}
              </p>
            )}
```

**Ersetzen durch:**

```tsx
            {/* Themes as kicker — only when themes are available */}
            {(daily.western?.themes?.length ?? 0) > 0 && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]/50 mb-1">
                {daily.western!.themes!.slice(0, 2).join(' · ')}
              </p>
            )}
```

**Was sich ändert:**
- Guard: `daily.fusion.day_mode &&` → `(daily.western?.themes?.length ?? 0) > 0 &&`
- Kicker-Text: `{daily.western?.themes?.slice(0, 2).join(' · ') ?? ''}` → `{daily.western!.themes!.slice(0, 2).join(' · ')}` (kein `??''` mehr nötig, Guard stellt sicher dass themes existiert und nicht leer ist)

### Schritt 2: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -5
```

**Erwartetes Ergebnis:** Keine Ausgabe (clean).

### Schritt 3: Tests ausführen — GREEN

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:** Alle 10 Tests grün.

---

## Task 3 — Full Suite + Commit

### Schritt 1: Full Suite

```bash
npx vitest run 2>&1 | tail -4
```

**Erwartetes Ergebnis:** Keine neuen Failures. Pre-existing Failures bleiben.

### Schritt 2: Commit

```bash
git add \
  src/components/dashboard/DashboardTagesEnergie.tsx \
  src/__tests__/dashboard-tages-energie.test.tsx \
  docs/plans/2026-03-29-r1-4-themes-guard.md

git commit -m "fix(dashboard): R1-4 replace always-truthy day_mode guard on themes kicker

daily.fusion.day_mode is z.enum(['pulse','trace']) — never null/undefined,
the guard was always true and rendered an empty <p> when themes is [].

Replace with (daily.western?.themes?.length ?? 0) > 0 to only render
the kicker when there are themes to display. Remove unreachable ?? ''
fallback from the join expression.

Tests: kicker visible with themes, absent with empty themes array."
```

---

## Verifikation

| Check | Kommando | Erwartung |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Keine Fehler |
| Tests | `npx vitest run src/__tests__/dashboard-tages-energie.test.tsx` | 10/10 ✓ |
| Full Suite | `npx vitest run` | Keine neuen Failures |
| Alter Guard weg | `grep "day_mode &&" src/components/dashboard/DashboardTagesEnergie.tsx` | Keine Treffer |
