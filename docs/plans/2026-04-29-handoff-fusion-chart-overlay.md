# Arbeitsauftrag für Claude Code — Fusion-Chart-Overlay

> **Auftraggeber:** Ben (Product Owner / Projektmanager Bazodiac)
> **Erstellt von:** Cowork-Planner-Session (Opus 4.7), 2026-04-29
> **Spec (Source of Truth):** `docs/plans/2026-04-29-spec-fusion-chart-overlay.md`
> **Memory-Anker:** Cowork-Session 2026-04-29, Bens Wahl Variante B + C
> **Sprint-Typ:** Strukturelle Visualisierung — klassisches Geburtschart-Rad mit BaZi-Overlay
> **Reihenfolge:** **NACH** Dashboard-Gaps (A) + Quiz-Coupling Sprint 1 (B). Parallel zu Home-One-Page (D) möglich, aber Koordination bei Routing-Konflikten.
> **Ehrlicher Status:** Spec ist APPROVED — alle 5 Klärungslücken wurden am 2026-04-29 von Cowork-Planner-Session entschieden (Ben hat delegiert mit Auftrag „im besten Sinne von Usability und Design"). Entscheidungs-Box steht in Spec §0, Begründungen in §13. Phase 0 reduziert sich auf reine Code-Verifikation.

---

## 1. Dein Auftrag, Claude Code

Lies die Spec unter `docs/plans/2026-04-29-spec-fusion-chart-overlay.md` als verbindliche Architektur-Grundlage. Du baust ein **klassisches Geburtschart-Rad** mit westlicher Astrologie + BaZi + Wu-Xing in EINER Geometrie. Variante B aus der Cowork-Session.

**Was das Fusion-Chart NICHT ist:**
- Es ersetzt NICHT die bestehende Spirograph-Signatur (`FusionRingCanvasV2`).
- Es ist eine **eigene zweite Visualisierung**, die didaktisch zeigt, woraus die Signatur sich berechnet.
- Beide Komponenten leben nebeneinander — die Signatur als kosmisches Selbst, das Fusion-Chart als strukturelles Rohbild.

**Du baust nicht alles auf einmal.** Phase 0 ist reine Code-Verifikation. Die Produkt-Entscheidungen sind bereits in Spec §0 fixiert.

---

## 2. Phase 0 — Code-Verifikation (KEIN CODE-CHANGE)

Alle Produkt-Entscheidungen sind in Spec §0 verbindlich festgelegt. Phase 0 prüft nur, ob die Spec-Annahmen über den Code stimmen.

Bevor irgendein Edit, mache:

1. **Verifiziere die BAFE-Datenpfade gegen aktuellen Code:**
   - `/api/calculate/western` — welche Felder liefert er konkret? Sektor-Index pro Planet? Aspekt-Liste mit Orb? MC + Aszendent?
   - `/api/calculate/bazi` — welche Form haben die 4 Pillars? Stamm + Zweig pro Säule? Hidden Stems verfügbar?
   - `/api/calculate/wuxing` — existiert er separat oder kommt das aus BaZi? Welche Verteilungs-Form?
   - **Mapping-Konstanten:** Wo im Code lebt aktuell die Erdzweig-↔-Tierkreis-Mapping-Tabelle? `signatur-bridge.ts`? `test-signal.ts`? Eine eigene Datei?
   - **Mapping-Konsistenz-Check:** Folgt der existierende Code dem **pragmatischen Mapping** (Spec-Entscheidung 13.1 (a))? Falls nein → Diskrepanz-Bericht an Ben, BEVOR die Spec gepatcht oder Code geändert wird.

2. **Verifiziere die existierenden Visualisierungs-Komponenten:**
   - `FusionRingCanvasV2` — wo lebt sie, wie wird sie eingebunden, kollidiert eine zweite Chart-Komponente mit ihrer Mount-Logik?
   - `BirthChartOrrery` — was rendert sie aktuell? Wäre sie die 3D-Komponente für Variante C als späteren Premium-Drill-Down?
   - Existiert bereits eine 2D-Geburtschart-Komponente (klassisches Rad)? Falls ja: wird sie noch verwendet oder ist sie tot? (Falls tot: Cleanup-Vorschlag separat machen, NICHT in diesem Sprint mit-aufräumen.)

3. **Risiko-Map (gegen Spec-Annahmen):**
   - Performance: 12 Sektor-Wedges + 4 Ringe + Aspekt-Linien + Tooltip-Layer auf SVG — bleibt das unter 60fps auf Mid-Range-Mobile?
   - i18n: Hanzi-Glyphen sind Unicode, brauchen sie spezielle Font-Loading-Logik? Tooltips müssen mehrsprachig sein.
   - SSR: rendert die Komponente serverseitig? Wenn nein: Fallback-Bild für Crawler nötig?
   - Routing-Koordination: wenn Sprint D (Home One-Page) parallel läuft und die Signatur-Seite verändert — kollidiert das mit der Integration in Phase 8?

4. **HALT.** Liefere Phase-0-Report mit:
   - BAFE-Antwort-Shapes (verifiziert oder Abweichung)
   - Mapping-Konstanten-Lokation + Konsistenz-Check zur Spec-Entscheidung
   - Komponenten-Inventar
   - Risiko-Map
   - Empfehlung: Phase 1 starten / Spec-Patch nötig / weitere Klärung an Ben

   Warte auf Bens „go".

---

## 3. Phase-Plan (NACH Phase-0-Klärung)

### Phase 1 — SDS-Anlage + Type-System
- Neues SDS-Dokument anlegen: `docs/docu/FUSION_CHART_OVERLAY.md` mit allen Spec-Inhalten als Code-naher Referenz.
- Neues Goal anlegen: `1-objectives/goals/GOAL-fusion-chart-overlay.md` (Status Approved).
- Types definieren in `src/types/fusion-chart.ts`:
  - `WesternPlanetPosition`
  - `BaZiPillar`
  - `BaZiBranch`
  - `WuXingDistribution`
  - `FusionChartData` (aggregierte Form, von der Komponente konsumiert)
  - `ResonanceLine` (Cross-System-Match)
- Pure-Funktion `buildFusionChartData(westernData, baziData, wuxingData) → FusionChartData`. Tests zuerst (TDD).

### Phase 2 — Mapping-Konstanten & Geometrie-Helper
- Datei `src/lib/fusion-chart/sector-constants.ts`:
  - 12 Sektor-Definitionen (Index, Name DE/EN, Glyph, Element, Element-Farbe, Polar-Winkel)
  - Branch-zu-Sektor-Mapping-Tabelle (gemäß Phase-0-Klärung)
  - Pillar-Position-Konvention (gemäß Phase-0-Klärung)
- Datei `src/lib/fusion-chart/geometry.ts`:
  - `polarToCartesian(radius, angle)`
  - `sectorWedgePath(innerR, outerR, startAngle, endAngle)`
  - `aspectLinePath(planetA, planetB, type)`
- Tests für alle Helper, insbesondere die Kreissegment-Pfade (snapshot-test).

### Phase 3 — Resonanz-Logik
- Datei `src/lib/fusion-chart/resonance.ts`:
  - `findCrossSystemResonances(westernData, baziData) → ResonanceLine[]`
  - Logik: westlicher Planet ↔ BaZi-Earthly-Branch im selben Sektor (Toleranz aus Spec §6)
  - Day-Master-Element-Match: Western-Sun-Element = Day-Master-Element
- TDD mit konkreten Test-Cases (z.B. Sun in Aries + Day-Master Yang-Wood → 1 Resonanz; Sun in Cancer + Day-Master Yang-Metal → 0 Resonanzen).

### Phase 4 — SVG-Komponente: Static (Variante B Sketch ohne Daten)
- Komponente `<FusionChart>` in `src/components/fusion-chart/FusionChart.tsx`
- Props: `data: FusionChartData | null`, `mode: 'static' | 'dynamic'`, `compact?: boolean` (für Mobile)
- **Phase 4a:** nur Geometrie + leerer Sektoren-Ring (keine Daten). HALT für Ben-Visuelle-Review.
- **Phase 4b:** Sektoren mit Wu-Xing-Tönung. HALT.
- **Phase 4c:** Western Tierkreis-Glyphen + BaZi-Erdzweig-Hanzi auf Position. HALT.

### Phase 5 — SVG-Komponente: Daten-Integration
- **Phase 5a:** Western-Planeten + Aspekt-Linien aus Daten. HALT.
- **Phase 5b:** 4 Pillar-Marker mit Stamm/Zweig-Beschriftung + Resonanz-Linien zu Branches. HALT.
- **Phase 5c:** Day-Master-Kern im Zentrum (Position gemäß §13.2-Klärung). HALT.
- **Phase 5d:** Cross-System-Resonanz-Linien sichtbar gemacht. HALT.

### Phase 6 — Tooltips & Interaktionen
- Tooltip-Komponente, Tab-erreichbar, Tap- und Hover-aktiviert
- 5 Tooltip-Typen aus Spec §9 (Planet, Branch, Pillar, Day-Master, Sektor)
- i18n-fähig (alle Texte über `useTranslation`-Hook).

### Phase 7 — Mobile-Reduktion
- `compact={true}` aktiviert die Reduktionen aus Spec §8
- Tap-State für versteckte BaZi-Glyphen
- `prefers-reduced-motion: reduce` Pfad
- Visueller Test auf 380px (iPhone SE) und 768px (Tablet)

### Phase 8 — Integration in Seite
- Position gemäß §13.3-Klärung (Signatur-Seite / Home-Below / eigene Route)
- Wenn Signatur-Seite: zwischen Spirograph und „Aktive Einflüsse" einsortieren, mit dezenter Trennung
- Wenn Home: in Below-the-fold-Layer 2 (Wu-Xing-Detail) integrieren
- Wenn eigene Route: Routing-Konsolidierung mit dem Home-One-Page-Sprint koordinieren

### Phase 9 — A11y & Performance-Audit
- Lighthouse A11y-Score ≥ 95
- SVG `role="img"`, `<title>`, `<desc>` korrekt
- Tab-Navigation: alle Tooltips + Pillar-Marker erreichbar
- Performance: Initial-Render < 250ms auf Mid-Range-Mobile, Re-Render < 50ms

### Phase 10 — Verifikation & Regression
- E2E-Tests für alle 6 Erfolgs-Kriterien aus Spec §12
- Visueller Snapshot-Test (Storybook + Chromatic oder eigenes Setup)
- Cross-Browser: Safari, Firefox, Chrome (Mobile + Desktop)

---

## 4. SDS-Pflege (VERBINDLICH bei jeder Phase)

1. **`docs/docu/FUSION_CHART_OVERLAY.md`** — anlegen in Phase 1, fortschreibend füllen
2. **`docs/docu/STRUCTURE.md`** — Komponenten-Inventar
3. **`docs/docu/FRONTEND_INTERNALS.md`** — Datenfluss BAFE → buildFusionChartData → Component
4. **`docs/docu/API_REFERENCE.md`** — wenn neue oder erweiterte BAFE-Endpoints nötig
5. **`1-objectives/goals/GOAL-fusion-chart-overlay.md`** — neues Goal mit Success Criteria aus Spec §12
6. **`1-objectives/requirements/REQ-F-fusion-chart-overlay.md`** — Funktionales Requirement mit Acceptance Criteria

---

## 5. User-Stories ableiten (VERBINDLICH pro Phase)

Pro Phase: Story unter `docs/user-stories/2026-04-29/US-FCO-<phase>-<slug>.md`

Beispiel für Phase 5d:

```markdown
# US-FCO-5d: Cross-System-Resonanz sichtbar

**Als** User mit westlicher Sun in Aries und BaZi Day-Master Yang Wood
**möchte ich** im Fusion-Chart eine sichtbare Resonanz-Linie zwischen Sun und Day-Master sehen
**damit** ich erlebe, dass mein westliches und mein chinesisches Profil zusammenklingen.

## Akzeptanzkriterien (Gherkin)
- Gegeben ein User mit Sun-Sektor 0 (Aries) und Day-Master Element=Wood
- Wenn das Fusion-Chart geladen wird
- Dann erscheint eine goldene gestrichelte Resonanz-Linie zwischen Sun-Position und Day-Master-Kern
- Und der Day-Master-Kern pulst leicht (sofern prefers-reduced-motion nicht gesetzt)

## Negativ-Test
- Gegeben ein User mit Sun-Sektor 7 (Scorpio = Water) und Day-Master Yang Wood
- Wenn das Fusion-Chart geladen wird
- Dann erscheint KEINE Resonanz-Linie zwischen Sun und Day-Master

## Verifikation
- unit-test: src/lib/fusion-chart/__tests__/resonance.test.ts
- visuell-test: Storybook-Story FusionChart/ResonanceVariants
- a11y: Resonanz-Linie hat aria-label "Resonanz: Sun und Day-Master teilen Element Wood"
```

---

## 6. Codemoss-Guardrails (verbindlich)

- Re-Read vor jedem Edit, Re-Read nach jedem Edit + Verifikation
- Files > 300 LOC: Schritt-0-Cleanup zuerst
- TDD strikt für `buildFusionChartData()`, `findCrossSystemResonances()`, alle Geometrie-Helper
- Verifikation vor "done": typecheck, lint, unit-tests, visueller Review (HALT pro Sub-Phase)
- Verbotene Sprache ohne Beleg: "done", "fixed", "all good"
- SVG-Edits in 4a–5d: bei JEDER Sub-Phase HALT mit Screenshot. Visuelle Korrektheit ist nicht über Tests verifizierbar.
- Mapping-Konstanten (Phase 2): keine erfundenen Werte. Wenn die BAFE-Outputs eine andere Form haben als die Spec annimmt → Spec patchen, nicht raten.

---

## 7. HARTE PFLÖCKE — Stoppe und frag Ben

- **Phase 4a–5d** — JEDE Sub-Phase HALT mit Screenshot für Bens visuellen Review. Reihenfolge der HALT-Punkte ist die didaktische Logik des Bildes — Ben sieht wie das Bild Schicht für Schicht entsteht. Das ist der wichtigste Reibungs-Punkt im Sprint.
- **Performance-Schwelle**: wenn Initial-Render > 400ms auf Mid-Range-Mobile, stoppe und melde — vermutlich wird SVG zu schwer, R3F-Variante denken.
- **Erdzweig-Mapping-Diskrepanz**: wenn der aktuelle Code NICHT dem pragmatischen Mapping (Spec §13.1 Option a) folgt → Stoppe, melde, lass Ben entscheiden ob Code geändert wird oder Spec angepasst wird. Spec-Entscheidung gilt als Default, aber Code-Realität schlägt Spec, wenn der Code in Produktion ist.
- **Spec-Annahmen über `BirthChartOrrery` oder `FusionRingCanvasV2` brechen** in der Phase-0-Verifikation → stoppe, lass Ben die Spec patchen, bevor Phase 1 startet.

---

## 8. Was du in diesem Sprint NICHT tust

- Keine 3D-Variante (Variante C, eigener späterer Sprint mit R3F)
- Kein dynamischer Wu-Xing-Tönungs-Modus (Spec §7 Modus „dynamisch" — eigener Mini-Sprint danach)
- Keine Live-Transit-Modulation (das ist die Spirograph-Signatur-Aufgabe, nicht hier)
- Keine animierten Aspekt-Linien (statische Linien reichen)
- Keine Editier-Funktionalität (User kann Daten nicht direkt im Chart ändern)
- Keine Synastrie / Paar-Charts (eigener Sprint, kommt nach Quiz-Coupling-Roadmap)
- Kein PDF-Export

---

## 9. Eskalations-Anker

Stoppe und frag Ben, wenn:
- Eine BAFE-Antwort fehlt einen Felder, der für die Visualisierung nötig ist (z.B. Aspekt-Liste fehlt → Phase 5a kann Aspekt-Linien nicht zeichnen)
- Mobile-Performance unter 60fps fällt und kein Fix < 2h Aufwand
- Hanzi-Font-Loading auf bestimmten Browsern bricht
- Die Spec-Annahmen über `BirthChartOrrery` oder `FusionRingCanvasV2` nicht mehr stimmen
- Ein Erfolgs-Kriterium aus §12 nicht erreichbar ist mit dem aktuellen Design

---

## 10. Phase-Abschluss-Format

```markdown
### Phase <n>: <Titel> — [DONE / HALT]

**Geändert / Erstellt:**
- file1.tsx
- file2.ts

**SDS-Updates:**
- FUSION_CHART_OVERLAY.md: [was]
- STRUCTURE.md: [was]
- GOAL/REQ: [was]

**User-Story:**
- docs/user-stories/2026-04-29/US-FCO-<n>-<slug>.md

**Verifikation:**
- typecheck: passed
- lint: passed
- unit-tests: X/X passed
- visuell: <Screenshot oder "pending-Ben-Review">
- a11y: aria/role/title/desc verifiziert
- performance: initial-render <Xms / re-render <Yms

**Spec-Adherence:**
- §<n>: ✓ / Abweichung mit Begründung

**Remaining risks:**
- [spezifisch]

**Confidence:** high / medium / low

**Nächste Phase:** bereit / HALT mit Frage: <Frage>
```

---

## 11. Kick-Off-Prompt (kopierbar)

```
Du bist Claude Code und arbeitest am Bazodiac-Projekt (Astro-Noctum).

Voraussetzung: Sprint Dashboard-Gaps (A) und Sprint Quiz-Coupling Sprint 1 (B) sind beide abgeschlossen und grün.
Falls nicht: STOP und frag Ben.

Lies VOLLSTÄNDIG und in dieser Reihenfolge:
1. docs/plans/2026-04-29-handoff-fusion-chart-overlay.md  (dein Arbeitsauftrag — dieses Dokument)
2. docs/plans/2026-04-29-spec-fusion-chart-overlay.md     (die Spec, Source of Truth, mit 14 Sektionen + 5 Lücken §13)
3. docs/QUIZZES_AND_SIGNATURE.md                         (Sektor-Konstanten + Mapping-Pipeline-Vorbild)
4. docs/po/BAZODIAC_KNOWLEDGE.md                         (Master-Signal-Formel, alignment_boost als mathematische Basis der Resonanz-Linien)
5. docs/KOHAERENZ_INDEX.md                               (Live-Layer-Bezug)

Alle Produkt-Entscheidungen sind in Spec §0 Entscheidungs-Box fixiert (am 2026-04-29 von Cowork-Planner-Session entschieden). Phase 0 prüft NUR Code-Realität, nicht Produkt-Klärung.

Starte mit PHASE 0 — KEIN CODE-CHANGE.
- Verifiziere BAFE-Datenpfade (Western/BaZi/WuXing) gegen aktuellen Code
- Verifiziere bestehende Komponenten (FusionRingCanvasV2, BirthChartOrrery, ggf. existierende 2D-Charts)
- Konsistenz-Check: folgt der Code dem pragmatischen Erdzweig-Mapping aus Spec §13.1?
- Erstelle Risiko-Map (Performance, i18n, SSR, Routing-Koordination mit Sprint D)

Liefere Phase-0-Report. HALT. Warte auf Bens "go" — bei Diskrepanzen Spec-Patch-Vorschlag mitschicken.

Pro Phase ab 1: SDS-Doku synchron + User-Story unter docs/user-stories/2026-04-29/US-FCO-<n>-<slug>.md.
HARTE PFLÖCKE: ALLE Sub-Phasen 4a-5d (visueller Review pro Layer-Schicht), Performance-Schwelle 250ms, Mapping-Diskrepanz Spec↔Code.

Codemoss-Guardrails durchgehend. Verbotene Sprache ohne Beleg: "done", "fixed", "all good".

KRITISCH: Die bestehende Spirograph-Signatur (FusionRingCanvasV2) bleibt UNVERÄNDERT. Du baust ein zweites, eigenständiges Visualisierungs-Element daneben.

Go: Phase 0.
```

---

## 12. Bens Erwartung

Sauberes Schicht-für-Schicht-Bild. Kein Big-Bang-Render, kein „dann ist es einfach plötzlich da". Die Spec ist absichtlich in 10 Sub-Phasen mit visuellen HALT-Punkten zerlegt — Ben will das Bild entstehen sehen.

Reibung erlaubt. Reifung ist das Ziel. Wenn Spec und Code-Realität auseinandergehen: Spec patchen, nicht erfinden.
