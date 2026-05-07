# REQ-F-council-interpretation-cache: daily-interpretation results are cached per (user, date, daily_pulse_id, archetype)

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The `POST /v1/users/:userId/daily-interpretation` edge function generates a per-archetype LLM interpretation for a given daily pulse. Subsequent invocations with the same `(daily_pulse_id, selected_archetype_key)` must return the cached row from `daily_interpretations` rather than re-invoking the LLM. This protects user experience (consistent reading), conserves LLM quota, respects [CON-greenops-polling-budget](../constraints/CON-greenops-polling-budget.md) implicitly, and is consistent with the [CON-no-formula-changes](../constraints/CON-no-formula-changes.md) principle that astrological output should be stable.

The valid archetype keys are: `sonne`, `mond`, `aszendent`, `day_master`, `jahrestier`, `wuxing_dom`. Other values must be rejected.

## Acceptance Criteria

- Given a `(daily_pulse_id, selected_archetype_key)` pair has no existing `daily_interpretations` row, when the endpoint is called, then the LLM is invoked, the result is upserted into `daily_interpretations`, and the response body contains the generated text.
- Given a `daily_interpretations` row already exists for the `(daily_pulse_id, selected_archetype_key)` pair, when the endpoint is called, then the LLM is **not** invoked, the cached row is returned, and a flag (`cached: true`) is set in the response (or equivalent).
- Given `selected_archetype_key` is not in the allowed set, when the endpoint is called, then a 400 with a structured error is returned and no LLM call is made.
- Given the LLM call fails, when the endpoint runs, then the failure surfaces as a degraded response (per [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md)) — no silent retry-storm.
- Integration tests cover the cache-hit path and prove the LLM is not re-invoked on the second call.

## Related Constraints

- [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md), [CON-greenops-polling-budget](../constraints/CON-greenops-polling-budget.md)
