# R1-1 + R1-2 Bugfixes — Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two bugs: (1) `geomagnetic_storm` events silently skipped in weather pills; (2) "vertiefen →" button closes instead of opens the DayModeModal, and the modal still auto-opens on first load.

**Architecture:**
- R1-1 touches only `DashboardTagesEnergie.tsx` (pure function `buildWeatherPills`). Adds the missing `geomagnetic_storm` branch to the event-type switch.
- R1-2 touches only `Dashboard.tsx`. Adds a local `isDayModalOpen` state that is set to `true` by the "vertiefen →" button. The existing `showModal` from `useFirstRunDaily` is decoupled from the modal render — auto-open is removed; modal only opens on-demand.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, Tailwind CSS v4

---

## Bug context

### R1-1 — `geomagnetic_storm` silent skip

```ts
// src/components/dashboard/DashboardTagesEnergie.tsx — buildWeatherPills()
const priorityOrder = ['cme_arrival', 'geomagnetic_storm', 'hss', 'sep'];

for (const type of priorityOrder) {
  const event = sw.events?.find((e) => e.type === type);
  if (!event) continue;
  seenTypes.add(type);           // ← marked as "handled"

  if (type === 'cme_arrival') { ... }
  else if (type === 'hss') { ... }
  else if (type === 'sep') { ... }
  // ↑ geomagnetic_storm has NO branch → event found, seenTypes updated,
  //   but no pill ever pushed. Silent data loss.
}
```

**Fix:** Add the `geomagnetic_storm` branch. Pill label: `"Magnetsturm {event.severity}"`.
Color logic: G3+ → gold `#D4AF37`, G2 → amber `#fbbf24`, G0/G1 → muted `rgba(255,255,255,0.5)`.
Since the Kp-based pill (pill key `'kp'`) already covers the same concept, use a different key `'geo-storm'` to avoid collision.

---

### R1-2 — Wrong open handler + auto-open not removed

```tsx
// Dashboard.tsx — TWO bugs in one:

// Bug A: handleDailyClose is a CLOSE function, not an open function
onOpenDayModal={dailyEnabled ? handleDailyClose : undefined}
//                              ^^^^^^^^^^^^^^^^ closes modal, does nothing on closed modal

// Bug B: Modal still auto-opens via showModal from useFirstRunDaily
{dailyEnabled && showModal && dailyData && (
  <DayModeModal ... />   // ← wireframe F3: "Modal nicht mehr automatisch geöffnet"
)}
```

**Fix:**
1. Add `const [isDayModalOpen, setIsDayModalOpen] = useState(false);` to Dashboard
2. Pass `() => setIsDayModalOpen(true)` as `onOpenDayModal`
3. Change `DayModeModal` render condition from `showModal` → `isDayModalOpen`
4. Change modal `onClose` to `() => setIsDayModalOpen(false)` (local state, no DB write)
5. Keep `handleDailyClose` for its original purpose: marking `daily_modal_seen_date` in Supabase — but only call it once when `dailyData` first loads (optional, covered separately)

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/dashboard/DashboardTagesEnergie.tsx` | R1-1: `geomagnetic_storm` branch in `buildWeatherPills` |
| `src/components/Dashboard.tsx` | R1-2: `isDayModalOpen` state, open handler, modal condition |
| `src/__tests__/dashboard-tages-energie.test.tsx` | R1-1 tests: pill renders for geomagnetic_storm events |
| `src/__tests__/dashboard-modal-open.test.tsx` | R1-2 tests: **neu** — "vertiefen →" öffnet Modal, Modal nicht auto-open |

---

## Task 1 — Failing test für R1-1 (geomagnetic_storm pill)

**Datei:** `src/__tests__/dashboard-tages-energie.test.tsx`
**Typ:** Neue `describe`-Gruppe am Ende der Datei anhängen

### Schritt 1: Neuen Describe-Block anhängen

Öffne `src/__tests__/dashboard-tages-energie.test.tsx` und füge am Ende (vor dem letzten `}`) folgende Gruppe ein:

```ts
// ── Hilfsfunktion: minimales SpaceWeatherContribution-Event ──────────
function makeEvent(
  type: 'cme_arrival' | 'flare' | 'geomagnetic_storm' | 'sep' | 'hss' | 'alert',
  severity = 'G3',
) {
  return {
    schema: 'sp.contribution.v1' as const,
    event_id: `test-${type}`,
    type,
    severity,
    signature_weight: 0.3,
    started_at: '2026-03-29T10:00:00Z',
    expires_at: '2026-03-29T18:00:00Z',
  };
}

describe('DashboardTagesEnergie — Kosmoswetter Pills', () => {
  it('rendert Magnetsturm-Pill für geomagnetic_storm Event (G3)', () => {
    mockIsPremium = true;
    const sw: SpaceWeatherState = {
      ...SPACE_WEATHER,
      kpIndex: 0,           // Kp-basierte Pill soll NICHT erscheinen
      events: [makeEvent('geomagnetic_storm', 'G3')],
    };
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={sw} />
    );
    // Die Pill muss im DOM sichtbar sein
    expect(container.textContent).toContain('Magnetsturm');
    expect(container.textContent).toContain('G3');
  });

  it('rendert Magnetsturm-Pill mit korrekter Farbe für G3+ (gold)', () => {
    mockIsPremium = true;
    const sw: SpaceWeatherState = {
      ...SPACE_WEATHER,
      kpIndex: 0,
      events: [makeEvent('geomagnetic_storm', 'G3')],
    };
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={sw} />
    );
    // Pill-Element mit Magnetsturm-Text muss existieren
    const pills = container.querySelectorAll('span');
    const stormPill = Array.from(pills).find(
      (el) => el.textContent?.includes('Magnetsturm'),
    );
    expect(stormPill).not.toBeUndefined();
  });

  it('rendert KEINE Magnetsturm-Pill wenn kein geomagnetic_storm Event vorhanden', () => {
    mockIsPremium = true;
    const sw: SpaceWeatherState = { ...SPACE_WEATHER, kpIndex: 0, events: [] };
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={sw} />
    );
    expect(container.textContent).not.toContain('Magnetsturm G');
  });
});
```

### Schritt 2: Tests ausführen — sicherstellen dass sie FEHLSCHLAGEN

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:** Die 3 neuen Tests schlagen fehl:
- `rendert Magnetsturm-Pill für geomagnetic_storm Event (G3)` → FAIL (kein "Magnetsturm G3" im DOM)
- `rendert Magnetsturm-Pill mit korrekter Farbe` → FAIL
- `rendert KEINE Magnetsturm-Pill` → kann PASS (weil Pill nie gerendert wird)

---

## Task 2 — R1-1 implementieren: `geomagnetic_storm` Branch

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: Branch in `buildWeatherPills` ergänzen

Finde den Event-Loop (ca. Zeile 165). Füge den fehlenden Branch **nach dem `sep`-Branch** ein:

```tsx
// VORHER — letzter Branch im Loop:
    } else if (type === 'sep') {
      pills.push({
        key: 'sep',
        icon: <Activity className="w-3 h-3" />,
        label: 'Protonenfluss',
        color: '#fb923c',
        bg: 'rgba(251,146,60,0.12)',
      });
    }

// NACHHER — geomagnetic_storm Branch direkt davor einfügen:
    } else if (type === 'geomagnetic_storm') {
      const isStrong = event.severity >= 'G3'; // string compare: 'G3' >= 'G3' = true
      pills.push({
        key: 'geo-storm',
        icon: <Zap className="w-3 h-3" />,
        label: `Magnetsturm ${event.severity}`,
        color: isStrong ? '#D4AF37' : event.severity === 'G2' ? '#fbbf24' : 'rgba(255,255,255,0.5)',
        bg: isStrong ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
      });
    } else if (type === 'sep') {
```

> **Hinweis Severity-Vergleich:** `event.severity` ist ein String wie `'G0'`–`'G5'`. String-Vergleich funktioniert hier korrekt (`'G3' >= 'G3'` → true, `'G4' >= 'G3'` → true, `'G2' >= 'G3'` → false) weil NOAA G-Scale nur einstellige Ziffern hat. Keine zusätzliche Parse-Logik nötig.

### Schritt 2: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -5
```

**Erwartetes Ergebnis:** Keine Ausgabe (clean).

### Schritt 3: Tests ausführen — GREEN

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:** Alle 8 Tests grün (5 aus R2-1 + 3 neue).

---

## Task 3 — Failing tests für R1-2 (Modal open-handler)

**Datei:** `src/__tests__/dashboard-modal-open.test.tsx` (neu erstellen)

### Schritt 1: Test-Datei erstellen

```tsx
/**
 * Tests für R1-2: DashboardTagesEnergie "vertiefen →" Button
 * öffnet DayModeModal on-demand. Modal öffnet sich NICHT automatisch.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardTagesEnergie } from '../components/dashboard/DashboardTagesEnergie';
import type { DailyResponse } from '../lib/schemas/experience';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('../hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: true, loading: false }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../lib/authedFetch', () => ({ authedFetch: vi.fn() }));

// ── Fixtures (minimal) ────────────────────────────────────────────

const DAILY: DailyResponse = {
  date: '2026-03-29',
  western: {
    summary: 'w', themes: ['T'], caution: 'c', opportunity: 'o',
    evidence: { natal_focus: [] },
  },
  eastern: {
    summary: 'e', themes: ['T'], caution: 'c', opportunity: 'o',
    evidence: { day_master: '甲', natal_focus: [] },
  },
  fusion: {
    summary: 'fs', synthesis: 'Body-Text.', action: 'Action-Text.',
    pushworthy: false, harmony_index: 0.55, day_mode: 'pulse',
  },
  meta: { engine_version: '1.0' },
};

const SW: SpaceWeatherState = {
  kpIndex: 0, solarPressure: 0, ringModulation: 1.0, intensityBoost: 0,
  triggerEffect: false, gScale: 'G0', xrayFlux: 0, xrayClass: 'A',
  protonFlux: 0, f107: 150, solarCyclePhase: 'ascending',
  events: [], alerts: [], lastUpdate: null, loading: false, error: null,
};

// ── Tests ──────────────────────────────────────────────────────────

describe('DashboardTagesEnergie — vertiefen Link', () => {
  it('rendert "vertiefen" Button wenn onOpenDayModal übergeben wird', () => {
    const onOpen = vi.fn();
    render(
      <DashboardTagesEnergie
        daily={DAILY} dayHarmonic={null} spaceWeather={SW}
        onOpenDayModal={onOpen}
      />
    );
    // Button muss im DOM sichtbar sein
    const btn = screen.getByRole('button', { name: /vertiefen/i });
    expect(btn).toBeDefined();
  });

  it('ruft onOpenDayModal beim Klick auf "vertiefen" auf', () => {
    const onOpen = vi.fn();
    render(
      <DashboardTagesEnergie
        daily={DAILY} dayHarmonic={null} spaceWeather={SW}
        onOpenDayModal={onOpen}
      />
    );
    const btn = screen.getByRole('button', { name: /vertiefen/i });
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('rendert KEINEN "vertiefen" Button wenn onOpenDayModal nicht übergeben', () => {
    render(
      <DashboardTagesEnergie
        daily={DAILY} dayHarmonic={null} spaceWeather={SW}
        // kein onOpenDayModal
      />
    );
    const btn = screen.queryByRole('button', { name: /vertiefen/i });
    expect(btn).toBeNull();
  });
});
```

### Schritt 2: Tests ausführen — sicherstellen dass sie FEHLSCHLAGEN oder PASSEN

```bash
npx vitest run src/__tests__/dashboard-modal-open.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

> **Hinweis:** Tests 1–3 testen `DashboardTagesEnergie` selbst — diese sollten bereits GRÜN sein (der `onOpenDayModal`-Button existiert bereits korrekt). Wenn alle grün: gut, sie dokumentieren das Verhalten. Der eigentliche R1-2-Bug liegt in `Dashboard.tsx` (falsche Funktion übergeben + auto-open).

---

## Task 4 — R1-2 implementieren: `isDayModalOpen` State in Dashboard.tsx

**Datei:** `src/components/Dashboard.tsx`

### Schritt 1: `useState` Import prüfen

Zeile 1:
```tsx
import { useState, useEffect, useRef } from "react";
```
`useState` ist bereits importiert. ✅ Keine Änderung nötig.

### Schritt 2: Lokalen Modal-State nach `dailyEnabled` einfügen

Finde den Block (ca. Zeile 290–305):
```tsx
  const dailyEnabled = isFeatureEnabled('daily_modal_v1');

  // ── Space weather ...
  const spaceWeather = useSpaceWeather();

  // ── Daily horoscope modal ───────────────────────────────────────────
  const { dailyData, dayHarmonic, showModal, handleClose: handleDailyClose } = useFirstRunDaily(
```

**Ersetzen durch:**
```tsx
  const dailyEnabled = isFeatureEnabled('daily_modal_v1');

  // ── Space weather ...
  const spaceWeather = useSpaceWeather();

  // ── Daily horoscope modal ───────────────────────────────────────────
  // isDayModalOpen: on-demand via "vertiefen →" Button in DashboardTagesEnergie.
  // showModal (auto-open) ist bewusst NICHT mehr mit dem Modal-Render verbunden
  // — Wireframe F3: "Modal nicht mehr automatisch geöffnet".
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const { dailyData, dayHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
```

> **Wichtig:** `showModal` wird aus dem Destructuring entfernt — es wird nicht mehr benötigt. TypeScript warnt bei ungenutzten Variablen, aber `showModal` war nur für den auto-open-Trigger. `handleDailyClose` bleibt im Destructuring — es markiert `daily_modal_seen_date` in Supabase beim Schließen.

### Schritt 3: `onOpenDayModal` im DashboardTagesEnergie-Aufruf korrigieren

Finde (ca. Zeile 370):
```tsx
              onOpenDayModal={dailyEnabled ? handleDailyClose : undefined}
```

**Ersetzen durch:**
```tsx
              onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}
```

### Schritt 4: DayModeModal Render-Bedingung umschreiben

Finde (ca. Zeile 484):
```tsx
        {dailyEnabled && showModal && dailyData && (
          <DayModeModal data={dailyData} dayHarmonic={dayHarmonic} onClose={handleDailyClose} />
        )}
```

**Ersetzen durch:**
```tsx
        {dailyEnabled && isDayModalOpen && dailyData && (
          <DayModeModal
            data={dailyData}
            dayHarmonic={dayHarmonic}
            onClose={() => {
              setIsDayModalOpen(false);
              handleDailyClose(); // Markiert daily_modal_seen_date in Supabase
            }}
          />
        )}
```

> **Warum `handleDailyClose()` beim Schließen behalten?** `handleDailyClose` schreibt `daily_modal_seen_date` in Supabase — ein sinnvolles Tracking das wir behalten wollen. Jetzt nur beim expliziten Schließen ausgelöst, nicht mehr beim ersten Load.

### Schritt 5: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -10
```

**Erwartetes Ergebnis:** Keine Ausgabe (clean).

> **Falls Fehler wegen `showModal` unused:** Das Destructuring in Schritt 2 hat `showModal` entfernt. Wenn TypeScript warnt, ist das korrekt — die Variable existiert nicht mehr.

---

## Task 5 — Alle Tests ausführen

### Schritt 1: Neue Test-Dateien grün

```bash
npx vitest run \
  src/__tests__/dashboard-tages-energie.test.tsx \
  src/__tests__/dashboard-modal-open.test.tsx \
  --reporter=verbose 2>&1 | grep -E "✓|×|Tests "
```

**Erwartetes Ergebnis:**
- `dashboard-tages-energie.test.tsx`: 8/8 ✓
- `dashboard-modal-open.test.tsx`: 3/3 ✓

### Schritt 2: Full Suite

```bash
npx vitest run 2>&1 | tail -4
```

**Erwartetes Ergebnis:** Keine neuen Failures. Pre-existing Failures (`astro-accordion` 4×, `wuxing-page-detail` 1×, `quiz-overlay-unknown` 1×, `signatur-reveal-v2` 1×) bleiben — das ist bekannt und OK.

---

## Task 6 — Commit

```bash
git add \
  src/components/dashboard/DashboardTagesEnergie.tsx \
  src/components/Dashboard.tsx \
  src/__tests__/dashboard-tages-energie.test.tsx \
  src/__tests__/dashboard-modal-open.test.tsx

git commit -m "fix(dashboard): R1-1 geomagnetic_storm pill + R1-2 modal open-handler

R1-1: Add missing geomagnetic_storm branch in buildWeatherPills().
- 'geomagnetic_storm' was in priorityOrder but had no pill renderer
- Event was silently marked as handled without producing a pill
- Fix: add branch with Zap icon, label 'Magnetsturm {severity}',
  gold color for G3+, amber for G2, muted for G0/G1
- Tests: pill renders for G3 storm event, absent when no event

R1-2: Fix DayModeModal open-handler and remove auto-open.
- handleDailyClose (CLOSE fn) was passed as onOpenDayModal → no-op on click
- Modal was still auto-opening via showModal from useFirstRunDaily
  (contradicts wireframe F3: 'Modal nicht mehr automatisch geöffnet')
- Fix: add isDayModalOpen local state, pass () => setIsDayModalOpen(true)
  as onOpenDayModal, render modal on isDayModalOpen instead of showModal
- handleDailyClose still called on explicit close (Supabase tracking)
- Tests: vertiefen button calls onOpenDayModal, no button without prop"
```

---

## Verifikation

| Check | Kommando | Erwartung |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Keine Fehler |
| R1-1 Tests | `npx vitest run src/__tests__/dashboard-tages-energie.test.tsx` | 8/8 ✓ |
| R1-2 Tests | `npx vitest run src/__tests__/dashboard-modal-open.test.tsx` | 3/3 ✓ |
| Full Suite | `npx vitest run` | Keine neuen Failures |
| Kein auto-open | `grep "showModal" src/components/Dashboard.tsx` | Keine Treffer im Modal-Render-Block |
| Kein handleDailyClose als open | `grep "handleDailyClose" src/components/Dashboard.tsx` | Nur im onClose-Callback |
