# REQ-F-vibes-core: On-Demand Vibes Insight Engine

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [US-vibes-on-demand](../user-stories/US-vibes-on-demand.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The system provides an on-demand "Vibe" insight derived from the user's personal Signatur (natal weights + quiz contributions) combined with current transit data (planetary positions, space weather). The Vibe has a 2–3 hour horizon and produces a deterministic output: identical user profile + identical timestamp = identical result. The computation reuses existing Fusion/Signatur logic — no new astrological engine.

## Acceptance Criteria

- Given an authenticated user with a completed astro profile, when they tap "Vibe abrufen", then a personalized Vibe insight is generated within 2 seconds
- Given the Vibe computation, when it runs, then it combines the user's soulprint sectors, quiz contributions, current transit state, and space weather into a short-horizon interpretation
- Given identical user data and the same timestamp, when the Vibe is computed twice, then the results are identical (determinism)
- Given the Vibe result, when displayed, then it contains exactly 3 levels: 1 Kurzsignal (1 sentence), 3–5 Einflussfaktoren (2–4 words each), 1 Erklärung (1–2 sentences)
- Given the Vibe result, when displayed, then it explicitly references "the next few hours" as the time horizon
- Given the Vibe output text, when reviewed, then it uses resource-oriented language (tendencies, not predictions)
- Given a free-tier user, when they request a Vibe within 4 hours of the last Vibe, then the system returns the cached result with a "next available" timestamp instead of generating a new Vibe
- Given a premium user, when they request a Vibe within 2 hours of the last Vibe, then the system returns the cached result with a "next available" timestamp instead of generating a new Vibe
- Given a Vibe output, when the Kurzsignal or Treiber text is reviewed, then every statement is logically derived from the user's soulprint sectors, transit data, or an official interpretation framework (Western, BaZi, Fusion, Wu-Xing) — no generic motivational filler
- Given two consecutive Vibe results for the same user, when the cooldown has elapsed and new transit data is available, then the outputs differ (no repetition of identical Kurzsignal or Treiber sets)

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — no numerical values without explanation
- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — possibility language only
- [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md) — <10s comprehension on mobile
