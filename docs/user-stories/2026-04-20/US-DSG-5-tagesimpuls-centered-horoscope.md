# US-DSG-5: Tagesimpuls als zentrierte Überschrift mit echtem Daily-Horoscope-Text

**Als** Bazodiac-Nutzer
**möchte ich** unter dem Kohärenzring und den Einflüssen einen klar abgesetzten, mittig platzierten "Tagesimpuls" sehen mit einem echten, personalisierten Horoskop-Text,
**damit** ich sofort erkenne, was der Tag für mich bedeutet — statt einem kleinen Pill-Badge + generischem transit-event `description_de`, das sich anfühlt wie ein Debug-Log.

## Akzeptanzkriterien (Gherkin)

### AC-1: Zentrierte Überschrift
- **Gegeben** der Hero bekommt `impulsText="Heute ist ein Tag zum Atmen."`
- **Wenn** der Hero rendert
- **Dann** existiert ein `<h3>`-Element mit dem Text "Tagesimpuls" und der CSS-Klasse `text-center font-serif text-2xl`

### AC-2: Echter Horoscope-Body
- **Gegeben** Dashboard erhält `dailyData` aus `useFirstRunDaily`
- **Wenn** `dailyData.fusion.synthesis` oder `dailyData.fusion.summary` nicht leer ist
- **Dann** zeigt der Hero exakt diesen Text als Body unter der Tagesimpuls-Überschrift, zentriert, `max-w-prose`

### AC-3: Testid stabil
- **Gegeben** der Tagesimpuls rendert
- **Wenn** Tests `data-testid="day-impulse-section"` suchen
- **Dann** finden sie die Section (Testid-Kontinuität mit Pre-Phase-5-Struktur gewahrt)

### AC-4: Suppression bei fehlendem Text
- **Gegeben** `impulsText` ist leer oder undefined (z.B. Daily-Endpoint liefert nichts)
- **Wenn** der Hero rendert
- **Dann** wird die Tagesimpuls-Section komplett nicht gemountet — **kein** "plausibel aussehender" Platzhalter, **kein** generischer Fallback-Text, **kein** stilles 0-Rendering. Goal-Policy aus `GOAL-dashboard-signatur-hygiene`: „nie durch stille 0-Werte".

### AC-5: Alter transit-event-Body ist weg
- **Gegeben** `transitEvents[]` enthält ein Event mit `description_de="Mars Quadrat zu deiner Natal-Venus bringt Intensität."`
- **Wenn** der Hero rendert
- **Dann** ist der Text **nicht** im DOM. Die Tagesimpuls-Surface gehört dem Horoscope-Synthesis, nicht dem Transit-Event.

### AC-6: "vertiefen →" bleibt
- **Gegeben** `onOpenDayModal` ist gesetzt und `impulsText` ist vorhanden
- **Wenn** der Hero rendert
- **Dann** existiert ein Button mit `data-testid="day-detail-trigger"` und Text "vertiefen →" (DE) / "explore →" (EN)

## Datenquellen-Entscheidung (Step 5.1)

Der Plan nannte hypothetische Feldnamen (`dailyData.horoscope?.short`, `dailyData.interpretation`). Ein Blick in `src/hooks/useFirstRunDaily.ts` + Zod-Schema `src/lib/schemas/experience.ts` zeigt: der tatsächliche Response-Typ heißt `DailyResponse` und `fusion` enthält:

- `synthesis: string` — Haupt-Tages-Synthese (das "wahre" Horoscope-Body, in der Fallback-Implementation bereits identisch zu `summary` gesetzt)
- `summary: string` — Kurzzusammenfassung
- `action: string` — Handlungsempfehlung (z.B. "Nimm dir einen Moment der Stille.")
- `harmony_index`, `day_mode`, usw.

**Entscheidung:** `impulsText = dailyData?.fusion?.synthesis || dailyData?.fusion?.summary`. Reihenfolge bewusst: `synthesis` ist die ausführlichere, personalisierte Aussage; `summary` ist der Fallback, falls ein Backend mal nur das Kürzel liefert. Beide sind in der Zod-Schema als non-nullable strings deklariert; der `||` greift nur bei Leer-String, nicht bei undefined (was bereits abgefangen ist durch Optional-Chaining auf `dailyData`).

**Kein Defect-Report nötig** — der echte Endpoint ist verbunden.

## Verifikation

- **typecheck:** passed (`npx tsc --noEmit`)
- **lint:** passed (im Projekt `lint === tsc --noEmit`)
- **tests:** **1991/1991 full sweep green** (+3 Netto: 7 neu in `daily-chart-hero.impuls.test.tsx`, -7 gelöscht in `daily-chart-hero.test.tsx — day impulse`, +3 neu in derselben Datei als Regressions-Guard "alter Mode-Badge/transit-event-Body/Fallback ist weg")
- **visuell:** **pending-Ben-Review** ← Phase-5-HALT-Gate, gesammelt mit:
  1. Tooltip-Text + Position (Phase 3)
  2. Compact-Variante Proportionen (Phase 4) — pre-warned dass hier Nachbesserung kommen könnte
  3. Tagesimpuls-Typografie (Phase 5): `text-2xl font-serif text-center`, Body `text-sm leading-relaxed text-center max-w-prose`
- **API-check:** `DailyResponse.fusion.synthesis` ist laut `src/lib/schemas/experience.ts:82` ein required string; `buildFallbackDaily` in `useFirstRunDaily.ts:100` setzt es identisch zu `summary`. In Produktions-Fehlerfall (Experience-API unreachable) fällt der Hook auf die lokale synthetische Deutung zurück — d.h. es kommt **immer** ein Text an, der Suppression-Fall (AC-4) tritt nur bei fehlendem `dailyData` (noch nicht geladen) auf, was genau das gewünschte Verhalten ist.

## Geänderte Dateien

- **modify** `src/components/dashboard/DailyChartHero.tsx`:
  - Neue Prop `impulsText?: string` in `DailyChartHeroProps` mit Docstring, die die Datenherkunft `dailyData.fusion.synthesis ?? .summary` festhält.
  - Gelöscht: `MODE_LABEL`, `MODE_DESC` Konstanten (waren nur für Mode-Badge + Mode-Description-Zeile gebraucht).
  - Gelöscht: `primaryEvent` useMemo (verbrauchte transit-events).
  - Gelöscht: locals `modeLabel`, `modeDesc`, `hasEventText` (Phase 5 erzeugt kein Mode-Rendering mehr, `accentColor` bleibt für subtile Tile-Glow).
  - Gelöscht: kompletter "Day-Impulse Block"-JSX (Mode-Badge + Mode-Description + primaryEvent-description_de + personal_context + trigger_planet-Indicator + "keine markanten Ereignisse"-Fallback + alte vertiefen-Button-Position).
  - Neu: `<section data-testid="day-impulse-section">` mit `<h3 className="text-center font-serif text-2xl">Tagesimpuls</h3>` + zentrierter `<p className="text-sm leading-relaxed text-center max-w-prose mx-auto">{impulsText}</p>` + optionalem zentriertem "vertiefen →"-Button. Nur gemountet wenn `hasImpuls` (= `impulsText?.trim().length > 0`).

- **modify** `src/components/Dashboard.tsx`:
  - Call-Site an `DailyChartHero` um `impulsText={dailyData?.fusion?.synthesis || dailyData?.fusion?.summary}` ergänzt.

- **new** `src/__tests__/daily-chart-hero.impuls.test.tsx`:
  - 7 Tests: centered h3, body-Text, testid-Section, text-center-Body, Suppression bei leer, alter transit-event-Body weg, "vertiefen →" bleibt.

- **modify** `src/__tests__/daily-chart-hero.test.tsx`:
  - `describe('day impulse')` 7-Test-Block gelöscht (Scope zu `daily-chart-hero.impuls.test.tsx` migriert; volle Coverage jetzt dort).
  - Neuer `describe('day impulse (post-Phase-5)')` mit 3 Regression-Guards: kein Mode-Badge, kein transit-event-Body/Fallback/impulse-fallback-testid, Suppression bei leer.

## Referenzen

- Plan-Phase: `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 5
- Goal success criterion: `GOAL-dashboard-signatur-hygiene` — "'Tagesimpuls' erscheint als zentrierte grosse Überschrift, Body zeigt echten Text aus dem Daily-Horoscope-Endpoint (nicht nur ein transit-event `description_de`)."
- Data contract: `src/lib/schemas/experience.ts` — `DailyResponseSchema`, `DailyFusionSchema`
- Data source hook: `src/hooks/useFirstRunDaily.ts` (inkl. `buildFallbackDaily()` für Offline-/Error-Fälle)

## Remaining Risks / Notes

- **Vormerkung aus Phase 1 bleibt offen:** Baseline-Label `Basis X · Heute +Y` bei negativem Delta rendert als `Heute +-5`. Nicht Phase-5-Scope.
- **Phase-4-Potential-Reib:** Compact-Variante der `ActiveImpactsList` hat Proportionen/Abstände, die im Browser visuell zu prüfen sind — Ben kündigt mögliche Nachbesserungen beim sammelnden Phase-5-Review an. Das wird ggf. in einer Folge-Mikro-Phase adressiert.
- **Mode-Description verloren:** Die Zeile "Aktiver Tag — Bewegung, Sichtbarkeit, Außenwirkung." (pulse) bzw. "Reflexiver Tag — nach innen horchen, Muster erkennen." (trace) fällt mit Phase 5 weg. Sie lebt aber **weiter** im DayModeModal (Pulse/Trace-Details sind dort das eigentliche Thema), zu dem "vertiefen →" führt. Kein Informationsverlust insgesamt, nur Informations-Re-Location.
- **Kein Risiko bzgl. transit-events:** Die `transitEvents`-Prop wird weiter für den Driver-Strip `classifyTransitCount` + Transit-Count-Anzeige verwendet. Der Removed-Path war rein das Rendering im Tagesimpuls-Block.

**Confidence:** high — echte Datenquelle verbunden (keine Platzhalter), volle Testabdeckung, typecheck clean, Kontinuität der `day-impulse-section` testid gewahrt.
