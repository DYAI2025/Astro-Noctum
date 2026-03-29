# R2-1 PremiumGate Refactor — Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ersetze den kaputten manuellen Premium-Lock in `DashboardTagesEnergie` durch die existierende `<PremiumGate>`-Komponente, entferne den toten `showPremiumHint`-State und das redundante `isPremium`-Prop.

**Architecture:** `PremiumGate` kapselt die gesamte isPremium-Logik intern via `usePremium()` Hook. `DashboardTagesEnergie` muss den Zustand nicht selbst halten oder als Prop empfangen. Das Pattern ist bereits in `CosmicWeatherCard`, `DashboardAstroSection` und anderen Dashboard-Sektionen etabliert — wir folgen dem gleichen Weg.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, Tailwind CSS v4

---

## Kontext: Was ist kaputt?

```
DashboardTagesEnergieProps.isPremium   ← wird übergeben, aber
                                           PremiumGate kennt isPremium selbst via usePremium()

const [showPremiumHint, setShowPremiumHint] = useState(false);  ← gesetzt, nie gelesen

{isPremium ? <ActionContent /> : <LockButton />}  ← LockButton tut nichts (onclick toggelt toten state)
```

**Ziel-Zustand:**

```tsx
<PremiumGate teaser="Deine persönliche Einladung für heute">
  <ActionContent />   ← PremiumGate entscheidet intern ob sichtbar oder geblockt
</PremiumGate>
```

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/dashboard/DashboardTagesEnergie.tsx` | Haupt-Refactor |
| `src/components/Dashboard.tsx` | `isPremium`-Prop aus `DashboardTagesEnergie`-Aufruf entfernen |
| `src/__tests__/dashboard-tages-energie.test.tsx` | **Neu erstellen** — Tests für PremiumGate-Integration |

**Nicht anfassen:**
- `src/components/PremiumGate.tsx` — bleibt unverändert
- `src/hooks/usePremium.ts` — bleibt unverändert
- Alle anderen Dashboard-Sektionen

---

## Task 1: Failing Test schreiben

**Datei:** `src/__tests__/dashboard-tages-energie.test.tsx` (neu)

### Schritt 1: Test-Datei anlegen

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardTagesEnergie } from '../components/dashboard/DashboardTagesEnergie';
import type { DailyResponse } from '../lib/schemas/experience';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

// ── Mocks ──────────────────────────────────────────────────────────

let mockIsPremium = false;

vi.mock('../hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: mockIsPremium, loading: false }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../lib/authedFetch', () => ({ authedFetch: vi.fn() }));

// ── Fixtures ───────────────────────────────────────────────────────

const DAILY: DailyResponse = {
  date: '2026-03-29',
  western: {
    summary: 'Western summary',
    themes: ['Transformation', 'Kommunikation'],
    caution: 'Achtung Reibung',
    opportunity: 'Chance heute',
    evidence: { natal_focus: ['Venus trine Jupiter'] },
  },
  eastern: {
    summary: 'Eastern summary',
    themes: ['Holz', 'Feuer'],
    caution: 'Eastern Reibung',
    opportunity: 'Eastern Chance',
    evidence: { day_master: '甲', natal_focus: [] },
  },
  fusion: {
    summary: 'Fusion summary',
    synthesis: 'Heute trägt Feuer deine Energie. Die Holz-Achse ist aktiv.',
    action: 'Lass los, was dich bremst.',
    pushworthy: false,
    harmony_index: 0.6,
    day_mode: 'trace',
  },
  meta: { engine_version: '1.0' },
};

const SPACE_WEATHER: SpaceWeatherState = {
  kpIndex: 1,
  solarPressure: 0.1,
  ringModulation: 1.0,
  intensityBoost: 0,
  triggerEffect: false,
  gScale: 'G0',
  xrayFlux: 0,
  xrayClass: 'A',
  protonFlux: 0,
  f107: 150,
  solarCyclePhase: 'ascending',
  events: [],
  alerts: [],
  lastUpdate: null,
  loading: false,
  error: null,
};

// ── Tests ──────────────────────────────────────────────────────────

describe('DashboardTagesEnergie — PremiumGate Integration', () => {
  beforeEach(() => { mockIsPremium = false; });

  it('zeigt fusion.action NICHT für Freemium-Nutzer', () => {
    mockIsPremium = false;
    render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    // action-Text soll nicht im DOM sichtbar sein
    expect(screen.queryByText('Lass los, was dich bremst.')).toBeNull();
  });

  it('zeigt fusion.action FÜR Premium-Nutzer', () => {
    mockIsPremium = true;
    render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    expect(screen.getByText('Lass los, was dich bremst.')).toBeDefined();
  });

  it('zeigt body (synthesis) IMMER — für beide User-Typen', () => {
    mockIsPremium = false;
    render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    expect(
      screen.getByText('Heute trägt Feuer deine Energie. Die Holz-Achse ist aktiv.')
    ).toBeDefined();
  });

  it('akzeptiert kein isPremium-Prop mehr (TypeScript)', () => {
    // Dieser Test ist rein zur Dokumentation — tsc stellt sicher,
    // dass isPremium nicht mehr im Props-Interface existiert.
    // Wenn isPremium noch im Interface ist, bricht der tsc-Lint-Lauf.
    const props = {
      daily: DAILY,
      dayHarmonic: null,
      spaceWeather: SPACE_WEATHER,
    };
    // Kein isPremium-Prop — kompiliert ohne Fehler
    render(<DashboardTagesEnergie {...props} />);
    expect(true).toBe(true);
  });

  it('PremiumGate blendet Content für Freemium ab (aria-hidden)', () => {
    mockIsPremium = false;
    const { container } = render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    // PremiumGate setzt aria-hidden="true" auf den geblurrten Container
    const blurred = container.querySelector('[aria-hidden="true"]');
    expect(blurred).not.toBeNull();
    expect(blurred?.textContent).toContain('Lass los, was dich bremst.');
  });
});
```

### Schritt 2: Test ausführen — sicherstellen dass er FEHLSCHLÄGT

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose
```

**Erwartetes Ergebnis:** Tests schlagen fehl weil:
- `isPremium` noch im Props-Interface ist (Test 4 schlägt bei TypeScript fehl)
- PremiumGate noch nicht genutzt wird (Tests 1, 2, 5 schlagen fehl)

---

## Task 2: `DashboardTagesEnergieProps` bereinigen

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: Import ergänzen

Am Anfang der Datei, nach den bestehenden Imports:

```tsx
// Zeile 36 (nach den lib-imports) — hinzufügen:
import { PremiumGate } from '../PremiumGate';
```

### Schritt 2: `Lock` aus lucide-Imports entfernen

```tsx
// VORHER (Zeile 22-35):
import {
  Zap, Flame, Waves, Wind, Activity, CircleDot,
  Leaf, Droplets, Sparkles, Mountain,
  Lock,          // ← entfernen
  ArrowRight,
} from 'lucide-react';

// NACHHER:
import {
  Zap, Flame, Waves, Wind, Activity, CircleDot,
  Leaf, Droplets, Sparkles, Mountain,
  ArrowRight,
} from 'lucide-react';
```

### Schritt 3: `isPremium` aus Props-Interface entfernen

```tsx
// VORHER:
export interface DashboardTagesEnergieProps {
  daily: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  spaceWeather: SpaceWeatherState;
  isPremium: boolean;          // ← entfernen
  loading?: boolean;
  onOpenDayModal?: () => void;
}

// NACHHER:
export interface DashboardTagesEnergieProps {
  daily: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  spaceWeather: SpaceWeatherState;
  loading?: boolean;
  onOpenDayModal?: () => void;
}
```

### Schritt 4: `isPremium` + `showPremiumHint` aus der Komponente entfernen

```tsx
// VORHER (Funktions-Signatur + erster Hook):
export function DashboardTagesEnergie({
  daily,
  dayHarmonic,
  spaceWeather,
  isPremium,          // ← entfernen
  loading = false,
  onOpenDayModal,
}: DashboardTagesEnergieProps) {
  const [showPremiumHint, setShowPremiumHint] = useState(false);  // ← entfernen

// NACHHER:
export function DashboardTagesEnergie({
  daily,
  dayHarmonic,
  spaceWeather,
  loading = false,
  onOpenDayModal,
}: DashboardTagesEnergieProps) {
  // kein showPremiumHint-State mehr
```

Wenn `useState` danach nicht mehr anderweitig genutzt wird, auch aus dem Import entfernen:

```tsx
// VORHER:
import { useState } from 'react';

// NACHHER (useState komplett entfernen, da nicht mehr gebraucht):
// Zeile löschen
```

### Schritt 5: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep -v "features/plan"
```

**Erwartetes Ergebnis:** Fehler bei `Dashboard.tsx` wegen `isPremium`-Prop (wird im nächsten Task behoben). Kein anderer Fehler.

---

## Task 3: PremiumGate-Block ersetzen

**Datei:** `src/components/dashboard/DashboardTagesEnergie.tsx`

### Schritt 1: Den alten Einladungs-Block ersetzen

Suche den folgenden Block (ca. Zeile 340–363):

```tsx
{/* Einladung / Action (PremiumGate) */}
{isPremium ? (
  <div className="flex items-start gap-2 rounded-xl p-3 mt-1"
    style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.12)' }}>
    <span className="text-[#D4AF37] text-sm mt-0.5 shrink-0">✦</span>
    <p className="text-xs text-white/65 leading-relaxed italic">
      {daily.fusion.action}
    </p>
  </div>
) : (
  <button
    onClick={() => setShowPremiumHint(!showPremiumHint)}
    className="group flex items-center gap-2 w-full rounded-xl p-3 text-left transition-colors hover:bg-white/4"
    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
  >
    <Lock className="w-3.5 h-3.5 text-white/20 shrink-0 group-hover:text-[#D4AF37]/40 transition-colors" />
    <span className="text-xs text-white/25 italic group-hover:text-white/40 transition-colors">
      Deine persönliche Einladung für heute …
    </span>
    <span className="ml-auto text-[9px] uppercase tracking-wider text-[#D4AF37]/40 font-mono font-bold shrink-0">
      Premium
    </span>
  </button>
)}
```

**Ersetzen durch:**

```tsx
{/* Einladung / Action — via PremiumGate (kapselt isPremium intern) */}
<PremiumGate teaser="Deine persönliche Einladung für heute">
  <div
    className="flex items-start gap-2 rounded-xl p-3 mt-1"
    style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.12)' }}
  >
    <span className="text-[#D4AF37] text-sm mt-0.5 shrink-0">✦</span>
    <p className="text-xs text-white/65 leading-relaxed italic">
      {daily.fusion.action}
    </p>
  </div>
</PremiumGate>
```

### Schritt 2: TypeScript prüfen (nur diese Datei)

```bash
npx tsc --noEmit 2>&1 | grep "DashboardTagesEnergie" | grep -v "node_modules"
```

**Erwartetes Ergebnis:** Keine Fehler in dieser Datei.

---

## Task 4: Dashboard.tsx bereinigen

**Datei:** `src/components/Dashboard.tsx`

### Schritt 1: `isPremium`-Prop aus `DashboardTagesEnergie`-Aufruf entfernen

Suche den Render-Block (ca. Zeile 368–381):

```tsx
// VORHER:
<DashboardTagesEnergie
  daily={dailyData}
  dayHarmonic={dayHarmonic}
  spaceWeather={spaceWeather}
  isPremium={isPremium}          // ← diese Zeile entfernen
  onOpenDayModal={dailyEnabled ? handleDailyClose : undefined}
/>

// NACHHER:
<DashboardTagesEnergie
  daily={dailyData}
  dayHarmonic={dayHarmonic}
  spaceWeather={spaceWeather}
  onOpenDayModal={dailyEnabled ? handleDailyClose : undefined}
/>
```

Auch im Fallback-Pfad (ca. Zeile 376):

```tsx
// VORHER (CosmicWeatherCard fallback):
<CosmicWeatherCard
  horoscope={horoscope}
  loading={horoscopeLoading}
  error={horoscopeError}
  onRefresh={horoscopeRefresh}
  lang={lang}
  isPremium={isPremium}    // ← bleibt, CosmicWeatherCard braucht es noch
/>
```

> **Achtung:** `isPremium={isPremium}` an anderen Stellen in `Dashboard.tsx` (z.B. `AgentSection`, `DashboardAstroSection`) bleibt unverändert — nur der `DashboardTagesEnergie`-Aufruf wird angepasst.

### Schritt 2: Vollständigen TypeCheck ausführen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep -v "features/plan"
```

**Erwartetes Ergebnis:** Keine Ausgabe (= clean).

---

## Task 5: Tests ausführen und fixen

### Schritt 1: Neue Tests laufen lassen

```bash
npx vitest run src/__tests__/dashboard-tages-energie.test.tsx --reporter=verbose
```

**Erwartetes Ergebnis:** Alle 5 Tests grün.

### Schritt 2: Bestehende PremiumGate-Tests noch grün?

```bash
npx vitest run src/__tests__/premium-gate-a11y.test.tsx --reporter=verbose
```

**Erwartetes Ergebnis:** Alle 2 Tests grün (PremiumGate selbst unverändert).

### Schritt 3: Full Suite ausführen

```bash
npx vitest run --reporter=verbose 2>&1 | tail -8
```

**Erwartetes Ergebnis:**
- Keine neuen Failures im Vergleich zu vor dem Refactor
- Die 7 pre-existing Failures (`astro-accordion`, `wuxing-page-detail`) bleiben — das ist bekannt und OK

---

## Task 6: Commit

```bash
git add \
  src/components/dashboard/DashboardTagesEnergie.tsx \
  src/components/Dashboard.tsx \
  src/__tests__/dashboard-tages-energie.test.tsx

git commit -m "refactor(dashboard): use PremiumGate for Tages-Impuls action gate

R2-1: Replace broken manual lock button with existing PremiumGate component.
- Remove isPremium prop from DashboardTagesEnergieProps (PremiumGate reads
  usePremium() internally)
- Remove dead showPremiumHint state (was toggled but never consumed)
- Remove Lock icon import (no longer needed)
- Wrap fusion.action content in <PremiumGate> — consistent with design system
- Add tests: premium/freemium visibility, aria-hidden, no isPremium prop

Closes: R2-1 (code-reviewer finding)"
```

---

## Verifikation

Nach dem Commit:

| Check | Kommando | Erwartung |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Keine Fehler |
| Neue Tests | `npx vitest run src/__tests__/dashboard-tages-energie.test.tsx` | 5/5 grün |
| PremiumGate-Tests | `npx vitest run src/__tests__/premium-gate-a11y.test.tsx` | 2/2 grün |
| Full Suite | `npx vitest run` | Keine neuen Failures |
| Props-Interface | `grep "isPremium" src/components/dashboard/DashboardTagesEnergie.tsx` | Keine Treffer |
| Dead State | `grep "showPremiumHint" src/components/dashboard/DashboardTagesEnergie.tsx` | Keine Treffer |

---

## Was dieser Fix NICHT tut

- Er behebt **nicht** R1-1 (geomagnetic_storm silent skip) — separater Fix
- Er behebt **nicht** R1-2 (handleDailyClose als open handler) — separater Fix
- Er behebt **nicht** R2-2 (buildWeatherPills ohne useMemo) — separater Fix

Diese Findings bleiben offen für Folge-Tasks.
