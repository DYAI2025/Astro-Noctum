Requirements-Extrakt
FR – Functional Requirements
Faktisch korrekt sage ich, dass FR‑1 bis FR‑4 direkt aus den vorhandenen Daten‑/UI‑Spezifikationen ableitbar sind.
FR-1 (C): Character Sheet View
Die Route /character rendert ein vollständiges Character Sheet mit: Kernwerten (5), Klima‑Achsen (mind. 5), abgeleiteten Werten (4), Archetypen/Story (optional), Footer‑CTAs.
FR-2 (C): Data Contract Rendering
Das UI akzeptiert psyche_profile_v1 mit Pflichtfeldern und optionalen Feldern; fehlende optionale Felder dürfen nie zu Crashes führen (Graceful Degradation).
FR-3 (C): Derived Stats Calculation
derived_stats_v1 wird im Frontend berechnet (0..100) nach:
vitality = avg(clarity, connection)
willpower = avg(courage, order)
chaos = shadow
harmony = 1 - abs(shadow - connection) (gemappt auf 0..100)
FR-4 (H): After‑Quiz Delta UX
Nach einem Quiz wird ein Delta‑Banner (8–12s sichtbar, manuell schließbar) angezeigt, das die Top‑Mover (1–3 Dimensionen) inkl. +/- darstellt und zu Details/ChangeLog führt.
FR-5 (H): Delta‑Driven Animation System
Bars & Achsenmarker animieren gemäß Delta‑Magnitude → Duration:
duration_ms = clamp(450, 1400, 450 + 1200 * delta_mag); bei prefers-reduced-motion nur Crossfade + Number tween (<=250ms).
FR-6 (C): Responsive Layout
Desktop 2‑Spalten‑Grid, Mobile 1‑Spalten‑Stack; Reihenfolge wie Wireframe.
FR-7 (H): Brand‑konformes Light‑Grimoire Theme
Character Sheet nutzt helle Hintergründe, aber hohe Kontraste; Grün/Gold/Beige/Weiß dominieren; Serif‑Headlines + Sans‑Body; goldene Line‑Art‑Ornamente.
FR-8 (M): Share / Copy Link CTA
Footer bietet „Teilen“ / „Link kopieren“ (mindestens Copy Link).
NFR – Non-Functional Requirements
Faktisch korrekt sage ich, dass Accessibility/Usability explizit gefordert ist (Kontrast, Fokus, Keyboard, nicht nur Farbe).
NFR-1 (C): WCAG AA Kontrast
Fließtext und UI‑Controls erfüllen WCAG AA (mind. 4.5:1 für normalen Text). Gold wird nicht als Fließtext eingesetzt.
NFR-2 (H): Reduced Motion Support
prefers-reduced-motion deaktiviert orbit/jitter, begrenzt Animationen <=250ms.
NFR-3 (M): Performance
Ornamente als optimierte SVGs, lazy‑load non‑critical Assets; keine schweren Raster‑Texturen.
NFR-4 (M): Themeability / Tokens
Farbe/Spacing/Radius über Tokens, damit später Avatar‑Parameter (ACCENT_INK) das Theme treiben können.
SC – Success Criteria
Logisch scheint mir, dass diese Kriterien „done“ messbar machen, ohne dein Produkt zu überfrachten:
SC-1: Character Sheet implementiert alle Sektionen + Mobile/Desktop Layout ohne Layout‑Bugs (manuell geprüft + Screenshots).
SC-2: Delta‑Banner + Top‑Mover Highlight funktioniert nach Quiz‑Update (E2E‑Test).
SC-3: Lighthouse Accessibility Score ≥ 90 auf /character.
SC-4: Keine UI‑Crashes bei fehlenden optionalen Feldern (Unit/Component‑Tests).
SC-5: Visuelle Konsistenz: Tokens/Komponenten wiederverwendbar (mind. 80% UI über Shared Components).
Implementierungsplan für AI-Agent
1. Context
Faktisch korrekt sage ich, dass es zwei bestehende Stränge gibt: (a) Brand‑System (Modern Alchemy) und (b) Character‑Sheet MVP‑Spezifikation inkl. Daten/Motion. Ziel ist die Fusion zu einem Light‑Grimoire Character Sheet. Title: Light‑Grimoire Character Sheet (QuizzMe) Summary:
Eine premium‑wirkende, brand‑konforme Character‑Sheet‑Seite mit hellen Pergament‑Flächen, Grün/Gold‑Akzenten und feinen Ornamenten, die psyche_profile_v1 als RPG‑artige Werte visualisiert und nach jedem Quiz spürbar, aber subtil animiert aktualisiert. Scope (In):
/character Layout + Cards + Tooltips + CTA Footer
Delta‑Banner & Movers‑Highlight
Light‑Theme Tokens + Ornament‑SVG‑Set
Responsive + A11y + Reduced Motion
Non‑Scope (Out):
Generativer Avatar / DynamicAvatar Rendering (nur Anschlussfähigkeit)
Vollständige History‑Timeline (ChangeLogAccordion optional v2)
Social‑Share Bildgenerator / OG‑Image Pipeline (später)
KPIs / Erfolg: siehe SC‑1…SC‑5.
2. Technical Framing
Logisch scheint mir, dass ihr bereits auf React/Next + Tailwind + Framer Motion zielt (Brand‑Guidance + bestehende Vorschläge), ich plane daher dafür – lässt sich aber 1:1 auf andere React‑Stacks übertragen. Tech Stack (Planannahme):
Next.js (React) + TypeScript
Tailwind CSS (Tokens/Theme)
Framer Motion (Micro‑Interactions)
TanStack Query (Profile fetch + invalidate nach Quiz)
Architecture Overview:
Data: GET /api/profile/psyche liefert psyche_profile_v1 (inkl. optional last_delta).
UI: CharacterSheetPage rendert Cards; derived stats werden im Frontend berechnet; Motion reagiert auf Delta bzw. Snapshot‑Diff.
Key Design Decisions:
DD-1: Semantic Tokens bleiben (BG_BASE, BG_CARD, …), aber werden als Light‑Theme gemappt (statt near‑black). (Themeability + future avatar‑driven accents).
DD-2: Ornamente als SVG‑Line‑Art (stroke‑based), damit crisp, leicht, skalierbar.
DD-3: Gold nur für Lines/Icons/Borders – Kontrast bleibt über Dark‑Ink Text (#271C16 / #053B3F).
3. Work Plan
Phase 0: Setup & Projektstruktur
T0.1: Theme‑Token Datei anlegen
Description: Erzeuge ein Theme‑Token‑Set „light-grimoire“ mit CSS‑Variablen oder Tailwind theme extension. Nutze die Brand‑HEX als Basis (Emerald/Gold/Parchment/Text).
Artifacts:
styles/theme/light-grimoire.css (oder tailwind.config.* Erweiterung)
Dokumentation: docs/design/tokens.md
DoD:
Tokens decken mind. ab: BG_BASE, BG_CARD, BORDER_SUBTLE, TEXT_PRIMARY, TEXT_MUTED, ACCENT_GOLD, ACCENT_GREEN
Beispielseite zeigt: Hintergrund hell, Textkontrast gut lesbar
Dependencies: —
T0.2: Font‑Setup (Serif/Sans) konsistent machen
Description: Konfiguriere Headline‑Serif und Body‑Sans gemäß Brand (z. B. Playfair/Cormorant + Inter/Source Sans) und definiere eine Typo‑Scale.
Artifacts:
styles/typography.css oder Tailwind font families
docs/design/typography.md
DoD:
H1/H2/H3/Body/Micro entsprechen der Spec‑Hierarchie (H1 prominent; Section labels uppercase).
Dependencies: T0.1
Phase 1: Visual Design Blueprint (Figma/Design Spec)
T1.1: Light‑Grimoire Page Layout spezifizieren (Desktop/Mobile)
Description: Zeichne die finalen Frames exakt nach dem definierten Grid (Desktop 12‑col, Mobile stack). Verwende als Titel „Dein Character Sheet“ + Untertitel „Dein Avatar ist ein Klima, kein Label.“.
Artifacts:
Figma Frames: CharacterSheet/Desktop, CharacterSheet/Mobile
Export: docs/design/character-sheet-layout.md (mit Spacing/Radii)
DoD:
Desktop & Mobile Frame vollständig, inkl. States (default, after‑quiz highlight)
Reihenfolge entspricht Wireframe (Core → Klima → Derived → Archetype → CTA).
Dependencies: T0.1, T0.2
T1.2: Ornament‑Pack (SVG) definieren
Description: Definiere 6–8 Ornamente als thin gold line‑art (Tarot/Alchemy vibe): Corner‑Ornament, Divider‑Flourish, Star‑Map watermark, Botanical sprig, Alchemy circle stamp, Tiny icons (moon/star/crystal).
Artifacts:
assets/ornaments/corner.svg
assets/ornaments/divider.svg
assets/ornaments/constellation-watermark.svg
assets/icons/*.svg
DoD:
SVGs sind stroke‑based, skalieren sauber, Dateigröße klein
Opacity‑Regeln dokumentiert (Background watermark 4–8%)
Dependencies: T1.1
T1.3: Component Visual Spec (Cards, Bars, Rails, Badges)
Description: Lege pro Komponente fest: Padding, Border, Shadow, States (default/hover/updated), Icon‑Platzierung, Tooltip‑Trigger. Nutze Cards: Cream surface + thin gold border + light shadow.
Artifacts:
docs/design/components.md
Figma Components Library (Atoms/Molecules/Organisms)
DoD:
Definiert für: CoreStatsCard, StatBarRow, AxisRail, MetaBadgesRow, StatPill, ArchetypeBadge, AfterQuizDeltaBanner, FooterCTAs
Dependencies: T1.2
Phase 2: Daten & State‑Handling
T2.1: Type Definitions für psyche_profile_v1 + Derived Stats
Description: Lege TypeScript Types/Interfaces für psyche_profile_v1, psyche_state, visual_axes_v1, optionale Felder und derived_stats_v1 an.
Artifacts:
src/types/psyche.ts
DoD:
Optional‑Felder als optional typisiert
Wertebereiche dokumentiert (0..1, 0..100)
Dependencies: —
T2.2: Derived Stats Calculator implementieren
Description: Implementiere reine Funktionen: toPercent01(x)->0..100, calcDerivedStats(psyche_state)->derived_stats_v1 nach Spec‑Formeln.
Artifacts:
src/domain/derivedStats.ts
Unit tests: src/domain/derivedStats.test.ts
DoD:
Tests decken Grenzwerte ab (0, 1, Mittelwerte)
Harmony‑Mapping korrekt (0..100)
Dependencies: T2.1
T2.3: Profile Fetch + Snapshot/Diff Mechanik
Description: Implementiere Query usePsycheProfile() + UI‑State: prev_profile_snapshot, highlight_dims, banner_visible. Movers werden aus last_delta bevorzugt oder aus Snapshot‑Diff berechnet.
Artifacts:
src/hooks/usePsycheProfile.ts
src/domain/delta.ts (movers logic)
DoD:
Update‑Pfad: „new profile arrives“ → movers computed → banner shows 8–12s
Keine Crashes ohne last_delta
Dependencies: T2.1, T2.2
Phase 3: UI‑Implementierung (Light‑Grimoire)
T3.1: /character Page Scaffold + Layout Grid
Description: Lege Route /character an und baue das Grid (Desktop 2‑Spalten, Mobile Stack) inkl. Header.
Artifacts:
app/character/page.tsx oder pages/character.tsx (je nach Router)
src/components/character/CharacterSheetPage.tsx
DoD:
Layout entspricht exakt Row A–D Struktur
Mobile Breakpoints sauber (keine Überläufe)
Dependencies: T0.1, T0.2
T3.2: CoreStatsCard + StatBarRow (5 Kernwerte)
Description: Implementiere Kernwerte Card „Kernwerte“ mit 5 Rows (Clarity, Courage, Connection, Order, Shadow), Tooltip‑Texte, Zahlen (tabular‑nums), optional Delta‑Chip. Tooltips gemäß Library.
Artifacts:
src/components/character/CoreStatsCard.tsx
src/components/character/StatBarRow.tsx
DoD:
Values 0..1 korrekt auf 0..100 gemappt
Tooltip erreichbar per keyboard/focus
Delta‑Chip erscheint für Movers (top 1–3)
Dependencies: T2.2, T2.3, T1.3
T3.3: ClimateCard + AxisRails (5 Achsen)
Description: Implementiere „Dein Klima“ Card mit 5 Achsen (Licht/Schatten, Warm/Kalt, Tief/Oberfläche, Ich/Wir, Gefühl/Verstand) inkl. Links/Rechts Labels und Kurzbeschreibung (optional eingeklappt).
Artifacts:
src/components/character/ClimateCard.tsx
src/components/character/AxisRail.tsx
src/content/climateCopy.de.ts
DoD:
Markerposition entspricht 0..1 Wert
Beschreibungen vorhanden (mindestens via tooltip/info)
Achsen sind barrierearm (aria‑labels)
Dependencies: T2.1, T1.3
T3.4: MetaBadgesRow (Intensität/Tempo/Schatten bestätigt)
Description: Implementiere Badges nach Spec‑Bändern: intensity (leise/spürbar/stark), tempo (ruhig/beweglich/dynamisch), shadow_confirmed erst ab shadow_confidence >= 0.65.
Artifacts:
src/components/character/MetaBadgesRow.tsx
DoD:
Schwellen korrekt
Optional: „Schatten: unbestimmt“ muted oder verborgen dokumentiert
Dependencies: T3.3
T3.5: DerivedStatsCard + StatPills (4 Sekundärwerte)
Description: Baue „Abgeleitete Werte“ Card mit 4 Pills (Vitality, Willpower, Chaos, Harmony). Values aus calcDerivedStats.
Artifacts:
src/components/character/DerivedStatsCard.tsx
src/components/character/StatPill.tsx
DoD:
Number tween später möglich; initial korrekt gerendert
Layout bleibt stabil bei langen Labels
Dependencies: T2.2, T1.3
T3.6: ArchetypeStoryCard (optional, aber empfohlen)
Description: Implementiere „Archetypen & Story“: Top‑Archetyp Badge + optional sekundäre Liste; Story snippet 1–2 Zeilen; Formulierung immer als „Modus/Anteil“, nie „Du bist X“.
Artifacts:
src/components/character/ArchetypeStoryCard.tsx
src/content/archetypeCopy.de.ts (optional)
DoD:
Renders auch ohne archetype_mix/narrative_snippet (zeigt Platzhalter oder hide)
Dependencies: T2.1, T1.3
T3.7: Ornament Layer integrieren (Background + Card Corners)
Description: Implementiere ein Ornament‑Layer:
Page background watermark (constellations) sehr subtil
Card corner ornaments (4 Ecken) in Gold
Divider flourish zwischen Header und Cards
Artifacts:
src/components/ornaments/OrnamentLayer.tsx
src/components/ornaments/*
DoD:
Ornamente stören Lesbarkeit nicht (Opacity/Blend kontrolliert)
Funktioniert responsive (keine abgeschnittenen Ecken)
Dependencies: T1.2, T3.1
Phase 4: Motion & After‑Quiz Activation
T4.1: AfterQuizDeltaBanner implementieren
Description: Banner zeigt +/‑ Änderungen (Top 1–3 dims), CTA öffnet ChangeLogAccordion; auto‑dismiss 8–12s + manuell close.
Artifacts:
src/components/character/AfterQuizDeltaBanner.tsx
src/components/character/ChangeLogAccordion.tsx (minimal v1)
DoD:
Banner erscheint bei Update, verschwindet automatisch
CTA toggelt Accordion
Dependencies: T2.3, T1.3
T4.2: Delta‑Driven Animations (Bars/Rails/Badges)
Description: Implementiere Animationssequenz + duration mapping: Freeze 80ms, Bars + numbers, Rails marker slide, highlight glow fade. Reduced‑motion Pfad beachten.
Artifacts:
src/motion/deltaMotion.ts
Motion wrappers in StatBarRow, AxisRail, MetaBadgesRow
DoD:
duration folgt clamp‑Formel
prefers-reduced-motion reduziert korrekt
Keine „jitter“ Effekte in light theme
Dependencies: T3.2, T3.3, T2.3
T4.3: Highlight Rules (Movers + Shadow watermark gating)
Description: Top movers erhalten 1s outline glow + delta chip 2.5s; „ink crack“ watermark nur wenn shadow_confidence >= 0.65 (mit hysteresis Empfehlung).
Artifacts:
src/domain/movers.ts
src/components/character/HighlightFrame.tsx
DoD:
Movers korrekt berechnet
Watermark gating funktioniert
Dependencies: T2.3, T3.7
Phase 5: QA, A11y, Integration, Handoff
T5.1: Accessibility Pass (Keyboard, Focus, Contrast)
Description: Prüfe: Focus states, tab order, tooltips aria, Buttons hit area >=44px, Kontrast.
Artifacts:
docs/qa/a11y-checklist.md
DoD:
Keyboard-only nutzbar
Kontrastprobleme dokumentiert + behoben
Dependencies: T3.1–T4.3
T5.2: Testsuite (Unit + Component + E2E)
Description:
Unit: derived stats, delta/movers
Component: Render ohne optionale Felder
E2E: Nach Quiz → invalidate query → Banner erscheint, Werte aktualisieren
Artifacts:
src/domain/*.test.ts
e2e/character-sheet.spec.ts
DoD:
Tests laufen grün in CI (oder lokal)
E2E deckt FR‑4/FR‑5 ab
Dependencies: T2.2, T2.3, T4.1, T4.2
T5.3: Result‑→ Character Sheet CTA integrieren
Description: Auf Result Page CTA „Deinen Charakterbogen ansehen“ verlinkt zu /character; nach Quiz completion Query invalidation (TanStack) oder Reload.
Artifacts:
src/pages/result/* (je nach Projekt)
DoD:
Flow funktioniert: Quiz fertig → Result → CTA → Sheet zeigt neue Werte + Banner
Dependencies: T2.3, T4.1
T5.4: Design Handoff Paket (Spec + Tokens + Assets)
Description: Erstelle ein Handoff‑Paket: Tokens, Komponentenliste, Ornament‑Assets, Copy‑Strings, QA‑Checkliste.
Artifacts:
docs/handoff/character-sheet.md
DoD:
Ein Engineer/Agent kann ohne Rückfragen implementieren/ändern
Dependencies: alle
4. Validation & Handoff
Faktisch korrekt sage ich, dass die Motion‑/Delta‑Regeln, UI‑Komponenten und Tooltips in den Spezifikationsdokumenten bereits präzise beschrieben sind – diese werden hier 1:1 als Validierungsgrundlage verwendet. Testing Strategy (konkret):
Unit Tests: calcDerivedStats, computeMovers, map01to100
Component Tests: CharacterSheetPage ohne archetype_mix, ohne narrative_snippet
E2E: Quiz Complete → Query invalidation → /character zeigt Banner + animierte Updates
A11y: Keyboard walkthrough + Contrast check
Finished Condition:
Alle Tasks T0.1–T5.4 Done
Alle Tests grün
SC‑1…SC‑5 erfüllt (inkl. A11y‑Score Target)
Handoff‑Doku vorhanden
Handoff: Dieser Plan ist implementierungsbereit für einen CLI/IDE‑Agenten.
Coverage-Matrix FR→Tasks→Tests
Faktisch korrekt sage ich, dass jede FR/SC mindestens eine Task + mindestens einen Test bekommen muss – die Matrix schließt Lücken sichtbar.
ID	Typ	Kurzbeschreibung	Tasks	Tests	Notizen
FR-1	FR	/character rendert Sheet	T3.1–T3.7	TS-3, TS-4	Layout + Cards
FR-2	FR	Data contract & optional fields	T2.1, T2.3, T3.6	TS-2	Graceful degrade
FR-3	FR	Derived stats	T2.2, T3.5	TS-1	Formeln fix
FR-4	FR	Delta banner	T4.1, T5.3	TS-4	8–12s auto-dismiss
FR-5	FR	Delta animations + reduced motion	T4.2, T4.3	TS-4, TS-5	clamp‑Formel
FR-6	FR	Responsive	T1.1, T3.1	TS-3	Desktop/Mobile
FR-7	FR	Light‑Grimoire Brand Look	T0.1, T0.2, T1.2, T3.7	TS-6	Kontrast, Ornamente
FR-8	FR	Share/Copy link	T3.1, T5.3	TS-4	minimal v1
SC-1	SC	Layout ohne Bugs	T1.1, T3.1	TS-3	Screenshot baseline
SC-2	SC	Quiz→Update Flow	T2.3, T4.1, T5.3	TS-4	invalidate queries
SC-3	SC	A11y ≥ 90	T5.1	TS-6	WCAG AA
SC-4	SC	No crashes w/ optional fields	T2.1, T2.3, T3.6	TS-2	Robustness
SC-5	SC	Komponenten wiederverwendbar	T1.3, T3.*	TS-7	Design system

Testfälle (TS)
TS-1 (Unit): calcDerivedStats korrekt (Grenzwerte, Mittelwerte)
TS-2 (Component): Render ohne optionale Felder (archetype_mix, narrative_snippet, last_delta)
TS-3 (Responsive Visual): Desktop + Mobile Snapshot (manuell + optional automated)
TS-4 (E2E): Quiz complete → CTA → /character zeigt Banner + neue Werte
TS-5 (A11y Motion): prefers-reduced-motion → keine langen Animationen, nur <=250ms tween
TS-6 (A11y Audit): Kontrast/Fokus/Keyboard (Lighthouse/axe)
TS-7 (Design System): Tokens wirken global konsistent (Storybook optional)
Zeitplan (Day 0–7 Ship-Loop)
Logisch scheint mir, dass dieser Loop realistisch ist, weil wir „nur“ UI + State + Motion bauen (kein Avatar‑Renderer).
Day 0 – Ziel & DoD scharf stellen
T0.1, T0.2 starten
SC/KPIs final eintragen, Tokens & Typo stehen
Day 1 – Layout + Design Spec
T1.1, T1.2, T1.3 (Figma/Spec + Ornament pack)
Day 2 – Daten & Types
T2.1, T2.2, T2.3 (inkl. Snapshot/Diff)
Day 3 – UI Core Implementierung
T3.1–T3.5 (Page + CoreStats + Klima + Derived)
Day 4 – Story + Ornamente + Brand Polish
T3.6, T3.7 (Archetype + Ornament layer)
Day 5 – Motion / After‑Quiz Activation
T4.1–T4.3 (Banner + delta motion + highlight rules)
Day 6 – Tests & A11y
T5.1, T5.2 (E2E + a11y + fixes)
Day 7 – Ship
T5.3, T5.4 (Result CTA, Handoff‑Paket, letzte Politur)
Parallelisierbar: T1.2 (Ornamente) kann parallel zu T2.* laufen.
Risiken & Annahmen
Faktisch korrekt sage ich, dass einige Teile (Router‑Struktur, bestehende Result‑Page Implementierung) nicht im Dokument verankert sind – dafür formuliere ich klare Annahmen.
Annahme A1: Frontend ist Next.js/React + Tailwind + Framer Motion. (Wenn ihr z. B. Vite nutzt: gleiche Komponenten, nur andere Route‑Struktur.)
Annahme A2: GET /api/profile/psyche existiert oder ist schnell ergänzbar; optional last_delta.
Risiko R1 (Kontrast): Gold auf Beige kann Kontrast killen → Lösung: Gold nur für Linien/Icons; Text in #271C16/#053B3F, Buttons mit ausreichend dunklem Text.
Risiko R2 (Ornament Overload): Zu viele Watermarks stören Lesbarkeit → Lösung: harte Opacity‑Caps (4–8%), keine busy textures.
Risiko R3 (Delta‑Quelle fehlt): Ohne last_delta muss Snapshot‑Diff herhalten → Lösung: T2.3 fallback‑Diff + Tests TS‑2/TS‑4.
Risiko R4 (Scope creep): Share‑Assets/OG‑Images/History‑Timeline können ausufern → bewusst Non‑Scope v1.
Kurzer Meta‑Hinweis (Transparenz)
Faktisch korrekt sage ich, welche Teile hochsicher sind: Datenfelder, Layout‑Grid, Motion‑Regeln, Tooltip‑Copy und Brand‑Palette sind in euren Dokumenten klar beschrieben.
Logisch scheint mir, wo Annahmen stecken: konkrete Repo‑Pfadstruktur (App Router vs Pages Router) und genaue Quiz‑Result‑Implementierung.
Rein subjektiv, aus meinem Denken ergibt sich, dass die „Light‑Grimoire“‑Variante die beste Balance aus „hell“ + „mythisch“ + „premium“ liefert, ohne vom QuizzMe‑Brand abzubrechen. Wenn du als einzige Rückmeldung eine Entscheidung treffen willst:
Soll das Character Sheet komplett hell (Light‑Grimoire) sein – oder helles Pergament mit einem sehr dünnen, dunklen Emerald‑Frame am Rand (Hybrid‑Frame), um stärker zur sonst dunklen QuizzMe‑Welt zu matchen?