# US-retro-soulprint-upsert-fix: Soulprint-Persistenz-Race-Condition beseitigt

**Status**: Implemented

**Source**: [GOAL-soulprint-persistence](../goals/GOAL-soulprint-persistence.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als neuer Bazodiac-Nutzer möchte ich nach dem Onboarding meine persönliche Signatur sehen (nicht die Default-Signatur), damit die Plattform beim ersten Eindruck meine echten Geburtsdaten widerspiegelt und ich nicht denke, das Produkt funktioniere nicht.

## Acceptance Criteria

- [x] Nach erfolgreichem Bootstrap schreibt `persistSoulprintSectors()` `astro_profiles.soulprint_sectors` als 12-Element-Array via `.upsert()` (nicht `.update()`)
- [x] Row-Erstellung via Upsert funktioniert auch wenn die `astro_profiles`-Zeile noch nicht existiert (Race Condition eliminiert)
- [x] Andere Spalten in `astro_profiles` bleiben beim Upsert auf existing rows unberührt
- [x] Backfill-Script repariert legacy NULL rows: 50 applied / 8 skipped (deliberate: all-zero = Fallback aktiv) / 0 failed
- [x] Resilience-Policy Pattern A (3-Chance Bootstrap Fallback) ist deployed und prod-verifiziert (User `c0b8e2fa` Trace 2026-04-19T19:55Z)
- [x] 16 neue Tests (6 persistSoulprintSectors + 10 signatureReveal-i18n) — 1969/1969 grün

## Root Cause

`.update().eq('user_id')` scheiterte für 100% der neuen User weil die `astro_profiles`-Zeile erst nachgelagert durch den Superglue-Worker erstellt wurde. Frontend lud NULL → Default-Signatur für alle Nutzer.

## Related Artifacts

- Sprint: S-SOULPRINT-HOTFIX — `docs/sprint-S-SOULPRINT-HOTFIX-report.md`
- Requirements: [REQ-REL-soulprint-persist-onboarding](../requirements/REQ-REL-soulprint-persist-onboarding.md)
- PRs: #281, #283–288
