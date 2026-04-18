# GOAL-superglue-removal: Superglue aus Core-UX entfernen

**Description**: Die 6 user-sichtbaren Core-Flows (Onboarding, Daily-Transit, Kohärenz-Index, ElevenLabs-Context, Conversation-Save, Cosmic-Weather-Cache) werden schrittweise aus Superglue herausgelöst und als native Server-Endpoints im eigenen Backend implementiert. Ziel ist die Beseitigung von Superglue als Third-Party-Dependency für Core-UX — strukturelle Reduktion von Attack-Surface, Build-Fragilität und Latenz-Varianz, sowie Schaffung eines kontrollierten Fundaments für spätere Sprints. Superglue darf optional für nicht-UX-kritische Legacy-Flows (Deep-Reading-PDF #7, Demos #8/#9) bestehen bleiben, bis separat migriert. **Historischer Kontext (2026-04-18):** Motivation war ursprünglich auch Hypothese "Superglue-Webhook-Ausfälle verursachen Default-Fallback-Signaturen". Diese Hypothese wurde durch Plan-§2-Query widerlegt (50/50 astro_profiles mit vollständigem astro_json). Das Goal behält strukturellen Wert, adressiert aber nicht das Default-Signatur-Symptom — dessen Root-Cause bleibt zu klären.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Success Criteria

- [ ] Onboarding (`/api/experience/bootstrap`) persistiert `astro_profiles.astro_json` vollständig (bazi, western, wuxing, fusion Subfields) bei jedem erfolgreichen Durchlauf — keine intermittierend leeren Subfields mehr.
- [ ] Zwei frisch angelegte Test-User mit unterschiedlichen Geburtsdaten sehen sichtbar unterschiedliche, nicht-defaulte Signaturen (2D Cymatics + 3D Sphere).
- [ ] `SUPERGLUE_BASE_URL` und `SUPERGLUE_API_KEY` sind aus allen Core-UX-Endpoints und aus `.env.example` entfernt; Grep auf `superglue` im `src/`-Tree ist leer.
- [ ] Alle 6 migrierten Endpoints rufen BAFE/FuFirE oder Supabase direkt auf, mit dokumentierter Retry-Policy (≥ 3 Attempts) und Timeout (≤ 7s/Attempt).
- [ ] Jede Migration-Stage ist per `git revert <sha>` rückrollbar ohne Env-Var-Recovery-Prozedur (Annahme: Superglue-Keys bleiben während Rollout-Periode gültig und nicht entfernt).

## Related Artifacts

- Plan-Dokumente:
  - `docs/superglue-removal-stage-1-onboarding.md` (Stage 1 — Onboarding)
  - Stages 2–5 folgen in eigenen Plan-Dateien
- User stories: _none yet_
- Requirements: _none yet_
