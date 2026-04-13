# US-daily-cosmic-weather: Cosmic Weather at a Glance

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want to see today's cosmic weather (geomagnetic, solar, storm events) at a glance, so that I can place my personal coherence value in an outer context.

## Acceptance Criteria

- [ ] Kp index, solar pressure score, and active storm events are visible in the driver strip of KohaerenzHero
- [ ] Space weather data comes from the Impact response (`impact.space_weather`) rather than a separate hook call when Impact data is available
- [ ] If a geomagnetic storm event (G3+) is active, a visual indicator escalates the driver pill to "tense" colouring
- [ ] Fallback to `useSpaceWeather()` hook data when Impact response is unavailable
- [ ] Space weather pills use existing calm/active/tense colour coding from DEC-design-system-v2

## Related Artifacts

- Requirements: [REQ-F-coherence-hero-impact-datasource](../requirements/REQ-F-coherence-hero-impact-datasource.md), [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md)
