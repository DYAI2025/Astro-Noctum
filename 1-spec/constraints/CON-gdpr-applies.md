# CON-gdpr-applies: EU GDPR applies to all personal data processing

**Category**: Operational

**Status**: Active

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The EU General Data Protection Regulation (GDPR, Regulation (EU) 2016/679) applies to Astro-Noctum's processing of personal data. The lawful basis under Art. 6(1)(a) is **consent** unless an alternative basis (e.g., contract under 6(1)(b) for subscription billing) is documented per processing purpose. Data subject rights under Art. 15–22 (access, rectification, erasure / right to be forgotten, restriction, portability, objection) must be operationally supported. Purpose limitation (Art. 5(1)(b)) and data minimization (Art. 5(1)(c)) apply.

Personal data handled by Astro-Noctum includes (non-exhaustive):

- **Birth data**: date, time, and place of birth (used for BaZi pillars, Western chart, signature parameters). When combined with other identifiers, this can identify individuals; arguably approaches special-category data when used to derive health-adjacent inferences.
- **Subscription / billing**: email, payment metadata held by Stripe (Stripe is a sub-processor; their DPA applies).
- **Usage / analytics**: dashboard interaction events, retention metrics (D1/D7), upgrade-CTA clicks, council-figure selections — must avoid raw PII per dev brief TASK-3.2 acceptance criterion.
- **Daily-pulse / interpretation history**: per-user records in `daily_pulses`, `daily_interpretations`, `aphorism_usage_events`.

## Rationale

The product surface is German-language, indicating an EU user base, and the data classes above are unambiguously personal data under Art. 4(1). Failing GDPR is a legal risk (fines up to €20 M / 4% global turnover) and a reputational risk that compounds with the product's astrology positioning (users entrust intimate identity data). Recording GDPR as an explicit constraint up front prevents downstream surprise and ensures every data-handling task carries a baseline check.

## Impact

- Every new data-collection surface must declare its consent scope, retention period, and lawful basis before going live.
- RTBF (right-to-be-forgotten) flows must propagate to all Supabase tables holding per-user data (`user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `aphorism_usage_events`, future tables) plus Stripe-side records via Stripe's customer-deletion APIs.
- Data export (Art. 20) must be technically possible — minimum machine-readable JSON of all per-subject records.
- Analytics events for retention metrics must avoid raw PII per the dev brief; identifiers should be hashed / pseudonymized at the boundary.
- A privacy notice and consent-collection mechanism are pre-launch requirements (will downstream into a `REQ-COMP-consent-record` requirement).
- Use of LLMs (Gemini/FuFirE) for interpretation generation requires that birth data sent to the LLM is covered by user consent for that purpose; cross-purpose use violates Art. 5(1)(b).
- This constraint will likely generate multiple `REQ-COMP-*` requirements during requirement elicitation (consent record, RTBF, data export, purpose limitation, retention).
