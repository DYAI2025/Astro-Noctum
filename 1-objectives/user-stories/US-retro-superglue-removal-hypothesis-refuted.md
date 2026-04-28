# US-retro-superglue-removal-hypothesis-refuted: Superglue-Middleware als Default-Fallback-Ursache ausgeschlossen (retroactive)

**Status**: Draft

**Source**: [GOAL-superglue-removal](../goals/GOAL-superglue-removal.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

Als Lead-Developer möchte ich sicher wissen, ob die Superglue-Middleware Ursache der intermittierenden Default-Fallback-Signaturen auf Prod ist, damit ich entscheiden kann, ob Stage 1 (`docs/superglue-removal-stage-1-onboarding.md`) eingebaut wird oder als strukturelles Tech-Debt-Pakedukt parkt.

## Akzeptanzkriterien

- **Given** Produktionsdaten in Supabase `astro_profiles` für 50 live User zum Zeitpunkt 2026-04-18,
  **when** die Hypothesen-Query aus Plan §2 ausgeführt wird (Stichprobe `astro_json`-Vollständigkeit),
  **then** zeigt das Ergebnis, ob `astro_json` systematisch unvollständig ist (Superglue-Ursache) oder vollständig (Superglue kein Ursachenkandidat).
- **Given** das Ergebnis ist "alle 50 User zeigen state OK, astro_json komplett",
  **when** die Plan-§2-HALT-Regel greift,
  **then** wird Superglue explizit als Ursache für das Default-Signatur-Symptom verworfen und die Hauptursache separat weiteranalysiert.
- **Given** die Verwerfung der Superglue-Hypothese,
  **when** ein Follow-up-Query auf `soulprint_sectors` läuft,
  **then** zeigt er die tatsächliche Ursache (50/50 User mit NULL → Bootstrap-Race-Condition, nicht Superglue) und führt zum neuen Sprint S-SOULPRINT-HOTFIX.
- **Given** die Hypothesen-Verwerfung ist dokumentiert,
  **when** Sprint S-SUPERGLUE-STAGE1 weiterläuft oder geparkt wird,
  **then** ist der Scope "reframed" — strukturelle Dependency-Reduktion, nicht Symptom-Fix — und das Goal-Dokument enthält einen "Hypothese REFUTED"-Abschnitt als Source-of-Truth für die Entscheidung.

## Referenzen

- Plan: `docs/superglue-removal-stage-1-onboarding.md` §2 (Supabase-Hypothese + HALT-Regel)
- CLAUDE.md Current State (2026-04-18): "Hypothese REFUTED + Sprint reframed"
- Follow-up Sprint: [GOAL-soulprint-persistence](../goals/GOAL-soulprint-persistence.md) (identifiziert die echte Root-Cause)
- Goal: [GOAL-superglue-removal](../goals/GOAL-superglue-removal.md)

## Notes

Diese User-Story wurde retroaktiv am 2026-04-23 während der Gap-Analyse angelegt, um GOAL-superglue-removal aus der Orphan-Liste zu nehmen. Die beschriebene Arbeit wurde bereits am 2026-04-18 ausgeführt (Supabase-Hypothese gelaufen, Ergebnis in CLAUDE.md dokumentiert). Kein Code-Sprint auf Basis dieser US — sie rekonstruiert den Entscheidungspfad für Traceability.
