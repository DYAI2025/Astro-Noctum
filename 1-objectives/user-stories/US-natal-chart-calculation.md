# US-natal-chart-calculation: Full Natal Chart from Birth Data

**Status**: Draft

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want my birth data to produce a complete, fused natal chart covering Western astrology, BaZi Four Pillars, and Wu-Xing Five Elements, so that my full astrological profile is available in a single experience without consulting separate systems.

## Acceptance Criteria

- [ ] A single call to FuFirE `/experience/bootstrap` returns Western zodiac positions, BaZi Four Pillars (Day Master stem + pillars), and Wu-Xing element profile
- [ ] All three systems use the same birth date/time/location input — no re-entry
- [ ] AI-generated interpretations synthesize all three systems in German, resource-oriented language
- [ ] Data is persisted to Supabase so returning users do not recalculate on every load

## Related Artifacts

- Requirements: [REQ-F-natal-chart-calculation](../requirements/REQ-F-natal-chart-calculation.md), [REQ-F-signatur-data-pipeline](../requirements/REQ-F-signatur-data-pipeline.md)
