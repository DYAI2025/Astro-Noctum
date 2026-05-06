# US-qsc-5-editorial-template: Redaktionelles Backfill-Skelett für 6 Cluster

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

Als Editorial-Team-Mitglied möchte ich für jeden der 6 Quiz-Cluster eine JSON-Vorlage erhalten, die mir zeigt welche `elementContrib`-Werte ich pro Antwort-Option einzutragen habe, damit ich die redaktionelle Arbeit ohne Entwickler-Dependency ausführen kann.

## Acceptance Criteria

- [ ] 6 JSON-Vorlagendateien existieren (eine pro Cluster: naturkind, mentalist, stratege, mystiker, kinky, partner_match)
- [ ] Jede Vorlage enthält alle Quiz-IDs des Clusters und alle Antwort-Optionen mit leeren `elementContrib: {}` und `sectorContrib: {}` Slots
- [ ] Vorlagen sind strukturell valide (kein TypeScript-Fehler wenn importiert)
- [ ] Vorlagen enthalten keine Platzhalter-Werte (0.5/0.5/0.5 etc.) — leere Objekte sind korrekt
- [ ] README oder Kommentar in jeder Vorlage erklärt das Werte-Schema (0..1, Summe muss nicht 1 sein)

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 8
- Sprint-Phase: Sprint B Phase 5 (Editorial-Content, kein Code-Sprint) — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
- Note: Das Befüllen der Werte ist Editorial-Arbeit, kein Sprint-B-Blocker. Die Vorlage ist der Code-Deliverable.
