# CON-quiz-signatur-axiome: Produkt-Axiome für Quiz → Signatur Coupling

**Category**: Business (Produkt-Gesetz, nicht verhandelbar)

**Status**: Active

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Zwölf Axiome, die jede Implementierung des Quiz → Signatur Couplings respektieren muss. Diese Axiome sind **Produkt-Gesetz** — bei Konflikt zwischen einem Plan-Detail und einem Axiom gewinnt immer das Axiom, und der Plan wird gepatcht. Keine silent violations, keine Schleichwege. Claude-Code-Sessions, die am Quiz-Signatur-Coupling arbeiten, müssen pro Phase explizit dokumentieren welche Axiome berührt werden und welche unter keinen Umständen verletzt werden dürfen.

## Die 12 Axiome

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

## Rationale

Quiz → Signatur Coupling ist ein Produkt-Kern-Feature und wird in mehreren Sprints ausgerollt. Ohne festgelegte Axiome entstehen subtile Drift-Probleme: Re-Takes werden "aus Gefälligkeit" erlaubt, Natal-Vorfüllung wirkt "benutzerfreundlich" (widerspricht aber der "Diagnose statt Hilfestellung"-Haltung), ein Quiz bekommt ein fixes Element (widerspricht Axiom 8 und macht zukünftige Quizzes rigide), usw. Die Axiome sind nach Diskussion mit dem PO fixiert und werden nicht in technischen Diskussionen aufgeweicht.

## Impact

**Auf Design:**
- Datenmodell muss append-only sein (Axiom 1, 10)
- AnswerOptions tragen zwei Dimensionen gleichzeitig (Axiom 8, 9)
- UI-Feedback-Layer ist sofort, nicht batched (Axiom 4)
- Kranz-Komponente ist additiv zur bestehenden Signatur, nicht ersetzend (Axiom 6)

**Auf Implementation:**
- DB-seitige Constraints (UNIQUE per (user_id, quiz_id) oder äquivalent; keine UPDATE-Permission für `user_quiz_answers`-Rows)
- Editorial-Content muss `elementContrib[5]` + `sectorContrib[12]` pro AnswerOption tragen — fehlende Werte sind Sprint-Blocker, keine Defaults.
- Keine Backfill-Mechanismen, die leere Kranz-Segmente auffüllen würden (Axiom 11)

**Auf Zukunfts-Sprints:**
- Paar-Signatur-Sprint muss strukturell **hinzufügbar** sein ohne Schema-Breaking-Change (Axiom 12)
- Chladni-Modulation darf `sector_profile[12]` lesen, aber nicht umschreiben (Axiom 1)
- Agenten-API liest `user_quiz_answers` direkt, kein Aggregations-Mittelschicht als einzige Zugriffs-Option (Axiom 10)

## Related Artifacts

- **Goal**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)
- **Sprint-Plan**: `docs/plans/2026-04-20-quiz-signatur-coupling.md`
- **Handoff**: `docs/plans/2026-04-20-handoff-quiz-signatur-coupling.md` (§2 "Produkt-Axiome")
- Requirements: _none yet_ — aus den Axiomen werden per Post-Sprint-Gap-Analysis REQs abgeleitet (v.a. REQ-F Append-Only, REQ-USA Sofort-Effekt-Latenz, REQ-DATA Schema-Growth-Pfad)
