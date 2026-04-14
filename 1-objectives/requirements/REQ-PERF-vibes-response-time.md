# REQ-PERF-vibes-response-time: Vibes Generation Response Time

**Type**: Performance

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-vibes-on-demand](../user-stories/US-vibes-on-demand.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The Vibes insight must be generated and displayed within 2 seconds of the user tapping "Vibe abrufen". This includes server-side computation (transit data + Signatur combination) and text generation (Gemini or deterministic template). Caching is permitted for the transit data component (already cached at 5-min intervals via space weather pipeline).

## Acceptance Criteria

- Given a user tapping "Vibe abrufen", when the system processes the request, then the complete 3-level Vibe output is displayed within 2 seconds (p95)
- Given the computation pipeline, when transit data is cached (within 5-min TTL), then the server response time is <500ms
- Given the computation pipeline, when Gemini is used for text generation, then the Gemini call completes within 1.5 seconds or a deterministic fallback text is used
- Given a cold start (no cached transit data), when the user requests a Vibe, then the system shows a loading skeleton and completes within 3 seconds
