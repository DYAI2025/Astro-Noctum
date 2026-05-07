# GOAL-aphorism-personalized-interpretation: Aphorism-grounded daily framing with a personalized interpretation pathway

**Description**: Astro-Noctum delivers a deterministic, personalized daily framing built on a curated aphorism pool. The day's harmony index drives a mode classification (`pulse` / `trace` / `spannung`); within that mode, a deterministic per-user, per-date selection picks one aphorism from the human-approved pool. The aphorism becomes Slot 1 of the daily card; an LLM generates Slot 2 (bridge to today) and Slot 3 (action prompt). The user can then tap one of six "Council" archetypes (sun, moon, ascendant, day-master, year-animal, dominant Wu-Xing) and receive a per-figure LLM interpretation that's cached per (user, date, figure) tuple. The whole feature is gated behind the `tagespuls_neu_v1` flag for staged rollout and remains blocked at the production-pool layer by [CON-aphorisms-human-approved](../constraints/CON-aphorisms-human-approved.md) until at least 15 approved aphorisms exist with mode coverage.

**Status**: Approved

**Priority**: Should-have

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Success Criteria

- [ ] `aphorisms.json` contains ≥15 approved aphorisms covering all three modes (`pulse`, `trace`, `spannung`); gated by [CON-aphorisms-human-approved](../constraints/CON-aphorisms-human-approved.md).
- [ ] Edge function `GET /v1/users/:userId/daily-pulse` returns deterministic results: same `(userId, date, locale)` → same aphorism, same mode classification, same harmony index.
- [ ] User can select any of the six Council archetypes and receive a per-figure LLM interpretation; selecting the same archetype on the same day returns the cached `daily_interpretations` row without re-invoking the LLM.
- [ ] `useDailyPulse` hook handles `birthData === null` explicitly (returns `pulse: null, isFallback: false`) — no silent hook exits.
- [ ] `TagespulsCard` Phase 1 renders aphorism + Slot 2 + Slot 3 + Council picker; Phase 2 renders the chosen interpretation with a back-to-Phase-1 path.
- [ ] The whole feature is gated by feature flag `tagespuls_neu_v1`; flag-off behavior leaves the dashboard unchanged.
- [ ] LLM call failures fall back transparently per [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md) (visible label, not silent generic content).

## Related Artifacts

- User stories: _none yet_
- Requirements: [REQ-F-aphorism-approval-gate](../requirements/REQ-F-aphorism-approval-gate.md), [REQ-F-daily-pulse-determinism](../requirements/REQ-F-daily-pulse-determinism.md), [REQ-F-council-interpretation-cache](../requirements/REQ-F-council-interpretation-cache.md), [REQ-F-useDailyPulse-null-guard](../requirements/REQ-F-useDailyPulse-null-guard.md), [REQ-F-tagespuls-feature-flag](../requirements/REQ-F-tagespuls-feature-flag.md), [REQ-USA-tagespuls-card-phases](../requirements/REQ-USA-tagespuls-card-phases.md)
- Constraints: [CON-aphorisms-human-approved](../constraints/CON-aphorisms-human-approved.md), [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md), [CON-gdpr-applies](../constraints/CON-gdpr-applies.md), [CON-no-formula-changes](../constraints/CON-no-formula-changes.md)
