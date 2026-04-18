# GOAL-soulprint-persistence: Onboarding-Soulprint zuverlässig persistieren

**Description**: Der Master-Signal-Block im `/api/experience/bootstrap`-Endpoint berechnet `soulprint_sectors` (12-Element-Array) aus natal dimensions und `projectToRing`, scheitert aber aktuell beim Schreiben nach Supabase für 100% der User. Root Cause: `.update().eq('user_id')` ohne vorheriges `.insert()`/`.upsert()` — die `astro_profiles`-Zeile existiert zum Zeitpunkt des Saves noch nicht (wird erst später durch den Superglue-Worker asynchron mit `astro_json` angelegt). Symptom: Frontend lädt `soulprint_sectors = NULL`, fällt auf neutralen Default zurück, **alle User sehen dieselbe Signatur**. Fix: `.upsert()` im Bootstrap + einmaliges Backfill-Script für die 50 bestehenden User. Entdeckt 2026-04-18 während TASK-supg1-supabase-hypothesis (Plan §2 Verifikation von S-SUPERGLUE-STAGE1).

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Success Criteria

- [ ] Nach jedem erfolgreichen Abschluss von `/api/experience/bootstrap` ist `astro_profiles.soulprint_sectors` für den onboardenden User ein 12-Element jsonb Array (nicht NULL).
- [ ] Supabase-Query `SELECT COUNT(*) FROM astro_profiles WHERE soulprint_sectors IS NULL` ergibt 0 nach Deploy + Backfill.
- [ ] Frontend-Verifikation: 2 frisch angelegte Test-User mit unterschiedlichen Geburtsdaten sehen sichtbar unterschiedliche, nicht-defaulte Signaturen (2D Cymatics + 3D Sphere).
- [ ] Root-Cause + Fix als Inline-Kommentar im Bootstrap-Code dokumentiert, damit das Muster nicht in Stage 2+ des Superglue-Removal-Refactors wiederholt wird.

## Related Artifacts

- Historisches Incident-Finding (2026-04-18): BaZidiac prod DB zeigte 50/50 astro_profiles mit `soulprint_sectors = NULL` bei gleichzeitig vollständigem `astro_json`. Root Cause via `server.mjs` L2110-2129 + Supabase-Schema-Inspection identifiziert.
- Related Goals: [GOAL-signatur-realtime-consistency](GOAL-signatur-realtime-consistency.md) — dieser Bug verletzt die SC "Signatur zeigt user-spezifische Werte".
- Related Goals: [GOAL-superglue-removal](GOAL-superglue-removal.md) — Stage 1 trug die upsert-Pattern-Idee bereits für `astro_json`; S-SOULPRINT-HOTFIX wendet sie auf den akut kaputten Soulprint-Save-Pfad an und geht S-SUPERGLUE-STAGE1 voraus.
- Requirements: [REQ-REL-soulprint-persist-onboarding](../requirements/REQ-REL-soulprint-persist-onboarding.md)
