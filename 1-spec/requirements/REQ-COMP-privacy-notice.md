# REQ-COMP-privacy-notice: Public privacy notice describes processing purposes, retention, sub-processors, and rights

**Type**: Compliance

**Status**: Draft

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

Astro-Noctum must publish and maintain a public-facing privacy notice (Datenschutzerklärung) reachable from every page of the web app, satisfying GDPR Art. 12–14 transparency obligations. The notice must describe, in clear and accessible language:

- **Identity and contact** of the data controller (Bazodiac / Ben as named natural-or-legal person responsible).
- **Processing purposes** with their corresponding lawful bases (Art. 6) — at minimum: astrological derivation (consent), analytics (consent), billing (contract), LLM-based interpretation (consent).
- **Data categories** processed per purpose — birth data, usage events, billing data, etc.
- **Retention periods** per data class.
- **Sub-processors** (Stripe for billing, Supabase for hosting, the LLM provider for interpretation generation) with the user's option to learn more about each.
- **Data subject rights** under Art. 15–22 (access, rectification, erasure, restriction, portability, objection) and **how to exercise them** (concrete contact endpoint or in-app flow).
- **Right to lodge a complaint** with the supervisory authority (German federal/state DPA, since the user base is primarily German-speaking).
- **Last updated** timestamp; older versions retained as historical record.

This requirement is content-and-legal, not code-testable in CI. Verification is by review and by lawyer sign-off (when appropriate to the maturity of the business).

## Acceptance Criteria

- Given the privacy notice is published, when reviewed, then it covers all bullet points above with concrete content (no placeholder text).
- Given the privacy notice is reachable, when navigating from any page, then a link in the footer (or equivalent persistent surface) leads to it within one click.
- Given the notice is updated, when republished, then a `last_updated` field reflects the new date; the previous version is retained as historical record (ideally accessible via a versioned archive).
- Given a non-technical reader (target: a typical EU end-user) reads the notice, when comprehending it, then they can identify what data is collected, why, how long it's kept, and how to exercise their rights — without needing legal training to parse it.
- A legal review (internal or external counsel, scaled to maturity of business) validates the content before each major version is published.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
