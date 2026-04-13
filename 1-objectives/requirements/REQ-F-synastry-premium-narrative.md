# REQ-F-synastry-premium-narrative: Hybrid Synastry Narrative (Template + Gemini)

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-synastry-premium-narrative](../user-stories/US-synastry-premium-narrative.md), [GOAL-synastry-compatibility](../goals/GOAL-synastry-compatibility.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

Synastry narrative generation follows a hybrid model: free users receive a template-based compatibility summary; premium users receive a Gemini-generated narrative. The premium gate is enforced server-side (not only in the UI). All narratives are in German and follow CON-resource-oriented-framing. The `userSunSign` and `partnerSunSign` inputs are validated against a zodiac whitelist before being interpolated into the Gemini prompt.

## Acceptance Criteria

- Given a free-tier user request for synastry narrative, when processed, then the response contains a template-based summary and a premium upgrade CTA — no Gemini call is made.
- Given a premium user request, when processed server-side, then `user.tier === 'premium'` is confirmed before triggering Gemini generation.
- Given a `userSunSign` or `partnerSunSign` value not in the standard 12 zodiac signs, when the Gemini prompt is assembled, then the value is replaced with null (zodiac whitelist guard).
- Given any narrative text, when inspected, then it is in German and uses possibility-oriented language (no fatalistic framing).

## Related Constraints

- [CON-german-ui](../constraints/CON-german-ui.md) — narrative text must be in German.
- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — narrative must be possibility-oriented.
