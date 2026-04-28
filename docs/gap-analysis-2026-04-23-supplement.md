# Gap Analysis Supplement — 2026-04-23

> **Kontext:** Ergänzung zur Gap Analysis vom 2026-04-23. Diese Analyse liest den aktuellen Codebase-Stand (CLAUDE.md, CON-quiz-signatur-axiome.md, GOAL-quiz-signatur-coupling-v1.md, REQ-F-quiz-contribution-system.md, alle US-Dateien) und korrigiert, präzisiert und erweitert die Haupt-Analyse — insbesondere mit dem Fokus Quiz-Anforderungen, die in der ursprünglichen Analyse unscharf geblieben sind.

---

## Korrekturen zur Haupt-Analyse

### K1 — US-quiz-i18n-integrity ist NICHT in der „11 US ohne REQ"-Liste (I1)

Die Haupt-Analyse zählt `US-quiz-i18n-integrity` unter die 11 User Stories ohne verlinkte Requirements. Das ist falsch.

`US-quiz-i18n-integrity` verlinkt explizit auf **zwei** Requirements:
- `REQ-F-i18n-completeness` (Approved)
- `REQ-F-quiz-contribution-system` (Implemented)

Korrekte Zahl für I1: **10 US ohne REQ** (nicht 11).

### K2 — Sprint-B-Startbarkeit ist dokumentiert, aber keine Tasks existieren

CLAUDE.md hält fest (2026-04-21): *„Sprint B (Quiz→Signatur Coupling v1) ist damit startbar."* Das impliziert Sprint A ist abgeschlossen. Die Haupt-Analyse behandelt GOAL-quiz-signatur-coupling-v1 korrekt als 0 US / 0 REQ — aber übersieht, dass das GOAL-Dokument selbst 9 Success Criteria trägt, die direkt in US-QSC-Dateien übersetzt werden sollen. Das ist keine abstrakte Lücke, sondern ein konkretes Pensum mit bekanntem Zielformat.

---

## Neue Findings

### NEU-C3 — Kritisch: Zwei Quiz-Datenmodelle koexistieren ohne explizite Abgrenzung

Das ist der schärfste Befund dieser Supplement-Analyse.

**Modell A — ContributionEvent (aktuell implementiert):**
- `REQ-F-quiz-contribution-system` Status: **Implemented**
- 22 Quizze / 6 Cluster → `ContributionEvent` → `eventToSectorSignals()` + `AFFINITY_MAP`
- Cluster-Gate: Contribution wird erst gespeichert wenn der gesamte Cluster abgeschlossen ist
- Speicherung in `contribution_events` Tabelle (JSONB sector weights, upserted per `user_id,module_id`)
- Signature weight cap: 0.5 (True North Prinzip)
- Axiom-unbekannt: dieses Modell trägt keine `elementContrib[5]`-Vektoren pro AnswerOption

**Modell B — user_quiz_profile / user_quiz_answers (Sprint-B-Ziel):**
- GOAL-quiz-signatur-coupling-v1 Status: **Approved**, Sprint B startbereit
- Neue Tabellen: `user_quiz_profile` (aggregiertes Profil) + `user_quiz_answers` (append-only Antwort-Historie)
- Jede AnswerOption trägt `elementContrib[5]` UND `sectorContrib[12]`
- Kein Cluster-Gate für Speicherung der Antwort-Rohdaten (Axiom 10: Agent-Goldmine)
- Kein weight cap dokumentiert — Axiom 6 sagt „Verstärker, nicht eigener Ton"

**Konfliktpunkte ohne dokumentierte Entscheidung:**

| Dimension | Modell A (live) | Modell B (Sprint B) | Entscheidung? |
|-----------|----------------|---------------------|---------------|
| Speichertabelle | `contribution_events` | `user_quiz_answers` + `user_quiz_profile` | Parallel? Migration? |
| Cluster-Gate | Pflicht (Axiom-konform unklar) | Keine Gate für Rohdaten | Widerspruch zu Axiom 1/10? |
| Signatur-Layer | Neural Myzel / `quiz_sectors` | FuenfElementeKranz + `sector_profile[12]` | Zwei Schichten oder Ersatz? |
| Weight cap | 0.5 (REQ-Implemented) | Nicht erwähnt | Gilt Cap weiter? |
| AnswerOption-Daten | Keine `elementContrib` | Zwingend pro AnswerOption | Erfordert Backfill oder neue Quizze |

**Risiko:** Wenn Sprint B mit Modell B startet ohne explizite Architekturentscheidung, entsteht ein dritter Ist-Zustand: `contribution_events` weiter aktiv für Ring-Transit-Pipeline, `user_quiz_answers` parallel befüllt, aber `FuenfElementeKranz` zeigt nichts weil die 22 bestehenden Quizze keine `elementContrib`-Werte tragen (Axiom 8-Konflikt).

**Empfohlene Aktion:** Vor Sprint-B-Kick-off ein DEC-Dokument: `DEC-quiz-data-model-migration.md`. Entscheidung: Modell B ersetzt Modell A schrittweise ODER läuft parallel (zwei Schichten). Das ist eine PO-Entscheidung (Auswirkung auf Supabase-Schema, API-Endpunkte, FuFirE-Integrationsvertrag).

---

### NEU-I3 — Important: 12 Axiome = mindestens 8 konkrete REQs, noch keine erstellt

`CON-quiz-signatur-axiome.md` dokumentiert selbst: *„Requirements: none yet — aus den Axiomen werden per Post-Sprint-Gap-Analysis REQs abgeleitet."*

Die Haupt-Analyse (I2) hält das allgemein fest. Hier folgt die konkrete Ableitung: Jedes Axiom mit testbarer Implikation erzeugt einen REQ:

| Axiom | REQ-ID (vorgeschlagen) | REQ-Klasse | Testbares AC |
|-------|------------------------|------------|--------------|
| 1 — Immutable/Append-Only | `REQ-F-quiz-append-only` | Functional | DB: kein UPDATE/DELETE auf `user_quiz_answers`; RLS-Policy erzwingt |
| 2 — Cluster-Set wächst | `REQ-DATA-quiz-schema-extensibility` | Data | Neues Quiz/Cluster ohne Schema-Migration addierbar |
| 3 — Rhythmus-Gating | `REQ-F-quiz-rate-limit` | Functional | Free: 1/Tag, Premium: 2/Tag, Server+UI-seitig erzwungen |
| 4 — Sofort-Effekt | `REQ-USA-quiz-instant-feedback` | Usability | Sichtbarer Ring-Effekt < 500ms nach Quiz-Abschluss |
| 5 — Maturation visuell | `REQ-F-quiz-maturation-visual` | Functional | Fibonacci-Stufen sichtbar als Farb-/Sättigungs-Tier, nie als Zahl |
| 8 — Element auf Antwort-Ebene | `REQ-F-quiz-answer-element-contrib` | Functional | Jede AnswerOption trägt `elementContrib[5]`; Quiz-Level-Element verboten |
| 9 — Zwei Dimensionen unabhängig | `REQ-F-quiz-dual-dimension` | Functional | Jede AnswerOption trägt `sectorContrib[12]` parallel zu `elementContrib[5]` |
| 10 — Antwort-Historie vollständig | `REQ-DATA-quiz-answer-history` | Data | Rohdaten verlustfrei in `user_quiz_answers`, abfragbar durch Agenten-API |
| 11 — Neutral-Start | `REQ-F-quiz-neutral-start` | Functional | Bei Account-Erstellung: alle Kranz-Segmente = 0, kein Natal-Vorfüllen |
| 12 — Paar-Signatur-Pfad offen | `REQ-F-quiz-schema-pair-ready` | Functional | Kein Schema-Breaking-Change durch Paar-Signatur-Sprint erforderlich |

Axiome 6 und 7 (Verstärker-Rolle, Zeitskalen-Trennung) sind Architektur-Leitprinzipien — keine einzelnen testbaren REQs, aber in `DEC-quiz-data-model-migration.md` (s. NEU-C3) zu verankern.

**Priorisierung für Sprint B:** Die vier Sprint-B-blockierenden REQs sind `REQ-F-quiz-append-only`, `REQ-F-quiz-rate-limit`, `REQ-USA-quiz-instant-feedback`, `REQ-F-quiz-answer-element-contrib`. Ohne diese gibt es keinen testbaren Acceptance-Abschluss für die 9 Sprint-B-Phasen.

---

### NEU-I4 — Important: 9 Success Criteria in GOAL = 9 fehlende US-QSC-* Dateien

`GOAL-quiz-signatur-coupling-v1` trägt 12 Success Criteria (SC). Die meisten sind phasenweise US in Disguise — das GOAL selbst schreibt vor: *„Pro Phase wird eine User-Story unter `docs/user-stories/2026-04-20/US-QSC-<n>-<slug>.md`...dokumentiert."*

Aktueller Stand: **0 von 9 erwarteten US-QSC-* Dateien** in `docs/user-stories/2026-04-20/`.

Konkrete US-Slots die fehlen (aus SC ableiten):

| SC | US-Slot | Axiom-Bezug |
|----|---------|-------------|
| SC1 — DB-Schema | `US-QSC-1-append-only-schema` | 1, 2, 10 |
| SC3 — Rhythmus-Gating | `US-QSC-2-quiz-rate-limit` | 3 |
| SC4 — Aggregationsfunktion | `US-QSC-3-aggregation-function` | 8, 9 |
| SC5 — AnswerOption-Vektoren | `US-QSC-4-answer-element-attribution` | 8, 9 |
| SC6 — Editorial-Backfill-Skelett | `US-QSC-5-editorial-template` | 8 |
| SC7 — FuenfElementeKranz | `US-QSC-6-wuxing-kranz-component` | 5, 11 |
| SC8 — Additiv platziert | `US-QSC-7-additive-placement` | 6 |
| SC9 — Sofort-Effekt | `US-QSC-8-instant-feedback-animation` | 4 |
| SC10 — Maturation-Layer | `US-QSC-9-maturation-visual-tier` | 5 |

SC2 (Datenmodell skalierbar) und SC11/SC12 (Dokumentation) sind Infrastruktur/Docs, keine eigenen US nötig.

---

### NEU-I5 — Important: 5 DSG User Stories existieren — aber nur in docs/, nicht im Scaffold

Aus dem Sprint S-DASH-SIGNATUR-GAPS existieren diese User Stories:
- `docs/user-stories/2026-04-20/US-DSG-1-dynamic-coherence-subtitle.md` ✓
- `docs/user-stories/2026-04-20/US-DSG-2-remove-tagesfeld-pill.md` ✓
- `docs/user-stories/2026-04-20/US-DSG-3-coherence-tooltip.md` ✓
- `docs/user-stories/2026-04-20/US-DSG-4-shared-active-impacts-list.md` ✓
- `docs/user-stories/2026-04-20/US-DSG-5-tagesimpuls-centered-horoscope.md` ✓

Sie existieren **nicht** in `1-objectives/user-stories/`. Die Promovierung fehlt.

Diese 5 Dateien sind hochwertig (US-DSG-1 geprüft: vollständiges Gherkin + Verifikations-Sektion + Confidence-Rating). Sie sind direkt promotionsfertig — kein Rewrite nötig, nur Move + index update.

Die Haupt-Analyse (C1) nennt das korrekt als offenes Pensum. Diese Ergänzung präzisiert: es sind genau 5 Dateien, bereits fertig geschrieben.

---

### NEU-M5 — Minor: Mobile Quiz-Datenmodell divergiert still vom Web-Sprint-B-Plan

`REQ-F-quiz-scoring` in `Bazodiac-Mobile/Astro-IOs/1-spec/requirements/` ist Status: **Approved**, Should-have.

Dieses REQ definiert:
- Dimensionen-Scoring normiert 0–100
- `QuizEngine.matchProfile()` → bestes Profil-Match
- Abschluss-IDs in UserDefaults persisted

Das ist ein **kategorial anderes** Scoring-Modell als das Web-Sprint-B-Design (elementContrib[5] + sectorContrib[12] additiv aggregiert, Werte 0–1, kein Profil-Matching).

`packages/shared/` ist das gemeinsame Quiz-Substrate für Web und Mobile. Wenn Sprint B `QuizDefinition` um `elementContrib`/`sectorContrib` erweitert, muss `REQ-F-quiz-scoring` (Mobile) entweder aktualisiert oder explizit als „Mobile-Specific Scoring Layer" von der neuen Aggregationslogik abgegrenzt werden.

---

## Aktualisierte Severity-Tabelle

| ID | Severity | Befund | Status in Haupt-Analyse |
|----|----------|--------|------------------------|
| C1 | Critical | 5 Goals ohne US — davon GOAL-quiz-signatur-coupling-v1 mit 9 konkreten fehlenden US-Slots | Bestätigt, präzisiert durch NEU-I4 |
| C2 | Critical | ASM-noaa-in-fufre Invalidierungs-Audit ausstehend | Unverändert |
| NEU-C3 | **Critical** | Zwei Quiz-Datenmodelle ohne Abgrenzungs-Entscheidung — blockiert Sprint-B-Start strukturell | **Neu** |
| I1 | Important | 10 US ohne REQ (korrigiert von 11) | Korrektur K1 |
| I2 | Important | CON-quiz-signatur-axiome: 0 REQs — 8 konkret ableitbar | Präzisiert durch NEU-I3 |
| I3 | Important | Kein Monetization-GOAL | Unverändert |
| I4 | Important | 27/27 US in Draft | Unverändert |
| NEU-I4 | **Important** | 9 US-QSC-Slots im GOAL definiert, alle fehlend | **Neu** |
| NEU-I5 | **Important** | 5 DSG User Stories promotionsbereit aber nicht im Scaffold | **Neu** (präzisiert C1) |
| M1–M4 | Minor | Wie Haupt-Analyse | Unverändert |
| NEU-M5 | Minor | Mobile Quiz-Scoring divergiert vom Web-Sprint-B-Modell | **Neu** |

**Revidierte Gesamtzahl: 3 Critical / 6 Important / 5 Minor**

---

## Priorisierte Aktionsliste für Sprint-B-Vorbereitung

Sprint B ist laut CLAUDE.md startbereit. Tatsächlich blockieren **NEU-C3** und das Fehlen der 4 Sprint-B-REQs einen sauberen Sprint-Start. Reihenfolge:

1. **[Ben-Entscheidung, 20 min]** `DEC-quiz-data-model-migration.md` — Modell A weiterführen oder Modell B als Ersatz/Ergänzung. Das ist ein PO-Haltepunkt, keine Claude-Entscheidung.

2. **[Nach Entscheidung, ~30 min]** 4 Sprint-B-REQs erstellen: `REQ-F-quiz-append-only`, `REQ-F-quiz-rate-limit`, `REQ-USA-quiz-instant-feedback`, `REQ-F-quiz-answer-element-contrib`.

3. **[~30 min]** 5 DSG User Stories aus `docs/user-stories/2026-04-20/` nach `1-objectives/user-stories/` promovieren + Index updaten.

4. **[~45 min]** 9 US-QSC-Slots aus GOAL-SC ableiten und als Draft-Dateien anlegen (können inline während Sprint entstehen, aber Slots helfen beim Sprint-Tracking).

5. **[~20 min]** `GOAL-dashboard-signatur-hygiene` und `GOAL-soulprint-persistence` je 1–2 retroaktive US aus Sprint-Reports (C1-Rest).

Gesamt für Spec → Design Gate: ~2,5h fokussierte Arbeit, davon 20 min Ben (Architektur-Entscheidung) und ~2h Dokumentation.

---

*Erstellt: 2026-04-23 | Quelle: direkter Codebase-Scan von CLAUDE.md, CON-quiz-signatur-axiome.md, GOAL-quiz-signatur-coupling-v1.md, REQ-F-quiz-contribution-system.md, REQ-F-quiz-scoring.md (Mobile), alle 27 US-Dateien in 1-objectives/user-stories/, docs/user-stories/2026-04-20/*
