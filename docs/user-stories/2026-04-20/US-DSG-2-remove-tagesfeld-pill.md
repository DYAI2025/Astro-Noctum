# US-DSG-2: Remove meaningless "Tagesfeld" driver pill

**Als** Bazodiac-Nutzer
**möchte ich** im Driver-Strip nur noch aussagekräftige Kennzahlen sehen (Geomagnetik, Solardruck, Transit-Aktivität),
**damit** ich nicht durch eine bedeutungslose "Tagesfeld Impuls/Spur"-Pille verwirrt werde, die dieselbe Information dupliziert, die ohnehin im Day-Impulse-Badge steht.

## Akzeptanzkriterien (Gherkin)

### AC-1: Tagesfeld-Pille entfernt
- **Gegeben** der `DailyChartHero` wird in beliebiger Konfiguration gerendert
- **Wenn** der `driver-strip` inspiziert wird
- **Dann** existiert dort kein Text `Tagesfeld` oder `Day field`

### AC-2: Genau 3 Driver-Pillen
- **Gegeben** der Hero wird gerendert
- **Wenn** die Kinder von `driver-strip` gezählt werden
- **Dann** sind es exakt 3 (Geomagnetik + Solardruck + Transit-Aktivität)

### AC-3: Mode-Info nicht verloren
- **Gegeben** `dayMode = 'pulse'` bzw. `'trace'`
- **Wenn** der Hero gerendert wird
- **Dann** wird die Information weiterhin im Day-Impulse-Badge als `Tages-Impuls` bzw. `Tages-Spur` angezeigt (separate Section, nicht Driver-Strip).

## Verifikation

- **typecheck:** passed (`npx tsc --noEmit`)
- **lint:** not run (sprintende-Sweep, Phase 3 HALT ist erster Lint/Visual-Gate)
- **tests:** passed (38/38 aggregate across `daily-chart-hero.test.tsx`, `daily-chart-hero.subtitle.test.tsx`, `daily-chart-hero.drivers.test.tsx`)
- **visuell:** pending-Ben-Review (gesammelt am Phase-3-HALT)
- **API-check:** n/a

## Geänderte Dateien

- `src/components/dashboard/DailyChartHero.tsx` — 4. Driver-Entry (`Tagesfeld`/`Day field`) aus dem `drivers`-Array entfernt, `dayMode` aus useMemo-Deps gestrichen (wird für die useMemo nicht mehr gelesen; Prop bleibt, wird weiter für Badge + accentColor verwendet).
- `src/__tests__/daily-chart-hero.drivers.test.tsx` — neue Datei, 2 Tests (Tagesfeld nicht vorhanden + exakt 3 Pills).
- `src/__tests__/daily-chart-hero.test.tsx` — 3 Regressions angepasst:
  - `renders all 4 drivers` → `renders 3 drivers (Geomagnetik, Solardruck, Transit-Aktivität)` mit `queryByText('Tagesfeld')` null-assertion.
  - `shows Impuls for pulse mode` — gelöscht (assertion war auf Driver-Value, der jetzt weg ist; Mode-Info bleibt via bereits existierendem Test `shows mode badge (Tages-Impuls for pulse)` abgedeckt).
  - `shows Spur for trace mode` — gelöscht (symmetrisch zu oben, abgedeckt durch `shows mode badge (Tages-Spur for trace)`).

## Referenzen

- Plan-Phase: `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 2
- Goal: `1-objectives/goals/GOAL-dashboard-signatur-hygiene.md` — Success Criterion "Keine bedeutungslosen Pills ('Tagesfeld Impuls') mehr im Driver-Strip."
- Policy: Plan-Dokument-Überblick §Dashboard.4 "Pill 'Tagesfeld Impuls' — bedeutungslose Information, entfernen."

## Remaining Risks

- Keine identifizierten — Mode-Info ist redundant als Day-Impulse-Badge vorhanden und dort bereits durch Tests abgedeckt.
- **Vorgemerkt aus Phase 1** (Scope-Creep vermieden, nicht in Phase 2 mitgefixt): Baseline-Label `Basis X · Heute +Y` rendert bei negativem Delta als `Heute +-5`. Wird später adressiert.

**Confidence:** high — trivialer Edit mit vollständiger Test-Abdeckung.
