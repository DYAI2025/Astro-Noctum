# Dashboard & Signatur — Bugs und Lücken Sprint (2026-04-20)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Additionally follow `codemoss-agent-guardrails` (Mikro-Phasen, max. 5 Files/Phase, Re-Read before + after edit, Verification Gates, HALT-Disziplin).

**Goal:** Schliesst die vom Product Owner am 2026-04-20 aufgedeckten Lücken im Dashboard + auf der Signatur-Seite und bringt die Oberflächen in einen kohärenten Zustand, bei dem angezeigte Werte, Texte und Sektionen die tatsächlich verfügbaren Daten und Konzepte korrekt abbilden.

**Architecture:** Wir arbeiten an bestehenden Komponenten in `Astro-Noctum/src`. Zentrale Fixes landen in `DailyChartHero.tsx` (Kohärenzindex-Kachel). Sektionen werden konsolidiert statt vermehrt — duplizierte Blöcke (DashboardBigFour, CosmicInfluenceSection, VibesSection) werden aus dem Dashboard entfernt oder zusammengeführt. Für die "Aktiven Einflüsse" wird die Signatur-Komponente `TransitPanel` in eine wiederverwendbare `ActiveImpactsList` extrahiert und auf dem Dashboard gleichwertig verwendet. Space-Weather-/KP-Daten-Ausfall wird als separate Diagnose-Phase am Endpoint `/api/space-weather/extended` behandelt. Echtes 3D und Quiz→Signatur-Kopplung bleiben explizit aus dem Scope (eigene Sprints).

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind + CSS-Variablen, Framer Motion, Supabase, Radix (für Tooltip/HoverCard), vitest für Tests, Zod für Schema-Validation.

---

## Überblick der bestehenden Fehler

### Dashboard

1. **Kohärenzindex-Ring ohne Erklärung** — Kein Tooltip. Nutzer sieht eine Zahl, kennt deren Bedeutung nicht.
2. **Statische Untertitelzeile unter dem Basiswert** — Text behauptet immer "Heute durch kosmische Aktivierung erhöht", auch wenn `positive_daily_delta == 0` oder negativ ist. Muss sich dynamisch an Erhöhung/Verringerung/Gleichsetzung anpassen.
3. **Driver Pills zeigen 0-Werte** — Kp, Solardruck, Transit-Aktivität erscheinen leer/null. Grund: `useSpaceWeather` INITIAL_STATE ist komplett 0 und der Endpoint `/api/space-weather/extended` liefert vermutlich in Produktion nichts Valides.
4. **Pill "Tagesfeld Impuls"** — bedeutungslose Information, entfernen.
5. **Leere Zeile unter dem Driver-Strip** — hier sollen die Planeteneinflüsse (exakt nach Schema der Signatur-Seite "Aktive Einflüsse") erscheinen.
6. **"Tagesimpuls"** — unklare Platzierung, klein, generisch. Muss mittig als grosse Überschrift stehen und der darunter gezeigte Inhalt muss das echte Daily-Horoscope aus den vorhandenen Endpoints sein (nicht nur ein transit-event `description_de`).
7. **"Dein Vibe abrufen" / VibesSection** — Feature nicht aktiv/nicht funktional. Policy: was nicht sofort angeschlossen werden kann, kommt weg.
8. **Astroagenten** — ok, keine Änderung.
9. **Duplizierte Natal-Informationen** — Unter dem Natal-Chart steht nochmals Sonnenzeichen/BaZi/Wu-Xing als grosse Kacheln (DashboardBigFour). Diese Kacheln raus und die Info IN die NatalSignaturStatic-Sektion verschieben.
10. **Kosmischer Einfluss doppelt** — Unter dem Sternenhimmel wird `CosmicInfluenceSection` nochmal eingeblendet. Muss raus, weil die Tageseinflüsse bereits oben im DailyChartHero dargestellt werden.

### Signatur-Seite

11. **"Aktive Einflüsse"** — bleibt wie sie ist (wird jetzt bewusst auch auf Dashboard gespiegelt).
12. **KP-Index-Panel zeigt keinen Wert** — gleicher Root-Cause wie Dashboard (Space-Weather-Endpoint).
13. **NASA-API scheint nicht angeschlossen** — Diagnose ebenfalls im Space-Weather-Fix.
14. **3D-Signatur** — rendert ein "komisches Bild" statt echtem 3D.
15. **Quiz → Signatur-Einwirkung** — bleibt explizit DEFERRED, neuer Sprint mit eigenen Requirements.
16. **Planetare Frequenzen** — farblich hinterlegt, korrekt, nicht anfassen.

---

## Phasen-Übersicht

| # | Phase | Dateien | Guardrail-Fokus |
|---|---|---|---|
| 0 | Scope-Lock + Baseline | docs + `npx tsc --noEmit` | Context-Decay, Baseline |
| 1 | Dynamischer Subtitel (Delta-Richtung) | `DailyChartHero.tsx` + Test | 1 File, klein |
| 2 | Tagesfeld-Pill entfernen | `DailyChartHero.tsx` + Test | Mikro-Edit |
| 3 | Hover-Tooltip am Kohärenzring | `DailyChartHero.tsx` + CSS + Test | Radix-Abhängigkeit sauber |
| 4 | `ActiveImpactsList` extrahieren + im Dashboard mounten | 4 Files, neue Komponente | <=5 Files |
| 5 | Tagesimpuls — zentrierte grosse Headline + echtes Horoscope | `DailyChartHero.tsx` (+ ggf. Hook) | Daten-Herkunft verifizieren |
| 6 | VibesSection aus Dashboard entfernen | `Dashboard.tsx` + Cleanup | Step-0-Cleanup |
| 7 | DashboardBigFour in NatalSignaturStatic mergen | `NatalSignaturStatic.tsx`, `Dashboard.tsx`, `DashboardBigFourCard.tsx` | 3 Files |
| 8 | Doppelten `CosmicInfluenceSection` entfernen | `Dashboard.tsx` | Mikro-Edit |
| 9 | Diagnose `/api/space-weather/extended` | Server-Endpoint + Hook | Logging first |
| 10 | Signatur 3D — "komisches Bild" diagnostizieren | `SignaturRenderer.tsx`, `SignatureSphere3D.tsx` | Read-heavy, Research-Phase |
| 11 | Quiz → Signatur als DEFERRED dokumentieren | `docs/requirements/` | Keine Code-Änderung |

HALT-Punkte nach Phase 3, 5, 8, 9, 10. Ben reviewt vor Fortsetzung.

---

## Phase 0 — Scope-Lock + Baseline

**Ziel:** Vor jeder Änderung verifizieren, dass der Branch baseline-grün ist und alle hier referenzierten Dateien im aktuellen Zustand vorliegen.

**Step 0.1 — Re-Read Kernkonzepte.**
```
Read /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/docs/KOHAERENZ_INDEX.md
Read /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/DailyChartHero.tsx
Read /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/Dashboard.tsx
Read /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/signatur/TransitResonancePanels.tsx
Read /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/NatalSignaturStatic.tsx
```

**Step 0.2 — Baseline Typecheck.**
```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx tsc --noEmit
```
Erwartung: grün. Wenn rot — erst Baseline fixen, dann Phase 1 starten.

**Step 0.3 — Baseline Test-Run.**
```bash
npx vitest run src/components/dashboard
```
Ergebnis dokumentieren. Bestehende failing tests explizit benennen.

**Step 0.4 — Commit-Point.**
```bash
git checkout -b 2026-04-20-dashboard-signatur-gaps
git commit --allow-empty -m "chore: start dashboard-signatur gaps sprint"
```

---

## Phase 1 — Dynamischer Subtitel (Delta-Richtung)

**Ziel:** Der Text unter dem Kohärenzring reflektiert die tatsächliche Richtung der heutigen Abweichung. Keine Lüge mehr.

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx` (Subtitel-String-Logik)
- Test: `src/components/dashboard/__tests__/daily-chart-hero.subtitle.test.tsx` (neu)

**Logik-Spezifikation (EN + DE):**

| Bedingung | DE | EN |
|---|---|---|
| `delta > 0.01` (erhöht) | `Dein Basiswert {base}, heute durch kosmische Aktivierung angehoben auf {displayed}.` | `Your baseline {base}, elevated by today's cosmic activation to {displayed}.` |
| `delta < -0.01` (verringert) | `Dein Basiswert {base}, heute durch kosmische Spannung auf {displayed} gedämpft.` | `Your baseline {base}, dampened by today's cosmic tension to {displayed}.` |
| `|delta| <= 0.01` (gleich) | `Dein Basiswert {base}, heute ohne spürbare kosmische Modulation.` | `Your baseline {base}, today without noticeable cosmic modulation.` |

`{base}` und `{displayed}` sind auf ganze Zahlen (0–100) gerundet.

**Step 1.1 — Failing Test.**
Erstellen: `src/components/dashboard/__tests__/daily-chart-hero.subtitle.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DailyChartHero } from '../DailyChartHero';

const base = {
  spaceWeather: { kpIndex: 2, solarPressure: 0.2, gScale: 0, loading: false, error: null },
  transitEvents: [],
  dayMode: 'pulse' as const,
  loading: false,
  activePlanets: [],
};

describe('DailyChartHero subtitle', () => {
  it('shows raised language when delta > 0', () => {
    render(<DailyChartHero {...base} baseCoherence={60} positiveDailyDelta={8} displayedCoherence={68} />);
    expect(screen.getByText(/angehoben auf 68|elevated/i)).toBeInTheDocument();
  });
  it('shows dampened language when delta < 0', () => {
    render(<DailyChartHero {...base} baseCoherence={60} positiveDailyDelta={-5} displayedCoherence={55} />);
    expect(screen.getByText(/gedämpft|dampened/i)).toBeInTheDocument();
  });
  it('shows neutral language when |delta| <= 0.01', () => {
    render(<DailyChartHero {...base} baseCoherence={60} positiveDailyDelta={0} displayedCoherence={60} />);
    expect(screen.getByText(/ohne spürbare|without noticeable/i)).toBeInTheDocument();
  });
});
```
Run: `npx vitest run src/components/dashboard/__tests__/daily-chart-hero.subtitle.test.tsx`
Expected: FAIL.

**Step 1.2 — Minimal-Implementierung.**
In `DailyChartHero.tsx` lokalisieren: die bisherige hart codierte Subtitle-Zeile (`'Dein persönlicher Grundwert, heute durch kosmische Aktivierung erhöht.'`).
Ersetzen durch eine lokale Funktion direkt oberhalb des Component-Body:
```ts
function coherenceSubtitle(
  base: number,
  displayed: number,
  delta: number,
  lang: 'de' | 'en',
): string {
  const b = Math.round(base);
  const d = Math.round(displayed);
  if (delta > 0.01) {
    return lang === 'de'
      ? `Dein Basiswert ${b}, heute durch kosmische Aktivierung angehoben auf ${d}.`
      : `Your baseline ${b}, elevated by today's cosmic activation to ${d}.`;
  }
  if (delta < -0.01) {
    return lang === 'de'
      ? `Dein Basiswert ${b}, heute durch kosmische Spannung auf ${d} gedämpft.`
      : `Your baseline ${b}, dampened by today's cosmic tension to ${d}.`;
  }
  return lang === 'de'
    ? `Dein Basiswert ${b}, heute ohne spürbare kosmische Modulation.`
    : `Your baseline ${b}, today without noticeable cosmic modulation.`;
}
```
Im JSX die Zeile durch `{coherenceSubtitle(baseCoherence, displayedCoherence, positiveDailyDelta, resolvedLang)}` ersetzen.

**Step 1.3 — Re-Read & Verify.**
```
Read DailyChartHero.tsx
npx vitest run src/components/dashboard/__tests__/daily-chart-hero.subtitle.test.tsx
npx tsc --noEmit
```
Expected: PASS + clean.

**Step 1.4 — Commit.**
```bash
git add src/components/dashboard/DailyChartHero.tsx src/components/dashboard/__tests__/daily-chart-hero.subtitle.test.tsx
git commit -m "fix(dashboard): coherence subtitle reflects delta direction"
```

---

## Phase 2 — "Tagesfeld"-Pill entfernen

**Ziel:** Driver-Strip zeigt nur noch Geomagnetik, Solardruck, Transit-Aktivität — drei aussagekräftige Pills.

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx`
- Test: bestehender Driver-Test (falls vorhanden) oder `src/components/dashboard/__tests__/daily-chart-hero.drivers.test.tsx` neu

**Step 2.1 — Failing Test.**
```tsx
it('does not render the Tagesfeld pill', () => {
  render(<DailyChartHero {...base} baseCoherence={60} positiveDailyDelta={0} displayedCoherence={60} />);
  expect(screen.queryByText(/Tagesfeld|Day field/i)).not.toBeInTheDocument();
});
```
Run — erwartet: FAIL (Pill ist noch da).

**Step 2.2 — Fix.**
In `DailyChartHero.tsx`: das vierte Element im `drivers`-Array (`label: 'Tagesfeld' / 'Day field'`) streichen, inklusive seiner Klassifikation.

**Step 2.3 — Verify.**
```
npx vitest run src/components/dashboard/__tests__/daily-chart-hero.drivers.test.tsx
npx tsc --noEmit
```
Expected: PASS.

**Step 2.4 — Commit.**
```bash
git add -A
git commit -m "fix(dashboard): remove meaningless Tagesfeld driver pill"
```

---

## Phase 3 — Hover-Tooltip am Kohärenzring

**Ziel:** Hover über den Ring zeigt nach ~500 ms eine kurze, präzise Erklärung des Kohärenzindex (nicht der Basiszahl).

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx`
- Check: `package.json` (ob `@radix-ui/react-tooltip` oder `@radix-ui/react-hover-card` schon dabei ist)
- Test: `src/components/dashboard/__tests__/daily-chart-hero.tooltip.test.tsx`

**Tooltip-Inhalt (aus `KOHAERENZ_INDEX.md` §3.1/3.2 destilliert):**

DE: *"Der Kohärenzindex misst, wie stark deine Natal-Signatur gerade mit der Welt resoniert. Er setzt sich aus Natal-Kern, heutigem Transit, deiner Quiz-Kalibrierung und der kosmischen Membran (Kp, Sonnenwind) zusammen. Er sagt nicht aus, wer du bist, sondern wie laut deine Struktur heute spricht."*

EN: *"The coherence index measures how strongly your natal signature resonates with the world right now. It combines natal core, today's transits, your quiz calibration, and the cosmic membrane (Kp, solar wind). It does not say who you are — it says how loudly your structure speaks today."*

**Step 3.1 — Dependency-Check.**
```bash
cd Astro-Noctum
grep -E '"@radix-ui/react-tooltip"|"@radix-ui/react-hover-card"' package.json
```
Wenn keines vorhanden: `npm i @radix-ui/react-tooltip`.

**Step 3.2 — Failing Test.**
```tsx
import userEvent from '@testing-library/user-event';
it('shows coherence tooltip after hovering the ring', async () => {
  const user = userEvent.setup();
  render(<DailyChartHero {...base} baseCoherence={60} positiveDailyDelta={5} displayedCoherence={65} />);
  const ring = screen.getByTestId('coherence-ring');
  await user.hover(ring);
  // Tooltip delay 500ms — waitFor
  expect(await screen.findByText(/misst, wie stark|measures how strongly/i, {}, { timeout: 1500 })).toBeInTheDocument();
});
```
Run → FAIL.

**Step 3.3 — Implementierung.**
`SplitCoherenceRing` bleibt visuell; wrappen in `<Tooltip.Provider delayDuration={500}><Tooltip.Root><Tooltip.Trigger asChild><div data-testid="coherence-ring">{svg}</div></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="max-w-sm …">{localizedText}</Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>`.

Styling: `rounded-lg bg-[var(--tile-bg-strong)] p-3 text-xs leading-relaxed shadow-xl` + Arrow. `sideOffset=8`. Radix-Animation (`data-[state=delayed-open]`) in Tailwind.

**Step 3.4 — Verify.**
```bash
npx vitest run src/components/dashboard/__tests__/daily-chart-hero.tooltip.test.tsx
npx tsc --noEmit
```
Expected: PASS.

**Step 3.5 — Commit + HALT.**
```bash
git add -A
git commit -m "feat(dashboard): hover tooltip explains coherence index"
```
**HALT** — Ben reviewt Tooltip-Text + Verhalten im Browser.

---

## Phase 4 — `ActiveImpactsList` extrahieren + auf Dashboard mounten

**Ziel:** Auf dem Dashboard unter dem Driver-Strip erscheinen die Planeten-Einflüsse im gleichen visuellen Schema wie auf der Signatur-Seite.

**Files (<=5):**
- Create: `src/components/shared/ActiveImpactsList.tsx`
- Modify: `src/components/signatur/TransitResonancePanels.tsx` (TransitPanel → ActiveImpactsList importieren)
- Modify: `src/components/dashboard/DailyChartHero.tsx` (PlanetCard ersetzen durch ActiveImpactsList, Variante="compact")
- Test: `src/components/shared/__tests__/active-impacts-list.test.tsx`

**Design-Entscheidung:** `TransitPanel` in `TransitResonancePanels.tsx` ist bereits die "Single Source of Truth" für die Darstellung eines Planeten-Einflusses. Extraktion in `shared/ActiveImpactsList.tsx` mit zwei Varianten:
- `variant="full"` — wie heute auf der Signatur (Header + FieldBar + Direction + Warum-Toggle)
- `variant="compact"` — kompakter Header + FieldBar + Direction, OHNE Warum-Toggle; für die Dashboard-Kachel

**Props:**
```ts
export interface ActiveImpactsListProps {
  birthSign: string;
  variant?: 'full' | 'compact';
  className?: string;
  maxItems?: number; // compact default 4
}
```

**Step 4.1 — Step-0-Cleanup.**
```
Read DailyChartHero.tsx   // lokalisiere PlanetCard
```
Lösche `PlanetCard`-Block und alle nur dort verwendeten Imports/Helpers (aber NICHT `computeTodayPlanetInfluences`-Import — wandert in ActiveImpactsList).

**Step 4.2 — Failing Test.**
`src/components/shared/__tests__/active-impacts-list.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { ActiveImpactsList } from '../ActiveImpactsList';

describe('ActiveImpactsList', () => {
  it('renders planets for the given birth sign in full variant', () => {
    render(<ActiveImpactsList birthSign="aries" variant="full" />);
    expect(screen.getByText(/Mars|Venus|Jupiter|Saturn/)).toBeInTheDocument();
  });
  it('compact variant hides the reason toggle', () => {
    render(<ActiveImpactsList birthSign="aries" variant="compact" />);
    expect(screen.queryByText(/Warum\?|Why\?/i)).not.toBeInTheDocument();
  });
});
```
Run → FAIL.

**Step 4.3 — Extraktion.**
Neue Datei `src/components/shared/ActiveImpactsList.tsx`:
- Kopiere `PLANET_CONFIG`, `ASPECT_MAP`, `FieldBar`, `TransitPanel` aus `TransitResonancePanels.tsx`
- Exportiere `ActiveImpactsList` als Root (nimmt `birthSign`, rechnet `computeTodayPlanetInfluences(birthSign)`, rendert `TransitPanel`-Array)
- `variant="compact"` → `maxItems=4`, keine "Warum"-Toggle, kleinerer Text, weniger Padding (`p-3` statt `p-5`)

**Step 4.4 — Rewire Signatur.**
In `TransitResonancePanels.tsx` die internen Definitionen durch `import { ActiveImpactsList } from '../shared/ActiveImpactsList'` ersetzen; das Root-Markup ruft `<ActiveImpactsList birthSign={birthSign} variant="full" />` auf. Keine Verhaltensänderung auf der Signatur-Seite.

**Step 4.5 — Dashboard mounten.**
In `DailyChartHero.tsx` im Bereich unter dem Driver-Strip:
```tsx
<div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--tile-border)' }}>
  <h3 className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--tile-accent)', opacity: 0.7 }}>
    {isDe ? 'Aktive Einflüsse' : 'Active influences'}
  </h3>
  <ActiveImpactsList birthSign={birthSign} variant="compact" maxItems={4} />
</div>
```
`birthSign` muss durchgereicht werden (Prop in `DailyChartHero` ergänzen, aufrufende Stelle in `Dashboard.tsx` anpassen — `apiData.sunSign` o.ä.).

**Step 4.6 — Verify.**
```bash
npx vitest run src/components/shared/__tests__/active-impacts-list.test.tsx
npx vitest run src/components/signatur
npx vitest run src/components/dashboard
npx tsc --noEmit
```

**Step 4.7 — Commit.**
```bash
git add -A
git commit -m "refactor(dashboard+signatur): shared ActiveImpactsList, dashboard mirrors signatur schema"
```

---

## Phase 5 — Tagesimpuls: zentrierte Headline + echtes Daily Horoscope

**Ziel:** "Tagesimpuls" steht als mittige, grössere Überschrift. Der Body darunter zeigt den echten Text aus dem Daily-Horoscope-Endpoint, nutzerpersonalisiert.

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx`
- Check: `src/hooks/useFirstRunDaily.ts` (liefert bereits `dailyData.interpretation` / `dailyData.horoscope`?)
- Test: `src/components/dashboard/__tests__/daily-chart-hero.impuls.test.tsx`

**Step 5.1 — Datenquelle verifizieren.**
```
Read /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useFirstRunDaily.ts
Grep -n 'dailyHoroscope\|daily_horoscope\|interpretation' src/hooks src/lib/api
```
Wenn bereits ein Feld `horoscope_text` / `daily_interpretation` / `impuls_text` im Hook-Return verfügbar: verwenden. Sonst: neuen Hook `useDailyImpuls(userId)` anlegen, der `/api/daily/impuls` (oder den bekannten Daily-Endpoint) GET-ttet, mit Zod-Validation, 15-min sessionStorage-Cache analog `useActiveImpacts`.

**Step 5.2 — Failing Test.**
```tsx
it('renders Tagesimpuls as centered large heading', () => {
  render(<DailyChartHero {...base} baseCoherence={60} positiveDailyDelta={2} displayedCoherence={62} impulsText="Heute ist ein Tag zum Atmen." />);
  const heading = screen.getByRole('heading', { name: /Tagesimpuls|Daily impulse/i });
  expect(heading).toHaveClass('text-center');
  expect(screen.getByText('Heute ist ein Tag zum Atmen.')).toBeInTheDocument();
});
```
Run → FAIL.

**Step 5.3 — Impl.**
- Prop `impulsText?: string` in `DailyChartHeroProps`
- Block rendern:
```tsx
{impulsText && (
  <section className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--tile-border)' }}>
    <h3 className="text-center font-serif text-2xl mb-3" style={{ color: 'var(--tile-text-primary)' }}>
      {isDe ? 'Tagesimpuls' : 'Daily impulse'}
    </h3>
    <p className="text-sm leading-relaxed text-center max-w-prose mx-auto" style={{ color: 'var(--tile-text-secondary)' }}>
      {impulsText}
    </p>
  </section>
)}
```
- In `Dashboard.tsx` `impulsText` von `dailyData.horoscope?.short || dailyData.interpretation` durchreichen.

**Step 5.4 — Verify + HALT.**
```bash
npx vitest run src/components/dashboard/__tests__/daily-chart-hero.impuls.test.tsx
npx tsc --noEmit
```
**HALT** — Ben reviewt Typografie + Textlänge im Browser, entscheidet ob weiter oder Typo-Anpassung.

**Step 5.5 — Commit.**
```bash
git commit -am "feat(dashboard): centered Tagesimpuls heading with daily horoscope text"
```

---

## Phase 6 — VibesSection aus Dashboard entfernen

**Ziel:** Weg mit der "Dein Vibe abrufen"-Sektion (nicht funktional).

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Potentiell obsolet: `src/components/dashboard/VibesSection.tsx`, Tests, Hooks

**Step 6.1 — Import-Scope prüfen.**
```bash
Grep -rn "VibesSection\|useVibes" src/ --include='*.{ts,tsx}'
```
Wenn nur in `Dashboard.tsx` referenziert → sicher zu entfernen.

**Step 6.2 — Entfernen.**
In `Dashboard.tsx`:
- Import von `VibesSection` löschen
- JSX-Block `<VibesSection userId={userId} />` löschen
- Kein Layout-Gap: benachbarte `motion.div`-Wrapper konsolidieren oder den Abstand `gap-6` belassen

**Step 6.3 — Dead-Code-Cleanup.**
Wenn `VibesSection.tsx` sonst nirgends importiert wird: Datei + dazugehörige Tests + `useVibes` Hook archivieren (`git mv` nach `src/components/_archived_2026-04-20/`) oder löschen. Bias: löschen, weil Feature gestoppt.

**Step 6.4 — Verify.**
```bash
npx tsc --noEmit
npx vitest run
```

**Step 6.5 — Commit.**
```bash
git commit -am "chore(dashboard): remove non-functional VibesSection"
```

---

## Phase 7 — DashboardBigFour in NatalSignaturStatic mergen

**Ziel:** Sternzeichen/BaZi/Wu-Xing/Aszendent landen INNERHALB der NatalSignaturStatic-Sektion. Die freistehenden grossen Kacheln verschwinden. Unter dem Natal-Chart ist danach mehr Platz.

**Files (3):**
- Modify: `src/components/dashboard/NatalSignaturStatic.tsx`
- Modify: `src/components/Dashboard.tsx`
- Modify (oder löschen): `src/components/dashboard/DashboardBigFourCard.tsx`

**Step 7.1 — Step-0-Cleanup.**
```
Read NatalSignaturStatic.tsx
Read DashboardBigFourCard.tsx
```
Unbenutzte Imports / Hilfs-Komponenten vor dem Merge rauswerfen.

**Step 7.2 — Props-Erweiterung.**
`NatalSignaturStatic` bekommt Identitätsfelder:
```ts
interface NatalSignaturStaticProps {
  sunSign: string;
  moonSign?: string;
  ascendant?: string;
  baziAnimal?: string;
  wuxingElement?: string;
  children?: ReactNode;
}
```

**Step 7.3 — Identity-Strip rendern.**
Direkt über `children` innerhalb des aufgeklappten Containers:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
  <IdentityPill label="Sonne" value={sunSign} />
  {moonSign && <IdentityPill label="Mond" value={moonSign} />}
  {ascendant && <IdentityPill label="AC" value={ascendant} />}
  {baziAnimal && <IdentityPill label="BaZi" value={baziAnimal} />}
  {wuxingElement && <IdentityPill label="Wu-Xing" value={wuxingElement} />}
</div>
```
`IdentityPill` ist eine lokale schmale Kachel (border, rounded-lg, label + value, Styles aus `DashboardBigFourCard` entnehmen).

**Step 7.4 — Dashboard umverdrahten.**
In `Dashboard.tsx`:
- Import `DashboardBigFourCard` entfernen
- JSX `<DashboardBigFourCard … />` entfernen (zwischen NatalSignaturStatic und Sternenhimmel)
- Props an `NatalSignaturStatic` ergänzen:
```tsx
<NatalSignaturStatic
  sunSign={apiData?.sunSign}
  moonSign={apiData?.moonSign}
  ascendant={apiData?.ascendant}
  baziAnimal={apiData?.bazi?.dayAnimal}
  wuxingElement={apiData?.wuxing?.dominantElement}
>
  <DashboardAstroSection {...} />
</NatalSignaturStatic>
```

**Step 7.5 — Tests.**
- Aktualisiere/neu: `natal-signatur-static.identity.test.tsx` — rendert Identity-Pills
- Aktualisiere Dashboard-Snapshot / Test, der `DashboardBigFourCard` erwartete

**Step 7.6 — DashboardBigFourCard archivieren/löschen.**
Wenn nirgends sonst genutzt: Datei + Tests löschen.

**Step 7.7 — Verify.**
```bash
npx tsc --noEmit
npx vitest run
```

**Step 7.8 — Commit.**
```bash
git commit -am "refactor(dashboard): merge identity pills into NatalSignaturStatic"
```

---

## Phase 8 — Doppelten CosmicInfluenceSection entfernen

**Ziel:** Die zweite "Kosmischer Einfluss"-Sektion unter dem Sternenhimmel verschwindet. Tageseinflüsse leben jetzt oben im DailyChartHero (Phase 4).

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 8.1 — Grep.**
```bash
Grep -n "CosmicInfluenceSection" src/components/Dashboard.tsx
```

**Step 8.2 — Entfernen.**
Die zweite Einbettung (unterhalb Sternenhimmel) löschen. Import bei Bedarf streichen (wenn nicht mehr referenziert), Datei `CosmicInfluenceSection.tsx` optional archivieren.

**Step 8.3 — Verify.**
```bash
npx tsc --noEmit
npx vitest run
```

**Step 8.4 — Commit + HALT.**
```bash
git commit -am "fix(dashboard): remove duplicate CosmicInfluenceSection below sky"
```
**HALT** — Ben reviewt Dashboard visuell (Phasen 1–8 kumulativ im Browser).

---

## Phase 9 — Diagnose `/api/space-weather/extended`

**Ziel:** Root-Cause dafür, dass Kp/Solar-Pressure/Transit-Counts überall 0 zeigen. Fix oder klarer Defect-Report.

**Files:**
- Read: `src/hooks/useSpaceWeather.ts`
- Read: `server/api/space-weather/extended.*` (Proxy-Endpoint)
- Read: `.env` / `astro.config.*` (NASA_API_KEY?)
- Add: `server/api/space-weather/__debug.ts` (temporär, Logging)

**Step 9.1 — Endpoint in Browser triggern.**
```bash
curl -i https://<dev-deployment>/api/space-weather/extended | head -60
```
Interessant: HTTP-Status, JSON-Schema, Fehler-Body.

**Step 9.2 — Hypothesen-Matrix.**

| Hypothese | Signal | Fix |
|---|---|---|
| NASA_API_KEY fehlt/abgelaufen | 401/403 von DONKI | Key rotieren + in .env.production setzen |
| NOAA SWPC downstream 500 | Server-Fehler sichtbar | Circuit-Breaker + Fallback-Payload |
| Response-Schema-Drift → Zod reject | `SpaceWeatherExtendedSchema.safeParse = false` | Schema aktualisieren, Breaking-Diff markieren |
| CORS / Cookie / Auth-Wall | Browser-Request 401, Node-Curl 200 | Auth-Header/Origin prüfen |
| Cache liefert stale nulls | `space_weather_cache` TTL-Logik kaputt | Cache-Invalidierung, Log neuester `expires_at` |

**Step 9.3 — Logging einziehen.**
Im Server-Handler an Ausgangs-/Eingangspunkten:
```ts
console.info('[space-weather] upstream donki status', resp.status);
console.info('[space-weather] parsed kp', parsed?.kpIndex);
```
Im Hook:
```ts
if (import.meta.env.DEV) console.debug('[space-weather] state', state);
```

**Step 9.4 — Schema-Test.**
```bash
npx vitest run src/lib/schemas
```
Wenn `SpaceWeatherExtendedSchema` von realer Payload abweicht: Minimal-Anpassung + Regression-Test.

**Step 9.5 — Fix.**
Abhängig von Schritt 9.1. Typische Fixes:
- `.env.production.NASA_API_KEY` setzen, Redeploy
- `INITIAL_STATE` markieren als `loading: true, error: null, kpIndex: null` (statt 0) — UI muss dann Skeleton zeigen, nicht "0 Kp"
- Fallback-Pfad (SWPC direkt) aktivieren

**Step 9.6 — UI-Robustheit.**
In Driver-Pills und KP-Panel: wenn `kpIndex == null` statt `0` → Placeholder "—" + Tooltip "Daten gerade nicht verfügbar". Das verhindert künftig "falsche 0".

**Step 9.7 — Verify.**
- Browser: Driver-Pills zeigen echten Kp + Solardruck
- Signatur-Seite: KP-Panel farbig
- `npx tsc --noEmit` + `npx vitest run`

**Step 9.8 — Commit + HALT.**
```bash
git commit -am "fix(space-weather): restore kp/solar data flow + null-safe UI"
```
**HALT** — Ben bestätigt real-world Daten in beiden Oberflächen.

---

## Phase 10 — Signatur 3D "komisches Bild" diagnostizieren

**Ziel:** Verstehen, warum `SignaturRenderer` / `SignatureSphere3D` kein echtes 3D rendert. Fix oder dokumentierter Bug-Report mit Nachfolge-Sprint-Vorschlag.

**Files (read-only erste Runde):**
- `src/components/signatur/SignaturRenderer.tsx`
- `src/components/signatur/SignatureSphere3D.tsx`
- `src/components/signatur/ChladniPlate.tsx` (falls existiert)
- `src/lib/signatur/*`

**Step 10.1 — Read.**
```
Read SignaturRenderer.tsx
Read SignatureSphere3D.tsx
Grep -n "Canvas\|useFrame\|ShaderMaterial\|MeshStandardMaterial" src/components/signatur
```

**Step 10.2 — Hypothesen.**
- Rendering fällt auf 2D-Chladni-Platte zurück (Fallback bei fehlenden planetWeights oder WebGL-Fehler)
- `@react-three/fiber` Canvas nicht korrekt eingehängt → statisches Poster
- Condition `if (!isPremium) return <StaticImage />` aktiv
- `planetWeights` ist NEUTRAL → Algorithmus ergibt leere/uniforme Geometrie → wirkt wie "komisches Bild"

**Step 10.3 — Bereinigung des Renderers.**
Wenn es eine Fallback-Bedingung gibt, die fälschlich in den Nicht-3D-Pfad springt: fixen. Wenn echter 3D-Code fehlt: **HALT**, Ben entscheidet ob Scope erweitert wird oder in eigenen Sprint.

**Step 10.4 — Defect-Report schreiben.**
Wenn kein Fix in dieser Phase: Datei `docs/requirements/2026-04-20-signatur-3d-defect.md` anlegen mit:
- Reproduktion (Screenshot-Pfad)
- Aktueller Pfad durch den Code (welche Komponente rendert was)
- Hypothesen + auszuschliessende Ursachen
- Akzeptanzkriterien für echtes 3D (rotierbar, Licht, planetare Farben, Frequenz-Animation)

**Step 10.5 — Commit.**
```bash
git commit -am "docs(signatur): 3D defect report + initial diagnose"
```

---

## Phase 11 — Quiz → Signatur als DEFERRED dokumentieren

**Ziel:** Explizit festhalten, dass die Einwirkung der Quizze auf die Signatur einen eigenen Sprint bekommt. Keine Code-Änderung.

**Files:**
- Create: `docs/requirements/2026-04-20-quiz-signatur-coupling-deferred.md`

**Inhalt (Mindestgerüst):**
- Scope-Abgrenzung: was läuft heute (quiz_sectors-Berechnung backend-seitig vorhanden laut KOHAERENZ_INDEX.md §4), was fehlt auf der Frontend-Seite (Visualisierung des Quiz-Einflusses in der Signatur-Sphäre)
- Offene Requirements: wie soll Quiz-Delta visuell wirken (Farbton, Geometrie, Amplitude)?
- Eingangs-Artefakte: `quiz_sectors`, `quiz_effective` aus `user_signature_state`
- Akzeptanz: mindestens einen sichtbaren, reproduzierbaren Unterschied zwischen "keine Quizze abgeschlossen" und "1 Cluster abgeschlossen"
- Risiken: Performance bei Re-Render des 3D-Canvas
- Out-of-scope für diesen Sprint: Algorithmus-Neuentwicklung, weitere Quiz-Cluster

**Commit.**
```bash
git commit -am "docs(requirements): quiz-signatur coupling deferred to next sprint"
```

---

## Output-Contract pro Phase (Codemoss-Guardrails)

Jede Phase schliesst mit diesem Block ab:

### phase
[Was diese Phase geändert hat]

### verification
- typecheck: [passed/failed/not available]
- lint: [passed/failed/not available]
- tests/build: [passed/failed/not run]

### remaining risks
- [Spezifisches Risiko oder `none identified`]

### confidence
- high / medium / low

---

## Referenzen

- `docs/KOHAERENZ_INDEX.md` — kanonischer Text für Tooltip + Subtitel-Logik
- `docs/plans/2026-04-14-daily-chart-hero.md` — Ursprungsplan der Hero-Konsolidierung
- `docs/plans/2026-04-05-bug-fix-sweep.md` — bestehende Sweeper-Liste, schnittmenge prüfen
- Memory: `project_day_pulse_trace_shipped.md` (Day-Pulse/Trace-Gating), `project_soulprint_hotfix_track_b.md` (Track-B-Kontext)

---

## Ausführungs-Handoff

Plan vollständig und gespeichert unter `docs/plans/2026-04-20-dashboard-signatur-gaps.md`.

**Zwei Optionen für die Umsetzung:**

1. **Subagent-Driven (in dieser Session)** — ich dispatche pro Task einen frischen Subagenten, reviewe zwischen Tasks, schnelle Iteration mit HALT-Punkten nach Phase 3, 5, 8, 9, 10.

2. **Parallele Session (separat)** — du öffnest eine neue Session in einem Worktree und nutzt `superpowers:executing-plans`, Batch-Ausführung mit Checkpoint-Reports.

Welche Variante passt für diesen Sprint?
