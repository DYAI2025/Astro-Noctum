# REQ-F-experience-daily-v2: POST /experience/daily v2 with Impact Include

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [US-daily-single-api-call](../user-stories/US-daily-single-api-call.md), [US-daily-impulse-text](../user-stories/US-daily-impulse-text.md), [US-daily-action-recommendation](../user-stories/US-daily-action-recommendation.md), [US-daily-resonance-badges](../user-stories/US-daily-resonance-badges.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Description

`POST /experience/daily` accepts an optional `include` array in the request body. When `include: ["impact"]` is provided, the response includes the full `ACTIVE_IMPACTS_v1` block alongside the existing narrative fields. Without `include`, the response is identical to the v1 response (backwards-compatible). The response additionally contains `fusion.synthesis` for all users and `fusion.action` for premium users only. Text is in German and follows CON-resource-oriented-framing.

## Acceptance Criteria

- Given a POST to `/experience/daily` with `{ include: ["impact"], soulprint_sectors, natal_chart }`, when processed, then the response includes both `fusion` (narrative) and `impact` (structured) blocks.
- Given a POST to `/experience/daily` without `include`, when processed, then the response schema is identical to the previous v1 response (no breaking change).
- Given `fusion.synthesis` in the response, when inspected, then it names at least one active planet and its aspect type (e.g., "Mars Konjunktion, orb 2.4°").
- Given `fusion.synthesis`, when no adjective is used without a corresponding value in `impact` or `evidence`, then the acceptance criterion passes; if an unsupported adjective is present, then it fails.
- Given a premium user request, when the response is inspected, then `fusion.action` is present and references at least one active planet or driver from the Impact data.
- Given a free-tier user request, when the response is inspected, then `fusion.action` is either absent or contains a truncated teaser with upgrade CTA.
- Given `resonance_badges[]` in the response, when the user is premium, then badges are present; when the user is free-tier, then badges are absent or locked.
- Given any response text field, when inspected for language, then all text is in German.

## Related Constraints

- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — all LLM-generated text must be possibility-oriented.
- [CON-german-ui](../constraints/CON-german-ui.md) — text fields in response must be in German.
- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — any numerical value in synthesis text must reference a corresponding impact field.
