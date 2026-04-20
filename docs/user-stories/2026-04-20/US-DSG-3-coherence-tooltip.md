# US-DSG-3: Hover-Tooltip erklärt den Kohärenzindex

**Als** Bazodiac-Nutzer
**möchte ich** beim Hover über den Kohärenzring eine kurze, ehrliche Erklärung sehen, was der Index misst und was NICHT,
**damit** ich die Zahl nicht mit einer Identitätsaussage verwechsle, sondern verstehe: sie zeigt, "wie laut meine Struktur gerade spricht" — nicht "wer ich bin".

## Akzeptanzkriterien (Gherkin)

### AC-1: Trigger existiert
- **Gegeben** `DailyChartHero` wird mit validen Kohärenzwerten gerendert
- **Wenn** das DOM inspiziert wird
- **Dann** existiert ein Element mit `data-testid="coherence-ring"`

### AC-2: Tooltip erscheint bei Hover
- **Gegeben** der Trigger existiert
- **Wenn** der User mit der Maus darüber hovert (Radix Delay 500ms)
- **Dann** erscheint Tooltip-Text, der `misst, wie stark deine Natal-Signatur` enthält

### AC-3: Vier semantische Layer erwähnt
- **Gegeben** der Tooltip ist offen
- **Wenn** der Text gelesen wird
- **Dann** sind alle vier Layer benannt: `Natal-Kern`, `Transit`, `Quiz-Kalibrierung`, `Membran (Kp, Sonnenwind)`

### AC-4: Geschlossen = kein Inhalt im DOM
- **Gegeben** kein Hover
- **Wenn** das DOM nach dem Tooltip-Text durchsucht wird
- **Dann** ist kein Tooltip-Text sichtbar (Radix rendert Content nur bei open=true)

### AC-5: Keyboard-A11y
- **Gegeben** der Trigger-Div hat `tabIndex={0}` und `aria-label`
- **Wenn** User den Ring via Tab fokussiert
- **Dann** erscheint der Tooltip auch ohne Maus (Radix fires on focus) — *manuell zu prüfen im Browser-Review*.

## Verifikation

- **typecheck:** passed (`npx tsc --noEmit`)
- **lint:** passed (im Projekt ist `lint` === `tsc --noEmit`; keine separate ESLint-Config vorhanden)
- **tests:** passed — full sweep 1985/1985 grün, dabei 4 neue Tooltip-Tests + 38 Hero-Regressionen
- **visuell:** **pending-Ben-Review** — Phase-3-HALT-Gate: Tooltip-Text lesbar, 500ms Delay fühlt sich richtig an, Positionierung stört keinen anderen Content, Dark-Mode-Kontrast ausreichend
- **API-check:** n/a (reine UI-Feature)

## Geänderte Dateien

- `src/components/dashboard/DailyChartHero.tsx` — Import `@radix-ui/react-tooltip`; zwei Konstanten `COHERENCE_TOOLTIP_DE` / `COHERENCE_TOOLTIP_EN` mit kanonischem Text aus `docs/KOHAERENZ_INDEX.md` §3.1–3.2; `SplitCoherenceRing` mit `<Tooltip.Provider delayDuration={500}><Tooltip.Root><Tooltip.Trigger asChild><div data-testid="coherence-ring" tabIndex={0} aria-label=…>…</div></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content sideOffset={8}>…<Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>` umschlossen.
- `src/__tests__/daily-chart-hero.tooltip.test.tsx` — neu, 4 Tests (Trigger existiert, Hover öffnet, Vier-Layer-Assertion, Closed-State).
- `package.json` + `package-lock.json` — `@radix-ui/react-tooltip ^1.2.8` (dep), `@testing-library/user-event ^14.6.1` (devDep).

## Referenzen

- Plan-Phase: `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 3
- Canonical text: `docs/KOHAERENZ_INDEX.md` §3.1 und §3.2 ("Kohärenzindex IST NICHT 'wer bist du?'" + Schichtenmodell)
- Goal success criterion: `1-objectives/goals/GOAL-dashboard-signatur-hygiene.md` — "(b) Hover-Tooltip mit Kurz-Erklärung des Index"

## Remaining Risks / Notes

- **Zwei neue Dependencies installiert.** `@radix-ui/react-tooltip` (dep, ~15KB gzipped) ist Radix's erstes Primitive im Projekt — Pfad wird für Phase-zukünftige Tooltips konsistent bleiben. `@testing-library/user-event` (devDep) nur für realistische Hover-/Focus-Tests. `npm install` meldet 8 pre-existing vulnerabilities — **nicht durch diese Phase verursacht**, nicht in Scope, später per `npm audit` sweep.
- **Radix doppelt gerenderter Text.** TooltipContent rendert sichtbar + visually-hidden (für Screen-Reader), daher nutzen die Tests `findAllByText`, nicht `findByText` — andernfalls würden sie an Mehrfach-Matches scheitern. In US dokumentiert als bekannte Eigenart.
- **Dark-Mode-Kontrast.** Tooltip-Background ist `var(--tile-bg, rgba(10,8,20,0.96))` + goldener Border-Akzent; sollte gut lesbar auf der Dark-Ästhetik sein, aber visuelle Verifikation ist erforderlich — das ist Teil des HALT-Gates.
- **Vorgemerkt aus Phase 1**: Baseline-Label bei negativem Delta zeigt `Heute +-5` — nicht Phase-3-Scope, für späteren Sweep.

**Confidence:** high — 4 neue Tests + 1985/1985 full-sweep grün, tsc clean, ARIA-Rolle durch Radix garantiert, Trigger hat Keyboard-Focus + aria-label.
