# REQ-F-signatur-data-pipeline: Signatur Data Pipeline and Bridge Layer

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

All data feeding the Signatur flows through a defined pipeline with typed bridges. The ring never receives raw API data directly. Five data sources are transformed into engine-consumable parameters: soulprint (BAFE), quiz contributions, transit state (FuFirE), space weather (NOAA/DONKI), and day harmonic state. The True North principle applies: quiz weight contribution is capped at 0.5, space weather modulation at 1.5x — modulation, not mutation.

## Acceptance Criteria

- Given a user's soulprint (12 zodiac sectors from BAFE), when processed by `soulprintToNatalWeights()`, then 7 planet weights are produced via zodiac affinity mapping (Sun→Leo, Moon→Cancer, etc.)
- Given quiz contribution events (12-sector weights from `contribution_events`), when processed by `quizSectorsToQuizWeights()`, then 6 quiz dimension weights are produced
- Given a user ID, when the transit state is polled (`GET /api/transit-state/:userId`), then the response includes `baseSignals[12]`, `targetSignals[12]`, `thirtyDayAvg`, and `transitIntensity`
- Given space weather data (NOAA/DONKI), when processed, then a ring modulation factor between 1.0 (calm) and 1.5 (extreme) is applied to Membrane layer intensity
- Given day harmonic data, when available, then day-mode modulation adjusts the ring's current-day visual accent
- Given any combination of data sources, when quiz weight contribution is calculated, then it does not exceed 0.5 (True North principle — modulation, not mutation)
- Given any data source is unavailable, when the ring renders, then it gracefully falls back to the last known state or neutral defaults without visual glitches
