# REQ-REL-soulprint-persist-onboarding: Bootstrap persistiert soulprint_sectors via upsert

**Type**: Reliability

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-soulprint-persistence](../goals/GOAL-soulprint-persistence.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Description

`/api/experience/bootstrap` muss `astro_profiles.soulprint_sectors` für jeden onboardenden User zuverlässig persistieren — unabhängig davon, ob die `astro_profiles`-Zeile zum Save-Zeitpunkt bereits existiert (z.B. durch Superglue-Worker-Write davor) oder noch nicht. Implementation: `.upsert()` mit `onConflict: 'user_id'` statt `.update().eq('user_id')` in `server.mjs`. Der Save darf andere Spalten der Zeile (`astro_json`, `birth_*`, `sun_sign`, etc.) nicht überschreiben, wenn sie bereits gesetzt sind. Bestehende 50 User mit `soulprint_sectors = NULL` werden per einmaligem Backfill-Script repariert.

## Acceptance Criteria

- Given ein User hat `/api/experience/bootstrap` durchlaufen, when die Response zurückkommt, then ist `astro_profiles.soulprint_sectors` in Supabase ein 12-Element jsonb Array und `soulprint_saved: true` im Response-Payload.
- Given die `astro_profiles`-Zeile existiert noch nicht zum Zeitpunkt des Soulprint-Saves (z.B. Superglue-Worker noch nicht fertig), when Bootstrap läuft, then erstellt `.upsert()` die Zeile mit `user_id` und `soulprint_sectors`, ohne andere Spalten auf NULL zu setzen.
- Given die `astro_profiles`-Zeile existiert bereits (z.B. Superglue-Write war schneller), when Bootstrap läuft, then aktualisiert `.upsert()` ausschließlich `soulprint_sectors` und `updated_at`; `astro_json`, `birth_*` und andere Felder bleiben unverändert.
- Given 50 existierende User in prod mit `soulprint_sectors = NULL`, when das Backfill-Script gegen prod ausgeführt wird, then erhalten alle 50 ein gültiges 12-Element-Array und die Query `SELECT COUNT(*) FROM astro_profiles WHERE soulprint_sectors IS NULL` ergibt 0.
- Given Post-Deploy-Monitoring, when die Log-Zeile `[bootstrap] soulprint save affected 0 rows` auftritt, then 0 Treffer über 24h (statt heute 100% der Bootstrap-Requests).

## Related Assumptions

- Der Superglue-Worker's nachgelagerter Schreibvorgang ins `astro_profiles` (mit `astro_json`) überschreibt das von Bootstrap gesetzte `soulprint_sectors` **nicht**. Verifikation: TASK-sphx-verify-no-overwrite analysiert den Worker-Payload. Falls Worker `soulprint_sectors` explizit auf `null` setzt, braucht es zusätzliche Guardrails.
