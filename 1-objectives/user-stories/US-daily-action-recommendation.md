# US-daily-action-recommendation: Premium Action Recommendation

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a premium user, I want to receive an action recommendation (fusion.action) that fits my coherence value and active planetary influences, so that the app gives me a concrete, personalised suggestion for my day.

## Acceptance Criteria

- [ ] `fusion.action` field is present in the `/experience/daily` response for premium users
- [ ] The recommendation text references at least one active planet or driver from the Impact data
- [ ] Free-tier users see a truncated teaser of `fusion.action` with an upgrade CTA
- [ ] Text is in German
- [ ] Text is resource-oriented per CON-resource-oriented-framing

## Related Artifacts

- Requirements: [REQ-F-experience-daily-v2](../requirements/REQ-F-experience-daily-v2.md)
- Constraints: [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md), [CON-german-ui](../constraints/CON-german-ui.md)
