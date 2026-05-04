# DEC-quiz-data-model-migration: Trail

> Companion to `DEC-quiz-data-model-migration.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Modell B ersetzt Modell A (Clean-Migration)
- Pros: Eine einzige Source of Truth. Axiom-1/10 vollständig erfüllt. Keine Dual-Write-Komplexität.
- Cons: 22 Quizze brauchen `elementContrib`-Backfill als Vorbedingung (Editorial-Arbeit, Sprint-Blocker). `contribution_events` muss deprecated und migriert werden. FuFirE-Integration und Ring-Transit-Pipeline müssen umgebaut werden. Regressions-Risiko für Sprint-A-Output. Schätzung: ~5–7 Tage.

### Option B: Modell B parallel zu Modell A (Two-Layer, ohne Entscheidung)
- Pros: Kleinster initialer Aufwand.
- Cons: Cluster-Gate-Semantik wird dupliziert statt aufgelöst — zwei widersprüchliche Antworten auf „wann wird persistiert?" Axiom-1/10 verletzt weil `contribution_events` weiter upsertable bleibt und die Rohhistorie nicht in `user_quiz_answers` landet solange der Cluster-Gate gilt. Sync-Drift zwischen beiden Tabellen ohne Transaktions-Garantie. **Verworfen.**

### Option C: Hybrid-Erweiterung (gewählt)
- Pros: Kleinste Migration. Kein Editorial-Blocker. Ring-Pipeline unverändert (kein Regressions-Risiko). Axiom-10 (vollständige Antwort-Rohhistorie) erfüllt. Axiom-1 (append-only) für `user_quiz_answers` erfüllt. `contribution_events` bleibt für aggregierten Ring-Signal-Input.
- Cons: Dual-Write-Komplexität bei Quiz-Completion. `user_quiz_profile`-Konsistenz muss aktiv gehalten werden. Kranz zeigt Null für alle Quiz-Completions vor dem elementContrib-Backfill (bewusst akzeptierter Zustand).

## Reasoning

Option C balanciert Axiom-Compliance (1, 10) mit Regressionsrisiko und Editorial-Aufwand. Die Ring-Transit-Pipeline ist das kritischste System im Prod-Betrieb (Fallback via `X-Transit-Fallback` Header, 800ms-Polling). Sie anzufassen wäre ein unverhältnismäßiges Risiko für Sprint B.

Der bewusst akzeptierte Nachteil (Kranz zeigt Null für Altdaten) ist eine ehrliche Diagnose-Aussage: Nutzer, die vor elementContrib-Backfill Quizze abgeschlossen haben, haben kein Element-Profil weil ihre Antworten keine Element-Vektoren tragen. Das ist konsistent mit dem Axiom-11-Prinzip (Diagnose statt Hilfestellung).

Bedingungen die dieses Reasoning invalidieren würden:
- elementContrib-Backfill wird vor Sprint-B-Phase-5 durch Editorial-Team geliefert → dann könnte Option A nachgezogen werden ohne Sprint-Blocker
- FuFirE-Integration wird in einem separaten Sprint ohnehin umgebaut → dann lohnt sich der Ring-Pipeline-Umbau gebündelt

## Human involvement

**Type**: `ai-proposed/human-approved`

**Notes**: Option C durch Ben (PO/Founder) in Gap-Analysis-Session 2026-04-23 gewählt. Drei Optionen wurden explizit präsentiert und evaluiert. Ben wählte Option C nach Axiom-Abgleich.

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-04-23 | Initial decision — Option C Hybrid-Erweiterung | `ai-proposed/human-approved` |
