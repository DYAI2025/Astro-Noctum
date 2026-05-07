# REQ-COMP-consent-record: Active consent record per user covers each processing purpose with timestamp + version

**Type**: Compliance

**Status**: Draft

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

For every user processing personal data through Astro-Noctum, an active consent record must exist per processing purpose, persisted in a queryable store with the consent text version, the timestamp of consent, and the user's affirmation. Processing purposes are at least: (a) astrological derivation from birth data (BaZi, Western chart, signature), (b) usage / retention analytics, (c) billing (covered by Stripe contractual basis under Art. 6(1)(b)), (d) LLM-based interpretation generation. Consent for each purpose is independently revocable; revocation halts that purpose's processing while preserving other consented purposes.

## Acceptance Criteria

- Given a user signs up or first interacts with the app, when consent is collected, then a record is persisted with `user_id`, `purpose`, `consent_text_version`, `granted_at`, `affirmation_method` (e.g., explicit checkbox tick).
- Given a user revokes consent for a specific purpose, when the revocation is recorded, then `revoked_at` is set and downstream processing for that purpose halts before the next event affecting that user.
- Given the consent text changes (new version), when a user is presented with the new version, then re-consent is required before continued processing under the updated terms; the old consent record is preserved as historical audit trail.
- Given a user requests their consent state (Art. 15 access), when the export is generated, then it includes all consent records (active and revoked) with full metadata.
- Consent records are append-only (no in-place updates that would lose history).
- The lawful basis for billing is contract (Art. 6(1)(b)), not consent — the record format accommodates this distinction (lawful_basis field).

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
