# Dashboard V2 Layout F1+F2+F4 — Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Dashboard V2 layout redesign per `docs/wireframes/dashboard-v2.md` — create `DashboardBigFour` identity card (F1), integrate `MiniSignature` with pause-toggle in a 2-column grid (F2), and move the Upgrade Banner after the Voice Agents section (F4). F3 (DashboardTagesEnergie) is already done.

**Architecture:** `DashboardBigFour` is a new presentational component displaying 4 identity items. It shares a CSS Grid row with `MiniSignature` (2-column on desktop, stacked on mobile). The main `Dashboard.tsx` render order is restructured to match the wireframe: BigFour+MiniSignature → TagesEnergie → InfluenceGauges → Agents → Upgrade → AstroSection → Interpretation → Share+Footer.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest + Testing Library, lucide-react, i18n `translations.ts`

---

## Current state vs wireframe target

```
CURRENT RENDER ORDER              →    WIREFRAME TARGET
────────────────────                   ─────────────────
1. Page Header                         1. Page Header
                                       2. [BigFour + MiniSignature] ← NEW (F1+F2)
2. TagesEnergie  ✅                    3. TagesEnergie  ✅
3. InfluenceGauges                     4. InfluenceGauges
4. Upgrade Banner ← HERE              5. AgentSection (Levi, Eve)
5. AstroSection                        6. Upgrade Banner ← MOVED (F4)
6. AgentSection                        7. AstroSection
7. InterpretationSection               8. InterpretationSection
8. ShareCard + Footer                  9. ShareCard + Footer
```

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/dashboard/DashboardBigFour.tsx` | **NEU** — F1 Identity Card |
| `src/components/dashboard/MiniSignature.tsx` | F2: Pause-Toggle hinzufügen |
| `src/components/Dashboard.tsx` | F1+F2: Grid einfügen, F4: Upgrade-Block verschieben |
| `src/i18n/translations.ts` | Neue `dashboard.bigFour.*` Keys (EN+DE) |
| `src/__tests__/dashboard-big-four.test.tsx` | **NEU** — F1 Tests |
| `src/__tests__/mini-signature-pause.test.tsx` | **NEU** — F2 Pause-Toggle Tests |
| `3-code/tasks.md` | Status-Updates |

---

## Task 1 — i18n Keys hinzufügen

**Datei:** `src/i18n/translations.ts`

### Schritt 1: EN-Keys nach `tagesImpuls`-Block einfügen

```ts
    bigFour: {
      sunSign: 'Sun Sign',
      moonSign: 'Moon Sign',
      ascendant: 'Ascendant',
      baziAnimal: 'BaZi Animal',
    },
```

### Schritt 2: DE-Keys nach deutschem `tagesImpuls`-Block einfügen

```ts
    bigFour: {
      sunSign: 'Sternzeichen',
      moonSign: 'Mondzeichen',
      ascendant: 'Aszendent',
      baziAnimal: 'Jahrestier',
    },
```

### Schritt 3: MiniSignature Pause-Keys ergänzen

EN-Block `miniSignature`:
```ts
    miniSignature: {
      calculating: "Calculating signature…",
      label: "Your Form",
      paused: "Paused",           // NEU
      togglePause: "Pause signature", // NEU
    },
```

DE-Block `miniSignature`:
```ts
    miniSignature: {
      calculating: "Signatur wird berechnet…",
      label: "Deine Form",
      paused: "Pausiert",           // NEU
      togglePause: "Signatur pausieren", // NEU
    },
```

### Schritt 4: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -5
```

---

## Task 2 — Failing Tests: DashboardBigFour

**Datei:** `src/__tests__/dashboard-big-four.test.tsx` (neu)

### Schritt 1: Test-Datei erstellen

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardBigFour } from '../components/dashboard/DashboardBigFour';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));

describe('DashboardBigFour', () => {
  const defaultProps = {
    sunSign: 'Widder',
    moonSign: 'Krebs',
    ascendant: 'Löwe',
    baziAnimal: 'Hase',
  };

  it('rendert alle 4 Identitäts-Felder', () => {
    render(<DashboardBigFour {...defaultProps} />);
    expect(screen.getByText('Widder')).toBeDefined();
    expect(screen.getByText('Krebs')).toBeDefined();
    expect(screen.getByText('Löwe')).toBeDefined();
    expect(screen.getByText('Hase')).toBeDefined();
  });

  it('zeigt "—" als Fallback für fehlende Werte', () => {
    render(<DashboardBigFour sunSign="" moonSign="" ascendant="" baziAnimal="" />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(4);
  });

  it('rendert 4 Label-Texte (i18n keys)', () => {
    render(<DashboardBigFour {...defaultProps} />);
    expect(screen.getByText('dashboard.bigFour.sunSign')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.moonSign')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.ascendant')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.baziAnimal')).toBeDefined();
  });
});
```

### Schritt 2: Tests ausführen — RED

```bash
npx vitest run src/__tests__/dashboard-big-four.test.tsx --reporter=verbose
```

**Erwartetes Ergebnis:** FAIL — Modul existiert noch nicht.

---

## Task 3 — DashboardBigFour Komponente (F1)

**Datei:** `src/components/dashboard/DashboardBigFour.tsx` (neu)

### Schritt 1: Komponente erstellen

```tsx
/**
 * DashboardBigFour — Identity Card
 *
 * Shows the user's 4 core cosmic identifiers:
 * ☀️ Sun Sign, 🌙 Moon Sign, ↑ Ascendant, 🐰 BaZi Animal
 *
 * Implements: docs/wireframes/dashboard-v2.md § F1
 */

import { Sun, Moon, ArrowUp, Orbit } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface DashboardBigFourProps {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  baziAnimal: string;
}

interface IdentityItem {
  icon: React.ReactNode;
  labelKey: string;
  value: string;
  color: string;
}

export function DashboardBigFour({ sunSign, moonSign, ascendant, baziAnimal }: DashboardBigFourProps) {
  const { t } = useLanguage();

  const items: IdentityItem[] = [
    { icon: <Sun className="w-4 h-4" />,      labelKey: 'dashboard.bigFour.sunSign',    value: sunSign,    color: '#D4AF37' },
    { icon: <Moon className="w-4 h-4" />,      labelKey: 'dashboard.bigFour.moonSign',   value: moonSign,   color: '#a0b4cc' },
    { icon: <ArrowUp className="w-4 h-4" />,   labelKey: 'dashboard.bigFour.ascendant',  value: ascendant,  color: '#4ade80' },
    { icon: <Orbit className="w-4 h-4" />,     labelKey: 'dashboard.bigFour.baziAnimal', value: baziAnimal, color: '#fbbf24' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ icon, labelKey, value, color }) => (
        <div
          key={labelKey}
          className="rounded-xl border border-white/8 px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(0,5,10,0.6)' }}
        >
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15`, color }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/35">
              {t(labelKey)}
            </p>
            <p className="text-sm font-serif text-white/85 truncate">
              {value || '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Schritt 2: Tests ausführen — GREEN

```bash
npx vitest run src/__tests__/dashboard-big-four.test.tsx --reporter=verbose
```

**Erwartetes Ergebnis:** 3/3 grün.

---

## Task 4 — MiniSignature Pause-Toggle (F2)

**Datei:** `src/components/dashboard/MiniSignature.tsx`

### Schritt 1: Failing Test erstellen

**Datei:** `src/__tests__/mini-signature-pause.test.tsx` (neu)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
// Mock SignaturV3Canvas (heavy Three.js, not needed in unit test)
vi.mock('../components/signatur-v3/SignaturV3Canvas', () => ({
  default: () => <div data-testid="mock-canvas">Canvas</div>,
}));

import MiniSignature from '../components/dashboard/MiniSignature';

beforeEach(() => localStorage.clear());

describe('MiniSignature Pause Toggle', () => {
  const defaultProps = {
    natalWeights: { Sun: 0.8, Moon: 0.6, Mars: 0.4, Mercury: 0.5, Jupiter: 0.7, Saturn: 0.3, Venus: 0.6 },
    quizWeights: {},
  };

  it('rendert Pause-Toggle Button', () => {
    render(<MiniSignature {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pause/i });
    expect(btn).toBeDefined();
  });

  it('toggelt auf pausiert nach Klick + speichert in localStorage', () => {
    render(<MiniSignature {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(btn);
    expect(localStorage.getItem('bazodiac_mini_signature_paused')).toBe('true');
  });

  it('liest initialpaused-Zustand aus localStorage', () => {
    localStorage.setItem('bazodiac_mini_signature_paused', 'true');
    render(<MiniSignature {...defaultProps} />);
    // When paused, the "Paused" label should be visible
    expect(screen.getByText('dashboard.miniSignature.paused')).toBeDefined();
  });
});
```

### Schritt 2: Tests ausführen — RED

```bash
npx vitest run src/__tests__/mini-signature-pause.test.tsx --reporter=verbose
```

### Schritt 3: Pause-Toggle in MiniSignature implementieren

Öffne `src/components/dashboard/MiniSignature.tsx`. Die Änderungen:

A) Import `useState` + `Pause`, `Play` Icons:

```tsx
// VORHER:
import { lazy, Suspense } from 'react';

// NACHHER:
import { lazy, Suspense, useState } from 'react';
import { Pause, Play } from 'lucide-react';
```

B) Pause-State nach `useLanguage()`:

```tsx
export default function MiniSignature({ ... }: MiniSignatureProps) {
  const { t } = useLanguage();
  const hasData = natalWeights && Object.keys(natalWeights).length > 0;

  // ← NEU: Pause-Toggle
  const [paused, setPaused] = useState(() =>
    localStorage.getItem('bazodiac_mini_signature_paused') === 'true'
  );
  const togglePause = () => {
    setPaused((prev) => {
      const next = !prev;
      localStorage.setItem('bazodiac_mini_signature_paused', String(next));
      return next;
    });
  };
```

C) Canvas-Render conditional auf `paused`:

```tsx
// Im !hasData branch — UNVERÄNDERT.
// Im hasData branch — Canvas nur rendern wenn NICHT pausiert:
{hasData && !paused && (
  <div className="absolute inset-0 scale-125 group-hover:scale-150 transition-transform duration-1000">
    <Suspense fallback={...}>
      <SignaturV3Canvas ... />
    </Suspense>
  </div>
)}
{hasData && paused && (
  <div className="absolute inset-0 flex items-center justify-center">
    <p className="text-[10px] text-white/30 uppercase tracking-widest">
      {t('dashboard.miniSignature.paused')}
    </p>
  </div>
)}
```

D) Toggle-Button am Ende der Karte:

```tsx
      <div className="mt-4 flex justify-between items-center relative z-10">
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.15em]">
          {t('dashboard.miniSignature.label')}
        </span>
        <div className="flex items-center gap-2">
          {/* Pause Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); togglePause(); }}
            className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors"
            aria-label={t('dashboard.miniSignature.togglePause')}
          >
            {paused
              ? <Play className="w-3 h-3 text-white/40" />
              : <Pause className="w-3 h-3 text-white/40" />
            }
          </button>
          {/* Expand arrow */}
          <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
            <span className="text-[8px] text-white/30">⤢</span>
          </div>
        </div>
      </div>
```

### Schritt 4: Tests ausführen — GREEN

```bash
npx vitest run src/__tests__/mini-signature-pause.test.tsx --reporter=verbose
```

**Erwartetes Ergebnis:** 3/3 grün.

---

## Task 5 — Dashboard.tsx Layout-Restructuring (F1+F2+F4)

**Datei:** `src/components/Dashboard.tsx`

### Schritt 1: Imports hinzufügen

```tsx
// Nach den bestehenden Imports:
import { DashboardBigFour } from "./dashboard/DashboardBigFour";
import MiniSignature from "./dashboard/MiniSignature";
```

### Schritt 2: BigFour + MiniSignature Grid einfügen (nach PAGE HEADER, vor TAGES-IMPULS)

Finde den Kommentar `{/* ═══ TAGES-IMPULS` und füge **davor** ein:

```tsx
      {/* ═══ IDENTITY — Big Four + MiniSignature (2-col Grid) ═══════════ */}
      <motion.div className="mb-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start" {...fadeIn(0.05)}>
        <SectionErrorBoundary name="BigFour">
          <DashboardBigFour
            sunSign={apiData?.western?.zodiac_sign || ''}
            moonSign={apiData?.western?.moon_sign || ''}
            ascendant={apiData?.western?.ascendant_sign || ''}
            baziAnimal={apiData?.bazi?.zodiac_sign || ''}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="MiniSignature">
          <div className="w-[200px] md:w-[240px] mx-auto md:mx-0">
            <MiniSignature
              natalWeights={profileMeta.soulprintSectors ? soulprintToNatalWeights(profileMeta.soulprintSectors) : undefined}
              quizWeights={{}}
              dayHarmonic={dayHarmonic}
              onExpand={() => window.location.assign('/signatur')}
            />
          </div>
        </SectionErrorBoundary>
      </motion.div>
```

### Schritt 3: Upgrade Banner verschieben (F4 — nach Agents, vor AstroSection)

**Entferne** den aktuellen Upgrade-Block (ca. Zeile 401–416 — den ganzen `{!isPremium && (` Block):

```tsx
      {/* Upgrade Banner for free users */}
      {!isPremium && (
        <Card variant="gold" className="mb-8 w-full max-w-6xl p-5 flex items-center justify-between gap-4" ...>
          ...
        </Card>
      )}
```

**Füge ihn neu ein** — direkt **nach** dem Agents-Block (`</motion.div>` der AgentSection), **vor** `<div ref={navHintsSentinelRef}`:

```tsx
      </motion.div>

      {/* ═══ UPGRADE BANNER (freemium only, nach Agenten) ════════════════ */}
      {!isPremium && (
        <Card variant="gold" className="mb-8 w-full max-w-6xl p-5 flex items-center justify-between gap-4"
          {...fadeIn(0.42)}
        >
          <div>
            <p className="text-sm font-medium text-ink">
              {t("dashboard.upgradeCard.title")}
            </p>
            <p className="text-xs text-ink/50 mt-1">
              {t("dashboard.upgradeCard.subtitle")}
            </p>
          </div>
          <UpgradeButton />
        </Card>
      )}

      {/* ── Tour sentinel: step 3 ... */}
      <div ref={navHintsSentinelRef} ...
```

### Schritt 4: TypeScript prüfen

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules/\|features/plan/" | head -10
```

**Erwartetes Ergebnis:** Keine Fehler.

---

## Task 6 — Full Suite + Status-Updates

### Schritt 1: Alle neuen Tests

```bash
npx vitest run \
  src/__tests__/dashboard-big-four.test.tsx \
  src/__tests__/mini-signature-pause.test.tsx \
  src/__tests__/dashboard-tages-energie.test.tsx \
  --reporter=verbose 2>&1 | grep "Tests "
```

**Erwartetes Ergebnis:** Alle grün.

### Schritt 2: Full Suite

```bash
npx vitest run 2>&1 | tail -3
```

**Erwartetes Ergebnis:** Keine neuen Failures.

### Schritt 3: Status-Updates in `3-code/tasks.md`

```markdown
| TASK-tagesenergie-hero | ... | P1 | Done | ... | 2026-03-29 | Implementiert: DashboardTagesEnergie.tsx + 37 Tests + 7 Bug-Fixes |
| TASK-dashboard-layout-redesign | ... | P1 | Done | ... | 2026-03-29 | F1 BigFour + F2 MiniSignature Pause + F3 TagesEnergie + F4 Upgrade repositioned |
```

---

## Task 7 — Commit + Push

```bash
git add \
  src/components/dashboard/DashboardBigFour.tsx \
  src/components/dashboard/MiniSignature.tsx \
  src/components/Dashboard.tsx \
  src/i18n/translations.ts \
  src/__tests__/dashboard-big-four.test.tsx \
  src/__tests__/mini-signature-pause.test.tsx \
  3-code/tasks.md \
  docs/plans/2026-03-29-dashboard-v2-f1-f2-f4-layout.md

git commit -m "feat(dashboard): F1 BigFour + F2 MiniSignature pause + F4 Upgrade repositioned

F1 (DashboardBigFour): New identity card — Sun Sign, Moon Sign, Ascendant,
  BaZi Animal in 2×2 grid. Replaces DashboardHeroNav's 3-tile approach.
  i18n keys: dashboard.bigFour.* (EN+DE).

F2 (MiniSignature): Pause-toggle button (Pause/Play icon). State persisted
  in localStorage (bazodiac_mini_signature_paused). Paused = canvas unmounted,
  'Pausiert' label shown. 2-column grid with BigFour (stacked on mobile).

F4 (Upgrade Banner): Moved from position 3 (after InfluenceGauges) to
  position 6 (after Voice Agents, before AstroSection) per wireframe spec.
  User sees value (Agents, Signatur, TagesEnergie) before the upgrade prompt.

Dashboard render order now matches wireframe:
  BigFour+MiniSignature → TagesEnergie → InfluenceGauges → Agents →
  Upgrade → AstroSection → Interpretation → Share+Footer

Tasks: TASK-tagesenergie-hero → Done, TASK-dashboard-layout-redesign → Done

Tests: 6 new (BigFour 3 + MiniSignature 3), 37 existing TagesEnergie pass."

git push origin feature/multi-agent-voice-eve
```

---

## Verifikation

```bash
# F1: BigFour rendert
grep "DashboardBigFour" src/components/Dashboard.tsx          # → 2 hits (import + render)

# F2: MiniSignature hat Pause-Toggle
grep "togglePause\|paused" src/components/dashboard/MiniSignature.tsx  # → hits

# F4: Upgrade nach Agents
# Upgrade-Kommentar soll NACH dem Agents-Block stehen
grep -n "UPGRADE\|VOICE AGENTS" src/components/Dashboard.tsx
# → VOICE AGENTS line < UPGRADE line

# Tests
npx vitest run src/__tests__/dashboard-big-four.test.tsx src/__tests__/mini-signature-pause.test.tsx 2>&1 | grep "Tests "
# → 6 passed

# i18n
grep "bigFour\|paused\|togglePause" src/i18n/translations.ts | wc -l
# → 14+ hits (EN+DE blocks)
```
