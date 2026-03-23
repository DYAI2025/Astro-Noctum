# REQ-F-natal-chart-calculation: Natal Chart Calculation via BAFE

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The system calculates a complete natal profile from birth data (date, time, location) using the BAFE (BaZi Astrology Fusion Engine). The calculation produces four outputs: BaZi Four Pillars, Western Radix (Swiss Ephemeris), Wu-Xing elemental balance, and a merged Fusion signature. Results are deterministic — identical inputs always produce identical outputs with pinned Swiss Ephemeris and tzdata versions (no Moshier fallback).

## Acceptance Criteria

- Given valid birth data (date, time, latitude/longitude), when the BAFE calculation is triggered, then the system returns BaZi Four Pillars (Year, Month, Day, Hour stems and branches)
- Given valid birth data, when the BAFE calculation is triggered, then the system returns a Western Radix chart (planetary positions, house cusps, aspects)
- Given valid birth data, when the BAFE calculation is triggered, then the system returns a Wu-Xing elemental balance (Wood, Fire, Earth, Metal, Water scores)
- Given valid birth data, when the BAFE calculation is triggered, then the system returns a merged Fusion signature combining all three systems
- Given identical birth data run on different servers at the same timestamp, when results are compared, then they are byte-identical (determinism guarantee)
- Given birth data with an invalid or missing time component, when the calculation is attempted, then the system returns a validation error with a clear message
