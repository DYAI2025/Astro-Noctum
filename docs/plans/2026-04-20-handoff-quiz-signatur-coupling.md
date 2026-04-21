# Arbeitsauftrag für Claude Code — Sprint: Quiz → Signatur Coupling (Sprint 1)

> **Auftraggeber:** Ben (Product Owner / Projektmanager Bazodiac)
> **Erstellt von:** Cowork-Planner-Session (Opus 4.7), 2026-04-20
> **Plan-Referenz (Source of Truth):** `docs/plans/2026-04-20-quiz-signatur-coupling.md`
> **Axiome-Referenz (PRODUKT-GESETZ, nicht verhandelbar):** Auto-Memory `project_quiz_signatur_grundsaetze.md`, inhaltlich unten in Abschnitt 2 eingefügt
> **Sprint-Typ:** Neue Produkt-Substanz — Datenmodell + Kranz-Layer + Sofort-Effekt
> **Priorität:** NACH Dashboard-Gaps-Sprint
> **Abhängigkeit:** Dashboard-Gaps-Sprint muss grün sein (keine überlagernden Signatur-Edits)

---

## 1. Dein Auftrag, Claude Code

Lies den Plan unter `docs/plans/2026-04-20-quiz-signatur-coupling.md` als verbindliche Spezifikation. Dieser Sprint ist **Sprint 1 von mehreren** — er legt Datenmodell, Wu-Xing-Kranz und Sofort-Effekt. Chladni-Modulation, Transformation-Animation, Paar-Signatur und Agenten-Integration sind **spätere Sprints** (Roadmap in Part C des Plans) — fange hier nichts davon an.

Führe die 9 Phasen (Phase 0 Baseline bis Phase 9 Regression) **in exakter Reihenfolge** durch. Mikro-Phasen-Pattern, maximal 5 Dateien pro Phase, HALT-Punkte mit visuellem Review durch Ben.

Zwischen jeder Phase: Status-Report an Ben, warten auf "go" oder "reib".

---

## 2. Produkt-Axiome (VERBINDLICH — kein Entwurf)

Diese 12 Axiome sind Produkt-Gesetz. Jeder Code-Entscheid muss sie respektieren. Bei Konflikt zwischen Plan und Axiomen → Axiome gewinnen, Plan muss gepatcht werden.

1. **Quiz ist einmalig und immutable.** Keine Re-Takes, kein Overwrite. Append-only.
2. **Cluster-Set wächst** — Datenmodell muss mit beliebig vielen neuen Quizzen funktionieren.
3. **Rhythmus:** Free 1 Quiz/Tag, Premium 2/Tag.
4. **Jedes Quiz hat sofort sichtbaren Signatur-Effekt** — keine Batch-Updates.
5. **Maturation-Layer:** kumulative Quiz-Anzahl ist visuell ablesbar (Farbe / Gold-Glanz), nicht als Zahl.
6. **Quiz ist Verstärker, kein eigener Ton** — keine neue Frequenz, macht Vorhandenes lesbarer.
7. **Zeitskalen-Trennung:** Natal (dauerhaft) · Quiz (permanent strukturell, nur durch NEUE Quizze additiv verfeinerbar) · Transit (Tages-Modulation) · Membrane (Stunden, rein transient). Quiz und Membrane sind **nicht in derselben Schicht**.
8. **Element-Zuordnung auf ANTWORT-Ebene, nicht Quiz-Ebene.** Kein Quiz hat ein fixes Element. Jede Antwort-Option trägt `elementContrib[5]` (Wu-Xing: Holz/Feuer/Erde/Metall/Wasser).
9. **Kranz (5 Elemente) und Sektor-Frequenz (12 Sektoren) sind zwei unabhängige Dimensionen.** Jede Antwort liefert `elementContrib[5]` UND `sectorContrib[12]`, beide additiv aggregiert.
10. **Profil-Daten sind Agenten-Asset.** Antwort-Historie verlustfrei aufbewahren. Datenmodell so bauen, dass spätere Beratungs-Agenten die Rohdaten abfragen können.
11. **Kranz startet für alle User neutral.** Alle 5 Element-Segmente = 0 bei Account-Creation. Kein Natal-Vorfüllen, kein Auffüll-Mechanismus. Dass manche Segmente leer bleiben, ist Diagnose, nicht Bug.
12. **Paar-Signatur als Langfrist-Vektor.** Datenmodell JETZT nicht so bauen, dass Paar-Signatur später strukturell blockiert wird. Implementierung der Paar-Signatur ist **eigener späterer Sprint**.

---

## 3. SDS-Pflege (VERBINDLICH bei jeder Phase)

1. **`docs/docu/DATABASE_SCHEMA.md`** — sobald die Supabase-Migration (Phase 2) läuft:
   - Tabellen `user_quiz_profile` und `user_quiz_answers` dokumentieren
   - RLS-Policies dokumentieren (insbesondere append-only-Eigenschaft für `user_quiz_answers`)
   - Index-Strategie und Growth-Pfad notieren
2. **`docs/docu/STRUCTURE.md`** — neue Komponenten (FuenfElementeKranz, Hooks, Services) einsortieren
3. **`docs/docu/FRONTEND_INTERNALS.md`** — Datenfluss Quiz-Completion → Aggregation → UI-Update
4. **`docs/KOHAERENZ_INDEX.md`** — **nur lesen**, es sei denn die Formel `quiz_effective` muss semantisch präzisiert werden (dann kleines Edit mit Ben-Review)
5. **Neue SDS-Datei** `docs/docu/QUIZ_SIGNATURE_COUPLING.md` — erstelle diese in Phase 1. Inhalt:
   - Die 12 Axiome (referenziert, nicht dupliziert)
   - Datenmodell-Diagramm (QuizAnswerOption → Aggregation → Wreath/Sectors)
   - Fibonacci-Stage-Tabelle
   - Element-Farbpalette (mit Ben-approved Werten)
   - Link zum Sprint-1-Plan und zur Roadmap

Regel: Doku wird parallel zum Code aktualisiert, nicht am Ende. Commit-Message hat die Form `feat(quiz-sig): phase N <name> + docs`.

---

## 4. User-Stories ableiten (VERBINDLICH pro Phase)

Nach Abschluss jeder Phase, vor dem Commit:

1. Lege eine User-Story-Datei an unter `docs/user-stories/2026-04-20/US-QSC-<phase-nr>-<slug>.md`
2. Format:

```markdown
# US-QSC-<n>: <Titel>

**Als** <Rolle — User / Premium-User / Agent / Admin>
**möchte ich** <Funktion>
**damit** <Nutzen>

## Axiom-Bezug
- Welche der 12 Produkt-Axiome deckt diese Story ab?
- Welche Axiome darf sie unter KEINEN Umständen verletzen?

## Akzeptanzkriterien (Gherkin)
- Gegeben ein User ohne abgeschlossenes Quiz
- Wenn er das Naturkind-Quiz abschliesst
- Dann ...
  - wird sein `user_quiz_profile.element_profile` additiv um die antwort-abhängigen Elemente erhöht
  - sieht er innerhalb von <500ms eine sichtbare Signatur-Veränderung
  - kann er das Quiz NICHT wiederholen (UI-Pfad blockiert + DB-Constraint greift)

## Verifikation
- unit-test: [Pfad]
- integration-test: [Pfad]
- manueller Test: [Schritte]
- RLS-Test: [anon/authed Szenarien abgedeckt]

## Referenzen
- Plan-Phase: docs/plans/2026-04-20-quiz-signatur-coupling.md#phase-<n>
- Axiome: 1, 4, 8, 10 (Beispiel)
- Geänderte Dateien: [Liste]
```

3. Diese Stories sind später die Basis für Regression, Dashboard-Kriterien und das Agenten-Onboarding.

---

## 5. Guardrails (codemoss-agent-guardrails, verbindlich)

- Vor jedem Edit **re-lesen**. Nach jedem Edit **re-lesen und verifizieren**.
- Maximal 3 Edits pro Datei ohne Re-Read-Verifikation.
- Dateien > 300 LOC: **Schritt 0 Cleanup** zuerst.
- **TDD-Disziplin:** Phase 3 (Pure Aggregation) und Phase 6 (Kranz-Component) erst Test schreiben, failen sehen, dann implementieren.
- Verifikation vor Success-Meldung: typecheck, lint, unit-tests, RLS-Tests wo relevant, visuelle Review bei UI-Phasen.
- Bei Supabase-Migration (Phase 2): **niemals** `DROP COLUMN` oder destruktive Ops ohne Ben-OK. Migration muss idempotent sein (IF NOT EXISTS).
- RLS-Policies mit `anon` und `authed` Szenario testen, bevor Merge.

---

## 6. Feature-Awareness (was du im Blick halten musst)

- **Dashboard-Gaps-Sprint** muss zuerst grün sein. Wenn du startest und die Dashboard-Baustelle noch offen ist, halte an und frag Ben.
- **Signatur-Seite** — die existierenden "Aktive Einflüsse" / Planeten-Frequenz-Komponenten **dürfen nicht kaputt gehen**. Der Kranz wird **additiv** platziert, nicht als Ersatz.
- **Quiz-Routing / Quiz-Flow** — Phase 8 (Post-Quiz-Sofort-Effekt) greift in den existierenden Abschluss-Flow ein. Lies den Flow vorher vollständig (`features/plan/QuizzMe-main` und die Dashboard-Integration), bevor du injizierst.
- **Auth / RLS** — User-ID kommt aus Supabase Auth. Unauthed User können keine Aggregation auslösen. Wenn ein Quiz anonym starten kann, lies vorher, wie der existierende Flow das handhabt, und halte die neue Persistenz-Logik kompatibel.
- **i18n** — Kranz-Labels, Toast-Texte, Tooltip-Texte müssen i18n-fähig sein. Nutze den existierenden i18n-Pfad (`docs/i18n-content.md`), erfinde keinen neuen.
- **Existierendes `2026-03-08-quiz-cluster-energy-system.md`** — lies das vorher, damit du nicht versehentlich Logik duplizierst, die bereits im Energie-System lebt.

---

## 7. Harte Pflöcke (Reibungspunkte, die Ben NICHT ohne Rückfrage übergehen darf)

Stoppe und frage Ben, bevor du committest, wenn:

- **Element-Farbpalette** nicht final approved. Startwerte im Plan (Holz `#10B981`, Feuer `#EF4444`, Erde `#CA8A04`, Metall `#CBD5E1`, Wasser `#3B82F6`) sind Vorschläge. Vor Phase 6 Commit: Ben-OK holen.
- **Fibonacci-Schwellwerte** — Plan schlägt `0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233` vor. Wenn du während der Implementierung merkst, dass die Auflösung zu grob oder zu fein ist (z.B. User-Profile-Variance im Editorial-Backfill), sag Bescheid, bevor du am Default schraubst.
- **Editorial-Backfill (Phase 5)** — die 6 existierenden Cluster brauchen `elementContrib` + `sectorContrib` pro Antwort-Option. Das ist Content-Arbeit, nicht Code-Arbeit. Liefere eine **leere, strukturell korrekte Vorlage** (JSON-Skeleton pro Cluster) und lass Ben / Editorial die Werte befüllen. Baue KEINE Platzhalter-Werte ein, die "plausibel" aussehen — das verzerrt später die Aggregation.
- **Sofort-Effekt-Animation (Phase 8)** — Dauer, Intensität, Pulse-Farbe sind visuelle Entscheidungen. Ben will das sehen, bevor es Commit wird. HALT mit Screenshot/Screencap.

---

## 8. Was du in Sprint 1 NICHT tust

Dieser Sprint baut NICHT:
- Chladni-Mode-Modulation auf Basis der Sektor-Profile (Sprint 2)
- Transformation-Animation beim Erreichen einer Fibonacci-Stufe (Sprint 3)
- Gold-Leucht-Effekt für "alle Elemente voll" (Sprint 3)
- Ton-Mode / Audio-Layer (Sprint 4)
- Paar-Signatur / Verschränkung zweier User (eigener Sprint, noch unnummeriert)
- Agenten-API zur Profil-Abfrage (eigener späterer Sprint)

Wenn du Lust hast, das vorzuziehen: **nein**. Sprint 1 first.

---

## 9. Phase-Abschluss-Output-Format

```markdown
### Phase <n>: <Titel> — [DONE / HALT]

**Geändert / Erstellt:**
- file1.ts
- file2.tsx
- supabase/migrations/202604201200_quiz_signature.sql

**Axiom-Check:**
- respektiert: [1, 4, 8, ...]
- potentielle Spannung: [z.B. "Axiom 11 neutral start — bewusst keine Natal-Vorfüllung; falls Ben das anders will, Phase revidieren"]

**SDS-Updates:**
- DATABASE_SCHEMA.md: [was]
- QUIZ_SIGNATURE_COUPLING.md: [was]
- STRUCTURE.md: [was]

**User-Story:**
- docs/user-stories/2026-04-20/US-QSC-<n>-<slug>.md

**Verifikation:**
- typecheck: passed
- lint: passed
- unit-tests: X/X passed
- RLS-test: append-only verified / bypass attempt failed
- visuell: <Screenshot oder "pending-Ben-Review">

**Remaining risks:**
- [spezifisch]

**Confidence:** high / medium / low

**Nächste Phase:** bereit / HALT mit Frage: <Frage>
```

---

## 10. Kick-Off

Starte mit **Phase 0 (Baseline & Research)** aus `docs/plans/2026-04-20-quiz-signatur-coupling.md`. Lies **alle drei Quellen**:
- den Plan selbst (Part A, B, C)
- die 12 Axiome (Abschnitt 2 dieses Dokuments)
- bestehende Quiz-/Signatur-Codepfade

Phase 0 liefert: Baseline-Report (was existiert bereits, was fehlt, Risiko-Map). Kein Code-Change in Phase 0. Danach HALT für Ben-Review.

Reibung ist erlaubt. Reifung ist das Ziel. Reparatur, wenn was kippt — ehrlich melden, nicht kaschieren.
