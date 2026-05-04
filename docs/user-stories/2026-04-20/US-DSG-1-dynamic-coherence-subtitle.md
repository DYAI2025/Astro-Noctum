# US-DSG-1: Dynamic coherence subtitle reflects delta direction

**Als** Bazodiac-Nutzer
**möchte ich** dass der Untertitel unter dem Kohärenzring ehrlich kommuniziert, ob mein Basiswert heute durch Transite angehoben, gedämpft oder unverändert ist,
**damit** ich dem UI vertrauen kann und nicht bei negativer oder neutraler Tagesmodulation eine "erhöht"-Aussage lese, die der Datenlage widerspricht.

## Akzeptanzkriterien (Gherkin)

### AC-1: erhöhter Tag
- **Gegeben** mein Kohärenz-Basiswert ist 60 und die heutige positive_daily_delta ist 8, displayed ist 68
- **Wenn** der `DailyChartHero` gerendert wird
- **Dann** zeigt der Untertitel `Dein Basiswert 60, heute durch kosmische Aktivierung angehoben auf 68.`

### AC-2: gedämpfter Tag
- **Gegeben** mein Basiswert ist 60 und positive_daily_delta ist -5, displayed ist 55
- **Wenn** der Hero gerendert wird
- **Dann** enthält der Untertitel `gedämpft` und verlangt keine Erhöhung

### AC-3: neutraler Tag
- **Gegeben** mein Basiswert ist 60 und positive_daily_delta ist 0, displayed ist 60
- **Wenn** der Hero gerendert wird
- **Dann** enthält der Untertitel `ohne spürbare kosmische Modulation`

### AC-4: Rundung
- **Gegeben** Werte sind Fliesskommazahlen (60,4 / 7,6 / 68,0)
- **Wenn** der Hero gerendert wird
- **Dann** werden `base` und `displayed` auf ganze Zahlen gerundet im Untertitel angezeigt

### AC-5: EN-Parallelität
- **Gegeben** Sprache ist `en`
- **Wenn** der Hero gerendert wird
- **Dann** gibt `coherenceSubtitle(..., 'en')` die englischen Varianten zurück (`elevated`, `dampened`, `without noticeable`)
- (nicht automatisiert in Phase 1 — LanguageContext-Mock liefert nur `de`; Code-Pfad durch Funktionslogik abgedeckt, separater Regression-Test nachziehen wenn `en` Dashboard-Tests eingeführt werden)

## Verifikation

- **typecheck:** passed (`npx tsc --noEmit` — no output)
- **lint:** not run (Phase-1-Skalierung; Lint-Sweep am Sprintende)
- **tests:** passed (38/38 — `daily-chart-hero.subtitle.test.tsx` 4 new + `daily-chart-hero.test.tsx` 34 regressions, darunter die angepasste "explanatory sentence"-Assertion)
- **visuell:** pending-Ben-Review
- **API-check:** n/a (reine UI-Logik — keine Endpoint-Änderung)

## Geänderte Dateien

- `src/components/dashboard/DailyChartHero.tsx` — Helper `coherenceSubtitle()` hinzugefügt oberhalb des Skeleton, hardcoded Subtitle-Zeile ersetzt durch Funktionsaufruf + `data-testid="coherence-subtitle"`.
- `src/__tests__/daily-chart-hero.subtitle.test.tsx` — neue Datei, 4 Tests (raised, dampened, neutral, Rundung).
- `src/__tests__/daily-chart-hero.test.tsx` — existierende Assertion angepasst an neue Subtitle-Sprache (Regex `/Basiswert 65.*angehoben auf 72/`, vorher `/persönlicher Grundwert/`).

## Referenzen

- Plan-Phase: `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 1 (Dynamischer Subtitel)
- Kanonischer Text / Semantik: `docs/KOHAERENZ_INDEX.md` §3.1–3.3
- Goal: `1-objectives/goals/GOAL-dashboard-signatur-hygiene.md`
- Ausgeschlossen aus Scope: Baseline-Label-Format `Basis X · Heute +Y` bleibt unverändert; bei negativem `delta` würde dort `Heute +-5` erscheinen — Risiko für Phase 2/3 dokumentiert (siehe Remaining Risks).

## Notes / Divergenzen zum Plan

- **Test-Pfad angepasst zu `src/__tests__/` (flat — bestehende Repo-Konvention, Plan-Vorschlag `src/components/dashboard/__tests__/` war divergent).** Entscheidung von Ben vor Phase 1.
- **Regression im existierenden Test** (`daily-chart-hero.test.tsx:142–145`): alter Assertion-String `/persönlicher Grundwert/` wurde durch die Phase ersetzt — erwartete Rippenwirkung, in derselben Phase mitkorrigiert statt separater Phase.

## Remaining Risks

- Baseline-Label bei negativem Delta: `Basis 60 · Heute +-5` ist optisch/semantisch unschön. **Nicht** Phase-1-Scope. Für Phase 2 oder 3 vormerken, wenn Ben den UI-Sweep erweitern möchte.
- LanguageContext-Mock hartcodiert auf `de` — `en`-Pfad in `coherenceSubtitle` ist testbar durch isolierte Funktion, aber Integrations-Test fehlt.

**Confidence: high** — Logik-Abdeckung durch 4 neue Tests + 34 Regressionen grün, typecheck clean, Change ist lokal begrenzt auf eine Datei + zwei Test-Dateien.
