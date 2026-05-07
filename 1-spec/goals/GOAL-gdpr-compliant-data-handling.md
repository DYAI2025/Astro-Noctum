# GOAL-gdpr-compliant-data-handling: EU users can exercise data-subject rights and consent control

**Description**: Astro-Noctum provides EU users with operational support for their GDPR data-subject rights (Art. 15–22): access, rectification, erasure / right-to-be-forgotten, portability, restriction, objection. Each personal-data processing purpose has a documented lawful basis (typically consent under Art. 6(1)(a), or contract under 6(1)(b) for billing). Retention is explicit per data class. Sub-processors (Stripe for billing, LLM providers for interpretation generation, Supabase for hosting) are covered by appropriate Data Processing Agreements. Analytics and observability events do not contain raw PII. This goal is the legal floor for serving EU users — it doesn't add user-visible features, but its absence creates legal and reputational exposure that compounds quickly with the product's intimate-data positioning.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Success Criteria

- [ ] An active consent record exists per user covering each processing purpose (birth-data-for-astrological-derivation, analytics, billing, LLM-interpretation), with timestamp and consent-text version.
- [ ] User can request a machine-readable JSON export of all their personal data (Art. 20 portability) — minimum contents: birth profile, daily-pulse history, daily-interpretations, aphorism-usage events, subscription metadata.
- [ ] Right-to-be-forgotten flow purges all per-user records across Supabase tables (`user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `aphorism_usage_events`, future tables) and triggers Stripe customer deletion within a documented target window (e.g., 24h or 30d).
- [ ] Analytics events for retention metrics (`D1_return_rate`, `D7_return_rate`, `dashboard_first_interaction`, etc.) do **not** contain raw PII; identifiers are hashed or pseudonymized at the boundary (per dev brief TASK-3.2 acceptance criterion).
- [ ] LLM calls (`daily-interpretation` edge function) are covered by user consent for that specific purpose; cross-purpose use is rejected at the persistence boundary.
- [ ] A public-facing privacy notice describes processing purposes, retention per data class, sub-processors (Stripe, Supabase, LLM providers), and how users exercise their rights.

## Related Artifacts

- User stories: _none yet_
- Requirements: [REQ-COMP-consent-record](../requirements/REQ-COMP-consent-record.md), [REQ-COMP-data-export](../requirements/REQ-COMP-data-export.md), [REQ-COMP-rtbf](../requirements/REQ-COMP-rtbf.md), [REQ-COMP-analytics-pii-free](../requirements/REQ-COMP-analytics-pii-free.md), [REQ-COMP-llm-purpose-consent](../requirements/REQ-COMP-llm-purpose-consent.md), [REQ-COMP-privacy-notice](../requirements/REQ-COMP-privacy-notice.md)
- Constraints: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
