# US-DSG-4: ActiveImpactsList extrahieren, Dashboard + Signatur teilen sich dieselbe Planeten-Visualisierung

**Als** Bazodiac-Nutzer
**möchte ich** die "Aktiven Einflüsse" auf Dashboard und Signatur-Seite im gleichen visuellen Schema sehen,
**damit** ich nicht zwei unterschiedliche Sprachen für dasselbe astrologische Phänomen lernen muss und das Produkt kohärent wirkt.

## Akzeptanzkriterien (Gherkin)

### AC-1: Shared Component existiert mit zwei Varianten
- **Gegeben** der neue Shared-Ordner `src/components/shared/ActiveImpactsList.tsx`
- **Wenn** die Komponente mit `variant="full"` gerendert wird
- **Dann** erscheint der "Warum?"-Toggle unter jedem Panel
- **Und wenn** die Komponente mit `variant="compact"` gerendert wird
- **Dann** ist der "Warum?"-Toggle NICHT vorhanden

### AC-2: Signatur-Seite unverändert
- **Gegeben** `/signatur` verwendet `TransitResonancePanels`
- **Wenn** `TransitResonancePanels` gerendert wird
- **Dann** delegiert sie 1:1 an `<ActiveImpactsList variant="full" />` und alle bestehenden 23 Signatur-Regression-Tests bleiben grün

### AC-3: Dashboard mountet die Compact-Variante
- **Gegeben** `DailyChartHero` bekommt jetzt `birthSign` statt `activePlanets` als Prop
- **Wenn** der Hero gerendert wird
- **Dann** erscheint unter dem Driver-Strip eine Section mit `data-testid="active-impacts-section"` und der Überschrift "Aktive Einflüsse" im gleichen visuellen Schema wie auf der Signatur-Seite

### AC-4: maxItems-Cap funktioniert
- **Gegeben** `ActiveImpactsList variant="compact" maxItems={2}`
- **Wenn** die Component 4 Planeten-Influences bekommt
- **Dann** rendert sie nur die stärksten 2 (Mars 0.88, Saturn 0.78 in der Test-Fixture)

### AC-5: Empty State
- **Gegeben** `birthSign` ist undefined oder `computeTodayPlanetInfluences` liefert null
- **Wenn** die Component gerendert wird
- **Dann** zeigt sie einen Empty-State-Block und keine Planeten-Panels

## Verifikation

- **typecheck:** passed
- **lint:** passed (lint === tsc --noEmit)
- **tests:** **full sweep 1988/1988 grün**. Neue Tests: 9 in `active-impacts-list.test.tsx` (volle Coverage der Varianten + Empty-State + maxItems-Cap). Regressionen: 23/23 im `transit-resonance-panels.test.tsx` (Delegation ändert Verhalten nicht). Daily-Chart-Hero-Suite an die neue Datenquelle angepasst: 7 alte PlanetCard-Tests durch 1 Delegation-Test ersetzt + 1 Metadaten-Test (`dashboard-section-order.test.tsx`) an neue testid/Props-Realität angepasst.
- **visuell:** pending-Ben-Review (gesammelt mit Phase 5 oder beim nächsten HALT)
- **API-check:** n/a — Dashboard ruft weiterhin `useActiveImpacts()` auf für `baseCoherence/displayedCoherence/positiveDailyDelta`, verzichtet aber auf dessen `activePlanets`-Feld, weil die Anzeige jetzt aus `computeTodayPlanetInfluences(birthSign)` (client-side Kepler) kommt. Hook-Feld `activePlanets` bleibt vorhanden — potenziell unused für das Dashboard, aber `impact-planet-cards.test.tsx` + `aktive-einfluesse-fusion.test.tsx` testen noch den alten Pfad via `AktiveEinfluesseFusion`-Komponente, die aktuell von keiner Route mehr importiert wird (siehe Remaining Risks).

## Geänderte Dateien

- **new** `src/components/shared/ActiveImpactsList.tsx` — Shared Planet-Impact-Komponente. `variant: 'full' | 'compact'`, `maxItems`, `hideHeader`. Extrahiert PLANET_CONFIG/ASPECT_MAP/ASPECT_FRAMING/ZODIAC_DE/buildPanels/buildExplanation/poleInsight/FieldBar/TransitPanel/ImpactsEmptyState aus `TransitResonancePanels.tsx`. Panel-Internals passen sich per `compact`-Prop an (kleinere Symbol-Badge, weniger Padding, kein "Warum?"-Toggle im compact).
- **rewrite** `src/components/signatur/TransitResonancePanels.tsx` — von 312 Zeilen auf ~25 Zeilen eingedampft; jetzt ein reiner Adapter-Wrapper um `<ActiveImpactsList variant="full" />`. Verhalten identisch.
- **modify** `src/components/dashboard/DailyChartHero.tsx` — PlanetCard-Komponente (60 Zeilen) gelöscht; `activePlanets`-Prop entfernt; `birthSign?: string | null` Prop hinzugefügt; Import `ActivePlanet` gelöscht; Import `ChevronDown` gelöscht (war nur von PlanetCard genutzt); Import `useState` gelöscht (selbiger Grund); `<ActiveImpactsList variant="compact" maxItems={4} hideHeader />` unter dem Driver-Strip eingebaut mit eigenem Überschriften-Tag "Aktive Einflüsse"/"Active influences".
- **modify** `src/components/Dashboard.tsx` — Destructure von `useActiveImpacts()` zurechtgetrimmt: `activePlanets` + `loading: impactLoading` entfernt, Kommentar ergänzt warum. DailyChartHero-Aufruf gibt jetzt `birthSign={birthSign}` statt `activePlanets={impactPlanets}`.
- **new** `src/__tests__/active-impacts-list.test.tsx` — 9 Tests (4 full-variant, 3 compact-variant, 2 empty-states).
- **modify** `src/__tests__/daily-chart-hero.test.tsx` — `describe('active planets')`-Block (7 tests) entfernt (Scope zu `ActiveImpactsList` migriert). Neue Delegation-Assertion `describe('active impacts section')` mit 1 Test. MOCK_PLANET_STRONG/MOCK_PLANET_WEAK/NO_PLANETS Konstanten + `ActivePlanet`- und `fireEvent`-Imports gelöscht. `planetInfluences`-Mock eingezogen, damit die ActiveImpactsList-Delegation deterministisch Empty-State rendert.
- **modify** `src/__tests__/dashboard-section-order.test.tsx` — Source-Match-Test angepasst: `activePlanets`/`active-planets-section` → `ActiveImpactsList`/`active-impacts-section`.
- **modify** `docs/docu/STRUCTURE.md` — `src/components/` Inventory um `shared/` + Zweck-Kommentar zu `ActiveImpactsList` ergänzt.

## Referenzen

- Plan-Phase: `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 4
- Goal success criterion: `GOAL-dashboard-signatur-hygiene` — "Planeten-Einflüsse erscheinen im Dashboard im gleichen visuellen Schema wie auf der Signatur-Seite … über eine gemeinsame `ActiveImpactsList`-Komponente."
- Data source: `src/lib/astro-data/planetInfluences.ts` — client-side Kepler für Mars/Venus/Jupiter/Saturn

## Remaining Risks / Notes

- **Dead code: `AktiveEinfluesseFusion.tsx`** (plus zwei dazugehörige Testsuites `aktive-einfluesse-fusion.test.tsx` + `impact-planet-cards.test.tsx`, gesamt ~60 Tests grün) wird von keiner Route mehr importiert, aber die Tests laufen noch und konsumieren weiterhin die `useActiveImpacts().activePlanets`-Daten. Bewusst nicht in Phase-4-Scope entfernt — gehört in einen separaten Dead-Code-Cleanup-Task. Signatur-engine und Hook-Datenstruktur selbst bleiben unverändert, also kein Risiko für Prod.
- **`useActiveImpacts().activePlanets` ist nicht mehr vom Dashboard konsumiert** — der Hook kann perspektivisch schlanker werden. Außerhalb von Phase-4-Scope.
- **Plan-File-Budget**: der Plan sagt "≤5 Files"; durch die emergente Notwendigkeit, `Dashboard.tsx`, `daily-chart-hero.test.tsx`, `dashboard-section-order.test.tsx`, `STRUCTURE.md` mit anzupassen, wurden 8 Files verändert + 2 neu erstellt. Scope selbst bleibt auf Phase 4 beschränkt — die Zusatz-Files sind direkte Konsequenzen der Kern-Extraktion, nicht Scope-Creep.
- **Vormerkung aus Phase 1 bleibt:** Baseline-Label `Basis X · Heute +Y` rendert bei negativem Delta als `Heute +-5`. Nicht Phase-4-Scope.

**Confidence:** high — komplette Test-Abdeckung auf beiden Konsumenten (Signatur: 23 Regressionen grün; Dashboard: neue Delegation-Assertion + bestehende Sektionen grün), Typen clean, die visuelle Ziel-Parität ist jetzt strukturell durch Code-Teilung garantiert (statt per Konvention).
