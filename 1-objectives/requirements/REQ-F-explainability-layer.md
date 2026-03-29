# REQ-F-explainability-layer: "Warum sehe ich das?" Explainability Layer

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [US-vibes-explainability](../user-stories/US-vibes-explainability.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Every insight (Vibes, Weekly Insights, future features) provides an opt-in explanation layer accessible via "Warum sehe ich das?" or equivalent button. The explanation references the user's personal Signatur and the current astrological constellation in simplified, non-technical language.

## Acceptance Criteria

- Given any Vibes result, when the user taps "Warum sehe ich das?", then an explanation panel appears
- Given any Weekly Insight area, when the user taps for details, then an explanation is available
- Given the explanation text, when displayed, then it references: (1) the user's personal Signatur (e.g., "deine aktuelle Signatur") and (2) the current constellation (e.g., "aktuelle Zeitphase")
- Given the explanation, when read, then it is understandable without astrological knowledge (no jargon, no chart positions)
- Given the explanation, when reviewed, then it contains no black-box statements — every claim has a referenced basis

## Related Constraints

- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — explanations use possibility language
