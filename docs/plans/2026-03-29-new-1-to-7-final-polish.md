# NEW-1 bis NEW-7 Final Polish — Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finalize `DashboardTagesEnergie.tsx` by fixing the rgba border-color bug, removing redundant operators, deduplicating dual-storm pills, adding ARIA live region, extracting magic numbers to constants, adding unit tests for pure functions, and wiring all UI strings through the i18n system.

**Architecture:** All code changes are in `DashboardTagesEnergie.tsx`. i18n keys are added to both EN and DE sections of `src/i18n/translations.ts`. Pure-function tests go in a new `src/__tests__/tages-energie-helpers.test.ts` (no React/jsdom needed — plain Vitest). Single commit at the end.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, `src/i18n/translations.ts` (existing system)

---

## Bug context recap

| # | Severity | Line | Issue |
|---|---|---|---|
| NEW-1 | 🟡 | 378 | `${pill.color}22` — invalid CSS when color is `rgba(...)` |
| NEW-2 | 🟡 | 142 | `sw.xrayClass ?? 'A'` — `xrayClass: string`, `??` never fires |
| NEW-3 | 🟡 | 125–145 | kp-pill AND geo-storm event pill both appear for same storm |
| NEW-4 | 🟢 | 271 | No `aria-live="polite"` on container |
| NEW-5 | 🟢 | 105 | Magic numbers `0.65` / `0.35` in `computeResonance` |
| NEW-6 | 🟢 | — | Missing unit tests for 5 pure functions |
| NEW-7 | 🟢 | 300,371,… | Hardcoded German UI strings — bypass existing i18n system |

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/dashboard/DashboardTagesEnergie.tsx` | NEW-1 bis NEW-5 + NEW-7 |
| `src/i18n/translations.ts` | NEW-7: neue `dashboard.tagesImpuls.*` Keys (EN + DE) |
| `src/__tests__/tages-energie-helpers.test.ts` | NEW-6: neu — pure function tests |
| `src/__tests__/dashboard-tages-energie.test.tsx` | NEW-6: i18n-Mock für neuen `useLanguage`-Aufruf |

---

## Task 1 — Failing tests für NEW-6 (pure functions)

**Datei:** `src/__tests__/tages-energie-helpers.test.ts` (neu erstellen)

Diese Tests brauchen kein JSDOM — reine Vitest-Unit-Tests ohne React.

### Schritt 1: Test-Datei erstellen

```ts
/**
 * Unit tests for pure helper functions in DashboardTagesEnergie.
 * No React/JSDOM needed — these are plain function tests.
 */
import { describe, it, expect } from 'vitest';

// ── We test the functions by importing them directly.
// If functions are not exported yet, this file will fail at import → RED phase.
// After export, all tests must pass.
import {
  computeResonance,
  resonanceLabel,
  resolveElement,
  toBorderColor,
} from '../components/dashboard/DashboardTagesEnergie';

describe('computeResonance', () => {
  it('returns 0 when both inputs are 0', () => {
    expect(computeResonance(0, 0)).toBe(0);
  });

  it('returns 1 when both inputs are 1', () => {
    expect(computeResonance(1, 1)).toBe(1);
  });

  it('clamps above 1', () => {
    expect(computeResonance(2, 2)).toBe(1);
  });

  it('clamps below 0', () => {
    expect(computeResonance(-1, -1)).toBe(0);
  });

  it('applies weights: 0.65 harmony + 0.35 solar', () => {
    // harmony=1, solar=0 → 0.65
    expect(computeResonance(1, 0)).toBeCloseTo(0.65);
    // harmony=0, solar=1 → 0.35
    expect(computeResonance(0, 1)).toBeCloseTo(0.35);
  });
});

describe('resonanceLabel', () => {
  it('returns "verstärkt" for r > 0.7', () => {
    expect(resonanceLabel(0.71)).toContain('verstärkt');
    expect(resonanceLabel(1.0)).toContain('verstärkt');
  });

  it('returns "schwingt" for 0.5 < r ≤ 0.7', () => {
    expect(resonanceLabel(0.51)).toContain('schwingt');
    expect(resonanceLabel(0.70)).toContain('schwingt');
  });

  it('returns "Berührung" for 0.3 < r ≤ 0.5', () => {
    expect(resonanceLabel(0.31)).toContain('Berührung');
    expect(resonanceLabel(0.50)).toContain('Berührung');
  });

  it('returns "unabhängig" for r ≤ 0.3', () => {
    expect(resonanceLabel(0.30)).toContain('unabhängig');
    expect(resonanceLabel(0)).toContain('unabhängig');
  });
});

describe('resolveElement', () => {
  it('returns null for null daily', () => {
    expect(resolveElement(null)).toBeNull();
  });

  it('maps Chinese stem 甲 → holz', () => {
    const daily = { eastern: { evidence: { day_master: '甲' } } } as never;
    expect(resolveElement(daily)).toBe('holz');
  });

  it('maps Chinese stem 丙 → feuer', () => {
    const daily = { eastern: { evidence: { day_master: '丙' } } } as never;
    expect(resolveElement(daily)).toBe('feuer');
  });

  it('maps Chinese stem 戊 → erde', () => {
    const daily = { eastern: { evidence: { day_master: '戊' } } } as never;
    expect(resolveElement(daily)).toBe('erde');
  });

  it('maps Chinese stem 庚 → metall', () => {
    const daily = { eastern: { evidence: { day_master: '庚' } } } as never;
    expect(resolveElement(daily)).toBe('metall');
  });

  it('maps Chinese stem 壬 → wasser', () => {
    const daily = { eastern: { evidence: { day_master: '壬' } } } as never;
    expect(resolveElement(daily)).toBe('wasser');
  });

  it('maps latin romanization "jia" → holz (case insensitive)', () => {
    const daily = { eastern: { evidence: { day_master: 'JIA' } } } as never;
    expect(resolveElement(daily)).toBe('holz');
  });

  it('returns null for unknown stem', () => {
    const daily = { eastern: { evidence: { day_master: 'XYZ' } } } as never;
    expect(resolveElement(daily)).toBeNull();
  });
});

describe('toBorderColor', () => {
  it('appends 22 alpha to 7-char hex colors', () => {
    expect(toBorderColor('#D4AF37')).toBe('#D4AF3722');
    expect(toBorderColor('#ef4444')).toBe('#ef444422');
  });

  it('returns fallback for rgba colors', () => {
    const result = toBorderColor('rgba(255,255,255,0.5)');
    expect(result).not.toContain('22');
    expect(result).toMatch(/rgba?\(|#/); // still a valid CSS color
  });

  it('returns fallback for non-hex colors', () => {
    const result = toBorderColor('rgba(212,175,55,0.7)');
    expect(result).toBeTruthy();
  });
});
```

### Schritt 2: Tests ausführen — RED

```bash
npx vitest run src/__tests__/tages-energie-helpers.test.ts --reporter=verbose 2>&1 | tail -5
```

**Erwartetes Ergebnis:** Fehler wegen fehlendem Export (`computeResonance`, `resolveElement`, `toBorderColor` nicht exportiert) — FAIL.

---

## Task 2 — Translations hinzufügen (NEW-7 Schritt A)

**Datei:** `src/i18n/translations.ts`

### Schritt 1: EN-Keys nach dem `influences`-Block einfügen

Finde den EN-`influences`-Block (ca. Zeile 310 — endet mit `saturnTooltip`). Füge **direkt danach** den neuen Block ein:

```ts
    tagesImpuls: {
      sectionLabel: 'Daily Impulse',
      badgePulse: 'Day-Pulse',
      badgeTrace: 'Day-Trace',
      kosmoswetter: 'Cosmic Weather',
      resonanz: 'Resonance',
      vertiefen: 'explore',
      fallbackBody: 'Your daily impulse is being calculated …',
      ariaContainer: 'Daily Impulse',
      ariaResonanzBar: 'Resonance with the cosmos',
    },
```

### Schritt 2: DE-Keys nach dem deutschen `influences`-Block einfügen

Finde den DE-`influences`-Block (ca. Zeile 695). Füge **direkt danach** ein:

```ts
    tagesImpuls: {
      sectionLabel: 'Tages-Impuls',
      badgePulse: 'Day-Pulse',
      badgeTrace: 'Day-Trace',
      kosmoswetter: 'Kosmoswetter',
      resonanz: 'Resonanz',
      vertiefen: 'vertiefen',
      fallbackBody: 'Tagesimpuls wird gerade berechnet \u2026',
      ariaContainer: 'Tages-Impuls',
      ariaResonanzBar: 'Resonanz mit dem Kosmos',
    },
```

### Schritt 3: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -5
```

**Erwartetes Ergebnis:** Keine Fehler (translations.ts ist `DeepStringRecord` — flexible Typen).

---

## Task 3 — Alle Fixes in DashboardTagesEnergie.tsx

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: `useLanguage` zum Import hinzufügen

```tsx
// VORHER (Zeile 20):
import { useMemo, type ReactNode } from 'react';

// NACHHER:
import { useMemo, type ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
```

### Schritt 2: NEW-5 — Resonanz-Gewichte als benannte Konstanten

Füge direkt nach der Resonanz-Kommentar-Sektion (ca. Zeile 101) ein:

```ts
// ── Resonance computation ────────────────────────────────────────────────────

/** Resonance weights — defined in docs/wireframes/dashboard-v2.md § F3 */
const RESONANCE_WEIGHT_HARMONY = 0.65;
const RESONANCE_WEIGHT_SOLAR   = 0.35;
```

Dann `computeResonance` aktualisieren:

```ts
// VORHER:
function computeResonance(harmonyIndex: number, solarPressure: number): number {
  return Math.max(0, Math.min(1, harmonyIndex * 0.65 + solarPressure * 0.35));
}

// NACHHER:
export function computeResonance(harmonyIndex: number, solarPressure: number): number {
  return Math.max(0, Math.min(1,
    harmonyIndex * RESONANCE_WEIGHT_HARMONY +
    solarPressure * RESONANCE_WEIGHT_SOLAR,
  ));
}
```

### Schritt 3: NEW-6 Teil A — Helper-Funktionen exportieren

```ts
// Alle diese Funktionen mit `export` prefixen:
export function resonanceLabel(...) { ... }
export function resolveElement(...) { ... }
```

### Schritt 4: NEW-1 — `toBorderColor` Hilfsfunktion ergänzen + exportieren

Füge nach der `WeatherPill`-Interface-Definition ein:

```ts
/**
 * Returns a valid CSS border color.
 * Appends hex alpha `22` to 7-char hex colors.
 * Falls back to a subtle white for non-hex formats (rgba, hsl, etc.)
 * to avoid invalid CSS like `rgba(...)22`.
 */
export function toBorderColor(color: string): string {
  return color.startsWith('#') && color.length === 7
    ? `${color}22`
    : 'rgba(255,255,255,0.08)';
}
```

### Schritt 5: NEW-1 — Border im Pill-Render ersetzen

```tsx
// VORHER (Zeile 378):
style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.color}22` }}

// NACHHER:
style={{ background: pill.bg, color: pill.color, border: `1px solid ${toBorderColor(pill.color)}` }}
```

### Schritt 6: NEW-2 — `?? 'A'` entfernen

```ts
// VORHER (Zeile 142):
const flareClass = sw.xrayClass ?? 'A';

// NACHHER:
const flareClass = sw.xrayClass;
```

### Schritt 7: NEW-3 — Dual-storm dedup: kp-Pill nur ohne geo-storm Event

```ts
// VORHER (ca. Zeile 125):
  // 1. Geomagnetischer Sturm (Kp-basiert, immer wenn kp ≥ 2)
  if (sw.kpIndex >= 2) {

// NACHHER:
  // 1. Geomagnetischer Sturm (Kp-basiert) — nur wenn kein server-seitiges Event vorhanden.
  // Wenn ein geomagnetic_storm-Event existiert, wird er in Abschnitt 3 gerendert (Prio höher).
  const hasGeoStormEvent = sw.events.some((e) => e.type === 'geomagnetic_storm');
  if (sw.kpIndex >= 2 && !hasGeoStormEvent) {
```

### Schritt 8: NEW-4 — `aria-live` + `aria-label` auf äußerem Container

```tsx
// VORHER (ca. Zeile 271):
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="w-full"
    >

// NACHHER:
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="w-full"
      aria-live="polite"
      aria-label={t('dashboard.tagesImpuls.ariaContainer')}
    >
```

### Schritt 9: NEW-7 — UI-Strings durch `t()` ersetzen

Am Anfang der Komponente (nach den Early Returns) `t` aus `useLanguage` holen:

```tsx
export function DashboardTagesEnergie({ ... }: DashboardTagesEnergieProps) {
  const { t } = useLanguage();   // ← NEU — direkt nach Komponent-Start

  if (loading && !daily) return <TagesEnergieSkeleton />;
```

Dann die Strings ersetzen:

| Vorher (JSX) | Nachher |
|---|---|
| `Tages-Impuls` (Zeile 300) | `{t('dashboard.tagesImpuls.sectionLabel')}` |
| `{isTrace ? 'Day-Trace' : 'Day-Pulse'}` (Zeile 314) | `{isTrace ? t('dashboard.tagesImpuls.badgeTrace') : t('dashboard.tagesImpuls.badgePulse')}` |
| `'Tagesimpuls wird gerade berechnet …'` (Zeile 279, bodyText fallback) | `t('dashboard.tagesImpuls.fallbackBody')` |
| `Kosmoswetter` (Zeile 371) | `{t('dashboard.tagesImpuls.kosmoswetter')}` |
| `Resonanz` (Zeile 391, erste p) | `{t('dashboard.tagesImpuls.resonanz')}` |
| `aria-label={...Resonanz mit dem Kosmos...}` (Zeile 401) | `` aria-label={`${t('dashboard.tagesImpuls.ariaResonanzBar')}: ${resonancePct}%`} `` |
| `vertiefen` (Zeile 423) | `{t('dashboard.tagesImpuls.vertiefen')}` |

### Schritt 10: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -10
```

**Erwartetes Ergebnis:** Keine Ausgabe (clean).

---

## Task 4 — Tests laufen lassen

### Schritt 1: Neue Pure-Function-Tests

```bash
npx vitest run src/__tests__/tages-energie-helpers.test.ts --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:** Alle Tests grün. Falls `resolveElement` noch nicht korrekt exportiert: FAIL → Export prüfen.

### Schritt 2: Update `dashboard-tages-energie.test.tsx` — i18n-Mock aktualisieren

`useLanguage` wird jetzt in `DashboardTagesEnergie` aufgerufen. Der bestehende Mock gibt `t: (k) => k` zurück — das gibt die Key-Strings aus (`'dashboard.tagesImpuls.resonanz'`). Bestehende Tests die nach `'Resonanz'` suchen, würden brechen.

**Prüfen ob Tests noch grün:**

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Wenn Tests brechen wegen String-Matching:** Betroffen wären nur Tests die nach den alten UI-Strings suchen. Keine bestehenden Tests prüfen `'Resonanz'`, `'Kosmoswetter'` o.ä. — sie prüfen `fusion.synthesis`, `fusion.action` usw. Sollte keine Probleme geben.

**Falls doch Tests brechen:** Mock in der jeweiligen Test-Datei anpassen auf spezifische Keys:

```ts
// In dashboard-tages-energie.test.tsx — Mock bereits vorhanden, gibt k zurück:
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
// → 'dashboard.tagesImpuls.resonanz' wird als Text gerendert — kein bestehender Test bricht.
```

### Schritt 3: Full Suite

```bash
npx vitest run 2>&1 | tail -3
```

**Erwartetes Ergebnis:** Keine neuen Failures.

---

## Task 5 — Commit + Push

```bash
git add \
  src/components/dashboard/DashboardTagesEnergie.tsx \
  src/i18n/translations.ts \
  src/__tests__/tages-energie-helpers.test.ts \
  docs/plans/2026-03-29-new-1-to-7-final-polish.md

git commit -m "fix(dashboard): NEW-1–7 DashboardTagesEnergie final polish

NEW-1: toBorderColor() helper — prevents rgba(...)22 invalid CSS border.
  Hex colors → #rrggbbaa, rgba/other → rgba(255,255,255,0.08) fallback.

NEW-2: Remove sw.xrayClass ?? 'A' — xrayClass is string, never undefined.

NEW-3: Dedup dual-storm pills — kp-pill skipped when geomagnetic_storm
  event exists (server event has higher semantic precision than live Kp).

NEW-4: aria-live='polite' + aria-label on outer container for AT updates.

NEW-5: Extract 0.65/0.35 to RESONANCE_WEIGHT_HARMONY/SOLAR constants
  with reference to wireframe spec.

NEW-6: Export computeResonance, resonanceLabel, resolveElement, toBorderColor.
  New test file tages-energie-helpers.test.ts — 16 pure-function unit tests.

NEW-7: Wire all hardcoded German UI strings through useLanguage()/t().
  Add dashboard.tagesImpuls.* keys to src/i18n/translations.ts (EN+DE)."

git push origin feature/multi-agent-voice-eve
```

---

## Verifikation

```bash
# NEW-1: No rgba...22 in JSX
grep "rgba.*22" src/components/dashboard/DashboardTagesEnergie.tsx | grep "border"  # → empty

# NEW-2: No ?? 'A'
grep "xrayClass ??" src/components/dashboard/DashboardTagesEnergie.tsx             # → empty

# NEW-3: hasGeoStormEvent guard present
grep "hasGeoStormEvent" src/components/dashboard/DashboardTagesEnergie.tsx         # → 2 hits

# NEW-4: aria-live present
grep "aria-live" src/components/dashboard/DashboardTagesEnergie.tsx                # → 1 hit

# NEW-5: Named constants
grep "RESONANCE_WEIGHT" src/components/dashboard/DashboardTagesEnergie.tsx         # → 2 hits

# NEW-6: All tests pass
npx vitest run src/__tests__/tages-energie-helpers.test.ts 2>&1 | grep "Tests "    # → 16 passed

# NEW-7: i18n keys used
grep "t('dashboard.tagesImpuls" src/components/dashboard/DashboardTagesEnergie.tsx # → 7 hits
grep "tagesImpuls" src/i18n/translations.ts                                        # → 2 blocks (EN+DE)
```
