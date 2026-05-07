# REQ-COMP-llm-purpose-consent: LLM calls are covered by user consent for the specific purpose

**Type**: Compliance

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

Sending personal data to a third-party LLM provider (Gemini, OpenAI, FuFirE, or any future provider) for purposes such as daily-interpretation generation, slot-2/3 daily-pulse generation, or future agent capabilities requires user consent that explicitly covers that processing purpose. This is GDPR Art. 5(1)(b) (purpose limitation) and Art. 6(1)(a) (lawful basis) applied at the LLM-call boundary. Cross-purpose use — sending data consented for one purpose to a different processing flow — is rejected at the persistence boundary or the LLM-gateway layer.

Concrete examples of distinct purposes that need separate consent: (i) daily-interpretation generation from birth data + chosen archetype; (ii) future "agent chat" feature where the user converses with the LLM about their chart; (iii) any analytics or product-improvement use of LLM responses (anonymized aggregate use should still be consented).

## Acceptance Criteria

- Given a user has consented to "LLM-based daily interpretation" but not to "agent chat", when the agent-chat feature attempts an LLM call, then the call is rejected at the gateway with a clear error.
- Given an LLM call is about to be made, when the call site is reviewed, then it includes a check that the user's consent for that specific purpose is active and not revoked.
- Given the user revokes consent for a specific LLM-using purpose, when the next LLM call for that purpose is attempted, then it is rejected; existing cached results from before revocation may be displayed but not regenerated.
- Given a Data Processing Agreement is in place with the LLM provider, when audited, then it covers the relevant purposes and data classes; the DPA reference is documented.
- Given personal data is sent to the LLM, when logged for debugging, then the log is short-lived (≤ 7 days) and access-controlled; no long-term persistence of LLM prompts containing personal data.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
