# US-daily-impulse-text: Data-Derived Daily Impulse Text

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want to read a short daily impulse text that is derived from actual calculated values, so that I receive a grounded insight rather than generic motivational copy.

## Acceptance Criteria

- [ ] `fusion.synthesis` explicitly names the active planets and their effects (e.g., "Mars und Jupiter sind heute aktiv — Mars Konjunktion, orb 2.4°")
- [ ] No adjective in `fusion.synthesis` is used without a corresponding value in `impact` or `evidence`
- [ ] `fusion.synthesis` is present in the `/experience/daily` response for all users (Free + Premium)
- [ ] Text is in German
- [ ] Text is resource-oriented (Empowerment, not fatalism) per CON-resource-oriented-framing

## Related Artifacts

- Requirements: [REQ-F-experience-daily-v2](../requirements/REQ-F-experience-daily-v2.md)
- Constraints: [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md), [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md), [CON-german-ui](../constraints/CON-german-ui.md)
