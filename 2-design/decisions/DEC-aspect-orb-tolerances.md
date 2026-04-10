# DEC-aspect-orb-tolerances: Staggered Orb Tolerances by Aspect Type

**Status**: Active

**Category**: Architecture

**Scope**: backend, frontend

**Source**: n/a

**Last updated**: 2026-04-10

## Context

Orb tolerance determines when a planetary aspect is considered active. A single flat orb would over-include weak aspects for tight aspects like sextiles and under-include strong aspects for conjunctions. Staggered tolerances reflect astrological tradition.

## Decision

Use the following orb tolerances for all aspect calculations in V1:

| Aspect | Orb |
|--------|-----|
| Conjunction (0°) | ±8° |
| Opposition (180°) | ±8° |
| Trine (120°) | ±6° |
| Square (90°) | ±6° |
| Sextile (60°) | ±4° |

Minor aspects (Quincunx etc.) are deferred to a later Premium release.

## Enforcement

### Trigger conditions

- **Code phase**: when passing orb parameters to FuFirE for natal, transit, or synastry calculations
- **Code phase**: when filtering or rendering active aspects in UI

### Required patterns

- Pass the above orb values explicitly; do not rely on FuFirE defaults
- When displaying active aspects, only include aspects within the defined orb

### Prohibited patterns

- Flat orb for all aspects (e.g., ±8° for sextiles)
- Exposing orb tolerances as a user-configurable setting in V1
- Including minor aspects (Quincunx, Semisextile, Sesquisquare) in V1 free or premium calculations
