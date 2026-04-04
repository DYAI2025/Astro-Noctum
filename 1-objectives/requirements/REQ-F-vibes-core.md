# REQ-F-vibes-core: On-Demand Vibes Insight Engine

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [US-vibes-on-demand](../user-stories/US-vibes-on-demand.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The system provides an on-demand "Vibe" insight derived from the user's personal Signatur (natal weights + quiz contributions) combined with current transit data, cosmic weather, and relevant contribution events. The Vibe has a short-horizon focus on the next few hours.

The computation is deterministic within a fixed 2-hour refresh window:

- identical user profile
- identical input state
- identical 2-hour window

must produce the same result.

The system refreshes every 2 hours so that newly available chart context, cosmic weather, and contribution events can produce an updated result for the next window. Significant geomagnetic / magnetic-storm conditions must be surfaced explicitly when they materially influence the Vibe.

The computation reuses existing Fusion / Signatur logic — no new astrological engine.

## Acceptance Criteria

- Given an authenticated user with a completed astro profile, when they tap "Vibe abrufen", then a personalized Vibe insight is generated within 2 seconds
- Given the Vibe computation runs, when it builds the result, then it combines the user's soulprint sectors, quiz contributions, current transit state, space weather, and relevant contribution events into a short-horizon interpretation
- Given identical user data and the same 2-hour refresh window, when the Vibe is computed twice, then the results are identical
- Given a user requests a Vibe again within the same 2-hour refresh window, when no new window has started, then the system returns the cached current-window result together with the next refresh timestamp
- Given a new 2-hour refresh window begins, when the Vibe is requested, then the system recomputes the result from the latest chart state, cosmic weather, and contribution-event inputs
- Given the Vibe result, when displayed, then it explicitly references the next few hours as the time horizon
- Given a significant geomagnetic event or magnetic storm is active, when the Vibe is rendered, then the driver list or explanation explicitly surfaces that event and its likely relevance
- Given the Vibe output text, when reviewed, then it uses resource-oriented language (tendencies, not predictions)
- Given a Vibe output, when the result text is reviewed, then every statement is logically derived from the user's Signatur, transit data, cosmic weather, or contribution events — no generic motivational filler
- Given a later 2-hour window contains materially changed transit, cosmic-weather, or contribution-event inputs, when the Vibe is recomputed, then at least one of the core output elements reflects those changed inputs

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — no numerical values without explanation
- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — possibility language only
- [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md) — <10s comprehension on mobile
